import Link from "next/link";
import { CSLogbookLogo } from "@/components/common/Logo";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      {/* background blobs เหมือน login page */}
      <div className={styles.backgroundLayer} aria-hidden="true">
        <span className={`${styles.bgCircle} ${styles.bgCircleTop}`} />
        <span className={`${styles.bgCircle} ${styles.bgCircleBottom}`} />
      </div>

      <div className={styles.card}>
        <Link href="/" className={styles.logoLink} aria-label="กลับหน้าหลัก">
          <CSLogbookLogo size={44} />
        </Link>

        <div className={styles.code} aria-hidden="true">
          404
        </div>

        <h1 className={styles.title}>ไม่พบหน้าที่ต้องการ</h1>
        <p className={styles.description}>
          หน้าที่คุณเข้าถึงไม่มีอยู่ในระบบ หรืออาจถูกย้ายไปยัง URL ใหม่แล้ว
        </p>

        <div className={styles.actions}>
          <Link href="/dashboard/student" className={styles.btnPrimary}>
            หน้าหลักนักศึกษา
          </Link>
          <Link href="/dashboard/teacher" className={styles.btnSecondary}>
            หน้าหลักอาจารย์
          </Link>
        </div>

        <p className={styles.footer}>
          หากปัญหายังคงอยู่ กรุณาติดต่อเจ้าหน้าที่ภาควิชา
        </p>
      </div>
    </main>
  );
}
