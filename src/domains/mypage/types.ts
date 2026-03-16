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

// 마이페이지 쿠폰함 보유 쿠폰 아이템 타입입니다.
export interface ShopMypageOwnedCouponItem {
  custCpnNo: number;
  cpnNo: number;
  cpnNm: string;
  cpnGbCd: string;
  cpnGbNm: string;
  cpnDcGbCd: string;
  cpnDcVal: number;
  cpnUsableStartDt: string | null;
  cpnUsableEndDt: string | null;
  unavailableGoodsCount: number;
  unavailableGoodsList: ShopMypageCouponUnavailableGoodsItem[];
}

// 마이페이지 다운로드 가능 쿠폰 아이템 타입입니다.
export interface ShopMypageDownloadableCouponItem {
  cpnNo: number;
  cpnNm: string;
  cpnGbCd: string;
  cpnGbNm: string;
  cpnDcGbCd: string;
  cpnDcVal: number;
  cpnDownStartDt: string | null;
  cpnDownEndDt: string | null;
  cpnUseDtGb: string;
  cpnUsableDt: number | null;
  cpnUseStartDt: string | null;
  cpnUseEndDt: string | null;
  unavailableGoodsCount: number;
  unavailableGoodsList: ShopMypageCouponUnavailableGoodsItem[];
}

// 마이페이지 쿠폰 사용 불가 상품 아이템 타입입니다.
export interface ShopMypageCouponUnavailableGoodsItem {
  goodsId: string;
  goodsNm: string;
}

// 마이페이지 쿠폰함 페이지 응답 타입입니다.
export interface ShopMypageCouponPageResponse {
  ownedCouponList: ShopMypageOwnedCouponItem[];
  ownedCouponCount: number;
  ownedPageNo: number;
  ownedPageSize: number;
  ownedTotalPageCount: number;
  downloadableCouponList: ShopMypageDownloadableCouponItem[];
  downloadableCouponCount: number;
  downloadablePageNo: number;
  downloadablePageSize: number;
  downloadableTotalPageCount: number;
}
