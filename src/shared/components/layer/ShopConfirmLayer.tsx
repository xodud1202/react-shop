"use client";

import { useEffect } from "react";
import type { MouseEvent } from "react";
import styles from "./ShopConfirmLayer.module.css";

interface ShopConfirmLayerProps {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

// 공통 확인 레이어 팝업을 렌더링합니다.
export default function ShopConfirmLayer({
  title = "안내",
  message,
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  onClose,
}: ShopConfirmLayerProps) {
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
    if (event.target !== event.currentTarget) {
      return;
    }
    onClose();
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={title} onClick={handleOverlayClick}>
      <div className={styles.panel}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttonRow}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            {cancelText}
          </button>
          <button type="button" className={styles.confirmButton} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

