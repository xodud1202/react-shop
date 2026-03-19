"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, MouseEvent, ReactNode } from "react";
import Image from "next/image";
import type { ShopCartItem, ShopCartSiteInfo } from "@/domains/cart/types";
import type {
  ShopOrderCouponItem,
  ShopOrderCouponOption,
  ShopOrderDiscountSelection,
  ShopOrderGoodsCouponGroup,
} from "@/domains/order/types";
import styles from "./ShopOrderAddressLayer.module.css";

interface ShopOrderCouponLayerProps {
  cartList: ShopCartItem[];
  siteInfo: ShopCartSiteInfo;
  couponOption: ShopOrderCouponOption;
  initialSelection: ShopOrderDiscountSelection;
  isSubmitting: boolean;
  onApply: (selection: ShopOrderDiscountSelection) => void | Promise<void>;
  onClose: () => void;
}

// 공통 레이어 오버레이 바깥 영역 클릭 여부를 판정합니다.
function isOverlayClick(event: MouseEvent<HTMLDivElement>): boolean {
  return event.target === event.currentTarget;
}

// 숫자 값을 0 이상 정수로 보정합니다.
function normalizeNonNegativeNumber(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(Math.floor(value), 0);
}

// 수량 값을 1 이상 정수로 보정합니다.
function normalizeQuantity(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(Math.floor(value), 1);
}

// 금액을 천 단위 콤마 문자열로 변환합니다.
function formatPrice(value: number): string {
  return normalizeNonNegativeNumber(value).toLocaleString("ko-KR");
}

// 쿠폰 사용 가능 일시 문자열을 표시용 날짜 문자열로 변환합니다.
function formatCouponDateTime(value: string): string {
  if (value.trim() === "") {
    return "";
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

// 쿠폰 사용 기간 라벨을 생성합니다.
function buildCouponUsablePeriodLabel(coupon: ShopOrderCouponItem): string {
  const startDate = formatCouponDateTime(coupon.cpnUsableStartDt);
  const endDate = formatCouponDateTime(coupon.cpnUsableEndDt);
  if (startDate !== "" && endDate !== "") {
    return `${startDate} ~ ${endDate}`;
  }
  if (endDate !== "") {
    return `~ ${endDate}`;
  }
  if (startDate !== "") {
    return `${startDate} ~`;
  }
  return "사용기간 정보 없음";
}

// 쿠폰 할인 금액을 계산합니다.
function resolveCouponDiscountAmt(coupon: ShopOrderCouponItem | null | undefined, baseAmt: number): number {
  const safeBaseAmt = normalizeNonNegativeNumber(baseAmt);
  if (!coupon || safeBaseAmt < 1) {
    return 0;
  }
  if (coupon.cpnDcGbCd === "CPN_DC_GB_01") {
    return Math.min(safeBaseAmt, normalizeNonNegativeNumber(coupon.cpnDcVal));
  }
  if (coupon.cpnDcGbCd === "CPN_DC_GB_02") {
    return Math.floor((safeBaseAmt * normalizeNonNegativeNumber(coupon.cpnDcVal)) / 100);
  }
  return 0;
}

// 주문 상품 행의 판매가 합계를 계산합니다.
function resolveCartRowSaleAmt(cartItem: ShopCartItem): number {
  return normalizeNonNegativeNumber(cartItem.saleAmt) * normalizeQuantity(cartItem.qty);
}

// 주문 상품 행의 공급가 합계를 계산합니다.
function resolveCartRowSupplyAmt(cartItem: ShopCartItem): number {
  return normalizeNonNegativeNumber(cartItem.supplyAmt) * normalizeQuantity(cartItem.qty);
}

// 주문 상품 전체 판매가 합계를 계산합니다.
function resolveTotalSaleAmt(cartList: ShopCartItem[]): number {
  return cartList.reduce((sum, cartItem) => sum + resolveCartRowSaleAmt(cartItem), 0);
}

// 현재 주문 상품 판매가 합계 기준 배송비를 계산합니다.
function resolveDeliveryFee(totalSaleAmt: number, siteInfo: ShopCartSiteInfo): number {
  const deliveryFee = normalizeNonNegativeNumber(siteInfo.deliveryFee);
  const deliveryFeeLimit = normalizeNonNegativeNumber(siteInfo.deliveryFeeLimit);
  if (normalizeNonNegativeNumber(totalSaleAmt) >= deliveryFeeLimit) {
    return 0;
  }
  return deliveryFee;
}

// 주문 상품 목록을 cartId 기준 맵으로 변환합니다.
function buildCartItemMap(cartList: ShopCartItem[]): Map<number, ShopCartItem> {
  const result = new Map<number, ShopCartItem>();
  cartList.forEach((cartItem) => {
    if (cartItem.cartId > 0) {
      result.set(cartItem.cartId, cartItem);
    }
  });
  return result;
}

// 상품쿠폰 그룹 목록을 cartId 기준 맵으로 변환합니다.
function buildGoodsCouponGroupMap(goodsCouponGroupList: ShopOrderGoodsCouponGroup[]): Map<number, ShopOrderGoodsCouponGroup> {
  const result = new Map<number, ShopOrderGoodsCouponGroup>();
  goodsCouponGroupList.forEach((group) => {
    if (group.cartId > 0) {
      result.set(group.cartId, group);
    }
  });
  return result;
}

// 특정 고객 보유 쿠폰 번호에 해당하는 쿠폰을 목록에서 조회합니다.
function findCouponByCustCpnNo(couponList: ShopOrderCouponItem[], custCpnNo: number | null): ShopOrderCouponItem | null {
  if (!custCpnNo) {
    return null;
  }
  return couponList.find((coupon) => coupon.custCpnNo === custCpnNo) ?? null;
}

// 현재 작업중인 상품쿠폰 선택 기준 할인 합계를 계산합니다.
function resolveWorkingGoodsCouponDiscountAmt(
  goodsCouponGroupMap: Map<number, ShopOrderGoodsCouponGroup>,
  cartItemMap: Map<number, ShopCartItem>,
  selection: ShopOrderDiscountSelection,
): number {
  return selection.goodsCouponSelectionList.reduce((sum, item) => {
    if (!item.custCpnNo) {
      return sum;
    }
    const group = goodsCouponGroupMap.get(item.cartId);
    const cartItem = cartItemMap.get(item.cartId);
    if (!group || !cartItem) {
      return sum;
    }
    const coupon = findCouponByCustCpnNo(group.couponList, item.custCpnNo);
    return sum + resolveCouponDiscountAmt(coupon, resolveCartRowSaleAmt(cartItem));
  }, 0);
}

// 현재 작업중인 상품쿠폰 선택에서 다른 상품행이 이미 사용 중인 쿠폰 번호 집합을 반환합니다.
function buildSelectedGoodsCouponSet(selection: ShopOrderDiscountSelection, currentCartId: number): Set<number> {
  const result = new Set<number>();
  selection.goodsCouponSelectionList.forEach((item) => {
    if (item.cartId === currentCartId || !item.custCpnNo) {
      return;
    }
    result.add(item.custCpnNo);
  });
  return result;
}

// 셀렉트박스 값 문자열을 고객 보유 쿠폰 번호로 변환합니다.
function parseSelectedCouponValue(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return null;
  }
  return Math.floor(parsedValue);
}

// 셀렉트박스 옵션 라벨을 생성합니다.
function buildCouponOptionLabel(coupon: ShopOrderCouponItem, baseAmt: number): string {
  const discountAmt = resolveCouponDiscountAmt(coupon, baseAmt);
  const usablePeriodLabel = buildCouponUsablePeriodLabel(coupon);
  return `${coupon.cpnNm} (-${formatPrice(discountAmt)}원 / 사용기간 ${usablePeriodLabel})`;
}

// 쿠폰 적용 레이어팝업을 렌더링합니다.
export default function ShopOrderCouponLayer({
  cartList,
  siteInfo,
  couponOption,
  initialSelection,
  isSubmitting,
  onApply,
  onClose,
}: ShopOrderCouponLayerProps) {
  const [workingSelection, setWorkingSelection] = useState<ShopOrderDiscountSelection>(initialSelection);
  const cartItemMap = useMemo(() => buildCartItemMap(cartList), [cartList]);
  const goodsCouponGroupMap = useMemo(
    () => buildGoodsCouponGroupMap(couponOption.goodsCouponGroupList),
    [couponOption.goodsCouponGroupList],
  );
  const totalSaleAmt = useMemo(() => resolveTotalSaleAmt(cartList), [cartList]);
  const deliveryFee = useMemo(() => resolveDeliveryFee(totalSaleAmt, siteInfo), [siteInfo, totalSaleAmt]);
  const goodsCouponDiscountAmt = useMemo(
    () => resolveWorkingGoodsCouponDiscountAmt(goodsCouponGroupMap, cartItemMap, workingSelection),
    [cartItemMap, goodsCouponGroupMap, workingSelection],
  );
  const discountedSaleAmt = Math.max(totalSaleAmt - goodsCouponDiscountAmt, 0);

  // 팝업이 열린 동안 배경 스크롤을 잠그고 ESC 키 닫기를 처리합니다.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleDocumentKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isSubmitting, onClose]);

  // 부모에서 현재 선택 상태가 바뀌면 작업중 선택 상태도 함께 동기화합니다.
  useEffect(() => {
    setWorkingSelection(initialSelection);
  }, [initialSelection]);

  // 오버레이 바깥 영역 클릭 시 팝업을 닫습니다.
  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>): void => {
    if (!isOverlayClick(event) || isSubmitting) {
      return;
    }
    onClose();
  };

  // 특정 상품행의 상품쿠폰 선택값을 변경합니다.
  const handleGoodsCouponChange = (cartId: number, event: ChangeEvent<HTMLSelectElement>): void => {
    const nextCustCpnNo = parseSelectedCouponValue(event.target.value);
    setWorkingSelection((previousSelection) => ({
      ...previousSelection,
      goodsCouponSelectionList: couponOption.goodsCouponGroupList.map((group) => {
        const currentSelection = previousSelection.goodsCouponSelectionList.find((item) => item.cartId === group.cartId);
        return {
          cartId: group.cartId,
          custCpnNo: group.cartId === cartId ? nextCustCpnNo : currentSelection?.custCpnNo ?? null,
        };
      }),
    }));
  };

  // 장바구니 쿠폰 선택값을 변경합니다.
  const handleCartCouponChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    setWorkingSelection((previousSelection) => ({
      ...previousSelection,
      cartCouponCustCpnNo: parseSelectedCouponValue(event.target.value),
    }));
  };

  // 배송비 쿠폰 선택값을 변경합니다.
  const handleDeliveryCouponChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    setWorkingSelection((previousSelection) => ({
      ...previousSelection,
      deliveryCouponCustCpnNo: parseSelectedCouponValue(event.target.value),
    }));
  };

  // 적용 버튼 클릭 시 현재 작업중 선택 상태를 부모에 전달합니다.
  const handleApplyClick = (): void => {
    void onApply(workingSelection);
  };

  // 주문 상품 정보를 주문서 상품 리스트형 카드로 렌더링합니다.
  const renderOrderItemPreview = (cartItem: ShopCartItem): ReactNode => {
    const rowQty = normalizeQuantity(cartItem.qty);
    const rowSupplyAmt = resolveCartRowSupplyAmt(cartItem);
    const rowSaleAmt = resolveCartRowSaleAmt(cartItem);
    const showDiscount = rowSupplyAmt > rowSaleAmt;

    return (
      <div className={styles.couponGoodsItemCard}>
        <div className={styles.couponGoodsThumbnailWrap}>
          {cartItem.imgUrl.trim() !== "" ? (
            <Image src={cartItem.imgUrl} alt={cartItem.goodsNm} fill sizes="88px" className={styles.couponGoodsThumbnailImage} />
          ) : (
            <span className={styles.couponGoodsThumbnailFallback}>이미지 없음</span>
          )}
        </div>

        <div className={styles.couponGoodsContent}>
          <p className={styles.couponGoodsBrand}>{cartItem.brandNm || "브랜드"}</p>
          <p className={styles.couponGoodsName}>{cartItem.goodsNm}</p>
          <dl className={styles.couponGoodsMetaList}>
            <div className={styles.couponGoodsMetaRow}>
              <dt>사이즈</dt>
              <dd>{cartItem.sizeId}</dd>
            </div>
            <div className={styles.couponGoodsMetaRow}>
              <dt>수량</dt>
              <dd>{rowQty}개</dd>
            </div>
          </dl>
        </div>

        <div className={styles.couponGoodsPriceColumn}>
          {showDiscount ? (
            <>
              <p className={styles.couponGoodsSupplyPrice}>{formatPrice(rowSupplyAmt)}원</p>
              <p className={styles.couponGoodsSalePrice}>{formatPrice(rowSaleAmt)}원</p>
            </>
          ) : (
            <p className={styles.couponGoodsSalePrice}>{formatPrice(rowSaleAmt)}원</p>
          )}
        </div>
      </div>
    );
  };

  // 상품쿠폰 섹션을 렌더링합니다.
  const renderGoodsCouponSection = (): ReactNode => {
    if (couponOption.goodsCouponGroupList.length === 0) {
      return <p className={styles.couponEmptyText}>적용 가능한 상품쿠폰이 없습니다.</p>;
    }

    return (
      <div className={styles.couponGroupList}>
        {couponOption.goodsCouponGroupList.map((group) => {
          const cartItem = cartItemMap.get(group.cartId);
          const selectedCustCpnNo =
            workingSelection.goodsCouponSelectionList.find((item) => item.cartId === group.cartId)?.custCpnNo ?? null;
          const selectedCouponSet = buildSelectedGoodsCouponSet(workingSelection, group.cartId);
          const rowSaleAmt = cartItem ? resolveCartRowSaleAmt(cartItem) : 0;

          return (
            <section key={group.cartId} className={styles.couponGoodsSection}>
              {cartItem ? renderOrderItemPreview(cartItem) : null}

              <div className={styles.couponSelectBlock}>
                <label className={styles.couponSelectLabel}>
                  <span className={styles.couponSelectTitle}>상품쿠폰 선택</span>
                  <select
                    className={styles.couponSelect}
                    value={selectedCustCpnNo ? String(selectedCustCpnNo) : ""}
                    onChange={(event) => handleGoodsCouponChange(group.cartId, event)}
                    disabled={isSubmitting}
                  >
                    <option value="">미적용</option>
                    {group.couponList.map((coupon) => {
                      const isDisabled = selectedCouponSet.has(coupon.custCpnNo);
                      return (
                        <option key={coupon.custCpnNo} value={coupon.custCpnNo} disabled={isDisabled}>
                          {buildCouponOptionLabel(coupon, rowSaleAmt)}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>
            </section>
          );
        })}
      </div>
    );
  };

  // 공통 단일 쿠폰 섹션을 렌더링합니다.
  const renderSingleCouponSection = (
    sectionTitle: string,
    sectionDescription: string,
    couponList: ShopOrderCouponItem[],
    selectedCustCpnNo: number | null,
    baseAmt: number,
    onChange: (event: ChangeEvent<HTMLSelectElement>) => void,
  ): ReactNode => {
    return (
      <section className={styles.couponCardSection}>
        <div className={styles.couponCardHeader}>
          <strong className={styles.couponCardTitle}>{sectionTitle}</strong>
          <span className={styles.couponCardMeta}>{sectionDescription}</span>
        </div>

        {couponList.length === 0 ? (
          <p className={styles.couponEmptyText}>적용 가능한 쿠폰이 없습니다.</p>
        ) : (
          <div className={styles.couponSelectBlock}>
            <label className={styles.couponSelectLabel}>
              <span className={styles.couponSelectTitle}>{sectionTitle} 선택</span>
              <select
                className={styles.couponSelect}
                value={selectedCustCpnNo ? String(selectedCustCpnNo) : ""}
                onChange={onChange}
                disabled={isSubmitting}
              >
                <option value="">미적용</option>
                {couponList.map((coupon) => (
                  <option key={coupon.custCpnNo} value={coupon.custCpnNo}>
                    {buildCouponOptionLabel(coupon, baseAmt)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </section>
    );
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="쿠폰 적용" onClick={handleOverlayClick}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerActionRow}>
            <div>
              <h2 className={styles.headerTitle}>쿠폰 적용</h2>
              <p className={styles.couponHeaderDescription}>상품쿠폰, 장바구니 쿠폰, 배송비 쿠폰을 각각 선택할 수 있습니다.</p>
            </div>
            <div className={styles.headerButtonGroup}>
              <button type="button" className={styles.closeButton} aria-label="쿠폰 적용 팝업 닫기" onClick={onClose} disabled={isSubmitting}>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <section className={styles.couponCardSection}>
            <div className={styles.couponCardHeader}>
              <strong className={styles.couponCardTitle}>상품 쿠폰</strong>
              <span className={styles.couponCardMeta}>주문 상품별로 1장씩 선택할 수 있습니다.</span>
            </div>
            {renderGoodsCouponSection()}
          </section>

          {renderSingleCouponSection(
            "장바구니 쿠폰",
            `상품쿠폰 적용 후 ${formatPrice(discountedSaleAmt)}원 기준`,
            couponOption.cartCouponList,
            workingSelection.cartCouponCustCpnNo,
            discountedSaleAmt,
            handleCartCouponChange,
          )}

          {renderSingleCouponSection(
            "배송비 쿠폰",
            `현재 배송비 ${formatPrice(deliveryFee)}원 기준`,
            couponOption.deliveryCouponList,
            workingSelection.deliveryCouponCustCpnNo,
            deliveryFee,
            handleDeliveryCouponChange,
          )}
        </div>

        <div className={styles.panelFooter}>
          <div className={styles.footerButtonRow}>
            <button type="button" className={`${styles.secondaryButton} ${styles.footerButton}`} onClick={onClose} disabled={isSubmitting}>
              닫기
            </button>
            <button type="button" className={`${styles.primaryButton} ${styles.footerButton}`} onClick={handleApplyClick} disabled={isSubmitting}>
              {isSubmitting ? "적용 중..." : "적용"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
