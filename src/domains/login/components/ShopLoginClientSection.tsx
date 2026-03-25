"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ShopAdditionalInfoForm from "@/domains/login/components/ShopAdditionalInfoForm";
import ShopGoogleLoginButton from "@/domains/login/components/ShopGoogleLoginButton";
import { resolveSafeReturnUrl } from "@/domains/login/utils/loginRedirectUtils";
import { emitShopAuthChangeEvent } from "@/shared/auth/shopAuthEvent";
import { requestShopClientApi } from "@/shared/client/shopClientApi";
import type { ShopGoogleLoginApiResponse, ShopGoogleProfile } from "@/domains/login/types";
import styles from "./ShopLoginClientSection.module.css";

interface ShopLoginClientSectionProps {
  googleClientId: string;
  returnUrl: string;
}

// 로그인 페이지의 구글 로그인 및 추가 정보 입력 흐름을 관리합니다.
export default function ShopLoginClientSection({ googleClientId, returnUrl }: ShopLoginClientSectionProps) {
  const router = useRouter();
  const safeReturnUrl = resolveSafeReturnUrl(returnUrl);
  const [googleProfile, setGoogleProfile] = useState<ShopGoogleProfile | null>(null);
  const [recommendedLoginId, setRecommendedLoginId] = useState("");
  const [message, setMessage] = useState("");
  // 추가 정보 입력 폼 노출 여부를 계산합니다.
  const isAdditionalInfoFormVisible = googleProfile !== null && recommendedLoginId.trim() !== "";

  // 구글 로그인 성공 후 기존 회원 여부를 판정합니다.
  const handleGoogleProfile = async (profile: ShopGoogleProfile) => {
    // 현재 구글 프로필을 상태로 저장합니다.
    setGoogleProfile(profile);
    setMessage("");

    try {
      // 백엔드에 기존 회원 여부를 조회합니다.
      const result = await requestShopClientApi<ShopGoogleLoginApiResponse>("/api/shop/auth/google/login", {
        method: "POST",
        body: {
          sub: profile.sub,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        },
      });

      // 비정상 응답은 에러로 처리합니다.
      if (!result.ok || !result.data) {
        throw new Error(result.message || "구글 로그인 처리에 실패했습니다.");
      }

      // 기존 회원이면 홈으로 이동합니다.
      if (result.data.loginSuccess) {
        // 로그인 성공 상태를 헤더에 즉시 반영합니다.
        emitShopAuthChangeEvent({
          isLoggedIn: true,
          custNo: result.data.custNo ? String(result.data.custNo) : "",
        });
        router.replace(safeReturnUrl);
        router.refresh();
        return;
      }

      // 신규 회원이면 같은 페이지에서 추가 정보 입력 폼을 노출합니다.
      if (result.data.joinRequired) {
        setRecommendedLoginId(typeof result.data.loginId === "string" ? result.data.loginId : `google_${profile.sub}`);
        setMessage("기존 회원 정보가 없어 추가 정보 입력이 필요합니다.");
        return;
      }

      // 기타 응답은 실패로 처리합니다.
      throw new Error(result.message || "구글 로그인 처리에 실패했습니다.");
    } catch (error) {
      // 오류가 발생하면 안내 문구를 노출합니다.
      setMessage(error instanceof Error ? error.message : "구글 로그인 처리에 실패했습니다.");
    }
  };

  return (
    <>
      {!isAdditionalInfoFormVisible ? <ShopGoogleLoginButton clientId={googleClientId} onGoogleProfile={handleGoogleProfile} /> : null}
      {message !== "" ? <p className={styles.statusMessage}>{message}</p> : null}
      {isAdditionalInfoFormVisible && googleProfile ? (
        <ShopAdditionalInfoForm profile={googleProfile} recommendedLoginId={recommendedLoginId} returnUrl={safeReturnUrl} />
      ) : null}
    </>
  );
}
