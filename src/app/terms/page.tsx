import type { Metadata } from "next";
import LegalDocument from "@/components/policy/LegalDocument";
import { TERMS_PARAGRAPHS } from "@/lib/constants/policyDocuments";

export const metadata: Metadata = {
  title: "서비스 이용 약관 | react-shop",
};

// 서비스 이용 약관 화면을 렌더링합니다.
export default function TermsPage() {
  // 테스트 프로젝트용 약관 문서를 공통 레이아웃으로 노출합니다.
  return <LegalDocument title="서비스 이용 약관" paragraphs={TERMS_PARAGRAPHS} />;
}
