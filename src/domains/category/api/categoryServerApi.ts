import { cache } from "react";
import type { ShopCategoryPageResponse } from "@/domains/category/types";
import { createShopPublicCacheOptions, readShopServerApiResponse } from "@/shared/server/readShopServerApiResponse";

// 카테고리 페이지 기본 응답값을 생성합니다.
function createDefaultCategoryPageResponse(): ShopCategoryPageResponse {
  return {
    categoryTree: [],
    selectedCategoryId: "",
    selectedCategoryNm: "",
    goodsList: [],
    goodsCount: 0,
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

// 카테고리 페이지 API 경로를 생성합니다.
function buildShopCategoryPagePath(categoryId: string, pageNo: number): string {
  // 요청 쿼리스트링을 pageNo 필수 기준으로 구성합니다.
  const queryParams = new URLSearchParams();
  queryParams.set("pageNo", String(resolvePageNo(pageNo)));

  // categoryId가 존재하면 쿼리스트링에 함께 포함합니다.
  if (categoryId.trim() !== "") {
    queryParams.set("categoryId", categoryId);
  }

  return `/api/shop/category/page?${queryParams.toString()}`;
}

// 카테고리 화면에 필요한 데이터를 SSR에서 조회합니다.
async function fetchShopCategoryPageServerDataInternal(categoryId: string, pageNo: number): Promise<ShopCategoryPageResponse> {
  // 카테고리 API 경로를 생성해 응답을 조회합니다.
  const path = buildShopCategoryPagePath(categoryId, pageNo);
  const response = await readShopServerApiResponse<ShopCategoryPageResponse>(
    path,
    createShopPublicCacheOptions(["shop:category", `shop:category:${categoryId || "all"}`]),
  );
  const defaultResponse = createDefaultCategoryPageResponse();

  // 응답 유효성을 확인한 뒤 기본값을 반환합니다.
  if (!response) {
    return defaultResponse;
  }

  return {
    categoryTree: Array.isArray(response.categoryTree) ? response.categoryTree : defaultResponse.categoryTree,
    selectedCategoryId: typeof response.selectedCategoryId === "string" ? response.selectedCategoryId : "",
    selectedCategoryNm: typeof response.selectedCategoryNm === "string" ? response.selectedCategoryNm : "",
    goodsList: Array.isArray(response.goodsList) ? response.goodsList : defaultResponse.goodsList,
    goodsCount: typeof response.goodsCount === "number" ? response.goodsCount : 0,
    pageNo: typeof response.pageNo === "number" ? resolvePageNo(response.pageNo) : defaultResponse.pageNo,
    pageSize: typeof response.pageSize === "number" && response.pageSize > 0 ? Math.floor(response.pageSize) : defaultResponse.pageSize,
    totalPageCount:
      typeof response.totalPageCount === "number" && response.totalPageCount >= 0
        ? Math.floor(response.totalPageCount)
        : defaultResponse.totalPageCount,
  };
}

// 카테고리 화면 서버 데이터를 요청 단위로 메모이징합니다.
export const fetchShopCategoryPageServerData = cache(fetchShopCategoryPageServerDataInternal);
