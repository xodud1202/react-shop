// 구글 로그인으로 받은 사용자 기본 프로필 타입입니다.
export interface ShopGoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string;
  givenName: string;
  familyName: string;
}

// 쇼핑몰 로그인 상태 요약 타입입니다.
export interface ShopCustomerAuthState {
  isLoggedIn: boolean;
  custNo: string;
  custNm: string;
  custGradeCd: string;
}

// 구글 로그인 판정 응답 타입입니다.
export interface ShopGoogleLoginApiResponse {
  loginSuccess: boolean;
  joinRequired: boolean;
  custNo?: number;
  custNm?: string;
  custGradeCd?: string;
  loginId?: string;
  message?: string;
}
