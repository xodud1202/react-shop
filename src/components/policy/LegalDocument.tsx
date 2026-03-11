import styles from "./LegalDocument.module.css";

interface LegalDocumentProps {
  title: string;
  paragraphs: string[];
  variant?: "page" | "embedded";
}

// 약관/정책 문단 요소를 렌더링합니다.
function renderParagraph(paragraph: string, index: number) {
  // 제목과 인덱스를 조합한 키로 문단을 안정적으로 구분합니다.
  return (
    <p key={`legal-paragraph-${index}`} className={styles.legalParagraph}>
      {paragraph}
    </p>
  );
}

// 약관/정책 공통 문서 레이아웃을 렌더링합니다.
export default function LegalDocument({ title, paragraphs, variant = "page" }: LegalDocumentProps) {
  // 문서 노출 형태에 맞는 래퍼 클래스를 선택합니다.
  const isEmbedded = variant === "embedded";

  return (
    <section className={isEmbedded ? styles.legalEmbeddedPage : styles.legalPage}>
      <div className={isEmbedded ? styles.legalEmbeddedContainer : styles.legalContainer}>
        <h1 className={styles.legalTitle}>{title}</h1>

        <div className={styles.legalContent}>
          {paragraphs.map((paragraph, index) => renderParagraph(paragraph, index))}
        </div>
      </div>
    </section>
  );
}
