// 마이페이지 위시리스트 상품 아이템 타입입니다.
export interface ShopMypageWishGoodsItem {
  custNo: number;
  goodsId: string;
  goodsNm: string;
  saleAmt: number;
  imgPath: string;
  imgUrl: string;
}

// 마이페이지 위시리스트 페이지 응답 타입입니다.
export interface ShopMypageWishPageResponse {
  goodsList: ShopMypageWishGoodsItem[];
  goodsCount: number;
  pageNo: number;
  pageSize: number;
  totalPageCount: number;
}
