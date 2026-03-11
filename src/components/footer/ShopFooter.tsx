"use client";

import Link from "next/link";
import styles from "./ShopFooter.module.css";

const ABOUT_US_LINES = [
  "회사명: xodud1202(가칭) 대표: Mr.Lee 주소: 서울시 서울구 서울대로 111, 서울빌딩 11층 xodud1202",
  "고객센터: 0000-0000 (10:00 - 15:30) 휴무: 토요일 / 일요일 / 공휴",
  "통신판매신고번호: 아직이구요",
  "상표등록번호: 아직이구요",
  "개인정보관리 책임자: Mr.lee (test@test.com)",
];

const SERVICE_MENU_NAMES = ["FAQ", "배송조회", "고객센터"];

// 전달받은 메뉴명 기준으로 준비중 안내를 공통 노출합니다.
function handleShowPreparingAlert(menuName: string) {
  // 현재 미구현 메뉴는 동일한 안내 문구로 처리합니다.
  window.alert(`${menuName} 기능은 준비중입니다.`);
}

// ABOUT US 안내 문단 한 줄을 렌더링합니다.
function renderAboutLine(text: string, index: number) {
  // 문장 순서를 유지하기 위해 배열 인덱스를 키에 포함합니다.
  return (
    <p key={`about-us-line-${index}`} className={styles.aboutLine}>
      {text}
    </p>
  );
}

// Service 영역 메뉴 버튼 1건을 렌더링합니다.
function renderServiceMenuButton(menuName: string) {
  // 클릭 시 임시 안내를 노출하는 공통 핸들러를 연결합니다.
  return (
    <li key={`service-menu-${menuName}`}>
      <button type="button" className={styles.menuButton} onClick={() => handleShowPreparingAlert(menuName)}>
        {menuName}
      </button>
    </li>
  );
}

// react-shop 전 페이지 공통 푸터를 렌더링합니다.
export default function ShopFooter() {
  return (
    <footer className={styles.footerRoot}>
      <div className={styles.footerContainer}>
        <div className={styles.footerGrid}>
          {/* 좌측 회사 안내 영역을 노출합니다. */}
          <section>
            <h2 className={styles.sectionTitle}>ABOUT US</h2>
            <div className={styles.aboutWrap}>{ABOUT_US_LINES.map((line, index) => renderAboutLine(line, index))}</div>
          </section>

          {/* 공지 영역의 초기 플레이스홀더를 노출합니다. */}
          <section>
            <h2 className={styles.sectionTitle}>NOTICE</h2>
            <p className={styles.noticeText}>추후 공지 게시글이 노출됩니다.</p>
          </section>

          {/* 서비스 메뉴는 임시 알림 버튼으로 제공합니다. */}
          <section>
            <h2 className={styles.sectionTitle}>Service</h2>
            <ul className={styles.menuList}>{SERVICE_MENU_NAMES.map((menuName) => renderServiceMenuButton(menuName))}</ul>
          </section>

          {/* 약관/정책 링크와 문의 버튼을 제공합니다. */}
          <section>
            <h2 className={styles.sectionTitle}>Help</h2>
            <ul className={styles.menuList}>
              <li>
                <Link href="/terms" className={styles.menuLink}>
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/private" className={styles.menuLink}>
                  개인정보취급방침
                </Link>
              </li>
              <li>
                <button type="button" className={styles.menuButton} onClick={() => handleShowPreparingAlert("1:1문의하기")}>
                  1:1문의하기
                </button>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </footer>
  );
}
