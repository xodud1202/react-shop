"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./ShopMypageMainHeader.module.css";

interface ShopSessionRefreshResponse {
  authenticated?: boolean;
  custNm?: string;
  custGradeCd?: string;
  custGradeNm?: string;
}

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
  const [custNm, setCustNm] = useState("");
  const [custGradeNm, setCustGradeNm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 마운트 시 세션 갱신 API를 호출해 고객명/등급명을 조회합니다.
  useEffect(() => {
    let isSubscribed = true;

    const fetchMypageMemberInfo = async (): Promise<void> => {
      try {
        // 세션 갱신 API 응답에서 고객명/등급명 정보를 가져옵니다.
        const response = await fetch("/api/shop/auth/session/refresh", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok || !isSubscribed) {
          return;
        }

        // 인증 상태인 경우에만 타이틀 정보를 업데이트합니다.
        const payload = (await response.json()) as ShopSessionRefreshResponse;
        if (payload.authenticated !== true) {
          return;
        }

        // 등급명 미존재 시 등급코드로 대체해 화면 문구를 보정합니다.
        setCustNm(resolveDisplayText(payload.custNm, ""));
        setCustGradeNm(resolveDisplayText(payload.custGradeNm, resolveDisplayText(payload.custGradeCd, "")));
      } catch {
        // 네트워크 오류는 화면을 막지 않고 빈 상태로 유지합니다.
      } finally {
        // 요청 완료 시 로딩 문구를 해제합니다.
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    void fetchMypageMemberInfo();
    return () => {
      isSubscribed = false;
    };
  }, []);

  // 화면 상단에 노출할 고객/등급 타이틀 텍스트를 계산합니다.
  const titleText = useMemo(() => {
    if (isLoading) {
      return "고객정보를 불러오는 중입니다.";
    }
    const resolvedCustNm = resolveDisplayText(custNm, "고객");
    const resolvedCustGradeNm = resolveDisplayText(custGradeNm, "등급 미확인");
    return `${resolvedCustNm} / ${resolvedCustGradeNm}`;
  }, [custGradeNm, custNm, isLoading]);

  return (
    <header className={styles.mainHeader}>
      <h1 className={styles.mainTitle}>{titleText}</h1>
    </header>
  );
}
