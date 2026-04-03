import type { ShopMypageOrderDetailItem, ShopMypageOrderStatusSummary } from "@/domains/mypage/types";
import {
  isShopMypageOrderReturnWithdrawable,
  SHOP_MYPAGE_ORDER_ACTION_RETURN_WITHDRAW,
} from "@/domains/mypage/utils/shopMypageOrderReturnWithdraw";

export interface ShopMypageOrderStatusCard {
  key: string;
  label: string;
  iconClassName: string;
  count: number;
}

export interface ShopMypageOrderPolicyItem {
  ordDtlStatCd: string;
  ordDtlStatNm: string;
  availableActionLabelList: string[];
  description: string;
}

const SHOP_MYPAGE_ORDER_ACTION_DELIVERY_COMPLETE = "배송완료";
const SHOP_MYPAGE_ORDER_ACTION_PURCHASE_CONFIRM = "구매확정";

// 주문 금액 숫자를 천 단위 콤마 문자열로 변환합니다.
export function formatShopMypageOrderPrice(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(Math.floor(value), 0) : 0;
  return safeValue.toLocaleString("ko-KR");
}

// 주문 건수 숫자를 천 단위 콤마 문자열로 변환합니다.
export function formatShopMypageOrderCount(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(Math.floor(value), 0) : 0;
  return safeValue.toLocaleString("ko-KR");
}

// 주문상세 행 기준 주문금액을 계산합니다.
export function resolveShopMypageOrderDetailAmount(detailItem: ShopMypageOrderDetailItem): number {
  const saleAmt = Number.isFinite(detailItem.saleAmt) ? Math.max(Math.floor(detailItem.saleAmt), 0) : 0;
  const addAmt = Number.isFinite(detailItem.addAmt) ? Math.max(Math.floor(detailItem.addAmt), 0) : 0;
  const ordQty = Number.isFinite(detailItem.ordQty) ? Math.max(Math.floor(detailItem.ordQty), 0) : 0;
  return (saleAmt + addAmt) * ordQty;
}

// 주문일시 문자열을 주문 카드 헤더 노출용 한글 날짜 문구로 변환합니다.
export function formatShopMypageOrderDateLabel(orderDt: string): string {
  const trimmedOrderDt = orderDt.trim();
  if (trimmedOrderDt === "") {
    return "주문: -";
  }

  // 주문일시에서 날짜 부분만 추출해 YYYY년 MM월 DD일 형식으로 변환합니다.
  const [datePart] = trimmedOrderDt.split(" ");
  const [year = "", month = "", day = ""] = datePart.split("-");
  if (year !== "" && month !== "" && day !== "") {
    return `주문: ${year}년 ${month}월 ${day}일`;
  }
  return `주문: ${trimmedOrderDt}`;
}

// 주문번호 기준 상세 페이지 링크를 생성합니다.
export function buildShopMypageOrderDetailHref(ordNo: string): string {
  const normalizedOrdNo = ordNo.trim();
  return `/mypage/order/${encodeURIComponent(normalizedOrdNo)}`;
}

// 주문번호/주문상세번호 기준 주문취소 신청 화면 링크를 생성합니다.
export function buildShopMypageOrderCancelHref(ordNo: string, ordDtlNo: number): string {
  const normalizedOrdNo = ordNo.trim();
  const queryParams = new URLSearchParams();
  queryParams.set("ordDtlNo", String(Math.max(Math.floor(ordDtlNo), 1)));
  return `/mypage/order/${encodeURIComponent(normalizedOrdNo)}/cancel?${queryParams.toString()}`;
}

// 주문번호/주문상세번호 기준 반품신청 화면 링크를 생성합니다.
export function buildShopMypageOrderReturnHref(ordNo: string, ordDtlNo: number): string {
  const normalizedOrdNo = ordNo.trim();
  const queryParams = new URLSearchParams();
  queryParams.set("ordDtlNo", String(Math.max(Math.floor(ordDtlNo), 1)));
  return `/mypage/order/${encodeURIComponent(normalizedOrdNo)}/return?${queryParams.toString()}`;
}

// 주문상세 상태코드 기준 우측 액션 버튼 목록을 반환합니다.
export function resolveShopMypageOrderActionLabelList(ordDtlStatCd: string): string[] {
  if (ordDtlStatCd === "ORD_DTL_STAT_01" || ordDtlStatCd === "ORD_DTL_STAT_02") {
    return ["주문 취소", "1:1문의"];
  }
  if (ordDtlStatCd === "ORD_DTL_STAT_03" || ordDtlStatCd === "ORD_DTL_STAT_04") {
    return ["1:1문의"];
  }
  if (ordDtlStatCd === "ORD_DTL_STAT_05") {
    return ["배송완료", "1:1문의"];
  }
  if (ordDtlStatCd === "ORD_DTL_STAT_06") {
    return ["구매확정", "반품신청", "교환신청", "1:1문의"];
  }
  if (ordDtlStatCd === "ORD_DTL_STAT_07" || ordDtlStatCd === "ORD_DTL_STAT_99") {
    return ["1:1문의"];
  }
  return [];
}

// 주문 액션 라벨별 이동 링크를 반환합니다.
export function resolveShopMypageOrderActionHref(
  ordNo: string,
  ordDtlNo: number,
  actionLabel: string,
): string | null {
  if (actionLabel === "주문 취소") {
    return buildShopMypageOrderCancelHref(ordNo, ordDtlNo);
  }
  if (actionLabel === "반품신청") {
    return buildShopMypageOrderReturnHref(ordNo, ordDtlNo);
  }
  return null;
}

// 주문상세 행에 진행 중 반품/교환 클레임이 있는지 반환합니다.
export function hasShopMypageOrderActiveClaim(detailItem: ShopMypageOrderDetailItem): boolean {
  return detailItem.activeReturnClaimYn || detailItem.activeExchangeClaimYn;
}

// 주문상세 행의 화면 표시용 상태명을 반환합니다.
export function resolveShopMypageOrderDisplayStatusName(detailItem: ShopMypageOrderDetailItem): string {
  return detailItem.displayOrdDtlStatNm || detailItem.ordDtlStatNm;
}

// 주문상세 행 기준 실제 노출할 액션 버튼 목록을 반환합니다.
export function resolveShopMypageOrderVisibleActionLabelList(detailItem: ShopMypageOrderDetailItem): string[] {
  if (detailItem.activeReturnClaimYn && isShopMypageOrderReturnWithdrawable(detailItem)) {
    return [SHOP_MYPAGE_ORDER_ACTION_RETURN_WITHDRAW, "1:1문의"];
  }

  return resolveShopMypageOrderActionLabelList(detailItem.ordDtlStatCd).filter((actionLabel) => {
    if (hasShopMypageOrderActiveClaim(detailItem)) {
      return actionLabel === "1:1문의";
    }
    if (actionLabel === "반품신청") {
      return detailItem.returnApplyableYn;
    }
    if (actionLabel === "교환신청") {
      return detailItem.exchangeApplyableYn;
    }
    return true;
  });
}

// 주문 액션 라벨이 주문상태 변경 API 호출 대상인지 반환합니다.
export function isShopMypageOrderStatusActionLabel(actionLabel: string): boolean {
  return (
    actionLabel === SHOP_MYPAGE_ORDER_ACTION_DELIVERY_COMPLETE ||
    actionLabel === SHOP_MYPAGE_ORDER_ACTION_PURCHASE_CONFIRM
  );
}

// 주문 액션 라벨에 맞는 주문상태 변경 API 경로를 반환합니다.
export function resolveShopMypageOrderStatusActionPath(actionLabel: string): string | null {
  if (actionLabel === SHOP_MYPAGE_ORDER_ACTION_DELIVERY_COMPLETE) {
    return "/api/shop/mypage/order/delivery/complete";
  }
  if (actionLabel === SHOP_MYPAGE_ORDER_ACTION_PURCHASE_CONFIRM) {
    return "/api/shop/mypage/order/purchase/confirm";
  }
  return null;
}

// 주문 액션 라벨에 맞는 성공 안내 문구를 반환합니다.
export function resolveShopMypageOrderStatusActionSuccessMessage(actionLabel: string): string {
  if (actionLabel === SHOP_MYPAGE_ORDER_ACTION_DELIVERY_COMPLETE) {
    return "배송완료 처리되었습니다.";
  }
  if (actionLabel === SHOP_MYPAGE_ORDER_ACTION_PURCHASE_CONFIRM) {
    return "구매확정 처리되었습니다.";
  }
  return "처리되었습니다.";
}

// 상태 요약 응답을 카드 렌더링용 목록으로 변환합니다.
export function createShopMypageOrderStatusCardList(statusSummary: ShopMypageOrderStatusSummary): ShopMypageOrderStatusCard[] {
  return [
    {
      key: "waitingForDeposit",
      label: "입금대기",
      iconClassName: "fa-solid fa-building-columns",
      count: statusSummary.waitingForDepositCount,
    },
    {
      key: "paymentCompleted",
      label: "결제완료",
      iconClassName: "fa-solid fa-credit-card",
      count: statusSummary.paymentCompletedCount,
    },
    {
      key: "productPreparing",
      label: "상품준비중",
      iconClassName: "fa-solid fa-box-open",
      count: statusSummary.productPreparingCount,
    },
    {
      key: "deliveryPreparing",
      label: "배송준비중",
      iconClassName: "fa-solid fa-boxes-stacked",
      count: statusSummary.deliveryPreparingCount,
    },
    {
      key: "shipping",
      label: "배송중",
      iconClassName: "fa-solid fa-truck-fast",
      count: statusSummary.shippingCount,
    },
    {
      key: "deliveryCompleted",
      label: "배송완료",
      iconClassName: "fa-solid fa-house",
      count: statusSummary.deliveryCompletedCount,
    },
    {
      key: "purchaseConfirmed",
      label: "구매확정",
      iconClassName: "fa-solid fa-circle-check",
      count: statusSummary.purchaseConfirmedCount,
    },
  ];
}

// 주문상세 상태별 가능 기능과 안내 문구 목록을 생성합니다.
export function createShopMypageOrderPolicyList(): ShopMypageOrderPolicyItem[] {
  return [
    {
      ordDtlStatCd: "ORD_DTL_STAT_01",
      ordDtlStatNm: "무통장 입금 대기",
      availableActionLabelList: resolveShopMypageOrderActionLabelList("ORD_DTL_STAT_01"),
      description: "입금 확인 전 단계라 주문 취소가 가능하며, 상세 문의는 1:1문의로 접수할 수 있습니다.",
    },
    {
      ordDtlStatCd: "ORD_DTL_STAT_02",
      ordDtlStatNm: "결제 완료",
      availableActionLabelList: resolveShopMypageOrderActionLabelList("ORD_DTL_STAT_02"),
      description: "결제 직후 단계로 주문 취소가 가능하며, 변경 요청이 필요하면 1:1문의로 확인할 수 있습니다.",
    },
    {
      ordDtlStatCd: "ORD_DTL_STAT_03",
      ordDtlStatNm: "상품 준비중",
      availableActionLabelList: resolveShopMypageOrderActionLabelList("ORD_DTL_STAT_03"),
      description: "상품 검수와 출고 준비가 진행 중이라 주문 취소, 반품, 교환은 어렵고 1:1문의만 가능합니다.",
    },
    {
      ordDtlStatCd: "ORD_DTL_STAT_04",
      ordDtlStatNm: "배송 준비중",
      availableActionLabelList: resolveShopMypageOrderActionLabelList("ORD_DTL_STAT_04"),
      description: "포장과 송장 준비 단계라 주문 취소, 반품, 교환은 어렵고 필요한 안내는 1:1문의로 접수해주세요.",
    },
    {
      ordDtlStatCd: "ORD_DTL_STAT_05",
      ordDtlStatNm: "배송중",
      availableActionLabelList: resolveShopMypageOrderActionLabelList("ORD_DTL_STAT_05"),
      description: "상품이 이동 중인 단계로 배송완료 처리와 1:1문의만 제공되며, 반품과 교환은 배송완료 이후 신청할 수 있습니다.",
    },
    {
      ordDtlStatCd: "ORD_DTL_STAT_06",
      ordDtlStatNm: "배송완료",
      availableActionLabelList: resolveShopMypageOrderActionLabelList("ORD_DTL_STAT_06"),
      description: "상품 수령 후 구매확정, 반품신청, 교환신청, 1:1문의가 가능합니다.",
    },
    {
      ordDtlStatCd: "ORD_DTL_STAT_07",
      ordDtlStatNm: "구매확정",
      availableActionLabelList: resolveShopMypageOrderActionLabelList("ORD_DTL_STAT_07"),
      description: "구매가 확정된 주문으로 추가 처리 기능은 제공되지 않으며, 필요한 내용은 1:1문의로 접수해주세요.",
    },
    {
      ordDtlStatCd: "ORD_DTL_STAT_99",
      ordDtlStatNm: "주문 취소",
      availableActionLabelList: resolveShopMypageOrderActionLabelList("ORD_DTL_STAT_99"),
      description: "주문 취소가 완료된 상태로 추가 처리 기능은 제공되지 않으며, 확인이 필요하면 1:1문의로 접수해주세요.",
    },
  ];
}
