"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./ShopMypageOrderSection.module.css";

interface ShopMypageOrderInvalidRedirectProps {
  fallbackHref?: string;
  alertMessage?: string;
}

// 주문상세 진입이 불가능할 때 주문내역 페이지로 이동시킵니다.
export default function ShopMypageOrderInvalidRedirect({
  fallbackHref = "/mypage/order",
  alertMessage = "주문 정보를 찾을 수 없어 주문내역으로 이동합니다.",
}: ShopMypageOrderInvalidRedirectProps) {
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // 중복 alert 및 중복 이동을 방지합니다.
    if (hasRedirectedRef.current) {
      return;
    }
    hasRedirectedRef.current = true;

    // 안내 문구를 먼저 노출한 뒤 주문내역 페이지로 이동합니다.
    window.alert(alertMessage);
    router.replace(fallbackHref);
  }, [alertMessage, fallbackHref, router]);

  return <div className={styles.invalidState}>{alertMessage}</div>;
}
