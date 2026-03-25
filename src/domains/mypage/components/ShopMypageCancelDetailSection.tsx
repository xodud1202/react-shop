"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ShopMypageCancelDetailPageResponse, ShopMypageCancelHistoryDetailItem } from "@/domains/mypage/types";
import {
  formatShopMypageOrderCount,
  formatShopMypageOrderDateLabel,
  formatShopMypageOrderPrice,
} from "@/domains/mypage/utils/shopMypageOrder";
import type { ShopMypageOrderAmountTableColumn } from "./ShopMypageOrderAmountTable";
import ShopMypageOrderAmountTable from "./ShopMypageOrderAmountTable";
import styles from "./ShopMypageCancelSection.module.css";

interface ShopMypageCancelDetailSectionProps {
  cancelDetailPageData: ShopMypageCancelDetailPageResponse;
}

// 취소 상품 상세 목록의 상품 합계 금액을 계산합니다.
function resolveCancelGoodsTotal(detailList: ShopMypageCancelHistoryDetailItem[]): number {
  return detailList.reduce((sum, item) => sum + (item.saleAmt + item.addAmt) * item.qty, 0);
}

// 취소 상품의 개별 최종 금액(판매가 + 추가금)을 계산합니다.
function resolveCancelDetailAmount(saleAmt: number, addAmt: number): number {
  return saleAmt + addAmt;
}

// 환불 금액 테이블 컬럼을 구성합니다.
function createCancelAmountColumnList(
  goodsTotal: number,
  payDelvAmt: number,
  refundedCashAmt: number,
): ShopMypageOrderAmountTableColumn[] {
  const itemList: ShopMypageOrderAmountTableColumn["itemList"] = [
    {
      key: "goodsTotal",
      label: "취소 상품 합계",
      valueText: `${formatShopMypageOrderPrice(goodsTotal)}원`,
    },
  ];

  // 배송비 조정이 있는 경우에만 표시합니다.
  if (payDelvAmt !== 0) {
    itemList.push({
      key: "payDelvAmt",
      label: "배송비 조정",
      valueText: `${formatShopMypageOrderPrice(payDelvAmt)}원`,
    });
  }

  itemList.push({
    key: "refundedCashAmt",
    label: "환불금액",
    valueText: `${formatShopMypageOrderPrice(refundedCashAmt)}원`,
    isStrong: true,
  });

  return [
    {
      key: "refundAmount",
      title: "환불 금액",
      itemList,
    },
  ];
}

// 마이페이지 취소상세 화면을 렌더링합니다.
export default function ShopMypageCancelDetailSection({ cancelDetailPageData }: ShopMypageCancelDetailSectionProps) {
  const router = useRouter();
  const { cancelItem } = cancelDetailPageData;

  // 취소 정보가 없으면 빈 화면을 반환합니다.
  if (!cancelItem) {
    return null;
  }

  // 환불 금액 테이블 컬럼을 구성합니다.
  const goodsTotal = resolveCancelGoodsTotal(cancelItem.detailList);
  const amountColumnList = createCancelAmountColumnList(goodsTotal, cancelItem.payDelvAmt, cancelItem.refundedCashAmt);

  return (
    <section className={styles.cancelDetailSection}>
      {/* 페이지 헤더 */}
      <header className={styles.cancelDetailHeader}>
        <div>
          <h1 className={styles.cancelDetailTitle}>취소상세</h1>
        </div>
      </header>

      {/* 주문번호 / 클레임번호 / 취소일시 메타 행 */}
      <div className={styles.cancelDetailMetaRow}>
        <div className={styles.cancelDetailMetaLeft}>
          <p className={styles.cancelDetailMetaOrdNo}>주문번호 {cancelItem.ordNo}</p>
          <p className={styles.cancelDetailMetaClmNo}>클레임번호: {cancelItem.clmNo}</p>
        </div>
        <p className={styles.cancelDetailMetaDate}>취소일시 {cancelItem.chgDt ? formatShopMypageOrderDateLabel(cancelItem.chgDt) : "-"}</p>
      </div>

      {/* 취소 상품 목록 */}
      <section className={styles.cancelDetailSectionBlock}>
        <h2 className={styles.cancelDetailSectionTitle}>취소 상품</h2>
        <ul className={styles.cancelDetailItemList}>
          {cancelItem.detailList.map((detailItem) => (
            <li key={`${cancelItem.clmNo}-${detailItem.ordDtlNo}`} className={styles.cancelDetailItemRow}>
              {/* 썸네일 */}
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

              {/* 상품 정보 */}
              <div className={styles.detailContent}>
                <p className={styles.goodsName}>{detailItem.goodsNm}</p>
                <div className={styles.metaGrid}>
                  {/* 사이즈 / 취소상태 */}
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
                  {/* 취소수량 / 취소금액 */}
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
      </section>

      {/* 환불 금액 */}
      <section className={styles.cancelDetailSectionBlock}>
        <h2 className={styles.cancelDetailSectionTitle}>환불 금액</h2>
        <ShopMypageOrderAmountTable columnList={amountColumnList} />
      </section>

      {/* 환불 소요 안내 문구 */}
      <div className={styles.cancelNoticeBox}>
        <span className={styles.cancelNoticeIcon}>ℹ</span>
        <p className={styles.cancelNoticeText}>취소완료 후 실제 환불까지 영업일 3~4일이 소요될 수 있습니다.</p>
      </div>

      {/* 목록 버튼 (뒤로가기) */}
      <div className={styles.cancelDetailActionBar}>
        <button
          type="button"
          className={styles.cancelDetailBackButton}
          onClick={() => router.back()}
        >
          목록
        </button>
      </div>
    </section>
  );
}
