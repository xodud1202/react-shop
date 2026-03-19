"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { ShopCartItem, ShopCartPageResponse } from "@/domains/cart/types";
import styles from "./ShopOrderSection.module.css";

interface ShopOrderSummaryAmount {
  totalSupplyAmt: number;
  goodsDiscountAmt: number;
  deliveryFee: number;
  couponDiscountAmt: number;
  pointUseAmt: number;
  finalPayAmt: number;
}

interface ShopOrderSectionProps {
  orderPageData: ShopCartPageResponse;
}

// 가격 숫자를 천 단위 콤마 문자열로 변환합니다.
function formatPrice(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString("ko-KR");
}

// 합계 계산용 숫자값을 0 이상 정수로 보정합니다.
function normalizeNonNegativeNumber(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(Math.floor(value), 0);
}

// 수량 값을 1 이상 정수로 보정합니다.
function normalizeQuantity(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(Math.floor(value), 1);
}

// 주문서 우측 금액 요약을 계산합니다.
function resolveOrderSummaryAmount(cartList: ShopCartItem[], deliveryFee: number, deliveryFeeLimit: number): ShopOrderSummaryAmount {
  const totalSupplyAmt = cartList.reduce((sum, cartItem) => {
    return sum + normalizeNonNegativeNumber(cartItem.supplyAmt) * normalizeQuantity(cartItem.qty);
  }, 0);
  const totalSaleAmt = cartList.reduce((sum, cartItem) => {
    return sum + normalizeNonNegativeNumber(cartItem.saleAmt) * normalizeQuantity(cartItem.qty);
  }, 0);
  const goodsDiscountAmt = Math.max(totalSupplyAmt - totalSaleAmt, 0);
  const resolvedDeliveryFee = totalSaleAmt >= normalizeNonNegativeNumber(deliveryFeeLimit) ? 0 : normalizeNonNegativeNumber(deliveryFee);
  const couponDiscountAmt = 0;
  const pointUseAmt = 0;
  return {
    totalSupplyAmt,
    goodsDiscountAmt,
    deliveryFee: resolvedDeliveryFee,
    couponDiscountAmt,
    pointUseAmt,
    finalPayAmt: Math.max(totalSaleAmt + resolvedDeliveryFee - couponDiscountAmt - pointUseAmt, 0),
  };
}

// 금액을 할인 표기 형식으로 변환합니다.
function formatDiscountPrice(value: number): string {
  const safeValue = normalizeNonNegativeNumber(value);
  if (safeValue < 1) {
    return "0원";
  }
  return `-${formatPrice(safeValue)}원`;
}

// 주문서 섹션 UI를 렌더링합니다.
export default function ShopOrderSection({ orderPageData }: ShopOrderSectionProps) {
  const [agreed, setAgreed] = useState(false);
  const summaryAmount = useMemo(
    () =>
      resolveOrderSummaryAmount(
        orderPageData.cartList,
        orderPageData.siteInfo.deliveryFee,
        orderPageData.siteInfo.deliveryFeeLimit,
      ),
    [orderPageData.cartList, orderPageData.siteInfo.deliveryFee, orderPageData.siteInfo.deliveryFeeLimit],
  );

  // 주문하기 버튼 클릭 시 1차 범위 안내를 노출합니다.
  const handleOrderButtonClick = (): void => {
    if (!agreed) {
      window.alert("구매 동의 후 주문할 수 있습니다.");
      return;
    }
    window.alert("주문 서비스는 준비중입니다.");
  };

  return (
    <section className={styles.orderSection}>
      <div className={styles.orderLayout}>
        <div className={styles.leftPanel}>
          <header className={styles.sectionHeader}>
            <h1 className={styles.sectionTitle}>주문서</h1>
            <p className={styles.sectionCount}>총 {orderPageData.cartCount.toLocaleString("ko-KR")}개</p>
          </header>

          {orderPageData.cartList.length === 0 ? (
            <div className={styles.emptyState}>주문할 상품이 없습니다.</div>
          ) : (
            <ul className={styles.orderItemList}>
              {orderPageData.cartList.map((cartItem) => {
                const rowQty = normalizeQuantity(cartItem.qty);
                const rowSupplyAmt = normalizeNonNegativeNumber(cartItem.supplyAmt) * rowQty;
                const rowSaleAmt = normalizeNonNegativeNumber(cartItem.saleAmt) * rowQty;
                const showDiscount = rowSupplyAmt > rowSaleAmt;
                return (
                  <li key={cartItem.cartId} className={styles.orderItem}>
                    <div className={styles.thumbnailWrap}>
                      {cartItem.imgUrl.trim() !== "" ? (
                        <Image src={cartItem.imgUrl} alt={cartItem.goodsNm} fill sizes="112px" className={styles.thumbnailImage} />
                      ) : (
                        <span className={styles.thumbnailFallback}>이미지 없음</span>
                      )}
                    </div>

                    <div className={styles.itemContent}>
                      <p className={styles.brandName}>{cartItem.brandNm || "브랜드"}</p>
                      <p className={styles.goodsName}>{cartItem.goodsNm}</p>
                      <dl className={styles.metaList}>
                        <div className={styles.metaRow}>
                          <dt>선택 사이즈</dt>
                          <dd>{cartItem.sizeId}</dd>
                        </div>
                        <div className={styles.metaRow}>
                          <dt>수량</dt>
                          <dd>{rowQty}개</dd>
                        </div>
                      </dl>
                    </div>

                    <div className={styles.priceColumn}>
                      {showDiscount ? (
                        <>
                          <p className={styles.supplyPriceText}>{formatPrice(rowSupplyAmt)}원</p>
                          <p className={styles.salePriceText}>{formatPrice(rowSaleAmt)}원</p>
                        </>
                      ) : (
                        <p className={styles.salePriceText}>{formatPrice(rowSaleAmt)}원</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className={styles.rightPanel}>
          <h2 className={styles.summaryTitle}>결제 정보</h2>
          <dl className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <dt>총 상품금액</dt>
              <dd>{formatPrice(summaryAmount.totalSupplyAmt)}원</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>상품 할인금액</dt>
              <dd>{formatDiscountPrice(summaryAmount.goodsDiscountAmt)}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>배송비</dt>
              <dd>{summaryAmount.deliveryFee < 1 ? "0원" : `${formatPrice(summaryAmount.deliveryFee)}원`}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>쿠폰 할인금액</dt>
              <dd>{formatDiscountPrice(summaryAmount.couponDiscountAmt)}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>포인트 사용금액</dt>
              <dd>{formatDiscountPrice(summaryAmount.pointUseAmt)}</dd>
            </div>
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <dt>최종 결제금액</dt>
              <dd>{formatPrice(summaryAmount.finalPayAmt)}원</dd>
            </div>
          </dl>

          <label className={styles.agreeLabel}>
            <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
            <span>(필수) 주문할 상품의 상품명, 상품가격, 배송정보를 확인하였으며, 구매에 동의 하시겠습니까? (전자상거래법 제 8조 제 2항)</span>
          </label>

          <p className={styles.noticeText}>
            일부 특가 상품들은 주문이 폭주하여 품절될 소지가 있으며 해당 상품은 자동 주문취소 및 환불이 진행됩니다. 교환 신청시 재고 부족으로 인해 반품 및 환불로 진행될 수 있는 점 안내드립니다.
          </p>

          <button
            type="button"
            className={styles.orderButton}
            onClick={handleOrderButtonClick}
            disabled={!agreed || orderPageData.cartList.length === 0}
          >
            주문하기
          </button>
        </aside>
      </div>
    </section>
  );
}
