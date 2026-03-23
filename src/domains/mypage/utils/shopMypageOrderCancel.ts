import type {
  ShopMypageOrderAmountSummary,
  ShopMypageOrderCancelSiteInfo,
  ShopMypageOrderDetailItem,
  ShopMypageOrderGroup,
} from "@/domains/mypage/types";

export type ShopMypageOrderCancelMode = "full" | "partial";

export interface ShopMypageOrderCancelSelectionItem {
  selected: boolean;
  cancelQty: number;
}

export type ShopMypageOrderCancelSelectionMap = Record<number, ShopMypageOrderCancelSelectionItem>;

export interface ShopMypageOrderCancelPreviewSummary {
  totalSupplyAmt: number;
  totalOrderAmt: number;
  totalGoodsDiscountAmt: number;
  totalGoodsCouponDiscountAmt: number;
  totalCartCouponDiscountAmt: number;
  totalPointRefundAmt: number;
  deliveryCouponRefundAmt: number;
  paidGoodsAmt: number;
  benefitAmt: number;
  shippingAdjustmentAmt: number;
  expectedRefundAmt: number;
}

export interface ShopMypageOrderCancelPreviewResult {
  remainingAmountSummary: ShopMypageOrderAmountSummary;
  cancelPreviewSummary: ShopMypageOrderCancelPreviewSummary;
  isFullCancel: boolean;
  selectedItemCount: number;
  selectedQtyCount: number;
  cashRefundAmt: number;
  canSubmit: boolean;
  submitBlockMessage: string;
}

export interface ShopMypageOrderCancelTarget {
  cancelMode: ShopMypageOrderCancelMode;
  initialOrdDtlNo: number | null;
}

const WAITING_DEPOSIT_STATUS = "ORD_DTL_STAT_01";
const PAYMENT_COMPLETED_STATUS = "ORD_DTL_STAT_02";

// 주문취소 계산용 0원 금액 요약 객체를 생성합니다.
function createEmptyOrderAmountSummary(): ShopMypageOrderAmountSummary {
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

// 주문취소 미리보기용 0원 요약 객체를 생성합니다.
function createEmptyCancelPreviewSummary(): ShopMypageOrderCancelPreviewSummary {
  return {
    totalSupplyAmt: 0,
    totalOrderAmt: 0,
    totalGoodsDiscountAmt: 0,
    totalGoodsCouponDiscountAmt: 0,
    totalCartCouponDiscountAmt: 0,
    totalPointRefundAmt: 0,
    deliveryCouponRefundAmt: 0,
    paidGoodsAmt: 0,
    benefitAmt: 0,
    shippingAdjustmentAmt: 0,
    expectedRefundAmt: 0,
  };
}

// 숫자값을 0 이상의 정수로 보정합니다.
function normalizeNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(Math.floor(value), 0);
}

// 주문상세 행의 현재 잔여 수량을 0 이상 정수로 반환합니다.
function resolveCurrentRemainingQty(detailItem: ShopMypageOrderDetailItem): number {
  return normalizeNonNegativeInteger(detailItem.cancelableQty);
}

// 주문상세 행이 부분취소 선택 가능한 상태인지 반환합니다.
export function isShopMypageOrderPartialCancelable(detailItem: ShopMypageOrderDetailItem): boolean {
  return detailItem.ordDtlStatCd === PAYMENT_COMPLETED_STATUS && resolveCurrentRemainingQty(detailItem) > 0;
}

// 주문상세 행이 전체취소 진입 기준 상태인지 반환합니다.
export function isShopMypageOrderFullCancelOnly(detailItem: ShopMypageOrderDetailItem): boolean {
  return detailItem.ordDtlStatCd === WAITING_DEPOSIT_STATUS && resolveCurrentRemainingQty(detailItem) > 0;
}

// 주문상세 행이 현재 남아 있는 활성 상품인지 반환합니다.
export function isShopMypageOrderActiveDetail(detailItem: ShopMypageOrderDetailItem): boolean {
  return resolveCurrentRemainingQty(detailItem) > 0;
}

// 주문취소 화면 진입 기준 상품과 취소 모드를 계산합니다.
export function resolveShopMypageOrderCancelTarget(
  order: ShopMypageOrderGroup | null,
  preferredOrdDtlNo?: number,
): ShopMypageOrderCancelTarget {
  const emptyResult: ShopMypageOrderCancelTarget = {
    cancelMode: "partial",
    initialOrdDtlNo: null,
  };
  if (!order || order.detailList.length === 0) {
    return emptyResult;
  }

  // 요청 주문상세번호가 취소 가능 상품이면 우선 사용합니다.
  if (typeof preferredOrdDtlNo === "number" && Number.isFinite(preferredOrdDtlNo) && preferredOrdDtlNo > 0) {
    const preferredDetail = order.detailList.find(
      (detailItem) =>
        detailItem.ordDtlNo === preferredOrdDtlNo &&
        (isShopMypageOrderFullCancelOnly(detailItem) || isShopMypageOrderPartialCancelable(detailItem)),
    );
    if (preferredDetail) {
      return {
        cancelMode: isShopMypageOrderFullCancelOnly(preferredDetail) ? "full" : "partial",
        initialOrdDtlNo: preferredDetail.ordDtlNo,
      };
    }
  }

  // 요청 주문상세번호가 없거나 사용할 수 없으면 첫 번째 취소 가능 상품을 기본값으로 사용합니다.
  const firstCancelableDetail = order.detailList.find(
    (detailItem) => isShopMypageOrderFullCancelOnly(detailItem) || isShopMypageOrderPartialCancelable(detailItem),
  );
  if (!firstCancelableDetail) {
    return emptyResult;
  }

  return {
    cancelMode: isShopMypageOrderFullCancelOnly(firstCancelableDetail) ? "full" : "partial",
    initialOrdDtlNo: firstCancelableDetail.ordDtlNo,
  };
}

// 주문취소 화면 초기 선택 상태 맵을 생성합니다.
export function createInitialShopMypageOrderCancelSelectionMap(
  order: ShopMypageOrderGroup | null,
  cancelMode: ShopMypageOrderCancelMode,
  initialOrdDtlNo: number | null,
): ShopMypageOrderCancelSelectionMap {
  const result: ShopMypageOrderCancelSelectionMap = {};
  if (!order) {
    return result;
  }

  // 취소 모드에 맞게 전체선택 또는 1건 기본 선택 상태를 구성합니다.
  for (const detailItem of order.detailList) {
    const currentRemainingQty = resolveCurrentRemainingQty(detailItem);
    if (cancelMode === "full") {
      result[detailItem.ordDtlNo] = {
        selected: currentRemainingQty > 0,
        cancelQty: currentRemainingQty,
      };
      continue;
    }

    const selected = isShopMypageOrderPartialCancelable(detailItem) && detailItem.ordDtlNo === initialOrdDtlNo;
    result[detailItem.ordDtlNo] = {
      selected,
      cancelQty: selected ? currentRemainingQty : 0,
    };
  }
  return result;
}

// 주문상세 행 수량 입력값을 현재 취소 가능 수량 범위로 보정합니다.
export function clampShopMypageOrderCancelQty(detailItem: ShopMypageOrderDetailItem, quantity: number): number {
  const currentRemainingQty = resolveCurrentRemainingQty(detailItem);
  if (currentRemainingQty < 1) {
    return 0;
  }
  if (!Number.isFinite(quantity)) {
    return 1;
  }
  return Math.min(Math.max(Math.floor(quantity), 1), currentRemainingQty);
}

// 주문상세 행의 현재 선택 상태를 기본값 포함 안전하게 반환합니다.
export function resolveShopMypageOrderCancelSelectionItem(
  selectionMap: ShopMypageOrderCancelSelectionMap,
  detailItem: ShopMypageOrderDetailItem,
): ShopMypageOrderCancelSelectionItem {
  const resolvedSelectionItem = selectionMap[detailItem.ordDtlNo];
  if (!resolvedSelectionItem) {
    return {
      selected: false,
      cancelQty: 0,
    };
  }

  return {
    selected: resolvedSelectionItem.selected,
    cancelQty: resolvedSelectionItem.selected
      ? clampShopMypageOrderCancelQty(detailItem, resolvedSelectionItem.cancelQty)
      : 0,
  };
}

interface ShopMypageOrderSliceAmount {
  supplyAmt: number;
  orderAmt: number;
  goodsDiscountAmt: number;
  goodsCouponDiscountAmt: number;
  cartCouponDiscountAmt: number;
  pointUseAmt: number;
}

// 주문상세 행의 누적 배분 금액을 원주문 수량 기준으로 계산합니다.
function resolveShopMypageOrderCumulativeAllocatedAmt(totalAllocatedAmt: number, totalQty: number, appliedQty: number): number {
  const safeTotalAllocatedAmt = normalizeNonNegativeInteger(totalAllocatedAmt);
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

// 주문상세 행의 특정 수량 기준 금액/할인 배분값을 계산합니다.
function buildShopMypageOrderSliceAmount(
  detailItem: ShopMypageOrderDetailItem,
  quantity: number,
  canceledBeforeQty: number,
): ShopMypageOrderSliceAmount {
  const originalQty = normalizeNonNegativeInteger(detailItem.ordQty);
  const resolvedCanceledBeforeQty = Math.max(Math.min(canceledBeforeQty, originalQty), 0);
  const remainingQty = Math.max(originalQty - resolvedCanceledBeforeQty, 0);
  const resolvedQuantity = Math.min(Math.max(quantity, 0), remainingQty);
  const supplyAmt = normalizeNonNegativeInteger(detailItem.supplyAmt) * resolvedQuantity;
  const orderAmt =
    (normalizeNonNegativeInteger(detailItem.saleAmt) + normalizeNonNegativeInteger(detailItem.addAmt)) * resolvedQuantity;
  const goodsDiscountAmt = Math.max(supplyAmt - orderAmt, 0);

  // 누적 취소 전/후 배분 차이만큼 이번 수량의 쿠폰/포인트 금액을 계산합니다.
  const goodsCouponDiscountAmt =
    resolveShopMypageOrderCumulativeAllocatedAmt(
      detailItem.goodsCouponDiscountAmt,
      originalQty,
      resolvedCanceledBeforeQty + resolvedQuantity,
    ) - resolveShopMypageOrderCumulativeAllocatedAmt(detailItem.goodsCouponDiscountAmt, originalQty, resolvedCanceledBeforeQty);
  const cartCouponDiscountAmt =
    resolveShopMypageOrderCumulativeAllocatedAmt(
      detailItem.cartCouponDiscountAmt,
      originalQty,
      resolvedCanceledBeforeQty + resolvedQuantity,
    ) - resolveShopMypageOrderCumulativeAllocatedAmt(detailItem.cartCouponDiscountAmt, originalQty, resolvedCanceledBeforeQty);
  const pointUseAmt =
    resolveShopMypageOrderCumulativeAllocatedAmt(detailItem.pointUseAmt, originalQty, resolvedCanceledBeforeQty + resolvedQuantity) -
    resolveShopMypageOrderCumulativeAllocatedAmt(detailItem.pointUseAmt, originalQty, resolvedCanceledBeforeQty);

  return {
    supplyAmt,
    orderAmt,
    goodsDiscountAmt,
    goodsCouponDiscountAmt,
    cartCouponDiscountAmt,
    pointUseAmt,
  };
}

// 금액 요약 객체에 행 금액을 누적합니다.
function accumulateOrderAmountSummary(
  target: ShopMypageOrderAmountSummary,
  sliceAmount: ShopMypageOrderSliceAmount,
): void {
  target.totalSupplyAmt += sliceAmount.supplyAmt;
  target.totalOrderAmt += sliceAmount.orderAmt;
  target.totalGoodsDiscountAmt += sliceAmount.goodsDiscountAmt;
  target.totalGoodsCouponDiscountAmt += sliceAmount.goodsCouponDiscountAmt;
  target.totalCartCouponDiscountAmt += sliceAmount.cartCouponDiscountAmt;
  target.totalCouponDiscountAmt += sliceAmount.goodsCouponDiscountAmt + sliceAmount.cartCouponDiscountAmt;
  target.totalPointUseAmt += sliceAmount.pointUseAmt;
}

// 취소 미리보기 요약 객체에 행 금액을 누적합니다.
function accumulateCancelPreviewSummary(
  target: ShopMypageOrderCancelPreviewSummary,
  sliceAmount: ShopMypageOrderSliceAmount,
): void {
  target.totalSupplyAmt += sliceAmount.supplyAmt;
  target.totalOrderAmt += sliceAmount.orderAmt;
  target.totalGoodsDiscountAmt += sliceAmount.goodsDiscountAmt;
  target.totalGoodsCouponDiscountAmt += sliceAmount.goodsCouponDiscountAmt;
  target.totalCartCouponDiscountAmt += sliceAmount.cartCouponDiscountAmt;
  target.totalPointRefundAmt += sliceAmount.pointUseAmt;
}

// 주문취소 미리보기 결과를 계산합니다.
export function buildShopMypageOrderCancelPreviewResult(
  order: ShopMypageOrderGroup | null,
  amountSummary: ShopMypageOrderAmountSummary,
  siteInfo: ShopMypageOrderCancelSiteInfo,
  selectionMap: ShopMypageOrderCancelSelectionMap,
): ShopMypageOrderCancelPreviewResult {
  const remainingAmountSummary = createEmptyOrderAmountSummary();
  const cancelPreviewSummary = createEmptyCancelPreviewSummary();
  if (!order) {
    return {
      remainingAmountSummary,
      cancelPreviewSummary,
      isFullCancel: false,
      selectedItemCount: 0,
      selectedQtyCount: 0,
      cashRefundAmt: 0,
      canSubmit: false,
      submitBlockMessage: "주문 정보를 확인해주세요.",
    };
  }

  let selectedItemCount = 0;
  let selectedQtyCount = 0;
  let activeItemCount = 0;
  let activeOrderAmt = 0;

  // 각 행을 취소 수량과 남는 수량으로 분리해 금액 요약을 계산합니다.
  for (const detailItem of order.detailList) {
    const originalQty = normalizeNonNegativeInteger(detailItem.ordQty);
    const currentRemainingQty = resolveCurrentRemainingQty(detailItem);
    if (currentRemainingQty < 1) {
      continue;
    }
    activeItemCount += 1;
    activeOrderAmt += (normalizeNonNegativeInteger(detailItem.saleAmt) + normalizeNonNegativeInteger(detailItem.addAmt)) * currentRemainingQty;
    const canceledBeforeQty = Math.max(originalQty - currentRemainingQty, 0);

    const selectionItem = resolveShopMypageOrderCancelSelectionItem(selectionMap, detailItem);
    const cancelQty = selectionItem.selected ? clampShopMypageOrderCancelQty(detailItem, selectionItem.cancelQty) : 0;
    const remainingQty = Math.max(currentRemainingQty - cancelQty, 0);

    if (cancelQty > 0) {
      selectedItemCount += 1;
      selectedQtyCount += cancelQty;
      accumulateCancelPreviewSummary(cancelPreviewSummary, buildShopMypageOrderSliceAmount(detailItem, cancelQty, canceledBeforeQty));
    }
    if (remainingQty > 0) {
      accumulateOrderAmountSummary(
        remainingAmountSummary,
        buildShopMypageOrderSliceAmount(detailItem, remainingQty, canceledBeforeQty),
      );
    }
  }

  const isFullCancel = activeItemCount > 0 && remainingAmountSummary.totalOrderAmt === 0;
  const originalBaseDeliveryFee = normalizeNonNegativeInteger(amountSummary.deliveryFeeAmt);
  const originalDeliveryCouponDiscountAmt = normalizeNonNegativeInteger(amountSummary.deliveryCouponDiscountAmt);
  const wasFreeShippingByLimit = originalBaseDeliveryFee === 0 && activeOrderAmt > 0;
  const siteDeliveryFee = normalizeNonNegativeInteger(siteInfo.deliveryFee);
  const siteDeliveryFeeLimit = normalizeNonNegativeInteger(siteInfo.deliveryFeeLimit);

  // 남는 주문 금액 표에 표시할 배송비/배송비쿠폰/최종결제금액을 계산합니다.
  const remainingBaseDeliveryFee =
    remainingAmountSummary.totalOrderAmt < 1
      ? 0
      : originalBaseDeliveryFee > 0
        ? originalBaseDeliveryFee
        : remainingAmountSummary.totalOrderAmt < siteDeliveryFeeLimit
          ? siteDeliveryFee
          : 0;
  const remainingDeliveryCouponDiscountAmt =
    remainingAmountSummary.totalOrderAmt < 1 || remainingBaseDeliveryFee < 1
      ? 0
      : Math.min(originalDeliveryCouponDiscountAmt, remainingBaseDeliveryFee);
  remainingAmountSummary.deliveryFeeAmt = remainingBaseDeliveryFee;
  remainingAmountSummary.deliveryCouponDiscountAmt = remainingDeliveryCouponDiscountAmt;
  remainingAmountSummary.finalPayAmt = Math.max(
    remainingAmountSummary.totalOrderAmt +
      remainingBaseDeliveryFee -
      remainingAmountSummary.totalCouponDiscountAmt -
      remainingDeliveryCouponDiscountAmt -
      remainingAmountSummary.totalPointUseAmt,
    0,
  );

  // 취소 미리보기 표에 표시할 환급 혜택/배송비 조정/최종 금액을 계산합니다.
  const deliveryCouponRefundAmt = isFullCancel ? originalDeliveryCouponDiscountAmt : 0;
  const paidDeliveryFeeRefundAmt = isFullCancel ? Math.max(originalBaseDeliveryFee - originalDeliveryCouponDiscountAmt, 0) : 0;
  const shippingDeductionAmt =
    !isFullCancel &&
    selectedItemCount > 0 &&
    wasFreeShippingByLimit &&
    remainingAmountSummary.totalOrderAmt > 0 &&
    remainingAmountSummary.totalOrderAmt < siteDeliveryFeeLimit
      ? siteDeliveryFee
      : 0;
  cancelPreviewSummary.deliveryCouponRefundAmt = deliveryCouponRefundAmt;
  cancelPreviewSummary.paidGoodsAmt = Math.max(
    cancelPreviewSummary.totalOrderAmt -
      cancelPreviewSummary.totalGoodsCouponDiscountAmt -
      cancelPreviewSummary.totalCartCouponDiscountAmt -
      cancelPreviewSummary.totalPointRefundAmt,
    0,
  );
  cancelPreviewSummary.benefitAmt = cancelPreviewSummary.totalPointRefundAmt + deliveryCouponRefundAmt;
  cancelPreviewSummary.shippingAdjustmentAmt = paidDeliveryFeeRefundAmt - shippingDeductionAmt;
  cancelPreviewSummary.expectedRefundAmt =
    cancelPreviewSummary.paidGoodsAmt + cancelPreviewSummary.benefitAmt + cancelPreviewSummary.shippingAdjustmentAmt;
  const cashRefundAmt = cancelPreviewSummary.paidGoodsAmt + cancelPreviewSummary.shippingAdjustmentAmt;

  // 취소신청 가능 여부와 차단 메시지를 계산합니다.
  let submitBlockMessage = "";
  if (selectedItemCount < 1 || selectedQtyCount < 1) {
    submitBlockMessage = "취소할 상품을 선택해주세요.";
  } else if (cashRefundAmt < 0) {
    submitBlockMessage = "배송비 차감 후 취소 예정 금액이 0원 미만이라 신청할 수 없습니다.";
  }

  return {
    remainingAmountSummary,
    cancelPreviewSummary,
    isFullCancel,
    selectedItemCount,
    selectedQtyCount,
    cashRefundAmt,
    canSubmit: submitBlockMessage === "",
    submitBlockMessage,
  };
}
