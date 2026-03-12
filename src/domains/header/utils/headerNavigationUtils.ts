import type { ShopHeaderCategoryTree } from "@/domains/header/types";

// 카테고리 이동 URL을 생성합니다.
export function buildCategoryHref(categoryId: string): string {
  return `/category?categoryId=${encodeURIComponent(categoryId)}`;
}

// 1차 카테고리 진입 시 기본 활성 2차 카테고리 아이디를 계산합니다.
export function resolveInitialLevel2CategoryId(categoryTree: ShopHeaderCategoryTree[], categoryId: string): string | null {
  const targetCategory = categoryTree.find((item) => item.categoryId === categoryId);
  return targetCategory?.children[0]?.categoryId ?? null;
}
