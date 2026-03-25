import Image from "next/image";
import Link from "next/link";
import type { ShopGoodsCardItem } from "@/shared/types/shopGoods";
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

// 카드에 표시할 기본/보조 이미지 상태를 계산합니다.
function resolveImageState(item: ShopGoodsCardItem) {
  // 기본 이미지와 보조 이미지 URL을 안전하게 정규화합니다.
  const imgUrl = typeof item.imgUrl === "string" ? item.imgUrl.trim() : "";
  const secondaryImgUrl = typeof item.secondaryImgUrl === "string" ? item.secondaryImgUrl.trim() : "";

  return {
    hasPrimaryImage: imgUrl.length > 0,
    hasSecondaryImage: secondaryImgUrl.length > 0,
    primaryImageUrl: imgUrl,
    secondaryImageUrl: secondaryImgUrl,
  };
}

// 상품상세 화면 이동 링크를 생성합니다.
function buildGoodsDetailHref(item: Pick<ShopGoodsCardItem, "goodsId" | "exhibitionNo">): string {
  // 상품코드와 선택적 기획전 번호를 쿼리스트링으로 구성합니다.
  const queryParams = new URLSearchParams();
  queryParams.set("goodsId", item.goodsId);
  if (Number.isInteger(item.exhibitionNo) && (item.exhibitionNo ?? 0) > 0) {
    queryParams.set("exhibitionNo", String(item.exhibitionNo));
  }
  return `/goods?${queryParams.toString()}`;
}

// 공통 상품 카드 UI를 렌더링합니다.
export default function ShopGoodsCard({ item }: ShopGoodsCardProps) {
  // 카드 썸네일 표시 여부와 가격 표시 상태를 계산합니다.
  const imageState = resolveImageState(item);
  const priceState = resolvePriceState(item);

  return (
    <article className={`${styles.productCard} ${imageState.hasSecondaryImage ? styles.productCardHoverable : ""}`}>
      <Link className={styles.productLink} href={buildGoodsDetailHref(item)}>
        <div className={styles.productThumbWrap}>
          {imageState.hasPrimaryImage ? (
            <div className={styles.productThumbInner}>
              <Image
                className={`${styles.productThumb} ${styles.productThumbFront}`}
                src={imageState.primaryImageUrl}
                alt={item.goodsNm ?? "상품 이미지"}
                fill
                sizes="256px"
              />
              {imageState.hasSecondaryImage ? (
                <Image
                  className={`${styles.productThumb} ${styles.productThumbBack}`}
                  src={imageState.secondaryImageUrl}
                  alt={item.goodsNm ?? "상품 이미지"}
                  fill
                  sizes="256px"
                />
              ) : null}
            </div>
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
      </Link>
    </article>
  );
}
