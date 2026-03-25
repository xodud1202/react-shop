import type { Metadata } from "next";
import ShopLoginClientSection from "@/domains/login/components/ShopLoginClientSection";
import { resolveSafeReturnUrl } from "@/domains/login/utils/loginRedirectUtils";
import { fetchShopSiteServerData } from "@/domains/site/api/siteServerApi";
import { createShopPageMetadata } from "@/shared/seo/shopMetadata";
import styles from "./page.module.css";

interface LoginFormPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// 로그인 복귀용 returnUrl 쿼리값을 안전한 상대 경로로 보정합니다.
function resolveReturnUrl(rawReturnUrl: string | string[] | undefined): string {
  if (Array.isArray(rawReturnUrl)) {
    return resolveSafeReturnUrl(rawReturnUrl[0]);
  }
  return resolveSafeReturnUrl(rawReturnUrl);
}

// 로그인 페이지를 렌더링합니다.
export default async function LoginFormPage({ searchParams }: LoginFormPageProps) {
  // 사이트 기본 정보를 SSR에서 조회합니다.
  const siteInfo = await fetchShopSiteServerData();
  const siteNm = siteInfo.siteNm.trim() !== "" ? siteInfo.siteNm : "쇼핑몰";
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const returnUrl = resolveReturnUrl(resolvedSearchParams.returnUrl);

  return (
    <section className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <h1 className={styles.loginTitle}>{siteNm}에 오신걸 환영합니다.</h1>
          <ShopLoginClientSection googleClientId={googleClientId} returnUrl={returnUrl} />
        </div>
      </div>
    </section>
  );
}

// 로그인 페이지 메타데이터를 생성합니다.
export async function generateMetadata(): Promise<Metadata> {
  const siteInfo = await fetchShopSiteServerData();
  const siteName = siteInfo.siteNm.trim();

  return createShopPageMetadata({
    title: siteName !== "" ? `${siteName} 로그인` : "로그인",
    description: "구글 계정으로 로그인하고 쇼핑몰 서비스를 이용할 수 있습니다.",
  });
}
