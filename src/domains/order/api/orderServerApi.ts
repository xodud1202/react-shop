import {
  createDefaultShopOrderPageResponse,
  getShopOrderPagePath,
  normalizeShopOrderPageResponse,
} from "@/domains/order/api/orderApi";
import type { ShopOrderPageResponse } from "@/domains/order/types";
import { requestShopServerApi } from "@/shared/server/readShopServerApiResponse";

export interface ShopOrderPageServerResult {
  ok: boolean;
  status: number;
  message: string;
  data: ShopOrderPageResponse;
}

// 주문서 페이지 SSR 데이터를 조회합니다.
export async function fetchShopOrderPageServerData(
  cartIdList: readonly number[],
  cookieHeader: string,
): Promise<ShopOrderPageServerResult> {
  const requestPath = getShopOrderPagePath(cartIdList);
  const requestInit = {
    method: "GET",
    cacheMode: "no-store" as const,
    cookieHeader,
  };

  try {
    // 주문서 페이지 API를 호출해 응답 상태와 본문을 함께 반환합니다.
    const result = await requestShopServerApi<ShopOrderPageResponse>(requestPath, requestInit);
    return {
      ok: result.ok,
      status: result.status,
      message: result.message,
      data: result.ok && result.data ? normalizeShopOrderPageResponse(result.data) : createDefaultShopOrderPageResponse(),
    };
  } catch {
    // 네트워크 오류 시 빈 응답과 500 상태로 반환합니다.
    return {
      ok: false,
      status: 500,
      message: "",
      data: createDefaultShopOrderPageResponse(),
    };
  }
}
