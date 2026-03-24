"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ShopMypageOrderAmountSummary,
  ShopMypageOrderCancelPageResponse,
  ShopMypageOrderCancelSubmitRequest,
  ShopMypageOrderCancelSubmitResponse,
  ShopMypageOrderDetailItem,
} from "@/domains/mypage/types";
import { formatShopMypageOrderPrice } from "@/domains/mypage/utils/shopMypageOrder";
import {
  buildShopMypageOrderCancelPreviewResult,
  clampShopMypageOrderCancelQty,
  createInitialShopMypageOrderCancelSelectionMap,
  isShopMypageOrderPartialCancelable,
  resolveShopMypageOrderCancelSelectionItem,
  resolveShopMypageOrderCancelTarget,
  type ShopMypageOrderCancelMode,
  type ShopMypageOrderCancelPreviewSummary,
  type ShopMypageOrderCancelSelectionMap,
} from "@/domains/mypage/utils/shopMypageOrderCancel";
import type { ShopMypageOrderAmountTableColumn } from "./ShopMypageOrderAmountTable";
import ShopMypageOrderAmountTable from "./ShopMypageOrderAmountTable";
import ShopMypageOrderCancelItemList from "./ShopMypageOrderCancelItemList";
import styles from "./ShopMypageOrderSection.module.css";

interface ShopMypageOrderCancelSectionProps {
  orderCancelPageData: ShopMypageOrderCancelPageResponse;
  initialOrdDtlNo?: number;
}

// 현재 선택 상태를 주문취소 제출용 주문상품 목록으로 변환합니다.
function buildShopMypageOrderCancelSubmitItemList(
  detailList: ShopMypageOrderDetailItem[],
  selectionMap: ShopMypageOrderCancelSelectionMap,
): ShopMypageOrderCancelSubmitRequest["cancelItemList"] {
  return detailList.flatMap((detailItem) => {
    const selectionItem = resolveShopMypageOrderCancelSelectionItem(selectionMap, detailItem);
    if (!selectionItem.selected || selectionItem.cancelQty < 1) {
      return [];
    }
    return [
      {
        ordDtlNo: detailItem.ordDtlNo,
        cancelQty: selectionItem.cancelQty,
      },
    ];
  });
}

// 주문취소 API 응답에서 사용자 표시용 메시지를 안전하게 추출합니다.
async function readShopMypageOrderCancelResponseMessage(response: Response): Promise<string> {
  try {
    const responseBody = (await response.json()) as { message?: string } | null;
    if (typeof responseBody?.message === "string" && responseBody.message.trim() !== "") {
      return responseBody.message;
    }
  } catch {
    return "";
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

// 주문상세 템플릿과 동일한 현재 남은 주문 금액 표 컬럼 목록을 생성합니다.
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

// 주문취소 미리보기 표 컬럼 목록을 생성합니다.
function createCancelPreviewAmountColumnList(
  cancelPreviewSummary: ShopMypageOrderCancelPreviewSummary,
): ShopMypageOrderAmountTableColumn[] {
  return [
    {
      key: "goodsPrice",
      title: "상품가격",
      itemList: [
        {
          key: "totalSupplyAmt",
          label: "상품가격",
          valueText: formatShopMypageOrderAmountText(cancelPreviewSummary.totalSupplyAmt),
        },
        {
          key: "totalGoodsDiscountAmt",
          label: "상품할인",
          valueText: formatShopMypageOrderAmountText(cancelPreviewSummary.totalGoodsDiscountAmt),
        },
      ],
    },
    {
      key: "cancelBenefit",
      title: "취소 혜택",
      itemList: [
        {
          key: "totalGoodsCouponDiscountAmt",
          label: "상품쿠폰",
          valueText: formatShopMypageOrderAmountText(cancelPreviewSummary.totalGoodsCouponDiscountAmt),
        },
        {
          key: "totalCartCouponDiscountAmt",
          label: "장바구니쿠폰",
          valueText: formatShopMypageOrderAmountText(cancelPreviewSummary.totalCartCouponDiscountAmt),
        },
        {
          key: "deliveryCouponRefundAmt",
          label: "배송비쿠폰환급",
          valueText: formatShopMypageOrderAmountText(cancelPreviewSummary.deliveryCouponRefundAmt),
        },
        {
          key: "totalPointRefundAmt",
          label: "포인트환급",
          valueText: formatShopMypageOrderAmountText(cancelPreviewSummary.totalPointRefundAmt),
        },
      ],
    },
    {
      key: "expectedRefund",
      title: "취소 예정금액",
      itemList: [
        {
          key: "paidGoodsAmt",
          label: "실결제 상품가",
          valueText: formatShopMypageOrderAmountText(cancelPreviewSummary.paidGoodsAmt),
        },
        {
          key: "benefitAmt",
          label: "환급 혜택 합계",
          valueText: formatShopMypageOrderAmountText(cancelPreviewSummary.benefitAmt),
        },
        {
          key: "shippingAdjustmentAmt",
          label: "배송비",
          valueText: formatShopMypageOrderSignedAmountText(cancelPreviewSummary.shippingAdjustmentAmt),
        },
        {
          key: "expectedRefundAmt",
          label: "취소 예정 금액",
          valueText: formatShopMypageOrderAmountText(cancelPreviewSummary.expectedRefundAmt),
          isStrong: true,
        },
      ],
    },
  ];
}

// 주문취소 신청 화면을 렌더링합니다.
export default function ShopMypageOrderCancelSection({
  orderCancelPageData,
  initialOrdDtlNo,
}: ShopMypageOrderCancelSectionProps) {
  const router = useRouter();
  const { order, amountSummary, reasonList, siteInfo } = orderCancelPageData;
  const cancelTarget = resolveShopMypageOrderCancelTarget(order, initialOrdDtlNo);
  const [cancelMode] = useState<ShopMypageOrderCancelMode>(cancelTarget.cancelMode);
  const [selectionMap, setSelectionMap] = useState<ShopMypageOrderCancelSelectionMap>(() =>
    createInitialShopMypageOrderCancelSelectionMap(order, cancelTarget.cancelMode, cancelTarget.initialOrdDtlNo),
  );
  const [selectedReasonCd, setSelectedReasonCd] = useState<string>("");
  const [reasonDetail, setReasonDetail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 주문 정보가 없으면 빈 화면을 반환합니다.
  if (!order) {
    return null;
  }

  // 취소 예정 금액은 현재 선택 상태 기준으로만 계산합니다.
  const cancelPreviewResult = buildShopMypageOrderCancelPreviewResult(order, amountSummary, siteInfo, selectionMap);
  const remainingAmountColumnList = createRemainingAmountColumnList(amountSummary);
  const cancelPreviewAmountColumnList = createCancelPreviewAmountColumnList(cancelPreviewResult.cancelPreviewSummary);
  const partialCancelableDetailList = order.detailList.filter((detailItem) => isShopMypageOrderPartialCancelable(detailItem));
  const allSelected =
    partialCancelableDetailList.length > 0 &&
    partialCancelableDetailList.every(
      (detailItem) => resolveShopMypageOrderCancelSelectionItem(selectionMap, detailItem).selected,
    );

  const selectedReason = reasonList.find((reasonItem) => reasonItem.cd === selectedReasonCd) ?? null;
  const reasonValidationMessage =
    selectedReasonCd.trim() === ""
      ? "주문 취소 사유를 선택해주세요."
      : selectedReason?.cd === "C_03" && reasonDetail.trim() === ""
        ? "기타 사유를 입력해주세요."
        : "";
  const submitMessage = reasonValidationMessage !== "" ? reasonValidationMessage : cancelPreviewResult.submitBlockMessage;
  const submitDisabled = isSubmitting || reasonValidationMessage !== "" || !cancelPreviewResult.canSubmit;

  // 전체선택 체크박스 변경 시 부분취소 가능 상품만 일괄 선택/해제합니다.
  const handleToggleAll = (checked: boolean): void => {
    if (cancelMode === "full") {
      return;
    }
    setSelectionMap((previousSelectionMap) => {
      const nextSelectionMap: ShopMypageOrderCancelSelectionMap = { ...previousSelectionMap };
      for (const detailItem of order.detailList) {
        if (!isShopMypageOrderPartialCancelable(detailItem)) {
          continue;
        }
        nextSelectionMap[detailItem.ordDtlNo] = {
          selected: checked,
          cancelQty: checked ? clampShopMypageOrderCancelQty(detailItem, detailItem.cancelableQty) : 0,
        };
      }
      return nextSelectionMap;
    });
  };

  // 개별 상품 체크박스 변경 시 해당 행의 취소 여부와 기본 수량을 반영합니다.
  const handleToggleItem = (detailItem: ShopMypageOrderDetailItem, checked: boolean): void => {
    if (cancelMode === "full" || !isShopMypageOrderPartialCancelable(detailItem)) {
      return;
    }
    setSelectionMap((previousSelectionMap) => ({
      ...previousSelectionMap,
      [detailItem.ordDtlNo]: {
        selected: checked,
        cancelQty: checked ? clampShopMypageOrderCancelQty(detailItem, detailItem.cancelableQty) : 0,
      },
    }));
  };

  // 개별 상품의 취소 수량 입력값을 허용 범위 안으로 보정해 저장합니다.
  const handleChangeItemQty = (detailItem: ShopMypageOrderDetailItem, nextQty: number): void => {
    if (cancelMode === "full" || !isShopMypageOrderPartialCancelable(detailItem)) {
      return;
    }
    setSelectionMap((previousSelectionMap) => {
      const selectionItem = resolveShopMypageOrderCancelSelectionItem(previousSelectionMap, detailItem);
      if (!selectionItem.selected) {
        return previousSelectionMap;
      }
      return {
        ...previousSelectionMap,
        [detailItem.ordDtlNo]: {
          selected: true,
          cancelQty: clampShopMypageOrderCancelQty(detailItem, nextQty),
        },
      };
    });
  };

  // 취소신청 버튼 클릭 시 서버 재검증과 실제 취소 처리를 요청합니다.
  const handleSubmit = async (): Promise<void> => {
    if (submitDisabled) {
      window.alert(submitMessage || "취소 정보를 확인해주세요.");
      return;
    }
    const cancelItemList = buildShopMypageOrderCancelSubmitItemList(order.detailList, selectionMap);
    if (cancelItemList.length < 1) {
      window.alert("취소할 상품을 선택해주세요.");
      return;
    }

    const requestBody: ShopMypageOrderCancelSubmitRequest = {
      ordNo: order.ordNo,
      reasonCd: selectedReasonCd,
      reasonDetail: reasonDetail.trim(),
      cancelItemList,
      previewAmount: {
        expectedRefundAmt: cancelPreviewResult.cancelPreviewSummary.expectedRefundAmt,
        paidGoodsAmt: cancelPreviewResult.cancelPreviewSummary.paidGoodsAmt,
        benefitAmt: cancelPreviewResult.cancelPreviewSummary.benefitAmt,
        shippingAdjustmentAmt: cancelPreviewResult.cancelPreviewSummary.shippingAdjustmentAmt,
        totalPointRefundAmt: cancelPreviewResult.cancelPreviewSummary.totalPointRefundAmt,
        deliveryCouponRefundAmt: cancelPreviewResult.cancelPreviewSummary.deliveryCouponRefundAmt,
      },
    };

    // 현재 화면 계산값을 포함해 주문취소 API를 호출하고, 실패 메시지는 alert로 노출합니다.
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/shop/mypage/order/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const responseMessage = await readShopMypageOrderCancelResponseMessage(response);
        window.alert(responseMessage || (response.status === 409 ? "환불 금액이 상이합니다." : "주문취소 처리에 실패했습니다."));
        return;
      }

      const result = (await response.json()) as ShopMypageOrderCancelSubmitResponse;
      window.alert("주문취소가 완료되었습니다.");
      router.replace(`/mypage/order/${result.ordNo}`);
      router.refresh();
    } catch {
      window.alert("주문취소 처리에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.orderSection}>
      <header className={styles.orderHeader}>
        <div>
          <h1 className={styles.orderTitle}>주문취소 신청</h1>
        </div>
      </header>

      <div className={styles.detailMetaRow}>
        <p className={styles.detailMetaText}>주문번호 {order.ordNo}</p>
        <p className={`${styles.detailMetaText} ${styles.detailMetaTextRight}`}>주문일시 {order.orderDt || "-"}</p>
      </div>

      <ShopMypageOrderCancelItemList
        order={order}
        cancelMode={cancelMode}
        selectionMap={selectionMap}
        allSelected={allSelected}
        onToggleAll={handleToggleAll}
        onToggleItem={handleToggleItem}
        onChangeItemQty={handleChangeItemQty}
      />

      <section className={styles.detailSectionBlock}>
        <h2 className={styles.detailSectionTitle}>주문 취소 사유</h2>
        <div className={styles.cancelReasonBox}>
          <div className={styles.cancelReasonField}>
            <label htmlFor="cancelReasonCd" className={styles.cancelFieldLabel}>
              취소 사유
            </label>
            <select
              id="cancelReasonCd"
              className={styles.cancelReasonSelect}
              value={selectedReasonCd}
              onChange={(event) => {
                setSelectedReasonCd(event.target.value);
              }}
            >
              <option value="">취소 사유를 선택해주세요.</option>
              {reasonList.map((reasonItem) => (
                <option key={reasonItem.cd} value={reasonItem.cd}>
                  {reasonItem.cdNm}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.cancelReasonField}>
            <label htmlFor="cancelReasonDetail" className={styles.cancelFieldLabel}>
              직접 기입
            </label>
            <textarea
              id="cancelReasonDetail"
              className={styles.cancelReasonTextarea}
              rows={4}
              value={reasonDetail}
              placeholder="추가로 전달할 주문 취소 사유가 있다면 입력해주세요."
              onChange={(event) => {
                setReasonDetail(event.target.value);
              }}
            />
          </div>
        </div>
      </section>

      <section className={styles.detailSectionBlock}>
        <h2 className={styles.detailSectionTitle}>현재 주문 금액</h2>
        <ShopMypageOrderAmountTable columnList={remainingAmountColumnList} />
      </section>

      <section className={styles.detailSectionBlock}>
        <h2 className={styles.detailSectionTitle}>취소 예정 금액</h2>
        <ShopMypageOrderAmountTable columnList={cancelPreviewAmountColumnList} />
      </section>

      <div className={styles.cancelActionBar}>
        {submitMessage !== "" ? <p className={styles.cancelValidationMessage}>{submitMessage}</p> : null}
        <div className={styles.cancelActionButtonGroup}>
          <button type="button" className={styles.cancelSubmitButton} disabled={submitDisabled} onClick={handleSubmit}>
            취소신청
          </button>
          <Link href="/mypage/order" className={styles.cancelListButton}>
            목록
          </Link>
        </div>
      </div>
    </section>
  );
}
