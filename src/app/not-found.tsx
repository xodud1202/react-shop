import ShopPageStatus from "@/shared/components/page/ShopPageStatus";

// 공통 404 상태 화면을 렌더링합니다.
export default function NotFound() {
  return (
    <ShopPageStatus
      eyebrow="페이지 없음"
      title="요청하신 페이지를 찾을 수 없습니다."
      description="주소가 잘못되었거나 더 이상 제공되지 않는 페이지입니다."
      primaryActionHref="/"
      primaryActionLabel="메인으로 이동"
      secondaryActionHref="/exhibition/list"
      secondaryActionLabel="기획전 보기"
    />
  );
}
