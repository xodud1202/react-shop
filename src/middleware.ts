import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// 현재 요청 경로를 로그인 복귀용 상대경로로 생성합니다.
function resolveReturnUrl(request: NextRequest): string {
  // pathname + search를 조합해 현재 페이지 주소를 구성합니다.
  const requestPathname = request.nextUrl.pathname;
  const requestSearch = request.nextUrl.search;
  return `${requestPathname}${requestSearch}`;
}

// 로그인 페이지 이동 URL을 생성합니다.
function resolveLoginMoveUrl(request: NextRequest) {
  // 로그인 페이지 경로에 returnUrl 쿼리를 포함합니다.
  const loginMoveUrl = request.nextUrl.clone();
  loginMoveUrl.pathname = "/login/form";
  loginMoveUrl.search = `returnUrl=${encodeURIComponent(resolveReturnUrl(request))}`;
  return loginMoveUrl;
}

// /mypage 하위 경로의 로그인 여부를 확인합니다.
export function middleware(request: NextRequest) {
  // 로그인 쿠키가 있으면 요청을 그대로 통과시킵니다.
  const custNoCookieValue = request.cookies.get("cust_no")?.value ?? "";
  if (custNoCookieValue.trim() !== "") {
    return NextResponse.next();
  }

  // 비로그인 사용자는 로그인 페이지로 이동시킵니다.
  return NextResponse.redirect(resolveLoginMoveUrl(request));
}

export const config = {
  matcher: ["/mypage/:path*"],
};
