"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getShopOrderPaymentFailPath } from "@/domains/order/api/orderApi";
import { buildShopOrderRetryPath } from "@/domains/order/utils/orderPathUtils";
import styles from "../payment-result.module.css";

// 결제 실패 페이지를 원래 주문서로 되돌립니다.
export default function ShopOrderFailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestInfo = useMemo(() => {
    const rawCartIdList = searchParams.getAll("cartId");
    const cartIdList = rawCartIdList
      .map((cartId) => Number(cartId))
      .filter((cartId) => Number.isFinite(cartId) && cartId > 0)
      .map((cartId) => Math.floor(cartId));
    return {
      payNo: Number(searchParams.get("payNo") ?? "0"),
      ordNo: searchParams.get("orderId") ?? "",
      goodsId: searchParams.get("goodsId") ?? "",
      code: searchParams.get("code") ?? "",
      message: searchParams.get("message") ?? "",
      cartIdList,
    };
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    const redirectToOrder = async (): Promise<void> => {
      if (requestInfo.payNo > 0 && requestInfo.ordNo.trim() !== "") {
        try {
          await fetch(getShopOrderPaymentFailPath(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              payNo: requestInfo.payNo,
              ordNo: requestInfo.ordNo,
              code: requestInfo.code,
              message: requestInfo.message,
            }),
          });
        } catch {
          // 실패 이력 저장에 실패해도 주문서 복귀는 계속 진행합니다.
        }
      }

      if (!active) {
        return;
      }

      router.replace(
        buildShopOrderRetryPath(requestInfo.cartIdList, requestInfo.goodsId, {
          code: requestInfo.code,
          message: requestInfo.message,
        }),
      );
    };

    void redirectToOrder();
    return () => {
      active = false;
    };
  }, [requestInfo, router]);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>PAYMENT FAIL</p>
        <h1 className={styles.title}>주문서로 이동 중입니다.</h1>
        <p className={styles.description}>결제가 완료되지 않아 이전 주문서로 다시 돌아갑니다.</p>
      </section>
    </main>
  );
}
