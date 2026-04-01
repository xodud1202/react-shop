import type {
  ShopMypageOrderAmountSummary,
  ShopMypageOrderDetailItem,
} from "@/domains/mypage/types";

// 상품별 클레임 금액 배분 결과 타입입니다.
export interface ShopMypageOrderClaimSliceAmount {
  supplyAmt: number;
  orderAmt: number;
  goodsDiscountAmt: number;
  goodsCouponDiscountAmt: number;
  cartCouponDiscountAmt: number;
  pointUseAmt: number;
}

// 주문 클레임 계산용 0원 금액 요약 객체를 생성합니다.
export function createEmptyShopMypageOrderAmountSummary(): ShopMypageOrderAmountSummary {
  return {
    totalSupplyAmt: 0,
    totalOrderAmt: 0,
    totalGoodsDiscountAmt: 0,
    totalGoodsCouponDiscountAmt: 0,
    totalCartCouponDiscountAmt: 0,
    totalCouponDiscountAmt: 0,
    totalPointUseAmt: 0,
    deliveryFeeAmt: 0,
    deliveryCouponDiscountAmt: 0,
    finalPayAmt: 0,
  };
}

// 숫자값을 0 이상의 정수로 보정합니다.
export function normalizeShopMypageOrderClaimInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(Math.floor(value), 0);
}

// 주문상세 행의 현재 잔여 수량을 0 이상 정수로 반환합니다.
export function resolveShopMypageOrderCurrentRemainingQty(detailItem: ShopMypageOrderDetailItem): number {
  return normalizeShopMypageOrderClaimInteger(detailItem.cancelableQty);
}

// 주문상세 행의 누적 배분 금액을 현재 잔여 수량 기준으로 계산합니다.
export function resolveShopMypageOrderCumulativeAllocatedAmt(
  totalAllocatedAmt: number,
  totalQty: number,
  appliedQty: number,
): number {
  const safeTotalAllocatedAmt = normalizeShopMypageOrderClaimInteger(totalAllocatedAmt);
  const safeTotalQty = Math.max(totalQty, 0);
  const safeAppliedQty = Math.max(Math.min(appliedQty, safeTotalQty), 0);
  if (safeTotalAllocatedAmt < 1 || safeTotalQty < 1 || safeAppliedQty < 1) {
    return 0;
  }
  if (safeAppliedQty >= safeTotalQty) {
    return safeTotalAllocatedAmt;
  }
  return Math.floor((safeTotalAllocatedAmt * safeAppliedQty) / safeTotalQty);
}

// 주문상세 행의 선택 수량 기준 금액/할인 배분값을 계산합니다.
export function buildShopMypageOrderSliceAmount(
  detailItem: ShopMypageOrderDetailItem,
  quantity: number,
  currentRemainingQty: number,
): ShopMypageOrderClaimSliceAmount {
  const safeCurrentRemainingQty = normalizeShopMypageOrderClaimInteger(currentRemainingQty);
  const resolvedQuantity = Math.min(Math.max(quantity, 0), safeCurrentRemainingQty);
  const supplyAmt = normalizeShopMypageOrderClaimInteger(detailItem.supplyAmt) * resolvedQuantity;
  const orderAmt =
    (normalizeShopMypageOrderClaimInteger(detailItem.saleAmt) +
      normalizeShopMypageOrderClaimInteger(detailItem.addAmt)) *
    resolvedQuantity;
  const goodsDiscountAmt = Math.max(supplyAmt - orderAmt, 0);

  // 현재 ORDER_DETAIL에 남아 있는 할인금액을 RMN_QTY 기준으로 비례 배분합니다.
  const goodsCouponDiscountAmt = resolveShopMypageOrderCumulativeAllocatedAmt(
    detailItem.goodsCouponDiscountAmt,
    safeCurrentRemainingQty,
    resolvedQuantity,
  );
  const cartCouponDiscountAmt = resolveShopMypageOrderCumulativeAllocatedAmt(
    detailItem.cartCouponDiscountAmt,
    safeCurrentRemainingQty,
    resolvedQuantity,
  );
  const pointUseAmt = resolveShopMypageOrderCumulativeAllocatedAmt(
    detailItem.pointUseAmt,
    safeCurrentRemainingQty,
    resolvedQuantity,
  );

  return {
    supplyAmt,
    orderAmt,
    goodsDiscountAmt,
    goodsCouponDiscountAmt,
    cartCouponDiscountAmt,
    pointUseAmt,
  };
}

// 주문상세 행의 선택 수량 반영 후 남을 금액/할인 배분값을 계산합니다.
export function buildShopMypageOrderRemainingSliceAmount(
  detailItem: ShopMypageOrderDetailItem,
  selectedQty: number,
  currentRemainingQty: number,
): ShopMypageOrderClaimSliceAmount {
  const safeCurrentRemainingQty = normalizeShopMypageOrderClaimInteger(currentRemainingQty);
  const resolvedSelectedQty = Math.min(Math.max(selectedQty, 0), safeCurrentRemainingQty);
  const remainingQty = Math.max(safeCurrentRemainingQty - resolvedSelectedQty, 0);
  const selectedSliceAmount = buildShopMypageOrderSliceAmount(detailItem, resolvedSelectedQty, safeCurrentRemainingQty);
  const supplyAmt = normalizeShopMypageOrderClaimInteger(detailItem.supplyAmt) * remainingQty;
  const orderAmt =
    (normalizeShopMypageOrderClaimInteger(detailItem.saleAmt) +
      normalizeShopMypageOrderClaimInteger(detailItem.addAmt)) *
    remainingQty;
  const goodsDiscountAmt = Math.max(supplyAmt - orderAmt, 0);

  // 현재 ORDER_DETAIL에 남아 있는 할인금액에서 이번 선택분만 제외해 남은 금액을 계산합니다.
  return {
    supplyAmt,
    orderAmt,
    goodsDiscountAmt,
    goodsCouponDiscountAmt: Math.max(
      normalizeShopMypageOrderClaimInteger(detailItem.goodsCouponDiscountAmt) - selectedSliceAmount.goodsCouponDiscountAmt,
      0,
    ),
    cartCouponDiscountAmt: Math.max(
      normalizeShopMypageOrderClaimInteger(detailItem.cartCouponDiscountAmt) - selectedSliceAmount.cartCouponDiscountAmt,
      0,
    ),
    pointUseAmt: Math.max(
      normalizeShopMypageOrderClaimInteger(detailItem.pointUseAmt) - selectedSliceAmount.pointUseAmt,
      0,
    ),
  };
}

// 금액 요약 객체에 행 금액을 누적합니다.
export function accumulateShopMypageOrderAmountSummary(
  target: ShopMypageOrderAmountSummary,
  sliceAmount: ShopMypageOrderClaimSliceAmount,
): void {
  target.totalSupplyAmt += sliceAmount.supplyAmt;
  target.totalOrderAmt += sliceAmount.orderAmt;
  target.totalGoodsDiscountAmt += sliceAmount.goodsDiscountAmt;
  target.totalGoodsCouponDiscountAmt += sliceAmount.goodsCouponDiscountAmt;
  target.totalCartCouponDiscountAmt += sliceAmount.cartCouponDiscountAmt;
  target.totalCouponDiscountAmt += sliceAmount.goodsCouponDiscountAmt + sliceAmount.cartCouponDiscountAmt;
  target.totalPointUseAmt += sliceAmount.pointUseAmt;
}
