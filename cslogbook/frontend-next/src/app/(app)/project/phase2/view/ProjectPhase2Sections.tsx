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
        <section className={styles.notice}>กำลังตรวจสอบสิทธิ์และข้อมูล Phase 2...</section>
      ) : null}

      {phase2GateReasons.length > 0 ? (
        <section className={styles.noticeWarning}>
          <p className={styles.noticeTitle}>Phase 2 ยังไม่ปลดล็อก</p>
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

type StepGridProps = {
  steps: ProjectStep[];
  stepStatuses: Record<string, string>;
  phase2GateReasons: string[];
  systemTestReady: boolean;
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

        return (
          <article key={step.key} className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <div>
                <p className={styles.stepTitle}>{step.title}</p>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
              <span className={styles.stepBadge}>{stepStatuses[step.key] ?? "รออัปเดต"}</span>
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
};

export function MeetingLogbookSection({
  meetingRequirement,
  meetingBreakdown,
  lastApprovedLogAt,
  formatDate,
}: MeetingLogbookSectionProps) {
  const { required, totalApproved, satisfied } = meetingRequirement;
  const showRequired = required > 0;

  return (
    <section className={styles.meetingSection}>
      <header className={styles.meetingHeader}>
        <p className={styles.meetingTitle}>บันทึกการพบอาจารย์ (Phase 2)</p>
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
    </section>
  );
}
