import Link from "next/link";
import styles from "./ShopPageStatus.module.css";

interface ShopPageStatusProps {
  eyebrow: string;
  title: string;
  description: string;
  primaryActionHref?: string;
  primaryActionLabel?: string;
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
}

// 공통 페이지 상태 안내 UI를 렌더링합니다.
export default function ShopPageStatus({
  eyebrow,
  title,
  description,
  primaryActionHref,
  primaryActionLabel,
  secondaryActionHref,
  secondaryActionLabel,
}: ShopPageStatusProps) {
  return (
    <section className={styles.statusPage}>
      <div className={styles.statusCard}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>

        {(primaryActionHref && primaryActionLabel) || (secondaryActionHref && secondaryActionLabel) ? (
          <div className={styles.actionRow}>
            {primaryActionHref && primaryActionLabel ? (
              <Link href={primaryActionHref} className={styles.primaryButton}>
                {primaryActionLabel}
              </Link>
            ) : null}
            {secondaryActionHref && secondaryActionLabel ? (
              <Link href={secondaryActionHref} className={styles.secondaryButton}>
                {secondaryActionLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
