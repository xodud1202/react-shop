"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ShopGoodsCard from "@/shared/components/goods/ShopGoodsCard";
import type {
  ShopExhibitionDetailResponse,
  ShopExhibitionGoodsItem,
  ShopExhibitionGoodsPageResponse,
} from "@/domains/exhibition/types";
import ShopExhibitionInvalidRedirect from "@/domains/exhibition/components/ShopExhibitionInvalidRedirect";
import styles from "./ShopExhibitionDetailSection.module.css";

interface ShopExhibitionDetailSectionProps {
  detailData: ShopExhibitionDetailResponse;
  initialGoodsPageData: ShopExhibitionGoodsPageResponse;
}

interface ShopExhibitionGoodsPageRequestResult {
  ok: boolean;
  status: number;
  data: ShopExhibitionGoodsPageResponse | null;
}

// 기획전 상품 더보기 기본 응답값을 생성합니다.
function createDefaultGoodsPageData(): ShopExhibitionGoodsPageResponse {
  return {
    goodsList: [],
    totalCount: 0,
    pageNo: 1,
    pageSize: 20,
    hasMore: false,
    nextPageNo: null,
  };
}

// 숫자 응답값을 안전하게 정규화합니다.
function resolveNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

// 문자열 응답값을 안전하게 정규화합니다.
function resolveString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// 기획전 상품 응답 목록을 안전하게 정규화합니다.
function resolveGoodsList(value: unknown): ShopExhibitionGoodsItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  // 상품 카드 렌더링에 필요한 필드만 정규화해 반환합니다.
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

// 기획전 상품 더보기 응답을 화면에서 사용할 형태로 정규화합니다.
function normalizeGoodsPageResponse(value: unknown): ShopExhibitionGoodsPageResponse {
  const safeValue = (value ?? {}) as Partial<ShopExhibitionGoodsPageResponse>;
  const defaultResponse = createDefaultGoodsPageData();

  return {
    goodsList: resolveGoodsList(safeValue.goodsList),
    totalCount: resolveNumber(safeValue.totalCount),
    pageNo: resolveNumber(safeValue.pageNo) > 0 ? Math.floor(resolveNumber(safeValue.pageNo)) : defaultResponse.pageNo,
    pageSize: resolveNumber(safeValue.pageSize) > 0 ? Math.floor(resolveNumber(safeValue.pageSize)) : defaultResponse.pageSize,
    hasMore: Boolean(safeValue.hasMore),
    nextPageNo: typeof safeValue.nextPageNo === "number" && safeValue.nextPageNo > 0 ? Math.floor(safeValue.nextPageNo) : null,
  };
}

// 기획전 상품 조회 API 경로를 생성합니다.
function buildExhibitionGoodsPath(exhibitionNo: number, exhibitionTabNo: number, pageNo: number): string {
  // 선택된 기획전/탭/페이지 기준으로 쿼리스트링을 구성합니다.
  const queryParams = new URLSearchParams();
  queryParams.set("exhibitionNo", String(exhibitionNo));
  queryParams.set("exhibitionTabNo", String(exhibitionTabNo));
  queryParams.set("pageNo", String(pageNo));
  return `/api/shop/exhibition/goods?${queryParams.toString()}`;
}

// 표시용 이벤트 기간 문자열을 생성합니다.
function formatExhibitionPeriod(dispStartDt: string, dispEndDt: string): string {
  const startDateLabel = resolveExhibitionDateLabel(dispStartDt);
  const endDateLabel = resolveExhibitionDateLabel(dispEndDt);
  if (startDateLabel !== "" && endDateLabel !== "") {
    return `${startDateLabel} ~ ${endDateLabel}`;
  }
  return startDateLabel || endDateLabel || "-";
}

// 일시 문자열을 YYYY.MM.DD 형식으로 변환합니다.
function resolveExhibitionDateLabel(value: string): string {
  const normalizedValue = value.trim();
  if (normalizedValue === "") {
    return "";
  }
  return normalizedValue.slice(0, 10).replace(/-/g, ".");
}

// 현재 뷰포트 기준으로 노출할 기획전 HTML을 계산합니다.
function resolveVisibleDetailHtml(detailData: ShopExhibitionDetailResponse, isMobileViewport: boolean): string {
  const pcHtml = detailData.pcHtml.trim();
  const mobileHtml = detailData.mobileHtml.trim();
  const fallbackHtml = detailData.visibleHtml.trim();
  if (isMobileViewport) {
    return mobileHtml !== "" ? mobileHtml : pcHtml !== "" ? pcHtml : fallbackHtml;
  }
  return pcHtml !== "" ? pcHtml : mobileHtml !== "" ? mobileHtml : fallbackHtml;
}

// 기획전 상세 섹션을 렌더링합니다.
export default function ShopExhibitionDetailSection({
  detailData,
  initialGoodsPageData,
}: ShopExhibitionDetailSectionProps) {
  const [selectedTabNo, setSelectedTabNo] = useState<number>(detailData.defaultTabNo);
  const [goodsPageData, setGoodsPageData] = useState<ShopExhibitionGoodsPageResponse>(initialGoodsPageData);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(false);
  const [isTabLoading, setIsTabLoading] = useState<boolean>(false);
  const [isMoreLoading, setIsMoreLoading] = useState<boolean>(false);
  const [shouldRedirectInvalid, setShouldRedirectInvalid] = useState<boolean>(false);
  const requestSequenceRef = useRef<number>(0);

  // 뷰포트 변경 시 모바일 상태를 동기화합니다.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // 900px 기준 미디어쿼리를 구독해 모바일 여부를 업데이트합니다.
    const mobileMediaQuery = window.matchMedia("(max-width: 900px)");
    const syncViewportState = (): void => {
      setIsMobileViewport(mobileMediaQuery.matches);
    };
    syncViewportState();

    const handleMediaQueryChange = (event: MediaQueryListEvent): void => {
      // 미디어쿼리 결과를 상태에 반영합니다.
      setIsMobileViewport(event.matches);
    };
    mobileMediaQuery.addEventListener("change", handleMediaQueryChange);
    return () => {
      mobileMediaQuery.removeEventListener("change", handleMediaQueryChange);
    };
  }, []);

  // 현재 뷰포트에 맞는 기획전 상세 HTML을 계산합니다.
  const visibleDetailHtml = useMemo(
    () => resolveVisibleDetailHtml(detailData, isMobileViewport),
    [detailData, isMobileViewport],
  );

  // 선택된 탭 상품 페이지를 조회합니다.
  const requestGoodsPage = async (tabNo: number, pageNo: number): Promise<ShopExhibitionGoodsPageRequestResult> => {
    try {
      // 동일 출처 API를 no-store 정책으로 호출합니다.
      const response = await fetch(buildExhibitionGoodsPath(detailData.exhibitionNo, tabNo, pageNo), {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      // 404는 뒤로가기/fallback 처리 대상이므로 상태코드만 반환합니다.
      if (response.status === 404) {
        return {
          ok: false,
          status: 404,
          data: null,
        };
      }

      // 기타 비정상 응답은 실패로 반환합니다.
      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          data: null,
        };
      }

      // 정상 응답 본문을 정규화해 반환합니다.
      const payload = (await response.json().catch(() => null)) as unknown;
      return {
        ok: true,
        status: response.status,
        data: normalizeGoodsPageResponse(payload),
      };
    } catch {
      // 네트워크 오류는 일반 실패로 반환합니다.
      return {
        ok: false,
        status: 0,
        data: null,
      };
    }
  };

  // 탭 클릭 시 1페이지 상품 목록으로 교체합니다.
  const handleTabClick = async (tabNo: number): Promise<void> => {
    if (tabNo === selectedTabNo || isTabLoading || isMoreLoading) {
      return;
    }

    // 최신 응답만 반영되도록 요청 시퀀스를 갱신합니다.
    const requestSequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestSequence;
    setIsTabLoading(true);

    const result = await requestGoodsPage(tabNo, 1);
    if (requestSequenceRef.current !== requestSequence) {
      return;
    }

    // 유효하지 않은 기획전/탭은 뒤로가기 fallback 흐름으로 전환합니다.
    if (!result.ok) {
      setIsTabLoading(false);
      if (result.status === 404) {
        setShouldRedirectInvalid(true);
        return;
      }
      window.alert("기획전 상품 조회에 실패했습니다.");
      return;
    }

    // 선택 탭과 상품 목록을 새 응답으로 교체합니다.
    setSelectedTabNo(tabNo);
    setGoodsPageData(result.data ?? createDefaultGoodsPageData());
    setIsTabLoading(false);
  };

  // 더보기 클릭 시 다음 페이지 상품을 하단에 누적합니다.
  const handleLoadMoreClick = async (): Promise<void> => {
    if (isTabLoading || isMoreLoading || !goodsPageData.hasMore || !goodsPageData.nextPageNo) {
      return;
    }

    // 최신 응답만 반영되도록 요청 시퀀스를 갱신합니다.
    const requestSequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestSequence;
    setIsMoreLoading(true);

    const result = await requestGoodsPage(selectedTabNo, goodsPageData.nextPageNo);
    if (requestSequenceRef.current !== requestSequence) {
      return;
    }

    // 유효하지 않은 기획전/탭은 뒤로가기 fallback 흐름으로 전환합니다.
    if (!result.ok) {
      setIsMoreLoading(false);
      if (result.status === 404) {
        setShouldRedirectInvalid(true);
        return;
      }
      window.alert("기획전 상품 조회에 실패했습니다.");
      return;
    }

    // 기존 상품 목록 하단에 다음 페이지 결과를 누적합니다.
    setGoodsPageData((previousState) => {
      const nextState = result.data ?? createDefaultGoodsPageData();
      return {
        ...nextState,
        goodsList: [...previousState.goodsList, ...nextState.goodsList],
      };
    });
    setIsMoreLoading(false);
  };

  // 유효하지 않은 상세/탭 상태면 이전 화면 또는 목록으로 이동시킵니다.
  if (shouldRedirectInvalid || detailData.tabList.length === 0 || detailData.defaultTabNo < 1) {
    return <ShopExhibitionInvalidRedirect />;
  }

  return (
    <section className={styles.detailSection}>
      <header className={styles.heroHeader}>
        <div className={styles.heroSideSpace} aria-hidden="true" />
        <h1 className={styles.heroTitle}>{detailData.exhibitionNm || "기획전"}</h1>
        <p className={styles.heroPeriod}>이벤트 기간 {formatExhibitionPeriod(detailData.dispStartDt, detailData.dispEndDt)}</p>
      </header>

      {visibleDetailHtml !== "" ? (
        <section className={styles.htmlSection}>
          <div className={styles.htmlContent} dangerouslySetInnerHTML={{ __html: visibleDetailHtml }} />
        </section>
      ) : null}

      <section className={styles.tabSection}>
        <div className={styles.tabScroll} role="tablist" aria-label="기획전 탭 목록">
          {detailData.tabList.map((tabItem) => {
            const isSelected = selectedTabNo === tabItem.exhibitionTabNo;
            return (
              <button
                key={tabItem.exhibitionTabNo}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`${styles.tabButton} ${isSelected ? styles.tabButtonActive : ""}`}
                onClick={() => void handleTabClick(tabItem.exhibitionTabNo)}
                disabled={isTabLoading || isMoreLoading}
              >
                {tabItem.exhibitionTabNm || "탭"}
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.goodsSection}>
        {isTabLoading && goodsPageData.goodsList.length === 0 ? (
          <div className={styles.loadingState}>상품을 불러오는 중입니다.</div>
        ) : goodsPageData.goodsList.length === 0 ? (
          <div className={styles.emptyState}>노출 가능한 상품이 없습니다.</div>
        ) : (
          <div className={styles.goodsGrid}>
            {goodsPageData.goodsList.map((item) => (
              <ShopGoodsCard key={`${selectedTabNo}-${item.goodsId}`} item={item} />
            ))}
          </div>
        )}

        {isTabLoading && goodsPageData.goodsList.length > 0 ? <p className={styles.loadingHint}>상품을 불러오는 중입니다.</p> : null}

        {goodsPageData.hasMore ? (
          <div className={styles.moreButtonWrap}>
            <button
              type="button"
              className={styles.moreButton}
              onClick={() => void handleLoadMoreClick()}
              disabled={isTabLoading || isMoreLoading}
            >
              {isMoreLoading ? "불러오는 중..." : "더보기"}
            </button>
          </div>
        ) : null}
      </section>
    </section>
  );
}
