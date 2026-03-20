import {
  createDefaultShopOrderPageResponse,
  getShopOrderPagePath,
  normalizeShopOrderPageResponse,
} from "@/domains/order/api/orderApi";
import type { ShopOrderPageResponse } from "@/domains/order/types";

const SHOP_BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3010";

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
  const requestUrl = `${SHOP_BACKEND_URL}${requestPath}`;
  const requestInit: RequestInit = {
    method: "GET",
    cache: "no-store",
  };

  // 로그인 쿠키가 있으면 백엔드 SSR 호출 헤더로 전달합니다.
  if (cookieHeader.trim() !== "") {
    requestInit.headers = {
      cookie: cookieHeader,
    };
  }

  try {
    // 주문서 페이지 API를 호출해 응답 상태와 본문을 함께 반환합니다.
    const response = await fetch(requestUrl, requestInit);
    const payload = await response.json().catch(() => null);
    return {
      ok: response.ok,
      status: response.status,
      message:
        payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "",
      data: response.ok ? normalizeShopOrderPageResponse(payload) : createDefaultShopOrderPageResponse(),
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
