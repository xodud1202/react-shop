import type {
  ShopMypageOrderAmountSummary,
  ShopMypageOrderCancelSiteInfo,
  ShopMypageOrderDetailItem,
  ShopMypageOrderGroup,
  ShopMypageOrderItemReasonMap,
  ShopMypageOrderReturnFeeContext,
  ShopMypageOrderReturnReasonItem,
} from "@/domains/mypage/types";
import {
  buildShopMypageOrderRemainingSliceAmount,
  buildShopMypageOrderSliceAmount,
  createEmptyShopMypageOrderAmountSummary,
  normalizeShopMypageOrderClaimInteger,
  resolveShopMypageOrderCurrentRemainingQty,
  type ShopMypageOrderClaimSliceAmount,
} from "@/domains/mypage/utils/shopMypageOrderClaimAmount";
import {
  resolveShopMypageOrderItemReasonState,
  resolveShopMypageOrderItemReasonValidationMessage,
} from "@/domains/mypage/utils/shopMypageOrderClaimReason";
import {
  clampShopMypageOrderCancelQty,
  resolveShopMypageOrderCancelSelectionItem,
  type ShopMypageOrderCancelSelectionItem,
  type ShopMypageOrderCancelSelectionMap,
} from "@/domains/mypage/utils/shopMypageOrderCancel";

export type ShopMypageOrderReturnSelectionItem = ShopMypageOrderCancelSelectionItem;
export type ShopMypageOrderReturnSelectionMap = ShopMypageOrderCancelSelectionMap;

// 반품 예정 금액 요약 타입입니다.
export interface ShopMypageOrderReturnPreviewSummary {
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

// 반품 예정 금액 계산 결과 타입입니다.
export interface ShopMypageOrderReturnPreviewResult {
  remainingAmountSummary: ShopMypageOrderAmountSummary;
  returnPreviewSummary: ShopMypageOrderReturnPreviewSummary;
  isFullReturn: boolean;
  selectedItemCount: number;
  selectedQtyCount: number;
  cashRefundAmt: number;
  canSubmit: boolean;
  submitBlockMessage: string;
  previewVisible: boolean;
}

// 반품 신청 기본 선택 대상 타입입니다.
export interface ShopMypageOrderReturnTarget {
  initialOrdDtlNo: number | null;
}

const DELIVERY_COMPLETED_STATUS = "ORD_DTL_STAT_06";
const COMPANY_FAULT_REASON_PREFIX = "R_2";

// 반품 미리보기용 0원 요약 객체를 생성합니다.
function createEmptyShopMypageOrderReturnPreviewSummary(): ShopMypageOrderReturnPreviewSummary {
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

// 반품 미리보기 요약 객체에 행 금액을 누적합니다.
function accumulateShopMypageOrderReturnPreviewSummary(
  target: ShopMypageOrderReturnPreviewSummary,
  sliceAmount: ShopMypageOrderClaimSliceAmount,
): void {
  target.totalSupplyAmt += sliceAmount.supplyAmt;
  target.totalOrderAmt += sliceAmount.orderAmt;
  target.totalGoodsDiscountAmt += sliceAmount.goodsDiscountAmt;
  target.totalGoodsCouponDiscountAmt += sliceAmount.goodsCouponDiscountAmt;
  target.totalCartCouponDiscountAmt += sliceAmount.cartCouponDiscountAmt;
  target.totalPointRefundAmt += sliceAmount.pointUseAmt;
}

// 주문상세 행의 반품 가능 잔여 수량을 0 이상 정수로 보정합니다.
function resolveShopMypageOrderReturnableQty(detailItem: ShopMypageOrderDetailItem): number {
  return resolveShopMypageOrderCurrentRemainingQty(detailItem);
}

// 주문상세 행에 반품/교환 진행 중 클레임이 있는지 반환합니다.
export function hasShopMypageOrderBlockedClaim(detailItem: ShopMypageOrderDetailItem): boolean {
  return detailItem.activeReturnClaimYn || detailItem.activeExchangeClaimYn;
}

// 주문상세 행이 반품신청 가능한 상태인지 반환합니다.
export function isShopMypageOrderReturnable(detailItem: ShopMypageOrderDetailItem): boolean {
  return (
    detailItem.ordDtlStatCd === DELIVERY_COMPLETED_STATUS &&
    !hasShopMypageOrderBlockedClaim(detailItem) &&
    detailItem.returnApplyableYn &&
    resolveShopMypageOrderReturnableQty(detailItem) > 0
  );
}

// 반품 신청 화면 진입 기준 상품을 계산합니다.
export function resolveShopMypageOrderReturnTarget(
  order: ShopMypageOrderGroup | null,
  preferredOrdDtlNo?: number,
): ShopMypageOrderReturnTarget {
  if (!order || order.detailList.length === 0) {
    return { initialOrdDtlNo: null };
  }

  // 요청 주문상세번호가 반품 가능 상품이면 우선 선택합니다.
  if (typeof preferredOrdDtlNo === "number" && Number.isFinite(preferredOrdDtlNo) && preferredOrdDtlNo > 0) {
    const preferredDetail = order.detailList.find(
      (detailItem) => detailItem.ordDtlNo === preferredOrdDtlNo && isShopMypageOrderReturnable(detailItem),
    );
    if (preferredDetail) {
      return { initialOrdDtlNo: preferredDetail.ordDtlNo };
    }
  }

  // 요청 주문상세번호가 없으면 첫 번째 반품 가능 상품을 기본 선택합니다.
  const firstReturnableDetail = order.detailList.find((detailItem) => isShopMypageOrderReturnable(detailItem));
  return {
    initialOrdDtlNo: firstReturnableDetail?.ordDtlNo ?? null,
  };
}

// 반품 신청 화면 초기 선택 상태 맵을 생성합니다.
export function createInitialShopMypageOrderReturnSelectionMap(
  order: ShopMypageOrderGroup | null,
  initialOrdDtlNo: number | null,
): ShopMypageOrderReturnSelectionMap {
  const result: ShopMypageOrderReturnSelectionMap = {};
  if (!order) {
    return result;
  }

  // 기본 선택 상품 1건만 체크 상태로 초기화합니다.
  for (const detailItem of order.detailList) {
    const selected = isShopMypageOrderReturnable(detailItem) && detailItem.ordDtlNo === initialOrdDtlNo;
    result[detailItem.ordDtlNo] = {
      selected,
      cancelQty: selected ? resolveShopMypageOrderReturnableQty(detailItem) : 0,
    };
  }
  return result;
}

// 반품 수량 입력값을 허용 범위 안으로 보정합니다.
export function clampShopMypageOrderReturnQty(detailItem: ShopMypageOrderDetailItem, quantity: number): number {
  return clampShopMypageOrderCancelQty(detailItem, quantity);
}

// 주문상세 행의 현재 반품 선택 상태를 기본값과 함께 반환합니다.
export function resolveShopMypageOrderReturnSelectionItem(
  selectionMap: ShopMypageOrderReturnSelectionMap,
  detailItem: ShopMypageOrderDetailItem,
): ShopMypageOrderReturnSelectionItem {
  return resolveShopMypageOrderCancelSelectionItem(selectionMap, detailItem);
}

// 선택된 반품 상품에 회사 귀책 사유가 포함되어 있는지 반환합니다.
function hasCompanyFaultReasonSelection(
  selectedOrdDtlNoList: number[],
  itemReasonMap: ShopMypageOrderItemReasonMap,
): boolean {
  return selectedOrdDtlNoList.some((ordDtlNo) =>
    resolveShopMypageOrderItemReasonState(itemReasonMap, ordDtlNo).reasonCd.trim().startsWith(COMPANY_FAULT_REASON_PREFIX),
  );
}

// 반품 후 잔여 결제금액 기준 배송비 차감액을 계산합니다.
function resolveShopMypageOrderReturnShippingDeductionAmt(
  siteInfo: ShopMypageOrderCancelSiteInfo,
  returnFeeContext: ShopMypageOrderReturnFeeContext,
  beforeShippingExpectedRefundAmt: number,
  hasCompanyFaultReason: boolean,
): number {
  const siteDeliveryFee = normalizeShopMypageOrderClaimInteger(siteInfo.deliveryFee);
  const siteDeliveryFeeLimit = normalizeShopMypageOrderClaimInteger(siteInfo.deliveryFeeLimit);
  if (siteDeliveryFee < 1 || hasCompanyFaultReason) {
    return 0;
  }

  // 유료배송 주문의 고객 귀책 반품은 항상 회수비용 1회만 차감합니다.
  if (!returnFeeContext.originalFreeDeliveryYn) {
    return siteDeliveryFee;
  }

  // 무료배송 주문은 회사 귀책/기존 차감 이력이 있으면 원배송비 재청구 없이 회수비용만 차감합니다.
  if (
    returnFeeContext.hasPriorCompanyFaultReturnOrExchange ||
    returnFeeContext.hasPriorCustomerFaultReturnDeduction
  ) {
    return siteDeliveryFee;
  }

  // 무료배송 주문은 반품 후 잔여 결제금액이 기준 미만으로 내려갈 때만 왕복 배송비를 차감합니다.
  const remainingFinalPayAmtAfterReturn =
    normalizeShopMypageOrderClaimInteger(returnFeeContext.currentRemainingFinalPayAmt) - beforeShippingExpectedRefundAmt;
  return remainingFinalPayAmtAfterReturn < siteDeliveryFeeLimit ? siteDeliveryFee * 2 : siteDeliveryFee;
}

// 반품 신청 화면의 환불 예정 금액 미리보기 결과를 계산합니다.
export function buildShopMypageOrderReturnPreviewResult(
  order: ShopMypageOrderGroup | null,
  amountSummary: ShopMypageOrderAmountSummary,
  siteInfo: ShopMypageOrderCancelSiteInfo,
  returnFeeContext: ShopMypageOrderReturnFeeContext,
  selectionMap: ShopMypageOrderReturnSelectionMap,
  itemReasonMap: ShopMypageOrderItemReasonMap,
  reasonList: ShopMypageOrderReturnReasonItem[],
): ShopMypageOrderReturnPreviewResult {
  const remainingAmountSummary = createEmptyShopMypageOrderAmountSummary();
  const returnPreviewSummary = createEmptyShopMypageOrderReturnPreviewSummary();
  if (!order) {
    return {
      remainingAmountSummary,
      returnPreviewSummary,
      isFullReturn: false,
      selectedItemCount: 0,
      selectedQtyCount: 0,
      cashRefundAmt: 0,
      canSubmit: false,
      submitBlockMessage: "주문 정보를 확인해주세요.",
      previewVisible: false,
    };
  }

  let activeItemCount = 0;
  let fullyReturnedItemCount = 0;
  let selectedItemCount = 0;
  let selectedQtyCount = 0;
  const selectedOrdDtlNoList: number[] = [];

  // 각 행을 반품 수량과 남는 수량으로 분리해 반품 예정 금액을 계산합니다.
  for (const detailItem of order.detailList) {
    const currentRemainingQty = resolveShopMypageOrderCurrentRemainingQty(detailItem);
    if (currentRemainingQty < 1) {
      continue;
    }

    activeItemCount += 1;
    const selectionItem = resolveShopMypageOrderReturnSelectionItem(selectionMap, detailItem);
    const returnQty = selectionItem.selected ? selectionItem.cancelQty : 0;
    const remainingQty = Math.max(currentRemainingQty - returnQty, 0);

    if (returnQty > 0) {
      selectedItemCount += 1;
      selectedQtyCount += returnQty;
      selectedOrdDtlNoList.push(detailItem.ordDtlNo);
      accumulateShopMypageOrderReturnPreviewSummary(
        returnPreviewSummary,
        buildShopMypageOrderSliceAmount(detailItem, returnQty, currentRemainingQty),
      );
      if (remainingQty < 1) {
        fullyReturnedItemCount += 1;
      }
    }

    // 현재 주문 금액 요약과 동일한 방식으로 반품 후 남을 금액 요약을 유지합니다.
    if (remainingQty > 0) {
      const remainingSliceAmount = buildShopMypageOrderRemainingSliceAmount(detailItem, returnQty, currentRemainingQty);
      remainingAmountSummary.totalSupplyAmt += remainingSliceAmount.supplyAmt;
      remainingAmountSummary.totalOrderAmt += remainingSliceAmount.orderAmt;
      remainingAmountSummary.totalGoodsDiscountAmt += remainingSliceAmount.goodsDiscountAmt;
      remainingAmountSummary.totalGoodsCouponDiscountAmt += remainingSliceAmount.goodsCouponDiscountAmt;
      remainingAmountSummary.totalCartCouponDiscountAmt += remainingSliceAmount.cartCouponDiscountAmt;
      remainingAmountSummary.totalCouponDiscountAmt +=
        remainingSliceAmount.goodsCouponDiscountAmt + remainingSliceAmount.cartCouponDiscountAmt;
      remainingAmountSummary.totalPointUseAmt += remainingSliceAmount.pointUseAmt;
    }
  }

  const isFullReturn = activeItemCount > 0 && selectedItemCount > 0 && fullyReturnedItemCount === activeItemCount;
  const selectedItemValidationMessage =
    selectedItemCount < 1 ? "반품할 상품을 선택해주세요." : "";
  const reasonValidationMessage =
    selectedItemValidationMessage !== ""
      ? ""
      : resolveShopMypageOrderItemReasonValidationMessage(
          selectedOrdDtlNoList,
          itemReasonMap,
          reasonList,
          "사유를 선택하시면 환불 예정 금액이 보여집니다.",
          "기타 사유를 입력해주세요.",
        );
  if (selectedItemValidationMessage !== "" || reasonValidationMessage !== "") {
    return {
      remainingAmountSummary,
      returnPreviewSummary,
      isFullReturn,
      selectedItemCount,
      selectedQtyCount,
      cashRefundAmt: 0,
      canSubmit: false,
      submitBlockMessage: selectedItemValidationMessage || reasonValidationMessage,
      previewVisible: false,
    };
  }

  const hasCompanyFaultReason = hasCompanyFaultReasonSelection(selectedOrdDtlNoList, itemReasonMap);
  const beforeShippingExpectedRefundAmt =
    returnPreviewSummary.totalOrderAmt -
    (returnPreviewSummary.totalGoodsCouponDiscountAmt +
      returnPreviewSummary.totalCartCouponDiscountAmt +
      returnPreviewSummary.totalPointRefundAmt);
  const shippingDeductionAmt = resolveShopMypageOrderReturnShippingDeductionAmt(
    siteInfo,
    returnFeeContext,
    beforeShippingExpectedRefundAmt,
    hasCompanyFaultReason,
  );
  const deliveryCouponRefundAmt = isFullReturn
    ? normalizeShopMypageOrderClaimInteger(amountSummary.deliveryCouponDiscountAmt)
    : 0;
  const paidDeliveryFeeRefundAmt = isFullReturn
    ? normalizeShopMypageOrderClaimInteger(returnFeeContext.originalPaidDeliveryAmt)
    : 0;
  returnPreviewSummary.deliveryCouponRefundAmt = deliveryCouponRefundAmt;
  returnPreviewSummary.paidGoodsAmt = returnPreviewSummary.totalOrderAmt;
  returnPreviewSummary.benefitAmt =
    returnPreviewSummary.totalGoodsCouponDiscountAmt +
    returnPreviewSummary.totalCartCouponDiscountAmt +
    returnPreviewSummary.totalPointRefundAmt;
  returnPreviewSummary.shippingAdjustmentAmt = paidDeliveryFeeRefundAmt - shippingDeductionAmt;
  returnPreviewSummary.expectedRefundAmt =
    returnPreviewSummary.paidGoodsAmt -
    returnPreviewSummary.benefitAmt +
    returnPreviewSummary.shippingAdjustmentAmt;

  const cashRefundAmt = returnPreviewSummary.expectedRefundAmt;
  const submitBlockMessage =
    cashRefundAmt < 0 ? "배송비 차감 후 반품 예정 금액이 0원 미만이라 신청할 수 없습니다." : "";
  return {
    remainingAmountSummary,
    returnPreviewSummary,
    isFullReturn,
    selectedItemCount,
    selectedQtyCount,
    cashRefundAmt,
    canSubmit: submitBlockMessage === "",
    submitBlockMessage,
    previewVisible: true,
  };
}
