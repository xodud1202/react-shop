import type { ShopHeaderCategoryTree } from "@/domains/header/types";
import type { ShopGoodsCardItem } from "@/shared/types/shopGoods";

// 쇼핑몰 카테고리 화면 상품 아이템 타입입니다.
export interface ShopCategoryGoodsItem extends ShopGoodsCardItem {
  categoryId: string;
  dispOrd: number | null;
}

// 쇼핑몰 카테고리 페이지 응답 타입입니다.
export interface ShopCategoryPageResponse {
  categoryTree: ShopHeaderCategoryTree[];
  selectedCategoryId: string;
  selectedCategoryNm: string;
  goodsList: ShopCategoryGoodsItem[];
  goodsCount: number;
  pageNo: number;
  pageSize: number;
  totalPageCount: number;
}
