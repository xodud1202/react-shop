import { fetchShopMypageWishPageServerData } from "@/domains/mypage/api/mypageServerApi";
import ShopMypageWishSection from "@/domains/mypage/components/ShopMypageWishSection";
import { requireAuthenticatedShopRequestContext } from "@/shared/server/shopAuthServer";

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

// 현재 위시리스트 경로를 로그인 복귀용 상대 경로로 생성합니다.
function buildShopMypageWishPath(pageNo: number): string {
  const searchParams = new URLSearchParams();
  searchParams.set("pageNo", String(pageNo));
  return `/mypage/wish?${searchParams.toString()}`;
}

// 쇼핑몰 마이페이지 위시리스트 화면을 렌더링합니다.
export default async function ShopMypageWishPage({ searchParams }: ShopMypageWishPageProps) {
  // URL 쿼리에서 pageNo를 추출합니다.
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const pageNo = resolvePageNo(resolvedSearchParams.pageNo);

  // 로그인된 요청의 세션 쿠키를 사용해 위시리스트 데이터를 조회합니다.
  const requestContext = await requireAuthenticatedShopRequestContext(buildShopMypageWishPath(pageNo));
  const wishPageData = await fetchShopMypageWishPageServerData(pageNo, requestContext.cookieHeader);

  return <ShopMypageWishSection wishPageData={wishPageData} />;
}
