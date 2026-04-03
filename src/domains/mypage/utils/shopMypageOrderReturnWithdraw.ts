"use client";

import type {
  ShopMypageOrderDetailItem,
  ShopMypageOrderReturnWithdrawRequest,
  ShopMypageOrderReturnWithdrawResponse,
  ShopMypageReturnHistoryDetailItem,
} from "@/domains/mypage/types";
import { requestShopClientApi } from "@/shared/client/shopClientApi";

export const SHOP_MYPAGE_ORDER_ACTION_RETURN_WITHDRAW = "반품 철회";

// 주문내역/주문상세 상품이 반품 철회 가능한 상태인지 반환합니다.
export function isShopMypageOrderReturnWithdrawable(detailItem: ShopMypageOrderDetailItem): boolean {
  return detailItem.activeReturnClaimYn && detailItem.displayOrdDtlStatCd === "CHG_DTL_STAT_11";
}

// 반품내역/반품상세 상품이 반품 철회 가능한 상태인지 반환합니다.
export function isShopMypageReturnHistoryWithdrawable(detailItem: ShopMypageReturnHistoryDetailItem): boolean {
  return detailItem.chgDtlStatCd === "CHG_DTL_STAT_11";
}

// 주문 액션 라벨이 반품 철회 버튼인지 반환합니다.
export function isShopMypageOrderReturnWithdrawActionLabel(actionLabel: string): boolean {
  return actionLabel === SHOP_MYPAGE_ORDER_ACTION_RETURN_WITHDRAW;
}

// 반품 철회 성공 안내 문구를 반환합니다.
export function resolveShopMypageOrderReturnWithdrawSuccessMessage(): string {
  return "반품 철회가 완료되었습니다.";
}

// 마이페이지 반품 철회 API를 호출합니다.
export async function requestShopMypageOrderReturnWithdraw(
  ordNo: string,
  ordDtlNo: number,
) {
  const requestBody: ShopMypageOrderReturnWithdrawRequest = {
    ordNo,
    ordDtlNo,
  };
  return requestShopClientApi<ShopMypageOrderReturnWithdrawResponse>("/api/shop/mypage/order/return/withdraw", {
    method: "POST",
    body: requestBody,
  });
}
