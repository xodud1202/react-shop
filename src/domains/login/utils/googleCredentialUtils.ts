import type { ShopGoogleProfile } from "@/domains/login/types";

// Base64URL 문자열을 일반 Base64 문자열로 변환합니다.
function normalizeBase64Url(value: string): string {
  // URL 안전 문자를 일반 Base64 문자로 치환합니다.
  const replaced = value.replace(/-/g, "+").replace(/_/g, "/");

  // Base64 길이를 4의 배수로 맞추기 위해 padding을 보정합니다.
  const paddingLength = (4 - (replaced.length % 4)) % 4;
  return `${replaced}${"=".repeat(paddingLength)}`;
}

// 구글 credential JWT payload를 디코드합니다.
export function decodeGoogleCredentialPayload(credential: string): Record<string, unknown> | null {
  // JWT 형식이 아니면 바로 null을 반환합니다.
  const tokenPartList = credential.split(".");
  if (tokenPartList.length < 2) {
    return null;
  }

  try {
    // payload를 UTF-8 문자열로 디코드한 뒤 JSON으로 파싱합니다.
    const normalizedPayload = normalizeBase64Url(tokenPartList[1]);
    const decodedPayload = atob(normalizedPayload);
    const utf8Payload = decodeURIComponent(
      Array.from(decodedPayload)
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    return JSON.parse(utf8Payload) as Record<string, unknown>;
  } catch {
    // 디코드 중 예외가 발생하면 null을 반환합니다.
    return null;
  }
}

// 디코드된 payload를 화면에서 사용할 구글 프로필 형태로 변환합니다.
export function toGoogleProfile(payload: Record<string, unknown> | null): ShopGoogleProfile | null {
  if (!payload) {
    return null;
  }

  // 로그인에 필요한 최소 키(sub/email) 존재 여부를 확인합니다.
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  const email = typeof payload.email === "string" ? payload.email : "";
  if (sub === "" || email === "") {
    return null;
  }

  return {
    sub,
    email,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : "",
    picture: typeof payload.picture === "string" ? payload.picture : "",
    givenName: typeof payload.given_name === "string" ? payload.given_name : "",
    familyName: typeof payload.family_name === "string" ? payload.family_name : "",
  };
}
