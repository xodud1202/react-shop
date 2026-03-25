import { cache } from "react";
import type { Metadata } from "next";
import ShopExhibitionInvalidRedirect from "@/domains/exhibition/components/ShopExhibitionInvalidRedirect";
import ShopExhibitionDetailSection from "@/domains/exhibition/components/ShopExhibitionDetailSection";
import styles from "@/domains/exhibition/components/ShopExhibition.module.css";
import {
  fetchShopExhibitionDetailServerData,
  fetchShopExhibitionGoodsPageServerData,
} from "@/domains/exhibition/api/exhibitionServerApi";
import { createShopPageMetadata } from "@/shared/seo/shopMetadata";

interface ExhibitionDetailPageProps {
  params?: Promise<{
    exhibitionNo?: string;
  }>;
}

// 기획전 상세 데이터를 요청 단위로 메모이징합니다.
const loadShopExhibitionDetailData = cache(async (exhibitionNo: number) => {
  return fetchShopExhibitionDetailServerData(exhibitionNo);
});

// 라우트 파라미터에서 기획전 번호를 추출해 1 이상 정수로 보정합니다.
function resolveExhibitionNo(rawExhibitionNo: string | undefined): number {
  const parsedExhibitionNo = Number(rawExhibitionNo);
  if (!Number.isFinite(parsedExhibitionNo) || parsedExhibitionNo < 1) {
    return 0;
  }

  return Math.floor(parsedExhibitionNo);
}

// 쇼핑몰 기획전 상세 화면을 렌더링합니다.
export default async function ExhibitionDetailPage({ params }: ExhibitionDetailPageProps) {
  // 동적 라우트 파라미터에서 기획전 번호를 추출합니다.
  const resolvedParams = params ? await Promise.resolve(params) : {};
  const exhibitionNo = resolveExhibitionNo(resolvedParams.exhibitionNo);
  const exhibitionDetailData = await loadShopExhibitionDetailData(exhibitionNo);

  // 유효하지 않은 기획전이면 이전 화면 또는 목록으로 이동시킵니다.
  if (!exhibitionDetailData || exhibitionDetailData.defaultTabNo < 1 || exhibitionDetailData.tabList.length === 0) {
    return (
      <section className={styles.exhibitionPage}>
        <div className={styles.exhibitionContainer}>
          <ShopExhibitionInvalidRedirect />
        </div>
      </section>
    );
  }

  // 기본 선택 탭의 1페이지 상품 목록을 SSR로 함께 조회합니다.
  const initialGoodsPageData = await fetchShopExhibitionGoodsPageServerData(exhibitionNo, exhibitionDetailData.defaultTabNo, 1);

  return (
    <section className={styles.exhibitionPage}>
      <div className={styles.exhibitionContainer}>
        <ShopExhibitionDetailSection
          key={`${exhibitionDetailData.exhibitionNo}-${exhibitionDetailData.defaultTabNo}`}
          detailData={exhibitionDetailData}
          initialGoodsPageData={initialGoodsPageData}
        />
      </div>
    </section>
  );
}

// 기획전 상세 페이지 메타데이터를 생성합니다.
export async function generateMetadata({ params }: ExhibitionDetailPageProps): Promise<Metadata> {
  const resolvedParams = params ? await Promise.resolve(params) : {};
  const exhibitionNo = resolveExhibitionNo(resolvedParams.exhibitionNo);
  const exhibitionDetailData = await loadShopExhibitionDetailData(exhibitionNo);
  const exhibitionName = exhibitionDetailData?.exhibitionNm?.trim() ?? "";

  return createShopPageMetadata({
    title: exhibitionName || "기획전 상세",
    description:
      exhibitionName !== "" ? `${exhibitionName} 기획전 상세 정보와 상품을 확인할 수 있습니다.` : "기획전 상세 정보를 확인할 수 있습니다.",
  });
}
