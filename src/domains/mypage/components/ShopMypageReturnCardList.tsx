"use client";

import Image from "next/image";
import Link from "next/link";
import type { ShopMypageReturnHistoryItem } from "@/domains/mypage/types";
import { formatShopMypageOrderCount, formatShopMypageOrderPrice } from "@/domains/mypage/utils/shopMypageOrder";
import styles from "./ShopMypageCancelSection.module.css";

interface ShopMypageReturnCardListProps {
  returnList: ShopMypageReturnHistoryItem[];
}

// 반품상세 페이지 경로를 생성합니다.
function buildReturnDetailHref(clmNo: string): string {
  return `/mypage/return/${clmNo}`;
}

// 반품 신청일시 문자열을 카드 헤더용 날짜 문구로 변환합니다.
function formatReturnClaimDateLabel(chgDt: string): string {
  const trimmedChangedDate = chgDt.trim();
  if (trimmedChangedDate === "") {
    return "-";
  }

  // 일시 문자열에서 날짜 부분만 추출해 한글 날짜 형식으로 변환합니다.
  const [datePart] = trimmedChangedDate.split(" ");
  const [year = "", month = "", day = ""] = datePart.split("-");
  if (year !== "" && month !== "" && day !== "") {
    return `${year}년 ${month}월 ${day}일`;
  }
  return trimmedChangedDate;
}

// 반품 상품의 표시 금액을 계산합니다.
function resolveReturnDetailAmount(saleAmt: number, addAmt: number, qty: number): number {
  return (saleAmt + addAmt) * qty;
}

// 반품내역 카드 목록을 렌더링합니다.
export default function ShopMypageReturnCardList({ returnList }: ShopMypageReturnCardListProps) {
  // 빈 목록이면 empty 상태를 반환합니다.
  if (returnList.length === 0) {
    return <div className={styles.emptyState}>조회된 반품내역이 없습니다.</div>;
  }

  return (
    <div className={styles.cancelList}>
      {returnList.map((returnItem) => (
        <article key={returnItem.clmNo} className={styles.cancelCard}>
          {/* 헤더: 왼쪽에 주문번호(링크)+클레임번호, 오른쪽에 반품신청일 */} 
          <header className={styles.cancelCardHeader}>
            <Link className={styles.cancelCardHeaderLeft} href={buildReturnDetailHref(returnItem.clmNo)}>
              <p className={styles.cancelOrderNo}>주문번호 {returnItem.ordNo}</p>
              <p className={styles.cancelClaimNo}>클레임번호: {returnItem.clmNo}</p>
            </Link>
            <p className={styles.cancelDateLabel}>{formatReturnClaimDateLabel(returnItem.chgDt)}</p>
          </header>

          <ul className={styles.detailList}>
            {returnItem.detailList.map((detailItem) => (
              <li key={`${returnItem.clmNo}-${detailItem.ordDtlNo}`} className={styles.detailRow}>
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
                    {/* 주문내역과 동일한 2행 2열 메타 그리드에 반품 정보를 표시합니다. */}
                    <div className={styles.metaInfoRow}>
                      <div className={styles.metaInfoItem}>
                        <span className={styles.metaLabel}>사이즈</span>
                        <span className={styles.metaValue}>{detailItem.sizeId || "-"}</span>
                      </div>
                      <div className={styles.metaInfoItem}>
                        <span className={styles.metaLabel}>반품상태</span>
                        <span className={styles.metaValue}>{detailItem.chgDtlStatNm || "-"}</span>
                      </div>
                    </div>
                    <div className={styles.metaInfoRow}>
                      <div className={styles.metaInfoItem}>
                        <span className={styles.metaLabel}>반품수량</span>
                        <span className={styles.metaValue}>{formatShopMypageOrderCount(detailItem.qty)}개</span>
                      </div>
                      <div className={styles.metaInfoItem}>
                        <span className={styles.metaLabel}>상품금액</span>
                        <span className={`${styles.metaValue} ${styles.metaValueStrong}`}>
                          {formatShopMypageOrderPrice(resolveReturnDetailAmount(detailItem.saleAmt, detailItem.addAmt, detailItem.qty))}원
                        </span>
                      </div>
                    </div>

                    {/* 반품 사유 박스 */} 
                    {detailItem.chgReasonNm.trim() !== "" ? (
                      <div className={styles.cancelReasonBox}>
                        <p className={styles.cancelReasonTitle}>반품 사유</p>
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
        </article>
      ))}
    </div>
  );
}
