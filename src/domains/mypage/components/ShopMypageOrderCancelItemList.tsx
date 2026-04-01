"use client";

import Image from "next/image";
import ShopMypageOrderClaimReasonFields from "@/domains/mypage/components/ShopMypageOrderClaimReasonFields";
import type {
  ShopMypageOrderCancelReasonItem,
  ShopMypageOrderDetailItem,
  ShopMypageOrderGroup,
  ShopMypageOrderItemReasonMap,
} from "@/domains/mypage/types";
import { resolveShopMypageOrderItemReasonState } from "@/domains/mypage/utils/shopMypageOrderClaimReason";
import {
  formatShopMypageOrderCount,
  formatShopMypageOrderPrice,
  resolveShopMypageOrderDetailAmount,
} from "@/domains/mypage/utils/shopMypageOrder";
import {
  type ShopMypageOrderCancelMode,
  type ShopMypageOrderCancelSelectionMap,
  isShopMypageOrderActiveDetail,
  isShopMypageOrderPartialCancelable,
  resolveShopMypageOrderCancelSelectionItem,
} from "@/domains/mypage/utils/shopMypageOrderCancel";
import styles from "./ShopMypageOrderSection.module.css";

interface ShopMypageOrderCancelItemListProps {
  order: ShopMypageOrderGroup;
  cancelMode: ShopMypageOrderCancelMode;
  selectionMap: ShopMypageOrderCancelSelectionMap;
  itemReasonMap: ShopMypageOrderItemReasonMap;
  reasonList: ShopMypageOrderCancelReasonItem[];
  allSelected: boolean;
  onToggleAll: (checked: boolean) => void;
  onToggleItem: (detailItem: ShopMypageOrderDetailItem, checked: boolean) => void;
  onChangeItemQty: (detailItem: ShopMypageOrderDetailItem, nextQty: number) => void;
  onChangeItemReasonCd: (ordDtlNo: number, nextReasonCd: string) => void;
  onChangeItemReasonDetail: (ordDtlNo: number, nextReasonDetail: string) => void;
}

// 주문취소 모드 라벨을 반환합니다.
function resolveShopMypageOrderCancelModeLabel(cancelMode: ShopMypageOrderCancelMode): string {
  if (cancelMode === "full") {
    return "무통장입금 대기 주문은 전체취소만 가능합니다.";
  }
  return "결제완료 주문은 상품 선택과 수량 변경으로 부분취소가 가능합니다.";
}

// 주문취소 상품 선택 리스트 UI를 렌더링합니다.
export default function ShopMypageOrderCancelItemList({
  order,
  cancelMode,
  selectionMap,
  itemReasonMap,
  reasonList,
  allSelected,
  onToggleAll,
  onToggleItem,
  onChangeItemQty,
  onChangeItemReasonCd,
  onChangeItemReasonDetail,
}: ShopMypageOrderCancelItemListProps) {
  const isFullMode = cancelMode === "full";

  return (
    <section className={styles.detailSectionBlock}>
      <div className={styles.cancelListHeader}>
        <div className={styles.cancelListHeaderLeft}>
          <label className={styles.cancelCheckLabel}>
            <input
              type="checkbox"
              className={styles.cancelCheckbox}
              checked={isFullMode ? true : allSelected}
              disabled={isFullMode}
              onChange={(event) => {
                onToggleAll(event.target.checked);
              }}
            />
            <span>전체 선택</span>
          </label>
        </div>
        <p className={styles.cancelModeDescription}>{resolveShopMypageOrderCancelModeLabel(cancelMode)}</p>
      </div>

      <article className={styles.orderCard}>
        <ul className={styles.detailList}>
          {order.detailList.map((detailItem) => {
            const selectionItem = resolveShopMypageOrderCancelSelectionItem(selectionMap, detailItem);
            const reasonState = resolveShopMypageOrderItemReasonState(itemReasonMap, detailItem.ordDtlNo);
            const currentRemainingQty = detailItem.cancelableQty;
            const selectable = !isFullMode && isShopMypageOrderPartialCancelable(detailItem);
            const quantityEditable = selectable && selectionItem.selected;
            const activeDetail = isShopMypageOrderActiveDetail(detailItem);
            const reasonEditable = isFullMode ? activeDetail : selectionItem.selected;

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
                  <div className={styles.cancelItemHead}>
                    <label className={styles.cancelCheckLabel}>
                      <input
                        type="checkbox"
                        className={styles.cancelCheckbox}
                        checked={isFullMode ? activeDetail : selectionItem.selected}
                        disabled={isFullMode || !selectable}
                        onChange={(event) => {
                          onToggleItem(detailItem, event.target.checked);
                        }}
                      />
                      <span className={styles.goodsName}>{detailItem.goodsNm}</span>
                    </label>
                  </div>

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

                  <ShopMypageOrderClaimReasonFields
                    title="상품별 취소 사유"
                    reasonLabel="취소 사유"
                    textareaPlaceholder="추가로 전달할 주문 취소 사유가 있다면 입력해주세요."
                    reasonList={reasonList}
                    reasonState={reasonState}
                    disabled={!reasonEditable}
                    onChangeReasonCd={(nextReasonCd) => {
                      onChangeItemReasonCd(detailItem.ordDtlNo, nextReasonCd);
                    }}
                    onChangeReasonDetail={(nextReasonDetail) => {
                      onChangeItemReasonDetail(detailItem.ordDtlNo, nextReasonDetail);
                    }}
                  />
                </div>

                <div className={styles.cancelControlArea}>
                  <div className={styles.cancelQtySummary}>
                    <span className={styles.cancelQtyLabel}>취소가능수량</span>
                    <span className={styles.cancelQtyValue}>{formatShopMypageOrderCount(currentRemainingQty)}개</span>
                  </div>
                  <div className={styles.cancelQtyEditor}>
                    <button
                      type="button"
                      className={styles.cancelQtyButton}
                      disabled={!quantityEditable || selectionItem.cancelQty <= 1}
                      onClick={() => {
                        onChangeItemQty(detailItem, selectionItem.cancelQty - 1);
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(currentRemainingQty, 1)}
                      value={quantityEditable ? selectionItem.cancelQty : activeDetail && isFullMode ? currentRemainingQty : 0}
                      disabled={!quantityEditable}
                      className={styles.cancelQtyInput}
                      onChange={(event) => {
                        onChangeItemQty(detailItem, Number(event.target.value));
                      }}
                    />
                    <button
                      type="button"
                      className={styles.cancelQtyButton}
                      disabled={!quantityEditable || selectionItem.cancelQty >= currentRemainingQty}
                      onClick={() => {
                        onChangeItemQty(detailItem, selectionItem.cancelQty + 1);
                      }}
                    >
                      +
                    </button>
                  </div>
                  {!activeDetail ? (
                    <p className={styles.cancelControlHint}>이미 취소 완료된 상품입니다.</p>
                  ) : isFullMode ? (
                    <p className={styles.cancelControlHint}>전체취소 전용 주문으로 수량 변경은 불가합니다.</p>
                  ) : selectable ? (
                    <p className={styles.cancelControlHint}>취소할 상품만 선택하고 수량을 조정해주세요.</p>
                  ) : (
                    <p className={styles.cancelControlHint}>현재 상태에서는 취소 신청이 불가합니다.</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </article>
    </section>
  );
}
