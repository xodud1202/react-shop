import { cookies } from "next/headers";
import { fetchShopMypagePointPageServerData } from "@/domains/mypage/api/mypageServerApi";
import ShopMypagePointSection from "@/domains/mypage/components/ShopMypagePointSection";
import { buildForwardCookieHeader } from "@/shared/server/shopCookieHeader";

interface ShopMypagePointPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// 검색 파라미터의 pageNo 값을 1 이상 정수로 보정합니다.
function resolvePageNo(rawPageNo: string | string[] | undefined): number {
  const pageNoSource = Array.isArray(rawPageNo) ? rawPageNo[0] : rawPageNo;
  const parsedPageNo = Number(pageNoSource);
  if (!Number.isFinite(parsedPageNo) || parsedPageNo < 1) {
    return 1;
  }
  return Math.floor(parsedPageNo);
}

// 쇼핑몰 마이페이지 포인트 내역 화면을 렌더링합니다.
export default async function ShopMypagePointPage({ searchParams }: ShopMypagePointPageProps) {
  // URL 쿼리에서 페이지 번호를 추출합니다.
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const pageNo = resolvePageNo(resolvedSearchParams.pageNo);

  // 현재 요청 쿠키를 백엔드 SSR 호출 헤더로 전달합니다.
  const cookieStore = await cookies();
  const cookieHeader = buildForwardCookieHeader(cookieStore, ["cust_no"]);
  const pointPageData = await fetchShopMypagePointPageServerData(pageNo, cookieHeader);

  return (
    <ShopMypagePointSection
      key={`point-${pageNo}`}
      pointPageData={pointPageData}
    />
  );
}
