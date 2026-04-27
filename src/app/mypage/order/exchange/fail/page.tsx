"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { requestShopClientApi } from "@/shared/client/shopClientApi";
import styles from "../../../../order/payment-result.module.css";

// 교환 배송비 결제 실패 페이지를 주문상세로 되돌립니다.
export default function ShopMypageOrderExchangeFailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestInfo = useMemo(() => {
    return {
      payNo: Number(searchParams.get("payNo") ?? "0"),
      clmNo: searchParams.get("orderId") ?? "",
      originOrdNo: searchParams.get("originOrdNo") ?? "",
      code: searchParams.get("code") ?? "",
      message: searchParams.get("message") ?? "",
    };
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    // 결제 실패 이력을 저장하고 원 주문상세로 복귀합니다.
    const redirectToOrderDetail = async (): Promise<void> => {
      if (requestInfo.payNo > 0 && requestInfo.clmNo.trim() !== "") {
        try {
          await requestShopClientApi("/api/shop/mypage/order/exchange/payment/fail", {
            method: "POST",
            body: {
              payNo: requestInfo.payNo,
              clmNo: requestInfo.clmNo,
              code: requestInfo.code,
              message: requestInfo.message,
            },
          });
        } catch {
          // 실패 이력 저장에 실패해도 주문상세 복귀는 계속 진행합니다.
        }
      }

      if (!active) {
        return;
      }

      const normalizedOrdNo = requestInfo.originOrdNo.trim();
      router.replace(normalizedOrdNo === "" ? "/mypage/order" : `/mypage/order/${encodeURIComponent(normalizedOrdNo)}`);
    };

    void redirectToOrderDetail();
    return () => {
      active = false;
    };
  }, [requestInfo, router]);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>PAYMENT FAIL</p>
        <h1 className={styles.title}>주문상세로 이동 중입니다.</h1>
        <p className={styles.description}>교환 배송비 결제가 완료되지 않아 교환신청을 철회하고 주문상세로 돌아갑니다.</p>
      </section>
    </main>
  );
}
