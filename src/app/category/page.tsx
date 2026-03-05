import ShopCategoryGoodsSection from "@/components/category/ShopCategoryGoodsSection";
import ShopCategorySidebar from "@/components/category/ShopCategorySidebar";
import styles from "@/components/category/ShopCategory.module.css";
import { fetchShopCategoryPageServerData } from "@/lib/server/shopCategoryServerApi";

interface CategoryPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// 검색 파라미터에서 categoryId 값을 추출합니다.
function resolveCategoryId(rawCategoryId: string | string[] | undefined): string {
  if (Array.isArray(rawCategoryId)) {
    return typeof rawCategoryId[0] === "string" ? rawCategoryId[0] : "";
  }

  return typeof rawCategoryId === "string" ? rawCategoryId : "";
}

// 쇼핑몰 카테고리 화면을 렌더링합니다.
export default async function CategoryPage({ searchParams }: CategoryPageProps) {
  // URL categoryId를 추출해 카테고리 페이지 데이터를 조회합니다.
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const categoryId = resolveCategoryId(resolvedSearchParams.categoryId);
  const categoryPageData = await fetchShopCategoryPageServerData(categoryId);

  return (
    <section className={styles.categoryPage}>
      <div className={styles.categoryContainer}>
        <div className={styles.categoryContent}>
          <ShopCategorySidebar
            categoryTree={categoryPageData.categoryTree}
            selectedCategoryId={categoryPageData.selectedCategoryId}
          />

          <ShopCategoryGoodsSection
            selectedCategoryNm={categoryPageData.selectedCategoryNm}
            goodsCount={categoryPageData.goodsCount}
            goodsList={categoryPageData.goodsList}
          />
        </div>
      </div>
    </section>
  );
}
