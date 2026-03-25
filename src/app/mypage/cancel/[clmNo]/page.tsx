import { cookies } from "next/headers";
import { fetchShopMypageCancelDetailServerData } from "@/domains/mypage/api/mypageServerApi";
import ShopMypageCancelDetailSection from "@/domains/mypage/components/ShopMypageCancelDetailSection";
import { buildForwardCookieHeader } from "@/shared/server/shopCookieHeader";

interface ShopMypageCancelDetailPageProps {
  params: Promise<{ clmNo: string }>;
}

// 쇼핑몰 마이페이지 취소상세 화면을 렌더링합니다.
export default async function ShopMypageCancelDetailPage({ params }: ShopMypageCancelDetailPageProps) {
  // URL 파라미터에서 클레임번호를 추출합니다.
  const { clmNo } = await params;

  // 클레임번호가 없으면 빈 화면을 반환합니다.
  if (!clmNo || clmNo.trim() === "") {
    return null;
  }

  // 현재 요청 쿠키를 백엔드 SSR 호출 헤더로 전달합니다.
  const cookieStore = await cookies();
  const cookieHeader = buildForwardCookieHeader(cookieStore, ["cust_no"]);
  const cancelDetailPageData = await fetchShopMypageCancelDetailServerData(clmNo, cookieHeader);

  return <ShopMypageCancelDetailSection cancelDetailPageData={cancelDetailPageData} />;
}
