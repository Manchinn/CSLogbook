import { featureFlags } from "@/lib/config/featureFlags";
import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";

const legacyLoginUrl = process.env.NEXT_PUBLIC_LEGACY_FRONTEND_URL;

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <p className={styles.badge}>CSLogbook</p>
          <h1>เข้าสู่ระบบ</h1>
          <p>ล็อกอินเพื่อเข้าใช้งานระบบ (รองรับทั้ง username/password และ SSO)</p>
          {featureFlags.useLegacyFrontend && legacyLoginUrl ? (
            <p className={styles.legacyHint}>
              Legacy frontend ยังเปิดใช้งานอยู่ที่{" "}
              <a href={legacyLoginUrl} target="_blank" rel="noopener noreferrer">
                {legacyLoginUrl}
              </a>
            </p>
          ) : null}
        </div>

        {errorMessage ? <p className={styles.errorText}>Login error: {errorMessage}</p> : null}

        <LoginForm />
      </section>
    </main>
  );
}
