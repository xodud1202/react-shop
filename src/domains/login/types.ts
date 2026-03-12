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

// 구글 회원가입에서 사용하는 클라이언트 디바이스 타입입니다.
export type ShopGoogleJoinDeviceType = "WEB" | "MOBILE" | "APP";

// 구글 회원가입 요청 타입입니다.
export interface ShopGoogleJoinApiRequest {
  sub: string;
  email: string;
  custNm: string;
  sex: "X" | "M" | "F";
  birth: string;
  phoneNumber: string;
  smsRsvYn: "Y" | "N";
  emailRsvYn: "Y" | "N";
  appPushRsvYn: "Y" | "N";
  privateAgreeYn: "Y" | "N";
  termsAgreeYn: "Y" | "N";
  deviceType: ShopGoogleJoinDeviceType;
}

// 구글 회원가입 응답 타입입니다.
export type ShopGoogleJoinApiResponse = ShopGoogleLoginApiResponse;