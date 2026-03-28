import type { ReactNode } from "react";
import type { StudentDeadlineDetail } from "@/lib/services/studentService";
import type { ProjectStep } from "./projectPhase2Steps";
import styles from "./phase2.module.css";

type SummaryCard = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
};

type StepDeadlineStatus = {
  isOverdue: boolean;
  isLocked: boolean;
  allowLate: boolean;
  reason: string | null;
  deadline: StudentDeadlineDetail | null;
};

type SummaryCardsProps = {
  cards: SummaryCard[];
};

export function SummaryCards({ cards }: SummaryCardsProps) {
  return (
    <section className={styles.grid}>
      {cards.map((card) => (
        <article key={card.label} className={styles.card}>
          <p className={styles.cardLabel}>{card.label}</p>
          <p className={styles.cardValue}>{card.value}</p>
          {card.hint ? <p className={styles.cardHint}>{card.hint}</p> : null}
        </article>
      ))}
    </section>
  );
}

type Phase2GateNoticeProps = {
  eligibilityLoading: boolean;
  phase2GateReasons: string[];
};

export function Phase2GateNotice({ eligibilityLoading, phase2GateReasons }: Phase2GateNoticeProps) {
  return (
    <>
      {eligibilityLoading ? (
        <section className={styles.notice}>กำลังตรวจสอบสิทธิ์ปริญญานิพนธ์...</section>
      ) : null}

      {phase2GateReasons.length > 0 ? (
        <section className={styles.noticeWarning}>
          <p className={styles.noticeTitle}>ปริญญานิพนธ์ยังไม่ปลดล็อก</p>
          <ul className={styles.noticeList}>
            {phase2GateReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

type ThesisFailNoticeProps = {
  thesisExamResult?: string | null;
};

export function ThesisFailNotice({ thesisExamResult }: ThesisFailNoticeProps) {
  if (thesisExamResult !== "FAIL") return null;

  return (
    <section className={styles.noticeDanger}>
      <p className={styles.noticeTitle}>ผลการสอบปริญญานิพนธ์: ไม่ผ่าน</p>
      <p className={styles.noticeBody}>กรุณาตรวจสอบประเภทเกรดที่ได้รับจากอาจารย์ที่ปรึกษา และดำเนินการตามขั้นตอนด้านล่าง</p>
      <div className={styles.noticeGuidance}>
        <p className={styles.noticeGuidanceTitle}>ขั้นตอนถัดไป:</p>
        <ul className={styles.noticeList}>
          <li>เกรด I (Incomplete) — แก้ไขเล่มตามข้อเสนอแนะและส่งก่อนวันกำหนด ไม่ต้องสอบใหม่</li>
          <li>เกรด IP (In Progress) — ต้องสอบใหม่ในภาคเรียนถัดไป (ไม่ต้องลงทะเบียนซ้ำ)</li>
          <li>ติดต่ออาจารย์ที่ปรึกษาเพื่อยืนยันว่าได้รับเกรดประเภทใด</li>
        </ul>
      </div>
    </section>
  );
}

type StepStatus = {
  label: string;
  tone: "default" | "info" | "success" | "warning" | "danger";
};

type StepGridProps = {
  steps: ProjectStep[];
  stepStatuses: Record<string, StepStatus | undefined>;
  phase2GateReasons: string[];
  systemTestReady: boolean;
  canSubmitThesisDefense?: boolean;
  projectDeadlines: StudentDeadlineDetail[];
  getStepDeadlineStatus: (step: ProjectStep, deadlines: StudentDeadlineDetail[]) => StepDeadlineStatus;
  onOpenStep: (target: string) => void;
  formatDate: (value?: string | null) => string;
};

export function StepGrid({
  steps,
  stepStatuses,
  phase2GateReasons,
  systemTestReady,
  canSubmitThesisDefense,
  projectDeadlines,
  getStepDeadlineStatus,
  onOpenStep,
  formatDate,
}: StepGridProps) {
  return (
    <section className={styles.stepGrid}>
      {steps.map((step) => {
        const deadlineStatus = getStepDeadlineStatus(step, projectDeadlines);
        const lockReasons: string[] = [];
        if (phase2GateReasons.length > 0) lockReasons.push(...phase2GateReasons);
        if (step.key === "thesis-defense" && !systemTestReady) {
          lockReasons.push("ต้องผ่านการทดสอบระบบครบ 30 วันก่อนยื่น คพ.03");
        }
        if (step.key === "thesis-defense" && canSubmitThesisDefense === false) {
          lockReasons.push("ยังไม่พร้อมยื่นสอบ คพ.03 ในขั้นตอนปัจจุบัน");
        }

        const status = stepStatuses[step.key];
        const badgeClass =
          !status || status.tone === "default" ? styles.stepBadge
          : status.tone === "success" ? styles.stepBadgeSuccess
          : status.tone === "danger" ? styles.stepBadgeDanger
          : status.tone === "warning" ? styles.stepBadgeWarning
          : styles.stepBadgeInfo;

        return (
          <article key={step.key} className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <div>
                <p className={styles.stepTitle}>{step.title}</p>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
              <span className={badgeClass}>{status?.label ?? "รออัปเดต"}</span>
            </div>

            {deadlineStatus.deadline ? (
              <div className={styles.stepMeta}>
                <span>กำหนดส่ง: {formatDate(deadlineStatus.deadline.deadlineAt)}</span>
                {deadlineStatus.reason ? <span className={styles.stepAlert}>{deadlineStatus.reason}</span> : null}
              </div>
            ) : (
              <div className={styles.stepMeta}>
                <span>กำหนดส่ง: ยังไม่มีข้อมูล</span>
              </div>
            )}

            {lockReasons.length > 0 ? (
              <ul className={styles.stepList}>
                {lockReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}

            <button
              type="button"
              className={styles.primaryButton}
              disabled={lockReasons.length > 0 || deadlineStatus.isLocked}
              onClick={() => onOpenStep(step.target)}
            >
              ไปยังขั้นตอนนี้
            </button>
          </article>
        );
      })}
    </section>
  );
}

type MeetingBreakdownEntry = {
  studentId: number;
  name: string;
  studentCode: string;
  role: string;
  approvedLogs: number;
  attendedMeetings: number;
};

type MeetingLogbookSectionProps = {
  meetingRequirement: { required: number; totalApproved: number; satisfied: boolean };
  meetingBreakdown: MeetingBreakdownEntry[];
  lastApprovedLogAt: string | null | undefined;
  formatDate: (value?: string | null) => string;
  onNavigateToMeetings?: () => void;
};

export function MeetingLogbookSection({
  meetingRequirement,
  meetingBreakdown,
  lastApprovedLogAt,
  formatDate,
  onNavigateToMeetings,
}: MeetingLogbookSectionProps) {
  const { required, totalApproved, satisfied } = meetingRequirement;
  const showRequired = required > 0;

  return (
    <section className={styles.meetingSection}>
      <header className={styles.meetingHeader}>
        <p className={styles.meetingTitle}>บันทึกการพบอาจารย์ (ปริญญานิพนธ์)</p>
        {showRequired ? (
          <span className={satisfied ? styles.badgeSuccess : styles.badgeWarning}>
            {totalApproved}/{required} ครั้ง
          </span>
        ) : null}
      </header>

      <div className={satisfied ? styles.noticeSuccess : styles.noticeWarning}>
        <p className={styles.noticeLine}>
          {satisfied ? "บันทึกการพบครบตามเกณฑ์แล้ว" : "ยังไม่ครบเกณฑ์บันทึกการพบ"}
        </p>
        {showRequired ? (
          <p className={styles.noticeSub}>
            ได้รับอนุมัติ {totalApproved}/{required} ครั้ง
            {lastApprovedLogAt ? ` · ครั้งล่าสุดเมื่อ ${formatDate(lastApprovedLogAt)}` : ""}
          </p>
        ) : (
          <p className={styles.noticeSub}>ยังไม่มีข้อมูลเกณฑ์การพบ</p>
        )}
      </div>

      {meetingBreakdown.length > 0 ? (
        <ul className={styles.meetingList}>
          {meetingBreakdown.map((entry) => (
            <li key={entry.studentId} className={styles.meetingItem}>
              <div>
                <span className={styles.meetingName}>{entry.name}</span>
                {entry.role === "leader" ? <span className={styles.leaderBadge}>หัวหน้า</span> : null}
                <span className={styles.meetingCode}>{entry.studentCode}</span>
              </div>
              <span className={styles.meetingCount}>อนุมัติ {entry.approvedLogs} ครั้ง</span>
            </li>
          ))}
        </ul>
      ) : null}

      {onNavigateToMeetings ? (
        <button type="button" className={styles.secondaryButton} onClick={onNavigateToMeetings}>
          ไปยังบันทึกการพบ
        </button>
      ) : null}
    </section>
  );
}
