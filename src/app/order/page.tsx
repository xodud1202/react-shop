import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchShopOrderPageServerData } from "@/domains/order/api/orderServerApi";
import ShopOrderInvalidEntryHandler from "@/domains/order/components/ShopOrderInvalidEntryHandler";
import ShopOrderSection from "@/domains/order/components/ShopOrderSection";
import type { ShopOrderEntryInfo, ShopOrderPaymentFailureInfo } from "@/domains/order/types";
import { buildLoginFormPath } from "@/domains/login/utils/loginRedirectUtils";
import { buildForwardCookieHeader } from "@/shared/server/shopCookieHeader";

interface ShopOrderPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// 검색 파라미터에서 goodsId 값을 추출합니다.
function resolveGoodsId(rawGoodsId: string | string[] | undefined): string {
  if (Array.isArray(rawGoodsId)) {
    return typeof rawGoodsId[0] === "string" ? rawGoodsId[0] : "";
  }
  return typeof rawGoodsId === "string" ? rawGoodsId : "";
}

// 검색 파라미터에서 주문 진입 출처를 추출합니다.
function resolveOrderFrom(rawFrom: string | string[] | undefined, goodsId: string): "cart" | "goods" {
  const fromValue = Array.isArray(rawFrom) ? rawFrom[0] : rawFrom;
  if (fromValue === "goods" || goodsId.trim() !== "") {
    return "goods";
  }
  return "cart";
}

// 검색 파라미터에서 결제 실패 정보를 추출합니다.
function resolvePaymentFailureInfo(
  rawPayResult: string | string[] | undefined,
  rawCode: string | string[] | undefined,
  rawMessage: string | string[] | undefined,
): ShopOrderPaymentFailureInfo {
  const payResult = Array.isArray(rawPayResult) ? rawPayResult[0] ?? "" : rawPayResult ?? "";
  const code = Array.isArray(rawCode) ? rawCode[0] ?? "" : rawCode ?? "";
  const message = Array.isArray(rawMessage) ? rawMessage[0] ?? "" : rawMessage ?? "";
  return {
    payResult,
    code,
    message,
  };
}

// 검색 파라미터에서 반복 cartId 값을 추출합니다.
function resolveCartIdList(rawCartId: string | string[] | undefined): number[] {
  const rawCartIdList = Array.isArray(rawCartId) ? rawCartId : typeof rawCartId === "string" ? [rawCartId] : [];
  return rawCartIdList
    .map((cartId) => Number(cartId))
    .filter((cartId) => Number.isFinite(cartId) && cartId > 0)
    .map((cartId) => Math.floor(cartId));
}

// 현재 주문서 경로를 로그인 복귀용 상대 경로로 생성합니다.
function buildCurrentOrderPath(cartIdList: number[], goodsId: string): string {
  const searchParams = new URLSearchParams();
  if (goodsId.trim() !== "") {
    searchParams.set("from", "goods");
    searchParams.set("goodsId", goodsId.trim());
  } else {
    searchParams.set("from", "cart");
  }
  cartIdList.forEach((cartId) => {
    searchParams.append("cartId", String(cartId));
  });
  return `/order?${searchParams.toString()}`;
}

// 쇼핑몰 주문서 화면을 렌더링합니다.
export default async function ShopOrderPage({ searchParams }: ShopOrderPageProps) {
  // URL 쿼리에서 goodsId와 cartId 목록을 추출합니다.
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const goodsId = resolveGoodsId(resolvedSearchParams.goodsId);
  const from = resolveOrderFrom(resolvedSearchParams.from, goodsId);
  const cartIdList = resolveCartIdList(resolvedSearchParams.cartId);
  const paymentFailureInfo = resolvePaymentFailureInfo(
    resolvedSearchParams.payResult,
    resolvedSearchParams.code,
    resolvedSearchParams.message,
  );
  if (cartIdList.length === 0) {
    return <ShopOrderInvalidEntryHandler goodsId={goodsId} />;
  }

  // 현재 요청 쿠키를 백엔드 SSR 호출 헤더로 전달합니다.
  const cookieStore = await cookies();
  const cookieHeader = buildForwardCookieHeader(cookieStore, ["cust_no"]);
  if (cookieHeader.trim() === "") {
    redirect(buildLoginFormPath(buildCurrentOrderPath(cartIdList, goodsId)));
  }

  // 주문서 페이지 API를 호출해 유효한 cartId인지 확인합니다.
  const orderPageResult = await fetchShopOrderPageServerData(cartIdList, cookieHeader);
  if (orderPageResult.status === 401) {
    redirect(buildLoginFormPath(buildCurrentOrderPath(cartIdList, goodsId)));
  }
  if (!orderPageResult.ok) {
    return <ShopOrderInvalidEntryHandler goodsId={goodsId} message={orderPageResult.message} />;
  }
  const entryInfo: ShopOrderEntryInfo = {
    from,
    goodsId,
    cartIdList,
  };
  return <ShopOrderSection orderPageData={orderPageResult.data} entryInfo={entryInfo} paymentFailureInfo={paymentFailureInfo} />;
}
