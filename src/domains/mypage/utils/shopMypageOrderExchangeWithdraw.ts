"use client";

import type {
  ShopMypageOrderDetailItem,
  ShopMypageOrderExchangeWithdrawRequest,
  ShopMypageOrderExchangeWithdrawResponse,
} from "@/domains/mypage/types";
import { requestShopClientApi } from "@/shared/client/shopClientApi";

export const SHOP_MYPAGE_ORDER_ACTION_EXCHANGE_WITHDRAW = "교환 철회";

const SHOP_MYPAGE_ORDER_EXCHANGE_WITHDRAWABLE_STATUS_CD_LIST = ["CHG_DTL_STAT_21", "CHG_DTL_STAT_22"] as const;

// 주문내역/주문상세 상품이 교환 철회 가능한 상태인지 반환합니다.
export function isShopMypageOrderExchangeWithdrawable(detailItem: ShopMypageOrderDetailItem): boolean {
  return (
    detailItem.activeExchangeClaimYn &&
    SHOP_MYPAGE_ORDER_EXCHANGE_WITHDRAWABLE_STATUS_CD_LIST.some(
      (statusCd) => statusCd === detailItem.displayOrdDtlStatCd,
    )
  );
}

// 주문 액션 라벨이 교환 철회 버튼인지 반환합니다.
export function isShopMypageOrderExchangeWithdrawActionLabel(actionLabel: string): boolean {
  return actionLabel === SHOP_MYPAGE_ORDER_ACTION_EXCHANGE_WITHDRAW;
}

// 교환 철회 성공 안내 문구를 반환합니다.
export function resolveShopMypageOrderExchangeWithdrawSuccessMessage(): string {
  return "교환 철회가 완료되었습니다.";
}

// 마이페이지 교환 철회 API를 호출합니다.
export async function requestShopMypageOrderExchangeWithdraw(
  ordNo: string,
  ordDtlNo: number,
) {
  const requestBody: ShopMypageOrderExchangeWithdrawRequest = {
    ordNo,
    ordDtlNo,
  };
  return requestShopClientApi<ShopMypageOrderExchangeWithdrawResponse>("/api/shop/mypage/order/exchange/withdraw", {
    method: "POST",
    body: requestBody,
  });
}
