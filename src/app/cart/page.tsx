import { fetchShopCartPageServerData } from "@/domains/cart/api/cartServerApi";
import ShopCartSection from "@/domains/cart/components/ShopCartSection";
import { requireAuthenticatedShopRequestContext } from "@/shared/server/shopAuthServer";

// 쇼핑몰 장바구니 화면을 렌더링합니다.
export default async function ShopCartPage() {
  // 로그인된 요청의 세션 쿠키를 사용해 장바구니 페이지 데이터를 조회합니다.
  const requestContext = await requireAuthenticatedShopRequestContext("/cart");
  const cartPageData = await fetchShopCartPageServerData(requestContext.cookieHeader);
  return <ShopCartSection cartPageData={cartPageData} />;
}
