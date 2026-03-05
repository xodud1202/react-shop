import styles from "./ShopHeader.module.css";

interface TopUtilityBarProps {
  onClickPlaceholder: (menuName: string) => void;
}

// 헤더 상단 유틸리티 메뉴를 렌더링합니다.
export default function TopUtilityBar({ onClickPlaceholder }: TopUtilityBarProps) {
  return (
    <div className={styles.utilityRow}>
      <button type="button" className={styles.utilityButton} onClick={() => onClickPlaceholder("로그인")}>
        로그인
      </button>
      <button type="button" className={styles.utilityButton} onClick={() => onClickPlaceholder("회원가입")}>
        회원가입
      </button>
      <button type="button" className={styles.utilityButton} onClick={() => onClickPlaceholder("주문조회")}>
        주문조회
      </button>
      <button type="button" className={styles.utilityButton} onClick={() => onClickPlaceholder("고객센터")}>
        고객센터
      </button>
    </div>
  );
}
