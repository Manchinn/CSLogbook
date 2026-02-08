"use client";

import { useState } from "react";
import { StepBasic } from "./StepBasic";
import { StepClassification } from "./StepClassification";
import { StepMembers } from "./StepMembers";
import { StepDetails } from "./StepDetails";
import { StepReview } from "./StepReview";
import styles from "./topicSubmit.module.css";

const steps = [
  { key: "basic", title: "ข้อมูลพื้นฐาน", node: <StepBasic /> },
  { key: "classification", title: "หมวด", node: <StepClassification /> },
  { key: "members", title: "สมาชิก", node: <StepMembers /> },
  { key: "details", title: "รายละเอียด", node: <StepDetails /> },
  { key: "review", title: "ตรวจสอบ", node: <StepReview /> },
];

export function CreateWizard() {
  const [current, setCurrent] = useState(0);

  const goNext = () => setCurrent((value) => Math.min(value + 1, steps.length - 1));
  const goPrev = () => setCurrent((value) => Math.max(value - 1, 0));

  return (
    <div className={styles.panel}>
      <div className={styles.steps}>
        {steps.map((step, index) => (
          <span
            key={step.key}
            className={`${styles.stepBadge} ${index === current ? styles.stepBadgeActive : ""}`}
          >
            {step.title}
          </span>
        ))}
      </div>
      <div className={styles.notice}>{steps[current].title}</div>
      {steps[current].node}
      <div className={styles.actions}>
        {current > 0 ? (
          <button type="button" className={styles.secondaryButton} onClick={goPrev}>
            ย้อนกลับ
          </button>
        ) : null}
        {current < steps.length - 1 ? (
          <button type="button" className={styles.primaryButton} onClick={goNext}>
            ถัดไป
          </button>
        ) : null}
      </div>
    </div>
  );
}
