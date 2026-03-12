import type { ShopMypageWishPageResponse } from "@/domains/mypage/types";
import { readShopServerApiResponse } from "@/shared/server/readShopServerApiResponse";

// 마이페이지 위시리스트 기본 응답값을 생성합니다.
function createDefaultShopMypageWishPageResponse(): ShopMypageWishPageResponse {
  return {
    goodsList: [],
    goodsCount: 0,
    pageNo: 1,
    pageSize: 10,
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

// 마이페이지 위시리스트 API 경로를 생성합니다.
function buildShopMypageWishPagePath(pageNo: number): string {
  const queryParams = new URLSearchParams();
  queryParams.set("pageNo", String(resolvePageNo(pageNo)));
  return `/api/shop/mypage/wish/page?${queryParams.toString()}`;
}

// 마이페이지 위시리스트 페이지 SSR 데이터를 조회합니다.
export async function fetchShopMypageWishPageServerData(
  pageNo: number,
  cookieHeader: string,
): Promise<ShopMypageWishPageResponse> {
  // 위시리스트 API 경로를 생성해 응답을 조회합니다.
  const path = buildShopMypageWishPagePath(pageNo);
  const requestInit = cookieHeader.trim() === "" ? undefined : { headers: { cookie: cookieHeader } };
  const response = await readShopServerApiResponse<ShopMypageWishPageResponse>(path, requestInit);
  const defaultResponse = createDefaultShopMypageWishPageResponse();

  // 응답 유효성을 확인한 뒤 기본값을 반환합니다.
  if (!response) {
    return defaultResponse;
  }

  return {
    goodsList: Array.isArray(response.goodsList) ? response.goodsList : defaultResponse.goodsList,
    goodsCount: typeof response.goodsCount === "number" ? response.goodsCount : defaultResponse.goodsCount,
    pageNo: typeof response.pageNo === "number" ? resolvePageNo(response.pageNo) : defaultResponse.pageNo,
    pageSize:
      typeof response.pageSize === "number" && response.pageSize > 0 ? Math.floor(response.pageSize) : defaultResponse.pageSize,
    totalPageCount:
      typeof response.totalPageCount === "number" && response.totalPageCount >= 0
        ? Math.floor(response.totalPageCount)
        : defaultResponse.totalPageCount,
  };
}
