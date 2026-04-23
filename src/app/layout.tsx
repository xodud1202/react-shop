import type { Metadata } from "next";
import Script from "next/script";
import ShopHeader from "@/domains/header/components/ShopHeader";
import ShopFooter from "@/domains/footer/components/ShopFooter";
import { fetchShopHeaderServerData } from "@/domains/header/api/headerServerApi";
import ShopAuthProvider from "@/shared/auth/ShopAuthProvider";
import { createShopPageMetadata } from "@/shared/seo/shopMetadata";
import { fetchShopServerRequestContext } from "@/shared/server/shopAuthServer";
import "./globals.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export const metadata: Metadata = createShopPageMetadata();

// react-shop 전역 레이아웃을 렌더링합니다.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 헤더 공통 데이터와 현재 로그인 상태를 SSR로 함께 조회합니다.
  const [headerData, requestContext] = await Promise.all([
    fetchShopHeaderServerData(),
    fetchShopServerRequestContext(),
  ]);

  return (
    <html lang="ko">
      <body className="antialiased">
        <ShopAuthProvider initialState={requestContext.authState}>
          <ShopHeader initialCategoryTree={headerData.categories} initialBrands={headerData.brands} />
          <main>{children}</main>
          <ShopFooter />
        </ShopAuthProvider>
        <Script
          src="https://kit.fontawesome.com/ffb719f976.js"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
