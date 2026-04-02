"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ShopMypageOrderAmountSummary,
  ShopMypageOrderDetailItem,
  ShopMypageOrderItemReasonMap,
  ShopMypageOrderReturnPageResponse,
  ShopMypageOrderReturnSubmitRequest,
  ShopMypageOrderReturnSubmitResponse,
} from "@/domains/mypage/types";
import {
  createInitialShopMypageOrderItemReasonMap,
  resolveShopMypageOrderItemReasonState,
} from "@/domains/mypage/utils/shopMypageOrderClaimReason";
import ShopOrderAddressSelectLayer from "@/domains/order/components/ShopOrderAddressSelectLayer";
import type { ShopOrderAddress } from "@/domains/order/types";
import { formatShopMypageOrderPrice } from "@/domains/mypage/utils/shopMypageOrder";
import {
  buildShopMypageOrderReturnPreviewResult,
  clampShopMypageOrderReturnQty,
  createInitialShopMypageOrderReturnSelectionMap,
  hasShopMypageOrderBlockedClaim,
  isShopMypageOrderReturnable,
  resolveShopMypageOrderReturnSelectionItem,
  resolveShopMypageOrderReturnTarget,
  type ShopMypageOrderReturnPreviewSummary,
  type ShopMypageOrderReturnSelectionMap,
} from "@/domains/mypage/utils/shopMypageOrderReturn";
import { requestShopClientApi } from "@/shared/client/shopClientApi";
import type { ShopMypageOrderAmountTableColumn } from "./ShopMypageOrderAmountTable";
import ShopMypageOrderAmountTable from "./ShopMypageOrderAmountTable";
import ShopMypageOrderReturnItemList from "./ShopMypageOrderReturnItemList";
import styles from "./ShopMypageOrderSection.module.css";

interface ShopMypageOrderReturnSectionProps {
  orderReturnPageData: ShopMypageOrderReturnPageResponse;
  initialOrdDtlNo?: number;
}

const ORDER_CHANGE_ADDRESS_NAME_MAX_LENGTH = 20;
const ORDER_CHANGE_ADDRESS_POST_NO_MAX_LENGTH = 10;
const ORDER_CHANGE_ADDRESS_BASE_MAX_LENGTH = 100;
const ORDER_CHANGE_ADDRESS_DETAIL_MAX_LENGTH = 100;

// 현재 선택 상태를 주문반품 제출용 주문상품 목록으로 변환합니다.
function buildShopMypageOrderReturnSubmitItemList(
  detailList: ShopMypageOrderDetailItem[],
  selectionMap: ShopMypageOrderReturnSelectionMap,
  itemReasonMap: ShopMypageOrderItemReasonMap,
): ShopMypageOrderReturnSubmitRequest["returnItemList"] {
  return detailList.flatMap((detailItem) => {
    const selectionItem = resolveShopMypageOrderReturnSelectionItem(selectionMap, detailItem);
    if (!selectionItem.selected || selectionItem.cancelQty < 1) {
      return [];
    }
    const reasonState = resolveShopMypageOrderItemReasonState(itemReasonMap, detailItem.ordDtlNo);
    return [
      {
        ordDtlNo: detailItem.ordDtlNo,
        returnQty: selectionItem.cancelQty,
        reasonCd: reasonState.reasonCd.trim(),
        reasonDetail: reasonState.reasonDetail.trim(),
      },
    ];
  });
}

// 반품 회수지 입력값을 제출용 회수지 형식으로 변환합니다.
function buildShopMypageOrderReturnSubmitPickupAddress(
  pickupAddress: ShopOrderAddress,
): ShopMypageOrderReturnSubmitRequest["pickupAddress"] {
  return {
    rsvNm: pickupAddress.rsvNm.trim(),
    postNo: pickupAddress.postNo.trim(),
    baseAddress: pickupAddress.baseAddress.trim(),
    detailAddress: pickupAddress.detailAddress.trim(),
  };
}

// 반품 회수지 입력값의 클라이언트 유효성을 확인합니다.
function resolveShopMypageOrderReturnPickupAddressValidationMessage(pickupAddress: ShopOrderAddress | null): string {
  if (!pickupAddress) {
    return "회수지를 선택해주세요.";
  }

  const submitPickupAddress = buildShopMypageOrderReturnSubmitPickupAddress(pickupAddress);
  if (
    submitPickupAddress.rsvNm === "" ||
    submitPickupAddress.postNo === "" ||
    submitPickupAddress.baseAddress === "" ||
    submitPickupAddress.detailAddress === ""
  ) {
    return "회수지 정보를 확인해주세요.";
  }
  if (submitPickupAddress.rsvNm.length > ORDER_CHANGE_ADDRESS_NAME_MAX_LENGTH) {
    return "회수지 정보를 확인해주세요.";
  }
  if (submitPickupAddress.postNo.length > ORDER_CHANGE_ADDRESS_POST_NO_MAX_LENGTH) {
    return "회수지 정보를 확인해주세요.";
  }
  if (submitPickupAddress.baseAddress.length > ORDER_CHANGE_ADDRESS_BASE_MAX_LENGTH) {
    return "회수지 정보를 확인해주세요.";
  }
  if (submitPickupAddress.detailAddress.length > ORDER_CHANGE_ADDRESS_DETAIL_MAX_LENGTH) {
    return "회수지 정보를 확인해주세요.";
  }
  return "";
}

// 일반 금액 문자열을 `-#,###원` 또는 `#,###원` 형식으로 변환합니다.
function formatShopMypageOrderAmountText(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.floor(value) : 0;
  if (safeValue < 0) {
    return `-${formatShopMypageOrderPrice(Math.abs(safeValue))}원`;
  }
  return `${formatShopMypageOrderPrice(safeValue)}원`;
}

// 부호 포함 금액 문자열을 `+#,###원` 또는 `-#,###원` 형식으로 변환합니다.
function formatShopMypageOrderSignedAmountText(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.floor(value) : 0;
  if (safeValue > 0) {
    return `+${formatShopMypageOrderPrice(safeValue)}원`;
  }
  if (safeValue < 0) {
    return `-${formatShopMypageOrderPrice(Math.abs(safeValue))}원`;
  }
  return "0원";
}

// 현재 남은 주문 금액 표 컬럼 목록을 생성합니다.
function createRemainingAmountColumnList(amountSummary: ShopMypageOrderAmountSummary): ShopMypageOrderAmountTableColumn[] {
  const benefitDiscountAmt =
    amountSummary.totalGoodsCouponDiscountAmt + amountSummary.totalCartCouponDiscountAmt + amountSummary.totalPointUseAmt;
  const deliveryCouponNote =
    amountSummary.deliveryCouponDiscountAmt > 0
      ? `(배송비쿠폰 ${formatShopMypageOrderPrice(amountSummary.deliveryCouponDiscountAmt)}원 사용)`
      : undefined;

  return [
    {
      key: "goodsPrice",
      title: "상품가격",
      itemList: [
        { key: "totalSupplyAmt", label: "상품가격", valueText: formatShopMypageOrderAmountText(amountSummary.totalSupplyAmt) },
        {
          key: "totalGoodsDiscountAmt",
          label: "상품할인",
          valueText: formatShopMypageOrderAmountText(amountSummary.totalGoodsDiscountAmt),
        },
      ],
    },
    {
      key: "discountBenefit",
      title: "상품 할인혜택",
      itemList: [
        {
          key: "totalGoodsCouponDiscountAmt",
          label: "상품쿠폰",
          valueText: formatShopMypageOrderAmountText(amountSummary.totalGoodsCouponDiscountAmt),
        },
        {
          key: "totalCartCouponDiscountAmt",
          label: "장바구니쿠폰",
          valueText: formatShopMypageOrderAmountText(amountSummary.totalCartCouponDiscountAmt),
        },
        {
          key: "totalPointUseAmt",
          label: "포인트",
          valueText: formatShopMypageOrderAmountText(amountSummary.totalPointUseAmt),
        },
      ],
    },
    {
      key: "finalAmount",
      title: "최종금액",
      itemList: [
        { key: "totalOrderAmt", label: "상품 판매가", valueText: formatShopMypageOrderAmountText(amountSummary.totalOrderAmt) },
        { key: "benefitDiscountAmt", label: "할인 총액", valueText: formatShopMypageOrderAmountText(benefitDiscountAmt) },
        {
          key: "deliveryFeeAmt",
          label: "배송비",
          valueText: formatShopMypageOrderAmountText(amountSummary.deliveryFeeAmt),
          note: deliveryCouponNote,
        },
        {
          key: "finalPayAmt",
          label: "결제금액",
          valueText: formatShopMypageOrderAmountText(amountSummary.finalPayAmt),
          isStrong: true,
        },
      ],
    },
  ];
}

// 반품 미리보기 표 컬럼 목록을 생성합니다.
function createReturnPreviewAmountColumnList(
  returnPreviewSummary: ShopMypageOrderReturnPreviewSummary,
): ShopMypageOrderAmountTableColumn[] {
  return [
    {
      key: "goodsPrice",
      title: "상품가격",
      itemList: [
        {
          key: "totalSupplyAmt",
          label: "상품가격",
          valueText: formatShopMypageOrderAmountText(returnPreviewSummary.totalSupplyAmt),
        },
        {
          key: "totalGoodsDiscountAmt",
          label: "상품할인",
          valueText: formatShopMypageOrderAmountText(returnPreviewSummary.totalGoodsDiscountAmt),
        },
      ],
    },
    {
      key: "returnBenefit",
      title: "반품 혜택",
      itemList: [
        {
          key: "totalGoodsCouponDiscountAmt",
          label: "상품쿠폰",
          valueText: formatShopMypageOrderAmountText(returnPreviewSummary.totalGoodsCouponDiscountAmt),
        },
        {
          key: "totalCartCouponDiscountAmt",
          label: "장바구니쿠폰",
          valueText: formatShopMypageOrderAmountText(returnPreviewSummary.totalCartCouponDiscountAmt),
        },
        {
          key: "deliveryCouponRefundAmt",
          label: "배송비쿠폰환급",
          valueText: formatShopMypageOrderAmountText(returnPreviewSummary.deliveryCouponRefundAmt),
        },
        {
          key: "totalPointRefundAmt",
          label: "포인트환급",
          valueText: formatShopMypageOrderAmountText(returnPreviewSummary.totalPointRefundAmt),
        },
      ],
    },
    {
      key: "expectedRefund",
      title: "반품 예정금액",
      itemList: [
        {
          key: "paidGoodsAmt",
          label: "실결제 상품가",
          valueText: formatShopMypageOrderAmountText(returnPreviewSummary.paidGoodsAmt),
        },
        {
          key: "benefitAmt",
          label: "환급 혜택 합계",
          valueText: formatShopMypageOrderAmountText(returnPreviewSummary.benefitAmt),
        },
        {
          key: "shippingAdjustmentAmt",
          label: "배송비",
          valueText: formatShopMypageOrderSignedAmountText(returnPreviewSummary.shippingAdjustmentAmt),
        },
        {
          key: "expectedRefundAmt",
          label: "반품 예정 금액",
          valueText: formatShopMypageOrderAmountText(returnPreviewSummary.expectedRefundAmt),
          isStrong: true,
        },
      ],
    },
  ];
}

// 회수지 기본주소 라인을 포맷 문자열로 변환합니다.
function formatPickupAddressLine(address: ShopOrderAddress): string {
  return `(${address.postNo}) ${address.baseAddress}`;
}

// 회수지 연락처 라인을 상태에 맞게 생성합니다.
function formatPickupContactLine(receiverName: string, phoneNumber: string): string {
  const trimmedReceiverName = receiverName.trim();
  const trimmedPhoneNumber = phoneNumber.trim();
  if (trimmedReceiverName !== "" && trimmedPhoneNumber !== "") {
    return `${trimmedReceiverName} | ${trimmedPhoneNumber}`;
  }
  if (trimmedReceiverName !== "") {
    return trimmedReceiverName;
  }
  if (trimmedPhoneNumber !== "") {
    return trimmedPhoneNumber;
  }
  return "연락처 정보 없음";
}

// 반품 신청 화면을 렌더링합니다.
export default function ShopMypageOrderReturnSection({
  orderReturnPageData,
  initialOrdDtlNo,
}: ShopMypageOrderReturnSectionProps) {
  const router = useRouter();
  const { order, amountSummary, reasonList, siteInfo } = orderReturnPageData;
  const returnTarget = resolveShopMypageOrderReturnTarget(order, initialOrdDtlNo);
  const addressList = orderReturnPageData.addressList;
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<ShopOrderAddress | null>(orderReturnPageData.pickupAddress);
  const [showAddressSelectLayer, setShowAddressSelectLayer] = useState<boolean>(false);
  const [selectionMap, setSelectionMap] = useState<ShopMypageOrderReturnSelectionMap>(() =>
    createInitialShopMypageOrderReturnSelectionMap(order, returnTarget.initialOrdDtlNo),
  );
  const [itemReasonMap, setItemReasonMap] = useState<ShopMypageOrderItemReasonMap>(() =>
    createInitialShopMypageOrderItemReasonMap(order),
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 반품 환불 예정 금액과 화면 표시용 컬럼을 계산합니다.
  const returnPreviewResult = useMemo(
    () =>
      buildShopMypageOrderReturnPreviewResult(
        order,
        amountSummary,
        siteInfo,
        orderReturnPageData.returnFeeContext,
        selectionMap,
        itemReasonMap,
        reasonList,
      ),
    [amountSummary, itemReasonMap, order, orderReturnPageData.returnFeeContext, reasonList, selectionMap, siteInfo],
  );
  const remainingAmountColumnList = useMemo(() => createRemainingAmountColumnList(amountSummary), [amountSummary]);
  const returnPreviewAmountColumnList = useMemo(
    () => createReturnPreviewAmountColumnList(returnPreviewResult.returnPreviewSummary),
    [returnPreviewResult.returnPreviewSummary],
  );
  const visibleReturnOrder = useMemo(() => {
    if (!order) {
      return null;
    }

    // 진행 중 반품/교환 클레임 상품은 반품신청 화면 상단 목록에서 제외합니다.
    return {
      ...order,
      detailList: order.detailList.filter((detailItem) => !hasShopMypageOrderBlockedClaim(detailItem)),
    };
  }, [order]);
  const returnableDetailList = useMemo(
    () => (order?.detailList ?? []).filter((detailItem) => isShopMypageOrderReturnable(detailItem)),
    [order?.detailList],
  );
  const returnItemList = useMemo(
    () => buildShopMypageOrderReturnSubmitItemList(order?.detailList ?? [], selectionMap, itemReasonMap),
    [itemReasonMap, order?.detailList, selectionMap],
  );
  const allSelected = useMemo(
    () =>
      returnableDetailList.length > 0 &&
      returnableDetailList.every(
        (detailItem) => resolveShopMypageOrderReturnSelectionItem(selectionMap, detailItem).selected,
      ),
    [returnableDetailList, selectionMap],
  );
  const pickupAddressValidationMessage = useMemo(
    () => resolveShopMypageOrderReturnPickupAddressValidationMessage(selectedPickupAddress),
    [selectedPickupAddress],
  );
  const infoMessage = returnPreviewResult.submitBlockMessage;
  const submitMessage = pickupAddressValidationMessage !== "" ? pickupAddressValidationMessage : infoMessage;
  const submitDisabled = isSubmitting || pickupAddressValidationMessage !== "" || !returnPreviewResult.canSubmit;

  // 주문 정보가 없으면 빈 화면을 반환합니다.
  if (!order) {
    return null;
  }

  // 회수지 선택 레이어를 엽니다.
  const handleOpenAddressSelectLayer = (): void => {
    setShowAddressSelectLayer(true);
  };

  // 회수지 선택 레이어를 닫습니다.
  const handleCloseAddressSelectLayer = (): void => {
    setShowAddressSelectLayer(false);
  };

  // 선택한 회수지를 현재 화면 상태에 반영합니다.
  const handleSelectPickupAddress = (address: ShopOrderAddress): void => {
    setSelectedPickupAddress(address);
    setShowAddressSelectLayer(false);
  };

  // 전체선택 체크박스 변경 시 반품 가능 상품만 일괄 선택/해제합니다.
  const handleToggleAll = (checked: boolean): void => {
    setSelectionMap((previousSelectionMap) => {
      const nextSelectionMap: ShopMypageOrderReturnSelectionMap = { ...previousSelectionMap };
      for (const detailItem of order.detailList) {
        if (!isShopMypageOrderReturnable(detailItem)) {
          continue;
        }
        nextSelectionMap[detailItem.ordDtlNo] = {
          selected: checked,
          cancelQty: checked ? clampShopMypageOrderReturnQty(detailItem, detailItem.cancelableQty) : 0,
        };
      }
      return nextSelectionMap;
    });
  };

  // 개별 상품 체크박스 변경 시 해당 행의 반품 여부와 기본 수량을 반영합니다.
  const handleToggleItem = (detailItem: ShopMypageOrderDetailItem, checked: boolean): void => {
    if (!isShopMypageOrderReturnable(detailItem)) {
      return;
    }
    setSelectionMap((previousSelectionMap) => ({
      ...previousSelectionMap,
      [detailItem.ordDtlNo]: {
        selected: checked,
        cancelQty: checked ? clampShopMypageOrderReturnQty(detailItem, detailItem.cancelableQty) : 0,
      },
    }));
  };

  // 개별 상품의 반품 수량 입력값을 허용 범위 안으로 보정해 저장합니다.
  const handleChangeItemQty = (detailItem: ShopMypageOrderDetailItem, nextQty: number): void => {
    if (!isShopMypageOrderReturnable(detailItem)) {
      return;
    }
    setSelectionMap((previousSelectionMap) => {
      const selectionItem = resolveShopMypageOrderReturnSelectionItem(previousSelectionMap, detailItem);
      if (!selectionItem.selected) {
        return previousSelectionMap;
      }
      return {
        ...previousSelectionMap,
        [detailItem.ordDtlNo]: {
          selected: true,
          cancelQty: clampShopMypageOrderReturnQty(detailItem, nextQty),
        },
      };
    });
  };

  // 개별 상품의 반품 사유 코드를 현재 상태 맵에 반영합니다.
  const handleChangeItemReasonCd = (ordDtlNo: number, nextReasonCd: string): void => {
    setItemReasonMap((previousItemReasonMap) => {
      const previousReasonState = resolveShopMypageOrderItemReasonState(previousItemReasonMap, ordDtlNo);
      return {
        ...previousItemReasonMap,
        [ordDtlNo]: {
          reasonCd: nextReasonCd,
          reasonDetail: previousReasonState.reasonCd === nextReasonCd ? previousReasonState.reasonDetail : "",
        },
      };
    });
  };

  // 개별 상품의 반품 사유 직접입력값을 현재 상태 맵에 반영합니다.
  const handleChangeItemReasonDetail = (ordDtlNo: number, nextReasonDetail: string): void => {
    setItemReasonMap((previousItemReasonMap) => ({
      ...previousItemReasonMap,
      [ordDtlNo]: {
        ...resolveShopMypageOrderItemReasonState(previousItemReasonMap, ordDtlNo),
        reasonDetail: nextReasonDetail,
      },
    }));
  };

  // 반품신청 버튼 클릭 시 서버 재검증과 실제 반품신청 저장을 요청합니다.
  const handleSubmit = async (): Promise<void> => {
    if (submitDisabled) {
      window.alert(submitMessage || "반품 신청 정보를 확인해주세요.");
      return;
    }
    if (returnItemList.length < 1) {
      window.alert("반품할 상품을 선택해주세요.");
      return;
    }
    if (!selectedPickupAddress) {
      window.alert("회수지를 선택해주세요.");
      return;
    }

    const requestBody: ShopMypageOrderReturnSubmitRequest = {
      ordNo: order.ordNo,
      returnItemList,
      previewAmount: {
        expectedRefundAmt: returnPreviewResult.returnPreviewSummary.expectedRefundAmt,
        paidGoodsAmt: returnPreviewResult.returnPreviewSummary.paidGoodsAmt,
        benefitAmt: returnPreviewResult.returnPreviewSummary.benefitAmt,
        shippingAdjustmentAmt: returnPreviewResult.returnPreviewSummary.shippingAdjustmentAmt,
        totalPointRefundAmt: returnPreviewResult.returnPreviewSummary.totalPointRefundAmt,
        deliveryCouponRefundAmt: returnPreviewResult.returnPreviewSummary.deliveryCouponRefundAmt,
      },
      pickupAddress: buildShopMypageOrderReturnSubmitPickupAddress(selectedPickupAddress),
    };

    // 현재 화면 계산값을 포함해 주문반품 API를 호출하고 실패 메시지는 alert로 노출합니다.
    setIsSubmitting(true);
    try {
      const result = await requestShopClientApi<ShopMypageOrderReturnSubmitResponse>("/api/shop/mypage/order/return", {
        method: "POST",
        body: requestBody,
      });
      if (!result.ok || !result.data) {
        window.alert(result.message || (result.status === 409 ? "환불 금액이 상이합니다." : "반품 신청 처리에 실패했습니다."));
        return;
      }

      // 저장이 완료되면 주문 상세 화면으로 이동합니다.
      window.alert("반품 신청이 완료되었습니다.");
      router.replace(`/mypage/order/${result.data.ordNo}`);
    } catch {
      window.alert("반품 신청 처리에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.orderSection}>
      <header className={styles.orderHeader}>
        <div>
          <h1 className={styles.orderTitle}>반품신청</h1>
        </div>
      </header>

      <div className={styles.detailMetaRow}>
        <p className={styles.detailMetaText}>주문번호 {order.ordNo}</p>
        <p className={`${styles.detailMetaText} ${styles.detailMetaTextRight}`}>주문일시 {order.orderDt || "-"}</p>
      </div>

      <ShopMypageOrderReturnItemList
        order={visibleReturnOrder ?? order}
        selectionMap={selectionMap}
        itemReasonMap={itemReasonMap}
        reasonList={reasonList}
        allSelected={allSelected}
        onToggleAll={handleToggleAll}
        onToggleItem={handleToggleItem}
        onChangeItemQty={handleChangeItemQty}
        onChangeItemReasonCd={handleChangeItemReasonCd}
        onChangeItemReasonDetail={handleChangeItemReasonDetail}
      />

      <section className={styles.detailSectionBlock}>
        <h2 className={styles.detailSectionTitle}>현재 주문 금액</h2>
        <ShopMypageOrderAmountTable columnList={remainingAmountColumnList} />
      </section>

      <section className={styles.detailSectionBlock}>
        <h2 className={styles.detailSectionTitle}>반품 예정 금액</h2>
        {returnPreviewResult.previewVisible ? (
          <ShopMypageOrderAmountTable columnList={returnPreviewAmountColumnList} />
        ) : (
          <div className={styles.previewPendingBox}>
            <p className={styles.previewPendingText}>{infoMessage || "사유를 선택하시면 환불 예정 금액이 보여집니다."}</p>
          </div>
        )}
      </section>

      <section className={styles.detailSectionBlock}>
        <div className={styles.returnPickupHeader}>
          <h2 className={styles.detailSectionTitle}>반품 회수지</h2>
          <button type="button" className={styles.returnPickupButton} onClick={handleOpenAddressSelectLayer}>
            회수지 변경
          </button>
        </div>

        {selectedPickupAddress ? (
          <div className={styles.returnPickupCard}>
            <div className={styles.returnPickupTitleRow}>
              <strong className={styles.returnPickupAlias}>{selectedPickupAddress.addressNm || "회수지"}</strong>
              {selectedPickupAddress.defaultYn === "Y" ? (
                <span className={styles.returnPickupBadge}>기본 회수지</span>
              ) : null}
            </div>
            <p className={styles.returnPickupMeta}>
              {formatPickupContactLine(selectedPickupAddress.rsvNm, orderReturnPageData.customerPhoneNumber)}
            </p>
            <p className={styles.returnPickupMain}>{formatPickupAddressLine(selectedPickupAddress)}</p>
            <p className={styles.returnPickupDetail}>{selectedPickupAddress.detailAddress || "-"}</p>
          </div>
        ) : (
          <div className={styles.returnPickupEmptyState}>
            <p className={styles.returnPickupEmptyTitle}>회수지를 선택해주세요.</p>
            <button type="button" className={styles.returnPickupSelectButton} onClick={handleOpenAddressSelectLayer}>
              회수지 선택
            </button>
            {addressList.length > 0 ? (
              <p className={styles.returnPickupHint}>등록된 배송지 목록에서 회수지를 선택할 수 있습니다.</p>
            ) : null}
          </div>
        )}
      </section>

      <div className={styles.cancelActionBar}>
        {submitMessage !== "" ? <p className={styles.cancelValidationMessage}>{submitMessage}</p> : null}
        <div className={styles.cancelActionButtonGroup}>
          <button type="button" className={styles.cancelSubmitButton} disabled={submitDisabled} onClick={handleSubmit}>
            반품신청
          </button>
          <Link href="/mypage/order" className={styles.cancelListButton}>
            목록
          </Link>
        </div>
      </div>

      {showAddressSelectLayer ? (
        <ShopOrderAddressSelectLayer
          addressList={addressList}
          selectedAddressNm={selectedPickupAddress?.addressNm ?? ""}
          onSelect={handleSelectPickupAddress}
          onClose={handleCloseAddressSelectLayer}
          showEditButton={false}
          showRegisterButton={false}
          resolveContactText={(address) =>
            formatPickupContactLine(address.rsvNm, orderReturnPageData.customerPhoneNumber)
          }
        />
      ) : null}
    </section>
  );
}
