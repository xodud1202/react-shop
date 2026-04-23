import { fetchShopMypagePointPageServerData } from "@/domains/mypage/api/mypageServerApi";
import ShopMypagePointSection from "@/domains/mypage/components/ShopMypagePointSection";
import { requireAuthenticatedShopRequestContext } from "@/shared/server/shopAuthServer";

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

// 현재 포인트 내역 경로를 로그인 복귀용 상대 경로로 생성합니다.
function buildShopMypagePointPath(pageNo: number): string {
  const searchParams = new URLSearchParams();
  searchParams.set("pageNo", String(pageNo));
  return `/mypage/point?${searchParams.toString()}`;
}

// 쇼핑몰 마이페이지 포인트 내역 화면을 렌더링합니다.
export default async function ShopMypagePointPage({ searchParams }: ShopMypagePointPageProps) {
  // URL 쿼리에서 페이지 번호를 추출합니다.
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const pageNo = resolvePageNo(resolvedSearchParams.pageNo);

  // 로그인된 요청의 세션 쿠키를 사용해 포인트 내역을 조회합니다.
  const requestContext = await requireAuthenticatedShopRequestContext(buildShopMypagePointPath(pageNo));
  const pointPageData = await fetchShopMypagePointPageServerData(pageNo, requestContext.cookieHeader);

  return (
    <ShopMypagePointSection
      key={`point-${pageNo}`}
      pointPageData={pointPageData}
    />
  );
}
