"use client";

import type { ShopMainGoodsItem } from "@/types/shopMain";
import styles from "./ShopMain.module.css";

interface MainProductCardProps {
  item: ShopMainGoodsItem;
}

// 가격 숫자를 천 단위 콤마 문자열로 변환합니다.
function formatPrice(value: number | null | undefined): string {
  // 숫자형이 아니면 기본값 0으로 보정합니다.
  const safeValue = typeof value === "number" && Number.isFinite(value) ? value : 0;

  // 한국어 로케일 기준 천 단위 포맷을 적용합니다.
  return safeValue.toLocaleString("ko-KR");
}

// 메인 화면 상품 카드 UI를 렌더링합니다.
export default function MainProductCard({ item }: MainProductCardProps) {
  // 이미지 URL 유효성 여부를 계산합니다.
  const hasImage = typeof item.imgUrl === "string" && item.imgUrl.trim().length > 0;

  return (
    <article className={styles.productCard}>
      <div className={styles.productThumbWrap}>
        {hasImage ? (
          <img className={styles.productThumb} src={item.imgUrl} alt={item.goodsNm ?? "상품 이미지"} loading="lazy" />
        ) : (
          <div className={styles.productPlaceholder}>이미지 준비중</div>
        )}
      </div>
      <div className={styles.productBrand}>{item.brandNm || "브랜드"}</div>
      <div className={styles.productName}>{item.goodsNm || "상품명 준비중"}</div>
      <div className={styles.productPrice}>{formatPrice(item.saleAmt)}원</div>
    </article>
  );
}
