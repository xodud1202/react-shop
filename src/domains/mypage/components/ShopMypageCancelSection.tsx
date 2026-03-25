"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ShopMypageCancelHistoryPageResponse } from "@/domains/mypage/types";
import { formatShopMypageOrderCount } from "@/domains/mypage/utils/shopMypageOrder";
import ShopMypageCancelCardList from "./ShopMypageCancelCardList";
import styles from "./ShopMypageCancelSection.module.css";

type ShopMypageCancelRange = "1m" | "3m" | "6m" | "custom";

interface ShopMypageCancelSectionProps {
  cancelPageData: ShopMypageCancelHistoryPageResponse;
  initialRange: ShopMypageCancelRange;
}

interface ShopMypageCancelPaginationState {
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

// 시작/종료 페이지 번호 구간 배열을 생성합니다.
function createPageNumberRange(startPageNo: number, endPageNo: number): number[] {
  const result: number[] = [];
  for (let page = startPageNo; page <= endPageNo; page += 1) {
    result.push(page);
  }
  return result;
}

// 현재 페이지 기준 페이지네이션 상태를 계산합니다.
function resolvePaginationState(pageNo: number, totalPageCount: number): ShopMypageCancelPaginationState {
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

// Date 값을 YYYY-MM-DD 문자열로 변환합니다.
function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// preset 버튼용 시작일/종료일을 계산합니다.
function resolvePresetDateRange(months: 1 | 3 | 6): { startDate: string; endDate: string } {
  const today = new Date();
  const startDate = new Date(today.getTime());
  startDate.setMonth(startDate.getMonth() - months);
  return {
    startDate: formatDateInputValue(startDate),
    endDate: formatDateInputValue(today),
  };
}

// 취소내역 페이지 링크를 생성합니다.
function buildMypageCancelHref(range: ShopMypageCancelRange, startDate: string, endDate: string, pageNo: number): string {
  const queryParams = new URLSearchParams();
  queryParams.set("range", range);
  queryParams.set("startDate", startDate);
  queryParams.set("endDate", endDate);
  queryParams.set("pageNo", String(Math.max(Math.floor(pageNo), 1)));
  return `/mypage/cancel?${queryParams.toString()}`;
}

// 마이페이지 취소내역 화면을 렌더링합니다.
export default function ShopMypageCancelSection({ cancelPageData, initialRange }: ShopMypageCancelSectionProps) {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState<ShopMypageCancelRange>(initialRange);
  const [startDateInputValue, setStartDateInputValue] = useState(cancelPageData.startDate);
  const [endDateInputValue, setEndDateInputValue] = useState(cancelPageData.endDate);

  // 현재 페이지네이션 상태를 계산합니다.
  const paginationState = resolvePaginationState(cancelPageData.pageNo, cancelPageData.totalPageCount);

  // preset 기간 버튼 클릭 시 해당 기간으로 재조회합니다.
  const handleSelectPresetRange = (range: Exclude<ShopMypageCancelRange, "custom">): void => {
    const monthMap: Record<Exclude<ShopMypageCancelRange, "custom">, 1 | 3 | 6> = {
      "1m": 1,
      "3m": 3,
      "6m": 6,
    };
    const presetDateRange = resolvePresetDateRange(monthMap[range]);
    setSelectedRange(range);
    setStartDateInputValue(presetDateRange.startDate);
    setEndDateInputValue(presetDateRange.endDate);
    router.push(buildMypageCancelHref(range, presetDateRange.startDate, presetDateRange.endDate, 1));
  };

  // custom 기간설정 모드로 전환합니다.
  const handleChangeCustomRange = (): void => {
    setSelectedRange("custom");
  };

  // 검색 버튼 클릭 시 입력된 기간을 검증한 뒤 재조회합니다.
  const handleSearch = (): void => {
    if (startDateInputValue.trim() === "" || endDateInputValue.trim() === "") {
      window.alert("조회 기간을 확인해주세요.");
      return;
    }
    if (startDateInputValue > endDateInputValue) {
      window.alert("조회 기간을 확인해주세요.");
      return;
    }
    router.push(buildMypageCancelHref(selectedRange, startDateInputValue, endDateInputValue, 1));
  };

  return (
    <section className={styles.cancelSection}>
      <header className={styles.cancelHeader}>
        <div>
          <h1 className={styles.cancelTitle}>취소내역</h1>
          <p className={styles.cancelDescription}>
            {cancelPageData.startDate} ~ {cancelPageData.endDate} 취소건수 {formatShopMypageOrderCount(cancelPageData.cancelCount)}
            건
          </p>
        </div>
      </header>

      <section className={styles.searchSection}>
        <div className={styles.searchButtonGroup}>
          <button
            type="button"
            className={`${styles.rangeButton} ${selectedRange === "custom" ? styles.rangeButtonActive : ""}`}
            onClick={handleChangeCustomRange}
          >
            기간설정
          </button>
          <button
            type="button"
            className={`${styles.rangeButton} ${selectedRange === "1m" ? styles.rangeButtonActive : ""}`}
            onClick={() => handleSelectPresetRange("1m")}
          >
            1개월
          </button>
          <button
            type="button"
            className={`${styles.rangeButton} ${selectedRange === "3m" ? styles.rangeButtonActive : ""}`}
            onClick={() => handleSelectPresetRange("3m")}
          >
            3개월
          </button>
          <button
            type="button"
            className={`${styles.rangeButton} ${selectedRange === "6m" ? styles.rangeButtonActive : ""}`}
            onClick={() => handleSelectPresetRange("6m")}
          >
            6개월
          </button>
        </div>

        <div className={styles.searchInputGroup}>
          <input
            type="date"
            className={styles.dateInput}
            value={startDateInputValue}
            onChange={(event) => {
              setSelectedRange("custom");
              setStartDateInputValue(event.target.value);
            }}
          />
          <span className={styles.dateDivider}>~</span>
          <input
            type="date"
            className={styles.dateInput}
            value={endDateInputValue}
            onChange={(event) => {
              setSelectedRange("custom");
              setEndDateInputValue(event.target.value);
            }}
          />
          <button type="button" className={styles.searchButton} onClick={handleSearch}>
            검색
          </button>
        </div>
      </section>

      <ShopMypageCancelCardList cancelList={cancelPageData.cancelList} />

      {paginationState.totalPageCount > 0 ? (
        <nav className={styles.paginationWrap} aria-label="취소내역 페이지 이동">
          {paginationState.hasPrevPage ? (
            <Link
              className={styles.paginationArrow}
              href={buildMypageCancelHref(selectedRange, cancelPageData.startDate, cancelPageData.endDate, paginationState.prevPageNo)}
            >
              {"<"}
            </Link>
          ) : (
            <span className={`${styles.paginationArrow} ${styles.paginationDisabled}`}>{"<"}</span>
          )}

          {paginationState.hasPrevBlock ? (
            <Link
              className={styles.paginationEllipsis}
              href={buildMypageCancelHref(selectedRange, cancelPageData.startDate, cancelPageData.endDate, paginationState.prevBlockPageNo)}
            >
              ...
            </Link>
          ) : null}

          {paginationState.pageNoList.map((targetPageNo) =>
            targetPageNo === paginationState.currentPageNo ? (
              <span key={`page-${targetPageNo}`} className={`${styles.paginationNumber} ${styles.paginationCurrent}`}>
                {targetPageNo}
              </span>
            ) : (
              <Link
                key={`page-${targetPageNo}`}
                className={styles.paginationNumber}
                href={buildMypageCancelHref(selectedRange, cancelPageData.startDate, cancelPageData.endDate, targetPageNo)}
              >
                {targetPageNo}
              </Link>
            ),
          )}

          {paginationState.hasNextBlock ? (
            <Link
              className={styles.paginationEllipsis}
              href={buildMypageCancelHref(selectedRange, cancelPageData.startDate, cancelPageData.endDate, paginationState.nextBlockPageNo)}
            >
              ...
            </Link>
          ) : null}

          {paginationState.hasNextPage ? (
            <Link
              className={styles.paginationArrow}
              href={buildMypageCancelHref(selectedRange, cancelPageData.startDate, cancelPageData.endDate, paginationState.nextPageNo)}
            >
              {">"}
            </Link>
          ) : (
            <span className={`${styles.paginationArrow} ${styles.paginationDisabled}`}>{">"}</span>
          )}
        </nav>
      ) : null}
    </section>
  );
}
