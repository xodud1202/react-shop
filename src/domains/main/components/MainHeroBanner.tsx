import type { ShopMainSection } from "@/domains/main/types";
import MainImageSwiperBanner from "./MainImageSwiperBanner";

interface MainHeroBannerProps {
  section: ShopMainSection;
}

// 메인 대배너 섹션을 렌더링합니다.
export default function MainHeroBanner({ section }: MainHeroBannerProps) {
  // 공통 이미지 배너 컴포넌트를 대배너 모드로 렌더링합니다.
  return <MainImageSwiperBanner section={section} variant="hero" />;
}
