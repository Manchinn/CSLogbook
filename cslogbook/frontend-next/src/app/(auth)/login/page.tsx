import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <p className={styles.badge}>CSLogbook</p>
          <h1>เข้าสู่ระบบ</h1>
          <p>ล็อกอินเพื่อเข้าใช้งานระบบฝึกงานและโครงงาน</p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
