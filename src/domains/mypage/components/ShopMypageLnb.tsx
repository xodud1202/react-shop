"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./ShopMypageLnb.module.css";

interface ShopMypageLnbMenuItem {
  label: string;
  href?: string;
  disabled?: boolean;
  sectionBreak?: boolean;
  children?: ShopMypageLnbMenuItem[];
}

const SHOP_MYPAGE_LNB_MENU_LIST: ShopMypageLnbMenuItem[] = [
  {
    label: "주문현황",
    children: [
      { label: "주문내역", href: "/mypage/order" },
      { label: "취소내역", href: "/mypage/cancel" },
      { label: "교환내역", href: "/mypage/orders/exchange", disabled: true },
      { label: "반품내역", href: "/mypage/return" },
    ],
  },
  { label: "리뷰", href: "/mypage/review", disabled: true },
  { label: "쿠폰함", href: "/mypage/coupon" },
  { label: "포인트 내역", href: "/mypage/point" },
  { label: "위시리스트", href: "/mypage/wish" },
  { label: "1:1문의", href: "/mypage/inquiry", disabled: true },
  { label: "배송지 설정", href: "/mypage/delivery", disabled: true, sectionBreak: true },
  { label: "개인정보 변경", href: "/mypage/profile", disabled: true },
];

// 현재 경로와 메뉴 링크의 활성 상태를 계산합니다.
function isActiveMenu(pathname: string, href: string | undefined): boolean {
  // 메뉴 링크가 없으면 비활성으로 처리합니다.
  if (!href) {
    return false;
  }

  // 동일 경로 또는 하위 경로를 활성 상태로 처리합니다.
  return pathname === href || pathname.startsWith(`${href}/`);
}

// 마이페이지 LNB 메뉴를 렌더링합니다.
export default function ShopMypageLnb() {
  const pathname = usePathname();

  // 개별 메뉴의 링크/텍스트 라벨을 렌더링합니다.
  const renderMenuLabel = (menuItem: ShopMypageLnbMenuItem, isChild: boolean) => {
    const isDisabledMenu = menuItem.disabled === true;
    const isActive = isActiveMenu(pathname, menuItem.href);
    const labelClassName = [
      isChild ? styles.menuLabelChild : styles.menuLabelParent,
      isDisabledMenu ? styles.menuLabelDisabled : "",
      isActive ? styles.menuLabelActive : "",
    ]
      .filter((className) => className !== "")
      .join(" ");

    // 활성 링크가 있는 메뉴는 Link로 렌더링합니다.
    if (menuItem.href && !isDisabledMenu) {
      return (
        <Link href={menuItem.href} className={labelClassName}>
          {menuItem.label}
        </Link>
      );
    }

    // 비활성 메뉴는 클릭 불가 텍스트로 렌더링합니다.
    return (
      <span className={labelClassName} aria-disabled={isDisabledMenu}>
        {menuItem.label}
      </span>
    );
  };

  return (
    <nav className={styles.lnbRoot} aria-label="마이페이지 메뉴">
      <Link href="/mypage/main" className={styles.mainLink}>
        마이페이지
      </Link>

      <ul className={styles.menuList}>
        {SHOP_MYPAGE_LNB_MENU_LIST.map((menuItem) => (
          <li
            key={menuItem.label}
            className={`${styles.menuItem} ${menuItem.sectionBreak ? styles.menuItemSectionBreak : ""}`.trim()}
          >
            {renderMenuLabel(menuItem, false)}

            {(menuItem.children?.length ?? 0) > 0 ? (
              <ul className={styles.childMenuList}>
                {menuItem.children?.map((childItem) => (
                  <li key={childItem.label} className={styles.childMenuItem}>
                    {renderMenuLabel(childItem, true)}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}
