import Link from "next/link";
import ShopGoodsCard from "@/components/goods/ShopGoodsCard";
import type { ShopCategoryGoodsItem } from "@/types/shopCategory";
import styles from "./ShopCategory.module.css";

interface ShopCategoryGoodsSectionProps {
  selectedCategoryId: string;
  selectedCategoryNm: string;
  goodsCount: number;
  goodsList: ShopCategoryGoodsItem[];
  pageNo: number;
  totalPageCount: number;
}

interface ShopCategoryPaginationState {
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

// 상품 건수를 천 단위 콤마 문자열로 변환합니다.
function formatCount(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString("ko-KR");
}

// categoryId와 pageNo를 포함한 카테고리 페이지 링크를 생성합니다.
function buildCategoryPageHref(categoryId: string, pageNo: number): string {
  // 카테고리/페이지 쿼리스트링을 구성합니다.
  const queryParams = new URLSearchParams();
  if (categoryId.trim() !== "") {
    queryParams.set("categoryId", categoryId);
  }
  queryParams.set("pageNo", String(pageNo));
  return `/category?${queryParams.toString()}`;
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
function resolvePaginationState(pageNo: number, totalPageCount: number): ShopCategoryPaginationState {
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

// 카테고리 상품 목록 섹션을 렌더링합니다.
export default function ShopCategoryGoodsSection({
  selectedCategoryId,
  selectedCategoryNm,
  goodsCount,
  goodsList,
  pageNo,
  totalPageCount,
}: ShopCategoryGoodsSectionProps) {
  // 페이지네이션 렌더링 상태를 계산합니다.
  const paginationState = resolvePaginationState(pageNo, totalPageCount);

  return (
    <section className={styles.goodsSection}>
      <header className={styles.goodsHeader}>
        <div>
          <h1 className={styles.goodsTitle}>{selectedCategoryNm || "카테고리"}</h1>
          <p className={styles.goodsCount}>{formatCount(goodsCount)}개의 상품</p>
        </div>

        <div className={styles.sortMenu}>
          <span className={styles.sortActive}>MD 추천순</span>
          <span>|</span>
          <span>최신상품순</span>
          <span>|</span>
          <span>인기상품순</span>
          <span>|</span>
          <span>리뷰 많은순</span>
          <span>|</span>
          <span>낮은 가격순</span>
        </div>
      </header>

      {goodsList.length === 0 ? (
        <div className={styles.emptyState}>선택 카테고리에 노출 가능한 상품이 없습니다.</div>
      ) : (
        <div className={styles.goodsGrid}>
          {goodsList.map((item) => (
            <ShopGoodsCard key={`${item.categoryId}-${item.goodsId}`} item={item} />
          ))}
        </div>
      )}

      {paginationState.totalPageCount > 0 ? (
        <nav className={styles.paginationWrap} aria-label="카테고리 상품 페이지 이동">
          {paginationState.hasPrevPage ? (
            <Link className={styles.paginationArrow} href={buildCategoryPageHref(selectedCategoryId, paginationState.prevPageNo)}>
              {"<"}
            </Link>
          ) : (
            <span className={`${styles.paginationArrow} ${styles.paginationDisabled}`}>{"<"}</span>
          )}

          {paginationState.hasPrevBlock ? (
            <Link className={styles.paginationEllipsis} href={buildCategoryPageHref(selectedCategoryId, paginationState.prevBlockPageNo)}>
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
                href={buildCategoryPageHref(selectedCategoryId, targetPageNo)}
              >
                {targetPageNo}
              </Link>
            ),
          )}

          {paginationState.hasNextBlock ? (
            <Link className={styles.paginationEllipsis} href={buildCategoryPageHref(selectedCategoryId, paginationState.nextBlockPageNo)}>
              ...
            </Link>
          ) : null}

          {paginationState.hasNextPage ? (
            <Link className={styles.paginationArrow} href={buildCategoryPageHref(selectedCategoryId, paginationState.nextPageNo)}>
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