"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ShopAdditionalInfoForm from "@/components/login/ShopAdditionalInfoForm";
import ShopGoogleLoginButton from "@/components/login/ShopGoogleLoginButton";
import type { ShopGoogleLoginApiResponse, ShopGoogleProfile } from "@/types/shopAuth";
import styles from "./ShopLoginClientSection.module.css";

interface ShopLoginClientSectionProps {
  googleClientId: string;
}

// 로그인 페이지의 구글 로그인 및 추가 정보 입력 흐름을 관리합니다.
export default function ShopLoginClientSection({ googleClientId }: ShopLoginClientSectionProps) {
  const router = useRouter();
  const [googleProfile, setGoogleProfile] = useState<ShopGoogleProfile | null>(null);
  const [recommendedLoginId, setRecommendedLoginId] = useState("");
  const [message, setMessage] = useState("");

  // 구글 로그인 성공 후 기존 회원 여부를 판정합니다.
  const handleGoogleProfile = async (profile: ShopGoogleProfile) => {
    // 현재 구글 프로필을 상태로 저장합니다.
    setGoogleProfile(profile);
    setMessage("");

    try {
      // 백엔드에 기존 회원 여부를 조회합니다.
      const response = await fetch("/api/shop/auth/google/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          sub: profile.sub,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        }),
      });

      // 비정상 응답은 에러로 처리합니다.
      const payload = (await response.json()) as ShopGoogleLoginApiResponse;
      if (!response.ok) {
        throw new Error(payload.message ?? "구글 로그인 처리에 실패했습니다.");
      }

      // 기존 회원이면 홈으로 이동합니다.
      if (payload.loginSuccess) {
        router.replace("/");
        router.refresh();
        return;
      }

      // 신규 회원이면 같은 페이지에서 추가 정보 입력 폼을 노출합니다.
      if (payload.joinRequired) {
        setRecommendedLoginId(typeof payload.loginId === "string" ? payload.loginId : `google_${profile.sub}`);
        setMessage("기존 회원 정보가 없어 추가 정보 입력이 필요합니다.");
      }
    } catch (error) {
      // 오류가 발생하면 안내 문구를 노출합니다.
      setMessage(error instanceof Error ? error.message : "구글 로그인 처리에 실패했습니다.");
    }
  };

  return (
    <>
      <ShopGoogleLoginButton clientId={googleClientId} onGoogleProfile={handleGoogleProfile} />
      {message !== "" ? <p className={styles.statusMessage}>{message}</p> : null}
      {googleProfile && recommendedLoginId !== "" ? (
        <ShopAdditionalInfoForm profile={googleProfile} recommendedLoginId={recommendedLoginId} />
      ) : null}
    </>
  );
}
