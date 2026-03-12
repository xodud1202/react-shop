"use client";

import ShopGoodsCard from "@/shared/components/goods/ShopGoodsCard";
import type { ShopMainGoodsItem } from "@/domains/main/types";

interface MainProductCardProps {
  item: ShopMainGoodsItem;
}

// 메인 화면 상품 카드 UI를 공통 상품 카드로 렌더링합니다.
export default function MainProductCard({ item }: MainProductCardProps) {
  return <ShopGoodsCard item={item} />;
}

