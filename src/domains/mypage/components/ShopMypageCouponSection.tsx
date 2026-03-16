"use client";

import { type MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getShopMypageCouponDownloadAllPath,
  getShopMypageCouponDownloadPath,
} from "@/domains/mypage/api/mypageServerApi";
import type {
  ShopMypageCouponPageResponse,
  ShopMypageCouponUnavailableGoodsItem,
  ShopMypageDownloadableCouponItem,
  ShopMypageOwnedCouponItem,
} from "@/domains/mypage/types";
import { buildLoginFormPath } from "@/domains/login/utils/loginRedirectUtils";
import styles from "./ShopMypageCouponSection.module.css";

// 마이페이지 쿠폰 탭 구분 타입입니다.
type ShopMypageCouponTab = "owned" | "downloadable";

// 마이페이지 쿠폰함 섹션 props 타입입니다.
interface ShopMypageCouponSectionProps {
  couponPageData: ShopMypageCouponPageResponse;
  initialActiveTab: ShopMypageCouponTab;
}

// 쿠폰 다운로드 액션 응답 타입입니다.
interface ShopMypageCouponActionResponse {
  message?: string;
  downloadedCount?: number;
}

// 탭별 페이지네이션 상태 타입입니다.
interface ShopMypageCouponPaginationState {
  currentPageNo: number;
  totalPageCount: number;
  pageNoList: number[];
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPageNo: number;
  nextPageNo: number;
  hasPrevBlock: boolean;
  hasNextBlock: boolean;
  prevBlockPageNo: number;
  nextBlockPageNo: number;
}

// 쿠폰 사용 불가 상품 공통 노출 타입입니다.
interface ShopMypageCouponUnavailableNoticeTarget {
  unavailableGoodsCount: number;
  unavailableGoodsList: ShopMypageCouponUnavailableGoodsItem[];
}

// 쿠폰 사용 불가 상품 레이어 팝업 위치 타입입니다.
interface ShopMypageCouponLayerPopupPosition {
  top: number;
  left: number;
  width: number;
  direction: "top" | "bottom";
}

// 쿠폰 사용 불가 상품 레이어 팝업 상태 타입입니다.
interface ShopMypageCouponLayerPopupState {
  key: string;
  couponItem: ShopMypageCouponUnavailableNoticeTarget;
  position: ShopMypageCouponLayerPopupPosition;
}

const CPN_DC_GB_AMOUNT = "CPN_DC_GB_01";
const CPN_USE_DT_PERIOD = "CPN_USE_DT_01";
const CPN_USE_DT_DATETIME = "CPN_USE_DT_02";
const COUPON_NOTICE_MESSAGE = "특정 상품 및 프로모션에 대해서 쿠폰을 사용 할 수 없는 상품이 있을 수 있습니다.";

// 숫자를 천 단위 콤마 문자열로 변환합니다.
function formatNumber(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(Math.floor(value), 0) : 0;
  return safeValue.toLocaleString("ko-KR");
}

// ISO 또는 날짜 문자열을 화면 표시용 일시 문자열로 변환합니다.
function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value.replace("T", " ").slice(0, 16);
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const hour = String(parsedDate.getHours()).padStart(2, "0");
  const minute = String(parsedDate.getMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hour}:${minute}`;
}

// 시작/종료 일시를 기간 문자열로 변환합니다.
function formatDateRange(startDateTime: string | null, endDateTime: string | null): string {
  const startLabel = formatDateTime(startDateTime);
  const endLabel = formatDateTime(endDateTime);
  if (startLabel === "-" && endLabel === "-") {
    return "기간 정보 없음";
  }
  if (startLabel === "-") {
    return `~ ${endLabel}`;
  }
  if (endLabel === "-") {
    return `${startLabel} ~`;
  }
  return `${startLabel} ~ ${endLabel}`;
}

// 할인 구분/값을 쿠폰 카드 메인 할인 문구로 변환합니다.
function formatCouponDiscountLabel(cpnDcGbCd: string, cpnDcVal: number): string {
  const safeDiscountValue = Number.isFinite(cpnDcVal) ? Math.max(Math.floor(cpnDcVal), 0) : 0;
  if (CPN_DC_GB_AMOUNT === cpnDcGbCd) {
    return `${formatNumber(safeDiscountValue)}원`;
  }
  return `${formatNumber(safeDiscountValue)}%`;
}

// 보유 쿠폰 사용 가능 기간 문구를 생성합니다.
function formatOwnedCouponPeriod(couponItem: ShopMypageOwnedCouponItem): string {
  return formatDateRange(couponItem.cpnUsableStartDt, couponItem.cpnUsableEndDt);
}

// 다운로드 가능 쿠폰 다운로드 가능 기간 문구를 생성합니다.
function formatDownloadableCouponDownloadPeriod(couponItem: ShopMypageDownloadableCouponItem): string {
  return formatDateRange(couponItem.cpnDownStartDt, couponItem.cpnDownEndDt);
}

// 다운로드 가능 쿠폰 사용 기간 안내 문구를 생성합니다.
function formatDownloadableCouponUseGuide(couponItem: ShopMypageDownloadableCouponItem): string {
  if (couponItem.cpnUseDtGb === CPN_USE_DT_PERIOD) {
    if (couponItem.cpnUsableDt && couponItem.cpnUsableDt > 0) {
      return `발급 후 ${formatNumber(couponItem.cpnUsableDt)}일 이내 사용`;
    }
    return "발급 후 사용 기간 정보 없음";
  }

  if (couponItem.cpnUseDtGb === CPN_USE_DT_DATETIME) {
    return formatDateRange(couponItem.cpnUseStartDt, couponItem.cpnUseEndDt);
  }

  return "사용 기간 정보 없음";
}

// 현재 페이지 경로(pathname + search)를 로그인 복귀용 경로로 반환합니다.
function resolveCurrentPagePath(): string {
  if (typeof window === "undefined") {
    return "/mypage/coupon";
  }
  return `${window.location.pathname}${window.location.search}`;
}

// 개별 쿠폰 다운로드 요청 payload를 생성합니다.
function buildCouponDownloadRequestPayload(cpnNo: number): { cpnNo: number } {
  return {
    cpnNo,
  };
}

// 시작/종료 페이지 번호 구간 배열을 생성합니다.
function createPageNumberRange(startPageNo: number, endPageNo: number): number[] {
  const result: number[] = [];
  for (let page = startPageNo; page <= endPageNo; page += 1) {
    result.push(page);
  }
  return result;
}

// 현재 페이지 기준 페이지네이션 상태를 계산합니다.
function resolvePaginationState(pageNo: number, totalPageCount: number): ShopMypageCouponPaginationState {
  const safeTotalPageCount = Number.isFinite(totalPageCount) && totalPageCount > 0 ? Math.floor(totalPageCount) : 0;
  const safeCurrentPageNo =
    safeTotalPageCount === 0
      ? 1
      : Math.min(Math.max(Number.isFinite(pageNo) ? Math.floor(pageNo) : 1, 1), safeTotalPageCount);
  const blockStartPageNo = Math.floor((safeCurrentPageNo - 1) / 10) * 10 + 1;
  const blockEndPageNo = Math.min(blockStartPageNo + 9, safeTotalPageCount);
  const pageNoList = safeTotalPageCount === 0 ? [] : createPageNumberRange(blockStartPageNo, blockEndPageNo);
  const hasPrevPage = safeCurrentPageNo > 1;
  const hasNextPage = safeCurrentPageNo < safeTotalPageCount;
  const hasPrevBlock = blockStartPageNo > 1;
  const hasNextBlock = blockEndPageNo < safeTotalPageCount;

  return {
    currentPageNo: safeCurrentPageNo,
    totalPageCount: safeTotalPageCount,
    pageNoList,
    hasPrevPage,
    hasNextPage,
    prevPageNo: hasPrevPage ? safeCurrentPageNo - 1 : 1,
    nextPageNo: hasNextPage ? safeCurrentPageNo + 1 : safeTotalPageCount,
    hasPrevBlock,
    hasNextBlock,
    prevBlockPageNo: hasPrevBlock ? Math.max(blockStartPageNo - 10, 1) : 1,
    nextBlockPageNo: hasNextBlock ? blockEndPageNo + 1 : safeTotalPageCount,
  };
}

// 마이페이지 쿠폰함 페이지 링크를 생성합니다.
function buildMypageCouponHref(
  ownedPageNo: number,
  downloadablePageNo: number,
  tab: ShopMypageCouponTab,
): string {
  const queryParams = new URLSearchParams();
  queryParams.set("ownedPageNo", String(Math.max(Math.floor(ownedPageNo), 1)));
  queryParams.set("downloadablePageNo", String(Math.max(Math.floor(downloadablePageNo), 1)));
  queryParams.set("tab", tab);
  return `/mypage/coupon?${queryParams.toString()}`;
}

// 쿠폰 사용 불가 상품 초과 건수를 계산합니다.
function resolveUnavailableGoodsMoreCount(couponItem: ShopMypageCouponUnavailableNoticeTarget): number {
  return Math.max(couponItem.unavailableGoodsCount - couponItem.unavailableGoodsList.length, 0);
}

// 쿠폰 사용 불가 상품 한 줄 문구를 생성합니다.
function formatUnavailableGoodsLabel(goodsItem: ShopMypageCouponUnavailableGoodsItem): string {
  const goodsId = goodsItem.goodsId.trim();
  const goodsNm = goodsItem.goodsNm.trim();
  if (goodsId === "" && goodsNm === "") {
    return "상품 정보 없음";
  }
  if (goodsId === "") {
    return goodsNm;
  }
  if (goodsNm === "") {
    return `[${goodsId}]`;
  }
  return `[${goodsId}] ${goodsNm}`;
}

// 쿠폰 사용 불가 상품 레이어 팝업 위치를 버튼 좌표 기준으로 계산합니다.
function resolveCouponLayerPopupPosition(triggerElement: HTMLButtonElement): ShopMypageCouponLayerPopupPosition {
  const triggerRect = triggerElement.getBoundingClientRect();
  const viewportPadding = 16;
  const popupGap = 12;
  const availableWidth = Math.max(window.innerWidth - viewportPadding * 2, 0);
  const popupWidth = Math.min(320, availableWidth);
  const maxLeft = Math.max(viewportPadding, window.innerWidth - popupWidth - viewportPadding);
  const left = Math.min(Math.max(triggerRect.right - popupWidth, viewportPadding), maxLeft);
  const direction: "top" | "bottom" = triggerRect.top > window.innerHeight / 2 ? "top" : "bottom";
  const top =
    direction === "top"
      ? Math.max(triggerRect.top - popupGap, viewportPadding)
      : Math.min(triggerRect.bottom + popupGap, window.innerHeight - viewportPadding);

  return {
    top,
    left,
    width: popupWidth,
    direction,
  };
}

// 마이페이지 쿠폰함/다운로드 탭 화면을 렌더링합니다.
export default function ShopMypageCouponSection({
  couponPageData,
  initialActiveTab,
}: ShopMypageCouponSectionProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ShopMypageCouponTab>(initialActiveTab);
  const [downloadingCouponNo, setDownloadingCouponNo] = useState<number | null>(null);
  const [isDownloadAllSubmitting, setIsDownloadAllSubmitting] = useState(false);
  const [layerPopupState, setLayerPopupState] = useState<ShopMypageCouponLayerPopupState | null>(null);

  // 서버에서 전달받은 활성 탭이 바뀌면 클라이언트 상태를 동기화합니다.
  useEffect(() => {
    setActiveTab(initialActiveTab);
    setLayerPopupState(null);
  }, [initialActiveTab]);

  // 레이어 팝업이 열려 있는 동안 외부 클릭, ESC, 스크롤/리사이즈 시 팝업을 닫습니다.
  useEffect(() => {
    if (!layerPopupState) {
      return;
    }

    const handleDocumentMouseDown = (event: MouseEvent): void => {
      const eventTarget = event.target;
      if (!(eventTarget instanceof Element)) {
        setLayerPopupState(null);
        return;
      }
      if (
        eventTarget.closest("[data-coupon-tooltip-root='true']") ||
        eventTarget.closest("[data-coupon-tooltip-layer='true']")
      ) {
        return;
      }
      setLayerPopupState(null);
    };

    const handleDocumentKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setLayerPopupState(null);
      }
    };

    const handleViewportChange = (): void => {
      setLayerPopupState(null);
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("keydown", handleDocumentKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [layerPopupState]);

  // 보유 쿠폰 목록을 메모이즈합니다.
  const ownedCouponList = useMemo(() => couponPageData.ownedCouponList ?? [], [couponPageData.ownedCouponList]);

  // 다운로드 가능 쿠폰 목록을 메모이즈합니다.
  const downloadableCouponList = useMemo(
    () => couponPageData.downloadableCouponList ?? [],
    [couponPageData.downloadableCouponList],
  );

  // 탭별 페이지네이션 상태를 계산합니다.
  const ownedPaginationState = useMemo(
    () => resolvePaginationState(couponPageData.ownedPageNo, couponPageData.ownedTotalPageCount),
    [couponPageData.ownedPageNo, couponPageData.ownedTotalPageCount],
  );
  const downloadablePaginationState = useMemo(
    () => resolvePaginationState(couponPageData.downloadablePageNo, couponPageData.downloadableTotalPageCount),
    [couponPageData.downloadablePageNo, couponPageData.downloadableTotalPageCount],
  );

  // 다운로드 관련 버튼 공통 비활성화 여부를 계산합니다.
  const isAnyDownloadSubmitting = downloadingCouponNo !== null || isDownloadAllSubmitting;

  // 현재 활성 탭을 URL 쿼리와 동기화합니다.
  const syncActiveTabQuery = useCallback(
    (nextTab: ShopMypageCouponTab): void => {
      if (typeof window === "undefined") {
        return;
      }
      const href = buildMypageCouponHref(couponPageData.ownedPageNo, couponPageData.downloadablePageNo, nextTab);
      window.history.replaceState(null, "", href);
    },
    [couponPageData.downloadablePageNo, couponPageData.ownedPageNo],
  );

  // 탭 변경 시 현재 활성 탭과 URL 쿼리를 함께 갱신합니다.
  const handleChangeTab = useCallback(
    (nextTab: ShopMypageCouponTab): void => {
      setActiveTab(nextTab);
      setLayerPopupState(null);
      syncActiveTabQuery(nextTab);
    },
    [syncActiveTabQuery],
  );

  // 401 응답을 공통 처리하고 로그인 이동 여부를 안내합니다.
  const handleUnauthorizedResponse = useCallback((): void => {
    const shouldMoveLogin = window.confirm("로그인이 필요한 기능입니다. 로그인하시겠습니까?");
    if (shouldMoveLogin) {
      router.push(buildLoginFormPath(resolveCurrentPagePath()));
    }
  }, [router]);

  // 사용 불가 상품 레이어 팝업 열림/닫힘 상태를 토글합니다.
  const handleToggleTooltipLayerPopup = useCallback(
    (
      tooltipKey: string,
      couponItem: ShopMypageCouponUnavailableNoticeTarget,
      triggerEvent: ReactMouseEvent<HTMLButtonElement>,
    ): void => {
      // React 이벤트 수명과 무관하게 사용할 수 있도록 버튼 엘리먼트를 먼저 안전하게 보관합니다.
      const triggerElement = triggerEvent.currentTarget;
      if (!(triggerElement instanceof HTMLButtonElement)) {
        return;
      }
      const nextPosition = resolveCouponLayerPopupPosition(triggerElement);

      setLayerPopupState((previousLayerPopupState) => {
        if (previousLayerPopupState?.key === tooltipKey) {
          return null;
        }
        return {
          key: tooltipKey,
          couponItem,
          position: nextPosition,
        };
      });
    },
    [],
  );

  // 개별 쿠폰 다운로드를 처리합니다.
  const handleDownloadCoupon = async (cpnNo: number): Promise<void> => {
    if (!Number.isFinite(cpnNo) || cpnNo < 1 || isAnyDownloadSubmitting) {
      return;
    }

    try {
      setDownloadingCouponNo(cpnNo);
      const response = await fetch(getShopMypageCouponDownloadPath(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(buildCouponDownloadRequestPayload(cpnNo)),
      });
      const payload = (await response.json().catch(() => null)) as ShopMypageCouponActionResponse | null;

      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }

      if (!response.ok) {
        window.alert(payload?.message ?? "쿠폰 다운로드에 실패했습니다.");
        return;
      }

      window.alert(payload?.message ?? "쿠폰을 다운로드했습니다.");
      router.refresh();
    } catch {
      window.alert("쿠폰 다운로드에 실패했습니다.");
    } finally {
      setDownloadingCouponNo(null);
    }
  };

  // 전체 다운로드 버튼 클릭 시 현재 다운로드 가능한 쿠폰을 모두 발급합니다.
  const handleDownloadAllCoupons = async (): Promise<void> => {
    if (couponPageData.downloadableCouponCount === 0 || isAnyDownloadSubmitting) {
      return;
    }

    try {
      setIsDownloadAllSubmitting(true);
      const response = await fetch(getShopMypageCouponDownloadAllPath(), {
        method: "POST",
        credentials: "include",
      });
      const payload = (await response.json().catch(() => null)) as ShopMypageCouponActionResponse | null;

      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }

      if (!response.ok) {
        window.alert(payload?.message ?? "전체 쿠폰 다운로드에 실패했습니다.");
        return;
      }

      window.alert(payload?.message ?? "전체 쿠폰을 다운로드했습니다.");
      router.refresh();
    } catch {
      window.alert("전체 쿠폰 다운로드에 실패했습니다.");
    } finally {
      setIsDownloadAllSubmitting(false);
    }
  };

  // 쿠폰 카드 하단의 사용 불가 상품 안내/툴팁을 렌더링합니다.
  const renderUnavailableGoodsNotice = useCallback(
    (tooltipKey: string, couponItem: ShopMypageCouponUnavailableNoticeTarget) => {
      const isTooltipOpen = layerPopupState?.key === tooltipKey;

      return (
        <div className={styles.noticeSection} data-coupon-tooltip-root="true">
          <div className={styles.noticeHeader}>
            <p className={styles.noticeText}>{COUPON_NOTICE_MESSAGE}</p>
            <button
              type="button"
              className={styles.noticeTooltipButton}
              aria-label="쿠폰 사용 불가 상품 보기"
              aria-expanded={isTooltipOpen}
              onClick={(event) => handleToggleTooltipLayerPopup(tooltipKey, couponItem, event)}
            >
              ?
            </button>
          </div>
        </div>
      );
    },
    [handleToggleTooltipLayerPopup, layerPopupState],
  );

  // 현재 열린 사용 불가 상품 레이어 팝업을 렌더링합니다.
  const renderUnavailableGoodsLayerPopup = useCallback(() => {
    if (!layerPopupState) {
      return null;
    }

    const unavailableGoodsMoreCount = resolveUnavailableGoodsMoreCount(layerPopupState.couponItem);

    return (
      <div
        className={`${styles.noticeTooltipPanel} ${
          layerPopupState.position.direction === "top" ? styles.noticeTooltipPanelTop : styles.noticeTooltipPanelBottom
        }`}
        data-coupon-tooltip-layer="true"
        style={{
          top: `${layerPopupState.position.top}px`,
          left: `${layerPopupState.position.left}px`,
          width: `${layerPopupState.position.width}px`,
        }}
      >
        <p className={styles.noticeTooltipTitle}>쿠폰 사용 불가 상품</p>
        {layerPopupState.couponItem.unavailableGoodsList.length === 0 ? (
          <p className={styles.noticeTooltipEmpty}>쿠폰 사용 불가 상품 정보가 없습니다.</p>
        ) : (
          <ul className={styles.noticeTooltipList}>
            {layerPopupState.couponItem.unavailableGoodsList.map((goodsItem) => (
              <li
                key={`${layerPopupState.key}-${goodsItem.goodsId}-${goodsItem.goodsNm}`}
                className={styles.noticeTooltipItem}
              >
                {formatUnavailableGoodsLabel(goodsItem)}
              </li>
            ))}
          </ul>
        )}

        {unavailableGoodsMoreCount > 0 ? (
          <p className={styles.noticeTooltipMore}>그 외 {formatNumber(unavailableGoodsMoreCount)}개</p>
        ) : null}
      </div>
    );
  }, [layerPopupState]);

  // 탭별 페이지네이션 네비게이션을 렌더링합니다.
  const renderPagination = useCallback(
    (paginationState: ShopMypageCouponPaginationState, tab: ShopMypageCouponTab) => {
      if (paginationState.totalPageCount <= 1) {
        return null;
      }

      const buildPageHref = (targetPageNo: number): string =>
        tab === "owned"
          ? buildMypageCouponHref(targetPageNo, couponPageData.downloadablePageNo, "owned")
          : buildMypageCouponHref(couponPageData.ownedPageNo, targetPageNo, "downloadable");

      return (
        <nav className={styles.paginationWrap} aria-label={`${tab === "owned" ? "쿠폰함" : "쿠폰 다운로드"} 페이지 이동`}>
          {paginationState.hasPrevPage ? (
            <Link className={styles.paginationArrow} href={buildPageHref(paginationState.prevPageNo)}>
              {"<"}
            </Link>
          ) : (
            <span className={`${styles.paginationArrow} ${styles.paginationDisabled}`}>{"<"}</span>
          )}

          {paginationState.hasPrevBlock ? (
            <Link className={styles.paginationEllipsis} href={buildPageHref(paginationState.prevBlockPageNo)}>
              ...
            </Link>
          ) : null}

          {paginationState.pageNoList.map((targetPageNo) =>
            targetPageNo === paginationState.currentPageNo ? (
              <span key={`page-${tab}-${targetPageNo}`} className={`${styles.paginationNumber} ${styles.paginationCurrent}`}>
                {targetPageNo}
              </span>
            ) : (
              <Link key={`page-${tab}-${targetPageNo}`} className={styles.paginationNumber} href={buildPageHref(targetPageNo)}>
                {targetPageNo}
              </Link>
            ),
          )}

          {paginationState.hasNextBlock ? (
            <Link className={styles.paginationEllipsis} href={buildPageHref(paginationState.nextBlockPageNo)}>
              ...
            </Link>
          ) : null}

          {paginationState.hasNextPage ? (
            <Link className={styles.paginationArrow} href={buildPageHref(paginationState.nextPageNo)}>
              {">"}
            </Link>
          ) : (
            <span className={`${styles.paginationArrow} ${styles.paginationDisabled}`}>{">"}</span>
          )}
        </nav>
      );
    },
    [couponPageData.downloadablePageNo, couponPageData.ownedPageNo],
  );

  return (
    <section className={styles.couponSection}>
      <header className={styles.sectionHeader}>
        <div>
          <h1 className={styles.sectionTitle}>쿠폰함</h1>
          <p className={styles.sectionSummary}>보유 중인 사용 가능 쿠폰과 지금 받을 수 있는 쿠폰을 한 번에 확인하세요.</p>
        </div>
      </header>

      <div className={styles.tabButtonRow} role="tablist" aria-label="쿠폰함 탭">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "owned"}
          className={`${styles.tabButton} ${activeTab === "owned" ? styles.tabButtonActive : ""}`}
          onClick={() => handleChangeTab("owned")}
        >
          쿠폰함
          <span className={styles.tabCount}>{formatNumber(couponPageData.ownedCouponCount)}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "downloadable"}
          className={`${styles.tabButton} ${activeTab === "downloadable" ? styles.tabButtonActive : ""}`}
          onClick={() => handleChangeTab("downloadable")}
        >
          쿠폰 다운로드
          <span className={styles.tabCount}>{formatNumber(couponPageData.downloadableCouponCount)}</span>
        </button>
      </div>

      {activeTab === "owned" ? (
        <div className={styles.tabPanel} role="tabpanel" aria-label="쿠폰함">
          {ownedCouponList.length === 0 ? (
            <div className={styles.emptyState}>현재 사용 가능한 보유 쿠폰이 없습니다.</div>
          ) : (
            <>
              <div className={styles.couponGrid}>
                {ownedCouponList.map((couponItem) => {
                  const tooltipKey = `owned-${couponItem.custCpnNo}`;
                  return (
                    <article key={tooltipKey} className={styles.couponCard}>
                      <div className={styles.cardTopRow}>
                        <span className={styles.couponBadge}>{couponItem.cpnGbNm || "쿠폰"}</span>
                        <span className={styles.cardSubText}>보유번호 {formatNumber(couponItem.custCpnNo)}</span>
                      </div>

                      <h2 className={styles.couponName}>{couponItem.cpnNm}</h2>
                      <p className={styles.discountText}>
                        {formatCouponDiscountLabel(couponItem.cpnDcGbCd, couponItem.cpnDcVal)}
                        <span className={styles.discountSuffix}> 할인</span>
                      </p>

                      <dl className={styles.metaList}>
                        <div className={styles.metaRow}>
                          <dt>쿠폰 종류</dt>
                          <dd>{couponItem.cpnGbNm || "-"}</dd>
                        </div>
                        <div className={styles.metaRow}>
                          <dt>사용 가능 기간</dt>
                          <dd>{formatOwnedCouponPeriod(couponItem)}</dd>
                        </div>
                      </dl>

                      {renderUnavailableGoodsNotice(tooltipKey, couponItem)}
                    </article>
                  );
                })}
              </div>
              {renderPagination(ownedPaginationState, "owned")}
            </>
          )}
        </div>
      ) : (
        <div className={styles.tabPanel} role="tabpanel" aria-label="쿠폰 다운로드">
          <div className={styles.downloadHeader}>
            <p className={styles.downloadSummary}>현재 다운로드 가능한 쿠폰 {formatNumber(couponPageData.downloadableCouponCount)}개</p>
            <button
              type="button"
              className={styles.downloadAllButton}
              onClick={handleDownloadAllCoupons}
              disabled={couponPageData.downloadableCouponCount === 0 || isAnyDownloadSubmitting}
            >
              {isDownloadAllSubmitting ? "전체 다운로드중..." : "전체 다운로드"}
            </button>
          </div>

          {downloadableCouponList.length === 0 ? (
            <div className={styles.emptyState}>현재 다운로드 가능한 쿠폰이 없습니다.</div>
          ) : (
            <>
              <div className={styles.couponGrid}>
                {downloadableCouponList.map((couponItem) => {
                  const tooltipKey = `downloadable-${couponItem.cpnNo}`;
                  const isDownloading = downloadingCouponNo === couponItem.cpnNo;

                  return (
                    <article key={tooltipKey} className={styles.couponCard}>
                      <div className={styles.cardTopRow}>
                        <span className={styles.couponBadge}>{couponItem.cpnGbNm || "쿠폰"}</span>
                        <span className={styles.cardSubText}>중복 다운로드 가능</span>
                      </div>

                      <h2 className={styles.couponName}>{couponItem.cpnNm}</h2>
                      <p className={styles.discountText}>
                        {formatCouponDiscountLabel(couponItem.cpnDcGbCd, couponItem.cpnDcVal)}
                        <span className={styles.discountSuffix}> 할인</span>
                      </p>

                      <dl className={styles.metaList}>
                        <div className={styles.metaRow}>
                          <dt>다운로드 기간</dt>
                          <dd>{formatDownloadableCouponDownloadPeriod(couponItem)}</dd>
                        </div>
                        <div className={styles.metaRow}>
                          <dt>사용 기간</dt>
                          <dd>{formatDownloadableCouponUseGuide(couponItem)}</dd>
                        </div>
                      </dl>

                      <button
                        type="button"
                        className={styles.downloadButton}
                        onClick={() => handleDownloadCoupon(couponItem.cpnNo)}
                        disabled={isAnyDownloadSubmitting}
                      >
                        {isDownloading ? "다운로드중..." : "다운로드"}
                      </button>

                      {renderUnavailableGoodsNotice(tooltipKey, couponItem)}
                    </article>
                  );
                })}
              </div>
              {renderPagination(downloadablePaginationState, "downloadable")}
            </>
          )}
        </div>
      )}

      {renderUnavailableGoodsLayerPopup()}
    </section>
  );
}
