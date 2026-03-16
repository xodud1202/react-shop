"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import type { ShopGoodsDetailResponse, ShopGoodsGroupItem, ShopGoodsImage, ShopGoodsSizeItem } from "@/domains/goods/types";
import { buildLoginFormPath } from "@/domains/login/utils/loginRedirectUtils";
import ShopConfirmLayer from "@/shared/components/layer/ShopConfirmLayer";
import styles from "./ShopGoodsDetailTop.module.css";

interface ShopGoodsDetailTopProps {
  detailData: ShopGoodsDetailResponse | null;
  requestedGoodsId: string;
}

const GOODS_DETAIL_COLLAPSE_HEIGHT = 500;
const GOODS_DETAIL_FALLBACK_TEXT_LENGTH = 50;

// 상품상세 공유 URL을 생성합니다.
function buildGoodsDetailShareUrl(goodsId: string): string {
  if (typeof window === "undefined") {
    return `/goods?goodsId=${encodeURIComponent(goodsId)}`;
  }
  return `${window.location.origin}/goods?goodsId=${encodeURIComponent(goodsId)}`;
}

// 현재 화면 경로(pathname + search)를 로그인 복귀용 경로로 반환합니다.
function resolveCurrentPagePath(): string {
  if (typeof window === "undefined") {
    return "/";
  }
  return `${window.location.pathname}${window.location.search}`;
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

// 현재 선택된 사이즈명을 계산합니다.
function resolveSelectedSizeLabel(orderedSizeList: ShopGoodsSizeItem[], selectedSizeId: string): string {
  const selectedItem = orderedSizeList.find((item) => item.sizeId === selectedSizeId);
  return selectedItem?.sizeId ?? "-";
}

// 사이즈 재고 수량을 0 이상의 정수로 정규화합니다.
function resolveStockQuantity(stockQty: number): number {
  if (!Number.isFinite(stockQty)) {
    return 0;
  }
  const normalizedStockQty = Math.floor(stockQty);
  return normalizedStockQty > 0 ? normalizedStockQty : 0;
}

// 수량 값을 1~최대수량 범위로 보정합니다.
function clampOrderQuantity(quantity: number, maxQuantity: number): number {
  const normalizedMaxQuantity = resolveStockQuantity(maxQuantity);
  if (normalizedMaxQuantity <= 0) {
    return 1;
  }
  const normalizedQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
  const safeQuantity = normalizedQuantity < 1 ? 1 : normalizedQuantity;
  return safeQuantity > normalizedMaxQuantity ? normalizedMaxQuantity : safeQuantity;
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

// HTML을 제거한 상품상세 텍스트를 길이 계산용으로 정규화합니다.
function resolveNormalizedDetailText(detailHtml: string): string {
  // 태그/엔티티/공백을 제거해 실질 텍스트 길이만 계산되도록 정리합니다.
  return detailHtml
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&[a-zA-Z0-9#]+;/g, " ")
    .replace(/\s+/g, "")
    .trim();
}

// 상품상세 대신 이미지 리스트를 노출할지 여부를 계산합니다.
function shouldRenderDetailImageFallback(detailHtml: string): boolean {
  // 상품상세 HTML 자체가 없으면 이미지 리스트를 기본 노출합니다.
  if (detailHtml.trim() === "") {
    return true;
  }

  // HTML 제거 후 50자 이하인 경우 상세 설명이 부족한 것으로 간주합니다.
  const normalizedDetailText = resolveNormalizedDetailText(detailHtml);
  return normalizedDetailText.length <= GOODS_DETAIL_FALLBACK_TEXT_LENGTH;
}

// 상품상세 상단 UI를 렌더링합니다.
export default function ShopGoodsDetailTop({ detailData, requestedGoodsId }: ShopGoodsDetailTopProps) {
  const router = useRouter();

  // 반응형 상세 HTML 선택을 위해 모바일 뷰포트 여부를 관리합니다.
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(false);

  // 상품상세 HTML 펼침/접힘 상태와 overflow 여부를 관리합니다.
  const [isDetailExpanded, setIsDetailExpanded] = useState<boolean>(false);
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
  // 사용자가 선택한 구매 수량 상태를 관리합니다.
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  // 위시리스트 로그인 필요 확인 레이어 노출 여부를 관리합니다.
  const [showWishlistLoginConfirmLayer, setShowWishlistLoginConfirmLayer] = useState<boolean>(false);
  const [wishlistOverride, setWishlistOverride] = useState<{ goodsId: string; wished: boolean } | null>(null);
  const [wishlistLoadingGoodsId, setWishlistLoadingGoodsId] = useState<string>("");
  // 장바구니 등록 API 요청 중 상태를 관리합니다.
  const [isCartSubmitting, setIsCartSubmitting] = useState<boolean>(false);

  // 선택된 사이즈명을 계산합니다.
  const selectedSizeLabel = useMemo(
    () => resolveSelectedSizeLabel(orderedSizeList, selectedSizeId),
    [orderedSizeList, selectedSizeId],
  );
  const visibleDetailHtml = useMemo(
    () => resolveVisibleDetailHtml(detailData, isMobileViewport),
    [detailData, isMobileViewport],
  );
  // 상세 설명이 비어 있거나 너무 짧으면 상품 이미지 리스트를 대신 노출합니다.
  const shouldRenderDetailImageList = useMemo(
    () => shouldRenderDetailImageFallback(visibleDetailHtml),
    [visibleDetailHtml],
  );
  const brandLogoPath = (detailData?.goods?.brandLogoPath ?? "").trim();
  const brandNotiHtml = useMemo(
    () => (detailData?.goods?.brandNoti ?? "").trim(),
    [detailData?.goods?.brandNoti],
  );
  const currentGoodsId = detailData?.goods?.goodsId ?? "";
  const isWished =
    wishlistOverride !== null && wishlistOverride.goodsId === currentGoodsId
      ? wishlistOverride.wished
      : Boolean(detailData?.wishlist?.wished);
  const isWishlistSubmitting = wishlistLoadingGoodsId === currentGoodsId;
  const selectedSizeItem = useMemo(
    () => orderedSizeList.find((sizeItem) => sizeItem.sizeId === selectedSizeId) ?? null,
    [orderedSizeList, selectedSizeId],
  );
  const selectedSizeStockQty = useMemo(
    () => resolveStockQuantity(selectedSizeItem?.stockQty ?? 0),
    [selectedSizeItem?.stockQty],
  );
  const isSelectedSizeOutOfStock =
    selectedSizeItem === null || selectedSizeItem.soldOut || selectedSizeStockQty <= 0;
  const isOrderQuantityDisabled = selectedSizeItem === null || isSelectedSizeOutOfStock;
  const canDecreaseOrderQuantity = !isOrderQuantityDisabled && orderQuantity > 1;
  const canIncreaseOrderQuantity = !isOrderQuantityDisabled && orderQuantity < selectedSizeStockQty;
  const isActionButtonDisabled = isOrderQuantityDisabled;

  // 상품코드 변경 시 상세 영역을 기본 접힘 상태로 초기화합니다.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let animationFrameId = 0;
    animationFrameId = window.requestAnimationFrame(() => {
      setIsDetailExpanded(false);
      setIsDetailOverflowed(true);
    });

    return () => {
      if (animationFrameId !== 0) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [currentGoodsId]);

  // 상품코드가 변경되면 사이즈/수량 선택 상태를 초기값으로 되돌립니다.
  useEffect(() => {
    setSelectedSizeId("");
    setOrderQuantity(1);
    setShowWishlistLoginConfirmLayer(false);
    setIsCartSubmitting(false);
  }, [currentGoodsId]);

  // 선택된 사이즈 재고가 변경되면 수량을 유효 범위로 자동 보정합니다.
  useEffect(() => {
    if (isOrderQuantityDisabled) {
      setOrderQuantity(1);
      return;
    }
    setOrderQuantity((previousQuantity) => clampOrderQuantity(previousQuantity, selectedSizeStockQty));
  }, [isOrderQuantityDisabled, selectedSizeStockQty]);

  // 브라우저 히스토리 복귀(BFCache) 재진입 시에도 상세 영역을 접힘 상태로 보정합니다.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handlePageShow = (): void => {
      setIsDetailExpanded(false);
      setIsDetailOverflowed(true);
    };
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

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
    const currentDetailElement = detailContentRef.current;
    const imageElementList = currentDetailElement
      ? Array.from(currentDetailElement.querySelectorAll("img"))
      : [];

    const measureDetailOverflow = (): void => {
      // 상세 HTML/이미지 fallback 영역의 스크롤 높이로 접힘 버튼 필요 여부를 계산합니다.
      const currentDetailElement = detailContentRef.current;
      const detailHeight = currentDetailElement?.scrollHeight ?? 0;
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
    imageElementList.forEach((imageElement) => {
      if (imageElement.complete) {
        return;
      }
      imageElement.addEventListener("load", scheduleDetailOverflowMeasure);
      imageElement.addEventListener("error", scheduleDetailOverflowMeasure);
    });

    return () => {
      if (animationFrameId !== 0) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("resize", scheduleDetailOverflowMeasure);
      imageElementList.forEach((imageElement) => {
        imageElement.removeEventListener("load", scheduleDetailOverflowMeasure);
        imageElement.removeEventListener("error", scheduleDetailOverflowMeasure);
      });
    };
  }, [visibleDetailHtml, currentGoodsId, shouldRenderDetailImageList, orderedImageList]);

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
    setIsDetailExpanded(true);
  };

  // 위시리스트 버튼 클릭 시 등록/해제를 토글합니다.
  const handleWishlistButtonClick = async (): Promise<void> => {
    // 중복 요청을 방지하고 상품코드가 비어 있으면 요청하지 않습니다.
    const targetGoodsId = currentGoodsId.trim();
    if (isWishlistSubmitting || targetGoodsId === "") {
      return;
    }

    try {
      // 위시 토글 API를 호출하는 동안 로딩 상태를 설정합니다.
      setWishlistLoadingGoodsId(targetGoodsId);
      const response = await fetch("/api/shop/goods/wishlist/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          goodsId: targetGoodsId,
        }),
      });

      // 응답 본문(JSON)이 없거나 파싱 실패해도 안전하게 처리합니다.
      const payload = (await response.json().catch(() => null)) as { wished?: boolean; message?: string } | null;

      // 비로그인/세션만료면 로그인 화면으로 이동하고 복귀 경로를 전달합니다.
      if (response.status === 401) {
        setShowWishlistLoginConfirmLayer(true);
        return;
      }

      // 실패 응답이면 서버 메시지를 우선 노출합니다.
      if (!response.ok) {
        window.alert(payload?.message ?? "위시리스트 처리에 실패했습니다.");
        return;
      }

      // 성공 응답의 wished 상태로 하트 아이콘을 즉시 갱신합니다.
      setWishlistOverride({
        goodsId: targetGoodsId,
        wished: Boolean(payload?.wished),
      });
    } catch {
      // 네트워크/예외 오류 시 공통 실패 문구를 노출합니다.
      window.alert("위시리스트 처리에 실패했습니다.");
    } finally {
      // 요청 종료 후 로딩 상태를 해제합니다.
      setWishlistLoadingGoodsId("");
    }
  };

  // 그룹상품 클릭 시 상세 영역 상태를 기본 접힘으로 초기화합니다.
  const handleGroupGoodsNavigate = (): void => {
    setIsDetailExpanded(false);
    setIsDetailOverflowed(true);
  };

  // 로그인 필요 확인 레이어를 닫습니다.
  const handleCloseWishlistLoginConfirmLayer = (): void => {
    setShowWishlistLoginConfirmLayer(false);
  };

  // 로그인 필요 확인 레이어에서 확인 시 로그인 화면으로 이동합니다.
  const handleConfirmWishlistLoginMove = (): void => {
    setShowWishlistLoginConfirmLayer(false);
    router.push(buildLoginFormPath(resolveCurrentPagePath()));
  };

  // 사이즈 버튼 클릭 시 선택값을 반영하고 수량을 1로 초기화합니다.
  const handleSizeButtonClick = (sizeItem: ShopGoodsSizeItem): void => {
    setSelectedSizeId(sizeItem.sizeId);
    setOrderQuantity(1);
  };

  // 수량 감소 버튼 클릭 시 최소 1까지 감소시킵니다.
  const handleDecreaseOrderQuantityClick = (): void => {
    if (!canDecreaseOrderQuantity) {
      return;
    }
    setOrderQuantity((previousQuantity) => clampOrderQuantity(previousQuantity - 1, selectedSizeStockQty));
  };

  // 수량 증가 버튼 클릭 시 선택 사이즈 재고 수량까지만 증가시킵니다.
  const handleIncreaseOrderQuantityClick = (): void => {
    if (!canIncreaseOrderQuantity) {
      return;
    }
    setOrderQuantity((previousQuantity) => clampOrderQuantity(previousQuantity + 1, selectedSizeStockQty));
  };

  // 장바구니 버튼 클릭 시 선택 옵션을 장바구니에 등록합니다.
  const handleCartButtonClick = async (): Promise<void> => {
    // 중복 요청을 방지하고 필수 선택값을 확인합니다.
    if (isCartSubmitting) {
      return;
    }
    const targetGoodsId = currentGoodsId.trim();
    const targetSizeId = selectedSizeId.trim();
    if (targetGoodsId === "") {
      window.alert("상품코드를 확인해주세요.");
      return;
    }
    if (targetSizeId === "") {
      window.alert("사이즈를 선택해주세요.");
      return;
    }
    if (!Number.isFinite(orderQuantity) || orderQuantity < 1) {
      window.alert("수량을 확인해주세요.");
      return;
    }

    try {
      // 장바구니 등록 API를 호출하는 동안 로딩 상태를 설정합니다.
      setIsCartSubmitting(true);
      const response = await fetch("/api/shop/goods/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          goodsId: targetGoodsId,
          sizeId: targetSizeId,
          qty: orderQuantity,
        }),
      });

      // 응답 본문(JSON)이 없거나 파싱 실패해도 안전하게 처리합니다.
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      // 비로그인/세션만료면 로그인 확인 레이어를 노출합니다.
      if (response.status === 401) {
        setShowWishlistLoginConfirmLayer(true);
        return;
      }

      // 실패 응답이면 서버 메시지를 우선 노출합니다.
      if (!response.ok) {
        window.alert(payload?.message ?? "장바구니 처리에 실패했습니다.");
        return;
      }

      // 성공 시 완료 메시지를 노출합니다.
      window.alert(payload?.message ?? "장바구니에 담았습니다.");
    } catch {
      // 네트워크/예외 오류 시 공통 실패 문구를 노출합니다.
      window.alert("장바구니 처리에 실패했습니다.");
    } finally {
      // 요청 종료 후 로딩 상태를 해제합니다.
      setIsCartSubmitting(false);
    }
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
                        sizes="750px"
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
                className={`${styles.iconButton} ${styles.wishlistButton} ${isWished ? styles.wishlistActive : ""}`}
                aria-label={isWished ? "위시리스트 해제" : "위시리스트 추가"}
                onClick={handleWishlistButtonClick}
                disabled={isWishlistSubmitting}
              >
                <i className={isWished ? "fa-solid fa-heart" : "fa-regular fa-heart"} />
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
                      onClick={handleGroupGoodsNavigate}
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
                  const isSelected = selectedSizeId === sizeItem.sizeId;
                  const isSizeSoldOut = sizeItem.soldOut || resolveStockQuantity(sizeItem.stockQty) <= 0;
                  return (
                    <button
                      key={sizeItem.sizeId}
                      type="button"
                      className={`${styles.sizeButton} ${isSelected ? styles.sizeButtonSelected : ""} ${isSizeSoldOut ? styles.sizeButtonSoldOut : ""}`}
                      onClick={() => handleSizeButtonClick(sizeItem)}
                      disabled={isSizeSoldOut}
                    >
                      <span className={styles.sizeButtonText}>{sizeItem.sizeId}</span>
                    </button>
                  );
                })}
              </div>

              <div className={styles.quantityRow}>
                <div className={styles.quantityControl}>
                  <button
                    type="button"
                    className={styles.quantityButton}
                    aria-label="수량 감소"
                    onClick={handleDecreaseOrderQuantityClick}
                    disabled={!canDecreaseOrderQuantity}
                  >
                    -
                  </button>
                  <span className={styles.quantityValue}>{orderQuantity}</span>
                  <button
                    type="button"
                    className={styles.quantityButton}
                    aria-label="수량 증가"
                    onClick={handleIncreaseOrderQuantityClick}
                    disabled={!canIncreaseOrderQuantity}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.cutLine} />

            <div className={styles.actionButtonRow}>
              <button
                type="button"
                className={styles.cartButton}
                disabled={isActionButtonDisabled || isCartSubmitting}
                onClick={handleCartButtonClick}
              >
                장바구니
              </button>
              <button type="button" className={styles.buyButton} disabled={isActionButtonDisabled}>
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

        {shouldRenderDetailImageList ? (
          <section className={styles.detailSection}>
            <div className={styles.detailContentWrap}>
              <div
                ref={detailContentRef}
                className={`${styles.detailImageContent} ${showDetailExpandButton ? styles.detailContentCollapsed : ""}`}
              >
                {orderedImageList.length > 0 ? (
                  <ul className={styles.detailImageList}>
                    {orderedImageList.map((imageItem) => (
                      <li key={`detail-${imageItem.goodsId}-${imageItem.imgNo}`} className={styles.detailImageListItem}>
                        <div className={styles.detailImageItemWrap}>
                          {/* 상세 fallback 이미지는 원본 비율/해상도를 우선 유지해 노출합니다. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageItem.imgUrl || imageItem.imgPath}
                            alt={detailData.goods.goodsNm || "상품 상세 이미지"}
                            className={styles.detailImageItem}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.detailImageEmptyText}>상품 상세 이미지가 없습니다.</p>
                )}
              </div>
              {showDetailExpandButton ? <div className={styles.detailFadeOut} aria-hidden="true" /> : null}
            </div>

            {showDetailExpandButton ? (
              <button type="button" className={styles.detailExpandButton} onClick={handleDetailExpandButtonClick}>
                전체 보기
              </button>
            ) : null}
          </section>
        ) : visibleDetailHtml !== "" ? (
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

      {showWishlistLoginConfirmLayer ? (
        <ShopConfirmLayer
          title="로그인 안내"
          message="로그인이 필요한 기능입니다. 로그인하시겠습니까?"
          confirmText="로그인"
          cancelText="취소"
          onConfirm={handleConfirmWishlistLoginMove}
          onClose={handleCloseWishlistLoginConfirmLayer}
        />
      ) : null}
    </section>
  );
}
