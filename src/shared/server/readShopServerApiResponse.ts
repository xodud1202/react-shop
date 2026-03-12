const SHOP_BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3010";

// 서버 컴포넌트에서 사용할 쇼핑몰 공통 API 응답을 조회합니다.
export async function readShopServerApiResponse<T>(path: string, requestInit?: RequestInit): Promise<T | null> {
  try {
    // 백엔드 쇼핑몰 API를 no-store 정책으로 호출합니다.
    const response = await fetch(`${SHOP_BACKEND_URL}${path}`, {
      method: "GET",
      cache: "no-store",
      ...requestInit,
    });

    // 비정상 응답이면 null을 반환합니다.
    if (!response.ok) {
      return null;
    }

    // 정상 응답 JSON을 반환합니다.
    return (await response.json()) as T;
  } catch {
    // 네트워크 예외가 발생하면 null을 반환합니다.
    return null;
  }
}
