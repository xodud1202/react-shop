import type { ShopCategoryPageResponse } from "@/types/shopCategory";

const SHOP_BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3010";

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

// 서버 컴포넌트에서 사용할 카테고리 API 공통 호출을 수행합니다.
async function readShopCategoryServerApiResponse(path: string): Promise<ShopCategoryPageResponse | null> {
  try {
    // 백엔드 카테고리 API를 no-store 정책으로 호출합니다.
    const response = await fetch(`${SHOP_BACKEND_URL}${path}`, {
      method: "GET",
      cache: "no-store",
    });

    // 비정상 응답이면 null을 반환합니다.
    if (!response.ok) {
      return null;
    }

    // 정상 응답 JSON을 반환합니다.
    return (await response.json()) as ShopCategoryPageResponse;
  } catch {
    // 네트워크 예외가 발생하면 null을 반환합니다.
    return null;
  }
}

// 카테고리 화면에 필요한 데이터를 SSR에서 조회합니다.
export async function fetchShopCategoryPageServerData(categoryId: string, pageNo: number): Promise<ShopCategoryPageResponse> {
  // 카테고리 API 경로를 생성해 응답을 조회합니다.
  const path = buildShopCategoryPagePath(categoryId, pageNo);
  const response = await readShopCategoryServerApiResponse(path);
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
