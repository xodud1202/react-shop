import { cookies } from "next/headers";
import ShopGoodsDetailTop from "@/domains/goods/components/ShopGoodsDetailTop";
import { fetchShopGoodsDetailServerData } from "@/domains/goods/api/goodsServerApi";

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

// 서버 요청 쿠키를 백엔드 전달용 Cookie 헤더 문자열로 변환합니다.
function buildCookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  const cookieList = cookieStore.getAll();
  if (cookieList.length === 0) {
    return "";
  }
  return cookieList.map((item) => `${item.name}=${item.value}`).join("; ");
}

// 쇼핑몰 상품상세 화면을 렌더링합니다.
export default async function GoodsPage({ searchParams }: GoodsPageProps) {
  // URL 쿼리에서 goodsId를 추출합니다.
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const goodsId = resolveGoodsId(resolvedSearchParams.goodsId);

  // 현재 요청 쿠키를 백엔드 SSR 호출 헤더로 전달합니다.
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore);
  const goodsDetailData = await fetchShopGoodsDetailServerData(goodsId, cookieHeader);

  return <ShopGoodsDetailTop detailData={goodsDetailData} requestedGoodsId={goodsId} />;
}
