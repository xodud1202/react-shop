import type { ShopMainSection, ShopMainSectionsResponse } from "@/domains/main/types";
import { readShopServerApiResponse } from "@/shared/server/readShopServerApiResponse";

interface ShopMainServerData {
  sections: ShopMainSection[];
}

// 메인 화면에 필요한 섹션 데이터를 SSR에서 조회합니다.
export async function fetchShopMainServerData(): Promise<ShopMainServerData> {
  // 메인 섹션 API 응답을 조회합니다.
  const sectionResponse = await readShopServerApiResponse<ShopMainSectionsResponse>("/api/shop/main/sections");

  // 응답 유효성을 확인한 뒤 기본값을 반환합니다.
  return {
    sections: Array.isArray(sectionResponse?.sections) ? sectionResponse.sections : [],
  };
}