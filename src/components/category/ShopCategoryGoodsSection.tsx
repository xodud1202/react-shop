import ShopGoodsCard from "@/components/goods/ShopGoodsCard";
import type { ShopCategoryGoodsItem } from "@/types/shopCategory";
import styles from "./ShopCategory.module.css";

interface ShopCategoryGoodsSectionProps {
  selectedCategoryNm: string;
  goodsCount: number;
  goodsList: ShopCategoryGoodsItem[];
}

// 상품 건수를 천 단위 콤마 문자열로 변환합니다.
function formatCount(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString("ko-KR");
}

// 카테고리 상품 목록 섹션을 렌더링합니다.
export default function ShopCategoryGoodsSection({ selectedCategoryNm, goodsCount, goodsList }: ShopCategoryGoodsSectionProps) {
  return (
    <section className={styles.goodsSection}>
      <header className={styles.goodsHeader}>
        <div>
          <h1 className={styles.goodsTitle}>{selectedCategoryNm || "카테고리"}</h1>
          <p className={styles.goodsCount}>{formatCount(goodsCount)}개의 상품</p>
        </div>

        <div className={styles.sortMenu}>
          <span className={styles.sortActive}>최신상품순</span>
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
    </section>
  );
}