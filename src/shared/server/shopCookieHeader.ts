import { cookies } from "next/headers";

// 쿠키 헤더에 안전하게 포함될 수 있도록 이름 또는 값을 정리합니다.
function sanitizeCookieToken(value: string): string {
  return value.replace(/[\r\n;=]/g, "");
}

// 서버 요청의 전체 쿠키를 백엔드 전달용 Cookie 헤더 문자열로 변환합니다.
export function buildForwardCookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  // 현재 요청에 포함된 모든 쿠키를 name=value 토큰으로 조합합니다.
  const cookieTokenList = cookieStore
    .getAll()
    .map((cookieValue) => {
      const sanitizedName = sanitizeCookieToken(cookieValue.name ?? "");
      const sanitizedValue = sanitizeCookieToken(cookieValue.value ?? "");
      if (sanitizedName === "" || sanitizedValue === "") {
        return "";
      }
      return `${sanitizedName}=${sanitizedValue}`;
    })
    .filter((cookieToken) => cookieToken !== "");
  return cookieTokenList.join("; ");
}
