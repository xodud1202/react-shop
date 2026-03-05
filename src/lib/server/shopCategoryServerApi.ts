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
  };
}

// 카테고리 페이지 API 경로를 생성합니다.
function buildShopCategoryPagePath(categoryId: string): string {
  // categoryId가 없으면 기본 경로를 반환합니다.
  if (categoryId.trim() === "") {
    return "/api/shop/category/page";
  }

  // 선택 카테고리 쿼리스트링을 포함한 경로를 반환합니다.
  return `/api/shop/category/page?categoryId=${encodeURIComponent(categoryId)}`;
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
export async function fetchShopCategoryPageServerData(categoryId: string): Promise<ShopCategoryPageResponse> {
  // 카테고리 API 경로를 생성해 응답을 조회합니다.
  const path = buildShopCategoryPagePath(categoryId);
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
  };
}