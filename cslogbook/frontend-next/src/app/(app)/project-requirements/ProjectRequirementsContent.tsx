"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";
import styles from "./requirements.module.css";

const projectSteps = [
  {
    title: "เลือกหัวข้อโครงงานและปรึกษาอาจารย์",
    description: "ปรึกษาและกำหนดหัวข้อโครงงานร่วมกับอาจารย์ที่ปรึกษา",
  },
  {
    title: "ส่งแบบเสนอหัวข้อโครงงาน",
    description: "กรอกแบบฟอร์มเสนอหัวข้อโครงงานและส่งผ่านระบบ",
  },
  {
    title: "สอบหัวข้อโครงงานพิเศษ",
    description: "นำเสนอหัวข้อโครงงานต่อคณะกรรมการ → ผ่าน",
  },
  {
    title: "พัฒนาโครงงานพิเศษ 1",
    description:
      "ดำเนินการพัฒนาโครงงานตามแผนงาน และบันทึก Logbook อย่างสม่ำเสมอ",
  },
  {
    title: "สอบความคืบหน้าโครงงานพิเศษ 1",
    description: "นำเสนอโครงงานพิเศษ 1 ต่อคณะกรรมการ → ผ่าน",
  },
  {
    title: "พัฒนาโครงงานพิเศษ 2 / ปริญญานิพนธ์",
    description: "ดำเนินการพัฒนาโครงงานและบันทึก Logbook ต่อเนื่อง",
  },
  {
    title: "สอบป้องกันปริญญานิพนธ์",
    description: "นำเสนอและสาธิตผลงานต่อคณะกรรมการ",
  },
  {
    title: "ส่งปริญญานิพนธ์ฉบับสมบูรณ์",
    description: "ส่งเอกสารฉบับสมบูรณ์ตามระยะเวลาที่ภาควิชากำหนด",
  },
];

const documentRequirements = [
  "แบบฟอร์มยื่นสอบหัวข้อโครงงานพิเศษ พร้อมข้อเสนอโครงงาน",
  "คพ.02 - แบบฟอร์มขอสอบโครงงานพิเศษ 1 พร้อมรายงานบทที่ 1-3",
  "แจ้งความประสงค์ขอทดสอบระบบล่วงหน้า 30 วัน (สำหรับสอบปริญญานิพนธ์)",
  "คพ.03 - แบบฟอร์มขอสอบปริญญานิพนธ์ พร้อมรายงานฉบับสมบูรณ์",
  "บันทึกการประชุมกับอาจารย์ที่ปรึกษา (Logbook) อย่างสม่ำเสมอ",
  "เอกสารแก้ไขตามข้อเสนอแนะของกรรมการ (ถ้ามี)",
  "ซอร์สโค้ด / ไฟล์โปรแกรม / ผลงาน",
  "เอกสารคู่มือการใช้งาน (User Manual)",
];

const tipsTopics = [
  {
    title: "การเลือกหัวข้อและขอบเขตโครงงาน",
    items: [
      "เลือกหัวข้อที่อยู่ในความสนใจและความถนัดของตนเอง",
      "ปรึกษาอาจารย์ที่ปรึกษาก่อนตัดสินใจเลือกหัวข้อ",
      "กำหนดขอบเขตโครงงานให้ชัดเจนและเหมาะสมกับระยะเวลา",
      "เลือกโครงงานที่มีคุณค่าและประโยชน์ในการนำไปใช้",
    ],
  },
  {
    title: "การวางแผนการทำงาน",
    items: [
      "วางแผนการทำงานอย่างเป็นระบบตั้งแต่ต้นจนจบโครงงาน",
      "ประชุมกับอาจารย์ที่ปรึกษาอย่างสม่ำเสมอ (อย่างน้อย 2 สัปดาห์/ครั้ง หรือ ตามที่ภาควิชากำหนด 4 ครั้งต่อภาคเรียน)",
      "บันทึก Logbook ทุกครั้งที่มีการดำเนินงานหรือประชุม",
      "เผื่อเวลาสำหรับการแก้ไขปัญหาที่อาจเกิดขึ้นระหว่างพัฒนา",
    ],
  },
];

export default function ProjectRequirementsContent() {
  const { token } = useAuth();
  const { data } = useStudentEligibility(token, true);

  const minCredits = data?.requirements?.project?.totalCredits ?? null;
  const minMajorCredits = data?.requirements?.project?.majorCredits ?? null;

  const qualificationRequirements = [
    minCredits
      ? `ต้องมีหน่วยกิตสะสมอย่างน้อย ${minCredits} หน่วยกิต`
      : "ต้องผ่านหน่วยกิตขั้นต่ำตามหลักสูตร",
    ...(minMajorCredits
      ? [`ต้องมีหน่วยกิตในสาขาอย่างน้อย ${minMajorCredits} หน่วยกิต`]
      : ["ต้องมีหน่วยกิตสะสมในสาขาตามที่กำหนด"]),
    "ต้องเป็นนักศึกษาชั้นปีที่ 4 ขึ้นไป",
    "ต้องลงทะเบียนวิชาโครงงานพิเศษ 1 และ 2 ตามลำดับ",
  ];

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Project Guide</p>
          <h1 className={styles.title}>ข้อกำหนดโครงงานพิเศษ</h1>
          <p className={styles.lead}>
            สรุปขั้นตอน เอกสาร
            และเกณฑ์สำคัญสำหรับโครงงานพิเศษ
            ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
          </p>
        </div>
        <div className={styles.heroMeta}>
          <span className={styles.badge}>โครงงานพิเศษและปริญญานิพนธ์</span>
        </div>
      </header>

      <div className={styles.alertInfo}>
        <strong>สำคัญ:</strong>{" "}
        ข้อกำหนดนี้สำหรับนักศึกษาภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
        ข้อมูลอาจมีการเปลี่ยนแปลง
        กรุณาตรวจสอบกับอาจารย์ที่ปรึกษาเพื่อข้อมูลล่าสุด
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ขั้นตอนการทำโครงงานพิเศษ</h2>
        <div className={styles.steps}>
          {projectSteps.map((step, index) => (
            <div key={step.title} className={styles.stepCard}>
              <div className={styles.stepIndex}>
                {String(index + 1).padStart(2, "0")}
              </div>
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
          <h3 className={styles.cardTitle}>คุณสมบัติผู้ลงทะเบียนโครงงานพิเศษ</h3>
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
      </section>

      <section className={styles.sectionNotice}>
        {tipsTopics.map((topic) => (
          <div key={topic.title} className={styles.notice}>
            <h3>{topic.title}</h3>
            <ul className={styles.tipList}>
              {topic.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
