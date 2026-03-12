// 쇼핑몰 기획전 목록 단건 타입입니다.
export interface ShopExhibitionItem {
  exhibitionNo: number;
  exhibitionNm: string;
  thumbnailUrl: string;
  dispStartDt: string;
}

// 쇼핑몰 기획전 목록 페이지 응답 타입입니다.
export interface ShopExhibitionPageResponse {
  exhibitionList: ShopExhibitionItem[];
  totalCount: number;
  pageNo: number;
  pageSize: number;
  totalPageCount: number;
}

