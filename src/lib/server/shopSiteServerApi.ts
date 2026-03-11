import type { ShopSiteInfo } from "@/types/shopSite";

const SHOP_BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3010";

// 로그인 등 공통 화면에서 사용할 사이트 기본 응답값을 생성합니다.
function createDefaultShopSiteInfo(): ShopSiteInfo {
  return {
    siteId: "xodud1202",
    siteNm: "",
  };
}

// 서버 컴포넌트에서 사용할 사이트 기본 정보 API 공통 호출을 수행합니다.
async function readShopSiteServerApiResponse(path: string): Promise<ShopSiteInfo | null> {
  try {
    // 백엔드 사이트 기본 정보 API를 no-store 정책으로 호출합니다.
    const response = await fetch(`${SHOP_BACKEND_URL}${path}`, {
      method: "GET",
      cache: "no-store",
    });

    // 비정상 응답이면 null을 반환합니다.
    if (!response.ok) {
      return null;
    }

    // 정상 응답 JSON을 반환합니다.
    return (await response.json()) as ShopSiteInfo;
  } catch {
    // 네트워크 예외가 발생하면 null을 반환합니다.
    return null;
  }
}

// 로그인 화면에 필요한 사이트 기본 정보를 SSR에서 조회합니다.
export async function fetchShopSiteServerData(): Promise<ShopSiteInfo> {
  // 사이트 기본 정보 API 응답을 조회합니다.
  const response = await readShopSiteServerApiResponse("/api/shop/site/info");
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
