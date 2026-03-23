import { cookies } from "next/headers";
import { fetchShopMypageOrderDetailPageServerData } from "@/domains/mypage/api/mypageServerApi";
import ShopMypageOrderDetailSection from "@/domains/mypage/components/ShopMypageOrderDetailSection";
import ShopMypageOrderInvalidRedirect from "@/domains/mypage/components/ShopMypageOrderInvalidRedirect";
import { buildForwardCookieHeader } from "@/shared/server/shopCookieHeader";

interface ShopMypageOrderDetailPageProps {
  params?: Promise<{
    ordNo?: string;
  }>;
}

// 라우트 파라미터에서 주문번호를 추출해 공백 없이 보정합니다.
function resolveOrderNo(rawOrdNo: string | undefined): string {
  if (typeof rawOrdNo !== "string") {
    return "";
  }
  return rawOrdNo.trim();
}

// 쇼핑몰 마이페이지 주문상세 화면을 렌더링합니다.
export default async function ShopMypageOrderDetailPage({ params }: ShopMypageOrderDetailPageProps) {
  // 동적 라우트 파라미터에서 주문번호를 추출합니다.
  const resolvedParams = params ? await Promise.resolve(params) : {};
  const ordNo = resolveOrderNo(resolvedParams.ordNo);

  // 주문번호가 없으면 주문내역 페이지로 이동시킵니다.
  if (ordNo === "") {
    return <ShopMypageOrderInvalidRedirect alertMessage="주문번호를 확인할 수 없어 주문내역으로 이동합니다." />;
  }

  // 현재 요청 쿠키를 백엔드 SSR 호출 헤더로 전달합니다.
  const cookieStore = await cookies();
  const cookieHeader = buildForwardCookieHeader(cookieStore, ["cust_no"]);
  const orderDetailPageData = await fetchShopMypageOrderDetailPageServerData(ordNo, cookieHeader);

  // 유효하지 않은 주문번호면 주문내역 페이지로 이동시킵니다.
  if (!orderDetailPageData) {
    return <ShopMypageOrderInvalidRedirect />;
  }

  return <ShopMypageOrderDetailSection orderDetailPageData={orderDetailPageData} />;
}
