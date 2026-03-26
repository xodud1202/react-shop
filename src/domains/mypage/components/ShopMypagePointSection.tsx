"use client";

import Link from "next/link";
import type { ShopMypagePointItem, ShopMypagePointPageResponse } from "@/domains/mypage/types";
import styles from "./ShopMypagePointSection.module.css";

interface ShopMypagePointSectionProps {
  pointPageData: ShopMypagePointPageResponse;
}

interface ShopMypagePointPaginationState {
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
function resolvePaginationState(pageNo: number, totalPageCount: number): ShopMypagePointPaginationState {
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

// 포인트 내역 페이지 링크를 생성합니다.
function buildMypagePointHref(pageNo: number): string {
  const queryParams = new URLSearchParams();
  queryParams.set("pageNo", String(Math.max(Math.floor(pageNo), 1)));
  return `/mypage/point?${queryParams.toString()}`;
}

// 숫자를 천단위 콤마 형식으로 포맷합니다.
function formatPointAmt(value: number): string {
  return Math.abs(value).toLocaleString("ko-KR");
}

// 포인트 금액의 표시 정보(라벨, 스타일)를 결정합니다.
function resolvePointAmtDisplay(item: ShopMypagePointItem): { label: string; className: string } {
  if (item.pntAmt >= 0) {
    return { label: `+${formatPointAmt(item.pntAmt)}P`, className: styles.pointSaveAmt };
  }
  return { label: `-${formatPointAmt(item.pntAmt)}P`, className: styles.pointUseAmt };
}

// 마이페이지 포인트 내역 화면을 렌더링합니다.
export default function ShopMypagePointSection({ pointPageData }: ShopMypagePointSectionProps) {
  // 현재 페이지네이션 상태를 계산합니다.
  const paginationState = resolvePaginationState(pointPageData.pageNo, pointPageData.totalPageCount);

  return (
    <section className={styles.pointSection}>
      <header className={styles.pointHeader}>
        <h1 className={styles.pointTitle}>포인트 내역</h1>
      </header>

      {/* 포인트 요약 카드 */}
      <div className={styles.summaryCardGroup}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryCardLabel}>사용 가능 포인트</p>
          <p className={styles.summaryCardValue}>{pointPageData.availablePointAmt.toLocaleString("ko-KR")}P</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryCardLabel}>7일 이내 만료 예정</p>
          <p className={`${styles.summaryCardValue} ${pointPageData.expiringPointAmt > 0 ? styles.summaryCardValueExpiring : ""}`}>
            {pointPageData.expiringPointAmt.toLocaleString("ko-KR")}P
          </p>
          {pointPageData.expiringPointAmt > 0 ? (
            <p className={styles.summaryCardNote}>기간 내 사용하지 않으면 소멸됩니다.</p>
          ) : null}
        </div>
      </div>

      {/* 포인트 적립/차감 내역 리스트 */}
      {pointPageData.pointList.length === 0 ? (
        <div className={styles.emptyState}>포인트 내역이 없습니다.</div>
      ) : (
        <div className={styles.pointTableWrap}>
          <table className={styles.pointTable}>
            <thead>
              <tr>
                <th>날짜</th>
                <th>내용</th>
                <th>적립 / 차감</th>
              </tr>
            </thead>
            <tbody>
              {pointPageData.pointList.map((item, index) => {
                const amtDisplay = resolvePointAmtDisplay(item);
                return (
                  // pntNo가 중복될 수 있으므로 index를 함께 key로 사용합니다.
                  <tr key={`${item.pntNo}-${index}`}>
                    <td>
                      <span className={styles.pointDateText}>{item.regDt}</span>
                    </td>
                    <td className={styles.pointMemoCell}>
                      <p className={styles.pointMemoText}>{item.bigo}</p>
                    </td>
                    <td>
                      <span className={amtDisplay.className}>{amtDisplay.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {paginationState.totalPageCount > 0 ? (
        <nav className={styles.paginationWrap} aria-label="포인트 내역 페이지 이동">
          {paginationState.hasPrevPage ? (
            <Link className={styles.paginationArrow} href={buildMypagePointHref(paginationState.prevPageNo)}>
              {"<"}
            </Link>
          ) : (
            <span className={`${styles.paginationArrow} ${styles.paginationDisabled}`}>{"<"}</span>
          )}

          {paginationState.hasPrevBlock ? (
            <Link className={styles.paginationEllipsis} href={buildMypagePointHref(paginationState.prevBlockPageNo)}>
              ...
            </Link>
          ) : null}

          {paginationState.pageNoList.map((targetPageNo) =>
            targetPageNo === paginationState.currentPageNo ? (
              <span key={`page-${targetPageNo}`} className={`${styles.paginationNumber} ${styles.paginationCurrent}`}>
                {targetPageNo}
              </span>
            ) : (
              <Link key={`page-${targetPageNo}`} className={styles.paginationNumber} href={buildMypagePointHref(targetPageNo)}>
                {targetPageNo}
              </Link>
            ),
          )}

          {paginationState.hasNextBlock ? (
            <Link className={styles.paginationEllipsis} href={buildMypagePointHref(paginationState.nextBlockPageNo)}>
              ...
            </Link>
          ) : null}

          {paginationState.hasNextPage ? (
            <Link className={styles.paginationArrow} href={buildMypagePointHref(paginationState.nextPageNo)}>
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
