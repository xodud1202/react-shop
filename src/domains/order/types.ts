import type { ShopCartItem, ShopCartSiteInfo } from "@/domains/cart/types";

// 주문서 배송지 정보 타입입니다.
export interface ShopOrderAddress {
  custNo: number;
  addressNm: string;
  postNo: string;
  baseAddress: string;
  detailAddress: string;
  phoneNumber: string;
  rsvNm: string;
  defaultYn: string;
}

// 주문서 주소 검색 공통 응답 타입입니다.
export interface ShopOrderAddressSearchCommon {
  errorCode: string;
  errorMessage: string;
  totalCount: number;
  currentPage: number;
  countPerPage: number;
}

// 주문서 주소 검색 결과 단건 타입입니다.
export interface ShopOrderAddressSearchItem {
  roadAddr: string;
  roadAddrPart1: string;
  roadAddrPart2: string;
  jibunAddr: string;
  zipNo: string;
  admCd: string;
  rnMgtSn: string;
  bdMgtSn: string;
}

// 주문서 주소 검색 응답 타입입니다.
export interface ShopOrderAddressSearchResponse {
  common: ShopOrderAddressSearchCommon;
  jusoList: ShopOrderAddressSearchItem[];
}

// 주문서 배송지 등록 요청 타입입니다.
export interface ShopOrderAddressRegisterRequest {
  addressNm: string;
  postNo: string;
  baseAddress: string;
  detailAddress: string;
  phoneNumber: string;
  rsvNm: string;
  defaultYn: string;
}

// 주문서 배송지 수정 요청 타입입니다.
export interface ShopOrderAddressUpdateRequest extends ShopOrderAddressRegisterRequest {
  originAddressNm: string;
}

// 주문서 배송지 등록 응답 타입입니다.
export interface ShopOrderAddressSaveResponse {
  addressList: ShopOrderAddress[];
  defaultAddress: ShopOrderAddress | null;
  savedAddress: ShopOrderAddress | null;
}

// 주문서 쿠폰 선택 항목 타입입니다.
export interface ShopOrderCouponItem {
  custCpnNo: number;
  cpnNo: number;
  cpnNm: string;
  cpnGbCd: string;
  cpnTargetCd: string;
  cpnDcGbCd: string;
  cpnDcVal: number;
  cpnUsableStartDt: string;
  cpnUsableEndDt: string;
}

// 주문서 상품별 상품쿠폰 선택 그룹 타입입니다.
export interface ShopOrderGoodsCouponGroup {
  cartId: number;
  goodsId: string;
  goodsNm: string;
  sizeId: string;
  couponList: ShopOrderCouponItem[];
}

// 주문서 쿠폰 선택 후보 목록 타입입니다.
export interface ShopOrderCouponOption {
  goodsCouponGroupList: ShopOrderGoodsCouponGroup[];
  cartCouponList: ShopOrderCouponItem[];
  deliveryCouponList: ShopOrderCouponItem[];
}

// 주문서 상품쿠폰 선택 항목 타입입니다.
export interface ShopOrderGoodsCouponSelection {
  cartId: number;
  custCpnNo: number | null;
}

// 주문서 쿠폰 선택 상태 타입입니다.
export interface ShopOrderDiscountSelection {
  goodsCouponSelectionList: ShopOrderGoodsCouponSelection[];
  cartCouponCustCpnNo: number | null;
  deliveryCouponCustCpnNo: number | null;
}

// 주문서 할인 금액 요약 타입입니다.
export interface ShopOrderDiscountAmount {
  goodsCouponDiscountAmt: number;
  cartCouponDiscountAmt: number;
  deliveryCouponDiscountAmt: number;
  couponDiscountAmt: number;
  maxPointUseAmt: number;
}

// 주문서 할인 재계산 요청 타입입니다.
export interface ShopOrderDiscountQuoteRequest {
  cartIdList: number[];
  goodsCouponSelectionList: ShopOrderGoodsCouponSelection[];
  cartCouponCustCpnNo: number | null;
  deliveryCouponCustCpnNo: number | null;
}

// 주문서 할인 재계산 응답 타입입니다.
export interface ShopOrderDiscountQuoteResponse {
  discountSelection: ShopOrderDiscountSelection;
  discountAmount: ShopOrderDiscountAmount;
}

// 주문서 페이지 API 응답 타입입니다.
export interface ShopOrderPageResponse {
  cartList: ShopCartItem[];
  cartCount: number;
  siteInfo: ShopCartSiteInfo;
  addressList: ShopOrderAddress[];
  defaultAddress: ShopOrderAddress | null;
  availablePointAmt: number;
  couponOption: ShopOrderCouponOption;
  discountSelection: ShopOrderDiscountSelection;
  discountAmount: ShopOrderDiscountAmount;
}
