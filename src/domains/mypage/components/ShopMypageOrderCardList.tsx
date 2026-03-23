"use client";

import Image from "next/image";
import Link from "next/link";
import type { ShopMypageOrderGroup } from "@/domains/mypage/types";
import {
  buildShopMypageOrderDetailHref,
  formatShopMypageOrderCount,
  formatShopMypageOrderDateLabel,
  formatShopMypageOrderPrice,
  resolveShopMypageOrderActionLabelList,
  resolveShopMypageOrderActionHref,
  resolveShopMypageOrderDetailAmount,
} from "@/domains/mypage/utils/shopMypageOrder";
import styles from "./ShopMypageOrderSection.module.css";

interface ShopMypageOrderCardListProps {
  orderList: ShopMypageOrderGroup[];
  emptyMessage?: string;
  enableOrderDetailLink?: boolean;
}

// 링크가 없는 주문 액션 버튼에 placeholder alert를 노출합니다.
function showPreparingAlert(): void {
  window.alert("준비중입니다.");
}

// 주문 카드 목록 공통 UI를 렌더링합니다.
export default function ShopMypageOrderCardList({
  orderList,
  emptyMessage = "조회된 주문내역이 없습니다.",
  enableOrderDetailLink = true,
}: ShopMypageOrderCardListProps) {
  // 빈 주문 목록이면 공통 empty 상태를 반환합니다.
  if (orderList.length === 0) {
    return <div className={styles.emptyState}>{emptyMessage}</div>;
  }

  return (
    <div className={styles.orderList}>
      {orderList.map((orderGroup) => (
        <article key={orderGroup.ordNo} className={styles.orderCard}>
          <header className={styles.orderCardHeader}>
            {enableOrderDetailLink ? (
              <Link className={styles.orderNumberButton} href={buildShopMypageOrderDetailHref(orderGroup.ordNo)}>
                주문번호 {orderGroup.ordNo}
              </Link>
            ) : (
              <button type="button" className={styles.orderNumberButton} onClick={showPreparingAlert}>
                주문번호 {orderGroup.ordNo}
              </button>
            )}
            <p className={styles.orderDateLabel}>{formatShopMypageOrderDateLabel(orderGroup.orderDt)}</p>
          </header>

          <ul className={styles.detailList}>
            {orderGroup.detailList.map((detailItem) => {
              const actionLabelList = resolveShopMypageOrderActionLabelList(detailItem.ordDtlStatCd);
              return (
                <li key={`${detailItem.ordNo}-${detailItem.ordDtlNo}`} className={styles.detailRow}>
                  <div className={styles.thumbnailWrap}>
                    {detailItem.imgUrl.trim() !== "" ? (
                      <Image
                        src={detailItem.imgUrl}
                        alt={detailItem.goodsNm}
                        fill
                        sizes="104px"
                        className={styles.thumbnailImage}
                      />
                    ) : (
                      <span className={styles.thumbnailFallback}>이미지 없음</span>
                    )}
                  </div>

                  <div className={styles.detailContent}>
                    <p className={styles.goodsName}>{detailItem.goodsNm}</p>
                    <div className={styles.metaGrid}>
                      <div className={styles.metaInfoRow}>
                        <div className={styles.metaInfoItem}>
                          <span className={styles.metaLabel}>사이즈</span>
                          <span className={styles.metaValue}>{detailItem.sizeId || "-"}</span>
                        </div>
                        <div className={styles.metaInfoItem}>
                          <span className={styles.metaLabel}>주문상태</span>
                          <span className={styles.metaValue}>{detailItem.ordDtlStatNm || "-"}</span>
                        </div>
                      </div>
                      <div className={styles.metaInfoRow}>
                        <div className={styles.metaInfoItem}>
                          <span className={styles.metaLabel}>주문수량</span>
                          <span className={styles.metaValue}>{formatShopMypageOrderCount(detailItem.ordQty)}개</span>
                        </div>
                        <div className={styles.metaInfoItem}>
                          <span className={styles.metaLabel}>주문금액</span>
                          <span className={`${styles.metaValue} ${styles.metaValueStrong}`}>
                            {formatShopMypageOrderPrice(resolveShopMypageOrderDetailAmount(detailItem))}원
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.actionArea}>
                    {actionLabelList.length > 0 ? (
                      actionLabelList.map((actionLabel) => {
                        const actionHref = resolveShopMypageOrderActionHref(
                          detailItem.ordNo,
                          detailItem.ordDtlNo,
                          actionLabel,
                        );
                        if (actionHref) {
                          return (
                            <Link
                              key={`${detailItem.ordNo}-${detailItem.ordDtlNo}-${actionLabel}`}
                              href={actionHref}
                              className={styles.actionButton}
                            >
                              {actionLabel}
                            </Link>
                          );
                        }
                        return (
                          <button
                            key={`${detailItem.ordNo}-${detailItem.ordDtlNo}-${actionLabel}`}
                            type="button"
                            className={styles.actionButton}
                            onClick={showPreparingAlert}
                          >
                            {actionLabel}
                          </button>
                        );
                      })
                    ) : (
                      <span className={styles.noActionLabel}>-</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      ))}
    </div>
  );
}
