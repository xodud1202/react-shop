import type {
  ShopCartCouponEstimateResponse,
  ShopCartItem,
  ShopCartPageResponse,
  ShopCartSiteInfo,
  ShopCartSizeOption,
} from "@/domains/cart/types";
import { readShopServerApiResponse } from "@/shared/server/readShopServerApiResponse";

// 장바구니 페이지 API 경로를 반환합니다.
export function getShopCartPagePath(): string {
  return "/api/shop/cart/page";
}

// 장바구니 쿠폰 예상 할인 계산 API 경로를 반환합니다.
export function getShopCartCouponEstimatePath(): string {
  return "/api/shop/cart/coupon/estimate";
}

// 장바구니 옵션 변경 API 경로를 반환합니다.
export function getShopCartOptionUpdatePath(): string {
  return "/api/shop/cart/option/update";
}

// 장바구니 선택 삭제 API 경로를 반환합니다.
export function getShopCartDeletePath(): string {
  return "/api/shop/cart/delete";
}

// 장바구니 전체 삭제 API 경로를 반환합니다.
export function getShopCartDeleteAllPath(): string {
  return "/api/shop/cart/delete/all";
}

// 숫자 값을 0 이상 정수로 보정합니다.
function normalizeNonNegativeNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(Math.floor(value), 0);
}

// 장바구니 쿠폰 예상 할인 계산 응답 기본값을 생성합니다.
export function createDefaultShopCartCouponEstimateResponse(): ShopCartCouponEstimateResponse {
  return {
    expectedMaxDiscountAmt: 0,
    goodsCouponDiscountAmt: 0,
    cartCouponDiscountAmt: 0,
    deliveryCouponDiscountAmt: 0,
  };
}

// 장바구니 쿠폰 예상 할인 계산 응답을 기본값과 함께 정규화합니다.
export function normalizeShopCartCouponEstimateResponse(rawResponse: unknown): ShopCartCouponEstimateResponse {
  const source = (rawResponse ?? {}) as Partial<ShopCartCouponEstimateResponse>;
  return {
    expectedMaxDiscountAmt: normalizeNonNegativeNumber(source.expectedMaxDiscountAmt),
    goodsCouponDiscountAmt: normalizeNonNegativeNumber(source.goodsCouponDiscountAmt),
    cartCouponDiscountAmt: normalizeNonNegativeNumber(source.cartCouponDiscountAmt),
    deliveryCouponDiscountAmt: normalizeNonNegativeNumber(source.deliveryCouponDiscountAmt),
  };
}

// 장바구니 사이즈 옵션 단건을 기본값과 함께 정규화합니다.
function normalizeShopCartSizeOption(rawOption: unknown): ShopCartSizeOption {
  const source = (rawOption ?? {}) as Partial<ShopCartSizeOption>;
  return {
    sizeId: typeof source.sizeId === "string" ? source.sizeId : "",
    stockQty: normalizeNonNegativeNumber(source.stockQty),
    soldOut: Boolean(source.soldOut),
  };
}

// 장바구니 상품 행 단건을 기본값과 함께 정규화합니다.
function normalizeShopCartItem(rawItem: unknown): ShopCartItem {
  const source = (rawItem ?? {}) as Partial<ShopCartItem>;
  const sizeOptions = Array.isArray(source.sizeOptions) ? source.sizeOptions.map(normalizeShopCartSizeOption) : [];
  return {
    custNo: normalizeNonNegativeNumber(source.custNo),
    goodsId: typeof source.goodsId === "string" ? source.goodsId : "",
    goodsNm: typeof source.goodsNm === "string" ? source.goodsNm : "",
    sizeId: typeof source.sizeId === "string" ? source.sizeId : "",
    qty: Math.max(normalizeNonNegativeNumber(source.qty), 1),
    supplyAmt: normalizeNonNegativeNumber(source.supplyAmt),
    saleAmt: normalizeNonNegativeNumber(source.saleAmt),
    imgPath: typeof source.imgPath === "string" ? source.imgPath : "",
    imgUrl: typeof source.imgUrl === "string" ? source.imgUrl : "",
    sizeOptions,
  };
}

// 장바구니 배송비 기준 정보를 기본값과 함께 정규화합니다.
function normalizeShopCartSiteInfo(rawSiteInfo: unknown): ShopCartSiteInfo {
  const source = (rawSiteInfo ?? {}) as Partial<ShopCartSiteInfo>;
  return {
    siteId: typeof source.siteId === "string" ? source.siteId : "",
    deliveryFee: normalizeNonNegativeNumber(source.deliveryFee),
    deliveryFeeLimit: normalizeNonNegativeNumber(source.deliveryFeeLimit),
  };
}

// 장바구니 기본 응답값을 생성합니다.
function createDefaultShopCartPageResponse(): ShopCartPageResponse {
  return {
    cartList: [],
    cartCount: 0,
    siteInfo: {
      siteId: "",
      deliveryFee: 0,
      deliveryFeeLimit: 0,
    },
  };
}

// 장바구니 페이지 SSR 데이터를 조회합니다.
export async function fetchShopCartPageServerData(cookieHeader: string): Promise<ShopCartPageResponse> {
  // 장바구니 페이지 API를 호출해 응답을 조회합니다.
  const requestInit = cookieHeader.trim() === "" ? undefined : { headers: { cookie: cookieHeader } };
  const response = await readShopServerApiResponse<ShopCartPageResponse>(getShopCartPagePath(), requestInit);
  const defaultResponse = createDefaultShopCartPageResponse();

  // 응답 유효성을 확인한 뒤 기본값을 반환합니다.
  if (!response) {
    return defaultResponse;
  }

  const normalizedCartList = Array.isArray(response.cartList) ? response.cartList.map(normalizeShopCartItem) : [];
  return {
    cartList: normalizedCartList,
    cartCount: normalizeNonNegativeNumber(response.cartCount),
    siteInfo: normalizeShopCartSiteInfo(response.siteInfo),
  };
}
