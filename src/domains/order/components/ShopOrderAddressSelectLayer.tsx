"use client";

import { useEffect } from "react";
import type { MouseEvent } from "react";
import type { ShopOrderAddress } from "@/domains/order/types";
import styles from "./ShopOrderAddressLayer.module.css";

interface ShopOrderAddressSelectLayerProps {
  addressList: ShopOrderAddress[];
  selectedAddressNm: string;
  onSelect: (address: ShopOrderAddress) => void;
  onEdit: (address: ShopOrderAddress) => void;
  onOpenRegister: () => void;
  onClose: () => void;
}

// 공통 레이어 오버레이 바깥 영역 클릭 여부를 판정합니다.
function isOverlayClick(event: MouseEvent<HTMLDivElement>): boolean {
  return event.target === event.currentTarget;
}

// 주문서 배송지 선택 레이어팝업을 렌더링합니다.
export default function ShopOrderAddressSelectLayer({
  addressList,
  selectedAddressNm,
  onSelect,
  onEdit,
  onOpenRegister,
  onClose,
}: ShopOrderAddressSelectLayerProps) {
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

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="배송지 선택" onClick={handleOverlayClick}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerActionRow}>
            <h2 className={styles.headerTitle}>배송지 선택</h2>
            <div className={styles.headerButtonGroup}>
              <button type="button" className={styles.headerActionButton} onClick={onOpenRegister}>
                배송지 등록
              </button>
              <button type="button" className={styles.closeButton} aria-label="배송지 선택 팝업 닫기" onClick={onClose}>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {addressList.length === 0 ? (
            <div className={styles.emptyState}>
              <strong className={styles.emptyTitle}>등록된 배송지가 없습니다.</strong>
              <p className={styles.emptyDescription}>상단의 배송지 등록 버튼으로 새 배송지를 추가해주세요.</p>
            </div>
          ) : (
            <ul className={styles.addressList}>
              {addressList.map((address) => {
                const isSelected = address.addressNm === selectedAddressNm;
                return (
                  <li key={`${address.custNo}-${address.addressNm}`} className={styles.addressListItem}>
                    <div className={`${styles.addressCard} ${isSelected ? styles.addressCardSelected : ""}`}>
                      <div className={styles.addressCardHeader}>
                        <div className={styles.addressCardTitleRow}>
                          <strong className={styles.addressAliasText}>{address.addressNm}</strong>
                          {address.defaultYn === "Y" ? <span className={styles.defaultBadge}>기본 배송지</span> : null}
                          {isSelected ? <span className={styles.selectedBadge}>선택됨</span> : null}
                        </div>
                      </div>
                      <p className={styles.addressMetaText}>
                        {address.rsvNm} | {address.phoneNumber}
                      </p>
                      <p className={styles.addressMainText}>
                        ({address.postNo}) {address.baseAddress}
                      </p>
                      <p className={styles.addressSubText}>{address.detailAddress}</p>

                      <div className={styles.addressActionRow}>
                        <button
                          type="button"
                          className={`${styles.secondaryButton} ${styles.addressActionButton}`}
                          onClick={() => onEdit(address)}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className={`${styles.primaryButton} ${styles.addressActionButton}`}
                          onClick={() => onSelect(address)}
                        >
                          선택
                        </button>
                      </div>
                    </div>
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
