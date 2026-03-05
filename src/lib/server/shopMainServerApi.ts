import type { ShopMainSection, ShopMainSectionsResponse } from "@/types/shopMain";

const SHOP_BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3010";

interface ShopMainServerData {
  sections: ShopMainSection[];
}

// 서버 컴포넌트에서 사용할 메인 API 공통 호출을 수행합니다.
async function readShopMainServerApiResponse<T>(path: string): Promise<T | null> {
  try {
    // 백엔드 메인 API를 no-store 정책으로 호출합니다.
    const response = await fetch(`${SHOP_BACKEND_URL}${path}`, {
      method: "GET",
      cache: "no-store",
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

// 메인 화면에 필요한 섹션 데이터를 SSR에서 조회합니다.
export async function fetchShopMainServerData(): Promise<ShopMainServerData> {
  // 메인 섹션 API 응답을 조회합니다.
  const sectionResponse = await readShopMainServerApiResponse<ShopMainSectionsResponse>("/api/shop/main/sections");

  // 응답 유효성을 확인한 뒤 기본값을 반환합니다.
  return {
    sections: Array.isArray(sectionResponse?.sections) ? sectionResponse.sections : [],
  };
}
