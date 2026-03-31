import type {
  ShopMypageOrderAmountSummary,
  ShopMypageOrderCancelSiteInfo,
  ShopMypageOrderDetailItem,
  ShopMypageOrderGroup,
} from "@/domains/mypage/types";
import {
  buildShopMypageOrderCancelPreviewResult,
  clampShopMypageOrderCancelQty,
  resolveShopMypageOrderCancelSelectionItem,
  type ShopMypageOrderCancelPreviewResult,
  type ShopMypageOrderCancelPreviewSummary,
  type ShopMypageOrderCancelSelectionItem,
  type ShopMypageOrderCancelSelectionMap,
} from "@/domains/mypage/utils/shopMypageOrderCancel";

export type ShopMypageOrderReturnSelectionItem = ShopMypageOrderCancelSelectionItem;
export type ShopMypageOrderReturnSelectionMap = ShopMypageOrderCancelSelectionMap;
export type ShopMypageOrderReturnPreviewSummary = ShopMypageOrderCancelPreviewSummary;

export interface ShopMypageOrderReturnPreviewResult
  extends Omit<ShopMypageOrderCancelPreviewResult, "submitBlockMessage"> {
  submitBlockMessage: string;
}

export interface ShopMypageOrderReturnTarget {
  initialOrdDtlNo: number | null;
}

const DELIVERY_COMPLETED_STATUS = "ORD_DTL_STAT_06";

// 주문상세 행의 반품 가능 잔여 수량을 0 이상 정수로 보정합니다.
function resolveShopMypageOrderReturnableQty(detailItem: ShopMypageOrderDetailItem): number {
  if (!Number.isFinite(detailItem.cancelableQty)) {
    return 0;
  }
  return Math.max(Math.floor(detailItem.cancelableQty), 0);
}

// 주문상세 행이 반품신청 가능한 상태인지 반환합니다.
export function isShopMypageOrderReturnable(detailItem: ShopMypageOrderDetailItem): boolean {
  return (
    detailItem.ordDtlStatCd === DELIVERY_COMPLETED_STATUS &&
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

// 취소 미리보기 차단 문구를 반품 신청 화면 문구로 치환합니다.
function translateShopMypageOrderReturnBlockMessage(message: string): string {
  if (message === "취소할 상품을 선택해주세요.") {
    return "반품할 상품을 선택해주세요.";
  }
  if (message === "배송비 차감 후 취소 예정 금액이 0원 미만이라 신청할 수 없습니다.") {
    return "배송비 차감 후 반품 예정 금액이 0원 미만이라 신청할 수 없습니다.";
  }
  return message;
}

// 반품 신청 화면의 환불 예정 금액 미리보기 결과를 계산합니다.
export function buildShopMypageOrderReturnPreviewResult(
  order: ShopMypageOrderGroup | null,
  amountSummary: ShopMypageOrderAmountSummary,
  siteInfo: ShopMypageOrderCancelSiteInfo,
  selectionMap: ShopMypageOrderReturnSelectionMap,
): ShopMypageOrderReturnPreviewResult {
  const cancelPreviewResult = buildShopMypageOrderCancelPreviewResult(order, amountSummary, siteInfo, selectionMap);

  // 취소 화면 공통 계산 결과를 재사용하되 반품 화면 문구만 보정합니다.
  return {
    ...cancelPreviewResult,
    submitBlockMessage: translateShopMypageOrderReturnBlockMessage(cancelPreviewResult.submitBlockMessage),
  };
}
