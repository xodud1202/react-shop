import { fetchShopMypageReturnDetailServerData } from "@/domains/mypage/api/mypageServerApi";
import ShopMypageReturnDetailSection from "@/domains/mypage/components/ShopMypageReturnDetailSection";
import { requireAuthenticatedShopRequestContext } from "@/shared/server/shopAuthServer";

interface ShopMypageReturnDetailPageProps {
  params: Promise<{ clmNo: string }>;
}

// 클레임번호 기준 반품상세 경로를 로그인 복귀용 상대 경로로 생성합니다.
function buildShopMypageReturnDetailPath(clmNo: string): string {
  return `/mypage/return/${encodeURIComponent(clmNo.trim())}`;
}

// 쇼핑몰 마이페이지 반품상세 화면을 렌더링합니다.
export default async function ShopMypageReturnDetailPage({ params }: ShopMypageReturnDetailPageProps) {
  // URL 파라미터에서 클레임번호를 추출합니다.
  const { clmNo } = await params;

  // 클레임번호가 없으면 빈 화면을 반환합니다.
  if (!clmNo || clmNo.trim() === "") {
    return null;
  }

  // 로그인된 요청의 세션 쿠키를 사용해 반품상세 데이터를 조회합니다.
  const requestContext = await requireAuthenticatedShopRequestContext(buildShopMypageReturnDetailPath(clmNo));
  const returnDetailPageData = await fetchShopMypageReturnDetailServerData(clmNo, requestContext.cookieHeader);

  return <ShopMypageReturnDetailSection returnDetailPageData={returnDetailPageData} />;
}
