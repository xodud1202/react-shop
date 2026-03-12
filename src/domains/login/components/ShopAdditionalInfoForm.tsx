"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { emitShopAuthChangeEvent } from "@/shared/auth/shopAuthEvent";
import { PRIVATE_POLICY_PARAGRAPHS, TERMS_PARAGRAPHS } from "@/domains/policy/constants/policyDocuments";
import type { ShopGoogleJoinApiRequest, ShopGoogleJoinApiResponse, ShopGoogleProfile } from "@/domains/login/types";
import {
  formatPhoneNumberValue,
  isValidBirthValue,
  isValidPhoneNumberValue,
  resolveJoinDeviceType,
  resolveTodayDateValue,
} from "@/domains/login/utils/joinFormUtils";
import ShopAgreementModal from "./ShopAgreementModal";
import styles from "./ShopAdditionalInfoForm.module.css";

interface ShopAdditionalInfoFormProps {
  profile: ShopGoogleProfile;
  recommendedLoginId: string;
}

type ModalType = "private" | "terms" | null;

// 구글 신규 회원 추가 정보 입력 폼을 렌더링합니다.
export default function ShopAdditionalInfoForm({ profile, recommendedLoginId }: ShopAdditionalInfoFormProps) {
  const router = useRouter();
  const [custNm, setCustNm] = useState(profile.name);
  const [sex, setSex] = useState<"X" | "M" | "F">("X");
  const [birth, setBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [appConsent, setAppConsent] = useState(false);
  const [privateAgree, setPrivateAgree] = useState(false);
  const [termsAgree, setTermsAgree] = useState(false);
  const [openModalType, setOpenModalType] = useState<ModalType>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 생년월일 유효성 에러 문구를 계산합니다.
  const birthErrorMessage = useMemo(() => {
    if (birth.trim() === "" || isValidBirthValue(birth)) {
      return "";
    }
    return "생년월일은 YYYY-MM-DD 형식이며 오늘 날짜를 초과할 수 없습니다.";
  }, [birth]);

  // 휴대폰번호 유효성 에러 문구를 계산합니다.
  const phoneErrorMessage = useMemo(() => {
    if (phoneNumber.trim() === "" || isValidPhoneNumberValue(phoneNumber)) {
      return "";
    }
    return "휴대폰번호는 010-0000-0000 형식으로만 입력할 수 있습니다.";
  }, [phoneNumber]);

  // 가입 버튼 활성화 여부를 계산합니다.
  const isJoinButtonEnabled = useMemo(() => {
    return (
      custNm.trim() !== "" &&
      privateAgree &&
      termsAgree &&
      isValidBirthValue(birth) &&
      isValidPhoneNumberValue(phoneNumber) &&
      !isSubmitting
    );
  }, [birth, custNm, isSubmitting, phoneNumber, privateAgree, termsAgree]);

  // 현재 열린 약관 모달 정보를 계산합니다.
  const activeModal = useMemo(() => {
    if (openModalType === "private") {
      return {
        title: "개인정보 처리 방침",
        paragraphs: PRIVATE_POLICY_PARAGRAPHS,
      };
    }

    if (openModalType === "terms") {
      return {
        title: "서비스 이용약관",
        paragraphs: TERMS_PARAGRAPHS,
      };
    }

    return null;
  }, [openModalType]);

  // 회원가입 버튼 동작을 처리합니다.
  const handleClickJoin = async () => {
    // 비활성 조건에서는 요청을 중단합니다.
    if (!isJoinButtonEnabled) {
      return;
    }

    try {
      // 가입 요청 시작 시 메시지를 초기화합니다.
      setIsSubmitting(true);
      setMessage("");

      // 현재 입력값을 회원가입 API 요청 형태로 구성합니다.
      const joinRequest: ShopGoogleJoinApiRequest = {
        sub: profile.sub,
        email: profile.email,
        custNm: custNm.trim(),
        sex,
        birth,
        phoneNumber,
        smsRsvYn: smsConsent ? "Y" : "N",
        emailRsvYn: emailConsent ? "Y" : "N",
        appPushRsvYn: appConsent ? "Y" : "N",
        privateAgreeYn: privateAgree ? "Y" : "N",
        termsAgreeYn: termsAgree ? "Y" : "N",
        deviceType: resolveJoinDeviceType(),
      };

      // 백엔드 회원가입 API를 호출합니다.
      const response = await fetch("/api/shop/auth/google/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(joinRequest),
      });

      // 응답 본문을 파싱해 에러/성공 상태를 판별합니다.
      const payload = (await response.json()) as ShopGoogleJoinApiResponse;
      if (!response.ok) {
        throw new Error(payload.message ?? "구글 회원가입 처리에 실패했습니다.");
      }

      // 회원가입 후 로그인 성공이면 홈 화면으로 이동합니다.
      if (payload.loginSuccess) {
        // 로그인 성공 상태를 헤더에 즉시 반영합니다.
        emitShopAuthChangeEvent({
          isLoggedIn: true,
          custNo: payload.custNo ? String(payload.custNo) : "",
        });
        router.replace("/");
        router.refresh();
        return;
      }

      // 성공 응답인데 로그인 상태가 아니면 안내 문구를 노출합니다.
      throw new Error(payload.message ?? "회원가입 처리에 실패했습니다.");
    } catch (error) {
      // 예외 발생 시 화면에 실패 문구를 노출합니다.
      setMessage(error instanceof Error ? error.message : "회원가입 처리에 실패했습니다.");
    } finally {
      // API 처리 종료 후 버튼 대기 상태를 해제합니다.
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.formSection}>
      <h2 className={styles.sectionTitle}>추가 정보 입력</h2>
      <p className={styles.sectionDesc}>
        기존 회원 정보가 없어 추가 정보를 입력받습니다. 로그인 아이디는 내부적으로 <strong>{recommendedLoginId}</strong>
        로 사용할 예정이며, CI 값에는 구글 sub를 사용할 계획입니다.
      </p>

      <div className={styles.formGrid}>
        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="custNm">
            고객명
          </label>
          <input
            id="custNm"
            className={styles.textInput}
            type="text"
            value={custNm}
            onChange={(event) => setCustNm(event.target.value)}
            placeholder="고객명을 입력해주세요"
          />
        </div>

        <div className={styles.fieldBlock}>
          <span className={styles.fieldLabel}>
            성별
            <span className={styles.optionalLabel}>선택</span>
          </span>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input type="radio" name="sex" value="X" checked={sex === "X"} onChange={() => setSex("X")} />
              미선택
            </label>
            <label className={styles.radioLabel}>
              <input type="radio" name="sex" value="M" checked={sex === "M"} onChange={() => setSex("M")} />
              남성
            </label>
            <label className={styles.radioLabel}>
              <input type="radio" name="sex" value="F" checked={sex === "F"} onChange={() => setSex("F")} />
              여성
            </label>
          </div>
        </div>

        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="birth">
            생년월일
            <span className={styles.optionalLabel}>선택</span>
          </label>
          <input
            id="birth"
            className={styles.dateInput}
            type="date"
            value={birth}
            onChange={(event) => setBirth(event.target.value)}
            max={resolveTodayDateValue()}
            aria-invalid={birthErrorMessage !== ""}
          />
          {birthErrorMessage !== "" ? <p className={styles.errorText}>{birthErrorMessage}</p> : null}
        </div>

        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="phoneNumber">
            휴대폰번호
            <span className={styles.optionalLabel}>선택</span>
          </label>
          <input
            id="phoneNumber"
            className={styles.textInput}
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(formatPhoneNumberValue(event.target.value))}
            placeholder="010-0000-0000"
            maxLength={13}
            aria-invalid={phoneErrorMessage !== ""}
          />
          {phoneErrorMessage !== "" ? <p className={styles.errorText}>{phoneErrorMessage}</p> : null}
          <p className={styles.helperText}>
            주문정보 및 배송지가 문자 및 알림톡으로 갈 수 있으니 정확히 입력해주세요. 미입력 시 주문 정보는 이메일로만 전달됩니다.
          </p>
        </div>

        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="email">
            이메일
          </label>
          <input id="email" className={`${styles.textInput} ${styles.disabledInput}`} type="email" value={profile.email} disabled />
        </div>

        <div className={styles.consentCard}>
          <p className={styles.consentTitle}>광고 수신 여부</p>
          <p className={styles.helperText}>주문 정보 및 광고 제외 정보 전달에는 사용될 수 있습니다.</p>
          <div className={styles.checkboxColumn}>
            <label className={styles.checkboxLabel}>
              <span className={styles.checkboxLeft}>
                <input type="checkbox" checked={smsConsent} onChange={(event) => setSmsConsent(event.target.checked)} />
                SMS 수신 동의
              </span>
            </label>
            <label className={styles.checkboxLabel}>
              <span className={styles.checkboxLeft}>
                <input type="checkbox" checked={emailConsent} onChange={(event) => setEmailConsent(event.target.checked)} />
                EMAIL 수신 동의
              </span>
            </label>
            <label className={styles.checkboxLabel}>
              <span className={styles.checkboxLeft}>
                <input type="checkbox" checked={appConsent} onChange={(event) => setAppConsent(event.target.checked)} />
                APP 수신 동의
              </span>
            </label>
          </div>
        </div>

        <div className={styles.consentCard}>
          <div className={styles.checkboxColumn}>
            <label className={styles.checkboxLabel}>
              <span className={styles.checkboxLeft}>
                <input type="checkbox" checked={privateAgree} onChange={(event) => setPrivateAgree(event.target.checked)} />
                개인정보 처리 방침 동의 (필수)
              </span>
              <button type="button" className={styles.viewButton} onClick={() => setOpenModalType("private")}>
                보기
              </button>
            </label>

            <label className={styles.checkboxLabel}>
              <span className={styles.checkboxLeft}>
                <input type="checkbox" checked={termsAgree} onChange={(event) => setTermsAgree(event.target.checked)} />
                서비스 이용약관 동의 (필수)
              </span>
              <button type="button" className={styles.viewButton} onClick={() => setOpenModalType("terms")}>
                보기
              </button>
            </label>
          </div>
        </div>

        <button type="button" className={styles.submitButton} onClick={handleClickJoin} disabled={!isJoinButtonEnabled}>
          {isSubmitting ? "처리중..." : "회원가입"}
        </button>
        {message !== "" ? <p className={styles.noticeText}>{message}</p> : null}
      </div>

      {activeModal ? (
        <ShopAgreementModal
          title={activeModal.title}
          paragraphs={activeModal.paragraphs}
          onClose={() => setOpenModalType(null)}
        />
      ) : null}
    </section>
  );
}