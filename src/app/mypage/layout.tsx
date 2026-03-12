import type { ReactNode } from "react";
import ShopMypageLnb from "@/domains/mypage/components/ShopMypageLnb";
import styles from "./layout.module.css";

interface ShopMypageLayoutProps {
  children: ReactNode;
}

// /mypage 하위 페이지 공통 레이아웃을 렌더링합니다.
export default function ShopMypageLayout({ children }: ShopMypageLayoutProps) {
  return (
    <section className={styles.pageSection}>
      <div className={styles.pageContainer}>
        <aside className={styles.lnbArea}>
          <ShopMypageLnb />
        </aside>
        <div className={styles.contentArea}>{children}</div>
      </div>
    </section>
  );
}
