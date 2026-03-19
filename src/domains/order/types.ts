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

// 주문서 페이지 API 응답 타입입니다.
export interface ShopOrderPageResponse {
  cartList: ShopCartItem[];
  cartCount: number;
  siteInfo: ShopCartSiteInfo;
  addressList: ShopOrderAddress[];
  defaultAddress: ShopOrderAddress | null;
}
