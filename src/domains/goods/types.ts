// 상품상세 기본 상품 정보 타입입니다.
export interface ShopGoodsBasic {
  goodsId: string;
  goodsNm: string;
  goodsGroupId: string;
  brandNo: number | null;
  brandNm: string;
  brandLogoPath: string;
  brandNoti: string;
  erpColorCd: string;
  colorNm: string;
  colorRgb: string;
  supplyAmt: number;
  saleAmt: number;
}

// 상품상세 이미지 타입입니다.
export interface ShopGoodsImage {
  imgNo: number;
  goodsId: string;
  dispOrd: number;
  imgPath: string;
  imgUrl: string;
}

// 상품상세 그룹상품(컬러 옵션) 타입입니다.
export interface ShopGoodsGroupItem {
  goodsId: string;
  erpColorCd: string;
  colorNm: string;
  colorRgb: string;
  firstImgPath: string;
  firstImgUrl: string;
}

// 상품상세 사이즈 타입입니다.
export interface ShopGoodsSizeItem {
  goodsId: string;
  sizeId: string;
  stockQty: number;
  addAmt: number;
  dispOrd: number;
  soldOut: boolean;
}

// 상품상세 기기별 설명 타입입니다.
export interface ShopGoodsDesc {
  pcDesc: string;
  moDesc: string;
}

// 상품상세 위시리스트 상태 타입입니다.
export interface ShopGoodsWishlist {
  wished: boolean;
}

// 상품상세 사이트 배송 기준 타입입니다.
export interface ShopGoodsSiteInfo {
  siteId: string;
  siteNm: string;
  deliveryFee: number;
  deliveryFeeLimit: number;
}

// 상품상세 상품쿠폰 타입입니다.
export interface ShopGoodsCoupon {
  cpnNo: number;
  cpnNm: string;
  cpnStatCd: string;
  cpnGbCd: string;
  cpnTargetCd: string;
  cpnDcGbCd: string;
  cpnDcVal: number;
  cpnDownStartDt: string | null;
  cpnDownEndDt: string | null;
  cpnUseDtGb: string;
  cpnUsableDt: number | null;
  cpnUseStartDt: string | null;
  cpnUseEndDt: string | null;
}

// 상품상세 가격 요약 타입입니다.
export interface ShopGoodsPriceSummary {
  supplyAmt: number;
  saleAmt: number;
  showSupplyStrike: boolean;
  discountRate: number;
}

// 상품상세 포인트 요약 타입입니다.
export interface ShopGoodsPointSummary {
  custGradeCd: string;
  pointSaveRate: number;
  expectedPoint: number;
}

// 상품상세 배송비 요약 타입입니다.
export interface ShopGoodsShippingSummary {
  freeDelivery: boolean;
  deliveryFee: number;
  deliveryFeeLimit: number;
  shippingMessage: string;
}

// 상품상세 API 응답 타입입니다.
export interface ShopGoodsDetailResponse {
  goods: ShopGoodsBasic;
  images: ShopGoodsImage[];
  groupGoods: ShopGoodsGroupItem[];
  sizes: ShopGoodsSizeItem[];
  detailDesc: ShopGoodsDesc;
  wishlist: ShopGoodsWishlist;
  siteInfo: ShopGoodsSiteInfo;
  coupons: ShopGoodsCoupon[];
  priceSummary: ShopGoodsPriceSummary;
  pointSummary: ShopGoodsPointSummary;
  shippingSummary: ShopGoodsShippingSummary;
}
