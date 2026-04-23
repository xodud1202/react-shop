import { fetchShopMypageOrderCancelPageServerData } from "@/domains/mypage/api/mypageServerApi";
import ShopMypageOrderCancelSection from "@/domains/mypage/components/ShopMypageOrderCancelSection";
import ShopMypageOrderInvalidRedirect from "@/domains/mypage/components/ShopMypageOrderInvalidRedirect";
import {
  buildShopMypageOrderDetailHref,
} from "@/domains/mypage/utils/shopMypageOrder";
import { requireAuthenticatedShopRequestContext } from "@/shared/server/shopAuthServer";

interface ShopMypageOrderCancelPageProps {
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

// 주문번호와 주문상세번호 기준 취소 신청 경로를 로그인 복귀용 상대 경로로 생성합니다.
function buildShopMypageOrderCancelPath(ordNo: string, ordDtlNo: number | undefined): string {
  const normalizedOrdNo = ordNo.trim();
  if (typeof ordDtlNo !== "number") {
    return `/mypage/order/${encodeURIComponent(normalizedOrdNo)}/cancel`;
  }

  const searchParams = new URLSearchParams();
  searchParams.set("ordDtlNo", String(ordDtlNo));
  return `/mypage/order/${encodeURIComponent(normalizedOrdNo)}/cancel?${searchParams.toString()}`;
}

// 쇼핑몰 마이페이지 주문취소 신청 화면을 렌더링합니다.
export default async function ShopMypageOrderCancelPage({
  params,
  searchParams,
}: ShopMypageOrderCancelPageProps) {
  // 동적 라우트 파라미터와 검색 파라미터에서 주문번호/주문상세번호를 추출합니다.
  const resolvedParams = params ? await Promise.resolve(params) : {};
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const ordNo = resolveOrderNo(resolvedParams.ordNo);
  const ordDtlNo = resolveOrderDetailNo(resolvedSearchParams.ordDtlNo);

  // 주문번호가 없으면 주문내역 페이지로 이동시킵니다.
  if (ordNo === "") {
    return <ShopMypageOrderInvalidRedirect alertMessage="주문번호를 확인할 수 없어 주문내역으로 이동합니다." />;
  }

  // 로그인된 요청의 세션 쿠키를 사용해 주문취소 신청 데이터를 조회합니다.
  const requestContext = await requireAuthenticatedShopRequestContext(buildShopMypageOrderCancelPath(ordNo, ordDtlNo));
  const orderCancelPageData = await fetchShopMypageOrderCancelPageServerData(
    ordNo,
    ordDtlNo,
    requestContext.cookieHeader,
  );

  // 유효하지 않은 취소 화면 진입이면 주문상세 페이지로 이동시킵니다.
  if (!orderCancelPageData) {
    return (
      <ShopMypageOrderInvalidRedirect
        fallbackHref={buildShopMypageOrderDetailHref(ordNo)}
        alertMessage="주문취소 신청 정보를 찾을 수 없어 주문상세로 이동합니다."
      />
    );
  }

  return <ShopMypageOrderCancelSection orderCancelPageData={orderCancelPageData} initialOrdDtlNo={ordDtlNo} />;
}
