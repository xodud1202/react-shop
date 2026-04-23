// 쇼핑몰 공통 인증 상태 타입입니다.
export interface ShopAuthState {
  authenticated: boolean;
  custNo: number | null;
  custNm: string;
  custGradeCd: string;
  custGradeNm: string;
}

// 비로그인 기본 인증 상태를 생성합니다.
export function createUnauthenticatedShopAuthState(): ShopAuthState {
  return {
    authenticated: false,
    custNo: null,
    custNm: "",
    custGradeCd: "",
    custGradeNm: "",
  };
}

// 숫자형 고객번호 값을 안전하게 보정합니다.
function normalizeShopCustomerNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  return null;
}

// 문자열 값을 빈 문자열 기본값으로 보정합니다.
function normalizeShopText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// 서버/클라이언트 응답 payload를 공통 인증 상태로 정규화합니다.
export function normalizeShopAuthState(rawValue: unknown): ShopAuthState {
  if (!rawValue || typeof rawValue !== "object") {
    return createUnauthenticatedShopAuthState();
  }

  const source = rawValue as Partial<ShopAuthState>;
  const authenticated = source.authenticated === true;
  if (!authenticated) {
    return createUnauthenticatedShopAuthState();
  }

  return {
    authenticated: true,
    custNo: normalizeShopCustomerNumber(source.custNo),
    custNm: normalizeShopText(source.custNm),
    custGradeCd: normalizeShopText(source.custGradeCd),
    custGradeNm: normalizeShopText(source.custGradeNm),
  };
}
