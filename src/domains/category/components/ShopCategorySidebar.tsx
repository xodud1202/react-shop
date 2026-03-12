"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ShopHeaderCategoryTree } from "@/domains/header/types";
import styles from "./ShopCategory.module.css";

interface ShopCategorySidebarProps {
  categoryTree: ShopHeaderCategoryTree[];
  selectedCategoryId: string;
}

// 카테고리 링크 URL을 생성합니다.
function buildCategoryHref(categoryId: string): string {
  return `/category?categoryId=${encodeURIComponent(categoryId)}`;
}

// 선택 카테고리까지의 경로를 계산합니다.
function findSelectedPathIds(categoryTree: ShopHeaderCategoryTree[], selectedCategoryId: string): string[] {
  // 선택 카테고리 값이 없으면 빈 경로를 반환합니다.
  if (selectedCategoryId.trim() === "") {
    return [];
  }

  for (const category of categoryTree) {
    // 현재 카테고리 아이디가 선택값과 일치하면 현재 경로를 반환합니다.
    if (category.categoryId === selectedCategoryId) {
      return [category.categoryId];
    }

    // 하위 경로를 재귀적으로 조회합니다.
    const childPath = findSelectedPathIds(category.children ?? [], selectedCategoryId);
    if (childPath.length > 0) {
      return [category.categoryId, ...childPath];
    }
  }

  // 트리에서 선택 카테고리를 찾지 못하면 빈 경로를 반환합니다.
  return [];
}

// 사이드바 기본 펼침 카테고리 목록을 계산합니다.
function resolveInitialOpenCategoryIds(categoryTree: ShopHeaderCategoryTree[], selectedCategoryId: string): string[] {
  // 선택 카테고리 경로를 기본 펼침 목록으로 사용합니다.
  return findSelectedPathIds(categoryTree, selectedCategoryId);
}

// 카테고리 사이드바를 렌더링합니다.
export default function ShopCategorySidebar({ categoryTree, selectedCategoryId }: ShopCategorySidebarProps) {
  // 초기 펼침 상태를 계산합니다.
  const defaultOpenCategoryIds = useMemo(
    () => resolveInitialOpenCategoryIds(categoryTree, selectedCategoryId),
    [categoryTree, selectedCategoryId],
  );

  // 카테고리 펼침/접힘 상태를 관리합니다.
  const [openCategoryIdSet, setOpenCategoryIdSet] = useState<Set<string>>(() => new Set(defaultOpenCategoryIds));

  // 카테고리 펼침 상태를 토글합니다.
  const handleToggleCategory = (categoryId: string) => {
    setOpenCategoryIdSet((prev) => {
      // 이전 상태를 복사한 뒤 대상 카테고리 상태를 반전합니다.
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // 카테고리 리스트를 재귀적으로 렌더링합니다.
  const renderCategoryList = (nodes: ShopHeaderCategoryTree[], depth: 1 | 2 | 3) => {
    if (!Array.isArray(nodes) || nodes.length === 0) {
      return null;
    }

    // depth별 스타일 클래스를 계산합니다.
    const depthClassName = depth === 1 ? styles.depth1 : depth === 2 ? styles.depth2 : styles.depth3;
    const levelClassName = depth === 1 ? `${styles.levelList} ${styles.level1List}` : `${styles.levelList} ${styles.childList}`;

    return (
      <ul className={levelClassName}>
        {nodes.map((node) => {
          // 하위 카테고리 존재 여부와 펼침 여부를 계산합니다.
          const hasChildren = Array.isArray(node.children) && node.children.length > 0;
          const isOpen = hasChildren && openCategoryIdSet.has(node.categoryId);
          const isSelected = node.categoryId === selectedCategoryId;

          return (
            <li key={node.categoryId}>
              <div className={styles.row}>
                <Link
                  href={buildCategoryHref(node.categoryId)}
                  className={`${styles.categoryLink} ${depthClassName} ${isSelected ? styles.selectedLink : ""}`}
                >
                  {node.categoryNm}
                </Link>

                {hasChildren ? (
                  <button
                    type="button"
                    className={styles.toggleButton}
                    onClick={() => {
                      // 하위 카테고리 펼침/접힘을 토글합니다.
                      handleToggleCategory(node.categoryId);
                    }}
                    aria-label={isOpen ? "카테고리 접기" : "카테고리 펼치기"}
                  >
                    <i className={isOpen ? "fa-solid fa-caret-up" : "fa-solid fa-caret-down"} />
                  </button>
                ) : (
                  <span className={styles.toggleButton} aria-hidden="true" />
                )}
              </div>

              {hasChildren && isOpen ? renderCategoryList(node.children, depth === 1 ? 2 : 3) : null}
            </li>
          );
        })}
      </ul>
    );
  };

  return <aside className={styles.sidebar}>{renderCategoryList(categoryTree, 1)}</aside>;
}