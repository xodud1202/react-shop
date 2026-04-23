import ShopMypageMainHeader from "@/domains/mypage/components/ShopMypageMainHeader";
import { requireAuthenticatedShopRequestContext } from "@/shared/server/shopAuthServer";

// 마이페이지 메인 화면을 렌더링합니다.
export default async function ShopMypageMainPage() {
  // 마이페이지 메인은 로그인된 사용자만 접근할 수 있습니다.
  await requireAuthenticatedShopRequestContext("/mypage/main");

  // 로그인 고객명/등급명을 상단 타이틀로 노출합니다.
  return <ShopMypageMainHeader />;
}
