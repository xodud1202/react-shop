import { fetchShopMypageCouponPageServerData } from "@/domains/mypage/api/mypageServerApi";
import ShopMypageCouponSection from "@/domains/mypage/components/ShopMypageCouponSection";
import { requireAuthenticatedShopRequestContext } from "@/shared/server/shopAuthServer";

interface ShopMypageCouponPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// 검색 파라미터에서 pageNo 값을 추출해 1 이상 정수로 보정합니다.
function resolvePageNo(rawPageNo: string | string[] | undefined): number {
  const pageNoSource = Array.isArray(rawPageNo) ? rawPageNo[0] : rawPageNo;
  const parsedPageNo = Number(pageNoSource);
  if (!Number.isFinite(parsedPageNo) || parsedPageNo < 1) {
    return 1;
  }

  return Math.floor(parsedPageNo);
}

// 검색 파라미터에서 현재 활성 탭 값을 보정합니다.
function resolveCouponTab(rawTab: string | string[] | undefined): "owned" | "downloadable" {
  const tabSource = Array.isArray(rawTab) ? rawTab[0] : rawTab;
  return tabSource === "downloadable" ? "downloadable" : "owned";
}

// 현재 쿠폰함 경로를 로그인 복귀용 상대 경로로 생성합니다.
function buildShopMypageCouponPath(ownedPageNo: number, downloadablePageNo: number, activeTab: "owned" | "downloadable"): string {
  const searchParams = new URLSearchParams();
  searchParams.set("ownedPageNo", String(ownedPageNo));
  searchParams.set("downloadablePageNo", String(downloadablePageNo));
  searchParams.set("tab", activeTab);
  return `/mypage/coupon?${searchParams.toString()}`;
}

// 쇼핑몰 마이페이지 쿠폰함 화면을 렌더링합니다.
export default async function ShopMypageCouponPage({ searchParams }: ShopMypageCouponPageProps) {
  // URL 쿼리에서 탭별 페이지 번호와 활성 탭을 추출합니다.
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const ownedPageNo = resolvePageNo(resolvedSearchParams.ownedPageNo);
  const downloadablePageNo = resolvePageNo(resolvedSearchParams.downloadablePageNo);
  const initialActiveTab = resolveCouponTab(resolvedSearchParams.tab);

  // 로그인된 요청의 세션 쿠키를 사용해 쿠폰함 데이터를 조회합니다.
  const requestContext = await requireAuthenticatedShopRequestContext(
    buildShopMypageCouponPath(ownedPageNo, downloadablePageNo, initialActiveTab),
  );
  const couponPageData = await fetchShopMypageCouponPageServerData(
    ownedPageNo,
    downloadablePageNo,
    requestContext.cookieHeader,
  );

  return <ShopMypageCouponSection couponPageData={couponPageData} initialActiveTab={initialActiveTab} />;
}
