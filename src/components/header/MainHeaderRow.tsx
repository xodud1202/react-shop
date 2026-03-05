import Image from "next/image";
import type { FormEvent } from "react";
import styles from "./ShopHeader.module.css";

interface MainHeaderRowProps {
  logoUrl: string;
  onClickPlaceholder: (menuName: string) => void;
  onSubmitSearch: (keyword: string) => void;
}

// PC용 메인 헤더 행(로고/검색/아이콘)을 렌더링합니다.
export default function MainHeaderRow({ logoUrl, onClickPlaceholder, onSubmitSearch }: MainHeaderRowProps) {
  // 검색 폼 제출을 처리합니다.
  const handleSubmitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 입력 폼 데이터를 안전하게 읽어 검색어를 전달합니다.
    const formData = new FormData(event.currentTarget);
    const searchKeyword = String(formData.get("searchKeyword") ?? "").trim();
    onSubmitSearch(searchKeyword);
  };

  return (
    <div className={styles.mainRow}>
      <div className={styles.logoWrap}>
        <Image src={logoUrl} alt="xodud1202 로고" width={168} height={34} priority />
      </div>

      <form className={styles.searchForm} onSubmit={handleSubmitSearch}>
        <input
          type="text"
          name="searchKeyword"
          className={styles.searchInput}
          placeholder="검색어를 입력해주세요"
          aria-label="상품 검색"
        />
        <button type="submit" className={styles.searchButton} aria-label="검색">
          <i className="fa-solid fa-magnifying-glass" />
        </button>
      </form>

      <div className={styles.iconGroup}>
        <button type="button" className={styles.iconButton} onClick={() => onClickPlaceholder("마이페이지")}>
          <i className="fa-regular fa-user" />
          <span>마이</span>
        </button>
        <button type="button" className={styles.iconButton} onClick={() => onClickPlaceholder("찜목록")}>
          <i className="fa-regular fa-heart" />
          <span>찜</span>
        </button>
        <button type="button" className={styles.iconButton} onClick={() => onClickPlaceholder("장바구니")}>
          <i className="fa-solid fa-bag-shopping" />
          <span>장바구니</span>
        </button>
      </div>
    </div>
  );
}
