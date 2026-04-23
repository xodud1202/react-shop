import { headers as readNextRequestHeaders } from "next/headers";

type ShopNextRequestHeaders = Awaited<ReturnType<typeof readNextRequestHeaders>>;

// URL 문자열에서 백엔드 CSRF 검증에 사용할 Origin만 추출합니다.
function normalizeHttpOrigin(value: string | null): string {
  const trimmedValue = value?.trim() ?? "";
  if (trimmedValue === "") {
    return "";
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return "";
    }
    return parsedUrl.origin;
  } catch {
    return "";
  }
}

// 현재 Next 요청 헤더에서 백엔드로 전달할 Origin 값을 복원합니다.
function resolveShopRequestOriginFromHeaders(requestHeaders: ShopNextRequestHeaders): string {
  const originHeader = normalizeHttpOrigin(requestHeaders.get("origin"));
  if (originHeader !== "") {
    return originHeader;
  }

  const refererOrigin = normalizeHttpOrigin(requestHeaders.get("referer"));
  if (refererOrigin !== "") {
    return refererOrigin;
  }
  return "";
}

// 서버 액션에서 백엔드 Origin/Referer CSRF 검증에 사용할 현재 요청 Origin을 반환합니다.
export async function resolveCurrentShopRequestOrigin(): Promise<string> {
  const requestHeaders = await readNextRequestHeaders();
  return resolveShopRequestOriginFromHeaders(requestHeaders);
}
