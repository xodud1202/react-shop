import type { ShopOrderAddress } from "@/domains/order/types";

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

// 마이페이지 주문내역 주문상세 아이템 타입입니다.
export interface ShopMypageOrderDetailItem {
  ordNo: string;
  ordDtlNo: number;
  ordDtlStatCd: string;
  ordDtlStatNm: string;
  returnApplyableYn: boolean;
  goodsId: string;
  goodsNm: string;
  sizeId: string;
  ordQty: number;
  cancelableQty: number;
  supplyAmt: number;
  saleAmt: number;
  addAmt: number;
  goodsCouponDiscountAmt: number;
  cartCouponDiscountAmt: number;
  pointUseAmt: number;
  imgPath: string;
  imgUrl: string;
}

// 마이페이지 주문내역 주문번호 그룹 타입입니다.
export interface ShopMypageOrderGroup {
  ordNo: string;
  orderDt: string;
  detailList: ShopMypageOrderDetailItem[];
}

// 마이페이지 주문내역 상태 요약 타입입니다.
export interface ShopMypageOrderStatusSummary {
  waitingForDepositCount: number;
  paymentCompletedCount: number;
  productPreparingCount: number;
  deliveryPreparingCount: number;
  shippingCount: number;
  deliveryCompletedCount: number;
  purchaseConfirmedCount: number;
}

// 마이페이지 주문내역 페이지 응답 타입입니다.
export interface ShopMypageOrderPageResponse {
  orderList: ShopMypageOrderGroup[];
  orderCount: number;
  pageNo: number;
  pageSize: number;
  totalPageCount: number;
  startDate: string;
  endDate: string;
  statusSummary: ShopMypageOrderStatusSummary;
}

// 마이페이지 주문상세 금액 요약 타입입니다.
export interface ShopMypageOrderAmountSummary {
  totalSupplyAmt: number;
  totalOrderAmt: number;
  totalGoodsDiscountAmt: number;
  totalGoodsCouponDiscountAmt: number;
  totalCartCouponDiscountAmt: number;
  totalCouponDiscountAmt: number;
  totalPointUseAmt: number;
  deliveryFeeAmt: number;
  deliveryCouponDiscountAmt: number;
  finalPayAmt: number;
}

// 마이페이지 주문상세 페이지 응답 타입입니다.
export interface ShopMypageOrderDetailPageResponse {
  order: ShopMypageOrderGroup | null;
  amountSummary: ShopMypageOrderAmountSummary;
}

// 마이페이지 주문취소 사유 코드 아이템 타입입니다.
export interface ShopMypageOrderCancelReasonItem {
  cd: string;
  cdNm: string;
}

// 마이페이지 주문취소 화면 배송 기준 타입입니다.
export interface ShopMypageOrderCancelSiteInfo {
  siteId: string;
  deliveryFee: number;
  deliveryFeeLimit: number;
}

// 마이페이지 주문취소 신청 화면 응답 타입입니다.
export interface ShopMypageOrderCancelPageResponse {
  order: ShopMypageOrderGroup | null;
  amountSummary: ShopMypageOrderAmountSummary;
  reasonList: ShopMypageOrderCancelReasonItem[];
  siteInfo: ShopMypageOrderCancelSiteInfo;
}

// 마이페이지 반품 사유 코드 아이템 타입입니다.
export type ShopMypageOrderReturnReasonItem = ShopMypageOrderCancelReasonItem;

// 마이페이지 상품별 클레임 사유 상태 타입입니다.
export interface ShopMypageOrderItemReasonState {
  reasonCd: string;
  reasonDetail: string;
}

// 마이페이지 상품별 클레임 사유 상태 맵 타입입니다.
export type ShopMypageOrderItemReasonMap = Record<number, ShopMypageOrderItemReasonState>;

// 마이페이지 반품 배송비 계산 컨텍스트 타입입니다.
export interface ShopMypageOrderReturnFeeContext {
  originalPaidDeliveryAmt: number;
  originalFreeDeliveryYn: boolean;
  hasPriorCompanyFaultReturnOrExchange: boolean;
  hasPriorCustomerFaultReturnDeduction: boolean;
  currentRemainingFinalPayAmt: number;
}

// 마이페이지 반품 신청 화면 응답 타입입니다.
export interface ShopMypageOrderReturnPageResponse {
  order: ShopMypageOrderGroup | null;
  amountSummary: ShopMypageOrderAmountSummary;
  reasonList: ShopMypageOrderReturnReasonItem[];
  siteInfo: ShopMypageOrderCancelSiteInfo;
  returnFeeContext: ShopMypageOrderReturnFeeContext;
  addressList: ShopOrderAddress[];
  pickupAddress: ShopOrderAddress | null;
}

// 마이페이지 주문취소 제출용 미리보기 금액 타입입니다.
export interface ShopMypageOrderCancelPreviewAmount {
  expectedRefundAmt: number;
  paidGoodsAmt: number;
  benefitAmt: number;
  shippingAdjustmentAmt: number;
  totalPointRefundAmt: number;
  deliveryCouponRefundAmt: number;
}

// 마이페이지 주문취소 제출 주문상품 아이템 타입입니다.
export interface ShopMypageOrderCancelSubmitItem {
  ordDtlNo: number;
  cancelQty: number;
  reasonCd: string;
  reasonDetail: string;
}

// 마이페이지 주문취소 제출 요청 타입입니다.
export interface ShopMypageOrderCancelSubmitRequest {
  ordNo: string;
  cancelItemList: ShopMypageOrderCancelSubmitItem[];
  previewAmount: ShopMypageOrderCancelPreviewAmount;
}

// 마이페이지 주문취소 제출 응답 타입입니다.
export interface ShopMypageOrderCancelSubmitResponse {
  clmNo: string;
  ordNo: string;
  refundPayNo: number;
  payStatCd: string;
  refundedCashAmt: number;
  restoredPointAmt: number;
}

// 마이페이지 주문상태 변경 요청 타입입니다.
export interface ShopMypageOrderStatusActionRequest {
  ordNo: string;
  ordDtlNo: number;
}

// 마이페이지 주문상태 변경 응답 타입입니다.
export interface ShopMypageOrderStatusActionResponse {
  ordNo: string;
  ordDtlNo: number;
  ordDtlStatCd: string;
  updatedCount: number;
}

// 마이페이지 취소내역 상품 상세 아이템 타입입니다.
export interface ShopMypageCancelHistoryDetailItem {
  clmNo: string;
  ordDtlNo: number;
  goodsId: string;
  goodsNm: string;
  sizeId: string;
  qty: number;
  saleAmt: number;
  addAmt: number;
  chgReasonCd: string;
  chgReasonNm: string;
  chgReasonDtl: string;
  imgPath: string;
  imgUrl: string;
}

// 마이페이지 취소내역 클레임 단위 아이템 타입입니다.
export interface ShopMypageCancelHistoryItem {
  clmNo: string;
  ordNo: string;
  chgDt: string;
  chgStatCd: string;
  chgStatNm: string;
  payDelvAmt: number;
  refundedCashAmt: number;
  detailList: ShopMypageCancelHistoryDetailItem[];
}

// 마이페이지 취소내역 페이지 응답 타입입니다.
export interface ShopMypageCancelHistoryPageResponse {
  cancelList: ShopMypageCancelHistoryItem[];
  cancelCount: number;
  pageNo: number;
  pageSize: number;
  totalPageCount: number;
  startDate: string;
  endDate: string;
}

// 마이페이지 취소상세 페이지 응답 타입입니다.
export interface ShopMypageCancelDetailPageResponse {
  cancelItem: ShopMypageCancelHistoryItem | null;
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

// 마이페이지 포인트 내역 아이템 타입입니다. (CUSTOMER_POINT_DETAIL 기반)
export interface ShopMypagePointItem {
  /** 포인트번호 (CUSTOMER_POINT_BASE FK) */
  pntNo: number;
  /** 포인트 금액 (양수: 적립/복구, 음수: 사용/차감) */
  pntAmt: number;
  /** 연관 주문번호 (없으면 null) */
  ordNo: string | null;
  /** 비고 / 내용 */
  bigo: string;
  /** 발생 일시 (YYYY-MM-DD) */
  regDt: string;
}

// 마이페이지 포인트 내역 페이지 응답 타입입니다.
export interface ShopMypagePointPageResponse {
  /** 현재 사용 가능한 포인트 합계 */
  availablePointAmt: number;
  /** 7일 이내 만료 예정 포인트 합계 */
  expiringPointAmt: number;
  /** 포인트 내역 목록 */
  pointList: ShopMypagePointItem[];
  /** 전체 포인트 내역 건수 */
  pointCount: number;
  /** 현재 페이지 번호 */
  pageNo: number;
  /** 페이지 크기 */
  pageSize: number;
  /** 전체 페이지 수 */
  totalPageCount: number;
}
