"use client";

import type { ShopGoodsCardItem } from "@/types/shopGoods";
import styles from "./ShopGoodsCard.module.css";

interface ShopGoodsCardProps {
  item: ShopGoodsCardItem;
}

// 가격 숫자를 천 단위 콤마 문자열로 변환합니다.
function formatPrice(value: number): string {
  // 숫자형이 아니면 기본값 0으로 보정합니다.
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString("ko-KR");
}

// 카드에 표시할 가격 정보를 계산합니다.
function resolvePriceState(item: ShopGoodsCardItem) {
  // 공급가와 판매가 기본값을 안전하게 보정합니다.
  const saleAmt = Number.isFinite(item.saleAmt) ? item.saleAmt : 0;
  const supplyAmt = Number.isFinite(item.supplyAmt) ? item.supplyAmt ?? 0 : 0;
  const showSupplyStrike = supplyAmt > saleAmt;

  return {
    saleAmt,
    supplyAmt,
    showSupplyStrike,
  };
}

// 공통 상품 카드 UI를 렌더링합니다.
export default function ShopGoodsCard({ item }: ShopGoodsCardProps) {
  // 카드 썸네일 표시 여부와 가격 표시 상태를 계산합니다.
  const hasImage = typeof item.imgUrl === "string" && item.imgUrl.trim().length > 0;
  const imageUrl = hasImage ? item.imgUrl!.trim() : "";
  const priceState = resolvePriceState(item);

  return (
    <article className={styles.productCard}>
      <div className={styles.productThumbWrap}>
        {hasImage ? (
          <img className={styles.productThumb} src={imageUrl} alt={item.goodsNm ?? "상품 이미지"} loading="lazy" />
        ) : (
          <div className={styles.productPlaceholder}>이미지 준비중</div>
        )}
      </div>

      <div className={styles.productBrand}>{item.brandNm || "브랜드"}</div>
      <div className={styles.productName}>{item.goodsNm || "상품명 준비중"}</div>

      {priceState.showSupplyStrike ? (
        <div className={styles.priceRow}>
          <span className={styles.salePrice}>{formatPrice(priceState.saleAmt)}원</span>
          <span className={styles.supplyPrice}>{formatPrice(priceState.supplyAmt)}원</span>
        </div>
      ) : (
        <div className={styles.priceRow}>
          <span className={styles.salePrice}>{formatPrice(priceState.saleAmt)}원</span>
        </div>
      )}
    </article>
  );
}
