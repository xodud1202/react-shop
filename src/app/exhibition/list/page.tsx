import type { Metadata } from "next";
import ShopExhibitionListSection from "@/domains/exhibition/components/ShopExhibitionListSection";
import styles from "@/domains/exhibition/components/ShopExhibition.module.css";
import { fetchShopExhibitionPageServerData } from "@/domains/exhibition/api/exhibitionServerApi";
import { createShopPageMetadata } from "@/shared/seo/shopMetadata";

interface ExhibitionListPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// 검색 파라미터에서 pageNo 값을 추출해 1 이상 정수로 보정합니다.
function resolvePageNo(rawPageNo: string | string[] | undefined): number {
  // 배열 파라미터면 첫 번째 값을 사용합니다.
  const pageNoSource = Array.isArray(rawPageNo) ? rawPageNo[0] : rawPageNo;
  const parsedPageNo = Number(pageNoSource);
  if (!Number.isFinite(parsedPageNo) || parsedPageNo < 1) {
    return 1;
  }

  return Math.floor(parsedPageNo);
}

// 쇼핑몰 기획전 목록 화면을 렌더링합니다.
export default async function ExhibitionListPage({ searchParams }: ExhibitionListPageProps) {
  // URL pageNo를 추출해 기획전 목록 페이지 데이터를 조회합니다.
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const pageNo = resolvePageNo(resolvedSearchParams.pageNo);
  const exhibitionPageData = await fetchShopExhibitionPageServerData(pageNo);

  return (
    <section className={styles.exhibitionPage}>
      <div className={styles.exhibitionContainer}>
        <ShopExhibitionListSection
          exhibitionList={exhibitionPageData.exhibitionList}
          totalCount={exhibitionPageData.totalCount}
          pageNo={exhibitionPageData.pageNo}
          totalPageCount={exhibitionPageData.totalPageCount}
        />
      </div>
    </section>
  );
}

// 기획전 목록 페이지 메타데이터를 생성합니다.
export function generateMetadata(): Metadata {
  return createShopPageMetadata({
    title: "기획전",
    description: "진행 중인 기획전과 추천 배너를 확인할 수 있습니다.",
  });
}
