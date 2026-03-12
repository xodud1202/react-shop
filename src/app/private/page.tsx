import type { Metadata } from "next";
import LegalDocument from "@/domains/policy/components/LegalDocument";
import { PRIVATE_POLICY_PARAGRAPHS } from "@/domains/policy/constants/policyDocuments";

export const metadata: Metadata = {
  title: "개인정보 처리 방침 | react-shop",
};

// 개인정보 처리 방침 화면을 렌더링합니다.
export default function PrivatePolicyPage() {
  // 테스트 프로젝트용 정책 문서를 공통 레이아웃으로 노출합니다.
  return <LegalDocument title="개인정보 처리 방침" paragraphs={PRIVATE_POLICY_PARAGRAPHS} />;
}

