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

// 주문서 결제 환경 정보 타입입니다.
export interface ShopOrderPaymentConfig {
  clientKey: string;
  apiVersion: string;
  successUrlBase: string;
  failUrlBase: string;
}

// 주문 고객 기본 정보 타입입니다.
export interface ShopOrderCustomerInfo {
  custNo: number;
  custNm: string;
  email: string;
  phoneNumber: string;
  customerKey: string;
  deviceGbCd: string;
  custGradeCd: string;
}

// 적립 예정 포인트 요약 타입입니다.
export interface ShopOrderPointSaveSummary {
  totalExpectedPoint: number;
  pointSaveRate: number;
}

// 주문서 결제수단 코드 타입입니다.
export type ShopOrderPaymentMethodCd = "" | "PAY_METHOD_01" | "PAY_METHOD_02" | "PAY_METHOD_03";

// 주문서 환불은행 선택 항목 타입입니다.
export interface ShopOrderRefundBankOption {
  cd: string;
  cdNm: string;
}

// 주문서 진입 정보 타입입니다.
export interface ShopOrderEntryInfo {
  from: "cart" | "goods";
  goodsId: string;
  cartIdList: number[];
}

// 주문서 결제 실패 안내 타입입니다.
export interface ShopOrderPaymentFailureInfo {
  payResult: string;
  code: string;
  message: string;
}

// 주문 결제 준비 요청 타입입니다.
export interface ShopOrderPaymentPrepareRequest {
  from: string;
  goodsId: string;
  cartIdList: number[];
  addressNm: string;
  discountSelection: ShopOrderDiscountSelection;
  pointUseAmt: number;
  paymentMethodCd: ShopOrderPaymentMethodCd;
  refundBankCd: string;
  refundBankNo: string;
  refundHolderNm: string;
}

// 주문 결제 준비 응답 타입입니다.
export interface ShopOrderPaymentPrepareResponse {
  ordNo: string;
  payNo: number;
  clientKey: string;
  method: string;
  orderId: string;
  orderName: string;
  amount: number;
  customerKey: string;
  customerName: string;
  customerEmail: string;
  customerMobilePhone: string;
  successUrl: string;
  failUrl: string;
}

// 주문 결제 승인 요청 타입입니다.
export interface ShopOrderPaymentConfirmRequest {
  payNo: number;
  ordNo: string;
  paymentKey: string;
  amount: number;
}

// 주문 결제 승인 응답 타입입니다.
export interface ShopOrderPaymentConfirmResponse {
  ordNo: string;
  payNo: number;
  payMethodCd: ShopOrderPaymentMethodCd;
  payStatCd: string;
  ordStatCd: string;
  orderName: string;
  amount: number;
  bankCd: string;
  bankNm: string;
  bankNo: string;
  vactHolderNm: string;
  vactDueDt: string;
}

// 주문 결제 실패 반영 요청 타입입니다.
export interface ShopOrderPaymentFailRequest {
  payNo: number;
  ordNo: string;
  code: string;
  message: string;
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
  paymentConfig: ShopOrderPaymentConfig;
  refundBankList: ShopOrderRefundBankOption[];
  customerInfo: ShopOrderCustomerInfo;
  pointSaveSummary: ShopOrderPointSaveSummary;
}
