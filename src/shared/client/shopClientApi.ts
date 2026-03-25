export interface ShopClientApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | object | null;
}

export interface ShopClientApiResult<T> {
  ok: boolean;
  status: number;
  message: string;
  data: T | null;
}

// 클라이언트 응답 payload에서 message 문자열을 안전하게 추출합니다.
function resolveShopClientMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object" || !("message" in payload)) {
    return "";
  }
  return typeof payload.message === "string" ? payload.message : "";
}

// 객체 body를 JSON 문자열 또는 원본 body로 정규화합니다.
function resolveRequestBody(body: ShopClientApiRequestOptions["body"]): BodyInit | null | undefined {
  if (body === null || typeof body === "undefined") {
    return body;
  }
  if (typeof body === "string" || body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob) {
    return body;
  }
  return JSON.stringify(body);
}

// 요청 body 유형에 맞는 기본 헤더를 조합합니다.
function resolveRequestHeaders(body: ShopClientApiRequestOptions["body"], headers: HeadersInit | undefined): HeadersInit | undefined {
  const resolvedHeaderMap = new Headers(headers);
  if (body && !(body instanceof FormData) && !(body instanceof URLSearchParams) && !(body instanceof Blob) && !resolvedHeaderMap.has("Content-Type")) {
    resolvedHeaderMap.set("Content-Type", "application/json");
  }
  return Array.from(resolvedHeaderMap.keys()).length > 0 ? resolvedHeaderMap : undefined;
}

// 클라이언트 컴포넌트에서 사용할 공통 API 요청을 수행합니다.
export async function requestShopClientApi<T>(
  path: string,
  { body, headers, credentials = "include", ...restRequestInit }: ShopClientApiRequestOptions = {},
): Promise<ShopClientApiResult<T>> {
  try {
    // 공통 옵션으로 API를 호출하고 JSON 응답을 최대한 안전하게 파싱합니다.
    const response = await fetch(path, {
      credentials,
      ...restRequestInit,
      headers: resolveRequestHeaders(body, headers),
      body: resolveRequestBody(body),
    });
    const payload = await response.json().catch(() => null);

    return {
      ok: response.ok,
      status: response.status,
      message: resolveShopClientMessage(payload),
      data: response.ok ? (payload as T) : null,
    };
  } catch (error) {
    // 취소된 요청은 호출부에서 분기할 수 있도록 그대로 다시 던집니다.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    // 네트워크 예외가 발생하면 실패 응답을 반환합니다.
    return {
      ok: false,
      status: 500,
      message: "",
      data: null,
    };
  }
}
