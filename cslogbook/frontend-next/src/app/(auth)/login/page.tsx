import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";
import { CSLogbookLogo } from "@/components/common/Logo";

function getSsoErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    account_not_found:
      "ไม่พบบัญชีของท่านในระบบ กรุณาติดต่อเจ้าหน้าที่ภาควิชาเพื่อสร้างบัญชีก่อนเข้าใช้งาน",
    invalid_state: "เซสชันหมดอายุ กรุณาลองเข้าสู่ระบบอีกครั้ง",
    token_error: "ไม่สามารถยืนยันตัวตนกับ SSO ได้ กรุณาลองใหม่อีกครั้ง",
    token_missing_access_token: "ไม่สามารถยืนยันตัวตนกับ SSO ได้ กรุณาลองใหม่อีกครั้ง",
    userinfo_error: "ไม่สามารถดึงข้อมูลผู้ใช้จาก SSO ได้ กรุณาลองใหม่อีกครั้ง",
    no_code: "ไม่ได้รับรหัสยืนยันจาก SSO กรุณาลองใหม่อีกครั้ง",
    server_error: "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง",
  };
  return messages[errorCode] || `เกิดข้อผิดพลาด: ${errorCode}`;
}

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
        {/* brand header — แสดงก่อนเสมอทั้ง desktop และ mobile */}
        <div className={styles.brandHeader}>
          <CSLogbookLogo size={52} className={styles.logoBadge} />
          <h1 className={styles.brandTitle}>CS Logbook</h1>
          <p className={styles.brandDescription}>
            ระบบบันทึกและติดตามการฝึกงาน โครงงานพิเศษและปริญญานิพนธ์สำหรับนักศึกษา อาจารย์
            และเจ้าหน้าที่ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
          </p>
          <p className={styles.brandFooter}>
            ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ • คณะวิทยาศาสตร์ประยุกต์ •
            มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
          </p>
        </div>

        {/* login card — mobile: อยู่ใต้ brand header, desktop: อยู่คอลัมน์ขวา */}
        <div className={`${styles.card} ${styles.loginCard}`}>
          <div className={styles.header}>
            <h2>ลงชื่อเข้าใช้ระบบ</h2>
            <p>เข้าสู่ระบบด้วยบัญชี KMUTNB (ICIT Account) ของท่าน</p>
          </div>

          {errorMessage ? <p className={styles.errorText}>{getSsoErrorMessage(errorMessage)}</p> : null}

          <LoginForm />
        </div>

        {/* highlights — mobile: อยู่ใต้ login card */}
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
      </section>
    </main>
  );
}
