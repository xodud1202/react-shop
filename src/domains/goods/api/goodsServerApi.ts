import type { ShopGoodsDetailResponse } from "@/domains/goods/types";
import { createShopPublicCacheOptions, readShopServerApiResponse } from "@/shared/server/readShopServerApiResponse";

// 상품상세 API 기본 응답값을 생성합니다.
function createDefaultShopGoodsDetailResponse(goodsId: string): ShopGoodsDetailResponse {
  return {
    goods: {
      goodsId,
      goodsNm: "",
      goodsGroupId: "",
      brandNo: null,
      brandNm: "",
      brandLogoPath: "",
      brandNoti: "",
      erpColorCd: "",
      colorNm: "",
      colorRgb: "",
      supplyAmt: 0,
      saleAmt: 0,
    },
    images: [],
    groupGoods: [],
    sizes: [],
    detailDesc: {
      pcDesc: "",
      moDesc: "",
    },
    wishlist: {
      wished: false,
    },
    siteInfo: {
      siteId: "xodud1202",
      siteNm: "",
      deliveryFee: 0,
      deliveryFeeLimit: 0,
    },
    coupons: [],
    priceSummary: {
      supplyAmt: 0,
      saleAmt: 0,
      showSupplyStrike: false,
      discountRate: 0,
    },
    pointSummary: {
      custGradeCd: "CUST_GRADE_01",
      pointSaveRate: 0,
      expectedPoint: 0,
    },
    shippingSummary: {
      freeDelivery: false,
      deliveryFee: 0,
      deliveryFeeLimit: 0,
      shippingMessage: "",
    },
  };
}

// 상품상세 API 경로를 생성합니다.
function buildShopGoodsDetailPath(goodsId: string): string {
  const queryParams = new URLSearchParams();
  queryParams.set("goodsId", goodsId);
  return `/api/shop/goods/detail?${queryParams.toString()}`;
}

// 상품상세 응답을 런타임 안전값으로 보정합니다.
function normalizeShopGoodsDetailResponse(goodsId: string, response: ShopGoodsDetailResponse): ShopGoodsDetailResponse {
  const defaultResponse = createDefaultShopGoodsDetailResponse(goodsId);
  return {
    goods: response.goods ?? defaultResponse.goods,
    images: Array.isArray(response.images) ? response.images : defaultResponse.images,
    groupGoods: Array.isArray(response.groupGoods) ? response.groupGoods : defaultResponse.groupGoods,
    sizes: Array.isArray(response.sizes) ? response.sizes : defaultResponse.sizes,
    detailDesc: response.detailDesc ?? defaultResponse.detailDesc,
    wishlist: response.wishlist ?? defaultResponse.wishlist,
    siteInfo: response.siteInfo ?? defaultResponse.siteInfo,
    coupons: Array.isArray(response.coupons) ? response.coupons : defaultResponse.coupons,
    priceSummary: response.priceSummary ?? defaultResponse.priceSummary,
    pointSummary: response.pointSummary ?? defaultResponse.pointSummary,
    shippingSummary: response.shippingSummary ?? defaultResponse.shippingSummary,
  };
}

// 상품상세 상단 SSR 데이터를 조회합니다.
export async function fetchShopGoodsDetailServerData(goodsId: string, cookieHeader: string): Promise<ShopGoodsDetailResponse | null> {
  const normalizedGoodsId = goodsId.trim();
  if (normalizedGoodsId === "") {
    return null;
  }

  const path = buildShopGoodsDetailPath(normalizedGoodsId);
  const requestInit =
    cookieHeader.trim() === ""
      ? createShopPublicCacheOptions(["shop:goods", `shop:goods:${normalizedGoodsId}`])
      : { cookieHeader };
  const response = await readShopServerApiResponse<ShopGoodsDetailResponse>(path, requestInit);
  if (!response || !response.goods || response.goods.goodsId.trim() === "") {
    return null;
  }
  return normalizeShopGoodsDetailResponse(normalizedGoodsId, response);
}
