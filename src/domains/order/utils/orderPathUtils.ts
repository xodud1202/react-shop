// 주문서 이동용 장바구니 번호 목록을 1 이상 정수로 정규화합니다.
function normalizeOrderCartIdList(cartIdList: readonly number[]): number[] {
  return cartIdList
    .filter((cartId) => Number.isFinite(cartId) && cartId > 0)
    .map((cartId) => Math.floor(cartId));
}

// 주문서 진입 경로를 생성합니다.
export function buildShopOrderPath(cartIdList: readonly number[], goodsId?: string): string {
  const normalizedCartIdList = normalizeOrderCartIdList(cartIdList);
  const searchParams = new URLSearchParams();
  if (goodsId && goodsId.trim() !== "") {
    searchParams.set("from", "goods");
    searchParams.set("goodsId", goodsId.trim());
  } else {
    searchParams.set("from", "cart");
  }
  normalizedCartIdList.forEach((cartId) => {
    searchParams.append("cartId", String(cartId));
  });
  const queryString = searchParams.toString();
  return queryString === "" ? "/order" : `/order?${queryString}`;
}
