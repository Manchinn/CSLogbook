import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <main className={styles.page}>
      <div className={styles.backgroundLayer} aria-hidden="true">
        <span className={`${styles.bgCircle} ${styles.bgCircleTop}`} />
        <span className={`${styles.bgCircle} ${styles.bgCircleBottom}`} />
      </div>

      <section className={styles.layout}>
        <div className={styles.brandPanel}>
          <div className={styles.brandHeader}>
            <div className={styles.logoBadge}>CS</div>
            <h1 className={styles.brandTitle}>CS Logbook</h1>
            <p className={styles.brandDescription}>
              ระบบบันทึกและติดตามการฝึกงาน โครงงานพิเศษและปริญญานิพนธ์สำหรับนักศึกษา อาจารย์
              และเจ้าหน้าที่ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
            </p>
          </div>

          <div className={styles.highlightList}>
            <div className={styles.highlightCard}>
              <div className={styles.highlightIcon}>SSO</div>
              <div>
                <p className={styles.highlightTitle}>ล็อกอินด้วย KMUTNB SSO</p>
                <p className={styles.highlightText}>
                  เข้าสู่ระบบด้วยบัญชี ICIT Account เพียงครั้งเดียว ปลอดภัยด้วย Two-Factor
                  Authentication
                </p>
              </div>
            </div>

            <div className={styles.highlightCard}>
              <div className={styles.highlightIcon}>LIVE</div>
              <div>
                <p className={styles.highlightTitle}>อัปเดตสถานะฝึกงานเรียลไทม์</p>
                <p className={styles.highlightText}>
                  ดูความคืบหน้าจากทุกบันทึกที่ส่งและสถานะการอนุมัติได้ในหน้าเดียว
                </p>
              </div>
            </div>

            <div className={styles.highlightCard}>
              <div className={styles.highlightIcon}>TEAM</div>
              <div>
                <p className={styles.highlightTitle}>ทำงานร่วมกันได้รวดเร็ว</p>
                <p className={styles.highlightText}>
                  อาจารย์ที่ปรึกษาและเจ้าหน้าที่สามารถตรวจสอบอนุมัติได้ทันที
                </p>
              </div>
            </div>
          </div>

          <p className={styles.brandFooter}>
            ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ • คณะวิทยาศาสตร์ประยุกต์ •
            มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
          </p>
        </div>

        <div className={`${styles.card} ${styles.loginCard}`}>
          <div className={styles.header}>
            <h2>ลงชื่อเข้าใช้ระบบ</h2>
            <p>เข้าสู่ระบบด้วยบัญชี KMUTNB (ICIT Account) ของท่าน</p>
          </div>

          {errorMessage ? <p className={styles.errorText}>Login error: {errorMessage}</p> : null}

          <LoginForm />
        </div>
      </section>
    </main>
  );
}
