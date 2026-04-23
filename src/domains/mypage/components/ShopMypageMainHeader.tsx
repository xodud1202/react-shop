"use client";

import { useMemo } from "react";
import { useShopAuth } from "@/shared/auth/ShopAuthProvider";
import styles from "./ShopMypageMainHeader.module.css";

// 표시값 공백 여부를 확인해 기본값으로 보정합니다.
function resolveDisplayText(value: string | undefined, fallbackValue: string): string {
  const normalizedValue = (value ?? "").trim();
  if (normalizedValue === "") {
    return fallbackValue;
  }
  return normalizedValue;
}

// 마이페이지 메인 상단의 고객명/등급명 타이틀을 렌더링합니다.
export default function ShopMypageMainHeader() {
  const { authState, isRefreshing } = useShopAuth();

  // 화면 상단에 노출할 고객/등급 타이틀 텍스트를 계산합니다.
  const titleText = useMemo(() => {
    if (isRefreshing && !authState.authenticated) {
      return "고객정보를 불러오는 중입니다.";
    }
    const resolvedCustNm = resolveDisplayText(authState.custNm, "고객");
    const resolvedCustGradeNm = resolveDisplayText(
      authState.custGradeNm,
      resolveDisplayText(authState.custGradeCd, "등급 미확인"),
    );
    return `${resolvedCustNm} / ${resolvedCustGradeNm}`;
  }, [authState.authenticated, authState.custGradeCd, authState.custGradeNm, authState.custNm, isRefreshing]);

  return (
    <header className={styles.mainHeader}>
      <h1 className={styles.mainTitle}>{titleText}</h1>
    </header>
  );
}
