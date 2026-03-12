import { cookies } from "next/headers";
import { fetchShopMypageWishPageServerData } from "@/domains/mypage/api/mypageServerApi";
import ShopMypageWishSection from "@/domains/mypage/components/ShopMypageWishSection";
import { buildForwardCookieHeader } from "@/shared/server/shopCookieHeader";

interface ShopMypageWishPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// 검색 파라미터에서 pageNo 값을 추출해 1 이상 정수로 보정합니다.
function resolvePageNo(rawPageNo: string | string[] | undefined): number {
  // 배열 파라미터면 첫 번째 값을 사용합니다.
  const pageNoSource = Array.isArray(rawPageNo) ? rawPageNo[0] : rawPageNo;
  const parsedPageNo = Number(pageNoSource);
  if (!Number.isFinite(parsedPageNo) || parsedPageNo < 1) {
    return 1;
  }

  return Math.floor(parsedPageNo);
}

// 쇼핑몰 마이페이지 위시리스트 화면을 렌더링합니다.
export default async function ShopMypageWishPage({ searchParams }: ShopMypageWishPageProps) {
  // URL 쿼리에서 pageNo를 추출합니다.
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const pageNo = resolvePageNo(resolvedSearchParams.pageNo);

  // 현재 요청 쿠키를 백엔드 SSR 호출 헤더로 전달합니다.
  const cookieStore = await cookies();
  const cookieHeader = buildForwardCookieHeader(cookieStore, ["cust_no"]);
  const wishPageData = await fetchShopMypageWishPageServerData(pageNo, cookieHeader);

  return <ShopMypageWishSection wishPageData={wishPageData} />;
}
