import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import ShopHeader from "@/components/header/ShopHeader";
import ShopFooter from "@/components/footer/ShopFooter";
import ShopSessionKeeper from "@/components/login/ShopSessionKeeper";
import { fetchShopHeaderServerData } from "@/lib/server/shopHeaderServerApi";
import "./globals.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export const metadata: Metadata = {
  title: "react-shop",
  description: "style24 레퍼런스 기반 쇼핑몰 프론트",
};

// react-shop 전역 레이아웃을 렌더링합니다.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 헤더 공통 데이터(카테고리/브랜드)를 SSR로 조회합니다.
  const cookieStore = await cookies();
  const headerData = await fetchShopHeaderServerData();
  const isLoggedIn = (cookieStore.get("cust_no")?.value ?? "").trim() !== "";

  return (
    <html lang="ko">
      <body className="antialiased">
        <ShopSessionKeeper />
        <ShopHeader initialCategoryTree={headerData.categories} initialBrands={headerData.brands} isLoggedIn={isLoggedIn} />
        <main>{children}</main>
        <ShopFooter />
        <Script
          src="https://kit.fontawesome.com/ffb719f976.js"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
