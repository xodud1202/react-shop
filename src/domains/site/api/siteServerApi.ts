import { cache } from "react";
import type { ShopSiteInfo } from "@/domains/site/types";
import { readShopServerApiResponse } from "@/shared/server/readShopServerApiResponse";

// 로그인 등 공통 화면에서 사용할 사이트 기본 응답값을 생성합니다.
function createDefaultShopSiteInfo(): ShopSiteInfo {
  return {
    siteId: "xodud1202",
    siteNm: "",
  };
}

// 로그인 화면에 필요한 사이트 기본 정보를 SSR에서 조회합니다.
async function fetchShopSiteServerDataInternal(): Promise<ShopSiteInfo> {
  // 사이트 기본 정보 API 응답을 조회합니다.
  const response = await readShopServerApiResponse<ShopSiteInfo>("/api/shop/site/info");
  const defaultResponse = createDefaultShopSiteInfo();

  // 응답 유효성을 확인한 뒤 기본값을 반환합니다.
  if (!response) {
    return defaultResponse;
  }

  return {
    siteId: typeof response.siteId === "string" ? response.siteId : defaultResponse.siteId,
    siteNm: typeof response.siteNm === "string" ? response.siteNm : defaultResponse.siteNm,
  };
}

// 사이트 기본 정보 조회를 요청 단위로 메모이징합니다.
export const fetchShopSiteServerData = cache(fetchShopSiteServerDataInternal);
