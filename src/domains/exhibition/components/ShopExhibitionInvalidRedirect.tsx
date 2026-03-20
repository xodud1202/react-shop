"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ShopExhibitionInvalidRedirectProps {
  fallbackHref?: string;
}

// 기획전 상세 진입이 불가능할 때 이전 화면 또는 목록으로 이동시킵니다.
export default function ShopExhibitionInvalidRedirect({
  fallbackHref = "/exhibition/list",
}: ShopExhibitionInvalidRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    // 히스토리가 있으면 뒤로가고, 직접 진입이면 목록으로 대체 이동합니다.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.replace(fallbackHref);
  }, [fallbackHref, router]);

  return <p>기획전 정보를 확인하고 있습니다.</p>;
}
