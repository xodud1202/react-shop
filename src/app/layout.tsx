import type { Metadata } from "next";
import Script from "next/script";
import ShopHeader from "@/components/header/ShopHeader";
import { fetchShopHeaderServerData } from "@/lib/server/shopHeaderServerApi";
import "./globals.css";
import "swiper/css";

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
  const headerData = await fetchShopHeaderServerData();

  return (
    <html lang="ko">
      <body className="antialiased">
        <ShopHeader initialCategoryTree={headerData.categories} initialBrands={headerData.brands} />
        <main>{children}</main>
        <Script
          src="https://kit.fontawesome.com/ffb719f976.js"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
