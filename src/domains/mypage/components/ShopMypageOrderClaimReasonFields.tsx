"use client";

import type {
  ShopMypageOrderCancelReasonItem,
  ShopMypageOrderItemReasonState,
} from "@/domains/mypage/types";
import styles from "./ShopMypageOrderSection.module.css";

interface ShopMypageOrderClaimReasonFieldsProps {
  title?: string;
  reasonLabel: string;
  showReasonLabel?: boolean;
  detailLabel?: string;
  showDetailLabel?: boolean;
  requiredText?: string;
  layout?: "grid" | "stack";
  variant?: "default" | "plain";
  textareaPlaceholder: string;
  reasonList: ShopMypageOrderCancelReasonItem[];
  reasonState: ShopMypageOrderItemReasonState;
  disabled: boolean;
  onChangeReasonCd: (nextReasonCd: string) => void;
  onChangeReasonDetail: (nextReasonDetail: string) => void;
}

// 주문 클레임 상품별 사유 입력 필드를 렌더링합니다.
export default function ShopMypageOrderClaimReasonFields({
  title,
  reasonLabel,
  showReasonLabel = true,
  detailLabel = "직접 기입",
  showDetailLabel = true,
  requiredText = "선택 상품 필수",
  layout = "grid",
  variant = "default",
  textareaPlaceholder,
  reasonList,
  reasonState,
  disabled,
  onChangeReasonCd,
  onChangeReasonDetail,
}: ShopMypageOrderClaimReasonFieldsProps) {
  const showHeader = (title?.trim() ?? "") !== "" || requiredText.trim() !== "";
  const fieldLayoutClassName = layout === "stack" ? styles.claimReasonFieldStack : styles.claimReasonFieldGrid;
  const cardClassName =
    variant === "plain" ? `${styles.claimReasonCard} ${styles.claimReasonCardPlain}` : styles.claimReasonCard;

  return (
    <div className={cardClassName}>
      {showHeader ? (
        <div className={styles.claimReasonCardHeader}>
          {title?.trim() ? <strong className={styles.claimReasonCardTitle}>{title}</strong> : null}
          {!disabled && requiredText.trim() !== "" ? (
            <span className={styles.claimReasonCardRequired}>{requiredText}</span>
          ) : null}
        </div>
      ) : null}

      <div className={fieldLayoutClassName}>
        <div className={styles.cancelReasonField}>
          {showReasonLabel ? <label className={styles.cancelFieldLabel}>{reasonLabel}</label> : null}
          <select
            className={styles.cancelReasonSelect}
            value={reasonState.reasonCd}
            disabled={disabled}
            onChange={(event) => {
              onChangeReasonCd(event.target.value);
            }}
          >
            <option value="">{reasonLabel.trim() === "" ? "사유를 선택해주세요." : `${reasonLabel}를 선택해주세요.`}</option>
            {reasonList.map((reasonItem) => (
              <option key={reasonItem.cd} value={reasonItem.cd}>
                {reasonItem.cdNm}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.cancelReasonField}>
          {showDetailLabel ? <label className={styles.cancelFieldLabel}>{detailLabel}</label> : null}
          <textarea
            className={styles.cancelReasonTextarea}
            rows={3}
            value={reasonState.reasonDetail}
            disabled={disabled}
            placeholder={textareaPlaceholder}
            onChange={(event) => {
              onChangeReasonDetail(event.target.value);
            }}
          />
        </div>
      </div>
    </div>
  );
}
