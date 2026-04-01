"use client";

import Image from "next/image";
import ShopMypageOrderClaimReasonFields from "@/domains/mypage/components/ShopMypageOrderClaimReasonFields";
import type {
  ShopMypageOrderDetailItem,
  ShopMypageOrderGroup,
  ShopMypageOrderItemReasonMap,
  ShopMypageOrderReturnReasonItem,
} from "@/domains/mypage/types";
import { resolveShopMypageOrderItemReasonState } from "@/domains/mypage/utils/shopMypageOrderClaimReason";
import {
  formatShopMypageOrderCount,
  formatShopMypageOrderPrice,
  resolveShopMypageOrderDetailAmount,
} from "@/domains/mypage/utils/shopMypageOrder";
import {
  clampShopMypageOrderReturnQty,
  type ShopMypageOrderReturnSelectionMap,
  isShopMypageOrderReturnable,
  resolveShopMypageOrderReturnSelectionItem,
} from "@/domains/mypage/utils/shopMypageOrderReturn";
import styles from "./ShopMypageOrderSection.module.css";

interface ShopMypageOrderReturnItemListProps {
  order: ShopMypageOrderGroup;
  selectionMap: ShopMypageOrderReturnSelectionMap;
  itemReasonMap: ShopMypageOrderItemReasonMap;
  reasonList: ShopMypageOrderReturnReasonItem[];
  allSelected: boolean;
  onToggleAll: (checked: boolean) => void;
  onToggleItem: (detailItem: ShopMypageOrderDetailItem, checked: boolean) => void;
  onChangeItemQty: (detailItem: ShopMypageOrderDetailItem, nextQty: number) => void;
  onChangeItemReasonCd: (ordDtlNo: number, nextReasonCd: string) => void;
  onChangeItemReasonDetail: (ordDtlNo: number, nextReasonDetail: string) => void;
}

// 반품 신청 리스트 상단 안내 문구를 반환합니다.
function resolveShopMypageOrderReturnGuideMessage(): string {
  return "배송완료 주문은 상품 선택과 수량 변경으로 반품신청이 가능합니다.";
}

// 반품 신청 상품 선택 리스트 UI를 렌더링합니다.
export default function ShopMypageOrderReturnItemList({
  order,
  selectionMap,
  itemReasonMap,
  reasonList,
  allSelected,
  onToggleAll,
  onToggleItem,
  onChangeItemQty,
  onChangeItemReasonCd,
  onChangeItemReasonDetail,
}: ShopMypageOrderReturnItemListProps) {
  return (
    <section className={styles.detailSectionBlock}>
      <div className={styles.cancelListHeader}>
        <div className={styles.cancelListHeaderLeft}>
          <label className={styles.cancelCheckLabel}>
            <input
              type="checkbox"
              className={styles.cancelCheckbox}
              checked={allSelected}
              onChange={(event) => {
                onToggleAll(event.target.checked);
              }}
            />
            <span>전체 선택</span>
          </label>
        </div>
        <p className={styles.cancelModeDescription}>{resolveShopMypageOrderReturnGuideMessage()}</p>
      </div>

      <article className={styles.orderCard}>
        <ul className={styles.detailList}>
          {order.detailList.map((detailItem) => {
            const selectionItem = resolveShopMypageOrderReturnSelectionItem(selectionMap, detailItem);
            const reasonState = resolveShopMypageOrderItemReasonState(itemReasonMap, detailItem.ordDtlNo);
            const currentRemainingQty = Math.max(Math.floor(detailItem.cancelableQty || 0), 0);
            const selectable = isShopMypageOrderReturnable(detailItem);
            const quantityEditable = selectable && selectionItem.selected;

            return (
              <li
                key={`${detailItem.ordNo}-${detailItem.ordDtlNo}`}
                className={`${styles.detailRow} ${styles.returnDetailRow}`}
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
                  <div className={styles.cancelItemHead}>
                    <label className={styles.cancelCheckLabel}>
                      <input
                        type="checkbox"
                        className={styles.cancelCheckbox}
                        checked={selectionItem.selected}
                        disabled={!selectable}
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

                  <div className={styles.returnControlArea}>
                    <div className={styles.returnControlTopRow}>
                      <div className={styles.cancelQtySummary}>
                        <span className={styles.cancelQtyLabel}>반품가능수량</span>
                        <span className={styles.cancelQtyValue}>{formatShopMypageOrderCount(currentRemainingQty)}개</span>
                      </div>
                      <div className={styles.returnQtyEditorWrap}>
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
                            value={quantityEditable ? selectionItem.cancelQty : 0}
                            disabled={!quantityEditable}
                            className={styles.cancelQtyInput}
                            onChange={(event) => {
                              onChangeItemQty(
                                detailItem,
                                clampShopMypageOrderReturnQty(detailItem, Number(event.target.value)),
                              );
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
                      </div>
                    </div>
                    {selectable ? (
                      <p className={styles.cancelControlHint}>반품할 상품만 선택하고 수량을 조정해주세요.</p>
                    ) : (
                      <p className={styles.cancelControlHint}>현재 상태에서는 반품 신청이 불가합니다.</p>
                    )}
                  </div>

                  <ShopMypageOrderClaimReasonFields
                    title=""
                    reasonLabel="반품 사유"
                    showReasonLabel={false}
                    showDetailLabel={false}
                    requiredText=""
                    layout="stack"
                    variant="plain"
                    textareaPlaceholder="상세 사유를 입력해주세요."
                    reasonList={reasonList}
                    reasonState={reasonState}
                    disabled={!selectionItem.selected}
                    onChangeReasonCd={(nextReasonCd) => {
                      onChangeItemReasonCd(detailItem.ordDtlNo, nextReasonCd);
                    }}
                    onChangeReasonDetail={(nextReasonDetail) => {
                      onChangeItemReasonDetail(detailItem.ordDtlNo, nextReasonDetail);
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </article>
    </section>
  );
}
