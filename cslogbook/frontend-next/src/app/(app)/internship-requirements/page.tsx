import { RoleGuard } from "@/components/auth/RoleGuard";
import styles from "./requirements.module.css";

const internshipSteps = [
  {
    title: "ตรวจสอบคุณสมบัติ",
    description: "เช็คหน่วยกิตและเงื่อนไขที่กำหนดก่อนยื่นคำร้อง",
  },
  {
    title: "ส่งคำร้อง คพ.05",
    description: "กรอกและส่งข้อมูลบริษัทและเอกสารที่เกี่ยวข้อง",
  },
  {
    title: "รอการอนุมัติ",
    description: "อาจารย์ที่ปรึกษาและเจ้าหน้าที่พิจารณาเอกสาร",
  },
  {
    title: "เริ่มฝึกงาน",
    description: "ปฏิบัติงานและบันทึกเวลาทุกวันตามจริง",
  },
  {
    title: "สรุปผลฝึกงาน",
    description: "ส่งรายงานและแบบสะท้อนการเรียนรู้หลังฝึกงาน",
  },
  {
    title: "รับการประเมิน",
    description: "ผู้ควบคุมงานประเมินผลและระบบสรุปคะแนน",
  },
];

const qualificationRequirements = [
  "ต้องเป็นนักศึกษาชั้นปีที่ 3 ขึ้นไป",
  "ต้องผ่านการเรียนมาแล้วอย่างน้อย 81 หน่วยกิต",
  "ต้องผ่านการอนุมัติจากอาจารย์ที่ปรึกษา",
];

const documentRequirements = [
  "คพ.05 - แบบคำร้องขอฝึกงาน",
  "หนังสือตอบรับจากสถานประกอบการ",
  "ข้อมูลติดต่อผู้ควบคุมงาน",
  "ใบลงเวลาการปฏิบัติงาน (บันทึกทุกวัน)",
  "รายงานสรุปผลฝึกงาน (หลังฝึกงาน)",
  "แบบประเมินผลฝึกงาน (ผู้ควบคุมงาน)",
];

const evaluationRequirements = [
  "ประเมินโดยผู้ควบคุมงานผ่านระบบ",
  "คะแนนเต็ม 100 คะแนน ต้องไม่ต่ำกว่า 70 คะแนน",
  "ต้องมีชั่วโมงฝึกงานไม่น้อยกว่า 240 ชั่วโมง",
  "ต้องบันทึกการปฏิบัติงานประจำวันอย่างสม่ำเสมอ",
];

export default function InternshipRequirementsPage() {
  return (
    <RoleGuard roles={["student"]}>
      <div className={styles.page}>
        <header className={styles.hero}>
          <div>
            <p className={styles.kicker}>Internship Guide</p>
            <h1 className={styles.title}>ข้อกำหนดการฝึกงาน</h1>
            <p className={styles.lead}>
              สรุปขั้นตอน เอกสาร และเกณฑ์สำคัญสำหรับนักศึกษาฝึกงานภาควิทยาการคอมพิวเตอร์
            </p>
          </div>
          <div className={styles.heroMeta}>
            <span className={styles.badge}>ระยะเวลา: 240 ชั่วโมงขึ้นไป</span>
            <span className={styles.badge}>ภาคฤดูร้อน</span>
            <span className={styles.badge}>ผลประเมิน S/U</span>
          </div>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>ขั้นตอนการฝึกงาน</h2>
          <div className={styles.steps}>
            {internshipSteps.map((step, index) => (
              <div key={step.title} className={styles.stepCard}>
                <div className={styles.stepIndex}>{String(index + 1).padStart(2, "0")}</div>
                <div>
                  <p className={styles.stepTitle}>{step.title}</p>
                  <p className={styles.stepDesc}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.sectionGrid}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>คุณสมบัติผู้ฝึกงาน</h3>
            <ul className={styles.list}>
              {qualificationRequirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>เอกสารที่ต้องส่ง</h3>
            <ul className={styles.list}>
              {documentRequirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>เกณฑ์การประเมิน</h3>
            <ul className={styles.list}>
              {evaluationRequirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className={styles.sectionNotice}>
          <div className={styles.notice}>
            <h3>ข้อปฏิบัติระหว่างฝึกงาน</h3>
            <p>
              แต่งกายสุภาพ ตรงต่อเวลา ปฏิบัติตามระเบียบสถานประกอบการ และบันทึกงานทุกวันอย่างละเอียด
            </p>
          </div>
          <div className={styles.notice}>
            <h3>การเตรียมตัวก่อนฝึกงาน</h3>
            <p>
              ศึกษาข้อมูลบริษัท เตรียมเอกสาร วางแผนการเดินทาง และทบทวนความรู้ที่เกี่ยวข้องกับงาน
            </p>
          </div>
        </section>
      </div>
    </RoleGuard>
  );
}
