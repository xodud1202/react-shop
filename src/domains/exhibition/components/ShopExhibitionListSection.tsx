import Image from "next/image";
import Link from "next/link";
import type { ShopExhibitionItem } from "@/domains/exhibition/types";
import styles from "./ShopExhibition.module.css";

interface ShopExhibitionListSectionProps {
  exhibitionList: ShopExhibitionItem[];
  totalCount: number;
  pageNo: number;
  totalPageCount: number;
}

interface ShopExhibitionPaginationState {
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

// 기획전 건수를 천 단위 콤마 문자열로 변환합니다.
function formatCount(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString("ko-KR");
}

// pageNo를 포함한 기획전 목록 페이지 링크를 생성합니다.
function buildExhibitionListHref(pageNo: number): string {
  // 페이지 쿼리스트링을 구성합니다.
  const queryParams = new URLSearchParams();
  queryParams.set("pageNo", String(pageNo));
  return `/exhibition/list?${queryParams.toString()}`;
}

// 시작/종료 페이지 번호 구간 배열을 생성합니다.
function createPageNumberRange(startPageNo: number, endPageNo: number): number[] {
  // 페이지 번호 목록을 순차적으로 구성합니다.
  const result: number[] = [];
  for (let page = startPageNo; page <= endPageNo; page += 1) {
    result.push(page);
  }
  return result;
}

// 현재 페이지 기준 페이지네이션 상태를 계산합니다.
function resolvePaginationState(pageNo: number, totalPageCount: number): ShopExhibitionPaginationState {
  // 총 페이지 수와 현재 페이지를 안전한 값으로 보정합니다.
  const safeTotalPageCount = Number.isFinite(totalPageCount) && totalPageCount > 0 ? Math.floor(totalPageCount) : 0;
  const safeCurrentPageNo =
    safeTotalPageCount === 0
      ? 1
      : Math.min(Math.max(Number.isFinite(pageNo) ? Math.floor(pageNo) : 1, 1), safeTotalPageCount);

  // 10개 단위 페이지 블록 범위를 계산합니다.
  const blockStartPageNo = Math.floor((safeCurrentPageNo - 1) / 10) * 10 + 1;
  const blockEndPageNo = Math.min(blockStartPageNo + 9, safeTotalPageCount);
  const pageNoList = safeTotalPageCount === 0 ? [] : createPageNumberRange(blockStartPageNo, blockEndPageNo);

  // 이전/다음 페이지와 이전/다음 블록 이동 상태를 계산합니다.
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

// 기획전 목록 섹션을 렌더링합니다.
export default function ShopExhibitionListSection({
  exhibitionList,
  totalCount,
  pageNo,
  totalPageCount,
}: ShopExhibitionListSectionProps) {
  // 페이지네이션 렌더링 상태를 계산합니다.
  const paginationState = resolvePaginationState(pageNo, totalPageCount);

  return (
    <section className={styles.exhibitionSection}>
      <header className={styles.exhibitionHeader}>
        <h1 className={styles.exhibitionTitle}>기획전</h1>
        <p className={styles.exhibitionCount}>{formatCount(totalCount)}개의 기획전</p>
      </header>

      {exhibitionList.length === 0 ? (
        <div className={styles.emptyState}>현재 노출 가능한 기획전이 없습니다.</div>
      ) : (
        <div className={styles.exhibitionGrid}>
          {exhibitionList.map((item) => (
            <article key={`exhibition-${item.exhibitionNo}`} className={styles.exhibitionCard}>
              <div className={styles.thumbnailWrap}>
                {item.thumbnailUrl?.trim() !== "" ? (
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.exhibitionNm || "기획전 썸네일"}
                    fill
                    sizes="(max-width: 900px) 50vw, (max-width: 1280px) 25vw, 20vw"
                    className={styles.thumbnailImage}
                  />
                ) : (
                  <div className={styles.thumbnailPlaceholder}>썸네일 준비중</div>
                )}
              </div>
              <p className={styles.thumbnailName}>{item.exhibitionNm || "-"}</p>
            </article>
          ))}
        </div>
      )}

      {paginationState.totalPageCount > 0 ? (
        <nav className={styles.paginationWrap} aria-label="기획전 페이지 이동">
          {paginationState.hasPrevPage ? (
            <Link className={styles.paginationArrow} href={buildExhibitionListHref(paginationState.prevPageNo)}>
              {"<"}
            </Link>
          ) : (
            <span className={`${styles.paginationArrow} ${styles.paginationDisabled}`}>{"<"}</span>
          )}

          {paginationState.hasPrevBlock ? (
            <Link className={styles.paginationEllipsis} href={buildExhibitionListHref(paginationState.prevBlockPageNo)}>
              ...
            </Link>
          ) : null}

          {paginationState.pageNoList.map((targetPageNo) =>
            targetPageNo === paginationState.currentPageNo ? (
              <span key={`page-${targetPageNo}`} className={`${styles.paginationNumber} ${styles.paginationCurrent}`}>
                {targetPageNo}
              </span>
            ) : (
              <Link key={`page-${targetPageNo}`} className={styles.paginationNumber} href={buildExhibitionListHref(targetPageNo)}>
                {targetPageNo}
              </Link>
            ),
          )}

          {paginationState.hasNextBlock ? (
            <Link className={styles.paginationEllipsis} href={buildExhibitionListHref(paginationState.nextBlockPageNo)}>
              ...
            </Link>
          ) : null}

          {paginationState.hasNextPage ? (
            <Link className={styles.paginationArrow} href={buildExhibitionListHref(paginationState.nextPageNo)}>
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

