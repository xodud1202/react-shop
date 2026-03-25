"use client";

import Image from "next/image";
import Link from "next/link";
import type { ShopMypageCancelHistoryItem } from "@/domains/mypage/types";
import {
  formatShopMypageOrderCount,
  formatShopMypageOrderDateLabel,
  formatShopMypageOrderPrice,
} from "@/domains/mypage/utils/shopMypageOrder";
import styles from "./ShopMypageCancelSection.module.css";

interface ShopMypageCancelCardListProps {
  cancelList: ShopMypageCancelHistoryItem[];
}

// 취소상세 페이지 경로를 생성합니다.
function buildCancelDetailHref(clmNo: string): string {
  return `/mypage/cancel/${clmNo}`;
}

// 취소 상품의 최종 금액(판매가 + 추가금)을 계산합니다.
function resolveCancelDetailAmount(saleAmt: number, addAmt: number): number {
  return saleAmt + addAmt;
}

// 취소내역 카드 목록을 렌더링합니다.
export default function ShopMypageCancelCardList({ cancelList }: ShopMypageCancelCardListProps) {
  // 빈 목록이면 empty 상태를 반환합니다.
  if (cancelList.length === 0) {
    return <div className={styles.emptyState}>조회된 취소내역이 없습니다.</div>;
  }

  return (
    <div className={styles.cancelList}>
      {cancelList.map((cancelItem) => (
        <article key={cancelItem.clmNo} className={styles.cancelCard}>
          {/* 헤더: 왼쪽에 주문번호(링크)+클레임번호, 오른쪽에 취소신청일 */}
          <header className={styles.cancelCardHeader}>
            <Link className={styles.cancelCardHeaderLeft} href={buildCancelDetailHref(cancelItem.clmNo)}>
              <p className={styles.cancelOrderNo}>주문번호 {cancelItem.ordNo}</p>
              <p className={styles.cancelClaimNo}>클레임번호: {cancelItem.clmNo}</p>
            </Link>
            <p className={styles.cancelDateLabel}>{formatShopMypageOrderDateLabel(cancelItem.chgDt)}</p>
          </header>

          <ul className={styles.detailList}>
            {cancelItem.detailList.map((detailItem) => (
              <li key={`${cancelItem.clmNo}-${detailItem.ordDtlNo}`} className={styles.detailRow}>
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
                    {/* 주문내역과 동일한 2행 2열 메타 그리드 */}
                    <div className={styles.metaInfoRow}>
                      <div className={styles.metaInfoItem}>
                        <span className={styles.metaLabel}>사이즈</span>
                        <span className={styles.metaValue}>{detailItem.sizeId || "-"}</span>
                      </div>
                      <div className={styles.metaInfoItem}>
                        <span className={styles.metaLabel}>취소상태</span>
                        <span className={styles.metaValue}>{cancelItem.chgStatNm || "-"}</span>
                      </div>
                    </div>
                    <div className={styles.metaInfoRow}>
                      <div className={styles.metaInfoItem}>
                        <span className={styles.metaLabel}>취소수량</span>
                        <span className={styles.metaValue}>{formatShopMypageOrderCount(detailItem.qty)}개</span>
                      </div>
                      <div className={styles.metaInfoItem}>
                        <span className={styles.metaLabel}>취소금액</span>
                        <span className={`${styles.metaValue} ${styles.metaValueStrong}`}>
                          {formatShopMypageOrderPrice(resolveCancelDetailAmount(detailItem.saleAmt, detailItem.addAmt))}원
                        </span>
                      </div>
                    </div>

                    {/* 취소 사유 박스 */}
                    {detailItem.chgReasonNm.trim() !== "" ? (
                      <div className={styles.cancelReasonBox}>
                        <p className={styles.cancelReasonTitle}>취소 사유</p>
                        <p className={styles.cancelReasonText}>
                          {detailItem.chgReasonNm}
                          {detailItem.chgReasonDtl.trim() !== "" ? ` · ${detailItem.chgReasonDtl}` : ""}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <footer className={styles.cancelCardFooter}>
            <span className={styles.refundLabel}>환불 금액</span>
            <span className={styles.refundAmount}>{formatShopMypageOrderPrice(cancelItem.refundedCashAmt)}원</span>
          </footer>
        </article>
      ))}
    </div>
  );
}
