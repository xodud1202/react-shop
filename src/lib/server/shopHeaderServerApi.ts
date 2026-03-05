import type { ShopHeaderBrand, ShopHeaderCategoryTree } from "@/types/shopHeader";

const SHOP_BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3010";

interface ShopHeaderServerData {
  categories: ShopHeaderCategoryTree[];
  brands: ShopHeaderBrand[];
}

// 서버 컴포넌트에서 사용할 헤더 API 공통 호출을 수행합니다.
async function readServerApiResponse<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${SHOP_BACKEND_URL}${path}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

// 헤더에 필요한 카테고리/브랜드 데이터를 SSR에서 조회합니다.
export async function fetchShopHeaderServerData(): Promise<ShopHeaderServerData> {
  const [categoryResponse, brandResponse] = await Promise.all([
    readServerApiResponse<ShopHeaderCategoryTree[]>("/api/shop/header/categories"),
    readServerApiResponse<ShopHeaderBrand[]>("/api/shop/header/brands"),
  ]);

  return {
    categories: Array.isArray(categoryResponse) ? categoryResponse : [],
    brands: Array.isArray(brandResponse) ? brandResponse : [],
  };
}
