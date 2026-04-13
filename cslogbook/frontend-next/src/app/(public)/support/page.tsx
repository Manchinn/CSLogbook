import type { Metadata } from "next";
import Link from "next/link";
import { CSLogbookLogo } from "@/components/common/Logo";
import styles from "../layout.module.css";

export const metadata: Metadata = {
  title: "ติดต่อผู้ดูแลระบบ — CS Logbook",
  description: "ช่องทางติดต่อผู้ดูแลระบบ CS Logbook ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ มจพ.",
};

export default function SupportPage() {
  return (
    <main className={styles.page}>
      <div className={styles.backgroundLayer} aria-hidden="true">
        <span className={`${styles.bgCircle} ${styles.bgCircleTop}`} />
        <span className={`${styles.bgCircle} ${styles.bgCircleBottom}`} />
      </div>

      <div className={styles.card}>
        <Link href="/login" className={styles.logoLink} aria-label="กลับหน้าเข้าสู่ระบบ">
          <CSLogbookLogo size={44} />
        </Link>

        <h1 className={styles.title}>ติดต่อผู้ดูแลระบบ</h1>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>ผู้พัฒนาและดูแลระบบ</h2>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>ชื่อ-นามสกุล</span>
              <span>ชินกฤต ศรีป่าน</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>รหัสนักศึกษา</span>
              <span>6404062630295</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>สาขา</span>
              <span>ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>สถานที่ติดต่อ</h2>
          <p className={styles.text}>
            ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
            <br />
            คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
            <br />
            ตึก 78 ชั้น 6
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>วิธีแจ้งปัญหา</h2>
          <ul className={styles.list}>
            <li>ติดต่อผ่านอีเมลผู้ดูแลระบบ หรือเจ้าหน้าที่ภาควิชา</li>
            <li>แจ้งโดยตรงที่ภาควิชา ตึก 78 ชั้น 6</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>เวลาทำการ</h2>
          <p className={styles.text}>
            วันจันทร์ – ศุกร์ เวลา 08:30 – 16:30 น. (ยกเว้นวันหยุดราชการ)
          </p>
        </div>

        <nav className={styles.footer}>
          <Link href="/privacy-policy" className={styles.footerLink}>
            นโยบายความเป็นส่วนตัว
          </Link>
          <Link href="/login" className={styles.footerLink}>
            กลับหน้าเข้าสู่ระบบ
          </Link>
        </nav>
      </div>
    </main>
  );
}
