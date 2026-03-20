// 상품 공통 카드 렌더링에 필요한 기본 타입입니다.
export interface ShopGoodsCardItem {
  goodsId: string;
  goodsNm: string;
  brandNm: string;
  supplyAmt?: number | null;
  saleAmt: number;
  exhibitionNo?: number | null;
  imgPath?: string | null;
  imgUrl?: string | null;
  secondaryImgPath?: string | null;
  secondaryImgUrl?: string | null;
}
