"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// 페이지 이동 시 쇼핑몰 로그인 세션과 쿠키 만료 시간을 갱신합니다.
export default function ShopSessionKeeper() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 현재 경로가 바뀔 때마다 세션 갱신 API를 호출합니다.
  useEffect(() => {
    void fetch("/api/shop/auth/session/refresh", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    }).catch(() => {
      // 세션 갱신 실패는 화면을 막지 않고 무시합니다.
    });
  }, [pathname, searchParams]);

  return null;
}
