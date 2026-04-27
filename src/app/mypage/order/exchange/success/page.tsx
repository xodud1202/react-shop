"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ShopMypageOrderExchangePaymentConfirmResponse } from "@/domains/mypage/types";
import { requestShopClientApi } from "@/shared/client/shopClientApi";
import styles from "../../../../order/payment-result.module.css";

// 금액을 원화 문자열로 포맷합니다.
function formatPrice(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString("ko-KR") : "0";
}

// 숫자 값을 0 이상 정수로 보정합니다.
function normalizeNonNegativeNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(Math.floor(value), 0);
}

// 문자열 값을 빈 문자열 기본값으로 보정합니다.
function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// 교환 배송비 결제 승인 응답을 기본값과 함께 정규화합니다.
function normalizeShopMypageOrderExchangePaymentConfirmResponse(
  rawResponse: unknown,
): ShopMypageOrderExchangePaymentConfirmResponse {
  const source = (rawResponse ?? {}) as Partial<ShopMypageOrderExchangePaymentConfirmResponse>;
  return {
    clmNo: normalizeString(source.clmNo),
    ordNo: normalizeString(source.ordNo),
    payNo: normalizeNonNegativeNumber(source.payNo),
    payMethodCd: normalizeString(source.payMethodCd) as ShopMypageOrderExchangePaymentConfirmResponse["payMethodCd"],
    payStatCd: normalizeString(source.payStatCd),
    chgDtlStatCd: normalizeString(source.chgDtlStatCd),
    orderName: normalizeString(source.orderName),
    amount: normalizeNonNegativeNumber(source.amount),
    bankCd: normalizeString(source.bankCd),
    bankNm: normalizeString(source.bankNm),
    bankNo: normalizeString(source.bankNo),
    vactHolderNm: normalizeString(source.vactHolderNm),
    vactDueDt: normalizeString(source.vactDueDt),
  };
}

// 교환 배송비 결제 완료 페이지를 렌더링합니다.
export default function ShopMypageOrderExchangeSuccessPage() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<ShopMypageOrderExchangePaymentConfirmResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const requestInfo = useMemo(() => {
    return {
      payNo: Number(searchParams.get("payNo") ?? "0"),
      clmNo: searchParams.get("orderId") ?? "",
      paymentKey: searchParams.get("paymentKey") ?? "",
      amount: Number(searchParams.get("amount") ?? "0"),
    };
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    // Toss 결제 성공 복귀 파라미터를 서버에 전달해 교환 배송비 결제를 승인합니다.
    const confirmPayment = async (): Promise<void> => {
      if (requestInfo.payNo < 1 || requestInfo.clmNo.trim() === "" || requestInfo.paymentKey.trim() === "" || requestInfo.amount < 1) {
        setErrorMessage("교환 배송비 결제 완료 정보를 확인할 수 없습니다.");
        setLoading(false);
        return;
      }

      try {
        const result = await requestShopClientApi<ShopMypageOrderExchangePaymentConfirmResponse>(
          "/api/shop/mypage/order/exchange/payment/confirm",
          {
            method: "POST",
            body: requestInfo,
          },
        );
        if (!active) {
          return;
        }

        if (result.status === 401) {
          setErrorMessage("로그인이 필요합니다.");
          return;
        }

        if (!result.ok || !result.data) {
          setErrorMessage(result.message || "교환 배송비 결제 승인 처리에 실패했습니다.");
          return;
        }

        setResult(normalizeShopMypageOrderExchangePaymentConfirmResponse(result.data));
      } catch {
        if (!active) {
          return;
        }
        setErrorMessage("교환 배송비 결제 승인 처리에 실패했습니다.");
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
  const orderDetailHref = result?.ordNo ? `/mypage/order/${encodeURIComponent(result.ordNo)}` : "/mypage/order";

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>EXCHANGE PAYMENT</p>
        <h1 className={styles.title}>
          {loading
            ? "교환 배송비 결제를 확인하고 있습니다."
            : errorMessage.trim() !== ""
              ? "결제 확인이 필요합니다."
              : isVirtualAccount
                ? "무통장입금 접수가 완료되었습니다."
                : "교환신청이 완료되었습니다."}
        </h1>

        <p className={styles.description}>
          {loading
            ? "잠시만 기다려주세요."
            : errorMessage.trim() !== ""
              ? errorMessage
              : isVirtualAccount
                ? "가상계좌가 발급되었으며, 입금 완료 후 교환 접수 상태로 변경됩니다."
                : "교환 배송비 결제가 정상 처리되어 교환 접수가 완료되었습니다."}
        </p>

        {!loading && errorMessage.trim() === "" && result ? (
          <dl className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <dt className={styles.summaryLabel}>주문번호</dt>
              <dd className={styles.summaryValue}>{result.ordNo}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt className={styles.summaryLabel}>클레임번호</dt>
              <dd className={styles.summaryValue}>{result.clmNo}</dd>
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
          <Link href={orderDetailHref} className={styles.button}>
            주문상세 보기
          </Link>
          <Link href="/mypage/order" className={`${styles.button} ${styles.subtleButton}`}>
            주문목록으로 이동
          </Link>
        </div>
      </section>
    </main>
  );
}
