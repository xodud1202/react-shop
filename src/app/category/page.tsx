import { cache } from "react";
import type { Metadata } from "next";
import ShopCategoryGoodsSection from "@/domains/category/components/ShopCategoryGoodsSection";
import ShopCategorySidebar from "@/domains/category/components/ShopCategorySidebar";
import styles from "@/domains/category/components/ShopCategory.module.css";
import { fetchShopCategoryPageServerData } from "@/domains/category/api/categoryServerApi";
import { createShopPageMetadata } from "@/shared/seo/shopMetadata";

interface CategoryPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// 카테고리 페이지 데이터 조회를 요청 단위로 메모이징합니다.
const loadShopCategoryPageData = cache(async (categoryId: string, pageNo: number) => {
  return fetchShopCategoryPageServerData(categoryId, pageNo);
});

// 검색 파라미터에서 categoryId 값을 추출합니다.
function resolveCategoryId(rawCategoryId: string | string[] | undefined): string {
  if (Array.isArray(rawCategoryId)) {
    return typeof rawCategoryId[0] === "string" ? rawCategoryId[0] : "";
  }

  return typeof rawCategoryId === "string" ? rawCategoryId : "";
}

// 검색 파라미터에서 pageNo 값을 추출해 1 이상 정수로 보정합니다.
function resolvePageNo(rawPageNo: string | string[] | undefined): number {
  // 배열 파라미터면 첫 번째 값을 사용합니다.
  const pageNoSource = Array.isArray(rawPageNo) ? rawPageNo[0] : rawPageNo;
  const parsedPageNo = Number(pageNoSource);
  if (!Number.isFinite(parsedPageNo) || parsedPageNo < 1) {
    return 1;
  }

  return Math.floor(parsedPageNo);
}

// 쇼핑몰 카테고리 화면을 렌더링합니다.
export default async function CategoryPage({ searchParams }: CategoryPageProps) {
  // URL categoryId/pageNo를 추출해 카테고리 페이지 데이터를 조회합니다.
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const categoryId = resolveCategoryId(resolvedSearchParams.categoryId);
  const pageNo = resolvePageNo(resolvedSearchParams.pageNo);
  const categoryPageData = await loadShopCategoryPageData(categoryId, pageNo);

  return (
    <section className={styles.categoryPage}>
      <div className={styles.categoryContainer}>
        <div className={styles.categoryContent}>
          <ShopCategorySidebar
            key={`${categoryPageData.selectedCategoryId}-${categoryPageData.categoryTree.length}`}
            categoryTree={categoryPageData.categoryTree}
            selectedCategoryId={categoryPageData.selectedCategoryId}
          />

          <ShopCategoryGoodsSection
            selectedCategoryId={categoryPageData.selectedCategoryId}
            selectedCategoryNm={categoryPageData.selectedCategoryNm}
            goodsCount={categoryPageData.goodsCount}
            goodsList={categoryPageData.goodsList}
            pageNo={categoryPageData.pageNo}
            totalPageCount={categoryPageData.totalPageCount}
          />
        </div>
      </div>
    </section>
  );
}

// 카테고리 페이지 메타데이터를 생성합니다.
export async function generateMetadata({ searchParams }: CategoryPageProps): Promise<Metadata> {
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const categoryId = resolveCategoryId(resolvedSearchParams.categoryId);
  const categoryPageData = await loadShopCategoryPageData(categoryId, 1);
  const selectedCategoryNm = categoryPageData.selectedCategoryNm.trim();

  return createShopPageMetadata({
    title: selectedCategoryNm || "카테고리",
    description:
      selectedCategoryNm !== ""
        ? `${selectedCategoryNm} 카테고리 상품과 추천 아이템을 확인할 수 있습니다.`
        : "카테고리별 상품 목록을 확인할 수 있습니다.",
  });
}
