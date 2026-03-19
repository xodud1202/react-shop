"use client";

import type { ShopOrderPaymentPrepareResponse } from "@/domains/order/types";

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      payment: (options: { customerKey: string }) => {
        requestPayment: (request: Record<string, unknown>) => Promise<void>;
      };
    };
  }
}

const TOSS_SDK_SRC = "https://js.tosspayments.com/v2/standard";

// Toss SDK 로딩 여부를 재사용 가능한 Promise로 관리합니다.
let tossSdkPromise: Promise<void> | null = null;

// Toss SDK 스크립트를 로드합니다.
export function loadTossPaymentsSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저 환경이 아닙니다."));
  }
  if (typeof window.TossPayments === "function") {
    return Promise.resolve();
  }
  if (tossSdkPromise) {
    return tossSdkPromise;
  }

  tossSdkPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${TOSS_SDK_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Toss SDK를 불러오지 못했습니다.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TOSS_SDK_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Toss SDK를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });

  return tossSdkPromise;
}

// Toss 결제창을 선택된 결제수단으로 실행합니다.
export async function requestTossPayment(paymentPrepareResponse: ShopOrderPaymentPrepareResponse): Promise<void> {
  await loadTossPaymentsSdk();

  if (typeof window.TossPayments !== "function") {
    throw new Error("Toss SDK를 불러오지 못했습니다.");
  }

  const tossPayments = window.TossPayments(paymentPrepareResponse.clientKey);
  const payment = tossPayments.payment({
    customerKey: paymentPrepareResponse.customerKey,
  });

  const requestPayload: Record<string, unknown> = {
    method: paymentPrepareResponse.method,
    amount: {
      currency: "KRW",
      value: paymentPrepareResponse.amount,
    },
    orderId: paymentPrepareResponse.orderId,
    orderName: paymentPrepareResponse.orderName,
    successUrl: paymentPrepareResponse.successUrl,
    failUrl: paymentPrepareResponse.failUrl,
    customerEmail: paymentPrepareResponse.customerEmail,
    customerName: paymentPrepareResponse.customerName,
    customerMobilePhone: paymentPrepareResponse.customerMobilePhone,
  };

  if (paymentPrepareResponse.method === "VIRTUAL_ACCOUNT") {
    requestPayload.virtualAccount = {
      validHours: 24,
    };
  }

  await payment.requestPayment(requestPayload);
}
