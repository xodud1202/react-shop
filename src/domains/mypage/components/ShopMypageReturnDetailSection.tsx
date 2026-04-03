"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ShopMypageReturnDetailPageResponse,
  ShopMypageReturnPickupAddress,
  ShopMypageReturnPreviewAmount,
} from "@/domains/mypage/types";
import { formatShopMypageOrderCount, formatShopMypageOrderPrice } from "@/domains/mypage/utils/shopMypageOrder";
import {
  isShopMypageReturnHistoryWithdrawable,
  requestShopMypageOrderReturnWithdraw,
  resolveShopMypageOrderReturnWithdrawSuccessMessage,
} from "@/domains/mypage/utils/shopMypageOrderReturnWithdraw";
import type { ShopMypageOrderAmountTableColumn } from "./ShopMypageOrderAmountTable";
import ShopMypageOrderAmountTable from "./ShopMypageOrderAmountTable";
import detailStyles from "./ShopMypageCancelSection.module.css";
import styles from "./ShopMypageOrderSection.module.css";

interface ShopMypageReturnDetailSectionProps {
  returnDetailPageData: ShopMypageReturnDetailPageResponse;
}

// 반품 상품의 표시 금액을 계산합니다.
function resolveReturnDetailAmount(saleAmt: number, addAmt: number, qty: number): number {
  return (saleAmt + addAmt) * qty;
}

// 반품상세 메타 행에 노출할 일시 문자열을 보정합니다.
function formatReturnClaimDateTimeText(chgDt: string): string {
  const trimmedChangedDate = chgDt.trim();
  return trimmedChangedDate === "" ? "-" : trimmedChangedDate;
}

// 일반 금액 문자열을 `-#,###원` 또는 `#,###원` 형식으로 변환합니다.
function formatShopMypageOrderAmountText(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.floor(value) : 0;
  if (safeValue < 0) {
    return `-${formatShopMypageOrderPrice(Math.abs(safeValue))}원`;
  }
  return `${formatShopMypageOrderPrice(safeValue)}원`;
}

// 부호 포함 금액 문자열을 `+#,###원` 또는 `-#,###원` 형식으로 변환합니다.
function formatShopMypageOrderSignedAmountText(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.floor(value) : 0;
  if (safeValue > 0) {
    return `+${formatShopMypageOrderPrice(safeValue)}원`;
  }
  if (safeValue < 0) {
    return `-${formatShopMypageOrderPrice(Math.abs(safeValue))}원`;
  }
  return "0원";
}

// 반품 예정 금액 표 컬럼 목록을 생성합니다.
function createReturnPreviewAmountColumnList(previewAmount: ShopMypageReturnPreviewAmount): ShopMypageOrderAmountTableColumn[] {
  return [
    {
      key: "goodsPrice",
      title: "상품가격",
      itemList: [
        {
          key: "totalSupplyAmt",
          label: "상품가격",
          valueText: formatShopMypageOrderAmountText(previewAmount.totalSupplyAmt),
        },
        {
          key: "totalGoodsDiscountAmt",
          label: "상품할인",
          valueText: formatShopMypageOrderAmountText(previewAmount.totalGoodsDiscountAmt),
        },
      ],
    },
    {
      key: "returnBenefit",
      title: "반품 혜택",
      itemList: [
        {
          key: "totalGoodsCouponDiscountAmt",
          label: "상품쿠폰",
          valueText: formatShopMypageOrderAmountText(previewAmount.totalGoodsCouponDiscountAmt),
        },
        {
          key: "totalCartCouponDiscountAmt",
          label: "장바구니쿠폰",
          valueText: formatShopMypageOrderAmountText(previewAmount.totalCartCouponDiscountAmt),
        },
        {
          key: "deliveryCouponRefundAmt",
          label: "배송비쿠폰환급",
          valueText: formatShopMypageOrderAmountText(previewAmount.deliveryCouponRefundAmt),
        },
        {
          key: "totalPointRefundAmt",
          label: "포인트환급",
          valueText: formatShopMypageOrderAmountText(previewAmount.totalPointRefundAmt),
        },
      ],
    },
    {
      key: "expectedRefund",
      title: "반품 예정금액",
      itemList: [
        {
          key: "paidGoodsAmt",
          label: "실결제 상품가",
          valueText: formatShopMypageOrderAmountText(previewAmount.paidGoodsAmt),
        },
        {
          key: "benefitAmt",
          label: "환급 혜택 합계",
          valueText: formatShopMypageOrderAmountText(previewAmount.benefitAmt),
        },
        {
          key: "shippingAdjustmentAmt",
          label: "배송비",
          valueText: formatShopMypageOrderSignedAmountText(previewAmount.shippingAdjustmentAmt),
        },
        {
          key: "expectedRefundAmt",
          label: "반품 예정 금액",
          valueText: formatShopMypageOrderAmountText(previewAmount.expectedRefundAmt),
          isStrong: true,
        },
      ],
    },
  ];
}

// 회수지 기본주소 라인을 포맷 문자열로 변환합니다.
function formatPickupAddressLine(address: ShopMypageReturnPickupAddress): string {
  return `(${address.postNo}) ${address.baseAddress}`;
}

// 회수지 연락처 라인을 상태에 맞게 생성합니다.
function formatPickupContactLine(receiverName: string, phoneNumber: string): string {
  const trimmedReceiverName = receiverName.trim();
  const trimmedPhoneNumber = phoneNumber.trim();
  if (trimmedReceiverName !== "" && trimmedPhoneNumber !== "") {
    return `${trimmedReceiverName} | ${trimmedPhoneNumber}`;
  }
  if (trimmedReceiverName !== "") {
    return trimmedReceiverName;
  }
  if (trimmedPhoneNumber !== "") {
    return trimmedPhoneNumber;
  }
  return "연락처 정보 없음";
}

// 반품상세 화면을 렌더링합니다.
export default function ShopMypageReturnDetailSection({ returnDetailPageData }: ShopMypageReturnDetailSectionProps) {
  const router = useRouter();
  const [processingActionKey, setProcessingActionKey] = useState<string>("");
  const { returnItem, previewAmount, pickupAddress, customerPhoneNumber } = returnDetailPageData;

  // 반품 정보가 없으면 빈 화면을 반환합니다.
  if (!returnItem) {
    return null;
  }

  const returnPreviewAmountColumnList = createReturnPreviewAmountColumnList(previewAmount);

  // 반품상세 상품 기준 반품 철회 액션을 호출하고 필요 시 목록으로 이동합니다.
  const handleReturnWithdrawAction = async (ordDtlNo: number): Promise<void> => {
    const actionKey = `${returnItem.clmNo}-${ordDtlNo}-반품 철회`;

    // 동일 액션 중복 클릭을 막고 서버 검증 결과를 사용자에게 즉시 노출합니다.
    setProcessingActionKey(actionKey);
    try {
      const result = await requestShopMypageOrderReturnWithdraw(returnItem.ordNo, ordDtlNo);
      if (!result.ok || !result.data) {
        window.alert(result.message || "반품 철회 처리에 실패했습니다.");
        return;
      }

      window.alert(resolveShopMypageOrderReturnWithdrawSuccessMessage());
      if (result.data.claimClosedYn) {
        router.replace("/mypage/return");
        router.refresh();
        return;
      }
      router.refresh();
    } catch {
      window.alert("반품 철회 처리에 실패했습니다.");
    } finally {
      setProcessingActionKey("");
    }
  };

  return (
    <section className={styles.orderSection}>
      <header className={styles.orderHeader}>
        <div>
          <h1 className={styles.orderTitle}>반품상세</h1>
        </div>
      </header>

      <div className={styles.detailMetaRow}>
        <p className={styles.detailMetaText}>주문번호 {returnItem.ordNo}</p>
        <p className={styles.detailMetaText}>클레임번호 {returnItem.clmNo}</p>
        <p className={`${styles.detailMetaText} ${styles.detailMetaTextRight}`}>
          반품일시 {formatReturnClaimDateTimeText(returnItem.chgDt)}
        </p>
      </div>

      <section className={styles.detailSectionBlock}>
        <h2 className={styles.detailSectionTitle}>반품 상품</h2>
        <ul className={detailStyles.cancelDetailItemList}>
          {returnItem.detailList.map((detailItem) => {
            const actionKey = `${returnItem.clmNo}-${detailItem.ordDtlNo}-반품 철회`;
            const isProcessingAction = processingActionKey === actionKey;
            const withdrawableYn = isShopMypageReturnHistoryWithdrawable(detailItem);
            return (
              <li
                key={`${returnItem.clmNo}-${detailItem.ordDtlNo}`}
                className={`${detailStyles.cancelDetailItemRow} ${detailStyles.claimActionDetailRow}`}
              >
                <div className={detailStyles.thumbnailWrap}>
                  {detailItem.imgUrl.trim() !== "" ? (
                    <Image
                      src={detailItem.imgUrl}
                      alt={detailItem.goodsNm}
                      fill
                      sizes="104px"
                      className={detailStyles.thumbnailImage}
                    />
                  ) : (
                    <span className={detailStyles.thumbnailFallback}>이미지 없음</span>
                  )}
                </div>

                <div className={detailStyles.detailContent}>
                  <p className={detailStyles.goodsName}>{detailItem.goodsNm}</p>
                  <div className={detailStyles.metaGrid}>
                    <div className={detailStyles.metaInfoRow}>
                      <div className={detailStyles.metaInfoItem}>
                        <span className={detailStyles.metaLabel}>사이즈</span>
                        <span className={detailStyles.metaValue}>{detailItem.sizeId || "-"}</span>
                      </div>
                      <div className={detailStyles.metaInfoItem}>
                        <span className={detailStyles.metaLabel}>반품상태</span>
                        <span className={detailStyles.metaValue}>{detailItem.chgDtlStatNm || "-"}</span>
                      </div>
                    </div>
                    <div className={detailStyles.metaInfoRow}>
                      <div className={detailStyles.metaInfoItem}>
                        <span className={detailStyles.metaLabel}>반품수량</span>
                        <span className={detailStyles.metaValue}>{formatShopMypageOrderCount(detailItem.qty)}개</span>
                      </div>
                      <div className={detailStyles.metaInfoItem}>
                        <span className={`${detailStyles.metaLabel} ${detailStyles.metaValueStrong}`}>상품금액</span>
                        <span className={`${detailStyles.metaValue} ${detailStyles.metaValueStrong}`}>
                          {formatShopMypageOrderPrice(resolveReturnDetailAmount(detailItem.saleAmt, detailItem.addAmt, detailItem.qty))}원
                        </span>
                      </div>
                    </div>

                    {detailItem.chgReasonNm.trim() !== "" ? (
                      <div className={detailStyles.cancelReasonBox}>
                        <p className={detailStyles.cancelReasonTitle}>반품 사유</p>
                        <p className={detailStyles.cancelReasonText}>
                          {detailItem.chgReasonNm}
                          {detailItem.chgReasonDtl.trim() !== "" ? ` · ${detailItem.chgReasonDtl}` : ""}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className={detailStyles.actionArea}>
                  {withdrawableYn ? (
                    <button
                      type="button"
                      className={detailStyles.actionButton}
                      disabled={processingActionKey !== ""}
                      onClick={() => {
                        void handleReturnWithdrawAction(detailItem.ordDtlNo);
                      }}
                    >
                      {isProcessingAction ? "반품 철회 처리중..." : "반품 철회"}
                    </button>
                  ) : (
                    <span className={detailStyles.noActionLabel}>-</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.detailSectionBlock}>
        <h2 className={styles.detailSectionTitle}>반품 예정 금액</h2>
        <ShopMypageOrderAmountTable columnList={returnPreviewAmountColumnList} />
      </section>

      <section className={styles.detailSectionBlock}>
        <div className={styles.returnPickupHeader}>
          <h2 className={styles.detailSectionTitle}>반품 회수지</h2>
          <button type="button" className={styles.returnPickupButton} disabled>
            회수지 변경
          </button>
        </div>

        {pickupAddress ? (
          <div className={styles.returnPickupCard}>
            <div className={styles.returnPickupTitleRow}>
              <strong className={styles.returnPickupAlias}>주문 배송지</strong>
            </div>
            <p className={styles.returnPickupMeta}>
              {formatPickupContactLine(pickupAddress.rsvNm, customerPhoneNumber)}
            </p>
            <p className={styles.returnPickupMain}>{formatPickupAddressLine(pickupAddress)}</p>
            <p className={styles.returnPickupDetail}>{pickupAddress.detailAddress || "-"}</p>
          </div>
        ) : (
          <div className={styles.returnPickupEmptyState}>
            <p className={styles.returnPickupEmptyTitle}>저장된 회수지 정보가 없습니다.</p>
          </div>
        )}
      </section>

      <div className={detailStyles.cancelNoticeBox}>
        <span className={detailStyles.cancelNoticeIcon}>ℹ</span>
        <p className={detailStyles.cancelNoticeText}>반품 상태는 회수와 검수 진행에 따라 순차적으로 업데이트됩니다.</p>
      </div>

      <div className={detailStyles.cancelDetailActionBar}>
        <Link href="/mypage/return" className={styles.cancelListButton}>
          목록
        </Link>
      </div>
    </section>
  );
}
