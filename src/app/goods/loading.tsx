import ShopPageStatus from "@/shared/components/page/ShopPageStatus";

// 상품상세 라우트 로딩 상태를 렌더링합니다.
export default function GoodsLoading() {
  return (
    <ShopPageStatus
      eyebrow="상품"
      title="상품 정보를 준비하고 있습니다."
      description="상품 상세, 옵션, 혜택 정보를 불러오는 중입니다."
    />
  );
}
