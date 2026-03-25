"use client";

import ShopPageStatus from "@/shared/components/page/ShopPageStatus";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// 전역 라우트 오류 상태를 렌더링합니다.
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  // 개발환경에서는 digest를 포함해 오류를 빠르게 재시도할 수 있도록 안내합니다.
  const description =
    error.digest?.trim()
      ? `요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요. 오류 추적값: ${error.digest}`
      : "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

  return (
    <html lang="ko">
      <body>
        <section>
          <ShopPageStatus
            eyebrow="오류"
            title="화면을 불러오지 못했습니다."
            description={description}
            primaryActionHref="/"
            primaryActionLabel="메인으로 이동"
          />
          <div style={{ display: "flex", justifyContent: "center", marginTop: "-56px", paddingBottom: "64px" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                minWidth: "148px",
                minHeight: "48px",
                borderRadius: "999px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              다시 시도
            </button>
          </div>
        </section>
      </body>
    </html>
  );
}
