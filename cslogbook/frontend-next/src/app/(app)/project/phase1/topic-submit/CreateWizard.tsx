"use client";

import { StepBasic } from "./StepBasic";
import { StepClassification } from "./StepClassification";
import { StepMembers } from "./StepMembers";
import { StepDetails } from "./StepDetails";
import { StepReview } from "./StepReview";
import styles from "./topicSubmit.module.css";

// ฟอร์มรวมทุก section ในหน้าเดียว (ไม่ใช้ stepper แล้ว — ใช้ใน Modal)
export function CreateWizard() {
  return (
    <div className={styles.allInOneForm}>
      <section className={styles.formSection}>
        <h3 className={styles.sectionTitle}>ข้อมูลพื้นฐาน</h3>
        <StepBasic />
      </section>

      <section className={styles.formSection}>
        <h3 className={styles.sectionTitle}>หมวดโครงงาน</h3>
        <StepClassification />
      </section>

      <section className={styles.formSection}>
        <h3 className={styles.sectionTitle}>สมาชิก</h3>
        <StepMembers />
      </section>

      <section className={styles.formSection}>
        <h3 className={styles.sectionTitle}>รายละเอียดโครงงาน</h3>
        <StepDetails />
      </section>

      <section className={styles.formSection}>
        <h3 className={styles.sectionTitle}>ตรวจสอบ &amp; บันทึก</h3>
        <StepReview />
      </section>
    </div>
  );
}
