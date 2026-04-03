"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ShopMypageOrderGroup,
  ShopMypageOrderStatusActionRequest,
  ShopMypageOrderStatusActionResponse,
} from "@/domains/mypage/types";
import {
  buildShopMypageOrderDetailHref,
  formatShopMypageOrderCount,
  formatShopMypageOrderDateLabel,
  formatShopMypageOrderPrice,
  isShopMypageOrderStatusActionLabel,
  resolveShopMypageOrderActionHref,
  resolveShopMypageOrderDetailAmount,
  resolveShopMypageOrderDisplayStatusName,
  resolveShopMypageOrderStatusActionPath,
  resolveShopMypageOrderStatusActionSuccessMessage,
  resolveShopMypageOrderVisibleActionLabelList,
} from "@/domains/mypage/utils/shopMypageOrder";
import {
  isShopMypageOrderReturnWithdrawActionLabel,
  requestShopMypageOrderReturnWithdraw,
  resolveShopMypageOrderReturnWithdrawSuccessMessage,
} from "@/domains/mypage/utils/shopMypageOrderReturnWithdraw";
import { requestShopClientApi } from "@/shared/client/shopClientApi";
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
  const router = useRouter();
  const [processingActionKey, setProcessingActionKey] = useState<string>("");

  // 빈 주문 목록이면 공통 empty 상태를 반환합니다.
  if (orderList.length === 0) {
    return <div className={styles.emptyState}>{emptyMessage}</div>;
  }

  // 주문상태 변경 액션을 호출하고 현재 화면 데이터를 새로고침합니다.
  const handleStatusAction = async (ordNo: string, ordDtlNo: number, actionLabel: string): Promise<void> => {
    const actionPath = resolveShopMypageOrderStatusActionPath(actionLabel);
    if (!actionPath) {
      showPreparingAlert();
      return;
    }

    const requestBody: ShopMypageOrderStatusActionRequest = {
      ordNo,
      ordDtlNo,
    };
    const actionKey = `${ordNo}-${ordDtlNo}-${actionLabel}`;

    // 동일 액션 중복 클릭을 막고 서버 검증 결과를 사용자에게 즉시 노출합니다.
    setProcessingActionKey(actionKey);
    try {
      const result = await requestShopClientApi<ShopMypageOrderStatusActionResponse>(actionPath, {
        method: "POST",
        body: requestBody,
      });
      if (!result.ok || !result.data) {
        window.alert(result.message || `${actionLabel} 처리에 실패했습니다.`);
        return;
      }

      window.alert(resolveShopMypageOrderStatusActionSuccessMessage(actionLabel));
      router.refresh();
    } catch {
      window.alert(`${actionLabel} 처리에 실패했습니다.`);
    } finally {
      setProcessingActionKey("");
    }
  };

  // 반품 철회 액션을 호출하고 현재 화면 데이터를 새로고침합니다.
  const handleReturnWithdrawAction = async (ordNo: string, ordDtlNo: number, actionLabel: string): Promise<void> => {
    const actionKey = `${ordNo}-${ordDtlNo}-${actionLabel}`;

    // 동일 액션 중복 클릭을 막고 서버 검증 결과를 사용자에게 즉시 노출합니다.
    setProcessingActionKey(actionKey);
    try {
      const result = await requestShopMypageOrderReturnWithdraw(ordNo, ordDtlNo);
      if (!result.ok || !result.data) {
        window.alert(result.message || `${actionLabel} 처리에 실패했습니다.`);
        return;
      }

      window.alert(resolveShopMypageOrderReturnWithdrawSuccessMessage());
      router.refresh();
    } catch {
      window.alert(`${actionLabel} 처리에 실패했습니다.`);
    } finally {
      setProcessingActionKey("");
    }
  };

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
              const actionLabelList = resolveShopMypageOrderVisibleActionLabelList(detailItem);
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
                          <span className={styles.metaValue}>{resolveShopMypageOrderDisplayStatusName(detailItem) || "-"}</span>
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
                        const actionKey = `${detailItem.ordNo}-${detailItem.ordDtlNo}-${actionLabel}`;
                        const isProcessingAction = processingActionKey === actionKey;
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
                        if (isShopMypageOrderStatusActionLabel(actionLabel)) {
                          return (
                            <button
                              key={actionKey}
                              type="button"
                              className={styles.actionButton}
                              disabled={processingActionKey !== ""}
                              onClick={() => {
                                void handleStatusAction(detailItem.ordNo, detailItem.ordDtlNo, actionLabel);
                              }}
                            >
                              {isProcessingAction ? `${actionLabel} 처리중...` : actionLabel}
                            </button>
                          );
                        }
                        if (isShopMypageOrderReturnWithdrawActionLabel(actionLabel)) {
                          return (
                            <button
                              key={actionKey}
                              type="button"
                              className={styles.actionButton}
                              disabled={processingActionKey !== ""}
                              onClick={() => {
                                void handleReturnWithdrawAction(detailItem.ordNo, detailItem.ordDtlNo, actionLabel);
                              }}
                            >
                              {isProcessingAction ? `${actionLabel} 처리중...` : actionLabel}
                            </button>
                          );
                        }
                        return (
                          <button
                            key={actionKey}
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
