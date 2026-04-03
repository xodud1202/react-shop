"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { buildForwardCookieHeader } from "@/shared/server/shopCookieHeader";
import { requestShopServerApi } from "@/shared/server/readShopServerApiResponse";

interface ShopLogoutActionResponse {
  ok: boolean;
  message: string;
}

const SHOP_AUTH_COOKIE_NAME_LIST = ["cust_no", "cust_nm", "cust_grade_cd"] as const;

// 서버 액션으로 쇼핑몰 로그아웃을 처리합니다.
export async function submitShopLogoutAction(): Promise<ShopLogoutActionResponse> {
  // 현재 요청 쿠키를 백엔드 로그아웃 호출에 함께 전달합니다.
  const cookieStore = await cookies();
  const cookieHeader = buildForwardCookieHeader(cookieStore, SHOP_AUTH_COOKIE_NAME_LIST);
  const logoutResult = await requestShopServerApi("/api/shop/auth/logout", {
    method: "POST",
    cacheMode: "no-store",
    cookieHeader,
  });

  // 프론트 쿠키도 함께 만료시켜 즉시 비로그인 상태를 반영합니다.
  SHOP_AUTH_COOKIE_NAME_LIST.forEach((cookieName) => {
    cookieStore.set(cookieName, "", {
      path: "/",
      expires: new Date(0),
    });
  });

  // 레이아웃 단위 캐시를 갱신해 헤더 상태를 즉시 반영합니다.
  revalidatePath("/", "layout");

  return {
    ok: logoutResult.ok,
    message: logoutResult.message || (logoutResult.ok ? "" : "로그아웃 처리에 실패했습니다."),
  };
}
