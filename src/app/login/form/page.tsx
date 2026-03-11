import ShopLoginClientSection from "@/components/login/ShopLoginClientSection";
import { fetchShopSiteServerData } from "@/lib/server/shopSiteServerApi";
import styles from "./page.module.css";

// 로그인 페이지를 렌더링합니다.
export default async function LoginFormPage() {
  // 사이트 기본 정보를 SSR에서 조회합니다.
  const siteInfo = await fetchShopSiteServerData();
  const siteNm = siteInfo.siteNm.trim() !== "" ? siteInfo.siteNm : "쇼핑몰";
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  return (
    <section className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <h1 className={styles.loginTitle}>{siteNm}에 오신걸 환영합니다.</h1>
          <ShopLoginClientSection googleClientId={googleClientId} />
        </div>
      </div>
    </section>
  );
}
