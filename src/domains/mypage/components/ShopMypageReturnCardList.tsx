"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ShopMypageReturnHistoryItem } from "@/domains/mypage/types";
import { formatShopMypageOrderCount, formatShopMypageOrderPrice } from "@/domains/mypage/utils/shopMypageOrder";
import {
  isShopMypageReturnHistoryWithdrawable,
  requestShopMypageOrderReturnWithdraw,
  resolveShopMypageOrderReturnWithdrawSuccessMessage,
} from "@/domains/mypage/utils/shopMypageOrderReturnWithdraw";
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
  const router = useRouter();
  const [processingActionKey, setProcessingActionKey] = useState<string>("");

  // 빈 목록이면 empty 상태를 반환합니다.
  if (returnList.length === 0) {
    return <div className={styles.emptyState}>조회된 반품내역이 없습니다.</div>;
  }

  // 반품내역 상품 기준 반품 철회 액션을 호출하고 현재 화면을 새로고침합니다.
  const handleReturnWithdrawAction = async (ordNo: string, clmNo: string, ordDtlNo: number): Promise<void> => {
    const actionKey = `${clmNo}-${ordDtlNo}-반품 철회`;

    // 동일 액션 중복 클릭을 막고 서버 검증 결과를 사용자에게 즉시 노출합니다.
    setProcessingActionKey(actionKey);
    try {
      const result = await requestShopMypageOrderReturnWithdraw(ordNo, ordDtlNo);
      if (!result.ok || !result.data) {
        window.alert(result.message || "반품 철회 처리에 실패했습니다.");
        return;
      }

      window.alert(resolveShopMypageOrderReturnWithdrawSuccessMessage());
      router.refresh();
    } catch {
      window.alert("반품 철회 처리에 실패했습니다.");
    } finally {
      setProcessingActionKey("");
    }
  };

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
            {returnItem.detailList.map((detailItem) => {
              const actionKey = `${returnItem.clmNo}-${detailItem.ordDtlNo}-반품 철회`;
              const isProcessingAction = processingActionKey === actionKey;
              const withdrawableYn = isShopMypageReturnHistoryWithdrawable(detailItem);
              return (
                <li
                  key={`${returnItem.clmNo}-${detailItem.ordDtlNo}`}
                  className={`${styles.detailRow} ${styles.withdrawableDetailRow}`}
                >
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

                  <div className={styles.actionArea}>
                    {withdrawableYn ? (
                      <button
                        type="button"
                        className={styles.actionButton}
                        disabled={processingActionKey !== ""}
                        onClick={() => {
                          void handleReturnWithdrawAction(returnItem.ordNo, returnItem.clmNo, detailItem.ordDtlNo);
                        }}
                      >
                        {isProcessingAction ? "반품 철회 처리중..." : "반품 철회"}
                      </button>
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
