// 장바구니 사이즈 옵션 타입입니다.
export interface ShopCartSizeOption {
  sizeId: string;
  stockQty: number;
  soldOut: boolean;
}

// 장바구니 상품 행 타입입니다.
export interface ShopCartItem {
  custNo: number;
  goodsId: string;
  goodsNm: string;
  sizeId: string;
  qty: number;
  supplyAmt: number;
  saleAmt: number;
  imgPath: string;
  imgUrl: string;
  sizeOptions: ShopCartSizeOption[];
}

// 장바구니 배송비 기준 사이트 정보 타입입니다.
export interface ShopCartSiteInfo {
  siteId: string;
  deliveryFee: number;
  deliveryFeeLimit: number;
}

// 장바구니 페이지 API 응답 타입입니다.
export interface ShopCartPageResponse {
  cartList: ShopCartItem[];
  cartCount: number;
  siteInfo: ShopCartSiteInfo;
}
