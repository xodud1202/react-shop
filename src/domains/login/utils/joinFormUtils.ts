import type { ShopGoogleJoinDeviceType } from "@/domains/login/types";

// 날짜 객체를 00:00:00 기준으로 생성합니다.
function createDateOnly(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

// 현재 날짜를 YYYY-MM-DD 형식 문자열로 반환합니다.
export function resolveTodayDateValue(): string {
  // 오늘 날짜를 로컬 기준으로 2자리 포맷합니다.
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 생년월일 입력값을 유효한 날짜 객체로 변환합니다.
function parseBirthValue(value: string): Date | null {
  // 입력이 비어 있으면 날짜 미입력으로 처리합니다.
  if (value.trim() === "") {
    return null;
  }

  // YYYY-MM-DD 형식이 아니면 무효로 처리합니다.
  const matchedValue = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!matchedValue) {
    return null;
  }

  // 연, 월, 일을 파싱해 실제 달력 날짜인지 검증합니다.
  const year = Number(matchedValue[1]);
  const month = Number(matchedValue[2]);
  const day = Number(matchedValue[3]);
  const parsedDate = createDateOnly(year, month, day);
  const isSameDate =
    parsedDate.getFullYear() === year && parsedDate.getMonth() === month - 1 && parsedDate.getDate() === day;
  if (!isSameDate) {
    return null;
  }

  return parsedDate;
}

// 생년월일 입력값의 유효성을 확인합니다.
export function isValidBirthValue(value: string): boolean {
  // 미입력은 허용합니다.
  if (value.trim() === "") {
    return true;
  }

  // 형식이 유효하지 않으면 즉시 실패합니다.
  const parsedBirthDate = parseBirthValue(value);
  if (!parsedBirthDate) {
    return false;
  }

  // 현재 날짜(로컬 00시)보다 미래면 실패합니다.
  const today = new Date();
  const todayDateOnly = createDateOnly(today.getFullYear(), today.getMonth() + 1, today.getDate());
  return parsedBirthDate.getTime() <= todayDateOnly.getTime();
}

// 휴대폰번호 입력값을 숫자 기준 하이픈 포맷으로 변환합니다.
export function formatPhoneNumberValue(value: string): string {
  // 숫자만 추출하고 국내 휴대폰 최대 길이(11자리)까지만 허용합니다.
  const digitOnlyValue = value.replace(/\D/g, "").slice(0, 11);
  if (digitOnlyValue.length <= 3) {
    return digitOnlyValue;
  }

  // 중간 구간까지 입력된 경우 3-나머지 형식으로 표시합니다.
  if (digitOnlyValue.length <= 7) {
    return `${digitOnlyValue.slice(0, 3)}-${digitOnlyValue.slice(3)}`;
  }

  // 10자리 입력은 3-3-4, 11자리 입력은 3-4-4 형식으로 표시합니다.
  if (digitOnlyValue.length === 10) {
    return `${digitOnlyValue.slice(0, 3)}-${digitOnlyValue.slice(3, 6)}-${digitOnlyValue.slice(6)}`;
  }

  return `${digitOnlyValue.slice(0, 3)}-${digitOnlyValue.slice(3, 7)}-${digitOnlyValue.slice(7)}`;
}

// 휴대폰번호 입력값의 유효성을 확인합니다.
export function isValidPhoneNumberValue(value: string): boolean {
  // 미입력은 허용합니다.
  if (value.trim() === "") {
    return true;
  }

  // 010-0000-0000 형식(13자리)만 허용합니다.
  return /^\d{3}-\d{4}-\d{4}$/.test(value);
}

// 클라이언트 환경에서 현재 디바이스 타입을 판별합니다.
export function resolveJoinDeviceType(): ShopGoogleJoinDeviceType {
  // 앱 명시 시그널이 아직 없으므로 웹뷰/모바일 브라우저 패턴만 판별합니다.
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent.toLowerCase();
  const isMobileBrowser = /(iphone|ipad|ipod|android|mobile|blackberry|windows phone)/.test(userAgent);
  return isMobileBrowser ? "MOBILE" : "WEB";
}
