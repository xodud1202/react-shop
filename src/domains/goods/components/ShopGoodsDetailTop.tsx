"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import type { ShopGoodsDetailResponse, ShopGoodsGroupItem, ShopGoodsImage, ShopGoodsSizeItem } from "@/domains/goods/types";
import styles from "./ShopGoodsDetailTop.module.css";

interface ShopGoodsDetailTopProps {
  detailData: ShopGoodsDetailResponse | null;
  requestedGoodsId: string;
}

const GOODS_DETAIL_COLLAPSE_HEIGHT = 500;

// 상품상세 공유 URL을 생성합니다.
function buildGoodsDetailShareUrl(goodsId: string): string {
  if (typeof window === "undefined") {
    return `/goods?goodsId=${encodeURIComponent(goodsId)}`;
  }
  return `${window.location.origin}/goods?goodsId=${encodeURIComponent(goodsId)}`;
}

// 텍스트를 클립보드에 복사합니다.
async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  // 보안 컨텍스트에서는 Clipboard API를 우선 사용합니다.
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Clipboard API 실패 시 레거시 복사 방식으로 폴백합니다.
    }
  }

  // 구형 브라우저 호환을 위해 textarea + execCommand 복사를 수행합니다.
  const textareaElement = document.createElement("textarea");
  textareaElement.value = text;
  textareaElement.style.position = "fixed";
  textareaElement.style.left = "-9999px";
  document.body.appendChild(textareaElement);
  textareaElement.focus();
  textareaElement.select();

  const copyResult = document.execCommand("copy");
  document.body.removeChild(textareaElement);
  return copyResult;
}

// 가격 숫자를 천 단위 콤마 문자열로 변환합니다.
function formatPrice(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString("ko-KR");
}

// 이미지 목록을 노출 순서 기준으로 정렬합니다.
function resolveOrderedImageList(imageList: ShopGoodsImage[]): ShopGoodsImage[] {
  return [...imageList].sort((left, right) => {
    const leftOrder = Number.isFinite(left.dispOrd) ? left.dispOrd : 0;
    const rightOrder = Number.isFinite(right.dispOrd) ? right.dispOrd : 0;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return (left.imgNo ?? 0) - (right.imgNo ?? 0);
  });
}

// 그룹상품 목록을 상품코드 기준으로 정렬합니다.
function resolveOrderedGroupGoodsList(groupGoodsList: ShopGoodsGroupItem[]): ShopGoodsGroupItem[] {
  return [...groupGoodsList].sort((left, right) => left.goodsId.localeCompare(right.goodsId));
}

// 사이즈 목록을 노출 순서 기준으로 정렬합니다.
function resolveOrderedSizeList(sizeList: ShopGoodsSizeItem[]): ShopGoodsSizeItem[] {
  return [...sizeList].sort((left, right) => {
    const leftOrder = Number.isFinite(left.dispOrd) ? left.dispOrd : 0;
    const rightOrder = Number.isFinite(right.dispOrd) ? right.dispOrd : 0;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return left.sizeId.localeCompare(right.sizeId);
  });
}

// 최초 선택할 사이즈 코드를 계산합니다.
function resolveInitialSelectedSizeId(orderedSizeList: ShopGoodsSizeItem[]): string {
  const firstInStock = orderedSizeList.find((item) => !item.soldOut);
  if (firstInStock) {
    return firstInStock.sizeId;
  }
  return orderedSizeList[0]?.sizeId ?? "";
}

// 현재 선택된 사이즈명을 계산합니다.
function resolveSelectedSizeLabel(orderedSizeList: ShopGoodsSizeItem[], selectedSizeId: string): string {
  const selectedItem = orderedSizeList.find((item) => item.sizeId === selectedSizeId);
  return selectedItem?.sizeId ?? "-";
}

// 현재 뷰포트 기준으로 노출할 상품상세 HTML을 계산합니다.
function resolveVisibleDetailHtml(detailData: ShopGoodsDetailResponse | null, isMobileViewport: boolean): string {
  const pcDetailHtml = detailData?.detailDesc?.pcDesc?.trim() ?? "";
  const mobileDetailHtml = detailData?.detailDesc?.moDesc?.trim() ?? "";
  if (isMobileViewport) {
    return mobileDetailHtml !== "" ? mobileDetailHtml : pcDetailHtml;
  }
  return pcDetailHtml !== "" ? pcDetailHtml : mobileDetailHtml;
}

// 상품상세 상단 UI를 렌더링합니다.
export default function ShopGoodsDetailTop({ detailData, requestedGoodsId }: ShopGoodsDetailTopProps) {
  // 반응형 상세 HTML 선택을 위해 모바일 뷰포트 여부를 관리합니다.
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(false);

  // 상품상세 HTML 펼침/접힘 상태와 overflow 여부를 관리합니다.
  const [detailExpandedGoodsId, setDetailExpandedGoodsId] = useState<string>("");
  const [isDetailOverflowed, setIsDetailOverflowed] = useState<boolean>(false);
  const detailContentRef = useRef<HTMLDivElement | null>(null);

  // 이미지/그룹상품/사이즈 목록을 정렬해 렌더링용으로 보정합니다.
  const orderedImageList = useMemo(
    () => resolveOrderedImageList(detailData?.images ?? []),
    [detailData?.images],
  );
  const orderedGroupGoodsList = useMemo(
    () => resolveOrderedGroupGoodsList(detailData?.groupGoods ?? []),
    [detailData?.groupGoods],
  );
  const orderedSizeList = useMemo(
    () => resolveOrderedSizeList(detailData?.sizes ?? []),
    [detailData?.sizes],
  );

  // 사용자가 선택한 사이즈 상태를 관리합니다.
  const [selectedSizeId, setSelectedSizeId] = useState<string>("");
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const initialSelectedSizeId = useMemo(() => resolveInitialSelectedSizeId(orderedSizeList), [orderedSizeList]);
  const effectiveSelectedSizeId = useMemo(() => {
    if (selectedSizeId !== "" && orderedSizeList.some((item) => item.sizeId === selectedSizeId)) {
      return selectedSizeId;
    }
    return initialSelectedSizeId;
  }, [selectedSizeId, orderedSizeList, initialSelectedSizeId]);

  // 선택된 사이즈명을 계산합니다.
  const selectedSizeLabel = useMemo(
    () => resolveSelectedSizeLabel(orderedSizeList, effectiveSelectedSizeId),
    [orderedSizeList, effectiveSelectedSizeId],
  );
  const visibleDetailHtml = useMemo(
    () => resolveVisibleDetailHtml(detailData, isMobileViewport),
    [detailData, isMobileViewport],
  );
  const brandLogoPath = (detailData?.goods?.brandLogoPath ?? "").trim();
  const brandNotiHtml = useMemo(
    () => (detailData?.goods?.brandNoti ?? "").trim(),
    [detailData?.goods?.brandNoti],
  );
  const currentGoodsId = detailData?.goods?.goodsId ?? "";
  const isDetailExpanded = detailExpandedGoodsId !== "" && detailExpandedGoodsId === currentGoodsId;

  // 뷰포트 변경 시 모바일 상태를 동기화합니다.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // 900px 기준 미디어쿼리를 구독해 모바일 여부를 업데이트합니다.
    const mobileMediaQuery = window.matchMedia("(max-width: 900px)");
    const syncViewportState = (): void => {
      setIsMobileViewport(mobileMediaQuery.matches);
    };
    syncViewportState();

    const handleMediaQueryChange = (event: MediaQueryListEvent): void => {
      // 미디어쿼리 결과를 상태에 반영합니다.
      setIsMobileViewport(event.matches);
    };
    mobileMediaQuery.addEventListener("change", handleMediaQueryChange);
    return () => {
      mobileMediaQuery.removeEventListener("change", handleMediaQueryChange);
    };
  }, []);

  // 상세 HTML의 실제 높이를 측정해 500px 초과 여부를 계산합니다.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let animationFrameId = 0;
    const measureDetailOverflow = (): void => {
      // 스크롤 높이를 기준으로 접힘 버튼 필요 여부를 계산합니다.
      const currentDetailElement = detailContentRef.current;
      const detailHeight = visibleDetailHtml === "" ? 0 : (currentDetailElement?.scrollHeight ?? 0);
      setIsDetailOverflowed(detailHeight > GOODS_DETAIL_COLLAPSE_HEIGHT);
    };

    const scheduleDetailOverflowMeasure = (): void => {
      // 레이아웃 계산 이후 측정되도록 다음 프레임으로 예약합니다.
      if (animationFrameId !== 0) {
        window.cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = window.requestAnimationFrame(measureDetailOverflow);
    };
    scheduleDetailOverflowMeasure();

    window.addEventListener("resize", scheduleDetailOverflowMeasure);
    return () => {
      if (animationFrameId !== 0) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("resize", scheduleDetailOverflowMeasure);
    };
  }, [visibleDetailHtml]);

  // 상세 데이터가 없으면 안내 메시지를 렌더링합니다.
  if (!detailData || !detailData.goods) {
    return (
      <section className={styles.goodsDetailPage}>
        <div className={styles.goodsDetailContainer}>
          <p className={styles.emptyState}>
            조회 가능한 상품이 없습니다.
            {requestedGoodsId.trim() !== "" ? ` (${requestedGoodsId})` : ""}
          </p>
        </div>
      </section>
    );
  }

  // 쿠폰 버튼 라벨을 계산합니다.
  const couponButtonLabel = detailData.coupons.length > 0 ? `쿠폰받기 (${detailData.coupons.length})` : "쿠폰받기";
  const hasMultipleImages = orderedImageList.length > 1;
  const showDetailExpandButton = isDetailOverflowed && !isDetailExpanded;

  // 공유 버튼 클릭 시 현재 상품 링크를 클립보드에 복사합니다.
  const handleShareButtonClick = async (): Promise<void> => {
    // 공유 URL을 생성해 클립보드에 복사합니다.
    const shareUrl = buildGoodsDetailShareUrl(detailData.goods.goodsId);
    const copied = await copyTextToClipboard(shareUrl);
    if (!copied) {
      return;
    }

    // 복사 성공 시 알림 문구를 노출합니다.
    window.alert("링크가 복사되었습니다.");

    // 복사 성공 상태를 잠시 노출해 사용자에게 피드백을 제공합니다.
    setShareCopied(true);
    window.setTimeout(() => {
      setShareCopied(false);
    }, 1500);
  };

  // 상품상세 전체보기 버튼 클릭 시 나머지 영역을 노출합니다.
  const handleDetailExpandButtonClick = (): void => {
    setDetailExpandedGoodsId(currentGoodsId);
  };

  return (
    <section className={styles.goodsDetailPage}>
      <div className={styles.goodsDetailContainer}>
        <div className={styles.topGrid}>
          <div className={styles.leftMedia}>
            {orderedImageList.length === 0 ? (
              <div className={styles.imagePlaceholder}>이미지 준비중</div>
            ) : (
              <Swiper
                className={styles.goodsSwiper}
                modules={[Navigation, Pagination]}
                slidesPerView={1}
                loop={hasMultipleImages}
                navigation={hasMultipleImages}
                pagination={hasMultipleImages ? { clickable: true } : false}
              >
                {orderedImageList.map((imageItem) => (
                  <SwiperSlide key={`${imageItem.goodsId}-${imageItem.imgNo}`}>
                    <div className={styles.mainImageWrap}>
                      <Image
                        src={imageItem.imgUrl || imageItem.imgPath}
                        alt={detailData.goods.goodsNm || "상품 이미지"}
                        fill
                        sizes="(max-width: 900px) 100vw, 60vw"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>

          <div className={styles.rightInfo}>
            <div className={styles.brandRow}>
              <span className={styles.brandIdentity}>
                {brandLogoPath !== "" ? (
                  <Image
                    src={brandLogoPath}
                    alt={`${detailData.goods.brandNm || "브랜드"} 로고`}
                    width={20}
                    height={20}
                    className={styles.brandLogoImage}
                  />
                ) : null}
                <span className={styles.brandName}>{detailData.goods.brandNm || "브랜드"}</span>
              </span>
              <button
                type="button"
                className={styles.iconButton}
                aria-label={shareCopied ? "링크 복사 완료" : "공유"}
                title={shareCopied ? "링크 복사 완료" : "공유"}
                onClick={handleShareButtonClick}
              >
                <i className="fa-solid fa-share-nodes" />
              </button>
            </div>

            <p className={styles.goodsCode}>{detailData.goods.goodsId}</p>

            <div className={styles.nameRow}>
              <h1 className={styles.goodsName}>{detailData.goods.goodsNm}</h1>
              <button
                type="button"
                className={`${styles.iconButton} ${styles.wishlistButton} ${detailData.wishlist.wished ? styles.wishlistActive : ""}`}
                aria-label="위시리스트"
              >
                <i className={detailData.wishlist.wished ? "fa-solid fa-heart" : "fa-regular fa-heart"} />
              </button>
            </div>

            <div className={styles.priceArea}>
              {detailData.priceSummary.showSupplyStrike ? (
                <div className={styles.priceRow}>
                  <span className={styles.salePrice}>{formatPrice(detailData.priceSummary.saleAmt)}원</span>
                  <span className={styles.supplyPrice}>{formatPrice(detailData.priceSummary.supplyAmt)}원</span>
                  <span className={styles.discountRate}>{detailData.priceSummary.discountRate}%</span>
                </div>
              ) : (
                <div className={styles.priceRow}>
                  <span className={styles.salePrice}>{formatPrice(detailData.priceSummary.saleAmt)}원</span>
                </div>
              )}

              <button type="button" className={styles.couponButton} aria-label="쿠폰받기">
                {couponButtonLabel}
              </button>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>구매시 적립 예정 포인트</span>
              <span className={styles.metaValue}>{formatPrice(detailData.pointSummary.expectedPoint)}P</span>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaLeft}>
                <span className={styles.metaLabel}>배송비 </span>
                <span className={styles.shippingGuide}>
                  {formatPrice(detailData.shippingSummary.deliveryFeeLimit)}원 이상 구매시 무료 배송
                </span>
              </span>
              <span className={styles.shippingFee}>
                {detailData.shippingSummary.freeDelivery ? "무료배송" : `${formatPrice(detailData.shippingSummary.deliveryFee)}원`}
              </span>
            </div>

            <div className={styles.cutLine} />

            <div className={styles.optionBlock}>
              <div className={styles.optionTitleRow}>
                <span className={styles.optionLabel}>색상옵션</span>
                <span className={styles.optionValue}>{detailData.goods.colorNm || "-"}</span>
              </div>

              <div className={styles.groupGoodsList}>
                {orderedGroupGoodsList.map((groupItem) => {
                  const isSelected = groupItem.goodsId === detailData.goods.goodsId;
                  return (
                    <Link
                      key={groupItem.goodsId}
                      href={`/goods?goodsId=${groupItem.goodsId}`}
                      className={`${styles.groupGoodsLink} ${isSelected ? styles.groupGoodsSelected : ""}`}
                      aria-label={`${groupItem.goodsId} 상품으로 이동`}
                    >
                      {groupItem.firstImgUrl || groupItem.firstImgPath ? (
                        <Image
                          src={groupItem.firstImgUrl || groupItem.firstImgPath}
                          alt={groupItem.colorNm || groupItem.goodsId}
                          fill
                          sizes="64px"
                        />
                      ) : (
                        <span className={styles.groupGoodsFallback}>{groupItem.colorNm || "색상"}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className={styles.optionBlock}>
              <div className={styles.optionTitleRow}>
                <span className={styles.optionLabel}>사이즈</span>
                <span className={styles.optionValue}>{selectedSizeLabel}</span>
              </div>

              <div className={styles.sizeButtonList}>
                {orderedSizeList.map((sizeItem) => {
                  const isSelected = effectiveSelectedSizeId === sizeItem.sizeId;
                  return (
                    <button
                      key={sizeItem.sizeId}
                      type="button"
                      className={`${styles.sizeButton} ${isSelected ? styles.sizeButtonSelected : ""} ${sizeItem.soldOut ? styles.sizeButtonSoldOut : ""}`}
                      onClick={() => setSelectedSizeId(sizeItem.sizeId)}
                      disabled={sizeItem.soldOut}
                    >
                      <span className={styles.sizeButtonText}>{sizeItem.sizeId}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.cutLine} />

            <div className={styles.actionButtonRow}>
              <button type="button" className={styles.cartButton}>
                장바구니
              </button>
              <button type="button" className={styles.buyButton}>
                바로구매
              </button>
            </div>
          </div>
        </div>

        {brandNotiHtml !== "" ? (
          <section className={styles.brandNotiSection}>
            <div className={styles.brandNotiContent} dangerouslySetInnerHTML={{ __html: brandNotiHtml }} />
          </section>
        ) : null}

        {visibleDetailHtml !== "" ? (
          <section className={styles.detailSection}>
            <div className={styles.detailContentWrap}>
              <div
                ref={detailContentRef}
                className={`${styles.detailContent} ${showDetailExpandButton ? styles.detailContentCollapsed : ""}`}
                dangerouslySetInnerHTML={{ __html: visibleDetailHtml }}
              />
              {showDetailExpandButton ? <div className={styles.detailFadeOut} aria-hidden="true" /> : null}
            </div>

            {showDetailExpandButton ? (
              <button type="button" className={styles.detailExpandButton} onClick={handleDetailExpandButtonClick}>
                전체 보기
              </button>
            ) : null}
          </section>
        ) : null}
      </div>
    </section>
  );
}
