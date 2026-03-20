"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getShopOrderPaymentConfirmPath, normalizeShopOrderPaymentConfirmResponse } from "@/domains/order/api/orderApi";
import type { ShopOrderPaymentConfirmResponse } from "@/domains/order/types";
import styles from "../payment-result.module.css";

// 금액을 원화 문자열로 포맷합니다.
function formatPrice(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString("ko-KR") : "0";
}

// 주문 결제 완료 페이지를 렌더링합니다.
export default function ShopOrderSuccessPage() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<ShopOrderPaymentConfirmResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const requestInfo = useMemo(() => {
    return {
      payNo: Number(searchParams.get("payNo") ?? "0"),
      ordNo: searchParams.get("orderId") ?? "",
      paymentKey: searchParams.get("paymentKey") ?? "",
      amount: Number(searchParams.get("amount") ?? "0"),
    };
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    const confirmPayment = async (): Promise<void> => {
      if (requestInfo.payNo < 1 || requestInfo.ordNo.trim() === "" || requestInfo.paymentKey.trim() === "" || requestInfo.amount < 1) {
        setErrorMessage("결제 완료 정보를 확인할 수 없습니다.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(getShopOrderPaymentConfirmPath(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(requestInfo),
        });
        const payload = await response.json().catch(() => null);
        if (!active) {
          return;
        }

        if (response.status === 401) {
          setErrorMessage("로그인이 필요합니다.");
          return;
        }

        if (!response.ok) {
          const message = payload && typeof payload === "object" && "message" in payload ? String(payload.message ?? "") : "";
          setErrorMessage(message || "결제 승인 처리에 실패했습니다.");
          return;
        }

        setResult(normalizeShopOrderPaymentConfirmResponse(payload));
      } catch {
        if (!active) {
          return;
        }
        setErrorMessage("결제 승인 처리에 실패했습니다.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void confirmPayment();
    return () => {
      active = false;
    };
  }, [requestInfo]);

  const isVirtualAccount = result?.payMethodCd === "PAY_METHOD_02";

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>ORDER COMPLETE</p>
        <h1 className={styles.title}>
          {loading
            ? "결제 정보를 확인하고 있습니다."
            : errorMessage.trim() !== ""
              ? "결제 확인이 필요합니다."
              : isVirtualAccount
                ? "무통장입금 접수가 완료되었습니다."
                : "주문이 완료되었습니다."}
        </h1>

        <p className={styles.description}>
          {loading
            ? "잠시만 기다려주세요."
            : errorMessage.trim() !== ""
              ? errorMessage
              : isVirtualAccount
                ? "가상계좌가 발급되었으며, 안내된 입금기한 내에 입금해주시면 주문이 완료됩니다."
                : "결제가 정상적으로 완료되었습니다. 주문 내역에서 배송 진행 상황을 확인하실 수 있습니다."}
        </p>

        {!loading && errorMessage.trim() === "" && result ? (
          <dl className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <dt className={styles.summaryLabel}>주문번호</dt>
              <dd className={styles.summaryValue}>{result.ordNo}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt className={styles.summaryLabel}>주문상품</dt>
              <dd className={styles.summaryValue}>{result.orderName}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt className={styles.summaryLabel}>결제금액</dt>
              <dd className={styles.summaryValue}>{formatPrice(result.amount)}원</dd>
            </div>
            {isVirtualAccount ? (
              <>
                <div className={styles.summaryRow}>
                  <dt className={styles.summaryLabel}>가상계좌 은행</dt>
                  <dd className={styles.summaryValue}>{result.bankNm || result.bankCd || "-"}</dd>
                </div>
                <div className={styles.summaryRow}>
                  <dt className={styles.summaryLabel}>가상계좌 번호</dt>
                  <dd className={styles.summaryValue}>{result.bankNo || "-"}</dd>
                </div>
                <div className={styles.summaryRow}>
                  <dt className={styles.summaryLabel}>예금주명</dt>
                  <dd className={styles.summaryValue}>{result.vactHolderNm || "-"}</dd>
                </div>
                <div className={styles.summaryRow}>
                  <dt className={styles.summaryLabel}>입금기한</dt>
                  <dd className={styles.summaryValue}>{result.vactDueDt || "-"}</dd>
                </div>
              </>
            ) : null}
          </dl>
        ) : null}

        <div className={styles.buttonRow}>
          <Link href="/" className={styles.button}>
            쇼핑 계속하기
          </Link>
          <Link href="/cart" className={`${styles.button} ${styles.subtleButton}`}>
            장바구니로 이동
          </Link>
        </div>
      </section>
    </main>
  );
}
