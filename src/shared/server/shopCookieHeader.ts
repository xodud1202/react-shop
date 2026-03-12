import { cookies } from "next/headers";

// 쿠키 헤더에 안전하게 포함될 수 있도록 값을 정리합니다.
function sanitizeCookieValue(value: string): string {
  return value.replace(/[\r\n;]/g, "");
}

// 서버 요청 쿠키를 백엔드 전달용 Cookie 헤더 문자열로 변환합니다.
export function buildForwardCookieHeader(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  forwardCookieNameList: readonly string[],
): string {
  // 전달 대상 쿠키 목록을 name=value 토큰으로 조합합니다.
  const cookieTokenList = forwardCookieNameList
    .map((cookieName) => {
      const cookieValue = cookieStore.get(cookieName)?.value ?? "";
      if (cookieValue.trim() === "") {
        return "";
      }
      return `${cookieName}=${sanitizeCookieValue(cookieValue)}`;
    })
    .filter((cookieToken) => cookieToken !== "");
  return cookieTokenList.join("; ");
}
