"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ShopMypageWishPageResponse } from "@/domains/mypage/types";
import { buildLoginFormPath } from "@/domains/login/utils/loginRedirectUtils";
import { requestShopClientApi } from "@/shared/client/shopClientApi";
import styles from "./ShopMypageWishSection.module.css";

interface ShopMypageWishSectionProps {
  wishPageData: ShopMypageWishPageResponse;
}

interface ShopMypageWishPaginationState {
  currentPageNo: number;
  totalPageCount: number;
  pageNoList: number[];
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPageNo: number;
  nextPageNo: number;
  hasPrevBlock: boolean;
  hasNextBlock: boolean;
  prevBlockPageNo: number;
  nextBlockPageNo: number;
}

// 가격 숫자를 천 단위 콤마 문자열로 변환합니다.
function formatPrice(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString("ko-KR");
}

// 상품 개수를 천 단위 콤마 문자열로 변환합니다.
function formatCount(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString("ko-KR");
}

// 현재 페이지 경로(pathname + search)를 로그인 복귀용 경로로 반환합니다.
function resolveCurrentPagePath(): string {
  if (typeof window === "undefined") {
    return "/mypage/wish";
  }
  return `${window.location.pathname}${window.location.search}`;
}

// 시작/종료 페이지 번호 구간 배열을 생성합니다.
function createPageNumberRange(startPageNo: number, endPageNo: number): number[] {
  // 페이지 번호 목록을 순차적으로 구성합니다.
  const result: number[] = [];
  for (let page = startPageNo; page <= endPageNo; page += 1) {
    result.push(page);
  }
  return result;
}

// 현재 페이지 기준 페이지네이션 상태를 계산합니다.
function resolvePaginationState(pageNo: number, totalPageCount: number): ShopMypageWishPaginationState {
  // 총 페이지 수와 현재 페이지를 안전한 값으로 보정합니다.
  const safeTotalPageCount = Number.isFinite(totalPageCount) && totalPageCount > 0 ? Math.floor(totalPageCount) : 0;
  const safeCurrentPageNo =
    safeTotalPageCount === 0
      ? 1
      : Math.min(Math.max(Number.isFinite(pageNo) ? Math.floor(pageNo) : 1, 1), safeTotalPageCount);

  // 10개 단위 페이지 블록 범위를 계산합니다.
  const blockStartPageNo = Math.floor((safeCurrentPageNo - 1) / 10) * 10 + 1;
  const blockEndPageNo = Math.min(blockStartPageNo + 9, safeTotalPageCount);
  const pageNoList = safeTotalPageCount === 0 ? [] : createPageNumberRange(blockStartPageNo, blockEndPageNo);

  // 이전/다음 페이지와 이전/다음 블록 이동 상태를 계산합니다.
  const hasPrevPage = safeCurrentPageNo > 1;
  const hasNextPage = safeCurrentPageNo < safeTotalPageCount;
  const hasPrevBlock = blockStartPageNo > 1;
  const hasNextBlock = blockEndPageNo < safeTotalPageCount;

  return {
    currentPageNo: safeCurrentPageNo,
    totalPageCount: safeTotalPageCount,
    pageNoList,
    hasPrevPage,
    hasNextPage,
    prevPageNo: hasPrevPage ? safeCurrentPageNo - 1 : 1,
    nextPageNo: hasNextPage ? safeCurrentPageNo + 1 : safeTotalPageCount,
    hasPrevBlock,
    hasNextBlock,
    prevBlockPageNo: hasPrevBlock ? Math.max(blockStartPageNo - 10, 1) : 1,
    nextBlockPageNo: hasNextBlock ? blockEndPageNo + 1 : safeTotalPageCount,
  };
}

// 마이페이지 위시리스트 페이지 링크를 생성합니다.
function buildMypageWishHref(pageNo: number): string {
  const queryParams = new URLSearchParams();
  queryParams.set("pageNo", String(pageNo));
  return `/mypage/wish?${queryParams.toString()}`;
}

// 마이페이지 위시리스트 목록을 렌더링합니다.
export default function ShopMypageWishSection({ wishPageData }: ShopMypageWishSectionProps) {
  const router = useRouter();
  const [deletingGoodsId, setDeletingGoodsId] = useState("");

  // 페이지네이션 렌더링 상태를 계산합니다.
  const paginationState = resolvePaginationState(wishPageData.pageNo, wishPageData.totalPageCount);

  // 삭제 버튼 클릭 시 위시리스트 상품을 삭제합니다.
  const handleDeleteWishGoods = async (goodsId: string): Promise<void> => {
    // 중복 삭제 요청을 방지하고 상품코드 유효성을 확인합니다.
    const normalizedGoodsId = goodsId.trim();
    if (normalizedGoodsId === "" || deletingGoodsId !== "") {
      return;
    }

    try {
      // 삭제 API를 호출하는 동안 로딩 상태를 설정합니다.
      setDeletingGoodsId(normalizedGoodsId);
      const result = await requestShopClientApi<{ message?: string }>("/api/shop/mypage/wish/delete", {
        method: "POST",
        body: {
          goodsId: normalizedGoodsId,
        },
      });

      // 비로그인/세션만료면 로그인 확인 후 로그인 페이지로 이동합니다.
      if (result.status === 401) {
        const shouldMoveLogin = window.confirm("로그인이 필요한 기능입니다. 로그인하시겠습니까?");
        if (shouldMoveLogin) {
          router.push(buildLoginFormPath(resolveCurrentPagePath()));
        }
        return;
      }

      // 실패 응답이면 서버 메시지를 우선 노출합니다.
      if (!result.ok) {
        window.alert(result.message || "위시리스트 삭제에 실패했습니다.");
        return;
      }

      // 삭제 성공 시 화면을 갱신합니다.
      router.refresh();
    } catch {
      // 네트워크/예외 오류 시 공통 실패 문구를 노출합니다.
      window.alert("위시리스트 삭제에 실패했습니다.");
    } finally {
      // 요청 종료 후 로딩 상태를 해제합니다.
      setDeletingGoodsId("");
    }
  };

  return (
    <section className={styles.wishSection}>
      <header className={styles.wishHeader}>
        <h1 className={styles.wishTitle}>위시리스트</h1>
        <p className={styles.wishCount}>총 {formatCount(wishPageData.goodsCount)}개</p>
      </header>

      {wishPageData.goodsList.length === 0 ? (
        <div className={styles.emptyState}>등록된 위시리스트 상품이 없습니다.</div>
      ) : (
        <ul className={styles.wishList}>
          {wishPageData.goodsList.map((wishItem) => {
            const isDeleting = deletingGoodsId === wishItem.goodsId;
            return (
              <li key={wishItem.goodsId} className={styles.wishListItem}>
                <Link href={`/goods?goodsId=${encodeURIComponent(wishItem.goodsId)}`} className={styles.thumbnailLink}>
                  {wishItem.imgUrl.trim() !== "" ? (
                    <Image
                      src={wishItem.imgUrl}
                      alt={wishItem.goodsNm}
                      fill
                      sizes="80px"
                      className={styles.thumbnailImage}
                    />
                  ) : (
                    <span className={styles.thumbnailFallback}>이미지 없음</span>
                  )}
                </Link>

                <div className={styles.wishInfo}>
                  <Link href={`/goods?goodsId=${encodeURIComponent(wishItem.goodsId)}`} className={styles.goodsName}>
                    {wishItem.goodsNm}
                  </Link>
                </div>

                <div className={styles.wishRight}>
                  <span className={styles.salePrice}>{formatPrice(wishItem.saleAmt)}원</span>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => handleDeleteWishGoods(wishItem.goodsId)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "삭제중..." : "삭제"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {paginationState.totalPageCount > 0 ? (
        <nav className={styles.paginationWrap} aria-label="위시리스트 페이지 이동">
          {paginationState.hasPrevPage ? (
            <Link className={styles.paginationArrow} href={buildMypageWishHref(paginationState.prevPageNo)}>
              {"<"}
            </Link>
          ) : (
            <span className={`${styles.paginationArrow} ${styles.paginationDisabled}`}>{"<"}</span>
          )}

          {paginationState.hasPrevBlock ? (
            <Link className={styles.paginationEllipsis} href={buildMypageWishHref(paginationState.prevBlockPageNo)}>
              ...
            </Link>
          ) : null}

          {paginationState.pageNoList.map((targetPageNo) =>
            targetPageNo === paginationState.currentPageNo ? (
              <span key={`page-${targetPageNo}`} className={`${styles.paginationNumber} ${styles.paginationCurrent}`}>
                {targetPageNo}
              </span>
            ) : (
              <Link key={`page-${targetPageNo}`} className={styles.paginationNumber} href={buildMypageWishHref(targetPageNo)}>
                {targetPageNo}
              </Link>
            ),
          )}

          {paginationState.hasNextBlock ? (
            <Link className={styles.paginationEllipsis} href={buildMypageWishHref(paginationState.nextBlockPageNo)}>
              ...
            </Link>
          ) : null}

          {paginationState.hasNextPage ? (
            <Link className={styles.paginationArrow} href={buildMypageWishHref(paginationState.nextPageNo)}>
              {">"}
            </Link>
          ) : (
            <span className={`${styles.paginationArrow} ${styles.paginationDisabled}`}>{">"}</span>
          )}
        </nav>
      ) : null}
    </section>
  );
}
