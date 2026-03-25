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
}

// 마이페이지 주문취소 제출 요청 타입입니다.
export interface ShopMypageOrderCancelSubmitRequest {
  ordNo: string;
  reasonCd: string;
  reasonDetail: string;
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
