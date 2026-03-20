"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ShopMypageOrderDetailItem,
  ShopMypageOrderPageResponse,
  ShopMypageOrderStatusSummary,
} from "@/domains/mypage/types";
import styles from "./ShopMypageOrderSection.module.css";

type ShopMypageOrderRange = "1m" | "3m" | "6m" | "custom";

interface ShopMypageOrderSectionProps {
  orderPageData: ShopMypageOrderPageResponse;
  initialRange: ShopMypageOrderRange;
}

interface ShopMypageOrderPaginationState {
  currentPageNo: number;
  totalPageCount: number;
  pageNoList: number[];
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPageNo: number;
  nextPageNo: number;
  hasPrevBlock: boolean;
  hasNextBlock: boolean;
  prevBlockPageNo: number;
  nextBlockPageNo: number;
}

interface ShopMypageOrderStatusCard {
  key: string;
  label: string;
  iconClassName: string;
  count: number;
}

// 금액 숫자를 천 단위 콤마 문자열로 변환합니다.
function formatPrice(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(Math.floor(value), 0) : 0;
  return safeValue.toLocaleString("ko-KR");
}

// 건수 숫자를 천 단위 콤마 문자열로 변환합니다.
function formatCount(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(Math.floor(value), 0) : 0;
  return safeValue.toLocaleString("ko-KR");
}

// 주문상세 행 기준 주문금액을 계산합니다.
function resolveOrderDetailAmount(detailItem: ShopMypageOrderDetailItem): number {
  const saleAmt = Number.isFinite(detailItem.saleAmt) ? Math.max(Math.floor(detailItem.saleAmt), 0) : 0;
  const addAmt = Number.isFinite(detailItem.addAmt) ? Math.max(Math.floor(detailItem.addAmt), 0) : 0;
  const ordQty = Number.isFinite(detailItem.ordQty) ? Math.max(Math.floor(detailItem.ordQty), 0) : 0;
  return (saleAmt + addAmt) * ordQty;
}

// 시작/종료 페이지 번호 구간 배열을 생성합니다.
function createPageNumberRange(startPageNo: number, endPageNo: number): number[] {
  const result: number[] = [];
  for (let page = startPageNo; page <= endPageNo; page += 1) {
    result.push(page);
  }
  return result;
}

// 현재 페이지 기준 페이지네이션 상태를 계산합니다.
function resolvePaginationState(pageNo: number, totalPageCount: number): ShopMypageOrderPaginationState {
  const safeTotalPageCount = Number.isFinite(totalPageCount) && totalPageCount > 0 ? Math.floor(totalPageCount) : 0;
  const safeCurrentPageNo =
    safeTotalPageCount === 0
      ? 1
      : Math.min(Math.max(Number.isFinite(pageNo) ? Math.floor(pageNo) : 1, 1), safeTotalPageCount);
  const blockStartPageNo = Math.floor((safeCurrentPageNo - 1) / 10) * 10 + 1;
  const blockEndPageNo = Math.min(blockStartPageNo + 9, safeTotalPageCount);
  const pageNoList = safeTotalPageCount === 0 ? [] : createPageNumberRange(blockStartPageNo, blockEndPageNo);
  const hasPrevPage = safeCurrentPageNo > 1;
  const hasNextPage = safeCurrentPageNo < safeTotalPageCount;
  const hasPrevBlock = blockStartPageNo > 1;
  const hasNextBlock = blockEndPageNo < safeTotalPageCount;

  return {
    currentPageNo: safeCurrentPageNo,
    totalPageCount: safeTotalPageCount,
    pageNoList,
    hasPrevPage,
    hasNextPage,
    prevPageNo: hasPrevPage ? safeCurrentPageNo - 1 : 1,
    nextPageNo: hasNextPage ? safeCurrentPageNo + 1 : safeTotalPageCount,
    hasPrevBlock,
    hasNextBlock,
    prevBlockPageNo: hasPrevBlock ? Math.max(blockStartPageNo - 10, 1) : 1,
    nextBlockPageNo: hasNextBlock ? blockEndPageNo + 1 : safeTotalPageCount,
  };
}

// Date 값을 YYYY-MM-DD 문자열로 변환합니다.
function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 주문일시 문자열을 주문 카드 헤더 노출용 한글 날짜 문구로 변환합니다.
function formatOrderDateLabel(orderDt: string): string {
  const trimmedOrderDt = orderDt.trim();
  if (trimmedOrderDt === "") {
    return "주문: -";
  }

  // 주문일시에서 날짜 부분만 추출해 YYYY년 MM월 DD일 형식으로 변환합니다.
  const [datePart] = trimmedOrderDt.split(" ");
  const [year = "", month = "", day = ""] = datePart.split("-");
  if (year !== "" && month !== "" && day !== "") {
    return `주문: ${year}년 ${month}월 ${day}일`;
  }
  return `주문: ${trimmedOrderDt}`;
}

// preset 버튼용 시작일/종료일을 계산합니다.
function resolvePresetDateRange(months: 1 | 3 | 6): { startDate: string; endDate: string } {
  const today = new Date();
  const startDate = new Date(today.getTime());
  startDate.setMonth(startDate.getMonth() - months);
  return {
    startDate: formatDateInputValue(startDate),
    endDate: formatDateInputValue(today),
  };
}

// 주문내역 페이지 링크를 생성합니다.
function buildMypageOrderHref(range: ShopMypageOrderRange, startDate: string, endDate: string, pageNo: number): string {
  const queryParams = new URLSearchParams();
  queryParams.set("range", range);
  queryParams.set("startDate", startDate);
  queryParams.set("endDate", endDate);
  queryParams.set("pageNo", String(Math.max(Math.floor(pageNo), 1)));
  return `/mypage/order?${queryParams.toString()}`;
}

// 주문상세 상태코드 기준 우측 액션 버튼 목록을 반환합니다.
function resolveOrderActionLabelList(ordDtlStatCd: string): string[] {
  if (ordDtlStatCd === "ORD_DTL_STAT_01" || ordDtlStatCd === "ORD_DTL_STAT_02") {
    return ["주문 취소", "1:1문의"];
  }
  if (ordDtlStatCd === "ORD_DTL_STAT_03" || ordDtlStatCd === "ORD_DTL_STAT_04") {
    return ["1:1문의"];
  }
  if (ordDtlStatCd === "ORD_DTL_STAT_05") {
    return ["배송완료", "1:1문의"];
  }
  if (ordDtlStatCd === "ORD_DTL_STAT_06") {
    return ["구매확정", "반품신청", "교환신청", "1:1문의"];
  }
  if (ordDtlStatCd === "ORD_DTL_STAT_07") {
    return ["1:1문의"];
  }
  return [];
}

// 상태 요약 응답을 카드 렌더링용 목록으로 변환합니다.
function createOrderStatusCardList(statusSummary: ShopMypageOrderStatusSummary): ShopMypageOrderStatusCard[] {
  return [
    {
      key: "waitingForDeposit",
      label: "입금대기",
      iconClassName: "fa-solid fa-building-columns",
      count: statusSummary.waitingForDepositCount,
    },
    {
      key: "paymentCompleted",
      label: "결제완료",
      iconClassName: "fa-solid fa-credit-card",
      count: statusSummary.paymentCompletedCount,
    },
    {
      key: "productPreparing",
      label: "상품준비중",
      iconClassName: "fa-solid fa-box-open",
      count: statusSummary.productPreparingCount,
    },
    {
      key: "deliveryPreparing",
      label: "배송준비중",
      iconClassName: "fa-solid fa-boxes-stacked",
      count: statusSummary.deliveryPreparingCount,
    },
    {
      key: "shipping",
      label: "배송중",
      iconClassName: "fa-solid fa-truck-fast",
      count: statusSummary.shippingCount,
    },
    {
      key: "deliveryCompleted",
      label: "배송완료",
      iconClassName: "fa-solid fa-house",
      count: statusSummary.deliveryCompletedCount,
    },
    {
      key: "purchaseConfirmed",
      label: "구매확정",
      iconClassName: "fa-solid fa-circle-check",
      count: statusSummary.purchaseConfirmedCount,
    },
  ];
}

// 주문번호/액션 버튼 placeholder alert를 노출합니다.
function showPreparingAlert(): void {
  window.alert("준비중입니다.");
}

// 마이페이지 주문내역 화면을 렌더링합니다.
export default function ShopMypageOrderSection({ orderPageData, initialRange }: ShopMypageOrderSectionProps) {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState<ShopMypageOrderRange>(initialRange);
  const [startDateInputValue, setStartDateInputValue] = useState(orderPageData.startDate);
  const [endDateInputValue, setEndDateInputValue] = useState(orderPageData.endDate);

  // 현재 페이지네이션 상태와 상태 요약 카드 목록을 계산합니다.
  const paginationState = resolvePaginationState(orderPageData.pageNo, orderPageData.totalPageCount);
  const orderStatusCardList = createOrderStatusCardList(orderPageData.statusSummary);

  // preset 기간 버튼 클릭 시 해당 기간으로 재조회합니다.
  const handleSelectPresetRange = (range: Exclude<ShopMypageOrderRange, "custom">): void => {
    const monthMap: Record<Exclude<ShopMypageOrderRange, "custom">, 1 | 3 | 6> = {
      "1m": 1,
      "3m": 3,
      "6m": 6,
    };
    const presetDateRange = resolvePresetDateRange(monthMap[range]);
    setSelectedRange(range);
    setStartDateInputValue(presetDateRange.startDate);
    setEndDateInputValue(presetDateRange.endDate);
    router.push(buildMypageOrderHref(range, presetDateRange.startDate, presetDateRange.endDate, 1));
  };

  // custom 기간설정 모드로 전환합니다.
  const handleChangeCustomRange = (): void => {
    setSelectedRange("custom");
  };

  // 검색 버튼 클릭 시 입력된 기간을 검증한 뒤 재조회합니다.
  const handleSearch = (): void => {
    if (startDateInputValue.trim() === "" || endDateInputValue.trim() === "") {
      window.alert("조회 기간을 확인해주세요.");
      return;
    }
    if (startDateInputValue > endDateInputValue) {
      window.alert("조회 기간을 확인해주세요.");
      return;
    }
    router.push(buildMypageOrderHref(selectedRange, startDateInputValue, endDateInputValue, 1));
  };

  return (
    <section className={styles.orderSection}>
      <header className={styles.orderHeader}>
        <div>
          <h1 className={styles.orderTitle}>주문내역</h1>
          <p className={styles.orderDescription}>
            {orderPageData.startDate} ~ {orderPageData.endDate} 주문번호 {formatCount(orderPageData.orderCount)}건
          </p>
        </div>
      </header>

      <section className={styles.searchSection}>
        <div className={styles.searchButtonGroup}>
          <button
            type="button"
            className={`${styles.rangeButton} ${selectedRange === "custom" ? styles.rangeButtonActive : ""}`}
            onClick={handleChangeCustomRange}
          >
            기간설정
          </button>
          <button
            type="button"
            className={`${styles.rangeButton} ${selectedRange === "1m" ? styles.rangeButtonActive : ""}`}
            onClick={() => handleSelectPresetRange("1m")}
          >
            1개월
          </button>
          <button
            type="button"
            className={`${styles.rangeButton} ${selectedRange === "3m" ? styles.rangeButtonActive : ""}`}
            onClick={() => handleSelectPresetRange("3m")}
          >
            3개월
          </button>
          <button
            type="button"
            className={`${styles.rangeButton} ${selectedRange === "6m" ? styles.rangeButtonActive : ""}`}
            onClick={() => handleSelectPresetRange("6m")}
          >
            6개월
          </button>
        </div>

        <div className={styles.searchInputGroup}>
          <input
            type="date"
            className={styles.dateInput}
            value={startDateInputValue}
            onChange={(event) => {
              setSelectedRange("custom");
              setStartDateInputValue(event.target.value);
            }}
          />
          <span className={styles.dateDivider}>~</span>
          <input
            type="date"
            className={styles.dateInput}
            value={endDateInputValue}
            onChange={(event) => {
              setSelectedRange("custom");
              setEndDateInputValue(event.target.value);
            }}
          />
          <button type="button" className={styles.searchButton} onClick={handleSearch}>
            검색
          </button>
        </div>
      </section>

      <section className={styles.summarySection}>
        {orderStatusCardList.map((statusCard) => (
          <article key={statusCard.key} className={styles.summaryCard}>
            <p className={styles.summaryLabel}>{statusCard.label}</p>
            <div className={styles.summaryIconWrap}>
              <i className={statusCard.iconClassName} aria-hidden="true" />
            </div>
            <p className={styles.summaryCount}>{formatCount(statusCard.count)}건</p>
          </article>
        ))}
      </section>

      {orderPageData.orderList.length === 0 ? (
        <div className={styles.emptyState}>조회된 주문내역이 없습니다.</div>
      ) : (
        <div className={styles.orderList}>
          {orderPageData.orderList.map((orderGroup) => (
            <article key={orderGroup.ordNo} className={styles.orderCard}>
              <header className={styles.orderCardHeader}>
                <button type="button" className={styles.orderNumberButton} onClick={showPreparingAlert}>
                  주문번호 {orderGroup.ordNo}
                </button>
                <p className={styles.orderDateLabel}>{formatOrderDateLabel(orderGroup.orderDt)}</p>
              </header>

              <ul className={styles.detailList}>
                {orderGroup.detailList.map((detailItem) => {
                  const actionLabelList = resolveOrderActionLabelList(detailItem.ordDtlStatCd);
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
                              <span className={styles.metaValue}>{formatCount(detailItem.ordQty)}개</span>
                            </div>
                            <div className={styles.metaInfoItem}>
                              <span className={styles.metaLabel}>주문금액</span>
                              <span className={`${styles.metaValue} ${styles.metaValueStrong}`}>
                                {formatPrice(resolveOrderDetailAmount(detailItem))}원
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.actionArea}>
                        {actionLabelList.length > 0 ? (
                          actionLabelList.map((actionLabel) => (
                            <button
                              key={`${detailItem.ordNo}-${detailItem.ordDtlNo}-${actionLabel}`}
                              type="button"
                              className={styles.actionButton}
                              onClick={showPreparingAlert}
                            >
                              {actionLabel}
                            </button>
                          ))
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
      )}

      {paginationState.totalPageCount > 0 ? (
        <nav className={styles.paginationWrap} aria-label="주문내역 페이지 이동">
          {paginationState.hasPrevPage ? (
            <Link
              className={styles.paginationArrow}
              href={buildMypageOrderHref(selectedRange, orderPageData.startDate, orderPageData.endDate, paginationState.prevPageNo)}
            >
              {"<"}
            </Link>
          ) : (
            <span className={`${styles.paginationArrow} ${styles.paginationDisabled}`}>{"<"}</span>
          )}

          {paginationState.hasPrevBlock ? (
            <Link
              className={styles.paginationEllipsis}
              href={buildMypageOrderHref(selectedRange, orderPageData.startDate, orderPageData.endDate, paginationState.prevBlockPageNo)}
            >
              ...
            </Link>
          ) : null}

          {paginationState.pageNoList.map((targetPageNo) =>
            targetPageNo === paginationState.currentPageNo ? (
              <span key={`page-${targetPageNo}`} className={`${styles.paginationNumber} ${styles.paginationCurrent}`}>
                {targetPageNo}
              </span>
            ) : (
              <Link
                key={`page-${targetPageNo}`}
                className={styles.paginationNumber}
                href={buildMypageOrderHref(selectedRange, orderPageData.startDate, orderPageData.endDate, targetPageNo)}
              >
                {targetPageNo}
              </Link>
            ),
          )}

          {paginationState.hasNextBlock ? (
            <Link
              className={styles.paginationEllipsis}
              href={buildMypageOrderHref(selectedRange, orderPageData.startDate, orderPageData.endDate, paginationState.nextBlockPageNo)}
            >
              ...
            </Link>
          ) : null}

          {paginationState.hasNextPage ? (
            <Link
              className={styles.paginationArrow}
              href={buildMypageOrderHref(selectedRange, orderPageData.startDate, orderPageData.endDate, paginationState.nextPageNo)}
            >
              {">"}
            </Link>
          ) : (
            <span className={`${styles.paginationArrow} ${styles.paginationDisabled}`}>{">"}</span>
          )}
        </nav>
      ) : null}
    </section>
  );
}
