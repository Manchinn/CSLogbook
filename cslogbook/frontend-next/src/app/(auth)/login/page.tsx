import { featureFlags } from "@/lib/config/featureFlags";
import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";

const legacyLoginUrl = process.env.NEXT_PUBLIC_LEGACY_FRONTEND_URL ?? "http://localhost:3000/login";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <p className={styles.badge}>CSLogbook</p>
          <h1>เข้าสู่ระบบ</h1>
          <p>ล็อกอินเพื่อเข้าใช้งานระบบ (เวอร์ชันทดลอง: เลือก role แล้ว redirect อัตโนมัติ)</p>
          {featureFlags.useLegacyFrontend ? (
            <p className={styles.legacyHint}>
              Legacy frontend ยังเปิดใช้งานอยู่ที่{" "}
              <a href={legacyLoginUrl} target="_blank" rel="noopener noreferrer">
                {legacyLoginUrl}
              </a>
            </p>
          ) : null}
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
