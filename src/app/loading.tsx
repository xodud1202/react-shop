import ShopPageStatus from "@/shared/components/page/ShopPageStatus";

// 전역 라우트 로딩 상태를 렌더링합니다.
export default function Loading() {
  return (
    <ShopPageStatus
      eyebrow="로딩"
      title="페이지를 준비하고 있습니다."
      description="화면과 데이터를 함께 불러오는 중입니다. 잠시만 기다려주세요."
    />
  );
}
