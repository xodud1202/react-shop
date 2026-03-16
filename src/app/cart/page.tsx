import { cookies } from "next/headers";
import { fetchShopCartPageServerData } from "@/domains/cart/api/cartServerApi";
import ShopCartSection from "@/domains/cart/components/ShopCartSection";
import { buildForwardCookieHeader } from "@/shared/server/shopCookieHeader";

// 쇼핑몰 장바구니 화면을 렌더링합니다.
export default async function ShopCartPage() {
  // 현재 요청 쿠키를 백엔드 SSR 호출 헤더로 전달합니다.
  const cookieStore = await cookies();
  const cookieHeader = buildForwardCookieHeader(cookieStore, ["cust_no"]);
  const cartPageData = await fetchShopCartPageServerData(cookieHeader);
  return <ShopCartSection cartPageData={cartPageData} />;
}
