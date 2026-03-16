"use client";

import { useEffect } from "react";
import type { MouseEvent } from "react";
import type { ShopGoodsCoupon } from "@/domains/goods/types";
import styles from "./ShopGoodsCouponDownloadLayer.module.css";

interface ShopGoodsCouponDownloadLayerProps {
  couponList: ShopGoodsCoupon[];
  downloadingCouponNo: number | null;
  isDownloadAllSubmitting: boolean;
  onDownload: (couponItem: ShopGoodsCoupon) => void;
  onDownloadAll: () => void;
  onClose: () => void;
}

const CPN_DC_GB_AMOUNT = "CPN_DC_GB_01";
const CPN_USE_DT_PERIOD = "CPN_USE_DT_01";
const CPN_USE_DT_DATETIME = "CPN_USE_DT_02";

// 숫자를 천 단위 콤마 문자열로 변환합니다.
function formatNumber(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(Math.floor(value), 0) : 0;
  return safeValue.toLocaleString("ko-KR");
}

// ISO 또는 날짜 문자열을 화면 표시용 일시 문자열로 변환합니다.
function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value.replace("T", " ").slice(0, 16);
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const hour = String(parsedDate.getHours()).padStart(2, "0");
  const minute = String(parsedDate.getMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hour}:${minute}`;
}

// 시작/종료 일시를 기간 문자열로 변환합니다.
function formatDateRange(startDateTime: string | null, endDateTime: string | null): string {
  const startLabel = formatDateTime(startDateTime);
  const endLabel = formatDateTime(endDateTime);
  if (startLabel === "-" && endLabel === "-") {
    return "기간 정보 없음";
  }
  if (startLabel === "-") {
    return `~ ${endLabel}`;
  }
  if (endLabel === "-") {
    return `${startLabel} ~`;
  }
  return `${startLabel} ~ ${endLabel}`;
}

// 할인 구분/값을 쿠폰 카드 메인 할인 문구로 변환합니다.
function formatCouponDiscountLabel(cpnDcGbCd: string, cpnDcVal: number): string {
  const safeDiscountValue = Number.isFinite(cpnDcVal) ? Math.max(Math.floor(cpnDcVal), 0) : 0;
  if (CPN_DC_GB_AMOUNT === cpnDcGbCd) {
    return `${formatNumber(safeDiscountValue)}원`;
  }
  return `${formatNumber(safeDiscountValue)}%`;
}

// 다운로드 가능 쿠폰의 사용 기간 안내 문구를 생성합니다.
function formatCouponUseGuide(couponItem: ShopGoodsCoupon): string {
  if (couponItem.cpnUseDtGb === CPN_USE_DT_PERIOD) {
    if (couponItem.cpnUsableDt && couponItem.cpnUsableDt > 0) {
      return `발급 후 ${formatNumber(couponItem.cpnUsableDt)}일 이내 사용`;
    }
    return "발급 후 사용 기간 정보 없음";
  }

  if (couponItem.cpnUseDtGb === CPN_USE_DT_DATETIME) {
    return formatDateRange(couponItem.cpnUseStartDt, couponItem.cpnUseEndDt);
  }

  return "사용 기간 정보 없음";
}

// 공통 레이어 오버레이 바깥 영역 클릭 여부를 판정합니다.
function isOverlayClick(event: MouseEvent<HTMLDivElement>): boolean {
  return event.target === event.currentTarget;
}

// 상품상세 상품쿠폰 다운로드 레이어팝업을 렌더링합니다.
export default function ShopGoodsCouponDownloadLayer({
  couponList,
  downloadingCouponNo,
  isDownloadAllSubmitting,
  onDownload,
  onDownloadAll,
  onClose,
}: ShopGoodsCouponDownloadLayerProps) {
  // 팝업이 열린 동안 배경 스크롤을 잠그고 ESC 키 닫기를 처리합니다.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleDocumentKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [onClose]);

  // 오버레이 바깥 영역 클릭 시 팝업을 닫습니다.
  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>): void => {
    if (!isOverlayClick(event)) {
      return;
    }
    onClose();
  };

  // 전체 다운로드 버튼 비활성화 여부를 계산합니다.
  const isDownloadAllDisabled = couponList.length === 0 || downloadingCouponNo !== null || isDownloadAllSubmitting;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="상품쿠폰 다운로드" onClick={handleOverlayClick}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerActionRow}>
            <button type="button" className={styles.downloadAllButton} disabled={isDownloadAllDisabled} onClick={onDownloadAll}>
              {isDownloadAllSubmitting ? "전체 다운로드 중..." : "전체 다운로드"}
            </button>
            <button type="button" className={styles.closeButton} aria-label="쿠폰 팝업 닫기" onClick={onClose}>
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {couponList.length === 0 ? (
            <div className={styles.emptyState}>
              <strong className={styles.emptyTitle}>다운로드 가능한 상품쿠폰이 없습니다.</strong>
              <p className={styles.emptyDescription}>현재 상품에 바로 적용 가능한 상품쿠폰이 생기면 이곳에서 받을 수 있습니다.</p>
            </div>
          ) : (
            <ul className={styles.couponList}>
              {couponList.map((couponItem) => {
                const isDownloading = downloadingCouponNo === couponItem.cpnNo;
                const isAnyDownloading = downloadingCouponNo !== null;

                return (
                  <li key={couponItem.cpnNo} className={styles.couponCard}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{couponItem.cpnNm}</h3>
                      <strong className={styles.discountLabel}>
                        {formatCouponDiscountLabel(couponItem.cpnDcGbCd, couponItem.cpnDcVal)}
                      </strong>
                    </div>

                    <dl className={styles.infoList}>
                      <div className={styles.infoRow}>
                        <dt className={styles.infoLabel}>다운로드 기간</dt>
                        <dd className={styles.infoValue}>{formatDateRange(couponItem.cpnDownStartDt, couponItem.cpnDownEndDt)}</dd>
                      </div>
                      <div className={styles.infoRow}>
                        <dt className={styles.infoLabel}>사용 가능 기간</dt>
                        <dd className={styles.infoValue}>{formatCouponUseGuide(couponItem)}</dd>
                      </div>
                    </dl>

                    <button
                      type="button"
                      className={styles.downloadButton}
                      disabled={isAnyDownloading}
                      onClick={() => onDownload(couponItem)}
                    >
                      {isDownloading ? "다운로드 중..." : "다운로드"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
