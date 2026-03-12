const SHOP_BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3010";

// 개발환경에서 서버 API 호출 오류를 콘솔로 기록합니다.
function logShopServerApiError(message: string, metadata: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  console.error(`[readShopServerApiResponse] ${message}`, metadata);
}

// 서버 컴포넌트에서 사용할 쇼핑몰 공통 API 응답을 조회합니다.
export async function readShopServerApiResponse<T>(path: string, requestInit?: RequestInit): Promise<T | null> {
  const requestUrl = `${SHOP_BACKEND_URL}${path}`;
  try {
    // 백엔드 쇼핑몰 API를 no-store 정책으로 호출합니다.
    const response = await fetch(requestUrl, {
      method: "GET",
      cache: "no-store",
      ...requestInit,
    });

    // 비정상 응답이면 null을 반환합니다.
    if (!response.ok) {
      logShopServerApiError("비정상 응답", {
        requestUrl,
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    // 정상 응답 JSON을 반환합니다.
    return (await response.json()) as T;
  } catch (error) {
    // 네트워크 예외가 발생하면 null을 반환합니다.
    logShopServerApiError("네트워크 예외", {
      requestUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
