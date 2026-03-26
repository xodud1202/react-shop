import { cache } from "react";
import type { ShopHeaderBrand, ShopHeaderCategoryTree } from "@/domains/header/types";
import { readShopServerApiResponse } from "@/shared/server/readShopServerApiResponse";

interface ShopHeaderServerData {
  categories: ShopHeaderCategoryTree[];
  brands: ShopHeaderBrand[];
}

// 헤더에 필요한 카테고리/브랜드 데이터를 SSR에서 조회합니다.
async function fetchShopHeaderServerDataInternal(): Promise<ShopHeaderServerData> {
  const [categoryResponse, brandResponse] = await Promise.all([
    readShopServerApiResponse<ShopHeaderCategoryTree[]>("/api/shop/header/categories"),
    readShopServerApiResponse<ShopHeaderBrand[]>("/api/shop/header/brands"),
  ]);

  return {
    categories: Array.isArray(categoryResponse) ? categoryResponse : [],
    brands: Array.isArray(brandResponse) ? brandResponse : [],
  };
}

// 헤더 공통 데이터 조회를 요청 단위로 메모이징합니다.
export const fetchShopHeaderServerData = cache(fetchShopHeaderServerDataInternal);
