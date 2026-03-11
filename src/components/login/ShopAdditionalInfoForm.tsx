"use client";

import { useMemo, useState } from "react";
import { PRIVATE_POLICY_PARAGRAPHS, TERMS_PARAGRAPHS } from "@/lib/constants/policyDocuments";
import type { ShopGoogleProfile } from "@/types/shopAuth";
import ShopAgreementModal from "./ShopAgreementModal";
import styles from "./ShopAdditionalInfoForm.module.css";

interface ShopAdditionalInfoFormProps {
  profile: ShopGoogleProfile;
  recommendedLoginId: string;
}

type ModalType = "private" | "terms" | null;

// 날짜 입력값을 YYYYMMDD 문자열로 정규화합니다.
function normalizeBirthValue(value: string): string {
  return value.replaceAll("-", "");
}

// 구글 신규 회원 추가 정보 입력 폼을 렌더링합니다.
export default function ShopAdditionalInfoForm({ profile, recommendedLoginId }: ShopAdditionalInfoFormProps) {
  const [custNm, setCustNm] = useState(profile.name);
  const [sex, setSex] = useState("");
  const [birth, setBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [appConsent, setAppConsent] = useState(false);
  const [privateAgree, setPrivateAgree] = useState(false);
  const [termsAgree, setTermsAgree] = useState(false);
  const [openModalType, setOpenModalType] = useState<ModalType>(null);

  // 가입 버튼 활성화 여부를 계산합니다.
  const isJoinButtonEnabled = useMemo(() => {
    return custNm.trim() !== "" && privateAgree && termsAgree;
  }, [custNm, privateAgree, termsAgree]);

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

  // 회원가입 준비중 버튼 동작을 처리합니다.
  const handleClickJoin = () => {
    // 현재 수집된 추가 정보 값을 콘솔에 출력합니다.
    console.log("google join draft", {
      loginId: recommendedLoginId,
      ci: profile.sub,
      password: "",
      custNm: custNm.trim(),
      sex,
      birth: normalizeBirthValue(birth),
      phoneNumber: phoneNumber.trim(),
      email: profile.email,
      smsRsvYn: smsConsent ? "Y" : "N",
      emailRsvYn: emailConsent ? "Y" : "N",
      appPushRsvYn: appConsent ? "Y" : "N",
      privateAgreeYn: privateAgree ? "Y" : "N",
      termsAgreeYn: termsAgree ? "Y" : "N",
    });

    // 저장 기능이 아직 구현되지 않았음을 안내합니다.
    window.alert("회원가입 저장 기능은 다음 단계에서 구현할 예정입니다.");
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
              <input type="radio" name="sex" value="" checked={sex === ""} onChange={() => setSex("")} />
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
          <input id="birth" className={styles.dateInput} type="date" value={birth} onChange={(event) => setBirth(event.target.value)} />
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
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="숫자만 입력해주세요"
          />
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
          회원가입
        </button>
        <p className={styles.noticeText}>회원가입 저장 기능은 이후 단계에서 연결할 예정입니다.</p>
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
