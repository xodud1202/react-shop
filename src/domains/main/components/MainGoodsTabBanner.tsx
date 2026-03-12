"use client";

import { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import type { ShopMainGoodsTab, ShopMainSection } from "@/domains/main/types";
import MainProductCard from "./MainProductCard";
import styles from "./ShopMain.module.css";

interface MainGoodsTabBannerProps {
  section: ShopMainSection;
}

// 탭 목록에서 기본 활성 탭 번호를 계산합니다.
function resolveDefaultTabNo(tabList: ShopMainGoodsTab[]): number | null {
  // 탭 목록이 비어있으면 기본 탭 번호를 null로 반환합니다.
  if (!Array.isArray(tabList) || tabList.length === 0) {
    return null;
  }

  // 첫 번째 탭 번호를 기본 탭으로 반환합니다.
  return tabList[0]?.bannerTabNo ?? null;
}

// 메인 상품배너A 섹션을 렌더링합니다.
export default function MainGoodsTabBanner({ section }: MainGoodsTabBannerProps) {
  // 탭 목록을 정렬해 렌더링 순서를 고정합니다.
  const tabList = useMemo(
    () => (Array.isArray(section.tabItems) ? [...section.tabItems].sort((left, right) => (left.dispOrd ?? 0) - (right.dispOrd ?? 0)) : []),
    [section.tabItems],
  );

  // 활성 탭 상태를 관리합니다.
  const [activeTabNo, setActiveTabNo] = useState<number | null>(() => resolveDefaultTabNo(tabList));

  // 탭 목록 변경 시 기본 탭 상태를 재설정합니다.
  useEffect(() => {
    setActiveTabNo(resolveDefaultTabNo(tabList));
  }, [tabList]);

  // 활성 탭 객체를 계산합니다.
  const activeTab = useMemo(() => tabList.find((tab) => tab.bannerTabNo === activeTabNo) ?? tabList[0] ?? null, [activeTabNo, tabList]);

  // 활성 탭 상품 목록을 정렬합니다.
  const activeGoodsList = useMemo(
    () =>
      Array.isArray(activeTab?.goodsItems)
        ? [...activeTab.goodsItems].sort((left, right) => (left.dispOrd ?? 0) - (right.dispOrd ?? 0))
        : [],
    [activeTab],
  );

  // 탭 데이터가 없으면 섹션을 렌더링하지 않습니다.
  if (tabList.length === 0) {
    return null;
  }

  return (
    <section className={`${styles.sectionBlock} ${styles.goodsTabSection}`}>
      <h2 className={styles.bannerTitle}>{section.bannerNm}</h2>

      <div className={styles.tabButtonRow}>
        {tabList.map((tab) => {
          // 탭 활성 상태를 계산합니다.
          const isActive = tab.bannerTabNo === (activeTab?.bannerTabNo ?? null);
          return (
            <button
              key={tab.bannerTabNo}
              type="button"
              className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ""}`}
              onClick={() => {
                // 클릭한 탭을 활성 탭으로 설정합니다.
                setActiveTabNo(tab.bannerTabNo);
              }}
            >
              #{tab.tabNm}
            </button>
          );
        })}
      </div>

      {activeGoodsList.length === 0 ? (
        <div className={styles.emptyGoodsBox}>노출 가능한 상품이 없습니다.</div>
      ) : (
        <Swiper
          className={styles.goodsTabSwiper}
          modules={[Navigation, Pagination]}
          slidesPerView={5}
          spaceBetween={18}
          centeredSlides={false}
          loop={activeGoodsList.length > 5}
          navigation
          pagination={{
            clickable: true,
          }}
          breakpoints={{
            0: {
              slidesPerView: 2,
              spaceBetween: 10,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 14,
            },
            1200: {
              slidesPerView: 5,
              spaceBetween: 18,
            },
          }}
        >
          {activeGoodsList.map((item) => (
            <SwiperSlide key={`${item.goodsId}-${item.bannerTabNo}`}>
              <MainProductCard item={item} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
}

