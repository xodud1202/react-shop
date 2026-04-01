import type {
  ShopMypageOrderCancelReasonItem,
  ShopMypageOrderGroup,
  ShopMypageOrderItemReasonMap,
  ShopMypageOrderItemReasonState,
} from "@/domains/mypage/types";

const EMPTY_SHOP_MYPAGE_ORDER_ITEM_REASON_STATE: ShopMypageOrderItemReasonState = {
  reasonCd: "",
  reasonDetail: "",
};

// 주문상품별 기본 사유 상태 맵을 생성합니다.
export function createInitialShopMypageOrderItemReasonMap(
  order: ShopMypageOrderGroup | null,
): ShopMypageOrderItemReasonMap {
  const result: ShopMypageOrderItemReasonMap = {};
  if (!order) {
    return result;
  }

  // 모든 주문상세번호를 빈 사유 상태로 초기화합니다.
  for (const detailItem of order.detailList) {
    result[detailItem.ordDtlNo] = EMPTY_SHOP_MYPAGE_ORDER_ITEM_REASON_STATE;
  }
  return result;
}

// 주문상품별 사유 상태를 기본값과 함께 안전하게 반환합니다.
export function resolveShopMypageOrderItemReasonState(
  reasonMap: ShopMypageOrderItemReasonMap,
  ordDtlNo: number,
): ShopMypageOrderItemReasonState {
  return reasonMap[ordDtlNo] ?? EMPTY_SHOP_MYPAGE_ORDER_ITEM_REASON_STATE;
}

// 사유 목록에서 현재 선택된 사유 정보를 찾습니다.
export function resolveShopMypageOrderReasonItem(
  reasonList: ShopMypageOrderCancelReasonItem[],
  reasonCd: string,
): ShopMypageOrderCancelReasonItem | null {
  return reasonList.find((reasonItem) => reasonItem.cd === reasonCd) ?? null;
}

// 현재 선택된 사유가 직접입력을 요구하는지 반환합니다.
export function isShopMypageOrderReasonDetailRequired(reasonItem: ShopMypageOrderCancelReasonItem | null): boolean {
  return (reasonItem?.cdNm || "").includes("기타");
}

// 선택된 주문상품 목록의 사유 입력 완료 여부를 검증합니다.
export function resolveShopMypageOrderItemReasonValidationMessage(
  selectedOrdDtlNoList: number[],
  reasonMap: ShopMypageOrderItemReasonMap,
  reasonList: ShopMypageOrderCancelReasonItem[],
  emptyReasonMessage: string,
  emptyReasonDetailMessage: string,
): string {
  for (const ordDtlNo of selectedOrdDtlNoList) {
    const reasonState = resolveShopMypageOrderItemReasonState(reasonMap, ordDtlNo);
    const selectedReasonCd = reasonState.reasonCd.trim();
    if (selectedReasonCd === "") {
      return emptyReasonMessage;
    }

    // 기타 사유는 직접입력값까지 함께 검증합니다.
    const selectedReasonItem = resolveShopMypageOrderReasonItem(reasonList, selectedReasonCd);
    if (!selectedReasonItem) {
      return emptyReasonMessage;
    }
    if (isShopMypageOrderReasonDetailRequired(selectedReasonItem) && reasonState.reasonDetail.trim() === "") {
      return emptyReasonDetailMessage;
    }
  }
  return "";
}
