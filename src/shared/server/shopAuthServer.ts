import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { buildLoginFormPath } from "@/domains/login/utils/loginRedirectUtils";
import { createUnauthenticatedShopAuthState, normalizeShopAuthState, type ShopAuthState } from "@/shared/auth/shopAuth";
import { requestShopServerApi } from "@/shared/server/readShopServerApiResponse";
import { buildForwardCookieHeader } from "@/shared/server/shopCookieHeader";

export interface ShopServerRequestContext {
  authState: ShopAuthState;
  cookieHeader: string;
}

// 현재 요청의 쇼핑몰 인증 상태와 백엔드 전달용 쿠키 헤더를 함께 조회합니다.
const fetchShopServerRequestContextInternal = cache(async (): Promise<ShopServerRequestContext> => {
  const cookieStore = await cookies();
  const cookieHeader = buildForwardCookieHeader(cookieStore);
  if (cookieHeader.trim() === "") {
    return {
      authState: createUnauthenticatedShopAuthState(),
      cookieHeader,
    };
  }

  const result = await requestShopServerApi<ShopAuthState>("/api/shop/auth/me", {
    method: "GET",
    cacheMode: "no-store",
    cookieHeader,
  });

  return {
    authState: result.ok && result.data ? normalizeShopAuthState(result.data) : createUnauthenticatedShopAuthState(),
    cookieHeader,
  };
});

// 현재 요청 기준 쇼핑몰 서버 컨텍스트를 반환합니다.
export async function fetchShopServerRequestContext(): Promise<ShopServerRequestContext> {
  return fetchShopServerRequestContextInternal();
}

// 로그인 필수 페이지에서 인증 상태를 확인하고 비로그인 시 로그인 화면으로 이동시킵니다.
export async function requireAuthenticatedShopRequestContext(returnUrl: string): Promise<ShopServerRequestContext> {
  const requestContext = await fetchShopServerRequestContextInternal();
  if (!requestContext.authState.authenticated) {
    redirect(buildLoginFormPath(returnUrl));
  }
  return requestContext;
}
