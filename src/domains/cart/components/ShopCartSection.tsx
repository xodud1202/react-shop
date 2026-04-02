"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FocusEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createDefaultShopCartCouponEstimateResponse,
  getShopCartCouponEstimatePath,
  getShopCartDeleteAllPath,
  getShopCartDeletePath,
  getShopCartOptionUpdatePath,
  normalizeShopCartCouponEstimateResponse,
} from "@/domains/cart/api/cartServerApi";
import type {
  ShopCartCouponEstimateRequest,
  ShopCartCouponEstimateResponse,
  ShopCartItem,
  ShopCartPageResponse,
  ShopCartSiteInfo,
  ShopCartSizeOption,
} from "@/domains/cart/types";
import { buildLoginFormPath } from "@/domains/login/utils/loginRedirectUtils";
import { buildShopOrderPath } from "@/domains/order/utils/orderPathUtils";
import { requestShopClientApi } from "@/shared/client/shopClientApi";
import styles from "./ShopCartSection.module.css";

interface ShopCartSectionProps {
  cartPageData: ShopCartPageResponse;
}

interface ShopCartOptionDraft {
  targetSizeId: string;
  qty: number;
}

interface ShopCartSummaryAmount {
  supplyAmt: number;
  discountAmt: number;
  deliveryFee: number;
  totalPayAmt: number;
}

interface ShopCartDeleteRequestPayload {
  cartItemList: Array<{
    cartId: number;
    goodsId: string;
    sizeId: string;
  }>;
}

// 가격 숫자를 천 단위 콤마 문자열로 변환합니다.
function formatPrice(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString("ko-KR");
}

// 합계 계산용 숫자값을 0 이상 정수로 보정합니다.
function normalizeNonNegativeNumber(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(Math.floor(value), 0);
}

// 수량 입력값을 1 이상 정수로 보정합니다.
function normalizeQuantity(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(Math.floor(value), 1);
}

// 장바구니 행을 식별할 고유 키를 생성합니다.
function buildCartItemKey(goodsId: string, sizeId: string): string {
  return `${goodsId}||${sizeId}`;
}

// 장바구니 행의 현재 선택 사이즈 옵션을 조회합니다.
function resolveCartItemSelectedSizeOption(cartItem: ShopCartItem): ShopCartSizeOption | null {
  const normalizedSizeId = cartItem.sizeId.trim();
  return cartItem.sizeOptions.find((sizeOption) => sizeOption.sizeId.trim() === normalizedSizeId) ?? null;
}

// 장바구니 행의 현재 구매 가능 재고 수량을 계산합니다.
function resolveCartItemAvailableStockQty(cartItem: ShopCartItem): number {
  const selectedSizeOption = resolveCartItemSelectedSizeOption(cartItem);
  return selectedSizeOption ? normalizeNonNegativeNumber(selectedSizeOption.stockQty) : 0;
}

// 장바구니 행이 현재 재고 부족 상태인지 확인합니다.
function isCartItemStockShortage(cartItem: ShopCartItem): boolean {
  return normalizeQuantity(cartItem.qty) > resolveCartItemAvailableStockQty(cartItem);
}

// 현재 주문 가능한 장바구니 상품 목록만 추출합니다.
function resolveOrderableCartItemList(cartList: ShopCartItem[]): ShopCartItem[] {
  return cartList.filter((cartItem) => !isCartItemStockShortage(cartItem));
}

// 장바구니 행의 재고 부족 안내 문구를 생성합니다.
function resolveCartItemStockShortageMessage(cartItem: ShopCartItem): string {
  return `재고 부족, 구매 가능 수량: ${resolveCartItemAvailableStockQty(cartItem).toLocaleString("ko-KR")}`;
}

// 현재 페이지 경로(pathname + search)를 로그인 복귀용 경로로 반환합니다.
function resolveCurrentPagePath(): string {
  if (typeof window === "undefined") {
    return "/cart";
  }
  return `${window.location.pathname}${window.location.search}`;
}

// 장바구니 목록 기준 초기 체크 상태(전체 선택)를 생성합니다.
function createInitialCheckedKeySet(cartList: ShopCartItem[]): Set<string> {
  return new Set(resolveOrderableCartItemList(cartList).map((cartItem) => buildCartItemKey(cartItem.goodsId, cartItem.sizeId)));
}

// 장바구니 목록 기준 초기 옵션 변경 Draft 상태를 생성합니다.
function createInitialOptionDraftMap(cartList: ShopCartItem[]): Record<string, ShopCartOptionDraft> {
  // 장바구니 각 행의 현재 옵션값을 Draft 기본값으로 구성합니다.
  return cartList.reduce<Record<string, ShopCartOptionDraft>>((result, cartItem) => {
    const cartItemKey = buildCartItemKey(cartItem.goodsId, cartItem.sizeId);
    result[cartItemKey] = {
      targetSizeId: cartItem.sizeId,
      qty: normalizeQuantity(cartItem.qty),
    };
    return result;
  }, {});
}

// 선택된 장바구니 상품 목록을 계산합니다.
function resolveSelectedCartItemList(cartList: ShopCartItem[], checkedKeySet: Set<string>): ShopCartItem[] {
  return cartList.filter(
    (cartItem) => checkedKeySet.has(buildCartItemKey(cartItem.goodsId, cartItem.sizeId)) && !isCartItemStockShortage(cartItem),
  );
}

// 선택된 장바구니 기준 금액 요약(공급가/판매가/배송비/총결제금액)을 계산합니다.
function resolveSummaryAmount(selectedCartList: ShopCartItem[], siteInfo: ShopCartSiteInfo): ShopCartSummaryAmount {
  // 선택 상품이 없으면 모든 금액을 0원으로 반환합니다.
  if (selectedCartList.length === 0) {
    return {
      supplyAmt: 0,
      discountAmt: 0,
      deliveryFee: 0,
      totalPayAmt: 0,
    };
  }

  // 단가 * 수량 기준으로 공급가/판매가 합계를 계산합니다.
  const supplyAmt = selectedCartList.reduce((sum, cartItem) => {
    const unitSupplyAmt = normalizeNonNegativeNumber(cartItem.supplyAmt);
    const qty = normalizeQuantity(cartItem.qty);
    return sum + unitSupplyAmt * qty;
  }, 0);
  const saleAmt = selectedCartList.reduce((sum, cartItem) => {
    const unitSaleAmt = normalizeNonNegativeNumber(cartItem.saleAmt);
    const qty = normalizeQuantity(cartItem.qty);
    return sum + unitSaleAmt * qty;
  }, 0);
  const discountAmt = Math.max(supplyAmt - saleAmt, 0);

  // 판매가 합계 기준 무료배송 여부를 계산합니다.
  const deliveryFee = normalizeNonNegativeNumber(siteInfo.deliveryFee);
  const deliveryFeeLimit = normalizeNonNegativeNumber(siteInfo.deliveryFeeLimit);
  const resolvedDeliveryFee = saleAmt >= deliveryFeeLimit ? 0 : deliveryFee;
  return {
    supplyAmt,
    discountAmt,
    deliveryFee: resolvedDeliveryFee,
    totalPayAmt: saleAmt + resolvedDeliveryFee,
  };
}

// 할인금액을 마이너스 형식 문자열로 변환합니다.
function formatDiscountAmount(discountAmt: number): string {
  const safeDiscountAmt = normalizeNonNegativeNumber(discountAmt);
  if (safeDiscountAmt === 0) {
    return "0원";
  }
  return `-${formatPrice(safeDiscountAmt)}원`;
}

// 총 결제금액에 예상 쿠폰 할인 금액을 반영한 표시 금액을 계산합니다.
function resolveExpectedTotalPayAmt(totalPayAmt: number, expectedCouponDiscountAmt: number): number {
  // 총 결제금액과 예상 쿠폰 할인 금액을 0 이상 정수로 보정합니다.
  const safeTotalPayAmt = normalizeNonNegativeNumber(totalPayAmt);
  const safeExpectedCouponDiscountAmt = normalizeNonNegativeNumber(expectedCouponDiscountAmt);

  // 예상 할인 금액이 총 결제금액보다 커도 음수로 내려가지 않도록 보정합니다.
  return Math.max(safeTotalPayAmt - safeExpectedCouponDiscountAmt, 0);
}

// 장바구니 행의 Draft 옵션이 원본과 다른지 확인합니다.
function isChangedCartItemOption(cartItem: ShopCartItem, draft: ShopCartOptionDraft): boolean {
  const originSizeId = cartItem.sizeId.trim();
  const originQty = normalizeQuantity(cartItem.qty);
  const draftSizeId = draft.targetSizeId.trim();
  const draftQty = normalizeQuantity(draft.qty);
  return originSizeId !== draftSizeId || originQty !== draftQty;
}

// 장바구니 옵션 변경용 사이즈 목록을 정리합니다.
function resolveEditableSizeOptionList(sizeOptions: ShopCartSizeOption[]): ShopCartSizeOption[] {
  return sizeOptions.filter((option) => option.sizeId.trim() !== "");
}

// 장바구니 선택 삭제 요청 payload를 생성합니다.
function buildDeletePayload(cartList: ShopCartItem[]): ShopCartDeleteRequestPayload {
  return {
    cartItemList: cartList.map((cartItem) => ({
      cartId: cartItem.cartId,
      goodsId: cartItem.goodsId,
      sizeId: cartItem.sizeId,
    })),
  };
}

// 장바구니 선택 상품 목록을 예상 할인 계산 요청 payload로 변환합니다.
function buildCouponEstimateRequest(selectedCartList: ShopCartItem[]): ShopCartCouponEstimateRequest {
  return {
    cartItemList: selectedCartList.map((cartItem) => ({
      goodsId: cartItem.goodsId,
      sizeId: cartItem.sizeId,
    })),
  };
}

// 장바구니 UI 섹션을 렌더링합니다.
export default function ShopCartSection({ cartPageData }: ShopCartSectionProps) {
  const router = useRouter();
  const cartList = cartPageData.cartList;
  const [checkedKeySet, setCheckedKeySet] = useState<Set<string>>(() => createInitialCheckedKeySet(cartList));
  const [optionDraftMap, setOptionDraftMap] = useState<Record<string, ShopCartOptionDraft>>(() =>
    createInitialOptionDraftMap(cartList),
  );
  const [isSelectedDeleteSubmitting, setIsSelectedDeleteSubmitting] = useState(false);
  const [isAllDeleteSubmitting, setIsAllDeleteSubmitting] = useState(false);
  const [updatingItemKey, setUpdatingItemKey] = useState("");
  const [deletingItemKey, setDeletingItemKey] = useState("");
  const [couponEstimate, setCouponEstimate] = useState<ShopCartCouponEstimateResponse>(() =>
    createDefaultShopCartCouponEstimateResponse(),
  );
  const [isCouponEstimateLoading, setIsCouponEstimateLoading] = useState(false);

  // 서버 응답(cartPageData)이 갱신되면 체크 상태와 Draft 상태를 초기화합니다.
  useEffect(() => {
    setCheckedKeySet(createInitialCheckedKeySet(cartList));
    setOptionDraftMap(createInitialOptionDraftMap(cartList));
  }, [cartList]);

  // 장바구니 전체 키 목록을 계산합니다.
  const orderableCartItemKeyList = useMemo(
    () => resolveOrderableCartItemList(cartList).map((cartItem) => buildCartItemKey(cartItem.goodsId, cartItem.sizeId)),
    [cartList],
  );

  // 상단 전체선택 체크 상태를 계산합니다.
  const isAllChecked = useMemo(() => {
    if (orderableCartItemKeyList.length === 0) {
      return false;
    }
    return orderableCartItemKeyList.every((cartItemKey) => checkedKeySet.has(cartItemKey));
  }, [checkedKeySet, orderableCartItemKeyList]);

  // 선택된 장바구니 목록을 계산합니다.
  const selectedCartList = useMemo(() => resolveSelectedCartItemList(cartList, checkedKeySet), [cartList, checkedKeySet]);

  // 우측 가격표 금액 요약값을 계산합니다.
  const summaryAmount = useMemo(
    () => resolveSummaryAmount(selectedCartList, cartPageData.siteInfo),
    [selectedCartList, cartPageData.siteInfo],
  );

  // 총 결제금액에 예상 최대 쿠폰 할인 금액을 반영한 표시 금액을 계산합니다.
  const expectedTotalPayAmt = useMemo(
    () => resolveExpectedTotalPayAmt(summaryAmount.totalPayAmt, couponEstimate.expectedMaxDiscountAmt),
    [couponEstimate.expectedMaxDiscountAmt, summaryAmount.totalPayAmt],
  );

  // 장바구니 행의 Draft 옵션 값을 조회합니다.
  const resolveOptionDraft = (cartItem: ShopCartItem): ShopCartOptionDraft => {
    const cartItemKey = buildCartItemKey(cartItem.goodsId, cartItem.sizeId);
    return optionDraftMap[cartItemKey] ?? {
      targetSizeId: cartItem.sizeId,
      qty: normalizeQuantity(cartItem.qty),
    };
  };

  // 401 응답을 공통 처리하고 로그인 이동 여부를 안내합니다.
  const handleUnauthorizedResponse = useCallback((): void => {
    // 로그인 이동 여부를 확인하고 returnUrl과 함께 로그인 페이지로 이동합니다.
    const shouldMoveLogin = window.confirm("로그인이 필요한 기능입니다. 로그인하시겠습니까?");
    if (shouldMoveLogin) {
      router.push(buildLoginFormPath(resolveCurrentPagePath()));
    }
  }, [router]);

  // 선택 상품 기준 예상 최대 쿠폰 할인 금액을 조회합니다.
  useEffect(() => {
    // 선택 상품이 없으면 예상 할인 금액을 즉시 0원으로 초기화합니다.
    if (selectedCartList.length === 0) {
      setCouponEstimate(createDefaultShopCartCouponEstimateResponse());
      setIsCouponEstimateLoading(false);
      return;
    }

    // 연속 체크 변경 시 짧은 지연 후 최신 선택 상태 기준으로만 API를 호출합니다.
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsCouponEstimateLoading(true);
        const result = await requestShopClientApi<ShopCartCouponEstimateResponse>(getShopCartCouponEstimatePath(), {
          method: "POST",
          signal: abortController.signal,
          body: buildCouponEstimateRequest(selectedCartList),
        });

        // 비로그인/세션만료면 로그인 이동을 안내하고 금액은 0원으로 초기화합니다.
        if (result.status === 401) {
          setCouponEstimate(createDefaultShopCartCouponEstimateResponse());
          handleUnauthorizedResponse();
          return;
        }

        // 실패 응답이면 금액을 0원으로 초기화합니다.
        if (!result.ok) {
          setCouponEstimate(createDefaultShopCartCouponEstimateResponse());
          return;
        }

        // 성공 응답을 예상 할인 계산 응답 형식으로 정규화합니다.
        setCouponEstimate(normalizeShopCartCouponEstimateResponse(result.data));
      } catch (error) {
        // AbortError는 무시하고 그 외 오류만 0원으로 초기화합니다.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setCouponEstimate(createDefaultShopCartCouponEstimateResponse());
      } finally {
        setIsCouponEstimateLoading(false);
      }
    }, 200);

    // 다음 선택 상태가 들어오면 이전 타이머와 요청을 취소합니다.
    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [handleUnauthorizedResponse, selectedCartList]);

  // 상단 전체선택 체크박스 토글을 처리합니다.
  const handleToggleAllCheck = (): void => {
    // 전체 선택 상태면 전체 해제, 아니면 전체 선택으로 전환합니다.
    if (isAllChecked) {
      setCheckedKeySet(new Set());
      return;
    }
    setCheckedKeySet(new Set(orderableCartItemKeyList));
  };

  // 개별 행 체크박스 토글을 처리합니다.
  const handleToggleItemCheck = (cartItem: ShopCartItem): void => {
    // 재고 부족 상품은 선택할 수 없도록 유지합니다.
    if (isCartItemStockShortage(cartItem)) {
      return;
    }

    // 클릭 대상 행 키를 기준으로 선택 상태를 반전합니다.
    const cartItemKey = buildCartItemKey(cartItem.goodsId, cartItem.sizeId);
    setCheckedKeySet((previousCheckedKeySet) => {
      const nextCheckedKeySet = new Set(previousCheckedKeySet);
      if (nextCheckedKeySet.has(cartItemKey)) {
        nextCheckedKeySet.delete(cartItemKey);
      } else {
        nextCheckedKeySet.add(cartItemKey);
      }
      return nextCheckedKeySet;
    });
  };

  // 행별 옵션 변경 사이즈 값을 갱신합니다.
  const handleChangeOptionSize = (cartItemKey: string, targetSizeId: string): void => {
    // 기존 Draft를 유지하면서 사이즈 값만 변경합니다.
    setOptionDraftMap((previousDraftMap) => ({
      ...previousDraftMap,
      [cartItemKey]: {
        targetSizeId,
        qty: previousDraftMap[cartItemKey]?.qty ?? 1,
      },
    }));
  };

  // 행별 옵션 변경 수량 값을 갱신합니다.
  const handleChangeOptionQty = (cartItemKey: string, rawQty: string): void => {
    // 입력값을 수량 경계값으로 보정한 뒤 Draft에 반영합니다.
    const parsedQty = Number(rawQty);
    const normalizedQty = normalizeQuantity(parsedQty);
    setOptionDraftMap((previousDraftMap) => ({
      ...previousDraftMap,
      [cartItemKey]: {
        targetSizeId: previousDraftMap[cartItemKey]?.targetSizeId ?? "",
        qty: normalizedQty,
      },
    }));
  };

  // 옵션 입력 blur 시 변경된 경우에만 옵션 변경 API를 호출해 저장합니다.
  const saveChangedOptionOnBlur = async (cartItem: ShopCartItem): Promise<void> => {
    // 중복 요청을 방지하고 행별 Draft 값을 확인합니다.
    const cartItemKey = buildCartItemKey(cartItem.goodsId, cartItem.sizeId);
    if (updatingItemKey !== "") {
      return;
    }
    const draft = resolveOptionDraft(cartItem);
    if (draft.targetSizeId.trim() === "") {
      window.alert("변경할 사이즈를 선택해주세요.");
      return;
    }
    if (draft.qty < 1) {
      window.alert("수량을 확인해주세요.");
      return;
    }

    // 사이즈/수량이 변경되지 않았으면 API를 호출하지 않습니다.
    if (!isChangedCartItemOption(cartItem, draft)) {
      return;
    }

    try {
      // 옵션 변경 요청 중에는 해당 행을 로딩 상태로 설정합니다.
      setUpdatingItemKey(cartItemKey);
      const result = await requestShopClientApi<{ message?: string }>(getShopCartOptionUpdatePath(), {
        method: "POST",
        body: {
          cartId: cartItem.cartId,
          goodsId: cartItem.goodsId,
          sizeId: cartItem.sizeId,
          targetSizeId: draft.targetSizeId,
          qty: draft.qty,
        },
      });

      // 비로그인/세션만료면 로그인 이동을 안내합니다.
      if (result.status === 401) {
        handleUnauthorizedResponse();
        return;
      }

      // 실패 응답이면 서버 메시지를 우선 노출합니다.
      if (!result.ok) {
        window.alert(result.message || "장바구니 옵션 변경에 실패했습니다.");
        return;
      }

      // 성공 시 서버 상태 동기화를 위해 화면을 새로고침합니다.
      router.refresh();
    } catch {
      // 네트워크/예외 오류 시 공통 실패 문구를 노출합니다.
      window.alert("장바구니 옵션 변경에 실패했습니다.");
    } finally {
      // 요청 종료 후 로딩 상태를 해제합니다.
      setUpdatingItemKey("");
    }
  };

  // 행 옵션 영역 blur 시 행 바깥으로 포커스가 나간 경우 자동저장을 처리합니다.
  const handleBlurOptionRow = (event: FocusEvent<HTMLDivElement>, cartItem: ShopCartItem): void => {
    // 같은 옵션 영역 내부 포커스 이동이면 저장을 수행하지 않습니다.
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    void saveChangedOptionOnBlur(cartItem);
  };

  // 선택된 장바구니 항목을 삭제합니다.
  const handleDeleteSelected = async (): Promise<void> => {
    // 선택 항목이 없으면 삭제를 진행하지 않습니다.
    if (selectedCartList.length === 0 || isSelectedDeleteSubmitting || deletingItemKey !== "" || updatingItemKey !== "") {
      if (selectedCartList.length === 0) {
        window.alert("삭제할 상품을 선택해주세요.");
      }
      return;
    }
    const shouldDelete = window.confirm("선택한 상품을 장바구니에서 삭제하시겠습니까?");
    if (!shouldDelete) {
      return;
    }

    try {
      // 선택 삭제 API를 호출하는 동안 상단 버튼을 로딩 상태로 설정합니다.
      setIsSelectedDeleteSubmitting(true);
      const result = await requestShopClientApi<{ message?: string }>(getShopCartDeletePath(), {
        method: "POST",
        body: buildDeletePayload(selectedCartList),
      });

      // 비로그인/세션만료면 로그인 이동을 안내합니다.
      if (result.status === 401) {
        handleUnauthorizedResponse();
        return;
      }

      // 실패 응답이면 서버 메시지를 우선 노출합니다.
      if (!result.ok) {
        window.alert(result.message || "장바구니 선택 삭제에 실패했습니다.");
        return;
      }

      // 성공 시 완료 메시지를 노출하고 화면을 새로고침합니다.
      window.alert(result.message || "선택한 장바구니 상품을 삭제했습니다.");
      router.refresh();
    } catch {
      // 네트워크/예외 오류 시 공통 실패 문구를 노출합니다.
      window.alert("장바구니 선택 삭제에 실패했습니다.");
    } finally {
      // 요청 종료 후 로딩 상태를 해제합니다.
      setIsSelectedDeleteSubmitting(false);
    }
  };

  // 개별 장바구니 항목을 삭제합니다.
  const handleDeleteSingle = async (cartItem: ShopCartItem): Promise<void> => {
    // 중복 요청을 방지하고 삭제 확인을 수행합니다.
    const cartItemKey = buildCartItemKey(cartItem.goodsId, cartItem.sizeId);
    if (deletingItemKey !== "" || isSelectedDeleteSubmitting || isAllDeleteSubmitting || updatingItemKey !== "") {
      return;
    }
    const shouldDelete = window.confirm("해당 상품을 장바구니에서 삭제하시겠습니까?");
    if (!shouldDelete) {
      return;
    }

    try {
      // 단건 삭제 API를 호출하는 동안 행 삭제 상태를 설정합니다.
      setDeletingItemKey(cartItemKey);
      const result = await requestShopClientApi<{ message?: string }>(getShopCartDeletePath(), {
        method: "POST",
        body: buildDeletePayload([cartItem]),
      });

      // 비로그인/세션만료면 로그인 이동을 안내합니다.
      if (result.status === 401) {
        handleUnauthorizedResponse();
        return;
      }

      // 실패 응답이면 서버 메시지를 우선 노출합니다.
      if (!result.ok) {
        window.alert(result.message || "장바구니 삭제에 실패했습니다.");
        return;
      }

      // 성공 시 완료 메시지를 노출하고 화면을 새로고침합니다.
      window.alert(result.message || "선택한 장바구니 상품을 삭제했습니다.");
      router.refresh();
    } catch {
      // 네트워크/예외 오류 시 공통 실패 문구를 노출합니다.
      window.alert("장바구니 삭제에 실패했습니다.");
    } finally {
      // 요청 종료 후 행 삭제 상태를 해제합니다.
      setDeletingItemKey("");
    }
  };

  // 장바구니 전체 항목을 삭제합니다.
  const handleDeleteAll = async (): Promise<void> => {
    // 장바구니가 비어 있거나 로딩 중이면 삭제를 진행하지 않습니다.
    if (cartList.length === 0 || isAllDeleteSubmitting || deletingItemKey !== "" || updatingItemKey !== "") {
      if (cartList.length === 0) {
        window.alert("삭제할 장바구니 상품이 없습니다.");
      }
      return;
    }
    const shouldDelete = window.confirm("장바구니 상품을 전체 삭제하시겠습니까?");
    if (!shouldDelete) {
      return;
    }

    try {
      // 전체 삭제 API를 호출하는 동안 상단 버튼을 로딩 상태로 설정합니다.
      setIsAllDeleteSubmitting(true);
      const result = await requestShopClientApi<{ message?: string }>(getShopCartDeleteAllPath(), {
        method: "POST",
      });

      // 비로그인/세션만료면 로그인 이동을 안내합니다.
      if (result.status === 401) {
        handleUnauthorizedResponse();
        return;
      }

      // 실패 응답이면 서버 메시지를 우선 노출합니다.
      if (!result.ok) {
        window.alert(result.message || "장바구니 전체 삭제에 실패했습니다.");
        return;
      }

      // 성공 시 완료 메시지를 노출하고 화면을 새로고침합니다.
      window.alert(result.message || "장바구니 상품을 전체 삭제했습니다.");
      router.refresh();
    } catch {
      // 네트워크/예외 오류 시 공통 실패 문구를 노출합니다.
      window.alert("장바구니 전체 삭제에 실패했습니다.");
    } finally {
      // 요청 종료 후 로딩 상태를 해제합니다.
      setIsAllDeleteSubmitting(false);
    }
  };

  // 행 단위 주문하기 버튼 동작을 처리합니다.
  const handleOrderSingle = (cartItem: ShopCartItem): void => {
    // 상품 행 단건 주문 검증 후 주문서 화면으로 이동합니다.
    if (isCartItemStockShortage(cartItem)) {
      window.alert(resolveCartItemStockShortageMessage(cartItem));
      return;
    }
    if (normalizeQuantity(cartItem.qty) < 1) {
      window.alert("주문할 수량을 확인해주세요.");
      return;
    }
    if (cartItem.cartId < 1) {
      window.alert("주문 정보를 확인해주세요.");
      return;
    }
    router.push(buildShopOrderPath([cartItem.cartId]));
  };

  // 우측 가격표 주문하기 버튼 동작을 처리합니다.
  const handleOrderSelected = (): void => {
    // 선택된 상품이 없으면 주문 검증 메시지를 노출합니다.
    if (selectedCartList.length === 0) {
      window.alert("주문할 상품을 선택해주세요.");
      return;
    }
    const orderCartIdList = selectedCartList
      .map((cartItem) => cartItem.cartId)
      .filter((cartId) => Number.isFinite(cartId) && cartId > 0);
    if (orderCartIdList.length === 0) {
      window.alert("주문 정보를 확인해주세요.");
      return;
    }
    router.push(buildShopOrderPath(orderCartIdList));
  };

  return (
    <section className={styles.cartSection}>
      <div className={styles.cartLayout}>
        <div className={styles.leftPanel}>
          <header className={styles.sectionHeader}>
            <h1 className={styles.sectionTitle}>장바구니</h1>
            <p className={styles.sectionCount}>총 {cartPageData.cartCount.toLocaleString("ko-KR")}개</p>
          </header>

          <div className={styles.topActionRow}>
            <label className={styles.checkAllLabel}>
              <input type="checkbox" checked={isAllChecked} onChange={handleToggleAllCheck} />
              <span>전체선택</span>
            </label>
            <div className={styles.topButtonGroup}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleDeleteSelected}
                disabled={isSelectedDeleteSubmitting || cartList.length === 0 || updatingItemKey !== ""}
              >
                {isSelectedDeleteSubmitting ? "삭제중..." : "선택삭제"}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleDeleteAll}
                disabled={isAllDeleteSubmitting || cartList.length === 0 || updatingItemKey !== ""}
              >
                {isAllDeleteSubmitting ? "삭제중..." : "전체삭제"}
              </button>
            </div>
          </div>

          {cartList.length === 0 ? (
            <div className={styles.emptyState}>장바구니에 담긴 상품이 없습니다.</div>
          ) : (
            <ul className={styles.cartList}>
              {cartList.map((cartItem) => {
                const cartItemKey = buildCartItemKey(cartItem.goodsId, cartItem.sizeId);
                const optionDraft = resolveOptionDraft(cartItem);
                const rowQty = normalizeQuantity(optionDraft.qty);
                const rowSupplyAmt = normalizeNonNegativeNumber(cartItem.supplyAmt) * rowQty;
                const rowSaleAmt = normalizeNonNegativeNumber(cartItem.saleAmt) * rowQty;
                const editableSizeOptionList = resolveEditableSizeOptionList(cartItem.sizeOptions);
                const renderedSizeOptionList =
                  editableSizeOptionList.length > 0
                    ? editableSizeOptionList
                    : [{ sizeId: cartItem.sizeId, stockQty: 0, soldOut: false }];
                const isUpdating = updatingItemKey === cartItemKey;
                const isDeleting = deletingItemKey === cartItemKey;
                const isStockShortage = isCartItemStockShortage(cartItem);
                const checked = !isStockShortage && checkedKeySet.has(cartItemKey);
                return (
                  <li key={cartItemKey} className={styles.cartItem}>
                    <div className={styles.cartItemCheckWrap}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleItemCheck(cartItem)}
                        disabled={isStockShortage || isUpdating || isDeleting}
                      />
                    </div>

                    <Link href={`/goods?goodsId=${encodeURIComponent(cartItem.goodsId)}`} className={styles.thumbnailLink}>
                      {cartItem.imgUrl.trim() !== "" ? (
                        <Image src={cartItem.imgUrl} alt={cartItem.goodsNm} fill sizes="120px" className={styles.thumbnailImage} />
                      ) : (
                        <span className={styles.thumbnailFallback}>이미지 없음</span>
                      )}
                    </Link>

                    <div className={styles.itemContent}>
                      <Link href={`/goods?goodsId=${encodeURIComponent(cartItem.goodsId)}`} className={styles.goodsName}>
                        {cartItem.goodsNm}
                      </Link>
                      <p className={styles.goodsCode}>{cartItem.goodsId}</p>
                      <div className={styles.optionRow} onBlur={(event) => handleBlurOptionRow(event, cartItem)}>
                        <label className={styles.optionField}>
                          <span>사이즈</span>
                          <select
                            value={optionDraft.targetSizeId}
                            onChange={(event) => handleChangeOptionSize(cartItemKey, event.target.value)}
                            disabled={isUpdating || isDeleting}
                          >
                            {renderedSizeOptionList.map((sizeOption) => (
                              <option
                                key={`${cartItemKey}-${sizeOption.sizeId}`}
                                value={sizeOption.sizeId}
                                disabled={sizeOption.soldOut && sizeOption.sizeId !== cartItem.sizeId}
                              >
                                {sizeOption.sizeId}
                                {sizeOption.soldOut && sizeOption.sizeId !== cartItem.sizeId ? " (품절)" : ""}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className={styles.optionField}>
                          <span>수량</span>
                          <input
                            type="number"
                            min={1}
                            value={optionDraft.qty}
                            onChange={(event) => handleChangeOptionQty(cartItemKey, event.target.value)}
                            disabled={isUpdating || isDeleting}
                          />
                        </label>
                      </div>
                      {isStockShortage ? <p className={styles.stockWarningText}>{resolveCartItemStockShortageMessage(cartItem)}</p> : null}
                    </div>

                    <div className={styles.itemPriceColumn}>
                      <p className={styles.supplyPriceText}>{formatPrice(rowSupplyAmt)}원</p>
                      <p className={styles.salePriceText}>{formatPrice(rowSaleAmt)}원</p>
                    </div>

                    <div className={styles.itemActionColumn}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => handleOrderSingle(cartItem)}
                        disabled={isStockShortage || isUpdating || isDeleting}
                      >
                        주문하기
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => handleDeleteSingle(cartItem)}
                        disabled={isUpdating || isDeleting}
                      >
                        {isDeleting ? "삭제중..." : "삭제"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className={styles.rightPanel}>
          <h2 className={styles.summaryTitle}>주문 금액</h2>
          <dl className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <dt>상품 가격</dt>
              <dd>{formatPrice(summaryAmount.supplyAmt)}원</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>상품 할인금액</dt>
              <dd>{formatDiscountAmount(summaryAmount.discountAmt)}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>예상 최대 쿠폰 할인</dt>
              <dd>{isCouponEstimateLoading ? "계산중..." : formatDiscountAmount(couponEstimate.expectedMaxDiscountAmt)}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt className={styles.deliveryLabel}>
                배송비
                <span className={styles.deliveryTooltipWrap}>
                  <button type="button" className={styles.deliveryInfoButton} aria-label="무료배송 조건 안내">
                    ?
                  </button>
                  <span className={styles.deliveryTooltip} role="tooltip">
                    {formatPrice(normalizeNonNegativeNumber(cartPageData.siteInfo.deliveryFeeLimit))}원 이상 구매 시 무료배송
                  </span>
                </span>
              </dt>
              <dd>{formatPrice(summaryAmount.deliveryFee)}원</dd>
            </div>
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <dt>총 결제금액</dt>
              <dd>{isCouponEstimateLoading ? "계산중..." : `${formatPrice(expectedTotalPayAmt)}원`}</dd>
            </div>
          </dl>
          <button
            type="button"
            className={styles.orderButton}
            onClick={handleOrderSelected}
            disabled={
              selectedCartList.length === 0 || isSelectedDeleteSubmitting || isAllDeleteSubmitting || deletingItemKey !== "" || updatingItemKey !== ""
            }
          >
            선택 상품 주문하기
          </button>
        </aside>
      </div>
    </section>
  );
}
