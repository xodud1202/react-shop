"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import type { ShopGoogleProfile } from "@/types/shopAuth";
import styles from "./ShopGoogleLoginButton.module.css";

interface ShopGoogleLoginButtonProps {
  clientId: string;
  onGoogleProfile: (profile: ShopGoogleProfile) => void;
}

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  ux_mode?: "popup" | "redirect";
}

interface GoogleIdButtonConfiguration {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  width?: number;
}

interface GoogleAccountsIdApi {
  initialize: (config: GoogleIdConfiguration) => void;
  renderButton: (parent: HTMLElement, options: GoogleIdButtonConfiguration) => void;
}

interface GoogleWindow {
  accounts: {
    id: GoogleAccountsIdApi;
  };
}

declare global {
  interface Window {
    google?: GoogleWindow;
  }
}

// Base64URL 문자열을 일반 Base64 문자열로 변환합니다.
function normalizeBase64Url(value: string): string {
  // URL 안전 문자를 일반 Base64 문자로 치환합니다.
  const replaced = value.replace(/-/g, "+").replace(/_/g, "/");

  // Base64 길이를 4의 배수로 맞추기 위해 padding을 보정합니다.
  const paddingLength = (4 - (replaced.length % 4)) % 4;
  return `${replaced}${"=".repeat(paddingLength)}`;
}

// 구글 credential JWT payload를 디코드합니다.
function decodeGoogleCredentialPayload(credential: string): Record<string, unknown> | null {
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
function toGoogleProfile(payload: Record<string, unknown> | null): ShopGoogleProfile | null {
  if (!payload) {
    return null;
  }

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

// 구글 로그인 버튼을 렌더링합니다.
export default function ShopGoogleLoginButton({ clientId, onGoogleProfile }: ShopGoogleLoginButtonProps) {
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);
  const [message, setMessage] = useState("구글 계정 정보를 받아오는 1차 로그인 화면입니다.");
  const [isError, setIsError] = useState(false);

  // 이미 스크립트가 로드된 상태로 진입한 경우 초기 상태를 동기화합니다.
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setIsGoogleScriptLoaded(true);
    }
  }, []);

  // 스크립트와 clientId가 준비되면 구글 로그인 버튼을 렌더링합니다.
  useEffect(() => {
    // 필수 설정값이 없으면 버튼 대신 안내 문구를 노출합니다.
    if (clientId.trim() === "") {
      setIsError(true);
      setMessage("GOOGLE_CLIENT_ID 값을 추가해주세요.");
      return;
    }

    // 스크립트나 버튼 컨테이너가 준비되지 않았으면 렌더링을 보류합니다.
    if (!isGoogleScriptLoaded || !buttonContainerRef.current || !window.google?.accounts?.id) {
      return;
    }

    // 정상 상태에서는 안내 문구를 기본값으로 복원합니다.
    setIsError(false);
    setMessage("");

    // 구글 credential 응답을 콘솔에 출력합니다.
    const handleCredentialResponse = (response: GoogleCredentialResponse) => {
      // 원본 응답과 decode한 payload를 각각 출력합니다.
      const decodedPayload = decodeGoogleCredentialPayload(response.credential ?? "");
      const profile = toGoogleProfile(decodedPayload);
      console.log("google credential response", response);
      console.log("google credential payload", decodedPayload);

      // 정상 프로필이면 상위 로그인 흐름으로 전달합니다.
      if (profile) {
        onGoogleProfile(profile);
      } else {
        setIsError(true);
        setMessage("구글 사용자 정보를 확인할 수 없습니다.");
      }
    };

    // 구글 로그인 클라이언트를 초기화합니다.
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      ux_mode: "popup",
    });

    // 버튼 컨테이너를 비운 뒤 현재 너비 기준으로 버튼을 렌더링합니다.
    buttonContainerRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonContainerRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: Math.max(260, Math.min(Math.floor(buttonContainerRef.current.clientWidth), 420)),
    });
  }, [clientId, isGoogleScriptLoaded, onGoogleProfile]);

  return (
    <section className={styles.buttonSection} aria-label="구글 로그인 영역">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          // 스크립트 로드 완료 시 버튼 렌더링을 시작합니다.
          setIsGoogleScriptLoaded(true);
        }}
        onError={() => {
          // 스크립트 로드 실패 시 오류 문구를 노출합니다.
          setIsError(true);
          setMessage("구글 로그인 스크립트를 불러오지 못했습니다.");
        }}
      />

      <div className={styles.buttonWrap}>
        <div ref={buttonContainerRef} className={styles.buttonContainer} />
      </div>

      <p className={`${styles.messageText} ${isError ? styles.errorText : ""}`}>{message}</p>
    </section>
  );
}
