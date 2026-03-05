"use client";

import type { ShopMainSection } from "@/types/shopMain";
import MainImageSwiperBanner from "./MainImageSwiperBanner";

interface MainBandBannerProps {
  section: ShopMainSection;
}

// 메인 띠배너 섹션을 렌더링합니다.
export default function MainBandBanner({ section }: MainBandBannerProps) {
  // 공통 이미지 배너 컴포넌트를 띠배너 모드로 렌더링합니다.
  return <MainImageSwiperBanner section={section} variant="band" />;
}
