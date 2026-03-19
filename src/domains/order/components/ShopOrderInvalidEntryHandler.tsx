"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ShopOrderInvalidEntryHandlerProps {
  goodsId: string;
}

// 주문서 잘못된 진입을 안내하고 이전 화면으로 이동시킵니다.
export default function ShopOrderInvalidEntryHandler({ goodsId }: ShopOrderInvalidEntryHandlerProps) {
  const router = useRouter();

  useEffect(() => {
    // 진입 실패 안내 후 상품상세 또는 장바구니 화면으로 이동합니다.
    window.alert("주문 정보가 맞지 않습니다.");
    if (goodsId.trim() !== "") {
      router.replace(`/goods?goodsId=${encodeURIComponent(goodsId.trim())}`);
      return;
    }
    router.replace("/cart");
  }, [goodsId, router]);

  return null;
}
