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
  ShopOrderCouponItem,
  ShopOrderCouponOption,
  ShopOrderCustomerInfo,
  ShopOrderDiscountAmount,
  ShopOrderDiscountQuoteResponse,
  ShopOrderDiscountSelection,
  ShopOrderGoodsCouponGroup,
  ShopOrderGoodsCouponSelection,
  ShopOrderPaymentConfig,
  ShopOrderPaymentConfirmResponse,
  ShopOrderPaymentPrepareResponse,
  ShopOrderPageResponse,
  ShopOrderPointSaveSummary,
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

// 주문서 할인 재계산 API 경로를 반환합니다.
export function getShopOrderDiscountQuotePath(): string {
  return "/api/shop/order/discount/quote";
}

// 주문 결제 준비 API 경로를 반환합니다.
export function getShopOrderPaymentPreparePath(): string {
  return "/api/shop/order/payment/prepare";
}

// 주문 결제 승인 API 경로를 반환합니다.
export function getShopOrderPaymentConfirmPath(): string {
  return "/api/shop/order/payment/confirm";
}

// 주문 결제 실패 반영 API 경로를 반환합니다.
export function getShopOrderPaymentFailPath(): string {
  return "/api/shop/order/payment/fail";
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

// 주문서 쿠폰 선택 항목을 기본값과 함께 정규화합니다.
function normalizeShopOrderCouponItem(rawCoupon: unknown): ShopOrderCouponItem {
  const source = (rawCoupon ?? {}) as Partial<ShopOrderCouponItem>;
  return {
    custCpnNo: normalizeNonNegativeNumber(source.custCpnNo),
    cpnNo: normalizeNonNegativeNumber(source.cpnNo),
    cpnNm: normalizeString(source.cpnNm),
    cpnGbCd: normalizeString(source.cpnGbCd),
    cpnTargetCd: normalizeString(source.cpnTargetCd),
    cpnDcGbCd: normalizeString(source.cpnDcGbCd),
    cpnDcVal: normalizeNonNegativeNumber(source.cpnDcVal),
    cpnUsableStartDt: normalizeString(source.cpnUsableStartDt),
    cpnUsableEndDt: normalizeString(source.cpnUsableEndDt),
  };
}

// 주문서 상품별 상품쿠폰 그룹을 기본값과 함께 정규화합니다.
function normalizeShopOrderGoodsCouponGroup(rawGroup: unknown): ShopOrderGoodsCouponGroup {
  const source = (rawGroup ?? {}) as Partial<ShopOrderGoodsCouponGroup>;
  return {
    cartId: normalizeNonNegativeNumber(source.cartId),
    goodsId: normalizeString(source.goodsId),
    goodsNm: normalizeString(source.goodsNm),
    sizeId: normalizeString(source.sizeId),
    couponList: Array.isArray(source.couponList) ? source.couponList.map(normalizeShopOrderCouponItem) : [],
  };
}

// 주문서 쿠폰 선택 후보 목록을 기본값과 함께 정규화합니다.
function normalizeShopOrderCouponOption(rawOption: unknown): ShopOrderCouponOption {
  const source = (rawOption ?? {}) as Partial<ShopOrderCouponOption>;
  return {
    goodsCouponGroupList: Array.isArray(source.goodsCouponGroupList)
      ? source.goodsCouponGroupList.map(normalizeShopOrderGoodsCouponGroup)
      : [],
    cartCouponList: Array.isArray(source.cartCouponList) ? source.cartCouponList.map(normalizeShopOrderCouponItem) : [],
    deliveryCouponList: Array.isArray(source.deliveryCouponList)
      ? source.deliveryCouponList.map(normalizeShopOrderCouponItem)
      : [],
  };
}

// 주문서 상품쿠폰 선택 항목을 기본값과 함께 정규화합니다.
function normalizeShopOrderGoodsCouponSelection(rawSelection: unknown): ShopOrderGoodsCouponSelection {
  const source = (rawSelection ?? {}) as Partial<ShopOrderGoodsCouponSelection>;
  const normalizedCustCpnNo = normalizeNonNegativeNumber(source.custCpnNo);
  return {
    cartId: normalizeNonNegativeNumber(source.cartId),
    custCpnNo: normalizedCustCpnNo > 0 ? normalizedCustCpnNo : null,
  };
}

// 주문서 쿠폰 선택 상태를 기본값과 함께 정규화합니다.
function normalizeShopOrderDiscountSelection(rawSelection: unknown): ShopOrderDiscountSelection {
  const source = (rawSelection ?? {}) as Partial<ShopOrderDiscountSelection>;
  const normalizedCartCouponCustCpnNo = normalizeNonNegativeNumber(source.cartCouponCustCpnNo);
  const normalizedDeliveryCouponCustCpnNo = normalizeNonNegativeNumber(source.deliveryCouponCustCpnNo);
  return {
    goodsCouponSelectionList: Array.isArray(source.goodsCouponSelectionList)
      ? source.goodsCouponSelectionList.map(normalizeShopOrderGoodsCouponSelection)
      : [],
    cartCouponCustCpnNo: normalizedCartCouponCustCpnNo > 0 ? normalizedCartCouponCustCpnNo : null,
    deliveryCouponCustCpnNo: normalizedDeliveryCouponCustCpnNo > 0 ? normalizedDeliveryCouponCustCpnNo : null,
  };
}

// 주문서 할인 금액 요약을 기본값과 함께 정규화합니다.
function normalizeShopOrderDiscountAmount(rawAmount: unknown): ShopOrderDiscountAmount {
  const source = (rawAmount ?? {}) as Partial<ShopOrderDiscountAmount>;
  return {
    goodsCouponDiscountAmt: normalizeNonNegativeNumber(source.goodsCouponDiscountAmt),
    cartCouponDiscountAmt: normalizeNonNegativeNumber(source.cartCouponDiscountAmt),
    deliveryCouponDiscountAmt: normalizeNonNegativeNumber(source.deliveryCouponDiscountAmt),
    couponDiscountAmt: normalizeNonNegativeNumber(source.couponDiscountAmt),
    maxPointUseAmt: normalizeNonNegativeNumber(source.maxPointUseAmt),
  };
}

// 주문서 결제 환경 정보를 기본값과 함께 정규화합니다.
function normalizeShopOrderPaymentConfig(rawConfig: unknown): ShopOrderPaymentConfig {
  const source = (rawConfig ?? {}) as Partial<ShopOrderPaymentConfig>;
  return {
    clientKey: normalizeString(source.clientKey),
    apiVersion: normalizeString(source.apiVersion),
    successUrlBase: normalizeString(source.successUrlBase),
    failUrlBase: normalizeString(source.failUrlBase),
  };
}

// 주문 고객 기본 정보를 기본값과 함께 정규화합니다.
function normalizeShopOrderCustomerInfo(rawCustomerInfo: unknown): ShopOrderCustomerInfo {
  const source = (rawCustomerInfo ?? {}) as Partial<ShopOrderCustomerInfo>;
  return {
    custNo: normalizeNonNegativeNumber(source.custNo),
    custNm: normalizeString(source.custNm),
    email: normalizeString(source.email),
    phoneNumber: normalizeString(source.phoneNumber),
    customerKey: normalizeString(source.customerKey),
    deviceGbCd: normalizeString(source.deviceGbCd),
    custGradeCd: normalizeString(source.custGradeCd),
  };
}

// 적립 예정 포인트 요약 정보를 기본값과 함께 정규화합니다.
function normalizeShopOrderPointSaveSummary(rawSummary: unknown): ShopOrderPointSaveSummary {
  const source = (rawSummary ?? {}) as Partial<ShopOrderPointSaveSummary>;
  return {
    totalExpectedPoint: normalizeNonNegativeNumber(source.totalExpectedPoint),
    pointSaveRate: normalizeNonNegativeNumber(source.pointSaveRate),
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
    availablePointAmt: 0,
    couponOption: {
      goodsCouponGroupList: [],
      cartCouponList: [],
      deliveryCouponList: [],
    },
    discountSelection: {
      goodsCouponSelectionList: [],
      cartCouponCustCpnNo: null,
      deliveryCouponCustCpnNo: null,
    },
    discountAmount: {
      goodsCouponDiscountAmt: 0,
      cartCouponDiscountAmt: 0,
      deliveryCouponDiscountAmt: 0,
      couponDiscountAmt: 0,
      maxPointUseAmt: 0,
    },
    paymentConfig: {
      clientKey: "",
      apiVersion: "",
      successUrlBase: "",
      failUrlBase: "",
    },
    customerInfo: {
      custNo: 0,
      custNm: "",
      email: "",
      phoneNumber: "",
      customerKey: "",
      deviceGbCd: "",
      custGradeCd: "",
    },
    pointSaveSummary: {
      totalExpectedPoint: 0,
      pointSaveRate: 0,
    },
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
    availablePointAmt: normalizeNonNegativeNumber(source.availablePointAmt),
    couponOption: normalizeShopOrderCouponOption(source.couponOption),
    discountSelection: normalizeShopOrderDiscountSelection(source.discountSelection),
    discountAmount: normalizeShopOrderDiscountAmount(source.discountAmount),
    paymentConfig: normalizeShopOrderPaymentConfig(source.paymentConfig),
    customerInfo: normalizeShopOrderCustomerInfo(source.customerInfo),
    pointSaveSummary: normalizeShopOrderPointSaveSummary(source.pointSaveSummary),
  };
}

// 주문서 할인 재계산 응답 기본값을 생성합니다.
export function createDefaultShopOrderDiscountQuoteResponse(): ShopOrderDiscountQuoteResponse {
  return {
    discountSelection: {
      goodsCouponSelectionList: [],
      cartCouponCustCpnNo: null,
      deliveryCouponCustCpnNo: null,
    },
    discountAmount: {
      goodsCouponDiscountAmt: 0,
      cartCouponDiscountAmt: 0,
      deliveryCouponDiscountAmt: 0,
      couponDiscountAmt: 0,
      maxPointUseAmt: 0,
    },
  };
}

// 주문서 할인 재계산 응답을 기본값과 함께 정규화합니다.
export function normalizeShopOrderDiscountQuoteResponse(rawResponse: unknown): ShopOrderDiscountQuoteResponse {
  const source = (rawResponse ?? {}) as Partial<ShopOrderDiscountQuoteResponse>;
  return {
    discountSelection: normalizeShopOrderDiscountSelection(source.discountSelection),
    discountAmount: normalizeShopOrderDiscountAmount(source.discountAmount),
  };
}

// 주문 결제 준비 응답을 기본값과 함께 정규화합니다.
export function normalizeShopOrderPaymentPrepareResponse(rawResponse: unknown): ShopOrderPaymentPrepareResponse {
  const source = (rawResponse ?? {}) as Partial<ShopOrderPaymentPrepareResponse>;
  return {
    ordNo: normalizeString(source.ordNo),
    payNo: normalizeNonNegativeNumber(source.payNo),
    clientKey: normalizeString(source.clientKey),
    method: normalizeString(source.method),
    orderId: normalizeString(source.orderId),
    orderName: normalizeString(source.orderName),
    amount: normalizeNonNegativeNumber(source.amount),
    customerKey: normalizeString(source.customerKey),
    customerName: normalizeString(source.customerName),
    customerEmail: normalizeString(source.customerEmail),
    customerMobilePhone: normalizeString(source.customerMobilePhone),
    successUrl: normalizeString(source.successUrl),
    failUrl: normalizeString(source.failUrl),
  };
}

// 주문 결제 승인 응답을 기본값과 함께 정규화합니다.
export function normalizeShopOrderPaymentConfirmResponse(rawResponse: unknown): ShopOrderPaymentConfirmResponse {
  const source = (rawResponse ?? {}) as Partial<ShopOrderPaymentConfirmResponse>;
  return {
    ordNo: normalizeString(source.ordNo),
    payNo: normalizeNonNegativeNumber(source.payNo),
    payMethodCd: normalizeString(source.payMethodCd) as ShopOrderPaymentConfirmResponse["payMethodCd"],
    payStatCd: normalizeString(source.payStatCd),
    ordStatCd: normalizeString(source.ordStatCd),
    orderName: normalizeString(source.orderName),
    amount: normalizeNonNegativeNumber(source.amount),
    bankCd: normalizeString(source.bankCd),
    bankNm: normalizeString(source.bankNm),
    bankNo: normalizeString(source.bankNo),
    vactHolderNm: normalizeString(source.vactHolderNm),
    vactDueDt: normalizeString(source.vactDueDt),
  };
}
