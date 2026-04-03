import { cookies } from "next/headers";
import { fetchShopMypageReturnDetailServerData } from "@/domains/mypage/api/mypageServerApi";
import ShopMypageReturnDetailSection from "@/domains/mypage/components/ShopMypageReturnDetailSection";
import { buildForwardCookieHeader } from "@/shared/server/shopCookieHeader";

interface ShopMypageReturnDetailPageProps {
  params: Promise<{ clmNo: string }>;
}

// 쇼핑몰 마이페이지 반품상세 화면을 렌더링합니다.
export default async function ShopMypageReturnDetailPage({ params }: ShopMypageReturnDetailPageProps) {
  // URL 파라미터에서 클레임번호를 추출합니다.
  const { clmNo } = await params;

  // 클레임번호가 없으면 빈 화면을 반환합니다.
  if (!clmNo || clmNo.trim() === "") {
    return null;
  }

  // 현재 요청 쿠키를 백엔드 SSR 호출 헤더로 전달합니다.
  const cookieStore = await cookies();
  const cookieHeader = buildForwardCookieHeader(cookieStore, ["cust_no"]);
  const returnDetailPageData = await fetchShopMypageReturnDetailServerData(clmNo, cookieHeader);

  return <ShopMypageReturnDetailSection returnDetailPageData={returnDetailPageData} />;
}
