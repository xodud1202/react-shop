"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ShopMypageOrderDetailItem,
  ShopMypageOrderExchangePageResponse,
  ShopMypageOrderExchangeSubmitRequest,
  ShopMypageOrderExchangeSubmitResponse,
  ShopMypageOrderItemReasonMap,
} from "@/domains/mypage/types";
import {
  createInitialShopMypageOrderItemReasonMap,
  resolveShopMypageOrderItemReasonState,
} from "@/domains/mypage/utils/shopMypageOrderClaimReason";
import {
  buildShopMypageOrderExchangePreviewResult,
  clampShopMypageOrderExchangeQty,
  createInitialShopMypageOrderExchangeSelectionMap,
  hasShopMypageOrderExchangeBlockedClaim,
  isShopMypageOrderExchangeable,
  resolveShopMypageOrderExchangeSelectionItem,
  resolveShopMypageOrderExchangeTarget,
  type ShopMypageOrderExchangeSelectionMap,
} from "@/domains/mypage/utils/shopMypageOrderExchange";
import { formatShopMypageOrderPrice } from "@/domains/mypage/utils/shopMypageOrder";
import { normalizeShopOrderPaymentPrepareResponse } from "@/domains/order/api/orderApi";
import ShopOrderAddressSelectLayer from "@/domains/order/components/ShopOrderAddressSelectLayer";
import type { ShopOrderAddress, ShopOrderPaymentMethodCd } from "@/domains/order/types";
import { requestTossPayment } from "@/domains/order/utils/tossPayments";
import { requestShopClientApi } from "@/shared/client/shopClientApi";
import ShopMypageOrderExchangeItemList from "./ShopMypageOrderExchangeItemList";
import styles from "./ShopMypageOrderSection.module.css";

interface ShopMypageOrderExchangeSectionProps {
  orderExchangePageData: ShopMypageOrderExchangePageResponse;
  initialOrdDtlNo?: number;
}

type ExchangeAddressTarget = "pickup" | "delivery";

const ORDER_CHANGE_ADDRESS_NAME_MAX_LENGTH = 20;
const ORDER_CHANGE_ADDRESS_POST_NO_MAX_LENGTH = 10;
const ORDER_CHANGE_ADDRESS_BASE_MAX_LENGTH = 100;
const ORDER_CHANGE_ADDRESS_DETAIL_MAX_LENGTH = 100;

// 현재 선택 상태를 주문교환 제출용 주문상품 목록으로 변환합니다.
function buildShopMypageOrderExchangeSubmitItemList(
  detailList: ShopMypageOrderDetailItem[],
  selectionMap: ShopMypageOrderExchangeSelectionMap,
  itemReasonMap: ShopMypageOrderItemReasonMap,
): ShopMypageOrderExchangeSubmitRequest["exchangeItemList"] {
  return detailList.flatMap((detailItem) => {
    const selectionItem = resolveShopMypageOrderExchangeSelectionItem(selectionMap, detailItem);
    if (!selectionItem.selected || selectionItem.exchangeQty < 1) {
      return [];
    }
    const reasonState = resolveShopMypageOrderItemReasonState(itemReasonMap, detailItem.ordDtlNo);
    return [
      {
        ordDtlNo: detailItem.ordDtlNo,
        exchangeQty: selectionItem.exchangeQty,
        targetSizeId: selectionItem.targetSizeId.trim(),
        reasonCd: reasonState.reasonCd.trim(),
        reasonDetail: reasonState.reasonDetail.trim(),
      },
    ];
  });
}

// 교환 주소 입력값을 제출용 주소 형식으로 변환합니다.
function buildShopMypageOrderExchangeSubmitAddress(
  address: ShopOrderAddress,
): ShopMypageOrderExchangeSubmitRequest["pickupAddress"] {
  return {
    rsvNm: address.rsvNm.trim(),
    postNo: address.postNo.trim(),
    baseAddress: address.baseAddress.trim(),
    detailAddress: address.detailAddress.trim(),
  };
}

// 교환 주소 입력값의 클라이언트 유효성을 확인합니다.
function resolveShopMypageOrderExchangeAddressValidationMessage(address: ShopOrderAddress | null, label: string): string {
  if (!address) {
    return `${label}를 선택해주세요.`;
  }

  const submitAddress = buildShopMypageOrderExchangeSubmitAddress(address);
  if (
    submitAddress.rsvNm === "" ||
    submitAddress.postNo === "" ||
    submitAddress.baseAddress === "" ||
    submitAddress.detailAddress === ""
  ) {
    return `${label} 정보를 확인해주세요.`;
  }
  if (
    submitAddress.rsvNm.length > ORDER_CHANGE_ADDRESS_NAME_MAX_LENGTH ||
    submitAddress.postNo.length > ORDER_CHANGE_ADDRESS_POST_NO_MAX_LENGTH ||
    submitAddress.baseAddress.length > ORDER_CHANGE_ADDRESS_BASE_MAX_LENGTH ||
    submitAddress.detailAddress.length > ORDER_CHANGE_ADDRESS_DETAIL_MAX_LENGTH
  ) {
    return `${label} 정보를 확인해주세요.`;
  }
  return "";
}

// 주문상세 행의 교환 가능 수량이 화면 노출 가능한 값인지 반환합니다.
function hasVisibleExchangeQty(detailItem: ShopMypageOrderDetailItem): boolean {
  const exchangeableQty = Math.max(Math.floor(detailItem.cancelableQty || 0), 0);
  return exchangeableQty > 0;
}

// 일반 금액 문자열을 원화 형식으로 변환합니다.
function formatExchangeAmountText(value: number): string {
  return `${formatShopMypageOrderPrice(value)}원`;
}

// 회수지 기본주소 라인을 포맷 문자열로 변환합니다.
function formatExchangeAddressLine(address: ShopOrderAddress): string {
  return `(${address.postNo}) ${address.baseAddress}`;
}

// 회수지 연락처 라인을 상태에 맞게 생성합니다.
function formatExchangeContactLine(receiverName: string, phoneNumber: string): string {
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

// 결제수단 버튼 라벨을 반환합니다.
function resolvePaymentMethodLabel(paymentMethodCd: ShopOrderPaymentMethodCd): string {
  if (paymentMethodCd === "PAY_METHOD_01") {
    return "카드";
  }
  if (paymentMethodCd === "PAY_METHOD_02") {
    return "무통장입금";
  }
  if (paymentMethodCd === "PAY_METHOD_03") {
    return "퀵계좌이체";
  }
  return "";
}

// Toss 결제창 호출 실패 시 서버에 결제 실패와 교환 철회를 요청합니다.
async function requestShopMypageOrderExchangePaymentFail(payNo: number, clmNo: string): Promise<void> {
  await requestShopClientApi("/api/shop/mypage/order/exchange/payment/fail", {
    method: "POST",
    body: {
      payNo,
      clmNo,
      code: "PAYMENT_WINDOW_FAILED",
      message: "교환 배송비 결제창 호출에 실패했습니다.",
    },
  });
}

// 교환 신청 화면을 렌더링합니다.
export default function ShopMypageOrderExchangeSection({
  orderExchangePageData,
  initialOrdDtlNo,
}: ShopMypageOrderExchangeSectionProps) {
  const router = useRouter();
  const { order, reasonList, siteInfo, sizeOptionList } = orderExchangePageData;
  const exchangeTarget = resolveShopMypageOrderExchangeTarget(order, initialOrdDtlNo);
  const addressList = orderExchangePageData.addressList;
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<ShopOrderAddress | null>(orderExchangePageData.pickupAddress);
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState<ShopOrderAddress | null>(orderExchangePageData.deliveryAddress);
  const [addressTarget, setAddressTarget] = useState<ExchangeAddressTarget>("pickup");
  const [showAddressSelectLayer, setShowAddressSelectLayer] = useState<boolean>(false);
  const [selectionMap, setSelectionMap] = useState<ShopMypageOrderExchangeSelectionMap>(() =>
    createInitialShopMypageOrderExchangeSelectionMap(order, exchangeTarget.initialOrdDtlNo, sizeOptionList),
  );
  const [itemReasonMap, setItemReasonMap] = useState<ShopMypageOrderItemReasonMap>(() =>
    createInitialShopMypageOrderItemReasonMap(order),
  );
  const [selectedPaymentMethodCd, setSelectedPaymentMethodCd] = useState<ShopOrderPaymentMethodCd>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 교환 배송비 미리보기 결과를 계산합니다.
  const exchangePreviewResult = useMemo(
    () => buildShopMypageOrderExchangePreviewResult(order, siteInfo, selectionMap, itemReasonMap, reasonList, sizeOptionList),
    [itemReasonMap, order, reasonList, selectionMap, siteInfo, sizeOptionList],
  );
  const visibleExchangeOrder = useMemo(() => {
    if (!order) {
      return null;
    }

    // 진행 중 반품/교환 클레임 상품과 교환 가능 수량이 없는 상품은 교환신청 화면 상단 목록에서 제외합니다.
    return {
      ...order,
      detailList: order.detailList.filter(
        (detailItem) => !hasShopMypageOrderExchangeBlockedClaim(detailItem) && hasVisibleExchangeQty(detailItem),
      ),
    };
  }, [order]);
  const exchangeableDetailList = useMemo(
    () => (order?.detailList ?? []).filter((detailItem) => isShopMypageOrderExchangeable(detailItem)),
    [order?.detailList],
  );
  const exchangeItemList = useMemo(
    () => buildShopMypageOrderExchangeSubmitItemList(order?.detailList ?? [], selectionMap, itemReasonMap),
    [itemReasonMap, order?.detailList, selectionMap],
  );
  const allSelected = useMemo(
    () =>
      exchangeableDetailList.length > 0 &&
      exchangeableDetailList.every(
        (detailItem) => resolveShopMypageOrderExchangeSelectionItem(selectionMap, detailItem).selected,
      ),
    [exchangeableDetailList, selectionMap],
  );
  const pickupAddressValidationMessage = useMemo(
    () => resolveShopMypageOrderExchangeAddressValidationMessage(selectedPickupAddress, "회수지"),
    [selectedPickupAddress],
  );
  const deliveryAddressValidationMessage = useMemo(
    () => resolveShopMypageOrderExchangeAddressValidationMessage(selectedDeliveryAddress, "교환 배송지"),
    [selectedDeliveryAddress],
  );
  const paymentMethodValidationMessage =
    exchangePreviewResult.paymentRequired && selectedPaymentMethodCd === "" ? "교환 배송비 결제수단을 선택해주세요." : "";
  const submitMessage =
    pickupAddressValidationMessage ||
    deliveryAddressValidationMessage ||
    exchangePreviewResult.submitBlockMessage ||
    paymentMethodValidationMessage;
  const submitDisabled = isSubmitting || submitMessage !== "" || !exchangePreviewResult.canSubmit;

  // 주문 정보가 없으면 빈 화면을 반환합니다.
  if (!order) {
    return null;
  }

  // 주소 선택 레이어를 엽니다.
  const handleOpenAddressSelectLayer = (target: ExchangeAddressTarget): void => {
    setAddressTarget(target);
    setShowAddressSelectLayer(true);
  };

  // 주소 선택 레이어를 닫습니다.
  const handleCloseAddressSelectLayer = (): void => {
    setShowAddressSelectLayer(false);
  };

  // 선택한 주소를 현재 화면 상태에 반영합니다.
  const handleSelectAddress = (address: ShopOrderAddress): void => {
    if (addressTarget === "pickup") {
      setSelectedPickupAddress(address);
    } else {
      setSelectedDeliveryAddress(address);
    }
    setShowAddressSelectLayer(false);
  };

  // 전체선택 체크박스 변경 시 교환 가능 상품만 일괄 선택/해제합니다.
  const handleToggleAll = (checked: boolean): void => {
    setSelectionMap((previousSelectionMap) => {
      const nextSelectionMap: ShopMypageOrderExchangeSelectionMap = { ...previousSelectionMap };
      for (const detailItem of order.detailList) {
        if (!isShopMypageOrderExchangeable(detailItem)) {
          continue;
        }
        const previousSelectionItem = resolveShopMypageOrderExchangeSelectionItem(previousSelectionMap, detailItem);
        nextSelectionMap[detailItem.ordDtlNo] = {
          ...previousSelectionItem,
          selected: checked,
          exchangeQty: checked ? clampShopMypageOrderExchangeQty(detailItem, detailItem.cancelableQty) : 0,
        };
      }
      return nextSelectionMap;
    });
  };

  // 개별 상품 체크박스 변경 시 해당 행의 교환 여부와 기본 수량을 반영합니다.
  const handleToggleItem = (detailItem: ShopMypageOrderDetailItem, checked: boolean): void => {
    if (!isShopMypageOrderExchangeable(detailItem)) {
      return;
    }
    setSelectionMap((previousSelectionMap) => {
      const previousSelectionItem = resolveShopMypageOrderExchangeSelectionItem(previousSelectionMap, detailItem);
      return {
        ...previousSelectionMap,
        [detailItem.ordDtlNo]: {
          ...previousSelectionItem,
          selected: checked,
          exchangeQty: checked ? clampShopMypageOrderExchangeQty(detailItem, detailItem.cancelableQty) : 0,
        },
      };
    });
  };

  // 개별 상품의 교환 수량 입력값을 허용 범위 안으로 보정해 저장합니다.
  const handleChangeItemQty = (detailItem: ShopMypageOrderDetailItem, nextQty: number): void => {
    if (!isShopMypageOrderExchangeable(detailItem)) {
      return;
    }
    setSelectionMap((previousSelectionMap) => {
      const selectionItem = resolveShopMypageOrderExchangeSelectionItem(previousSelectionMap, detailItem);
      if (!selectionItem.selected) {
        return previousSelectionMap;
      }
      return {
        ...previousSelectionMap,
        [detailItem.ordDtlNo]: {
          ...selectionItem,
          selected: true,
          exchangeQty: clampShopMypageOrderExchangeQty(detailItem, nextQty),
        },
      };
    });
  };

  // 개별 상품의 교환 희망 사이즈를 현재 상태 맵에 반영합니다.
  const handleChangeItemTargetSizeId = (detailItem: ShopMypageOrderDetailItem, nextTargetSizeId: string): void => {
    setSelectionMap((previousSelectionMap) => ({
      ...previousSelectionMap,
      [detailItem.ordDtlNo]: {
        ...resolveShopMypageOrderExchangeSelectionItem(previousSelectionMap, detailItem),
        targetSizeId: nextTargetSizeId,
      },
    }));
  };

  // 개별 상품의 교환 사유 코드를 현재 상태 맵에 반영합니다.
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

  // 개별 상품의 교환 사유 직접입력값을 현재 상태 맵에 반영합니다.
  const handleChangeItemReasonDetail = (ordDtlNo: number, nextReasonDetail: string): void => {
    setItemReasonMap((previousItemReasonMap) => ({
      ...previousItemReasonMap,
      [ordDtlNo]: {
        ...resolveShopMypageOrderItemReasonState(previousItemReasonMap, ordDtlNo),
        reasonDetail: nextReasonDetail,
      },
    }));
  };

  // 교환신청 버튼 클릭 시 서버 재검증과 실제 교환신청 저장을 요청합니다.
  const handleSubmit = async (): Promise<void> => {
    if (submitDisabled) {
      window.alert(submitMessage || "교환 신청 정보를 확인해주세요.");
      return;
    }
    if (exchangeItemList.length < 1) {
      window.alert("교환할 상품을 선택해주세요.");
      return;
    }
    if (!selectedPickupAddress) {
      window.alert("회수지를 선택해주세요.");
      return;
    }
    if (!selectedDeliveryAddress) {
      window.alert("교환 배송지를 선택해주세요.");
      return;
    }

    const requestBody: ShopMypageOrderExchangeSubmitRequest = {
      ordNo: order.ordNo,
      exchangeItemList,
      pickupAddress: buildShopMypageOrderExchangeSubmitAddress(selectedPickupAddress),
      deliveryAddress: buildShopMypageOrderExchangeSubmitAddress(selectedDeliveryAddress),
      paymentMethodCd: selectedPaymentMethodCd,
    };

    // 현재 화면 입력값을 포함해 주문교환 API를 호출하고 결제가 필요하면 Toss 결제창으로 연결합니다.
    setIsSubmitting(true);
    try {
      const result = await requestShopClientApi<ShopMypageOrderExchangeSubmitResponse>("/api/shop/mypage/order/exchange", {
        method: "POST",
        body: requestBody,
      });
      if (!result.ok || !result.data) {
        window.alert(result.message || "교환 신청 처리에 실패했습니다.");
        return;
      }

      if (result.data.paymentRequiredYn) {
        if (!result.data.paymentPrepare) {
          window.alert("교환 배송비 결제 정보를 확인해주세요.");
          return;
        }
        const paymentPrepareResponse = normalizeShopOrderPaymentPrepareResponse(result.data.paymentPrepare);
        if (paymentPrepareResponse.payNo < 1 || paymentPrepareResponse.orderId.trim() === "") {
          window.alert("교환 배송비 결제 정보를 확인해주세요.");
          return;
        }
        try {
          await requestTossPayment(paymentPrepareResponse);
        } catch {
          await requestShopMypageOrderExchangePaymentFail(paymentPrepareResponse.payNo, paymentPrepareResponse.orderId);
          window.alert("교환 배송비 결제창 호출에 실패했습니다.");
        }
        return;
      }

      window.alert("교환 신청이 완료되었습니다.");
      router.replace(`/mypage/order/${result.data.ordNo}`);
    } catch {
      window.alert("교환 신청 처리에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAddress = addressTarget === "pickup" ? selectedPickupAddress : selectedDeliveryAddress;

  return (
    <section className={styles.orderSection}>
      <header className={styles.orderHeader}>
        <div>
          <h1 className={styles.orderTitle}>교환신청</h1>
        </div>
      </header>

      <div className={styles.detailMetaRow}>
        <p className={styles.detailMetaText}>주문번호 {order.ordNo}</p>
        <p className={`${styles.detailMetaText} ${styles.detailMetaTextRight}`}>주문일시 {order.orderDt || "-"}</p>
      </div>

      <ShopMypageOrderExchangeItemList
        order={visibleExchangeOrder ?? order}
        selectionMap={selectionMap}
        itemReasonMap={itemReasonMap}
        reasonList={reasonList}
        sizeOptionList={sizeOptionList}
        allSelected={allSelected}
        onToggleAll={handleToggleAll}
        onToggleItem={handleToggleItem}
        onChangeItemQty={handleChangeItemQty}
        onChangeItemTargetSizeId={handleChangeItemTargetSizeId}
        onChangeItemReasonCd={handleChangeItemReasonCd}
        onChangeItemReasonDetail={handleChangeItemReasonDetail}
      />

      <section className={styles.detailSectionBlock}>
        <div className={styles.returnPickupHeader}>
          <h2 className={styles.detailSectionTitle}>회수지</h2>
          <button type="button" className={styles.returnPickupButton} onClick={() => handleOpenAddressSelectLayer("pickup")}>
            회수지 변경
          </button>
        </div>

        {selectedPickupAddress ? (
          <div className={styles.returnPickupCard}>
            <div className={styles.returnPickupTitleRow}>
              <strong className={styles.returnPickupAlias}>{selectedPickupAddress.addressNm || "회수지"}</strong>
              {selectedPickupAddress.defaultYn === "Y" ? <span className={styles.returnPickupBadge}>기본 배송지</span> : null}
            </div>
            <p className={styles.returnPickupMeta}>
              {formatExchangeContactLine(selectedPickupAddress.rsvNm, orderExchangePageData.customerPhoneNumber)}
            </p>
            <p className={styles.returnPickupMain}>{formatExchangeAddressLine(selectedPickupAddress)}</p>
            <p className={styles.returnPickupDetail}>{selectedPickupAddress.detailAddress || "-"}</p>
          </div>
        ) : (
          <div className={styles.returnPickupEmptyState}>
            <p className={styles.returnPickupEmptyTitle}>회수지를 선택해주세요.</p>
            <button type="button" className={styles.returnPickupSelectButton} onClick={() => handleOpenAddressSelectLayer("pickup")}>
              회수지 선택
            </button>
          </div>
        )}
      </section>

      <section className={styles.detailSectionBlock}>
        <div className={styles.returnPickupHeader}>
          <h2 className={styles.detailSectionTitle}>교환 배송지</h2>
          <button type="button" className={styles.returnPickupButton} onClick={() => handleOpenAddressSelectLayer("delivery")}>
            배송지 변경
          </button>
        </div>

        {selectedDeliveryAddress ? (
          <div className={styles.returnPickupCard}>
            <div className={styles.returnPickupTitleRow}>
              <strong className={styles.returnPickupAlias}>{selectedDeliveryAddress.addressNm || "교환 배송지"}</strong>
              {selectedDeliveryAddress.defaultYn === "Y" ? <span className={styles.returnPickupBadge}>기본 배송지</span> : null}
            </div>
            <p className={styles.returnPickupMeta}>
              {formatExchangeContactLine(selectedDeliveryAddress.rsvNm, orderExchangePageData.customerPhoneNumber)}
            </p>
            <p className={styles.returnPickupMain}>{formatExchangeAddressLine(selectedDeliveryAddress)}</p>
            <p className={styles.returnPickupDetail}>{selectedDeliveryAddress.detailAddress || "-"}</p>
          </div>
        ) : (
          <div className={styles.returnPickupEmptyState}>
            <p className={styles.returnPickupEmptyTitle}>교환 배송지를 선택해주세요.</p>
            <button type="button" className={styles.returnPickupSelectButton} onClick={() => handleOpenAddressSelectLayer("delivery")}>
              배송지 선택
            </button>
          </div>
        )}
      </section>

      <section className={styles.detailSectionBlock}>
        <h2 className={styles.detailSectionTitle}>교환 배송비</h2>
        {exchangePreviewResult.previewVisible ? (
          <div className={styles.exchangeFeeBox}>
            <div className={styles.exchangeFeeRow}>
              <span className={styles.exchangeFeeLabel}>결제 예정 금액</span>
              <strong className={styles.exchangeFeeValue}>{formatExchangeAmountText(exchangePreviewResult.payDelvAmt)}</strong>
            </div>
            <p className={styles.exchangeFeeDescription}>
              {exchangePreviewResult.paymentRequired
                ? "고객 귀책 교환은 왕복 배송비 결제가 필요합니다."
                : "회사 귀책 교환이 포함되어 배송비 결제 없이 신청됩니다."}
            </p>
          </div>
        ) : (
          <div className={styles.previewPendingBox}>
            <p className={styles.previewPendingText}>
              {exchangePreviewResult.submitBlockMessage || "사유를 선택하시면 교환 배송비가 보여집니다."}
            </p>
          </div>
        )}
      </section>

      {exchangePreviewResult.paymentRequired ? (
        <section className={styles.detailSectionBlock}>
          <h2 className={styles.detailSectionTitle}>결제수단</h2>
          <div className={styles.exchangePaymentMethodGroup}>
            {(["PAY_METHOD_01", "PAY_METHOD_02", "PAY_METHOD_03"] as ShopOrderPaymentMethodCd[]).map((paymentMethodCd) => (
              <button
                key={paymentMethodCd}
                type="button"
                className={`${styles.exchangePaymentMethodButton} ${
                  selectedPaymentMethodCd === paymentMethodCd ? styles.exchangePaymentMethodButtonActive : ""
                }`}
                onClick={() => setSelectedPaymentMethodCd(paymentMethodCd)}
              >
                {resolvePaymentMethodLabel(paymentMethodCd)}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className={styles.claimActionFooter}>
        {submitMessage !== "" ? <p className={styles.claimActionValidationMessage}>{submitMessage}</p> : null}
        <div className={styles.claimActionButtonGroup}>
          <button type="button" className={styles.cancelSubmitButton} disabled={submitDisabled} onClick={handleSubmit}>
            {isSubmitting ? "교환신청 처리중..." : "교환신청"}
          </button>
          <Link href="/mypage/order" className={styles.cancelListButton}>
            목록
          </Link>
        </div>
      </div>

      {showAddressSelectLayer ? (
        <ShopOrderAddressSelectLayer
          addressList={addressList}
          selectedAddressNm={selectedAddress?.addressNm ?? ""}
          onSelect={handleSelectAddress}
          onClose={handleCloseAddressSelectLayer}
          showEditButton={false}
          showRegisterButton={false}
          resolveContactText={(address) =>
            formatExchangeContactLine(address.rsvNm, orderExchangePageData.customerPhoneNumber)
          }
        />
      ) : null}
    </section>
  );
}
