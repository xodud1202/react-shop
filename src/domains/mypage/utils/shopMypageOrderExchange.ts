import type {
  ShopMypageOrderCancelSiteInfo,
  ShopMypageOrderDetailItem,
  ShopMypageOrderExchangeReasonItem,
  ShopMypageOrderExchangeSizeOption,
  ShopMypageOrderGroup,
  ShopMypageOrderItemReasonMap,
} from "@/domains/mypage/types";
import { normalizeShopMypageOrderClaimInteger } from "@/domains/mypage/utils/shopMypageOrderClaimAmount";
import {
  resolveShopMypageOrderItemReasonState,
  resolveShopMypageOrderItemReasonValidationMessage,
} from "@/domains/mypage/utils/shopMypageOrderClaimReason";

export interface ShopMypageOrderExchangeSelectionItem {
  selected: boolean;
  exchangeQty: number;
  targetSizeId: string;
}

export type ShopMypageOrderExchangeSelectionMap = Record<number, ShopMypageOrderExchangeSelectionItem>;

export interface ShopMypageOrderExchangeTarget {
  initialOrdDtlNo: number | null;
}

export interface ShopMypageOrderExchangePreviewResult {
  selectedItemCount: number;
  selectedQtyCount: number;
  payDelvAmt: number;
  paymentRequired: boolean;
  companyFaultYn: boolean;
  canSubmit: boolean;
  submitBlockMessage: string;
  previewVisible: boolean;
}

const DELIVERY_COMPLETED_STATUS = "ORD_DTL_STAT_06";
const COMPANY_FAULT_REASON_PREFIX = "E_2";

// 주문상세 행의 교환 가능 잔여 수량을 0 이상 정수로 보정합니다.
function resolveShopMypageOrderExchangeableQty(detailItem: ShopMypageOrderDetailItem): number {
  return normalizeShopMypageOrderClaimInteger(detailItem.cancelableQty);
}

// 주문상세 행에 반품/교환 진행 중 클레임이 있는지 반환합니다.
export function hasShopMypageOrderExchangeBlockedClaim(detailItem: ShopMypageOrderDetailItem): boolean {
  return detailItem.activeReturnClaimYn || detailItem.activeExchangeClaimYn;
}

// 주문상세 행이 교환신청 가능한 상태인지 반환합니다.
export function isShopMypageOrderExchangeable(detailItem: ShopMypageOrderDetailItem): boolean {
  return (
    detailItem.ordDtlStatCd === DELIVERY_COMPLETED_STATUS &&
    !hasShopMypageOrderExchangeBlockedClaim(detailItem) &&
    detailItem.exchangeApplyableYn &&
    resolveShopMypageOrderExchangeableQty(detailItem) > 0
  );
}

// 교환 신청 화면 진입 기준 상품을 계산합니다.
export function resolveShopMypageOrderExchangeTarget(
  order: ShopMypageOrderGroup | null,
  preferredOrdDtlNo?: number,
): ShopMypageOrderExchangeTarget {
  if (!order || order.detailList.length === 0) {
    return { initialOrdDtlNo: null };
  }

  // 요청 주문상세번호가 교환 가능 상품이면 우선 선택합니다.
  if (typeof preferredOrdDtlNo === "number" && Number.isFinite(preferredOrdDtlNo) && preferredOrdDtlNo > 0) {
    const preferredDetail = order.detailList.find(
      (detailItem) => detailItem.ordDtlNo === preferredOrdDtlNo && isShopMypageOrderExchangeable(detailItem),
    );
    if (preferredDetail) {
      return { initialOrdDtlNo: preferredDetail.ordDtlNo };
    }
  }

  // 요청 주문상세번호가 없으면 첫 번째 교환 가능 상품을 기본 선택합니다.
  const firstExchangeableDetail = order.detailList.find((detailItem) => isShopMypageOrderExchangeable(detailItem));
  return {
    initialOrdDtlNo: firstExchangeableDetail?.ordDtlNo ?? null,
  };
}

// 주문상세번호 기준 사이즈 옵션 목록을 반환합니다.
export function resolveShopMypageOrderExchangeSizeOptionList(
  sizeOptionList: ShopMypageOrderExchangeSizeOption[],
  ordDtlNo: number,
): ShopMypageOrderExchangeSizeOption[] {
  return sizeOptionList
    .filter((sizeOption) => sizeOption.ordDtlNo === ordDtlNo && sizeOption.sizeId.trim() !== "")
    .sort((left, right) => left.dispOrd - right.dispOrd || left.sizeId.localeCompare(right.sizeId));
}

// 주문상세 행의 기본 교환 사이즈를 반환합니다.
function resolveDefaultShopMypageOrderExchangeTargetSizeId(
  detailItem: ShopMypageOrderDetailItem,
  sizeOptionList: ShopMypageOrderExchangeSizeOption[],
): string {
  const currentSizeOption = sizeOptionList.find((sizeOption) => sizeOption.sizeId === detailItem.sizeId && !sizeOption.soldOut);
  if (currentSizeOption) {
    return currentSizeOption.sizeId;
  }
  return sizeOptionList.find((sizeOption) => !sizeOption.soldOut)?.sizeId ?? "";
}

// 교환 신청 화면 초기 선택 상태 맵을 생성합니다.
export function createInitialShopMypageOrderExchangeSelectionMap(
  order: ShopMypageOrderGroup | null,
  initialOrdDtlNo: number | null,
  allSizeOptionList: ShopMypageOrderExchangeSizeOption[],
): ShopMypageOrderExchangeSelectionMap {
  const result: ShopMypageOrderExchangeSelectionMap = {};
  if (!order) {
    return result;
  }

  // 기본 선택 상품 1건만 체크 상태로 초기화합니다.
  for (const detailItem of order.detailList) {
    const selected = isShopMypageOrderExchangeable(detailItem) && detailItem.ordDtlNo === initialOrdDtlNo;
    const sizeOptionList = resolveShopMypageOrderExchangeSizeOptionList(allSizeOptionList, detailItem.ordDtlNo);
    result[detailItem.ordDtlNo] = {
      selected,
      exchangeQty: selected ? resolveShopMypageOrderExchangeableQty(detailItem) : 0,
      targetSizeId: resolveDefaultShopMypageOrderExchangeTargetSizeId(detailItem, sizeOptionList),
    };
  }
  return result;
}

// 교환 수량 입력값을 허용 범위 안으로 보정합니다.
export function clampShopMypageOrderExchangeQty(detailItem: ShopMypageOrderDetailItem, quantity: number): number {
  const currentRemainingQty = Math.max(resolveShopMypageOrderExchangeableQty(detailItem), 1);
  if (!Number.isFinite(quantity)) {
    return 1;
  }
  return Math.min(Math.max(Math.floor(quantity), 1), currentRemainingQty);
}

// 주문상세 행의 현재 교환 선택 상태를 기본값과 함께 반환합니다.
export function resolveShopMypageOrderExchangeSelectionItem(
  selectionMap: ShopMypageOrderExchangeSelectionMap,
  detailItem: ShopMypageOrderDetailItem,
): ShopMypageOrderExchangeSelectionItem {
  return (
    selectionMap[detailItem.ordDtlNo] ?? {
      selected: false,
      exchangeQty: 0,
      targetSizeId: "",
    }
  );
}

// 선택된 교환 상품에 회사 귀책 사유가 포함되어 있는지 반환합니다.
function hasCompanyFaultReasonSelection(
  selectedOrdDtlNoList: number[],
  itemReasonMap: ShopMypageOrderItemReasonMap,
): boolean {
  return selectedOrdDtlNoList.some((ordDtlNo) =>
    resolveShopMypageOrderItemReasonState(itemReasonMap, ordDtlNo).reasonCd.trim().startsWith(COMPANY_FAULT_REASON_PREFIX),
  );
}

// 선택된 교환 상품의 사이즈 입력 유효성 메시지를 반환합니다.
function resolveShopMypageOrderExchangeSizeValidationMessage(
  order: ShopMypageOrderGroup,
  selectionMap: ShopMypageOrderExchangeSelectionMap,
  sizeOptionList: ShopMypageOrderExchangeSizeOption[],
  selectedOrdDtlNoList: number[],
): string {
  for (const ordDtlNo of selectedOrdDtlNoList) {
    const detailItem = order.detailList.find((item) => item.ordDtlNo === ordDtlNo);
    if (!detailItem) {
      return "교환 상품 정보를 확인해주세요.";
    }
    const selectionItem = resolveShopMypageOrderExchangeSelectionItem(selectionMap, detailItem);
    const matchedSizeOption = resolveShopMypageOrderExchangeSizeOptionList(sizeOptionList, ordDtlNo).find(
      (sizeOption) => sizeOption.sizeId === selectionItem.targetSizeId,
    );
    if (!matchedSizeOption) {
      return "교환 희망 사이즈를 선택해주세요.";
    }
    if (matchedSizeOption.stockQty < selectionItem.exchangeQty) {
      return "교환 희망 사이즈의 재고를 확인해주세요.";
    }
  }
  return "";
}

// 교환 신청 화면의 배송비 미리보기 결과를 계산합니다.
export function buildShopMypageOrderExchangePreviewResult(
  order: ShopMypageOrderGroup | null,
  siteInfo: ShopMypageOrderCancelSiteInfo,
  selectionMap: ShopMypageOrderExchangeSelectionMap,
  itemReasonMap: ShopMypageOrderItemReasonMap,
  reasonList: ShopMypageOrderExchangeReasonItem[],
  sizeOptionList: ShopMypageOrderExchangeSizeOption[],
): ShopMypageOrderExchangePreviewResult {
  if (!order) {
    return {
      selectedItemCount: 0,
      selectedQtyCount: 0,
      payDelvAmt: 0,
      paymentRequired: false,
      companyFaultYn: false,
      canSubmit: false,
      submitBlockMessage: "주문 정보를 확인해주세요.",
      previewVisible: false,
    };
  }

  let selectedItemCount = 0;
  let selectedQtyCount = 0;
  const selectedOrdDtlNoList: number[] = [];
  for (const detailItem of order.detailList) {
    const selectionItem = resolveShopMypageOrderExchangeSelectionItem(selectionMap, detailItem);
    if (!selectionItem.selected || selectionItem.exchangeQty < 1) {
      continue;
    }
    selectedItemCount += 1;
    selectedQtyCount += selectionItem.exchangeQty;
    selectedOrdDtlNoList.push(detailItem.ordDtlNo);
  }

  const selectedItemValidationMessage = selectedItemCount < 1 ? "교환할 상품을 선택해주세요." : "";
  const reasonValidationMessage =
    selectedItemValidationMessage !== ""
      ? ""
      : resolveShopMypageOrderItemReasonValidationMessage(
          selectedOrdDtlNoList,
          itemReasonMap,
          reasonList,
          "사유를 선택하시면 교환 배송비가 보여집니다.",
          "기타 사유를 입력해주세요.",
        );
  const sizeValidationMessage =
    selectedItemValidationMessage !== "" || reasonValidationMessage !== ""
      ? ""
      : resolveShopMypageOrderExchangeSizeValidationMessage(order, selectionMap, sizeOptionList, selectedOrdDtlNoList);
  if (selectedItemValidationMessage !== "" || reasonValidationMessage !== "" || sizeValidationMessage !== "") {
    return {
      selectedItemCount,
      selectedQtyCount,
      payDelvAmt: 0,
      paymentRequired: false,
      companyFaultYn: false,
      canSubmit: false,
      submitBlockMessage: selectedItemValidationMessage || reasonValidationMessage || sizeValidationMessage,
      previewVisible: false,
    };
  }

  const companyFaultYn = hasCompanyFaultReasonSelection(selectedOrdDtlNoList, itemReasonMap);
  const deliveryFee = normalizeShopMypageOrderClaimInteger(siteInfo.deliveryFee);
  const payDelvAmt = companyFaultYn ? 0 : deliveryFee * 2;
  return {
    selectedItemCount,
    selectedQtyCount,
    payDelvAmt,
    paymentRequired: payDelvAmt > 0,
    companyFaultYn,
    canSubmit: true,
    submitBlockMessage: "",
    previewVisible: true,
  };
}
