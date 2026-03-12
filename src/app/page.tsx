import MainBandBanner from "@/domains/main/components/MainBandBanner";
import MainGoodsListBanner from "@/domains/main/components/MainGoodsListBanner";
import MainGoodsTabBanner from "@/domains/main/components/MainGoodsTabBanner";
import MainHeroBanner from "@/domains/main/components/MainHeroBanner";
import styles from "@/domains/main/components/ShopMain.module.css";
import { fetchShopMainServerData } from "@/domains/main/api/mainServerApi";
import type { ShopMainSection } from "@/domains/main/types";

// 메인 섹션 목록을 노출 순서 기준으로 정렬합니다.
function resolveOrderedSectionList(sectionList: ShopMainSection[]): ShopMainSection[] {
  // 원본 배열 변경을 피하기 위해 복사본을 정렬해 반환합니다.
  return [...sectionList].sort((left, right) => (left.dispOrd ?? 0) - (right.dispOrd ?? 0));
}

// 배너 구분 코드에 맞는 섹션 컴포넌트를 렌더링합니다.
function renderSectionByBannerDiv(section: ShopMainSection) {
  // 배너 구분 코드별 컴포넌트를 분기합니다.
  if (section.bannerDivCd === "BANNER_DIV_01") {
    return <MainHeroBanner key={section.bannerNo} section={section} />;
  }
  if (section.bannerDivCd === "BANNER_DIV_02") {
    return <MainGoodsTabBanner key={section.bannerNo} section={section} />;
  }
  if (section.bannerDivCd === "BANNER_DIV_03") {
    return <MainBandBanner key={section.bannerNo} section={section} />;
  }
  if (section.bannerDivCd === "BANNER_DIV_04") {
    return <MainGoodsListBanner key={section.bannerNo} section={section} />;
  }

  // 미지원 배너 구분은 렌더링하지 않습니다.
  return null;
}

// 쇼핑몰 메인 화면을 렌더링합니다.
export default async function Home() {
  // 서버 사이드에서 메인 섹션 데이터를 조회합니다.
  const shopMainData = await fetchShopMainServerData();

  // 노출 순서 기준으로 섹션 목록을 정렬합니다.
  const orderedSectionList = resolveOrderedSectionList(shopMainData.sections);

  return (
    <section className={styles.shopMainPage}>
      <div className={styles.shopMainContainer}>
        {orderedSectionList.length === 0 ? (
          <p className={styles.emptyState}>메인 화면에 노출할 배너가 없습니다.</p>
        ) : (
          orderedSectionList.map((section) => renderSectionByBannerDiv(section))
        )}
      </div>
    </section>
  );
}

