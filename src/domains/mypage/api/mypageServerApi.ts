import type {
  ShopMypageCancelDetailPageResponse,
  ShopMypageCancelHistoryDetailItem,
  ShopMypageCancelHistoryItem,
  ShopMypageCancelHistoryPageResponse,
  ShopMypageCouponPageResponse,
  ShopMypageCouponUnavailableGoodsItem,
  ShopMypageDownloadableCouponItem,
  ShopMypageOrderAmountSummary,
  ShopMypageOrderCancelPageResponse,
  ShopMypageOrderCancelReasonItem,
  ShopMypageOrderCancelSiteInfo,
  ShopMypageOrderDetailItem,
  ShopMypageOrderDetailPageResponse,
  ShopMypageOrderGroup,
  ShopMypageOrderPageResponse,
  ShopMypageOrderReturnPageResponse,
  ShopMypageOrderStatusSummary,
  ShopMypageOwnedCouponItem,
  ShopMypageWishPageResponse,
  ShopMypagePointItem,
  ShopMypagePointPageResponse,
} from "@/domains/mypage/types";
import { readShopServerApiResponse } from "@/shared/server/readShopServerApiResponse";

// 마이페이지 위시리스트 기본 응답값을 생성합니다.
function createDefaultShopMypageWishPageResponse(): ShopMypageWishPageResponse {
  return {
    goodsList: [],
    goodsCount: 0,
    pageNo: 1,
    pageSize: 10,
    totalPageCount: 0,
  };
}

// 마이페이지 쿠폰함 기본 응답값을 생성합니다.
function createDefaultShopMypageCouponPageResponse(): ShopMypageCouponPageResponse {
  return {
    ownedCouponList: [],
    ownedCouponCount: 0,
    ownedPageNo: 1,
    ownedPageSize: 10,
    ownedTotalPageCount: 0,
    downloadableCouponList: [],
    downloadableCouponCount: 0,
    downloadablePageNo: 1,
    downloadablePageSize: 10,
    downloadableTotalPageCount: 0,
  };
}

// 마이페이지 주문내역 기본 상태 요약 응답값을 생성합니다.
function createDefaultShopMypageOrderStatusSummary(): ShopMypageOrderStatusSummary {
  return {
    waitingForDepositCount: 0,
    paymentCompletedCount: 0,
    productPreparingCount: 0,
    deliveryPreparingCount: 0,
    shippingCount: 0,
    deliveryCompletedCount: 0,
    purchaseConfirmedCount: 0,
  };
}

// 마이페이지 주문내역 기본 응답값을 생성합니다.
function createDefaultShopMypageOrderPageResponse(): ShopMypageOrderPageResponse {
  return {
    orderList: [],
    orderCount: 0,
    pageNo: 1,
    pageSize: 5,
    totalPageCount: 0,
    startDate: "",
    endDate: "",
    statusSummary: createDefaultShopMypageOrderStatusSummary(),
  };
}

// 마이페이지 주문상세 기본 금액 요약 응답값을 생성합니다.
function createDefaultShopMypageOrderAmountSummary(): ShopMypageOrderAmountSummary {
  return {
    totalSupplyAmt: 0,
    totalOrderAmt: 0,
    totalGoodsDiscountAmt: 0,
    totalGoodsCouponDiscountAmt: 0,
    totalCartCouponDiscountAmt: 0,
    totalCouponDiscountAmt: 0,
    totalPointUseAmt: 0,
    deliveryFeeAmt: 0,
    deliveryCouponDiscountAmt: 0,
    finalPayAmt: 0,
  };
}

// 마이페이지 주문취소 화면 배송 기준 기본 응답값을 생성합니다.
function createDefaultShopMypageOrderCancelSiteInfo(): ShopMypageOrderCancelSiteInfo {
  return {
    siteId: "",
    deliveryFee: 0,
    deliveryFeeLimit: 0,
  };
}

// 정수형 숫자값을 0 이상의 값으로 보정합니다.
function normalizeNonNegativeNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(Math.floor(value), 0);
}

// 정수형 숫자값을 nullable 0 이상 값으로 보정합니다.
function normalizeNullableNonNegativeNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return Math.max(Math.floor(value), 0);
}

// 문자열 또는 null 값을 안전하게 보정합니다.
function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmedValue = value.trim();
  return trimmedValue === "" ? null : trimmedValue;
}

// 불리언 값을 안전하게 보정합니다.
function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue === "true" || normalizedValue === "1" || normalizedValue === "y";
  }
  return false;
}

// 문자열 값을 빈 문자열 기본값으로 보정합니다.
function normalizeString(value: unknown): string {
  return normalizeNullableString(value) ?? "";
}

// 마이페이지 주문내역 주문상세 행을 기본값과 함께 정규화합니다.
function normalizeShopMypageOrderDetailItem(rawItem: unknown): ShopMypageOrderDetailItem {
  const source = (rawItem ?? {}) as Partial<ShopMypageOrderDetailItem>;
  return {
    ordNo: normalizeString(source.ordNo),
    ordDtlNo: normalizeNonNegativeNumber(source.ordDtlNo),
    ordDtlStatCd: normalizeString(source.ordDtlStatCd),
    ordDtlStatNm: normalizeString(source.ordDtlStatNm),
    returnApplyableYn: normalizeBoolean(source.returnApplyableYn),
    goodsId: normalizeString(source.goodsId),
    goodsNm: normalizeString(source.goodsNm),
    sizeId: normalizeString(source.sizeId),
    ordQty: normalizeNonNegativeNumber(source.ordQty),
    cancelableQty: normalizeNonNegativeNumber(source.cancelableQty),
    supplyAmt: normalizeNonNegativeNumber(source.supplyAmt),
    saleAmt: normalizeNonNegativeNumber(source.saleAmt),
    addAmt: normalizeNonNegativeNumber(source.addAmt),
    goodsCouponDiscountAmt: normalizeNonNegativeNumber(source.goodsCouponDiscountAmt),
    cartCouponDiscountAmt: normalizeNonNegativeNumber(source.cartCouponDiscountAmt),
    pointUseAmt: normalizeNonNegativeNumber(source.pointUseAmt),
    imgPath: normalizeString(source.imgPath),
    imgUrl: normalizeString(source.imgUrl),
  };
}

// 마이페이지 주문내역 주문번호 그룹을 기본값과 함께 정규화합니다.
function normalizeShopMypageOrderGroup(rawItem: unknown): ShopMypageOrderGroup {
  const source = (rawItem ?? {}) as Partial<ShopMypageOrderGroup>;
  return {
    ordNo: normalizeString(source.ordNo),
    orderDt: normalizeString(source.orderDt),
    detailList: Array.isArray(source.detailList)
      ? source.detailList.map((item) => normalizeShopMypageOrderDetailItem(item))
      : [],
  };
}

// 마이페이지 주문내역 상태 요약을 기본값과 함께 정규화합니다.
function normalizeShopMypageOrderStatusSummary(rawValue: unknown): ShopMypageOrderStatusSummary {
  const source = (rawValue ?? {}) as Partial<ShopMypageOrderStatusSummary>;
  return {
    waitingForDepositCount: normalizeNonNegativeNumber(source.waitingForDepositCount),
    paymentCompletedCount: normalizeNonNegativeNumber(source.paymentCompletedCount),
    productPreparingCount: normalizeNonNegativeNumber(source.productPreparingCount),
    deliveryPreparingCount: normalizeNonNegativeNumber(source.deliveryPreparingCount),
    shippingCount: normalizeNonNegativeNumber(source.shippingCount),
    deliveryCompletedCount: normalizeNonNegativeNumber(source.deliveryCompletedCount),
    purchaseConfirmedCount: normalizeNonNegativeNumber(source.purchaseConfirmedCount),
  };
}

// 마이페이지 주문상세 금액 요약을 기본값과 함께 정규화합니다.
function normalizeShopMypageOrderAmountSummary(rawValue: unknown): ShopMypageOrderAmountSummary {
  const source = (rawValue ?? {}) as Partial<ShopMypageOrderAmountSummary>;
  const totalGoodsCouponDiscountAmt = normalizeNonNegativeNumber(source.totalGoodsCouponDiscountAmt);
  const totalCartCouponDiscountAmt = normalizeNonNegativeNumber(source.totalCartCouponDiscountAmt);

  // 총 쿠폰할인 값이 없으면 세부 쿠폰 금액 합계로 보정합니다.
  const totalCouponDiscountAmt =
    source.totalCouponDiscountAmt === null || source.totalCouponDiscountAmt === undefined
      ? totalGoodsCouponDiscountAmt + totalCartCouponDiscountAmt
      : normalizeNonNegativeNumber(source.totalCouponDiscountAmt);

  return {
    totalSupplyAmt: normalizeNonNegativeNumber(source.totalSupplyAmt),
    totalOrderAmt: normalizeNonNegativeNumber(source.totalOrderAmt),
    totalGoodsDiscountAmt: normalizeNonNegativeNumber(source.totalGoodsDiscountAmt),
    totalGoodsCouponDiscountAmt,
    totalCartCouponDiscountAmt,
    totalCouponDiscountAmt,
    totalPointUseAmt: normalizeNonNegativeNumber(source.totalPointUseAmt),
    deliveryFeeAmt: normalizeNonNegativeNumber(source.deliveryFeeAmt),
    deliveryCouponDiscountAmt: normalizeNonNegativeNumber(source.deliveryCouponDiscountAmt),
    finalPayAmt: normalizeNonNegativeNumber(source.finalPayAmt),
  };
}

// 주문취소 사유 코드 응답 행을 기본값과 함께 정규화합니다.
function normalizeShopMypageOrderCancelReasonItem(rawItem: unknown): ShopMypageOrderCancelReasonItem {
  const source = (rawItem ?? {}) as Partial<ShopMypageOrderCancelReasonItem>;
  return {
    cd: normalizeString(source.cd),
    cdNm: normalizeString(source.cdNm),
  };
}

// 주문취소 화면 배송 기준 응답을 기본값과 함께 정규화합니다.
function normalizeShopMypageOrderCancelSiteInfo(rawValue: unknown): ShopMypageOrderCancelSiteInfo {
  const source = (rawValue ?? {}) as Partial<ShopMypageOrderCancelSiteInfo>;
  return {
    siteId: normalizeString(source.siteId),
    deliveryFee: normalizeNonNegativeNumber(source.deliveryFee),
    deliveryFeeLimit: normalizeNonNegativeNumber(source.deliveryFeeLimit),
  };
}

// 쿠폰 사용 불가 상품 응답 행을 기본값과 함께 정규화합니다.
function normalizeCouponUnavailableGoodsItem(rawItem: unknown): ShopMypageCouponUnavailableGoodsItem {
  const source = (rawItem ?? {}) as Partial<ShopMypageCouponUnavailableGoodsItem>;
  return {
    goodsId: normalizeString(source.goodsId),
    goodsNm: normalizeString(source.goodsNm),
  };
}

// 보유 쿠폰 응답 행을 기본값과 함께 정규화합니다.
function normalizeOwnedCouponItem(rawItem: unknown): ShopMypageOwnedCouponItem {
  const source = (rawItem ?? {}) as Partial<ShopMypageOwnedCouponItem>;
  return {
    custCpnNo: normalizeNonNegativeNumber(source.custCpnNo),
    cpnNo: normalizeNonNegativeNumber(source.cpnNo),
    cpnNm: normalizeString(source.cpnNm),
    cpnGbCd: normalizeString(source.cpnGbCd),
    cpnGbNm: normalizeString(source.cpnGbNm),
    cpnDcGbCd: normalizeString(source.cpnDcGbCd),
    cpnDcVal: normalizeNonNegativeNumber(source.cpnDcVal),
    cpnUsableStartDt: normalizeNullableString(source.cpnUsableStartDt),
    cpnUsableEndDt: normalizeNullableString(source.cpnUsableEndDt),
    unavailableGoodsCount: normalizeNonNegativeNumber(source.unavailableGoodsCount),
    unavailableGoodsList: Array.isArray(source.unavailableGoodsList)
      ? source.unavailableGoodsList.map((item) => normalizeCouponUnavailableGoodsItem(item))
      : [],
  };
}

// 다운로드 가능 쿠폰 응답 행을 기본값과 함께 정규화합니다.
function normalizeDownloadableCouponItem(rawItem: unknown): ShopMypageDownloadableCouponItem {
  const source = (rawItem ?? {}) as Partial<ShopMypageDownloadableCouponItem>;
  return {
    cpnNo: normalizeNonNegativeNumber(source.cpnNo),
    cpnNm: normalizeString(source.cpnNm),
    cpnGbCd: normalizeString(source.cpnGbCd),
    cpnGbNm: normalizeString(source.cpnGbNm),
    cpnDcGbCd: normalizeString(source.cpnDcGbCd),
    cpnDcVal: normalizeNonNegativeNumber(source.cpnDcVal),
    cpnDownStartDt: normalizeNullableString(source.cpnDownStartDt),
    cpnDownEndDt: normalizeNullableString(source.cpnDownEndDt),
    cpnUseDtGb: normalizeString(source.cpnUseDtGb),
    cpnUsableDt: normalizeNullableNonNegativeNumber(source.cpnUsableDt),
    cpnUseStartDt: normalizeNullableString(source.cpnUseStartDt),
    cpnUseEndDt: normalizeNullableString(source.cpnUseEndDt),
    unavailableGoodsCount: normalizeNonNegativeNumber(source.unavailableGoodsCount),
    unavailableGoodsList: Array.isArray(source.unavailableGoodsList)
      ? source.unavailableGoodsList.map((item) => normalizeCouponUnavailableGoodsItem(item))
      : [],
  };
}

// 쿠키 헤더 문자열로 SSR 요청 옵션을 생성합니다.
function buildRequestInitFromCookie(cookieHeader: string): RequestInit | undefined {
  return cookieHeader.trim() === "" ? undefined : { headers: { cookie: cookieHeader } };
}

// 요청 페이지 번호를 1 이상의 값으로 보정합니다.
function resolvePageNo(pageNo: number): number {
  if (!Number.isFinite(pageNo) || pageNo < 1) {
    return 1;
  }
  return Math.floor(pageNo);
}

// 마이페이지 위시리스트 API 경로를 생성합니다.
function buildShopMypageWishPagePath(pageNo: number): string {
  const queryParams = new URLSearchParams();
  queryParams.set("pageNo", String(resolvePageNo(pageNo)));
  return `/api/shop/mypage/wish/page?${queryParams.toString()}`;
}

// 마이페이지 쿠폰함 API 경로를 반환합니다.
function buildShopMypageCouponPagePath(ownedPageNo: number, downloadablePageNo: number): string {
  const queryParams = new URLSearchParams();
  queryParams.set("ownedPageNo", String(resolvePageNo(ownedPageNo)));
  queryParams.set("downloadablePageNo", String(resolvePageNo(downloadablePageNo)));
  return `/api/shop/mypage/coupon/page?${queryParams.toString()}`;
}

// 마이페이지 주문내역 API 경로를 생성합니다.
function buildShopMypageOrderPagePath(pageNo: number, startDate: string, endDate: string): string {
  const queryParams = new URLSearchParams();
  queryParams.set("pageNo", String(resolvePageNo(pageNo)));
  queryParams.set("startDate", normalizeString(startDate));
  queryParams.set("endDate", normalizeString(endDate));
  return `/api/shop/mypage/order/page?${queryParams.toString()}`;
}

// 마이페이지 주문상세 API 경로를 생성합니다.
function buildShopMypageOrderDetailPagePath(ordNo: string): string {
  const queryParams = new URLSearchParams();
  queryParams.set("ordNo", normalizeString(ordNo));
  return `/api/shop/mypage/order/detail?${queryParams.toString()}`;
}

// 마이페이지 주문취소 신청 화면 API 경로를 생성합니다.
function buildShopMypageOrderCancelPagePath(ordNo: string, ordDtlNo?: number): string {
  const queryParams = new URLSearchParams();
  queryParams.set("ordNo", normalizeString(ordNo));
  if (typeof ordDtlNo === "number" && Number.isFinite(ordDtlNo) && ordDtlNo > 0) {
    queryParams.set("ordDtlNo", String(Math.floor(ordDtlNo)));
  }
  return `/api/shop/mypage/order/cancel/page?${queryParams.toString()}`;
}

// 마이페이지 반품 신청 화면 API 경로를 생성합니다.
function buildShopMypageOrderReturnPagePath(ordNo: string, ordDtlNo?: number): string {
  const queryParams = new URLSearchParams();
  queryParams.set("ordNo", normalizeString(ordNo));
  if (typeof ordDtlNo === "number" && Number.isFinite(ordDtlNo) && ordDtlNo > 0) {
    queryParams.set("ordDtlNo", String(Math.floor(ordDtlNo)));
  }
  return `/api/shop/mypage/order/return/page?${queryParams.toString()}`;
}

// 마이페이지 개별 쿠폰 다운로드 API 경로를 반환합니다.
export function getShopMypageCouponDownloadPath(): string {
  return "/api/shop/mypage/coupon/download";
}

// 마이페이지 전체 쿠폰 다운로드 API 경로를 반환합니다.
export function getShopMypageCouponDownloadAllPath(): string {
  return "/api/shop/mypage/coupon/download/all";
}

// 마이페이지 취소상세 API 경로를 생성합니다.
function buildShopMypageCancelDetailPath(clmNo: string): string {
  const queryParams = new URLSearchParams();
  queryParams.set("clmNo", clmNo);
  return `/api/shop/mypage/order/cancel/detail?${queryParams.toString()}`;
}

// 마이페이지 취소내역 API 경로를 생성합니다.
function buildShopMypageCancelHistoryPagePath(pageNo: number, startDate: string, endDate: string): string {
  const queryParams = new URLSearchParams();
  queryParams.set("pageNo", String(resolvePageNo(pageNo)));
  queryParams.set("startDate", normalizeString(startDate));
  queryParams.set("endDate", normalizeString(endDate));
  return `/api/shop/mypage/order/cancel/history?${queryParams.toString()}`;
}

// 마이페이지 위시리스트 페이지 SSR 데이터를 조회합니다.
export async function fetchShopMypageWishPageServerData(
  pageNo: number,
  cookieHeader: string,
): Promise<ShopMypageWishPageResponse> {
  // 위시리스트 API 경로를 생성해 응답을 조회합니다.
  const path = buildShopMypageWishPagePath(pageNo);
  const requestInit = buildRequestInitFromCookie(cookieHeader);
  const response = await readShopServerApiResponse<ShopMypageWishPageResponse>(path, requestInit);
  const defaultResponse = createDefaultShopMypageWishPageResponse();

  // 응답 유효성을 확인한 뒤 기본값을 반환합니다.
  if (!response) {
    return defaultResponse;
  }

  return {
    goodsList: Array.isArray(response.goodsList) ? response.goodsList : defaultResponse.goodsList,
    goodsCount: typeof response.goodsCount === "number" ? response.goodsCount : defaultResponse.goodsCount,
    pageNo: typeof response.pageNo === "number" ? resolvePageNo(response.pageNo) : defaultResponse.pageNo,
    pageSize:
      typeof response.pageSize === "number" && response.pageSize > 0 ? Math.floor(response.pageSize) : defaultResponse.pageSize,
    totalPageCount:
      typeof response.totalPageCount === "number" && response.totalPageCount >= 0
        ? Math.floor(response.totalPageCount)
        : defaultResponse.totalPageCount,
  };
}

// 마이페이지 쿠폰함 페이지 SSR 데이터를 조회합니다.
export async function fetchShopMypageCouponPageServerData(
  ownedPageNo: number,
  downloadablePageNo: number,
  cookieHeader: string,
): Promise<ShopMypageCouponPageResponse> {
  // 쿠폰함 API 경로를 생성해 응답을 조회합니다.
  const path = buildShopMypageCouponPagePath(ownedPageNo, downloadablePageNo);
  const requestInit = buildRequestInitFromCookie(cookieHeader);
  const response = await readShopServerApiResponse<ShopMypageCouponPageResponse>(path, requestInit);
  const defaultResponse = createDefaultShopMypageCouponPageResponse();

  // 응답 유효성을 확인한 뒤 기본값을 반환합니다.
  if (!response) {
    return defaultResponse;
  }

  return {
    ownedCouponList: Array.isArray(response.ownedCouponList)
      ? response.ownedCouponList.map((item) => normalizeOwnedCouponItem(item))
      : defaultResponse.ownedCouponList,
    ownedCouponCount:
      typeof response.ownedCouponCount === "number" ? normalizeNonNegativeNumber(response.ownedCouponCount) : 0,
    ownedPageNo:
      typeof response.ownedPageNo === "number" ? resolvePageNo(response.ownedPageNo) : defaultResponse.ownedPageNo,
    ownedPageSize:
      typeof response.ownedPageSize === "number" && response.ownedPageSize > 0
        ? Math.floor(response.ownedPageSize)
        : defaultResponse.ownedPageSize,
    ownedTotalPageCount:
      typeof response.ownedTotalPageCount === "number" && response.ownedTotalPageCount >= 0
        ? Math.floor(response.ownedTotalPageCount)
        : defaultResponse.ownedTotalPageCount,
    downloadableCouponList: Array.isArray(response.downloadableCouponList)
      ? response.downloadableCouponList.map((item) => normalizeDownloadableCouponItem(item))
      : defaultResponse.downloadableCouponList,
    downloadableCouponCount:
      typeof response.downloadableCouponCount === "number"
        ? normalizeNonNegativeNumber(response.downloadableCouponCount)
        : 0,
    downloadablePageNo:
      typeof response.downloadablePageNo === "number"
        ? resolvePageNo(response.downloadablePageNo)
        : defaultResponse.downloadablePageNo,
    downloadablePageSize:
      typeof response.downloadablePageSize === "number" && response.downloadablePageSize > 0
        ? Math.floor(response.downloadablePageSize)
        : defaultResponse.downloadablePageSize,
    downloadableTotalPageCount:
      typeof response.downloadableTotalPageCount === "number" && response.downloadableTotalPageCount >= 0
        ? Math.floor(response.downloadableTotalPageCount)
        : defaultResponse.downloadableTotalPageCount,
  };
}

// 마이페이지 주문내역 페이지 SSR 데이터를 조회합니다.
export async function fetchShopMypageOrderPageServerData(
  pageNo: number,
  startDate: string,
  endDate: string,
  cookieHeader: string,
): Promise<ShopMypageOrderPageResponse> {
  // 주문내역 API 경로를 생성해 응답을 조회합니다.
  const path = buildShopMypageOrderPagePath(pageNo, startDate, endDate);
  const requestInit = buildRequestInitFromCookie(cookieHeader);
  const response = await readShopServerApiResponse<ShopMypageOrderPageResponse>(path, requestInit);
  const defaultResponse = createDefaultShopMypageOrderPageResponse();

  // 응답 유효성을 확인한 뒤 기본값을 반환합니다.
  if (!response) {
    return {
      ...defaultResponse,
      startDate: normalizeString(startDate),
      endDate: normalizeString(endDate),
    };
  }

  return {
    orderList: Array.isArray(response.orderList)
      ? response.orderList.map((item) => normalizeShopMypageOrderGroup(item))
      : defaultResponse.orderList,
    orderCount: normalizeNonNegativeNumber(response.orderCount),
    pageNo: typeof response.pageNo === "number" ? resolvePageNo(response.pageNo) : defaultResponse.pageNo,
    pageSize:
      typeof response.pageSize === "number" && response.pageSize > 0
        ? Math.floor(response.pageSize)
        : defaultResponse.pageSize,
    totalPageCount:
      typeof response.totalPageCount === "number" && response.totalPageCount >= 0
        ? Math.floor(response.totalPageCount)
        : defaultResponse.totalPageCount,
    startDate: normalizeString(response.startDate || startDate),
    endDate: normalizeString(response.endDate || endDate),
    statusSummary: normalizeShopMypageOrderStatusSummary(response.statusSummary),
  };
}

// 마이페이지 주문상세 페이지 SSR 데이터를 조회합니다.
export async function fetchShopMypageOrderDetailPageServerData(
  ordNo: string,
  cookieHeader: string,
): Promise<ShopMypageOrderDetailPageResponse | null> {
  // 주문상세 API 경로를 생성해 응답을 조회합니다.
  const path = buildShopMypageOrderDetailPagePath(ordNo);
  const requestInit = buildRequestInitFromCookie(cookieHeader);
  const response = await readShopServerApiResponse<ShopMypageOrderDetailPageResponse>(path, requestInit);
  const defaultAmountSummary = createDefaultShopMypageOrderAmountSummary();

  // 응답이 없거나 주문번호가 유효하지 않으면 null을 반환합니다.
  if (!response) {
    return null;
  }

  const normalizedOrder = response.order ? normalizeShopMypageOrderGroup(response.order) : null;
  if (!normalizedOrder || normalizedOrder.ordNo.trim() === "") {
    return null;
  }

  return {
    order: normalizedOrder,
    amountSummary: response.amountSummary
      ? normalizeShopMypageOrderAmountSummary(response.amountSummary)
      : defaultAmountSummary,
  };
}

// 마이페이지 주문취소 신청 화면 SSR 데이터를 조회합니다.
export async function fetchShopMypageOrderCancelPageServerData(
  ordNo: string,
  ordDtlNo: number | undefined,
  cookieHeader: string,
): Promise<ShopMypageOrderCancelPageResponse | null> {
  // 주문취소 신청 화면 API 경로를 생성해 응답을 조회합니다.
  const path = buildShopMypageOrderCancelPagePath(ordNo, ordDtlNo);
  const requestInit = buildRequestInitFromCookie(cookieHeader);
  const response = await readShopServerApiResponse<ShopMypageOrderCancelPageResponse>(path, requestInit);
  const defaultAmountSummary = createDefaultShopMypageOrderAmountSummary();
  const defaultSiteInfo = createDefaultShopMypageOrderCancelSiteInfo();

  // 응답이 없거나 주문번호가 유효하지 않으면 null을 반환합니다.
  if (!response) {
    return null;
  }

  const normalizedOrder = response.order ? normalizeShopMypageOrderGroup(response.order) : null;
  if (!normalizedOrder || normalizedOrder.ordNo.trim() === "") {
    return null;
  }

  return {
    order: normalizedOrder,
    amountSummary: response.amountSummary
      ? normalizeShopMypageOrderAmountSummary(response.amountSummary)
      : defaultAmountSummary,
    reasonList: Array.isArray(response.reasonList)
      ? response.reasonList.map((item) => normalizeShopMypageOrderCancelReasonItem(item))
      : [],
    siteInfo: response.siteInfo ? normalizeShopMypageOrderCancelSiteInfo(response.siteInfo) : defaultSiteInfo,
  };
}

// 마이페이지 반품 신청 화면 SSR 데이터를 조회합니다.
export async function fetchShopMypageOrderReturnPageServerData(
  ordNo: string,
  ordDtlNo: number | undefined,
  cookieHeader: string,
): Promise<ShopMypageOrderReturnPageResponse | null> {
  // 반품 신청 화면 API 경로를 생성해 응답을 조회합니다.
  const path = buildShopMypageOrderReturnPagePath(ordNo, ordDtlNo);
  const requestInit = buildRequestInitFromCookie(cookieHeader);
  const response = await readShopServerApiResponse<ShopMypageOrderReturnPageResponse>(path, requestInit);
  const defaultAmountSummary = createDefaultShopMypageOrderAmountSummary();
  const defaultSiteInfo = createDefaultShopMypageOrderCancelSiteInfo();

  // 응답이 없거나 주문번호가 유효하지 않으면 null을 반환합니다.
  if (!response) {
    return null;
  }

  const normalizedOrder = response.order ? normalizeShopMypageOrderGroup(response.order) : null;
  if (!normalizedOrder || normalizedOrder.ordNo.trim() === "") {
    return null;
  }

  return {
    order: normalizedOrder,
    amountSummary: response.amountSummary
      ? normalizeShopMypageOrderAmountSummary(response.amountSummary)
      : defaultAmountSummary,
    reasonList: Array.isArray(response.reasonList)
      ? response.reasonList.map((item) => normalizeShopMypageOrderCancelReasonItem(item))
      : [],
    siteInfo: response.siteInfo ? normalizeShopMypageOrderCancelSiteInfo(response.siteInfo) : defaultSiteInfo,
  };
}

// 마이페이지 취소내역 기본 응답값을 생성합니다.
function createDefaultShopMypageCancelHistoryPageResponse(): ShopMypageCancelHistoryPageResponse {
  return {
    cancelList: [],
    cancelCount: 0,
    pageNo: 1,
    pageSize: 5,
    totalPageCount: 0,
    startDate: "",
    endDate: "",
  };
}

// 마이페이지 취소내역 상품 상세 아이템을 기본값과 함께 정규화합니다.
function normalizeShopMypageCancelHistoryDetailItem(rawItem: unknown): ShopMypageCancelHistoryDetailItem {
  const source = (rawItem ?? {}) as Partial<ShopMypageCancelHistoryDetailItem>;
  return {
    clmNo: normalizeString(source.clmNo),
    ordDtlNo: normalizeNonNegativeNumber(source.ordDtlNo),
    goodsId: normalizeString(source.goodsId),
    goodsNm: normalizeString(source.goodsNm),
    sizeId: normalizeString(source.sizeId),
    qty: normalizeNonNegativeNumber(source.qty),
    saleAmt: normalizeNonNegativeNumber(source.saleAmt),
    addAmt: normalizeNonNegativeNumber(source.addAmt),
    chgReasonCd: normalizeString(source.chgReasonCd),
    chgReasonNm: normalizeString(source.chgReasonNm),
    chgReasonDtl: normalizeString(source.chgReasonDtl),
    imgPath: normalizeString(source.imgPath),
    imgUrl: normalizeString(source.imgUrl),
  };
}

// 마이페이지 취소내역 클레임 아이템을 기본값과 함께 정규화합니다.
function normalizeShopMypageCancelHistoryItem(rawItem: unknown): ShopMypageCancelHistoryItem {
  const source = (rawItem ?? {}) as Partial<ShopMypageCancelHistoryItem>;
  return {
    clmNo: normalizeString(source.clmNo),
    ordNo: normalizeString(source.ordNo),
    chgDt: normalizeString(source.chgDt),
    chgStatCd: normalizeString(source.chgStatCd),
    chgStatNm: normalizeString(source.chgStatNm),
    payDelvAmt: normalizeNonNegativeNumber(source.payDelvAmt),
    refundedCashAmt: normalizeNonNegativeNumber(source.refundedCashAmt),
    detailList: Array.isArray(source.detailList)
      ? source.detailList.map((item) => normalizeShopMypageCancelHistoryDetailItem(item))
      : [],
  };
}

// 마이페이지 취소내역 페이지 SSR 데이터를 조회합니다.
export async function fetchShopMypageCancelHistoryPageServerData(
  pageNo: number,
  startDate: string,
  endDate: string,
  cookieHeader: string,
): Promise<ShopMypageCancelHistoryPageResponse> {
  // 취소내역 API 경로를 생성해 응답을 조회합니다.
  const path = buildShopMypageCancelHistoryPagePath(pageNo, startDate, endDate);
  const requestInit = buildRequestInitFromCookie(cookieHeader);
  const response = await readShopServerApiResponse<ShopMypageCancelHistoryPageResponse>(path, requestInit);
  const defaultResponse = createDefaultShopMypageCancelHistoryPageResponse();

  // 응답 유효성을 확인한 뒤 기본값을 반환합니다.
  if (!response) {
    return {
      ...defaultResponse,
      startDate: normalizeString(startDate),
      endDate: normalizeString(endDate),
    };
  }

  return {
    cancelList: Array.isArray(response.cancelList)
      ? response.cancelList.map((item) => normalizeShopMypageCancelHistoryItem(item))
      : defaultResponse.cancelList,
    cancelCount: normalizeNonNegativeNumber(response.cancelCount),
    pageNo: typeof response.pageNo === "number" ? resolvePageNo(response.pageNo) : defaultResponse.pageNo,
    pageSize:
      typeof response.pageSize === "number" && response.pageSize > 0
        ? Math.floor(response.pageSize)
        : defaultResponse.pageSize,
    totalPageCount:
      typeof response.totalPageCount === "number" && response.totalPageCount >= 0
        ? Math.floor(response.totalPageCount)
        : defaultResponse.totalPageCount,
    startDate: normalizeString(response.startDate || startDate),
    endDate: normalizeString(response.endDate || endDate),
  };
}

// 마이페이지 취소상세 SSR 데이터를 클레임번호로 조회합니다.
export async function fetchShopMypageCancelDetailServerData(
  clmNo: string,
  cookieHeader: string,
): Promise<ShopMypageCancelDetailPageResponse> {
  // 취소상세 API 경로를 생성해 응답을 조회합니다.
  const path = buildShopMypageCancelDetailPath(clmNo);
  const requestInit = buildRequestInitFromCookie(cookieHeader);
  const response = await readShopServerApiResponse<ShopMypageCancelHistoryItem>(path, requestInit);

  // 응답이 없거나 클레임번호가 없으면 null을 반환합니다.
  if (!response || !response.clmNo) {
    return { cancelItem: null };
  }

  return { cancelItem: normalizeShopMypageCancelHistoryItem(response) };
}

// 마이페이지 포인트 내역 기본 응답값을 생성합니다.
function createDefaultShopMypagePointPageResponse(): ShopMypagePointPageResponse {
  return {
    availablePointAmt: 0,
    expiringPointAmt: 0,
    pointList: [],
    pointCount: 0,
    pageNo: 1,
    pageSize: 20,
    totalPageCount: 0,
  };
}

// 포인트 내역 아이템을 정규화합니다. (CUSTOMER_POINT_DETAIL 기반)
function normalizeShopMypagePointItem(source: Record<string, unknown>): ShopMypagePointItem {
  const rawPntAmt = typeof source.pntAmt === "number" ? Math.floor(source.pntAmt) : 0;
  return {
    pntNo: normalizeNonNegativeNumber(source.pntNo),
    pntAmt: rawPntAmt,
    ordNo: normalizeNullableString(source.ordNo),
    bigo: normalizeString(source.bigo),
    regDt: normalizeString(source.regDt),
  };
}

// 포인트 내역 페이지 응답을 정규화합니다.
function normalizeShopMypagePointPageResponse(source: Record<string, unknown>): ShopMypagePointPageResponse {
  const rawPointList = Array.isArray(source.pointList) ? source.pointList : [];
  return {
    availablePointAmt: normalizeNonNegativeNumber(source.availablePointAmt),
    expiringPointAmt: normalizeNonNegativeNumber(source.expiringPointAmt),
    pointList: rawPointList
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map(normalizeShopMypagePointItem),
    pointCount: normalizeNonNegativeNumber(source.pointCount),
    pageNo: normalizeNonNegativeNumber(source.pageNo) || 1,
    pageSize: normalizeNonNegativeNumber(source.pageSize) || 20,
    totalPageCount: normalizeNonNegativeNumber(source.totalPageCount),
  };
}

// 마이페이지 포인트 내역 API 경로를 생성합니다.
function buildShopMypagePointPagePath(pageNo: number): string {
  const queryParams = new URLSearchParams();
  queryParams.set("pageNo", String(Math.max(Math.floor(pageNo), 1)));
  return `/api/shop/mypage/point/page?${queryParams.toString()}`;
}

// 마이페이지 포인트 내역 SSR 데이터를 조회합니다.
export async function fetchShopMypagePointPageServerData(
  pageNo: number,
  cookieHeader: string,
): Promise<ShopMypagePointPageResponse> {
  // 포인트 내역 API 경로를 생성해 응답을 조회합니다.
  const path = buildShopMypagePointPagePath(pageNo);
  const requestInit = buildRequestInitFromCookie(cookieHeader);
  const response = await readShopServerApiResponse<Record<string, unknown>>(path, requestInit);

  // 응답이 없으면 기본값을 반환합니다.
  if (!response) {
    return createDefaultShopMypagePointPageResponse();
  }

  return normalizeShopMypagePointPageResponse(response);
}
