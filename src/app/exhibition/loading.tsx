import ShopPageStatus from "@/shared/components/page/ShopPageStatus";

// 기획전 라우트 로딩 상태를 렌더링합니다.
export default function ExhibitionLoading() {
  return (
    <ShopPageStatus
      eyebrow="기획전"
      title="기획전 화면을 준비하고 있습니다."
      description="배너와 상품 목록을 불러오는 중입니다."
    />
  );
}
