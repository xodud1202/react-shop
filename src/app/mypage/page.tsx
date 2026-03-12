import { redirect } from "next/navigation";

// /mypage 진입 시 마이페이지 메인으로 이동시킵니다.
export default function ShopMypageIndexPage() {
  // 마이페이지 기본 경로를 메인 페이지로 고정합니다.
  redirect("/mypage/main");
}
