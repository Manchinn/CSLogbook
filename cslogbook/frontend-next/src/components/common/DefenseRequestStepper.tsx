"use client";

import styles from "./DefenseRequestStepper.module.css";

type StepState = "pending" | "active" | "done" | "error";

interface Step {
  label: string;
  sublabel?: string;
}

const STEPS: Step[] = [
  { label: "ยื่นคำขอ" },
  { label: "อาจารย์อนุมัติ" },
  { label: "เจ้าหน้าที่ตรวจสอบ" },
  { label: "กำหนดการสอบ" },
];

/** แปลง status ของคำขอสอบ (คพ.02 / คพ.03) เป็น step states */
function computeStepStates(status: string): StepState[] {
  switch (status) {
    case "advisor_in_review":
      return ["done", "active", "pending", "pending"];
    case "advisor_approved":
      return ["done", "done", "active", "pending"];
    case "staff_verified":
      return ["done", "done", "done", "active"];
    case "scheduled":
      return ["done", "done", "done", "active"];
    case "completed":
      return ["done", "done", "done", "done"];
    case "cancelled":
      return ["done", "error", "pending", "pending"];
    default:
      // ยังไม่ยื่นคำขอ
      return ["pending", "pending", "pending", "pending"];
  }
}

interface DefenseRequestStepperProps {
  status: string;
}

export function DefenseRequestStepper({ status }: DefenseRequestStepperProps) {
  const states = computeStepStates(status);

  return (
    <nav className={styles.stepper} aria-label="ขั้นตอนการยื่นคำขอสอบ">
      {STEPS.map((step, index) => {
        const stepState = states[index];
        return (
          <div
            key={step.label}
            className={`${styles.step} ${styles[`step_${stepState}`]}`}
          >
            {/* เส้นเชื่อม */}
            {index > 0 ? (
              <div
                className={`${styles.connector} ${
                  states[index - 1] === "done" ? styles.connectorDone : ""
                }`}
              />
            ) : null}

            {/* วงกลม */}
            <div className={styles.circle}>
              {stepState === "done" ? (
                <svg viewBox="0 0 12 12" className={styles.checkIcon} aria-hidden="true">
                  <polyline points="1.5,6 4.5,9 10.5,3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : stepState === "error" ? (
                <svg viewBox="0 0 12 12" className={styles.crossIcon} aria-hidden="true">
                  <line x1="2" y1="2" x2="10" y2="10" strokeLinecap="round" />
                  <line x1="10" y1="2" x2="2" y2="10" strokeLinecap="round" />
                </svg>
              ) : (
                <span className={styles.stepNumber}>{index + 1}</span>
              )}
            </div>

            {/* ข้อความ */}
            <p className={styles.label}>{step.label}</p>
          </div>
        );
      })}
    </nav>
  );
}
