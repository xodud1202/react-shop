import { cookies } from "next/headers";
import ShopGoodsDetailTop from "@/domains/goods/components/ShopGoodsDetailTop";
import { fetchShopGoodsDetailServerData } from "@/domains/goods/api/goodsServerApi";
import { buildForwardCookieHeader } from "@/shared/server/shopCookieHeader";

interface GoodsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// 검색 파라미터에서 goodsId 값을 추출합니다.
function resolveGoodsId(rawGoodsId: string | string[] | undefined): string {
  if (Array.isArray(rawGoodsId)) {
    return typeof rawGoodsId[0] === "string" ? rawGoodsId[0] : "";
  }
  return typeof rawGoodsId === "string" ? rawGoodsId : "";
}

// 검색 파라미터에서 exhibitionNo 값을 추출합니다.
function resolveExhibitionNo(rawExhibitionNo: string | string[] | undefined): number | null {
  const rawValue = Array.isArray(rawExhibitionNo) ? rawExhibitionNo[0] : rawExhibitionNo;
  if (typeof rawValue !== "string") {
    return null;
  }

  const normalizedValue = Number.parseInt(rawValue.trim(), 10);
  if (!Number.isInteger(normalizedValue) || normalizedValue < 1) {
    return null;
  }
  return normalizedValue;
}

// 쇼핑몰 상품상세 화면을 렌더링합니다.
export default async function GoodsPage({ searchParams }: GoodsPageProps) {
  // URL 쿼리에서 goodsId를 추출합니다.
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const goodsId = resolveGoodsId(resolvedSearchParams.goodsId);
  const exhibitionNo = resolveExhibitionNo(resolvedSearchParams.exhibitionNo);

  // 현재 요청 쿠키를 백엔드 SSR 호출 헤더로 전달합니다.
  const cookieStore = await cookies();
  const cookieHeader = buildForwardCookieHeader(cookieStore, ["cust_no", "cust_grade_cd"]);
  const goodsDetailData = await fetchShopGoodsDetailServerData(goodsId, cookieHeader);

  return <ShopGoodsDetailTop detailData={goodsDetailData} requestedGoodsId={goodsId} requestedExhibitionNo={exhibitionNo} />;
}
