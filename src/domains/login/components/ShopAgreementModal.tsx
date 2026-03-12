"use client";

import LegalDocument from "@/domains/policy/components/LegalDocument";
import styles from "./ShopAgreementModal.module.css";

interface ShopAgreementModalProps {
  title: string;
  paragraphs: string[];
  onClose: () => void;
}

// 약관/정책 내용을 레이어 팝업으로 렌더링합니다.
export default function ShopAgreementModal({ title, paragraphs, onClose }: ShopAgreementModalProps) {
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.modalPanel}>
        <div className={styles.modalHeader}>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="약관 팝업 닫기">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <LegalDocument title={title} paragraphs={paragraphs} variant="embedded" />
      </div>
    </div>
  );
}

