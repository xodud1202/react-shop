"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { emitShopAuthChangeEvent, subscribeShopAuthChangeEvent } from "@/shared/auth/shopAuthEvent";
import type { ShopHeaderBrand, ShopHeaderCategoryTree } from "@/domains/header/types";
import { buildCategoryHref, resolveInitialLevel2CategoryId } from "@/domains/header/utils/headerNavigationUtils";
import styles from "./ShopHeader.module.css";

const DEFAULT_LOGO_URL =
  "https://image.xodud1202.kro.kr/publist/HDD1/Media/nas/upload/common/xodud1202_logo_black.png";

interface ShopHeaderProps {
  initialCategoryTree: ShopHeaderCategoryTree[];
  initialBrands: ShopHeaderBrand[];
  isLoggedIn: boolean;
}

// 스타일24 레퍼런스 기반 1라인 헤더를 렌더링합니다.
export default function ShopHeader({ initialCategoryTree, initialBrands, isLoggedIn }: ShopHeaderProps) {
  const router = useRouter();
  const [categoryTree, setCategoryTree] = useState<ShopHeaderCategoryTree[]>(initialCategoryTree);
  const [brands, setBrands] = useState<ShopHeaderBrand[]>(initialBrands);
  const [isLoggedInState, setIsLoggedInState] = useState<boolean>(isLoggedIn);
  const [isSearchLayerOpen, setIsSearchLayerOpen] = useState(false);
  const [isCategoryLayerOpen, setIsCategoryLayerOpen] = useState(false);
  const [isBrandLayerOpen, setIsBrandLayerOpen] = useState(false);
  const [isLogoutSubmitting, setIsLogoutSubmitting] = useState(false);
  const [activeLevel1CategoryId, setActiveLevel1CategoryId] = useState<string | null>(initialCategoryTree[0]?.categoryId ?? null);
  const [activeLevel2CategoryId, setActiveLevel2CategoryId] = useState<string | null>(
    initialCategoryTree[0]?.children[0]?.categoryId ?? null,
  );
  const searchLayerRef = useRef<HTMLDivElement | null>(null);
  const shouldShowPrimaryMenus = true;

  // SSR로 받은 헤더 데이터를 상태값으로 동기화합니다.
  useEffect(() => {
    setCategoryTree(initialCategoryTree);
    setBrands(initialBrands);
    setActiveLevel1CategoryId(initialCategoryTree[0]?.categoryId ?? null);
    setActiveLevel2CategoryId(initialCategoryTree[0]?.children[0]?.categoryId ?? null);
  }, [initialCategoryTree, initialBrands]);

  // SSR 로그인 상태가 갱신되면 클라이언트 로그인 상태도 동기화합니다.
  useEffect(() => {
    setIsLoggedInState(isLoggedIn);
  }, [isLoggedIn]);

  // 로그인/로그아웃 이벤트를 구독해 헤더 아이콘 상태를 즉시 갱신합니다.
  useEffect(() => {
    return subscribeShopAuthChangeEvent((detail) => {
      setIsLoggedInState(detail.isLoggedIn);
    });
  }, []);

  // 검색 레이어 바깥 클릭 시 레이어를 닫습니다.
  useEffect(() => {
    if (!isSearchLayerOpen) {
      return;
    }

    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (!searchLayerRef.current) {
        return;
      }

      if (event.target instanceof Node && !searchLayerRef.current.contains(event.target)) {
        setIsSearchLayerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [isSearchLayerOpen]);

  // 활성 1차 카테고리 객체를 계산합니다.
  const activeLevel1Category = useMemo(
    () => categoryTree.find((item) => item.categoryId === activeLevel1CategoryId) ?? null,
    [categoryTree, activeLevel1CategoryId],
  );

  // 활성 2차 카테고리 객체를 계산합니다.
  const activeLevel2Category = useMemo(
    () => activeLevel1Category?.children.find((item) => item.categoryId === activeLevel2CategoryId) ?? null,
    [activeLevel1Category, activeLevel2CategoryId],
  );

  // 검색 버튼 클릭 시 검색 레이어를 토글합니다.
  const handleToggleSearchLayer = () => {
    setIsCategoryLayerOpen(false);
    setIsBrandLayerOpen(false);
    setIsSearchLayerOpen((prev) => !prev);
  };

  // 검색 기능 임시 동작을 처리합니다.
  const handleSubmitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const keyword = String(formData.get("searchKeyword") ?? "").trim();
    if (keyword === "") {
      window.alert("검색어를 입력해주세요.");
      return;
    }

    window.alert(`"${keyword}" 검색 기능은 준비중입니다.`);
    setIsSearchLayerOpen(false);
  };

  // 1차 카테고리 hover 시 2차/3차 레이어를 엽니다.
  const handleEnterLevel1Category = (categoryId: string) => {
    setIsBrandLayerOpen(false);
    setIsSearchLayerOpen(false);
    setIsCategoryLayerOpen(true);
    setActiveLevel1CategoryId(categoryId);
    setActiveLevel2CategoryId(resolveInitialLevel2CategoryId(categoryTree, categoryId));
  };

  // 카테고리 레이어를 닫습니다.
  const handleCloseCategoryLayer = () => {
    setIsCategoryLayerOpen(false);
  };

  // 브랜드 레이어를 엽니다.
  const handleOpenBrandLayer = () => {
    setIsCategoryLayerOpen(false);
    setIsSearchLayerOpen(false);
    setIsBrandLayerOpen(true);
  };

  // 브랜드 레이어를 닫습니다.
  const handleCloseBrandLayer = () => {
    setIsBrandLayerOpen(false);
  };

  // 기획전 메뉴 진입 시 열려있는 레이어를 닫습니다.
  const handleEnterExhibitionMenu = () => {
    setIsCategoryLayerOpen(false);
    setIsBrandLayerOpen(false);
    setIsSearchLayerOpen(false);
  };

  // 임시 메뉴 클릭 동작을 처리합니다.
  const handlePlaceholderClick = (menuName: string) => {
    window.alert(`${menuName} 기능은 준비중입니다.`);
  };

  // 로그아웃 버튼 클릭 시 세션/쿠키를 만료하고 헤더 상태를 갱신합니다.
  const handleClickLogout = async () => {
    if (isLogoutSubmitting) {
      return;
    }

    try {
      // 로그아웃 API를 호출해 서버 세션과 로그인 쿠키를 만료합니다.
      setIsLogoutSubmitting(true);
      const response = await fetch("/api/shop/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("로그아웃 처리에 실패했습니다.");
      }

      // 헤더 로그인 상태를 즉시 비로그인으로 갱신하고 화면을 새로고침합니다.
      emitShopAuthChangeEvent({
        isLoggedIn: false,
        custNo: "",
      });
      setIsSearchLayerOpen(false);
      router.refresh();
    } catch (error) {
      // 로그아웃 실패 시 사용자에게 안내 문구를 노출합니다.
      window.alert(error instanceof Error ? error.message : "로그아웃 처리에 실패했습니다.");
    } finally {
      setIsLogoutSubmitting(false);
    }
  };

  return (
    <header className={styles.headerRoot}>
      <div className={styles.desktopHeader}>
        <div className={styles.headerContainer}>
          <div className={styles.headerRow}>
            <div className={styles.logoWrap}>
              <Link href="/" aria-label="메인으로 이동">
                <Image src={DEFAULT_LOGO_URL} alt="xodud1202 로고" width={160} height={38} style={{ height: "auto" }} priority />
              </Link>
            </div>

            {shouldShowPrimaryMenus && (
              <div className={styles.centerMenus}>
                <div className={styles.brandMenuGroup} onMouseEnter={handleOpenBrandLayer} onMouseLeave={handleCloseBrandLayer}>
                  <button type="button" className={styles.navButton} onClick={() => handlePlaceholderClick("브랜드")}>
                    브랜드
                  </button>

                  {isBrandLayerOpen && (
                    <div className={styles.layerPanel}>
                      <div className={styles.brandLayerInner}>
                        <h3 className={styles.layerTitle}>BRAND</h3>
                        <ul className={styles.brandGrid}>
                          {brands.map((brand) => (
                            <li key={brand.brandNo}>
                              <button
                                type="button"
                                className={styles.brandItem}
                                onClick={() => handlePlaceholderClick(`${brand.brandNm} 브랜드관`)}
                              >
                                <div className={styles.brandLogoWrap}>
                                  {brand.brandLogoPath ? (
                                    <Image
                                      src={brand.brandLogoPath}
                                      alt={`${brand.brandNm} 로고`}
                                      width={62}
                                      height={62}
                                      className={styles.brandLogoImage}
                                    />
                                  ) : (
                                    <span className={styles.brandLogoFallback}>{brand.brandNm.slice(0, 1)}</span>
                                  )}
                                </div>
                                <span className={styles.brandName}>{brand.brandNm}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.categoryMenuGroup} onMouseLeave={handleCloseCategoryLayer}>
                  {categoryTree.map((level1Category) => (
                    <Link
                      key={level1Category.categoryId}
                      href={buildCategoryHref(level1Category.categoryId)}
                      className={styles.navButton}
                      onMouseEnter={() => handleEnterLevel1Category(level1Category.categoryId)}
                    >
                      {level1Category.categoryNm}
                    </Link>
                  ))}

                  <span className={styles.menuDivider} aria-hidden="true">
                    |
                  </span>
                  <Link href="/exhibition/list" className={styles.navButton} onMouseEnter={handleEnterExhibitionMenu}>
                    기획전
                  </Link>

                  {isCategoryLayerOpen && activeLevel1Category && (
                    <div className={styles.categoryLayer}>
                      <div className={styles.categoryLayerInner}>
                        <div className={styles.level2Column}>
                          <h3 className={styles.layerTitle}>{activeLevel1Category.categoryNm}</h3>
                          <ul className={styles.level2List}>
                            {activeLevel1Category.children.map((level2Category) => (
                              <li key={level2Category.categoryId}>
                                <Link
                                  href={buildCategoryHref(level2Category.categoryId)}
                                  className={
                                    activeLevel2CategoryId === level2Category.categoryId
                                      ? `${styles.level2Button} ${styles.level2ButtonActive}`
                                      : styles.level2Button
                                  }
                                  onMouseEnter={() => setActiveLevel2CategoryId(level2Category.categoryId)}
                                >
                                  {level2Category.categoryNm}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className={styles.level3Column}>
                          <h3 className={styles.layerTitle}>하위 카테고리</h3>
                          <ul className={styles.level3List}>
                            {(activeLevel2Category?.children ?? []).map((level3Category) => (
                              <li key={level3Category.categoryId}>
                                <Link href={buildCategoryHref(level3Category.categoryId)} className={styles.level3Button}>
                                  {level3Category.categoryNm}
                                </Link>
                              </li>
                            ))}
                          </ul>
                          {(activeLevel2Category?.children ?? []).length === 0 && (
                            <p className={styles.emptyText}>등록된 하위 카테고리가 없습니다.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={styles.rightActions}>
              <div className={styles.searchLayerWrap} ref={searchLayerRef}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={handleToggleSearchLayer}
                  aria-label="검색 열기"
                >
                  <i className="fa-solid fa-magnifying-glass" />
                </button>

                {isSearchLayerOpen && (
                  <div className={styles.searchLayer}>
                    <form className={styles.searchForm} onSubmit={handleSubmitSearch}>
                      <input
                        type="text"
                        name="searchKeyword"
                        placeholder="검색어를 입력해주세요"
                        className={styles.searchInput}
                        autoFocus
                      />
                      <button type="submit" className={styles.searchSubmitButton} aria-label="검색">
                        <i className="fa-solid fa-magnifying-glass" />
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {isLoggedInState ? (
                <>
                  <Link className={styles.iconButton} href="/mypage/wish" aria-label="찜">
                    <i className="fa-regular fa-heart" />
                  </Link>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => handlePlaceholderClick("장바구니")}
                    aria-label="장바구니"
                  >
                    <i className="fa-solid fa-bag-shopping" />
                  </button>
                  <Link className={styles.iconButton} href="/mypage/main" aria-label="마이페이지">
                    <i className="fa-regular fa-user" />
                  </Link>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={handleClickLogout}
                    aria-label="로그아웃"
                    disabled={isLogoutSubmitting}
                  >
                    <i className="fa-solid fa-right-from-bracket" />
                  </button>
                </>
              ) : (
                <Link className={styles.iconButton} href="/login/form" aria-label="로그인">
                  <i className="fa-solid fa-right-to-bracket" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mobileHeader}>
        <div className={styles.mobileHeaderRow}>
          <Link href="/" aria-label="메인으로 이동">
            <Image src={DEFAULT_LOGO_URL} alt="xodud1202 로고" width={130} height={30} style={{ height: "auto" }} />
          </Link>
          <button type="button" className={styles.iconButton} onClick={handleToggleSearchLayer} aria-label="검색 열기">
            <i className="fa-solid fa-magnifying-glass" />
          </button>
        </div>
      </div>
    </header>
  );
}
