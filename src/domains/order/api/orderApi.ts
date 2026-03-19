import {
  createDefaultShopCartPageResponse,
  normalizeShopCartItem,
  normalizeShopCartSiteInfo,
} from "@/domains/cart/api/cartServerApi";
import type {
  ShopOrderAddress,
  ShopOrderAddressSaveResponse,
  ShopOrderAddressSearchCommon,
  ShopOrderAddressSearchItem,
  ShopOrderAddressSearchResponse,
  ShopOrderPageResponse,
} from "@/domains/order/types";

// 숫자 값을 0 이상 정수로 보정합니다.
function normalizeNonNegativeNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(Math.floor(value), 0);
}

// 문자열 값을 기본값과 함께 정규화합니다.
function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// 주문서 페이지 API 경로를 생성합니다.
export function getShopOrderPagePath(cartIdList: readonly number[]): string {
  const searchParams = new URLSearchParams();
  cartIdList.forEach((cartId) => {
    searchParams.append("cartId", String(cartId));
  });
  const queryString = searchParams.toString();
  return queryString === "" ? "/api/shop/order/page" : `/api/shop/order/page?${queryString}`;
}

// 주문서 배송지 검색 API 경로를 생성합니다.
export function getShopOrderAddressSearchPath(keyword: string, currentPage: number, countPerPage: number): string {
  const searchParams = new URLSearchParams();
  searchParams.set("keyword", keyword);
  searchParams.set("currentPage", String(currentPage));
  searchParams.set("countPerPage", String(countPerPage));
  return `/api/shop/order/address/search?${searchParams.toString()}`;
}

// 주문서 배송지 등록 API 경로를 반환합니다.
export function getShopOrderAddressRegisterPath(): string {
  return "/api/shop/order/address";
}

// 주문서 배송지 수정 API 경로를 반환합니다.
export function getShopOrderAddressUpdatePath(): string {
  return "/api/shop/order/address";
}

// 주문서 배송지 단건을 기본값과 함께 정규화합니다.
export function normalizeShopOrderAddress(rawAddress: unknown): ShopOrderAddress {
  const source = (rawAddress ?? {}) as Partial<ShopOrderAddress>;
  return {
    custNo: normalizeNonNegativeNumber(source.custNo),
    addressNm: normalizeString(source.addressNm),
    postNo: normalizeString(source.postNo),
    baseAddress: normalizeString(source.baseAddress),
    detailAddress: normalizeString(source.detailAddress),
    phoneNumber: normalizeString(source.phoneNumber),
    rsvNm: normalizeString(source.rsvNm),
    defaultYn: normalizeString(source.defaultYn),
  };
}

// 주문서 주소 검색 공통 응답을 기본값과 함께 정규화합니다.
function normalizeShopOrderAddressSearchCommon(rawCommon: unknown): ShopOrderAddressSearchCommon {
  const source = (rawCommon ?? {}) as Partial<ShopOrderAddressSearchCommon>;
  return {
    errorCode: normalizeString(source.errorCode),
    errorMessage: normalizeString(source.errorMessage),
    totalCount: normalizeNonNegativeNumber(source.totalCount),
    currentPage: normalizeNonNegativeNumber(source.currentPage),
    countPerPage: normalizeNonNegativeNumber(source.countPerPage),
  };
}

// 주문서 주소 검색 결과 단건을 기본값과 함께 정규화합니다.
function normalizeShopOrderAddressSearchItem(rawItem: unknown): ShopOrderAddressSearchItem {
  const source = (rawItem ?? {}) as Partial<ShopOrderAddressSearchItem>;
  return {
    roadAddr: normalizeString(source.roadAddr),
    roadAddrPart1: normalizeString(source.roadAddrPart1),
    roadAddrPart2: normalizeString(source.roadAddrPart2),
    jibunAddr: normalizeString(source.jibunAddr),
    zipNo: normalizeString(source.zipNo),
    admCd: normalizeString(source.admCd),
    rnMgtSn: normalizeString(source.rnMgtSn),
    bdMgtSn: normalizeString(source.bdMgtSn),
  };
}

// 주문서 주소 검색 응답 기본값을 생성합니다.
export function createDefaultShopOrderAddressSearchResponse(): ShopOrderAddressSearchResponse {
  return {
    common: {
      errorCode: "",
      errorMessage: "",
      totalCount: 0,
      currentPage: 0,
      countPerPage: 0,
    },
    jusoList: [],
  };
}

// 주문서 주소 검색 응답을 기본값과 함께 정규화합니다.
export function normalizeShopOrderAddressSearchResponse(rawResponse: unknown): ShopOrderAddressSearchResponse {
  const source = (rawResponse ?? {}) as Partial<ShopOrderAddressSearchResponse>;
  const normalizedJusoList = Array.isArray(source.jusoList) ? source.jusoList.map(normalizeShopOrderAddressSearchItem) : [];
  return {
    common: normalizeShopOrderAddressSearchCommon(source.common),
    jusoList: normalizedJusoList,
  };
}

// 주문서 배송지 등록 응답 기본값을 생성합니다.
export function createDefaultShopOrderAddressSaveResponse(): ShopOrderAddressSaveResponse {
  return {
    addressList: [],
    defaultAddress: null,
    savedAddress: null,
  };
}

// 주문서 배송지 등록 응답을 기본값과 함께 정규화합니다.
export function normalizeShopOrderAddressSaveResponse(rawResponse: unknown): ShopOrderAddressSaveResponse {
  const source = (rawResponse ?? {}) as Partial<ShopOrderAddressSaveResponse>;
  const normalizedAddressList = Array.isArray(source.addressList) ? source.addressList.map(normalizeShopOrderAddress) : [];
  const normalizedDefaultAddress =
    source.defaultAddress && typeof source.defaultAddress === "object" ? normalizeShopOrderAddress(source.defaultAddress) : null;
  const normalizedSavedAddress =
    source.savedAddress && typeof source.savedAddress === "object" ? normalizeShopOrderAddress(source.savedAddress) : null;
  return {
    addressList: normalizedAddressList,
    defaultAddress: normalizedDefaultAddress,
    savedAddress: normalizedSavedAddress,
  };
}

// 주문서 페이지 응답 기본값을 생성합니다.
export function createDefaultShopOrderPageResponse(): ShopOrderPageResponse {
  const cartPage = createDefaultShopCartPageResponse();
  return {
    cartList: cartPage.cartList,
    cartCount: cartPage.cartCount,
    siteInfo: cartPage.siteInfo,
    addressList: [],
    defaultAddress: null,
  };
}

// 주문서 페이지 응답을 기본값과 함께 정규화합니다.
export function normalizeShopOrderPageResponse(rawResponse: unknown): ShopOrderPageResponse {
  const source = (rawResponse ?? {}) as Partial<ShopOrderPageResponse>;
  const normalizedCartList = Array.isArray(source.cartList) ? source.cartList.map(normalizeShopCartItem) : [];
  const normalizedAddressList = Array.isArray(source.addressList) ? source.addressList.map(normalizeShopOrderAddress) : [];
  const normalizedDefaultAddress =
    source.defaultAddress && typeof source.defaultAddress === "object" ? normalizeShopOrderAddress(source.defaultAddress) : null;
  return {
    cartList: normalizedCartList,
    cartCount: normalizeNonNegativeNumber(source.cartCount),
    siteInfo: normalizeShopCartSiteInfo(source.siteInfo),
    addressList: normalizedAddressList,
    defaultAddress: normalizedDefaultAddress,
  };
}
