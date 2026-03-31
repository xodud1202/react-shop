import { cookies } from "next/headers";
import { fetchShopMypageOrderReturnPageServerData } from "@/domains/mypage/api/mypageServerApi";
import ShopMypageOrderInvalidRedirect from "@/domains/mypage/components/ShopMypageOrderInvalidRedirect";
import ShopMypageOrderReturnSection from "@/domains/mypage/components/ShopMypageOrderReturnSection";
import { buildShopMypageOrderDetailHref } from "@/domains/mypage/utils/shopMypageOrder";
import { buildForwardCookieHeader } from "@/shared/server/shopCookieHeader";

interface ShopMypageOrderReturnPageProps {
  params?: Promise<{
    ordNo?: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// 라우트 파라미터에서 주문번호를 추출해 공백 없이 보정합니다.
function resolveOrderNo(rawOrdNo: string | undefined): string {
  if (typeof rawOrdNo !== "string") {
    return "";
  }
  return rawOrdNo.trim();
}

// URL 검색 파라미터에서 주문상세번호를 양수 정수로 보정합니다.
function resolveOrderDetailNo(rawOrdDtlNo: string | string[] | undefined): number | undefined {
  const source = Array.isArray(rawOrdDtlNo) ? rawOrdDtlNo[0] : rawOrdDtlNo;
  const parsedValue = Number(source);
  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return undefined;
  }
  return Math.floor(parsedValue);
}

// 쇼핑몰 마이페이지 반품 신청 화면을 렌더링합니다.
export default async function ShopMypageOrderReturnPage({
  params,
  searchParams,
}: ShopMypageOrderReturnPageProps) {
  // 동적 라우트 파라미터와 검색 파라미터에서 주문번호/주문상세번호를 추출합니다.
  const resolvedParams = params ? await Promise.resolve(params) : {};
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const ordNo = resolveOrderNo(resolvedParams.ordNo);
  const ordDtlNo = resolveOrderDetailNo(resolvedSearchParams.ordDtlNo);

  // 주문번호가 없으면 주문내역 페이지로 이동시킵니다.
  if (ordNo === "") {
    return <ShopMypageOrderInvalidRedirect alertMessage="주문번호를 확인할 수 없어 주문내역으로 이동합니다." />;
  }

  // 현재 요청 쿠키를 백엔드 SSR 호출 헤더로 전달합니다.
  const cookieStore = await cookies();
  const cookieHeader = buildForwardCookieHeader(cookieStore, ["cust_no"]);
  const orderReturnPageData = await fetchShopMypageOrderReturnPageServerData(ordNo, ordDtlNo, cookieHeader);

  // 유효하지 않은 반품 화면 진입이면 주문상세 페이지로 이동시킵니다.
  if (!orderReturnPageData) {
    return (
      <ShopMypageOrderInvalidRedirect
        fallbackHref={buildShopMypageOrderDetailHref(ordNo)}
        alertMessage="반품 신청 정보를 찾을 수 없어 주문상세로 이동합니다."
      />
    );
  }

  return <ShopMypageOrderReturnSection orderReturnPageData={orderReturnPageData} initialOrdDtlNo={ordDtlNo} />;
}
