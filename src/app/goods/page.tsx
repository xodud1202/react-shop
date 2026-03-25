import { cache } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import ShopGoodsDetailTop from "@/domains/goods/components/ShopGoodsDetailTop";
import { fetchShopGoodsDetailServerData } from "@/domains/goods/api/goodsServerApi";
import { buildForwardCookieHeader } from "@/shared/server/shopCookieHeader";
import { createShopPageMetadata } from "@/shared/seo/shopMetadata";

interface GoodsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// 상품상세 데이터 조회를 요청 단위로 메모이징합니다.
const loadShopGoodsDetailData = cache(async (goodsId: string, cookieHeader: string) => {
  return fetchShopGoodsDetailServerData(goodsId, cookieHeader);
});

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
  const goodsDetailData = await loadShopGoodsDetailData(goodsId, cookieHeader);

  return <ShopGoodsDetailTop detailData={goodsDetailData} requestedGoodsId={goodsId} requestedExhibitionNo={exhibitionNo} />;
}

// 상품상세 페이지 메타데이터를 생성합니다.
export async function generateMetadata({ searchParams }: GoodsPageProps): Promise<Metadata> {
  // 메타 생성은 비로그인 기준 공개 상품 정보만 사용합니다.
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const goodsId = resolveGoodsId(resolvedSearchParams.goodsId);
  const goodsDetailData = await loadShopGoodsDetailData(goodsId, "");
  const goodsName = goodsDetailData?.goods.goodsNm?.trim() ?? "";
  const brandName = goodsDetailData?.goods.brandNm?.trim() ?? "";

  return createShopPageMetadata({
    title: goodsName || "상품상세",
    description:
      goodsName && brandName
        ? `${brandName} ${goodsName} 상품 정보와 혜택을 확인할 수 있습니다.`
        : "상품 정보와 혜택을 확인할 수 있습니다.",
  });
}
