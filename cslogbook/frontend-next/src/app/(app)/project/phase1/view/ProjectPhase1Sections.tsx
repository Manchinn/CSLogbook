import type { ReactNode } from "react";
import type { StudentDeadlineDetail } from "@/lib/services/studentService";
import type { ProjectStep } from "./projectPhase1Steps";
import styles from "./phase1.module.css";

type SummaryCard = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
};

type EligibilitySnapshot = {
  currentCredits: number;
  currentMajorCredits: number;
  requiredCredits: number | null;
  requiredMajorCredits: number | null;
  canRegister: boolean | null;
};

type StepStatus = {
  label: string;
  tone: "default" | "info" | "success" | "warning" | "danger";
};

type DeadlineStatus = {
  isOverdue: boolean;
  isLocked: boolean;
  allowLate: boolean;
  reason: string | null;
  deadline: StudentDeadlineDetail | null;
};

type ProjectSummary = {
  projectNameTh?: string | null;
  projectNameEn?: string | null;
  projectCode?: string | null;
  academicYear?: string | number | null;
  semester?: string | number | null;
  advisorId?: string | number | null;
  advisorName?: string | null;
};

type WorkflowSummary = {
  lastActivityAt?: string | null;
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

type EligibilityNoticesProps = {
  eligibilityLoading: boolean;
  canAccessProject: boolean;
  projectAccessReason: string | null;
  eligibilitySnapshot: EligibilitySnapshot | null;
};

export function EligibilityNotices({
  eligibilityLoading,
  canAccessProject,
  projectAccessReason,
  eligibilitySnapshot,
}: EligibilityNoticesProps) {
  return (
    <>
      {eligibilityLoading ? (
        <section className={styles.notice}>
          <p className={styles.noticeTitle}>กำลังตรวจสอบสิทธิ์โครงงานของคุณ</p>
          <p className={styles.noticeBody}>ระบบกำลังตรวจสอบสิทธิ์และข้อกำหนดล่าสุด</p>
        </section>
      ) : null}

      {!eligibilityLoading && !canAccessProject ? (
        <section className={styles.notice}>
          <p className={styles.noticeTitle}>ยังไม่สามารถใช้งานโครงงานพิเศษ</p>
          <p className={styles.noticeBody}>ตรวจสอบสถานะล่าสุดและเตรียมข้อมูลให้พร้อม</p>
          {projectAccessReason ? <p className={styles.noticeReason}>{projectAccessReason}</p> : null}
        </section>
      ) : null}

      {eligibilitySnapshot ? (
        <section className={styles.notice}>
          <p className={styles.noticeTitle}>สรุปคุณสมบัติ</p>
          <dl className={styles.metaGrid}>
            <div>
              <dt>หน่วยกิตรวม</dt>
              <dd>
                {eligibilitySnapshot.currentCredits}
                {eligibilitySnapshot.requiredCredits ? ` / ${eligibilitySnapshot.requiredCredits}` : ""}
              </dd>
            </div>
            <div>
              <dt>หน่วยกิตภาควิชา</dt>
              <dd>
                {eligibilitySnapshot.currentMajorCredits}
                {eligibilitySnapshot.requiredMajorCredits ? ` / ${eligibilitySnapshot.requiredMajorCredits}` : ""}
              </dd>
            </div>
            <div>
              <dt>สิทธิ์ลงทะเบียน</dt>
              <dd>{eligibilitySnapshot.canRegister ? "พร้อม" : "ยังไม่พร้อม"}</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </>
  );
}

type AcknowledgeNoticeProps = {
  showAck: boolean;
  ackLoading: boolean;
  examFailReason?: string | null;
  onOpen: () => void;
};

export function AcknowledgeNotice({ showAck, ackLoading, examFailReason, onOpen }: AcknowledgeNoticeProps) {
  if (!showAck) return null;

  return (
    <section className={styles.noticeDanger}>
      <p className={styles.noticeTitle}>ผลสอบหัวข้อ: ไม่ผ่าน</p>
      <p className={styles.noticeBody}>คุณต้องรับทราบผลเพื่อให้ระบบเก็บหัวข้อนี้</p>
      {examFailReason ? <p className={styles.noticeReason}>เหตุผล: {examFailReason}</p> : null}
      <div className={styles.noticeActions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onOpen}
          disabled={ackLoading}
        >
          {ackLoading ? "กำลังบันทึก..." : "รับทราบผล"}
        </button>
      </div>
    </section>
  );
}

type ProjectLockNoticesProps = {
  projectExists: boolean;
  postTopicLockReasons: string[];
  isProjectCancelled: boolean;
  onBackToDashboard: () => void;
};

export function ProjectLockNotices({
  projectExists,
  postTopicLockReasons,
  isProjectCancelled,
  onBackToDashboard,
}: ProjectLockNoticesProps) {
  return (
    <>
      {projectExists && postTopicLockReasons.length > 0 ? (
        <section className={styles.noticeWarning}>
          <p className={styles.noticeTitle}>ขั้นตอนหลังสอบหัวข้อยังไม่พร้อมใช้งาน</p>
          <ul className={styles.noticeList}>
            {postTopicLockReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {isProjectCancelled ? (
        <section className={styles.noticeDanger}>
          <p className={styles.noticeTitle}>โครงงานนี้ถูกยกเลิกแล้ว</p>
          <p className={styles.noticeBody}>กรุณารอรอบการยื่นหัวข้อถัดไปก่อนสร้างหัวข้อใหม่</p>
          <div className={styles.noticeActions}>
            <button type="button" className={styles.primaryButton} onClick={onBackToDashboard}>
              กลับไปหน้าแรก
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}

type PhaseStepsGridProps = {
  showPhaseContent: boolean;
  activePhaseTab: "all" | "phase1" | "phase2";
  onTabChange: (value: "all" | "phase1" | "phase2") => void;
  visibleSteps: ProjectStep[];
  stepStatusMap: Record<string, StepStatus | undefined>;
  getStepDeadlineStatus: (step: ProjectStep) => DeadlineStatus;
  buildLockReasons: (step: ProjectStep, deadlineStatus: DeadlineStatus) => string[];
  onOpenStep: (step: ProjectStep, lockReasons: string[]) => void;
  showSectionDividers?: boolean;
};

// TODO: TEMP FLAG — ตั้งค่าเป็น true เพื่อปลดล็อก card ทั้งหมดชั่วคราวสำหรับทดสอบ UI ภายใน
// เปลี่ยนกลับเป็น false เมื่อทดสอบเสร็จ
const FORCE_ENABLE_CARD = false;

function StepCard({
  step,
  stepStatusMap,
  getStepDeadlineStatus,
  buildLockReasons,
  onOpenStep,
}: {
  step: ProjectStep;
  stepStatusMap: Record<string, StepStatus | undefined>;
  getStepDeadlineStatus: (step: ProjectStep) => DeadlineStatus;
  buildLockReasons: (step: ProjectStep, deadlineStatus: DeadlineStatus) => string[];
  onOpenStep: (step: ProjectStep, lockReasons: string[]) => void;
}) {
  const deadlineStatus = getStepDeadlineStatus(step);
  const lockReasons = buildLockReasons(step, deadlineStatus);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const isDisabled = (!step.implemented || lockReasons.length > 0) && !FORCE_ENABLE_CARD;
  const status = stepStatusMap[step.key];

  return (
    <article key={step.key} className={`${styles.stepCard} ${isDisabled ? styles.stepCardDisabled : ""}`}>
      <button
        type="button"
        className={styles.stepButton}
        onClick={() => onOpenStep(step, lockReasons)}
        disabled={isDisabled}
      >
        <div className={styles.stepHeader}>
          <span className={styles.stepIcon}>{step.icon}</span>
          <div>
            <p className={styles.stepTitle}>{step.title}</p>
            <p className={styles.stepDesc}>{step.desc}</p>
          </div>
        </div>
        <div className={styles.stepTags}>
          {step.phaseLabel ? (
            <span className={`${styles.tag} ${step.phase === "phase2" ? styles.tagPhase2 : styles.tagPhase1}`}>
              {step.phaseLabel}
            </span>
          ) : null}
          {!step.implemented ? (
            <span className={`${styles.tag} ${styles.tagMuted}`}>กำลังพัฒนา</span>
          ) : lockReasons.length > 0 ? (
            <span className={`${styles.tag} ${styles.tagWarning}`}>รอปลดล็อก</span>
          ) : status ? (
            <span
              className={`${styles.tag} ${
                status.tone === "success"
                  ? styles.tagSuccess
                  : status.tone === "danger"
                    ? styles.tagDanger
                    : status.tone === "warning"
                      ? styles.tagWarning
                      : status.tone === "info"
                        ? styles.tagInfo
                        : styles.tagMuted
              }`}
            >
              {status.label}
            </span>
          ) : null}
          {deadlineStatus.isOverdue ? (
            <span className={`${styles.tag} ${deadlineStatus.allowLate ? styles.tagWarning : styles.tagDanger}`}>
              {deadlineStatus.allowLate ? "เกินกำหนด (ส่งได้)" : "เกินกำหนด"}
            </span>
          ) : null}
          {step.comingSoon && !step.implemented ? (
            <span className={`${styles.tag} ${styles.tagMuted}`}>เร็วๆ นี้</span>
          ) : null}
        </div>
        {lockReasons.length > 0 ? <p className={styles.stepHint}>{lockReasons.join(" • ")}</p> : null}
      </button>
    </article>
  );
}

export function PhaseStepsGrid({
  showPhaseContent,
  activePhaseTab,
  onTabChange,
  visibleSteps,
  stepStatusMap,
  getStepDeadlineStatus,
  buildLockReasons,
  onOpenStep,
  showSectionDividers,
}: PhaseStepsGridProps) {
  if (!showPhaseContent) return null;

  const stepCardProps = { stepStatusMap, getStepDeadlineStatus, buildLockReasons, onOpenStep };

  const renderSteps = () => {
    if (showSectionDividers && activePhaseTab === "all") {
      const phase1 = visibleSteps.filter((s) => s.phase === "phase1");
      const phase2 = visibleSteps.filter((s) => s.phase === "phase2");
      return (
        <>
          {phase1.length > 0 && (
            <div className={styles.sectionDividerRow}>
              <span className={styles.sectionDividerLine} />
              <span className={styles.sectionDividerLabel}>โครงงานพิเศษ 1</span>
              <span className={styles.sectionDividerLine} />
            </div>
          )}
          {phase1.map((step) => <StepCard key={step.key} step={step} {...stepCardProps} />)}
          {phase2.length > 0 && (
            <>
              <div className={styles.sectionDividerArrow}>↓</div>
              <div className={styles.sectionDividerRow}>
                <span className={styles.sectionDividerLine} />
                <span className={styles.sectionDividerLabel}>ปริญญานิพนธ์</span>
                <span className={styles.sectionDividerLine} />
              </div>
            </>
          )}
          {phase2.map((step) => <StepCard key={step.key} step={step} {...stepCardProps} />)}
        </>
      );
    }
    return visibleSteps.map((step) => <StepCard key={step.key} step={step} {...stepCardProps} />);
  };

  return (
    <section className={styles.stepGrid}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tabButton} ${activePhaseTab === "all" ? styles.tabButtonActive : ""}`}
          onClick={() => onTabChange("all")}
        >
          ทั้งหมด
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activePhaseTab === "phase1" ? styles.tabButtonActive : ""}`}
          onClick={() => onTabChange("phase1")}
        >
          โครงงานพิเศษ 1
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activePhaseTab === "phase2" ? styles.tabButtonActive : ""}`}
          onClick={() => onTabChange("phase2")}
        >
          ปริญญานิพนธ์
        </button>
      </div>

      {renderSteps()}
    </section>
  );
}

type ProjectOverviewPanelsProps = {
  showPhaseContent: boolean;
  project: ProjectSummary | null;
  workflow: WorkflowSummary | null;
  projectError: boolean;
  projectLoading: boolean;
  projectDetailLoading: boolean;
  upcomingDeadlines: StudentDeadlineDetail[];
  formatDate: (value?: string | null) => string;
};

export function ProjectOverviewPanels({
  showPhaseContent,
  project,
  workflow,
  projectError,
  projectLoading,
  projectDetailLoading,
  upcomingDeadlines,
  formatDate,
}: ProjectOverviewPanelsProps) {
  if (!showPhaseContent) return null;

  return (
    <section className={styles.split}>
      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelKicker}>รายละเอียดโครงงาน</p>
            <h2 className={styles.panelTitle}>{project?.projectNameTh || project?.projectNameEn || "ยังไม่ตั้งชื่อ"}</h2>
          </div>
        </div>

        {projectError ? <p className={styles.error}>โหลดข้อมูลโครงงานไม่สำเร็จ</p> : null}
        {projectLoading || projectDetailLoading ? <div className={styles.skeleton} /> : null}

        {project ? (
          <dl className={styles.metaGrid}>
            <div>
              <dt>ชื่อ (EN)</dt>
              <dd>{project.projectNameEn || "-"}</dd>
            </div>
            <div>
              <dt>ภาคการศึกษา</dt>
              <dd>
                {project.academicYear ?? "-"}/{project.semester ?? "-"}
              </dd>
            </div>
            <div>
              <dt>อาจารย์ที่ปรึกษา</dt>
              <dd>{project.advisorName || "ยังไม่ระบุ"}</dd>
            </div>
            <div>
              <dt>อัปเดตล่าสุด</dt>
              <dd>{workflow?.lastActivityAt ? formatDate(workflow.lastActivityAt) : "-"}</dd>
            </div>
          </dl>
        ) : (
          !projectLoading && <p className={styles.cardHint}>ยังไม่มีโครงงานในระบบ</p>
        )}
      </article>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelKicker}>เดดไลน์</p>
            <h2 className={styles.panelTitle}>กำหนดส่งที่เกี่ยวข้อง</h2>
          </div>
        </div>
        {upcomingDeadlines.length === 0 ? (
          <p className={styles.cardHint}>ยังไม่พบกำหนดส่งที่เกี่ยวข้องใน 30 วัน</p>
        ) : (
          <ul className={styles.deadlineList}>
            {upcomingDeadlines.map((deadline) => (
              <li key={deadline.id} className={styles.deadlineItem}>
                <div>
                  <p className={styles.deadlineName}>{deadline.name}</p>
                  <p className={styles.deadlineMeta}>
                    {deadline.relatedTo ?? "-"} • เหลือ {deadline.daysLeft ?? "-"} วัน
                  </p>
                </div>
                <span className={styles.deadlineDate}>{formatDate(deadline.deadlineAt ?? deadline.deadlineDate)}</span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}

type AcknowledgeModalProps = {
  ackModalOpen: boolean;
  ackLoading: boolean;
  examFailReason?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function AcknowledgeModal({
  ackModalOpen,
  ackLoading,
  examFailReason,
  onClose,
  onConfirm,
}: AcknowledgeModalProps) {
  if (!ackModalOpen) return null;

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="ack-title">
        <div className={styles.modalHeader}>
          <h2 id="ack-title" className={styles.modalTitle}>ยืนยันการรับทราบผลสอบไม่ผ่าน</h2>
        </div>
        <div className={styles.modalBody}>
          <p>เมื่อรับทราบผล หัวข้อจะถูกเก็บถาวร และไม่สามารถย้อนกลับได้</p>
          {examFailReason ? <p className={styles.modalHint}>เหตุผล: {examFailReason}</p> : null}
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={ackLoading}>
            ยกเลิก
          </button>
          <button type="button" className={styles.dangerButton} onClick={onConfirm} disabled={ackLoading}>
            {ackLoading ? "กำลังบันทึก..." : "ยืนยันรับทราบ"}
          </button>
        </div>
      </div>
    </div>
  );
}
