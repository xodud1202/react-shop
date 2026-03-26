const SHOP_BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3010";

export interface ShopServerApiRequestOptions extends Omit<RequestInit, "cache"> {
  cacheMode?: RequestCache;
  cookieHeader?: string;
}

export interface ShopServerApiResult<T> {
  ok: boolean;
  status: number;
  message: string;
  data: T | null;
}

// 개발환경에서 서버 API 호출 오류를 콘솔로 기록합니다.
function logShopServerApiError(message: string, metadata: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  console.error(`[readShopServerApiResponse] ${message}`, metadata);
}

// 서버 응답 payload에서 message 문자열을 안전하게 추출합니다.
function resolveResponseMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object" || !("message" in payload)) {
    return "";
  }
  return typeof payload.message === "string" ? payload.message : "";
}

// 서버 API 요청 헤더를 기본값과 함께 조합합니다.
function resolveRequestHeaders(cookieHeader: string | undefined, headers: HeadersInit | undefined): HeadersInit | undefined {
  const resolvedHeaderMap = new Headers(headers);
  if (typeof cookieHeader === "string" && cookieHeader.trim() !== "") {
    resolvedHeaderMap.set("cookie", cookieHeader);
  }
  return Array.from(resolvedHeaderMap.keys()).length > 0 ? resolvedHeaderMap : undefined;
}

// 서버 API 요청 옵션을 Next fetch 규격에 맞게 조합합니다.
function buildShopServerRequestInit({
  cacheMode = "no-store",
  cookieHeader,
  headers,
  ...restRequestInit
}: ShopServerApiRequestOptions = {}): RequestInit {
  const requestInit: RequestInit = {
    method: "GET",
    cache: cacheMode,
    ...restRequestInit,
  };

  // 쿠키 전달과 기존 헤더를 함께 병합합니다.
  const resolvedHeaders = resolveRequestHeaders(cookieHeader, headers);
  if (resolvedHeaders) {
    requestInit.headers = resolvedHeaders;
  }

  return requestInit;
}

// 서버 컴포넌트/서버 액션에서 사용할 쇼핑몰 API 요청을 수행합니다.
export async function requestShopServerApi<T>(
  path: string,
  requestOptions?: ShopServerApiRequestOptions,
): Promise<ShopServerApiResult<T>> {
  const requestUrl = `${SHOP_BACKEND_URL}${path}`;

  try {
    // 공통 요청 옵션을 조합해 백엔드 API를 호출합니다.
    const response = await fetch(requestUrl, buildShopServerRequestInit(requestOptions));
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      logShopServerApiError("비정상 응답", {
        requestUrl,
        status: response.status,
        statusText: response.statusText,
      });
    }

    return {
      ok: response.ok,
      status: response.status,
      message: resolveResponseMessage(payload),
      data: response.ok ? (payload as T) : null,
    };
  } catch (error) {
    // 네트워크 예외가 발생하면 실패 응답을 반환합니다.
    logShopServerApiError("네트워크 예외", {
      requestUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      ok: false,
      status: 500,
      message: "",
      data: null,
    };
  }
}

// 서버 컴포넌트에서 사용할 쇼핑몰 공통 API 응답 본문만 반환합니다.
export async function readShopServerApiResponse<T>(
  path: string,
  requestOptions?: ShopServerApiRequestOptions,
): Promise<T | null> {
  const result = await requestShopServerApi<T>(path, requestOptions);
  return result.ok ? result.data : null;
}
