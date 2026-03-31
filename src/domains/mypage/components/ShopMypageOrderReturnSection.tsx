"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type {
  ShopMypageOrderAmountSummary,
  ShopMypageOrderDetailItem,
  ShopMypageOrderReturnPageResponse,
  ShopMypageOrderReturnReasonItem,
} from "@/domains/mypage/types";
import { formatShopMypageOrderPrice } from "@/domains/mypage/utils/shopMypageOrder";
import {
  buildShopMypageOrderReturnPreviewResult,
  clampShopMypageOrderReturnQty,
  createInitialShopMypageOrderReturnSelectionMap,
  isShopMypageOrderReturnable,
  resolveShopMypageOrderReturnSelectionItem,
  resolveShopMypageOrderReturnTarget,
  type ShopMypageOrderReturnPreviewSummary,
  type ShopMypageOrderReturnSelectionMap,
} from "@/domains/mypage/utils/shopMypageOrderReturn";
import type { ShopMypageOrderAmountTableColumn } from "./ShopMypageOrderAmountTable";
import ShopMypageOrderAmountTable from "./ShopMypageOrderAmountTable";
import ShopMypageOrderReturnItemList from "./ShopMypageOrderReturnItemList";
import styles from "./ShopMypageOrderSection.module.css";

interface ShopMypageOrderReturnSectionProps {
  orderReturnPageData: ShopMypageOrderReturnPageResponse;
  initialOrdDtlNo?: number;
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

// 선택된 반품 사유가 상세 입력을 요구하는지 반환합니다.
function isShopMypageOrderReturnReasonDetailRequired(reasonItem: ShopMypageOrderReturnReasonItem | null): boolean {
  return (reasonItem?.cdNm || "").includes("기타");
}

// 반품 신청 화면을 렌더링합니다.
export default function ShopMypageOrderReturnSection({
  orderReturnPageData,
  initialOrdDtlNo,
}: ShopMypageOrderReturnSectionProps) {
  const { order, amountSummary, reasonList, siteInfo } = orderReturnPageData;
  const returnTarget = resolveShopMypageOrderReturnTarget(order, initialOrdDtlNo);
  const [selectionMap, setSelectionMap] = useState<ShopMypageOrderReturnSelectionMap>(() =>
    createInitialShopMypageOrderReturnSelectionMap(order, returnTarget.initialOrdDtlNo),
  );
  const [selectedReasonCd, setSelectedReasonCd] = useState<string>("");
  const [reasonDetail, setReasonDetail] = useState<string>("");

  // 반품 환불 예정 금액과 화면 표시용 컬럼을 계산합니다.
  const returnPreviewResult = useMemo(
    () => buildShopMypageOrderReturnPreviewResult(order, amountSummary, siteInfo, selectionMap),
    [order, amountSummary, siteInfo, selectionMap],
  );
  const remainingAmountColumnList = useMemo(() => createRemainingAmountColumnList(amountSummary), [amountSummary]);
  const returnPreviewAmountColumnList = useMemo(
    () => createReturnPreviewAmountColumnList(returnPreviewResult.cancelPreviewSummary),
    [returnPreviewResult.cancelPreviewSummary],
  );
  const returnableDetailList = useMemo(
    () => (order?.detailList ?? []).filter((detailItem) => isShopMypageOrderReturnable(detailItem)),
    [order?.detailList],
  );
  const allSelected = useMemo(
    () =>
      returnableDetailList.length > 0 &&
      returnableDetailList.every(
        (detailItem) => resolveShopMypageOrderReturnSelectionItem(selectionMap, detailItem).selected,
      ),
    [returnableDetailList, selectionMap],
  );
  const selectedReason = useMemo(
    () => reasonList.find((reasonItem) => reasonItem.cd === selectedReasonCd) ?? null,
    [reasonList, selectedReasonCd],
  );
  const reasonValidationMessage =
    selectedReasonCd.trim() === ""
      ? "반품 사유를 선택해주세요."
      : isShopMypageOrderReturnReasonDetailRequired(selectedReason) && reasonDetail.trim() === ""
        ? "기타 사유를 입력해주세요."
        : "";
  const infoMessage = reasonValidationMessage || returnPreviewResult.submitBlockMessage;

  // 주문 정보가 없으면 빈 화면을 반환합니다.
  if (!order) {
    return null;
  }

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

  // 반품신청 버튼 클릭 시 저장 없이 추후 오픈 안내만 노출합니다.
  const handleSubmit = (): void => {
    window.alert("반품 신청 기능은 추후 오픈 예정입니다.");
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
        order={order}
        selectionMap={selectionMap}
        allSelected={allSelected}
        onToggleAll={handleToggleAll}
        onToggleItem={handleToggleItem}
        onChangeItemQty={handleChangeItemQty}
      />

      <section className={styles.detailSectionBlock}>
        <h2 className={styles.detailSectionTitle}>반품 사유</h2>
        <div className={styles.cancelReasonBox}>
          <div className={styles.cancelReasonField}>
            <label htmlFor="returnReasonCd" className={styles.cancelFieldLabel}>
              반품 사유
            </label>
            <select
              id="returnReasonCd"
              className={styles.cancelReasonSelect}
              value={selectedReasonCd}
              onChange={(event) => {
                setSelectedReasonCd(event.target.value);
              }}
            >
              <option value="">반품 사유를 선택해주세요.</option>
              {reasonList.map((reasonItem) => (
                <option key={reasonItem.cd} value={reasonItem.cd}>
                  {reasonItem.cdNm}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.cancelReasonField}>
            <label htmlFor="returnReasonDetail" className={styles.cancelFieldLabel}>
              직접 기입
            </label>
            <textarea
              id="returnReasonDetail"
              className={styles.cancelReasonTextarea}
              rows={4}
              value={reasonDetail}
              placeholder="추가로 전달할 반품 사유가 있다면 입력해주세요."
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
        <h2 className={styles.detailSectionTitle}>반품 예정 금액</h2>
        <ShopMypageOrderAmountTable columnList={returnPreviewAmountColumnList} />
      </section>

      <div className={styles.cancelActionBar}>
        {infoMessage !== "" ? <p className={styles.cancelValidationMessage}>{infoMessage}</p> : null}
        <div className={styles.cancelActionButtonGroup}>
          <button type="button" className={styles.cancelSubmitButton} onClick={handleSubmit}>
            반품신청
          </button>
          <Link href="/mypage/order" className={styles.cancelListButton}>
            목록
          </Link>
        </div>
      </div>
    </section>
  );
}
