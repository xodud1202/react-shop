"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { emitShopAuthChangeEvent } from "@/shared/auth/shopAuthEvent";
import { requestShopClientApi } from "@/shared/client/shopClientApi";

// 세션 갱신 API 응답의 최소 필드 타입입니다.
interface ShopSessionRefreshResponse {
  authenticated?: boolean;
  custNo?: number;
}

// 페이지 이동 시 쇼핑몰 로그인 세션과 쿠키 만료 시간을 갱신합니다.
export default function ShopSessionKeeper() {
  const pathname = usePathname();

  // 현재 경로가 바뀔 때마다 세션 갱신 API를 호출합니다.
  useEffect(() => {
    const refreshShopSession = async (): Promise<void> => {
      // 현재 경로 기준으로 세션 갱신 API를 호출해 로그인 상태를 동기화합니다.
      const result = await requestShopClientApi<ShopSessionRefreshResponse>("/api/shop/auth/session/refresh", {
        method: "POST",
        cache: "no-store",
      });
      if (!result.ok || !result.data) {
        return;
      }

      // 세션 갱신 응답의 인증 상태를 헤더 컴포넌트에 브로드캐스트합니다.
      const isAuthenticated = result.data.authenticated === true;
      emitShopAuthChangeEvent({
        isLoggedIn: isAuthenticated,
        custNo: isAuthenticated && result.data.custNo ? String(result.data.custNo) : "",
      });
    };

    void refreshShopSession();
  }, [pathname]);

  return null;
}
