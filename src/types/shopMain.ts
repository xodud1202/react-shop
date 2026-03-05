// 쇼핑몰 메인 배너 구분 코드를 정의합니다.
export type ShopMainBannerDivCd = "BANNER_DIV_01" | "BANNER_DIV_02" | "BANNER_DIV_03" | "BANNER_DIV_04" | string;

// 쇼핑몰 메인 이미지 배너 아이템 타입을 정의합니다.
export interface ShopMainImageBannerItem {
  imageBannerNo: number;
  bannerNo: number;
  bannerNm: string;
  imgPath: string;
  url: string;
  bannerOpenCd: string;
  dispOrd: number;
}

// 쇼핑몰 메인 상품 카드 아이템 타입을 정의합니다.
export interface ShopMainGoodsItem {
  bannerNo: number;
  bannerTabNo: number;
  goodsId: string;
  goodsNm: string;
  brandNm: string;
  saleAmt: number;
  imgPath: string;
  imgUrl: string;
  dispOrd: number;
}

// 쇼핑몰 메인 상품배너 탭 타입을 정의합니다.
export interface ShopMainGoodsTab {
  bannerTabNo: number;
  bannerNo: number;
  tabNm: string;
  dispOrd: number;
  goodsItems: ShopMainGoodsItem[];
}

// 쇼핑몰 메인 섹션 타입을 정의합니다.
export interface ShopMainSection {
  bannerNo: number;
  bannerDivCd: ShopMainBannerDivCd;
  bannerNm: string;
  dispOrd: number;
  imageItems: ShopMainImageBannerItem[];
  tabItems: ShopMainGoodsTab[];
  goodsItems: ShopMainGoodsItem[];
}

// 쇼핑몰 메인 섹션 서버 응답 타입을 정의합니다.
export interface ShopMainSectionsResponse {
  sections: ShopMainSection[];
}
