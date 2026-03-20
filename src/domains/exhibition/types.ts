import type { ShopGoodsCardItem } from "@/shared/types/shopGoods";

// 쇼핑몰 기획전 목록 단건 타입입니다.
export interface ShopExhibitionItem {
  exhibitionNo: number;
  exhibitionNm: string;
  thumbnailUrl: string;
  dispStartDt: string;
}

// 쇼핑몰 기획전 상세 탭 타입입니다.
export interface ShopExhibitionDetailTab {
  exhibitionTabNo: number;
  exhibitionTabNm: string;
  dispStartDt: string;
  dispEndDt: string;
}

// 쇼핑몰 기획전 탭 상품 타입입니다.
export interface ShopExhibitionGoodsItem extends ShopGoodsCardItem {
  exhibitionNo: number;
  exhibitionTabNo: number;
  sortSeq: number | null;
}

// 쇼핑몰 기획전 목록 페이지 응답 타입입니다.
export interface ShopExhibitionPageResponse {
  exhibitionList: ShopExhibitionItem[];
  totalCount: number;
  pageNo: number;
  pageSize: number;
  totalPageCount: number;
}

// 쇼핑몰 기획전 상세 페이지 응답 타입입니다.
export interface ShopExhibitionDetailResponse {
  exhibitionNo: number;
  exhibitionNm: string;
  dispStartDt: string;
  dispEndDt: string;
  visibleHtml: string;
  pcHtml: string;
  mobileHtml: string;
  defaultTabNo: number;
  tabList: ShopExhibitionDetailTab[];
}

// 쇼핑몰 기획전 탭 상품 더보기 응답 타입입니다.
export interface ShopExhibitionGoodsPageResponse {
  goodsList: ShopExhibitionGoodsItem[];
  totalCount: number;
  pageNo: number;
  pageSize: number;
  hasMore: boolean;
  nextPageNo: number | null;
}
