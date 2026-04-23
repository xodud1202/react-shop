"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { buildForwardCookieHeader } from "@/shared/server/shopCookieHeader";
import { requestShopServerApi } from "@/shared/server/readShopServerApiResponse";
import { resolveCurrentShopRequestOrigin } from "@/shared/server/shopRequestOrigin";

interface ShopLogoutActionResponse {
  ok: boolean;
  message: string;
}

const SHOP_LOGOUT_COOKIE_NAME_LIST = ["shop_auth", "cust_no", "cust_nm", "cust_grade_cd"] as const;

// 쇼핑몰 로그인 쿠키를 현재 Next 응답에서 즉시 만료합니다.
function expireShopLogoutCookies(cookieStore: Awaited<ReturnType<typeof cookies>>): void {
  // 백엔드 fetch의 Set-Cookie는 브라우저로 자동 전달되지 않으므로 서버 액션 응답에 직접 만료 쿠키를 싣습니다.
  SHOP_LOGOUT_COOKIE_NAME_LIST.forEach((cookieName) => {
    cookieStore.set(cookieName, "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
      expires: new Date(0),
    });
  });
}

// 서버 액션으로 쇼핑몰 로그아웃을 처리합니다.
export async function submitShopLogoutAction(): Promise<ShopLogoutActionResponse> {
  // 현재 요청 쿠키를 백엔드 로그아웃 호출에 함께 전달합니다.
  const cookieStore = await cookies();
  const cookieHeader = buildForwardCookieHeader(cookieStore);
  const requestOrigin = await resolveCurrentShopRequestOrigin();
  const logoutResult = await requestShopServerApi("/api/shop/auth/logout", {
    method: "POST",
    cacheMode: "no-store",
    cookieHeader,
    headers: requestOrigin === "" ? undefined : { origin: requestOrigin },
  });

  // 백엔드 로그아웃이 성공하면 브라우저에 남은 로그인 쿠키도 같은 응답에서 만료합니다.
  if (logoutResult.ok) {
    expireShopLogoutCookies(cookieStore);
  }

  // 레이아웃 단위 캐시를 갱신해 헤더 상태를 즉시 반영합니다.
  revalidatePath("/", "layout");

  return {
    ok: logoutResult.ok,
    message: logoutResult.message || (logoutResult.ok ? "" : "로그아웃 처리에 실패했습니다."),
  };
}
