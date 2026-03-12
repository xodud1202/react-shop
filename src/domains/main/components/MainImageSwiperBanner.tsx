"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import type { ShopMainImageBannerItem, ShopMainSection } from "@/domains/main/types";
import styles from "./ShopMain.module.css";

interface MainImageSwiperBannerProps {
  section: ShopMainSection;
  variant: "hero" | "band";
}

// 배너 오픈 구분값에 맞는 링크 타겟을 반환합니다.
function resolveLinkTarget(openCd: string): "_self" | "_blank" {
  // 신규창 구분값(N)이면 새 탭으로 열리도록 반환합니다.
  if (openCd === "N") {
    return "_blank";
  }

  // 기본값은 현재 탭 이동으로 반환합니다.
  return "_self";
}

// 배너 아이템 클릭 링크를 렌더링합니다.
function renderImageBannerLink(
  item: ShopMainImageBannerItem,
  imageClassName: string,
  imageObjectFit: "contain" | "cover",
  imageSizes: string,
) {
  // 공통 배너 이미지를 next/image 기준으로 렌더링합니다.
  const imageNode = (
    <div className={`${styles.imageBannerMedia} ${imageClassName}`}>
      <Image
        className={styles.imageBannerImage}
        src={item.imgPath}
        alt={item.bannerNm || "배너 이미지"}
        fill
        sizes={imageSizes}
        style={{ objectFit: imageObjectFit }}
      />
    </div>
  );

  // URL이 없으면 링크 없이 이미지만 렌더링합니다.
  const hasUrl = typeof item.url === "string" && item.url.trim().length > 0;
  if (!hasUrl) {
    return imageNode;
  }

  // URL이 있으면 오픈 구분 코드에 맞춰 링크를 렌더링합니다.
  const target = resolveLinkTarget(item.bannerOpenCd);
  return (
    <a className={styles.imageBannerLink} href={item.url} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}>
      {imageNode}
    </a>
  );
}

// 메인 이미지형 배너 Swiper를 렌더링합니다.
export default function MainImageSwiperBanner({ section, variant }: MainImageSwiperBannerProps) {
  // 슬라이드 아이템 목록을 안전하게 정렬합니다.
  const imageItemList = Array.isArray(section.imageItems)
    ? [...section.imageItems].sort((left, right) => (left.dispOrd ?? 0) - (right.dispOrd ?? 0))
    : [];

  // 화면 타입에 맞는 이미지 비율 클래스를 선택합니다.
  const imageClassName = variant === "hero" ? styles.heroImage : styles.bandImage;
  const imageObjectFit = variant === "hero" ? "contain" : "cover";
  const imageSizes = variant === "hero" ? "(max-width: 900px) 100vw, 45vw" : "100vw";
  // 대배너인 경우 슬라이드 최대폭을 45vw로 제한합니다.
  const heroSlideStyle = variant === "hero" ? { maxWidth: "45vw" } : undefined;
  // 슬라이드가 2개 이상일 때만 loop/네비게이션/페이징을 활성화합니다.
  const hasMultipleSlides = imageItemList.length > 1;

  // 이미지 아이템이 없으면 아무것도 렌더링하지 않습니다.
  if (imageItemList.length === 0) {
    return null;
  }

  return (
    <section className={`${styles.sectionBlock} ${styles.imageBannerSection}`}>
      <Swiper
        className={styles.imageBannerSwiper}
        modules={[Autoplay, Navigation, Pagination]}
        slidesPerView="auto"
        centeredSlides
        loop={hasMultipleSlides}
        navigation={hasMultipleSlides}
        pagination={hasMultipleSlides ? { clickable: true } : false}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
      >
        {imageItemList.map((item) => (
          <SwiperSlide key={item.imageBannerNo} className={styles.imageBannerSlide} style={heroSlideStyle}>
            {renderImageBannerLink(item, imageClassName, imageObjectFit, imageSizes)}
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
