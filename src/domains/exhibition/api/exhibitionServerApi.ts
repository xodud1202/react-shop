import type { ShopExhibitionPageResponse } from "@/domains/exhibition/types";
import { readShopServerApiResponse } from "@/shared/server/readShopServerApiResponse";

// 기획전 목록 기본 응답값을 생성합니다.
function createDefaultShopExhibitionPageResponse(): ShopExhibitionPageResponse {
  return {
    exhibitionList: [],
    totalCount: 0,
    pageNo: 1,
    pageSize: 20,
    totalPageCount: 0,
  };
}

// 요청 페이지 번호를 1 이상의 값으로 보정합니다.
function resolvePageNo(pageNo: number): number {
  if (!Number.isFinite(pageNo) || pageNo < 1) {
    return 1;
  }

  return Math.floor(pageNo);
}

// 기획전 목록 API 경로를 생성합니다.
function buildShopExhibitionListPath(pageNo: number): string {
  // 요청 쿼리스트링을 pageNo 기준으로 구성합니다.
  const queryParams = new URLSearchParams();
  queryParams.set("pageNo", String(resolvePageNo(pageNo)));
  return `/api/shop/exhibition/list?${queryParams.toString()}`;
}

// 기획전 목록 화면 데이터를 SSR에서 조회합니다.
export async function fetchShopExhibitionPageServerData(pageNo: number): Promise<ShopExhibitionPageResponse> {
  // 기획전 목록 API 경로를 생성해 응답을 조회합니다.
  const path = buildShopExhibitionListPath(pageNo);
  const response = await readShopServerApiResponse<ShopExhibitionPageResponse>(path);
  const defaultResponse = createDefaultShopExhibitionPageResponse();

  // 응답 유효성을 확인한 뒤 기본값을 반환합니다.
  if (!response) {
    return defaultResponse;
  }

  return {
    exhibitionList: Array.isArray(response.exhibitionList) ? response.exhibitionList : defaultResponse.exhibitionList,
    totalCount: typeof response.totalCount === "number" ? response.totalCount : defaultResponse.totalCount,
    pageNo: typeof response.pageNo === "number" ? resolvePageNo(response.pageNo) : defaultResponse.pageNo,
    pageSize: typeof response.pageSize === "number" && response.pageSize > 0 ? Math.floor(response.pageSize) : defaultResponse.pageSize,
    totalPageCount:
      typeof response.totalPageCount === "number" && response.totalPageCount >= 0
        ? Math.floor(response.totalPageCount)
        : defaultResponse.totalPageCount,
  };
}

