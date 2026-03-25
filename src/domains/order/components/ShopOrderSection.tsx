"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { ShopCartItem, ShopCartSiteInfo } from "@/domains/cart/types";
import {
  getShopOrderDiscountQuotePath,
  getShopOrderPaymentPreparePath,
  normalizeShopOrderDiscountQuoteResponse,
  normalizeShopOrderPaymentPrepareResponse,
} from "@/domains/order/api/orderApi";
import ShopOrderAddressRegisterLayer from "@/domains/order/components/ShopOrderAddressRegisterLayer";
import ShopOrderAddressSelectLayer from "@/domains/order/components/ShopOrderAddressSelectLayer";
import ShopOrderCouponLayer from "@/domains/order/components/ShopOrderCouponLayer";
import type {
  ShopOrderAddress,
  ShopOrderAddressSaveResponse,
  ShopOrderDiscountAmount,
  ShopOrderDiscountSelection,
  ShopOrderEntryInfo,
  ShopOrderPageResponse,
  ShopOrderPaymentFailureInfo,
  ShopOrderPaymentMethodCd,
} from "@/domains/order/types";
import { requestTossPayment } from "@/domains/order/utils/tossPayments";
import styles from "./ShopOrderSection.module.css";

interface ShopOrderSummaryAmount {
  totalSupplyAmt: number;
  goodsDiscountAmt: number;
  deliveryFee: number;
  couponDiscountAmt: number;
  pointUseAmt: number;
  finalPayAmt: number;
}

interface ShopOrderSectionProps {
  orderPageData: ShopOrderPageResponse;
  entryInfo: ShopOrderEntryInfo;
  paymentFailureInfo: ShopOrderPaymentFailureInfo;
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

// 수량 값을 1 이상 정수로 보정합니다.
function normalizeQuantity(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(Math.floor(value), 1);
}

// 주문 상품 행의 공급가 합계를 계산합니다.
function resolveCartRowSupplyAmt(cartItem: ShopCartItem): number {
  return normalizeNonNegativeNumber(cartItem.supplyAmt) * normalizeQuantity(cartItem.qty);
}

// 주문 상품 행의 판매가 합계를 계산합니다.
function resolveCartRowSaleAmt(cartItem: ShopCartItem): number {
  return normalizeNonNegativeNumber(cartItem.saleAmt) * normalizeQuantity(cartItem.qty);
}

// 현재 주문 상품 판매가 합계 기준 배송비를 계산합니다.
function resolveDeliveryFee(cartList: ShopCartItem[], siteInfo: ShopCartSiteInfo): number {
  const totalSaleAmt = cartList.reduce((sum, cartItem) => sum + resolveCartRowSaleAmt(cartItem), 0);
  const deliveryFee = normalizeNonNegativeNumber(siteInfo.deliveryFee);
  const deliveryFeeLimit = normalizeNonNegativeNumber(siteInfo.deliveryFeeLimit);
  if (totalSaleAmt >= deliveryFeeLimit) {
    return 0;
  }
  return deliveryFee;
}

// 주문서 우측 금액 요약을 계산합니다.
function resolveOrderSummaryAmount(
  cartList: ShopCartItem[],
  siteInfo: ShopCartSiteInfo,
  discountAmount: ShopOrderDiscountAmount,
  pointUseAmt: number,
): ShopOrderSummaryAmount {
  const totalSupplyAmt = cartList.reduce((sum, cartItem) => sum + resolveCartRowSupplyAmt(cartItem), 0);
  const totalSaleAmt = cartList.reduce((sum, cartItem) => sum + resolveCartRowSaleAmt(cartItem), 0);
  const goodsDiscountAmt = Math.max(totalSupplyAmt - totalSaleAmt, 0);
  const couponDiscountAmt = normalizeNonNegativeNumber(discountAmount.couponDiscountAmt);
  const normalizedPointUseAmt = normalizeNonNegativeNumber(pointUseAmt);
  const deliveryFee = resolveDeliveryFee(cartList, siteInfo);
  return {
    totalSupplyAmt,
    goodsDiscountAmt,
    deliveryFee,
    couponDiscountAmt,
    pointUseAmt: normalizedPointUseAmt,
    finalPayAmt: Math.max(totalSaleAmt + deliveryFee - couponDiscountAmt - normalizedPointUseAmt, 0),
  };
}

// 금액을 할인 표기 형식으로 변환합니다.
function formatDiscountPrice(value: number): string {
  const safeValue = normalizeNonNegativeNumber(value);
  if (safeValue < 1) {
    return "0원";
  }
  return `-${formatPrice(safeValue)}원`;
}

// 배송지 기본주소 라인을 포맷 문자열로 변환합니다.
function formatAddressLine(address: ShopOrderAddress): string {
  return `(${address.postNo}) ${address.baseAddress}`;
}

// 포인트 입력 문자열에서 숫자만 남기고 정리합니다.
function sanitizePointInputValue(value: string): string {
  const digitsOnly = value.replace(/[^\d]/g, "");
  if (digitsOnly === "") {
    return "";
  }
  return String(normalizeNonNegativeNumber(Number(digitsOnly)));
}

// 현재 입력한 포인트 사용 금액을 최대 사용 가능 금액 기준으로 보정합니다.
function clampPointUseAmt(pointUseAmt: number, maxPointUseAmt: number): number {
  return Math.min(normalizeNonNegativeNumber(pointUseAmt), normalizeNonNegativeNumber(maxPointUseAmt));
}

// 현재 적용된 쿠폰 개수 요약 문구를 생성합니다.
function resolveCouponSelectionSummary(discountSelection: ShopOrderDiscountSelection): string {
  const goodsCouponCount = discountSelection.goodsCouponSelectionList.filter((item) => item.custCpnNo !== null).length;
  const cartCouponCount = discountSelection.cartCouponCustCpnNo !== null ? 1 : 0;
  const deliveryCouponCount = discountSelection.deliveryCouponCustCpnNo !== null ? 1 : 0;
  const summaryList: string[] = [];
  if (goodsCouponCount > 0) {
    summaryList.push(`상품쿠폰 ${goodsCouponCount}장`);
  }
  if (cartCouponCount > 0) {
    summaryList.push("장바구니 쿠폰 1장");
  }
  if (deliveryCouponCount > 0) {
    summaryList.push("배송비 쿠폰 1장");
  }
  return summaryList.length > 0 ? summaryList.join(" / ") : "적용된 쿠폰이 없습니다.";
}

// 주문서 섹션 UI를 렌더링합니다.
export default function ShopOrderSection({ orderPageData, entryInfo, paymentFailureInfo }: ShopOrderSectionProps) {
  const [agreed, setAgreed] = useState(false);
  const [addressList, setAddressList] = useState<ShopOrderAddress[]>(orderPageData.addressList);
  const [selectedAddress, setSelectedAddress] = useState<ShopOrderAddress | null>(orderPageData.defaultAddress);
  const [saveAsDefaultOnOrder, setSaveAsDefaultOnOrder] = useState(false);
  const [showAddressSelectLayer, setShowAddressSelectLayer] = useState(false);
  const [showAddressRegisterLayer, setShowAddressRegisterLayer] = useState(false);
  const [addressRegisterMode, setAddressRegisterMode] = useState<"create" | "edit">("create");
  const [editingAddress, setEditingAddress] = useState<ShopOrderAddress | null>(null);
  const [discountSelection, setDiscountSelection] = useState<ShopOrderDiscountSelection>(orderPageData.discountSelection);
  const [discountAmount, setDiscountAmount] = useState<ShopOrderDiscountAmount>(orderPageData.discountAmount);
  const [showCouponLayer, setShowCouponLayer] = useState(false);
  const [isQuotingDiscount, setIsQuotingDiscount] = useState(false);
  const [selectedPaymentMethodCd, setSelectedPaymentMethodCd] = useState<ShopOrderPaymentMethodCd>("");
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [pointUseAmt, setPointUseAmt] = useState(0);
  const [pointInputValue, setPointInputValue] = useState("");
  const summaryAmount = useMemo(
    () => resolveOrderSummaryAmount(orderPageData.cartList, orderPageData.siteInfo, discountAmount, pointUseAmt),
    [discountAmount, orderPageData.cartList, orderPageData.siteInfo, pointUseAmt],
  );

  useEffect(() => {
    // 결제 실패 복귀 시 서버 메시지를 우선 노출합니다.
    if (paymentFailureInfo.payResult !== "fail") {
      return;
    }
    window.alert(paymentFailureInfo.message.trim() || "결제가 완료되지 않았습니다. 다시 시도해주세요.");
  }, [paymentFailureInfo.code, paymentFailureInfo.message, paymentFailureInfo.payResult]);

  useEffect(() => {
    // 쿠폰 할인 금액이 바뀌면 현재 포인트 입력값도 최대 사용 가능 금액 기준으로 즉시 동기화합니다.
    const nextPointUseAmt = clampPointUseAmt(pointUseAmt, discountAmount.maxPointUseAmt);
    const nextPointInputValue = nextPointUseAmt > 0 ? String(nextPointUseAmt) : "";
    if (nextPointUseAmt === pointUseAmt && nextPointInputValue === pointInputValue) {
      return;
    }
    setPointUseAmt(nextPointUseAmt);
    setPointInputValue(nextPointInputValue);
  }, [discountAmount.maxPointUseAmt, pointInputValue, pointUseAmt]);

  // 주문하기 버튼 클릭 시 결제 준비 후 Toss 결제창을 실행합니다.
  const handleOrderButtonClick = async (): Promise<void> => {
    if (!agreed) {
      window.alert("구매 동의 후 주문할 수 있습니다.");
      return;
    }
    if (!selectedAddress) {
      window.alert("배송지를 선택해주세요.");
      return;
    }
    if (selectedPaymentMethodCd === "") {
      window.alert("결제수단을 선택해주세요.");
      return;
    }

    try {
      setIsPreparingPayment(true);
      const response = await fetch(getShopOrderPaymentPreparePath(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          from: entryInfo.from,
          goodsId: entryInfo.goodsId,
          cartIdList: entryInfo.cartIdList,
          addressNm: selectedAddress.addressNm,
          discountSelection,
          pointUseAmt,
          paymentMethodCd: selectedPaymentMethodCd,
        }),
      });
      const payload = await response.json().catch(() => null);

      // 로그인 세션이 만료되면 안내 문구를 우선 노출합니다.
      if (response.status === 401) {
        window.alert("로그인이 필요합니다.");
        return;
      }

      // 서버 검증 실패 시 서버 메시지를 우선 노출합니다.
      if (!response.ok) {
        const message = payload && typeof payload === "object" && "message" in payload ? String(payload.message ?? "") : "";
        window.alert(message || "주문 결제 준비에 실패했습니다.");
        return;
      }

      // 결제 준비 결과를 정규화한 뒤 Toss 결제창을 실행합니다.
      const paymentPrepareResponse = normalizeShopOrderPaymentPrepareResponse(payload);
      if (paymentPrepareResponse.payNo < 1 || paymentPrepareResponse.orderId.trim() === "") {
        window.alert("주문 결제 준비에 실패했습니다.");
        return;
      }
      await requestTossPayment(paymentPrepareResponse);
    } catch {
      window.alert("결제 연결에 실패했습니다.");
    } finally {
      setIsPreparingPayment(false);
    }
  };

  // 배송지 선택 레이어를 엽니다.
  const handleOpenAddressSelectLayer = (): void => {
    setShowAddressSelectLayer(true);
  };

  // 배송지 선택 레이어를 닫습니다.
  const handleCloseAddressSelectLayer = (): void => {
    setShowAddressSelectLayer(false);
  };

  // 배송지 등록 레이어를 엽니다.
  const handleOpenAddressRegisterLayer = (): void => {
    setShowAddressSelectLayer(false);
    setAddressRegisterMode("create");
    setEditingAddress(null);
    setShowAddressRegisterLayer(true);
  };

  // 배송지 수정 레이어를 엽니다.
  const handleOpenAddressEditLayer = (address: ShopOrderAddress): void => {
    setShowAddressSelectLayer(false);
    setAddressRegisterMode("edit");
    setEditingAddress(address);
    setShowAddressRegisterLayer(true);
  };

  // 배송지 등록 레이어를 닫습니다.
  const handleCloseAddressRegisterLayer = (): void => {
    setShowAddressRegisterLayer(false);
    setAddressRegisterMode("create");
    setEditingAddress(null);
  };

  // 선택한 배송지를 현재 주문서 화면 상태에 반영합니다.
  const handleSelectAddress = (address: ShopOrderAddress): void => {
    setSelectedAddress(address);
    setShowAddressSelectLayer(false);
  };

  // 배송지 등록 성공 결과를 주문서 화면 상태에 반영합니다.
  const handleAddressRegisterSuccess = (result: ShopOrderAddressSaveResponse): void => {
    const isEditingSelectedAddress = editingAddress !== null && selectedAddress?.addressNm === editingAddress.addressNm;
    const preservedSelectedAddress =
      selectedAddress === null ? null : result.addressList.find((address) => address.addressNm === selectedAddress.addressNm) ?? null;
    const nextSelectedAddress =
      addressRegisterMode === "edit"
        ? isEditingSelectedAddress
          ? result.savedAddress ?? result.defaultAddress ?? preservedSelectedAddress
          : preservedSelectedAddress ?? result.savedAddress ?? result.defaultAddress ?? null
        : result.savedAddress ?? result.defaultAddress ?? null;
    setAddressList(result.addressList);
    setSelectedAddress(nextSelectedAddress);
    setSaveAsDefaultOnOrder(false);
    setShowAddressRegisterLayer(false);
    setShowAddressSelectLayer(false);
    setAddressRegisterMode("create");
    setEditingAddress(null);
  };

  // 쿠폰 레이어를 엽니다.
  const handleOpenCouponLayer = (): void => {
    setShowCouponLayer(true);
  };

  // 쿠폰 레이어를 닫습니다.
  const handleCloseCouponLayer = (): void => {
    if (isQuotingDiscount) {
      return;
    }
    setShowCouponLayer(false);
  };

  // 포인트 입력값 변경 시 숫자만 반영합니다.
  const handlePointInputChange = (value: string): void => {
    const sanitizedValue = sanitizePointInputValue(value);
    setPointInputValue(sanitizedValue);
    setPointUseAmt(sanitizedValue === "" ? 0 : normalizeNonNegativeNumber(Number(sanitizedValue)));
  };

  // 포인트 입력에서 포커스가 빠질 때 최대 사용 가능 금액 기준으로 자동 보정합니다.
  const handlePointInputBlur = (): void => {
    const nextPointUseAmt = clampPointUseAmt(
      pointInputValue === "" ? 0 : normalizeNonNegativeNumber(Number(pointInputValue)),
      discountAmount.maxPointUseAmt,
    );
    setPointUseAmt(nextPointUseAmt);
    setPointInputValue(nextPointUseAmt > 0 ? String(nextPointUseAmt) : "");
  };

  // 쿠폰 적용 요청을 백엔드에 전달하고 할인 금액 상태를 갱신합니다.
  const handleApplyCouponSelection = async (nextSelection: ShopOrderDiscountSelection): Promise<void> => {
    try {
      setIsQuotingDiscount(true);
      const response = await fetch(getShopOrderDiscountQuotePath(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          cartIdList: orderPageData.cartList.map((cartItem) => cartItem.cartId),
          goodsCouponSelectionList: nextSelection.goodsCouponSelectionList,
          cartCouponCustCpnNo: nextSelection.cartCouponCustCpnNo,
          deliveryCouponCustCpnNo: nextSelection.deliveryCouponCustCpnNo,
        }),
      });
      const payload = await response.json().catch(() => null);

      // 세션 만료 시 공통 로그인 메시지를 노출합니다.
      if (response.status === 401) {
        window.alert("로그인이 필요합니다.");
        return;
      }

      // 실패 응답이면 서버 메시지를 우선 노출합니다.
      if (!response.ok) {
        const message = payload && typeof payload === "object" && "message" in payload ? String(payload.message ?? "") : "";
        window.alert(message || "할인 혜택 계산에 실패했습니다.");
        return;
      }

      // 정상 응답을 정규화해 할인 상태와 포인트 최대값을 갱신합니다.
      const normalizedResponse = normalizeShopOrderDiscountQuoteResponse(payload);
      const nextPointUseAmt = clampPointUseAmt(pointUseAmt, normalizedResponse.discountAmount.maxPointUseAmt);
      setDiscountSelection(normalizedResponse.discountSelection);
      setDiscountAmount(normalizedResponse.discountAmount);
      setPointUseAmt(nextPointUseAmt);
      setPointInputValue(nextPointUseAmt > 0 ? String(nextPointUseAmt) : "");
      setShowCouponLayer(false);
    } catch {
      window.alert("할인 혜택 계산에 실패했습니다.");
    } finally {
      setIsQuotingDiscount(false);
    }
  };

  return (
    <section className={styles.orderSection}>
      <div className={styles.orderLayout}>
        <div className={styles.leftPanel}>
          <header className={styles.sectionHeader}>
            <h1 className={styles.sectionTitle}>주문서</h1>
            <p className={styles.sectionCount}>총 {orderPageData.cartCount.toLocaleString("ko-KR")}개</p>
          </header>

          {orderPageData.cartList.length === 0 ? (
            <div className={styles.emptyState}>주문할 상품이 없습니다.</div>
          ) : (
            <ul className={styles.orderItemList}>
              {orderPageData.cartList.map((cartItem) => {
                const rowQty = normalizeQuantity(cartItem.qty);
                const rowSupplyAmt = resolveCartRowSupplyAmt(cartItem);
                const rowSaleAmt = resolveCartRowSaleAmt(cartItem);
                const showDiscount = rowSupplyAmt > rowSaleAmt;
                return (
                  <li key={cartItem.cartId} className={styles.orderItem}>
                    <div className={styles.thumbnailWrap}>
                      {cartItem.imgUrl.trim() !== "" ? (
                        <Image src={cartItem.imgUrl} alt={cartItem.goodsNm} fill sizes="112px" className={styles.thumbnailImage} />
                      ) : (
                        <span className={styles.thumbnailFallback}>이미지 없음</span>
                      )}
                    </div>

                    <div className={styles.itemContent}>
                      <p className={styles.brandName}>{cartItem.brandNm || "브랜드"}</p>
                      <p className={styles.goodsName}>{cartItem.goodsNm}</p>
                      <dl className={styles.metaList}>
                        <div className={styles.metaRow}>
                          <dt>선택 사이즈</dt>
                          <dd>{cartItem.sizeId}</dd>
                        </div>
                        <div className={styles.metaRow}>
                          <dt>수량</dt>
                          <dd>{rowQty}개</dd>
                        </div>
                      </dl>
                    </div>

                    <div className={styles.priceColumn}>
                      {showDiscount ? (
                        <>
                          <p className={styles.supplyPriceText}>{formatPrice(rowSupplyAmt)}원</p>
                          <p className={styles.salePriceText}>{formatPrice(rowSaleAmt)}원</p>
                        </>
                      ) : (
                        <p className={styles.salePriceText}>{formatPrice(rowSaleAmt)}원</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <section className={styles.subSection}>
            <div className={styles.subSectionHeader}>
              <h2 className={styles.subSectionTitle}>배송지</h2>
              {selectedAddress ? (
                <button type="button" className={styles.subSectionButton} onClick={handleOpenAddressSelectLayer}>
                  배송지 변경
                </button>
              ) : null}
            </div>

            {selectedAddress ? (
              <>
                <div className={styles.addressCard}>
                  <div className={styles.addressTitleRow}>
                    <strong className={styles.addressAlias}>{selectedAddress.addressNm}</strong>
                    {selectedAddress.defaultYn === "Y" ? <span className={styles.addressBadge}>기본 배송지</span> : null}
                  </div>
                  <p className={styles.addressMeta}>
                    {selectedAddress.rsvNm} | {selectedAddress.phoneNumber}
                  </p>
                  <p className={styles.addressMain}>{formatAddressLine(selectedAddress)}</p>
                  <p className={styles.addressDetail}>{selectedAddress.detailAddress}</p>
                </div>

                <label className={styles.addressCheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={saveAsDefaultOnOrder}
                    onChange={(event) => setSaveAsDefaultOnOrder(event.target.checked)}
                  />
                  <span>기본 배송지로 저장</span>
                </label>
              </>
            ) : (
              <div className={styles.addressEmptyState}>
                <p className={styles.addressEmptyTitle}>배송지를 선택해주세요.</p>
                <button type="button" className={styles.addressSelectButton} onClick={handleOpenAddressSelectLayer}>
                  배송지 선택
                </button>
                {addressList.length > 0 ? <p className={styles.addressHint}>등록된 배송지 목록에서 선택할 수 있습니다.</p> : null}
              </div>
            )}
          </section>

          <section className={styles.subSection}>
            <div className={styles.subSectionHeader}>
              <h2 className={styles.subSectionTitle}>할인혜택</h2>
            </div>

            <div className={styles.benefitCard}>
              <div className={styles.benefitHeaderRow}>
                <div>
                  <p className={styles.benefitTitle}>쿠폰 적용</p>
                  <p className={styles.benefitDescription}>상품쿠폰, 장바구니 쿠폰, 배송비 쿠폰을 각각 선택할 수 있습니다.</p>
                </div>
                <button type="button" className={styles.subSectionButton} onClick={handleOpenCouponLayer}>
                  쿠폰 변경
                </button>
              </div>

              <div className={styles.benefitAmountRow}>
                <span className={styles.benefitAmountLabel}>적용된 쿠폰 할인금액</span>
                <strong className={styles.benefitAmountValue}>{formatDiscountPrice(discountAmount.couponDiscountAmt)}</strong>
              </div>

              <p className={styles.benefitDescription}>{resolveCouponSelectionSummary(discountSelection)}</p>
            </div>

            <div className={styles.benefitCard}>
              <div className={styles.benefitHeaderRow}>
                <div>
                  <p className={styles.benefitTitle}>포인트 사용</p>
                  <p className={styles.benefitDescription}>
                    보유 {formatPrice(orderPageData.availablePointAmt)}원 / 최대 {formatPrice(discountAmount.maxPointUseAmt)}원 사용 가능
                  </p>
                </div>
              </div>

              <div className={styles.pointRow}>
                <label className={styles.pointInputWrap}>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={styles.pointInput}
                    value={pointInputValue}
                    onChange={(event) => handlePointInputChange(event.target.value)}
                    onBlur={handlePointInputBlur}
                    placeholder="0"
                  />
                  <span className={styles.pointInputSuffix}>원</span>
                </label>
              </div>

              <div className={styles.benefitAmountRow}>
                <span className={styles.benefitAmountLabel}>현재 사용 포인트</span>
                <strong className={styles.benefitAmountValue}>{formatDiscountPrice(pointUseAmt)}</strong>
              </div>
            </div>

            <div className={styles.benefitCard}>
              <div className={styles.benefitHeaderRow}>
                <div>
                  <p className={styles.benefitTitle}>결제수단</p>
                  <p className={styles.benefitDescription}>원하시는 결제수단을 선택한 뒤 주문하기를 눌러주세요.</p>
                </div>
              </div>

              <div className={styles.paymentMethodGroup}>
                <button
                  type="button"
                  className={`${styles.paymentMethodButton} ${selectedPaymentMethodCd === "PAY_METHOD_01" ? styles.paymentMethodButtonActive : ""}`}
                  onClick={() => setSelectedPaymentMethodCd("PAY_METHOD_01")}
                >
                  신용카드
                </button>
                <button
                  type="button"
                  className={`${styles.paymentMethodButton} ${selectedPaymentMethodCd === "PAY_METHOD_02" ? styles.paymentMethodButtonActive : ""}`}
                  onClick={() => setSelectedPaymentMethodCd("PAY_METHOD_02")}
                >
                  무통장입금
                </button>
                <button
                  type="button"
                  className={`${styles.paymentMethodButton} ${selectedPaymentMethodCd === "PAY_METHOD_03" ? styles.paymentMethodButtonActive : ""}`}
                  onClick={() => setSelectedPaymentMethodCd("PAY_METHOD_03")}
                >
                  퀵계좌이체
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside className={styles.rightPanel}>
          <h2 className={styles.summaryTitle}>결제 정보</h2>
          <dl className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <dt>총 상품금액</dt>
              <dd>{formatPrice(summaryAmount.totalSupplyAmt)}원</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>상품 할인금액</dt>
              <dd>{formatDiscountPrice(summaryAmount.goodsDiscountAmt)}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>배송비</dt>
              <dd>{summaryAmount.deliveryFee < 1 ? "0원" : `${formatPrice(summaryAmount.deliveryFee)}원`}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>쿠폰 할인금액</dt>
              <dd>{formatDiscountPrice(summaryAmount.couponDiscountAmt)}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>포인트 사용금액</dt>
              <dd>{formatDiscountPrice(summaryAmount.pointUseAmt)}</dd>
            </div>
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <dt>최종 결제금액</dt>
              <dd>{formatPrice(summaryAmount.finalPayAmt)}원</dd>
            </div>
          </dl>

          <label className={styles.agreeLabel}>
            <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
            <span>(필수) 주문할 상품의 상품명, 상품가격, 배송정보를 확인하였으며, 구매에 동의 하시겠습니까? (전자상거래법 제 8조 제 2항)</span>
          </label>

          <p className={styles.noticeText}>
            일부 특가 상품들은 주문이 폭주하여 품절될 소지가 있으며 해당 상품은 자동 주문취소 및 환불이 진행됩니다. 교환 신청시 재고 부족으로 인해 반품 및 환불로 진행될 수 있는 점 안내드립니다.
          </p>

          <button
            type="button"
            className={styles.orderButton}
            onClick={() => {
              void handleOrderButtonClick();
            }}
            disabled={!agreed || orderPageData.cartList.length === 0 || !selectedAddress || selectedPaymentMethodCd === "" || isPreparingPayment}
          >
            {isPreparingPayment ? "결제 연결중..." : "주문하기"}
          </button>
        </aside>
      </div>

      {showAddressSelectLayer ? (
        <ShopOrderAddressSelectLayer
          addressList={addressList}
          selectedAddressNm={selectedAddress?.addressNm ?? ""}
          onSelect={handleSelectAddress}
          onEdit={handleOpenAddressEditLayer}
          onOpenRegister={handleOpenAddressRegisterLayer}
          onClose={handleCloseAddressSelectLayer}
        />
      ) : null}

      {showAddressRegisterLayer ? (
        <ShopOrderAddressRegisterLayer
          mode={addressRegisterMode}
          initialAddress={editingAddress}
          onSuccess={handleAddressRegisterSuccess}
          onClose={handleCloseAddressRegisterLayer}
        />
      ) : null}

      {showCouponLayer ? (
        <ShopOrderCouponLayer
          cartList={orderPageData.cartList}
          siteInfo={orderPageData.siteInfo}
          couponOption={orderPageData.couponOption}
          initialSelection={discountSelection}
          isSubmitting={isQuotingDiscount}
          onApply={handleApplyCouponSelection}
          onClose={handleCloseCouponLayer}
        />
      ) : null}
    </section>
  );
}
