// 쇼핑몰 헤더 트리 카테고리 응답 타입입니다.
export interface ShopHeaderCategoryTree {
  categoryId: string;
  categoryNm: string;
  categoryLevel: number | null;
  dispOrd: number | null;
  children: ShopHeaderCategoryTree[];
}

// 쇼핑몰 헤더 브랜드 응답 타입입니다.
export interface ShopHeaderBrand {
  brandNo: number;
  brandNm: string;
  brandLogoPath: string | null;
}
