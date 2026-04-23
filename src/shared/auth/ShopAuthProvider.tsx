"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { requestShopClientApi } from "@/shared/client/shopClientApi";
import { createUnauthenticatedShopAuthState, normalizeShopAuthState, type ShopAuthState } from "@/shared/auth/shopAuth";

interface ShopAuthContextValue {
  authState: ShopAuthState;
  isRefreshing: boolean;
  refreshAuth: () => Promise<ShopAuthState>;
}

interface ShopAuthProviderProps {
  initialState: ShopAuthState;
  children: ReactNode;
}

const ShopAuthContext = createContext<ShopAuthContextValue | null>(null);

// 쇼핑몰 인증 상태를 클라이언트 전역에서 관리합니다.
export default function ShopAuthProvider({ initialState, children }: ShopAuthProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [authState, setAuthState] = useState<ShopAuthState>(initialState);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFirstRenderRef = useRef(true);
  const searchValue = searchParams.toString();

  // /api/shop/auth/me 응답을 조회해 현재 인증 상태를 새로 고칩니다.
  const refreshAuth = async (): Promise<ShopAuthState> => {
    setIsRefreshing(true);
    try {
      const result = await requestShopClientApi<ShopAuthState>("/api/shop/auth/me", {
        method: "GET",
        cache: "no-store",
      });
      const nextAuthState = result.ok && result.data ? normalizeShopAuthState(result.data) : createUnauthenticatedShopAuthState();
      setAuthState(nextAuthState);
      return nextAuthState;
    } finally {
      setIsRefreshing(false);
    }
  };

  // 서버에서 다시 계산된 초기 인증 상태가 오면 클라이언트 상태도 맞춥니다.
  useEffect(() => {
    setAuthState(initialState);
  }, [initialState]);

  // 경로 또는 검색 파라미터가 바뀌면 현재 인증 상태를 한 번만 다시 확인합니다.
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    void refreshAuth();
  }, [pathname, searchValue]);

  return (
    <ShopAuthContext.Provider
      value={{
        authState,
        isRefreshing,
        refreshAuth,
      }}
    >
      {children}
    </ShopAuthContext.Provider>
  );
}

// 쇼핑몰 인증 상태 컨텍스트를 읽는 공용 훅입니다.
export function useShopAuth(): ShopAuthContextValue {
  const context = useContext(ShopAuthContext);
  if (context) {
    return context;
  }
  throw new Error("ShopAuthProvider 내부에서만 useShopAuth를 사용할 수 있습니다.");
}
