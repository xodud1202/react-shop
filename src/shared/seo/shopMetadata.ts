import type { Metadata } from "next";

const SHOP_SITE_NAME = "react-shop";
const SHOP_DEFAULT_DESCRIPTION = "style24 레퍼런스 기반 쇼핑몰 프론트";

interface ShopPageMetadataOptions {
  title?: string;
  description?: string;
}

// 메타 title 값을 사이트명 규칙에 맞게 조합합니다.
function resolveMetadataTitle(title: string | undefined): string {
  const normalizedTitle = title?.trim() ?? "";
  if (normalizedTitle === "") {
    return SHOP_SITE_NAME;
  }
  return `${normalizedTitle} | ${SHOP_SITE_NAME}`;
}

// 공통 페이지 메타데이터를 생성합니다.
export function createShopPageMetadata({ title, description }: ShopPageMetadataOptions = {}): Metadata {
  return {
    title: resolveMetadataTitle(title),
    description: description?.trim() || SHOP_DEFAULT_DESCRIPTION,
  };
}
