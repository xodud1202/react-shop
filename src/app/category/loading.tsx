import ShopPageStatus from "@/shared/components/page/ShopPageStatus";

// 카테고리 라우트 로딩 상태를 렌더링합니다.
export default function CategoryLoading() {
  return (
    <ShopPageStatus
      eyebrow="카테고리"
      title="카테고리 상품을 준비하고 있습니다."
      description="선택한 카테고리의 상품과 필터 정보를 불러오는 중입니다."
    />
  );
}
