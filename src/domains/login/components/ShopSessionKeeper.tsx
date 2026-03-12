"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { emitShopAuthChangeEvent } from "@/shared/auth/shopAuthEvent";

// 세션 갱신 API 응답의 최소 필드 타입입니다.
interface ShopSessionRefreshResponse {
  authenticated?: boolean;
  custNo?: number;
}

// 페이지 이동 시 쇼핑몰 로그인 세션과 쿠키 만료 시간을 갱신합니다.
export default function ShopSessionKeeper() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 현재 경로가 바뀔 때마다 세션 갱신 API를 호출합니다.
  useEffect(() => {
    // 현재 경로 기준으로 세션 갱신 API를 호출해 로그인 상태를 동기화합니다.
    void fetch("/api/shop/auth/session/refresh", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        // 응답이 정상이 아니면 로그인 상태 동기화를 생략합니다.
        if (!response.ok) {
          return;
        }

        // 세션 갱신 응답의 인증 상태를 헤더 컴포넌트에 브로드캐스트합니다.
        const payload = (await response.json()) as ShopSessionRefreshResponse;
        const isAuthenticated = payload.authenticated === true;
        emitShopAuthChangeEvent({
          isLoggedIn: isAuthenticated,
          custNo: isAuthenticated && payload.custNo ? String(payload.custNo) : "",
        });
      })
      .catch(() => {
        // 세션 갱신 실패는 화면을 막지 않고 무시합니다.
      });
  }, [pathname, searchParams]);

  return null;
}

