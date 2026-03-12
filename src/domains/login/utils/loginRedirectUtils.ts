// 로그인 완료 후 이동할 안전한 상대 경로를 반환합니다.
export function resolveSafeReturnUrl(rawReturnUrl: string | null | undefined): string {
  const normalizedValue = (rawReturnUrl ?? "").trim();
  if (normalizedValue === "") {
    return "/";
  }

  // 외부 URL/프로토콜 상대 URL은 허용하지 않습니다.
  if (!normalizedValue.startsWith("/") || normalizedValue.startsWith("//")) {
    return "/";
  }
  return normalizedValue;
}

// returnUrl을 포함한 로그인 페이지 경로를 생성합니다.
export function buildLoginFormPath(returnUrl: string): string {
  const safeReturnUrl = resolveSafeReturnUrl(returnUrl);
  return `/login/form?returnUrl=${encodeURIComponent(safeReturnUrl)}`;
}
