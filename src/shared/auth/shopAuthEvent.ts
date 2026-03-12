const SHOP_AUTH_CHANGE_EVENT_NAME = "shop-auth-change";

// 쇼핑몰 로그인 상태 변경 이벤트 데이터 타입입니다.
export interface ShopAuthChangeEventDetail {
  isLoggedIn: boolean;
  custNo: string;
}

// 클라이언트 전역으로 쇼핑몰 로그인 상태 변경 이벤트를 발행합니다.
export function emitShopAuthChangeEvent(detail: ShopAuthChangeEventDetail): void {
  // 서버 환경에서는 브라우저 이벤트를 발행하지 않습니다.
  if (typeof window === "undefined") {
    return;
  }

  // 로그인 상태 변경 정보를 커스텀 이벤트로 브로드캐스트합니다.
  window.dispatchEvent(new CustomEvent<ShopAuthChangeEventDetail>(SHOP_AUTH_CHANGE_EVENT_NAME, { detail }));
}

// 쇼핑몰 로그인 상태 변경 이벤트를 구독하고 해제 함수를 반환합니다.
export function subscribeShopAuthChangeEvent(handler: (detail: ShopAuthChangeEventDetail) => void): () => void {
  // 서버 환경에서는 구독할 대상이 없으므로 빈 해제 함수를 반환합니다.
  if (typeof window === "undefined") {
    return () => {
      // 서버 환경용 no-op 해제 함수입니다.
    };
  }

  // 이벤트 객체에서 로그인 상태 상세 데이터를 꺼내 구독 핸들러로 전달합니다.
  const listener: EventListener = (event) => {
    const customEvent = event as CustomEvent<ShopAuthChangeEventDetail>;
    if (!customEvent.detail) {
      return;
    }
    handler(customEvent.detail);
  };

  // 전역 윈도우 이벤트를 등록합니다.
  window.addEventListener(SHOP_AUTH_CHANGE_EVENT_NAME, listener);

  // 컴포넌트 언마운트 시 이벤트를 해제합니다.
  return () => {
    window.removeEventListener(SHOP_AUTH_CHANGE_EVENT_NAME, listener);
  };
}
