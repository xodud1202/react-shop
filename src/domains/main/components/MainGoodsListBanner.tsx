"use client";

import { useMemo } from "react";
import type { ShopMainSection } from "@/domains/main/types";
import MainProductCard from "./MainProductCard";
import styles from "./ShopMain.module.css";

interface MainGoodsListBannerProps {
  section: ShopMainSection;
}

// 메인 상품리스트 배너 섹션을 렌더링합니다.
export default function MainGoodsListBanner({ section }: MainGoodsListBannerProps) {
  // 상품 목록을 정렬해 렌더링 순서를 고정합니다.
  const goodsList = useMemo(
    () =>
      Array.isArray(section.goodsItems)
        ? [...section.goodsItems].sort((left, right) => (left.dispOrd ?? 0) - (right.dispOrd ?? 0))
        : [],
    [section.goodsItems],
  );

  // 상품 데이터가 없으면 섹션을 렌더링하지 않습니다.
  if (goodsList.length === 0) {
    return null;
  }

  return (
    <section className={`${styles.sectionBlock} ${styles.goodsListSection}`}>
      <h2 className={styles.goodsListTitle}>{section.bannerNm}</h2>
      <div className={styles.goodsListGrid}>
        {goodsList.map((item) => (
          <MainProductCard key={`${item.goodsId}-${item.bannerTabNo}`} item={item} />
        ))}
      </div>
    </section>
  );
}

