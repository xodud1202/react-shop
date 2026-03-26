import type {
  ShopExhibitionDetailResponse,
  ShopExhibitionDetailTab,
  ShopExhibitionGoodsItem,
  ShopExhibitionGoodsPageResponse,
  ShopExhibitionPageResponse,
} from "@/domains/exhibition/types";
import { cache } from "react";
import { readShopServerApiResponse } from "@/shared/server/readShopServerApiResponse";

// 기획전 목록 기본 응답값을 생성합니다.
function createDefaultShopExhibitionPageResponse(): ShopExhibitionPageResponse {
  return {
    exhibitionList: [],
    totalCount: 0,
    pageNo: 1,
    pageSize: 20,
    totalPageCount: 0,
  };
}

// 기획전 탭 상품 기본 응답값을 생성합니다.
function createDefaultShopExhibitionGoodsPageResponse(): ShopExhibitionGoodsPageResponse {
  return {
    goodsList: [],
    totalCount: 0,
    pageNo: 1,
    pageSize: 20,
    hasMore: false,
    nextPageNo: null,
  };
}

// 요청 페이지 번호를 1 이상의 값으로 보정합니다.
function resolvePageNo(pageNo: number): number {
  if (!Number.isFinite(pageNo) || pageNo < 1) {
    return 1;
  }

  return Math.floor(pageNo);
}

// 기획전 번호를 1 이상의 값으로 보정합니다.
function resolveExhibitionNo(exhibitionNo: number): number {
  if (!Number.isFinite(exhibitionNo) || exhibitionNo < 1) {
    return 0;
  }

  return Math.floor(exhibitionNo);
}

// 기획전 탭 번호를 1 이상의 값으로 보정합니다.
function resolveExhibitionTabNo(exhibitionTabNo: number): number {
  if (!Number.isFinite(exhibitionTabNo) || exhibitionTabNo < 1) {
    return 0;
  }

  return Math.floor(exhibitionTabNo);
}

// 문자열 응답값을 안전하게 보정합니다.
function resolveString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// 숫자 응답값을 안전하게 보정합니다.
function resolveNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

// 기획전 상세 탭 응답 목록을 안전하게 보정합니다.
function resolveDetailTabList(value: unknown): ShopExhibitionDetailTab[] {
  if (!Array.isArray(value)) {
    return [];
  }

  // 탭 목록 응답을 화면에서 사용할 형태로 정규화합니다.
  return value
    .map((item) => {
      const safeItem = item as Partial<ShopExhibitionDetailTab>;
      const exhibitionTabNo = resolveNumber(safeItem.exhibitionTabNo);
      if (exhibitionTabNo < 1) {
        return null;
      }

      return {
        exhibitionTabNo,
        exhibitionTabNm: resolveString(safeItem.exhibitionTabNm),
        dispStartDt: resolveString(safeItem.dispStartDt),
        dispEndDt: resolveString(safeItem.dispEndDt),
      };
    })
    .filter((item): item is ShopExhibitionDetailTab => item !== null);
}

// 기획전 탭 상품 응답 목록을 안전하게 보정합니다.
function resolveGoodsList(value: unknown): ShopExhibitionGoodsItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  // 카드 렌더링에 필요한 상품 응답을 정규화합니다.
  const result: ShopExhibitionGoodsItem[] = [];
  value.forEach((item) => {
    const safeItem = item as Partial<ShopExhibitionGoodsItem>;
    const goodsId = resolveString(safeItem.goodsId);
    if (goodsId === "") {
      return;
    }

    result.push({
      exhibitionNo: resolveNumber(safeItem.exhibitionNo),
      exhibitionTabNo: resolveNumber(safeItem.exhibitionTabNo),
      goodsId,
      goodsNm: resolveString(safeItem.goodsNm),
      brandNm: resolveString(safeItem.brandNm),
      supplyAmt: typeof safeItem.supplyAmt === "number" ? safeItem.supplyAmt : null,
      saleAmt: resolveNumber(safeItem.saleAmt),
      imgPath: resolveString(safeItem.imgPath),
      imgUrl: resolveString(safeItem.imgUrl),
      secondaryImgPath: resolveString(safeItem.secondaryImgPath),
      secondaryImgUrl: resolveString(safeItem.secondaryImgUrl),
      sortSeq: typeof safeItem.sortSeq === "number" ? safeItem.sortSeq : null,
    });
  });
  return result;
}

// 기획전 목록 API 경로를 생성합니다.
function buildShopExhibitionListPath(pageNo: number): string {
  // 요청 쿼리스트링을 pageNo 기준으로 구성합니다.
  const queryParams = new URLSearchParams();
  queryParams.set("pageNo", String(resolvePageNo(pageNo)));
  return `/api/shop/exhibition/list?${queryParams.toString()}`;
}

// 기획전 상세 API 경로를 생성합니다.
function buildShopExhibitionDetailPath(exhibitionNo: number): string {
  // 요청 쿼리스트링을 exhibitionNo 기준으로 구성합니다.
  const queryParams = new URLSearchParams();
  queryParams.set("exhibitionNo", String(resolveExhibitionNo(exhibitionNo)));
  return `/api/shop/exhibition/detail?${queryParams.toString()}`;
}

// 기획전 탭 상품 API 경로를 생성합니다.
function buildShopExhibitionGoodsPath(exhibitionNo: number, exhibitionTabNo: number, pageNo: number): string {
  // 요청 쿼리스트링을 exhibition/tab/page 기준으로 구성합니다.
  const queryParams = new URLSearchParams();
  queryParams.set("exhibitionNo", String(resolveExhibitionNo(exhibitionNo)));
  queryParams.set("exhibitionTabNo", String(resolveExhibitionTabNo(exhibitionTabNo)));
  queryParams.set("pageNo", String(resolvePageNo(pageNo)));
  return `/api/shop/exhibition/goods?${queryParams.toString()}`;
}

// 기획전 목록 화면 데이터를 SSR에서 조회합니다.
async function fetchShopExhibitionPageServerDataInternal(pageNo: number): Promise<ShopExhibitionPageResponse> {
  // 기획전 목록 API 경로를 생성해 응답을 조회합니다.
  const path = buildShopExhibitionListPath(pageNo);
  const response = await readShopServerApiResponse<ShopExhibitionPageResponse>(path);
  const defaultResponse = createDefaultShopExhibitionPageResponse();

  // 응답 유효성을 확인한 뒤 기본값을 반환합니다.
  if (!response) {
    return defaultResponse;
  }

  return {
    exhibitionList: Array.isArray(response.exhibitionList) ? response.exhibitionList : defaultResponse.exhibitionList,
    totalCount: typeof response.totalCount === "number" ? response.totalCount : defaultResponse.totalCount,
    pageNo: typeof response.pageNo === "number" ? resolvePageNo(response.pageNo) : defaultResponse.pageNo,
    pageSize: typeof response.pageSize === "number" && response.pageSize > 0 ? Math.floor(response.pageSize) : defaultResponse.pageSize,
    totalPageCount:
      typeof response.totalPageCount === "number" && response.totalPageCount >= 0
        ? Math.floor(response.totalPageCount)
        : defaultResponse.totalPageCount,
  };
}

// 기획전 상세 화면 데이터를 SSR에서 조회합니다.
async function fetchShopExhibitionDetailServerDataInternal(exhibitionNo: number): Promise<ShopExhibitionDetailResponse | null> {
  // 유효하지 않은 기획전 번호는 서버 호출 없이 null을 반환합니다.
  const safeExhibitionNo = resolveExhibitionNo(exhibitionNo);
  if (safeExhibitionNo < 1) {
    return null;
  }

  // 기획전 상세 API를 호출해 응답을 정규화합니다.
  const path = buildShopExhibitionDetailPath(safeExhibitionNo);
  const response = await readShopServerApiResponse<ShopExhibitionDetailResponse>(path);
  if (!response) {
    return null;
  }

  return {
    exhibitionNo: resolveNumber(response.exhibitionNo),
    exhibitionNm: resolveString(response.exhibitionNm),
    dispStartDt: resolveString(response.dispStartDt),
    dispEndDt: resolveString(response.dispEndDt),
    visibleHtml: resolveString(response.visibleHtml),
    pcHtml: resolveString(response.pcHtml),
    mobileHtml: resolveString(response.mobileHtml),
    defaultTabNo: resolveNumber(response.defaultTabNo),
    tabList: resolveDetailTabList(response.tabList),
  };
}

// 기획전 탭 상품 더보기 데이터를 SSR에서 조회합니다.
async function fetchShopExhibitionGoodsPageServerDataInternal(
  exhibitionNo: number,
  exhibitionTabNo: number,
  pageNo: number,
): Promise<ShopExhibitionGoodsPageResponse> {
  // 유효하지 않은 식별자는 기본 응답을 반환합니다.
  const safeExhibitionNo = resolveExhibitionNo(exhibitionNo);
  const safeExhibitionTabNo = resolveExhibitionTabNo(exhibitionTabNo);
  if (safeExhibitionNo < 1 || safeExhibitionTabNo < 1) {
    return createDefaultShopExhibitionGoodsPageResponse();
  }

  // 기획전 탭 상품 API를 호출해 응답을 정규화합니다.
  const path = buildShopExhibitionGoodsPath(safeExhibitionNo, safeExhibitionTabNo, pageNo);
  const response = await readShopServerApiResponse<ShopExhibitionGoodsPageResponse>(path);
  const defaultResponse = createDefaultShopExhibitionGoodsPageResponse();
  if (!response) {
    return defaultResponse;
  }

  return {
    goodsList: resolveGoodsList(response.goodsList),
    totalCount: resolveNumber(response.totalCount),
    pageNo: resolvePageNo(resolveNumber(response.pageNo)),
    pageSize: resolveNumber(response.pageSize) > 0 ? Math.floor(resolveNumber(response.pageSize)) : defaultResponse.pageSize,
    hasMore: Boolean(response.hasMore),
    nextPageNo: typeof response.nextPageNo === "number" && response.nextPageNo > 0 ? Math.floor(response.nextPageNo) : null,
  };
}

// 기획전 목록 서버 데이터를 요청 단위로 메모이징합니다.
export const fetchShopExhibitionPageServerData = cache(fetchShopExhibitionPageServerDataInternal);

// 기획전 상세 서버 데이터를 요청 단위로 메모이징합니다.
export const fetchShopExhibitionDetailServerData = cache(fetchShopExhibitionDetailServerDataInternal);

// 기획전 탭 상품 서버 데이터를 요청 단위로 메모이징합니다.
export const fetchShopExhibitionGoodsPageServerData = cache(fetchShopExhibitionGoodsPageServerDataInternal);
