"use client";

import { useEffect, useMemo, useState } from "react";
import type { FocusEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getShopCartDeleteAllPath, getShopCartDeletePath, getShopCartOptionUpdatePath } from "@/domains/cart/api/cartServerApi";
import type { ShopCartItem, ShopCartPageResponse, ShopCartSiteInfo, ShopCartSizeOption } from "@/domains/cart/types";
import { buildLoginFormPath } from "@/domains/login/utils/loginRedirectUtils";
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

// 현재 페이지 경로(pathname + search)를 로그인 복귀용 경로로 반환합니다.
function resolveCurrentPagePath(): string {
  if (typeof window === "undefined") {
    return "/cart";
  }
  return `${window.location.pathname}${window.location.search}`;
}

// 장바구니 목록 기준 초기 체크 상태(전체 선택)를 생성합니다.
function createInitialCheckedKeySet(cartList: ShopCartItem[]): Set<string> {
  return new Set(cartList.map((cartItem) => buildCartItemKey(cartItem.goodsId, cartItem.sizeId)));
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
  return cartList.filter((cartItem) => checkedKeySet.has(buildCartItemKey(cartItem.goodsId, cartItem.sizeId)));
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

  // 서버 응답(cartPageData)이 갱신되면 체크 상태와 Draft 상태를 초기화합니다.
  useEffect(() => {
    setCheckedKeySet(createInitialCheckedKeySet(cartList));
    setOptionDraftMap(createInitialOptionDraftMap(cartList));
  }, [cartList]);

  // 장바구니 전체 키 목록을 계산합니다.
  const allCartItemKeyList = useMemo(
    () => cartList.map((cartItem) => buildCartItemKey(cartItem.goodsId, cartItem.sizeId)),
    [cartList],
  );

  // 상단 전체선택 체크 상태를 계산합니다.
  const isAllChecked = useMemo(() => {
    if (allCartItemKeyList.length === 0) {
      return false;
    }
    return allCartItemKeyList.every((cartItemKey) => checkedKeySet.has(cartItemKey));
  }, [allCartItemKeyList, checkedKeySet]);

  // 선택된 장바구니 목록을 계산합니다.
  const selectedCartList = useMemo(() => resolveSelectedCartItemList(cartList, checkedKeySet), [cartList, checkedKeySet]);

  // 우측 가격표 금액 요약값을 계산합니다.
  const summaryAmount = useMemo(
    () => resolveSummaryAmount(selectedCartList, cartPageData.siteInfo),
    [selectedCartList, cartPageData.siteInfo],
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
  const handleUnauthorizedResponse = (): void => {
    // 로그인 이동 여부를 확인하고 returnUrl과 함께 로그인 페이지로 이동합니다.
    const shouldMoveLogin = window.confirm("로그인이 필요한 기능입니다. 로그인하시겠습니까?");
    if (shouldMoveLogin) {
      router.push(buildLoginFormPath(resolveCurrentPagePath()));
    }
  };

  // 상단 전체선택 체크박스 토글을 처리합니다.
  const handleToggleAllCheck = (): void => {
    // 전체 선택 상태면 전체 해제, 아니면 전체 선택으로 전환합니다.
    if (isAllChecked) {
      setCheckedKeySet(new Set());
      return;
    }
    setCheckedKeySet(new Set(allCartItemKeyList));
  };

  // 개별 행 체크박스 토글을 처리합니다.
  const handleToggleItemCheck = (cartItem: ShopCartItem): void => {
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
      const response = await fetch(getShopCartOptionUpdatePath(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          goodsId: cartItem.goodsId,
          sizeId: cartItem.sizeId,
          targetSizeId: draft.targetSizeId,
          qty: draft.qty,
        }),
      });

      // 응답 본문(JSON)이 없거나 파싱 실패해도 안전하게 처리합니다.
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      // 비로그인/세션만료면 로그인 이동을 안내합니다.
      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }

      // 실패 응답이면 서버 메시지를 우선 노출합니다.
      if (!response.ok) {
        window.alert(payload?.message ?? "장바구니 옵션 변경에 실패했습니다.");
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
      const response = await fetch(getShopCartDeletePath(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(buildDeletePayload(selectedCartList)),
      });

      // 응답 본문(JSON)이 없거나 파싱 실패해도 안전하게 처리합니다.
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      // 비로그인/세션만료면 로그인 이동을 안내합니다.
      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }

      // 실패 응답이면 서버 메시지를 우선 노출합니다.
      if (!response.ok) {
        window.alert(payload?.message ?? "장바구니 선택 삭제에 실패했습니다.");
        return;
      }

      // 성공 시 완료 메시지를 노출하고 화면을 새로고침합니다.
      window.alert(payload?.message ?? "선택한 장바구니 상품을 삭제했습니다.");
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
      const response = await fetch(getShopCartDeletePath(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(buildDeletePayload([cartItem])),
      });

      // 응답 본문(JSON)이 없거나 파싱 실패해도 안전하게 처리합니다.
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      // 비로그인/세션만료면 로그인 이동을 안내합니다.
      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }

      // 실패 응답이면 서버 메시지를 우선 노출합니다.
      if (!response.ok) {
        window.alert(payload?.message ?? "장바구니 삭제에 실패했습니다.");
        return;
      }

      // 성공 시 완료 메시지를 노출하고 화면을 새로고침합니다.
      window.alert(payload?.message ?? "선택한 장바구니 상품을 삭제했습니다.");
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
      const response = await fetch(getShopCartDeleteAllPath(), {
        method: "POST",
        credentials: "include",
      });

      // 응답 본문(JSON)이 없거나 파싱 실패해도 안전하게 처리합니다.
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      // 비로그인/세션만료면 로그인 이동을 안내합니다.
      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }

      // 실패 응답이면 서버 메시지를 우선 노출합니다.
      if (!response.ok) {
        window.alert(payload?.message ?? "장바구니 전체 삭제에 실패했습니다.");
        return;
      }

      // 성공 시 완료 메시지를 노출하고 화면을 새로고침합니다.
      window.alert(payload?.message ?? "장바구니 상품을 전체 삭제했습니다.");
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
    // 상품 행 단건 주문 검증 후 준비중 안내를 노출합니다.
    if (normalizeQuantity(cartItem.qty) < 1) {
      window.alert("주문할 수량을 확인해주세요.");
      return;
    }
    window.alert("주문 서비스는 준비중입니다.");
  };

  // 우측 가격표 주문하기 버튼 동작을 처리합니다.
  const handleOrderSelected = (): void => {
    // 선택된 상품이 없으면 주문 검증 메시지를 노출합니다.
    if (selectedCartList.length === 0) {
      window.alert("주문할 상품을 선택해주세요.");
      return;
    }
    window.alert("주문 서비스는 준비중입니다.");
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
                const checked = checkedKeySet.has(cartItemKey);
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
                return (
                  <li key={cartItemKey} className={styles.cartItem}>
                    <div className={styles.cartItemCheckWrap}>
                      <input type="checkbox" checked={checked} onChange={() => handleToggleItemCheck(cartItem)} />
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
                        disabled={isUpdating || isDeleting}
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
              <dd>{formatPrice(summaryAmount.totalPayAmt)}원</dd>
            </div>
          </dl>
          <button type="button" className={styles.orderButton} onClick={handleOrderSelected}>
            선택 상품 주문하기
          </button>
        </aside>
      </div>
    </section>
  );
}
