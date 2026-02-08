"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";
import { useStudentProjectDetail } from "@/hooks/useStudentProjectDetail";
import { useStudentProjectStatus } from "@/hooks/useStudentProjectStatus";
import { useStudentDeadlineCalendar } from "@/hooks/useStudentDeadlineCalendar";
import type { StudentDeadlineDetail } from "@/lib/services/studentService";
import styles from "./phase2.module.css";

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });
const shortDateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "short" });
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const DEADLINE_KEYWORD_FILTER = /วันสุดท้าย|ของ|การ|เอกสาร|คำ|ขอ|โครงงานพิเศษ|คพ\.\s*\(|\(|\)/g;

type StepDeadlineStatus = {
  isOverdue: boolean;
  isLocked: boolean;
  allowLate: boolean;
  reason: string | null;
  deadline: StudentDeadlineDetail | null;
};

type ProjectStep = {
  key: string;
  title: string;
  desc: string;
  target: string;
  deadlineName?: string | null;
  relatedTo?: string | null;
};

const steps: ProjectStep[] = [
  {
    key: "system-test",
    title: "ขอทดสอบระบบ 30 วัน",
    desc: "ส่งคำขอให้อาจารย์และเจ้าหน้าที่อนุมัติ พร้อมหลักฐาน",
    target: "/project/phase2/system-test",
    deadlineName: "ยื่นคำขอทดสอบระบบ",
    relatedTo: "project2",
  },
  {
    key: "thesis-defense",
    title: "ยื่นคำขอสอบ คพ.03",
    desc: "ส่งคำขอสอบโครงงานพิเศษ 2 พร้อมข้อมูลครบถ้วน",
    target: "/project/phase2/thesis-defense",
    deadlineName: "ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)",
    relatedTo: "project2",
  },
];

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return dateFormatter.format(d);
}

function formatShortDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return shortDateFormatter.format(d);
}

function parseDateValue(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function extractKeywords(value: string) {
  return value
    .replace(DEADLINE_KEYWORD_FILTER, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1)
    .map((word) => word.toLowerCase());
}

function getDeadlineBaseTime(deadline: StudentDeadlineDetail) {
  if (deadline.deadlineAt) return parseDateValue(deadline.deadlineAt);
  if (deadline.deadlineDate) {
    const time = deadline.deadlineTime ?? "00:00:00";
    return parseDateValue(`${deadline.deadlineDate}T${time}`);
  }
  return null;
}

function getEffectiveDeadline(deadline: StudentDeadlineDetail, base: Date | null) {
  const effective = parseDateValue(deadline.effectiveDeadlineAt ?? null);
  if (effective) return effective;
  if (!base) return null;
  const graceMinutes = deadline.gracePeriodMinutes ?? 0;
  if (deadline.allowLate && graceMinutes > 0) {
    return new Date(base.getTime() + graceMinutes * 60 * 1000);
  }
  return base;
}

function isDeadlineMatch(step: ProjectStep, deadline: StudentDeadlineDetail) {
  if (!step.deadlineName || !step.relatedTo) return false;
  const deadlineName = String(deadline.name || "").trim();
  const stepDeadlineName = String(step.deadlineName || "").trim();
  const relatedToMatch = String(deadline.relatedTo || "").toLowerCase() === step.relatedTo.toLowerCase();

  if (!relatedToMatch) return false;
  if (deadlineName === stepDeadlineName) return true;

  const deadlineKeywords = extractKeywords(deadlineName);
  const stepKeywords = extractKeywords(stepDeadlineName);
  const commonKeywords = deadlineKeywords.filter((keyword) => stepKeywords.includes(keyword));
  if (commonKeywords.length >= 2) return true;

  return deadlineName.includes(stepDeadlineName) || stepDeadlineName.includes(deadlineName);
}

function getStepDeadlineStatus(step: ProjectStep, deadlines: StudentDeadlineDetail[]): StepDeadlineStatus {
  if (!step.deadlineName || !step.relatedTo) {
    return { isOverdue: false, isLocked: false, allowLate: false, reason: null, deadline: null };
  }

  const matchingDeadline = deadlines.find((deadline) => isDeadlineMatch(step, deadline)) ?? null;
  if (!matchingDeadline) {
    return { isOverdue: false, isLocked: false, allowLate: false, reason: null, deadline: null };
  }

  const now = new Date();
  const deadlineTime = getDeadlineBaseTime(matchingDeadline);
  if (!deadlineTime) {
    return { isOverdue: false, isLocked: false, allowLate: false, reason: null, deadline: matchingDeadline };
  }

  const effectiveDeadline = getEffectiveDeadline(matchingDeadline, deadlineTime) ?? deadlineTime;
  const allowLate = Boolean(matchingDeadline.allowLate);
  const lockAfterDeadline = Boolean(matchingDeadline.lockAfterDeadline);
  const isAfterDeadline = now.getTime() > deadlineTime.getTime();
  const isAfterEffectiveDeadline = now.getTime() > effectiveDeadline.getTime();

  if (!isAfterDeadline) {
    return { isOverdue: false, isLocked: false, allowLate, reason: null, deadline: matchingDeadline };
  }

  const diffDays = Math.max(0, Math.floor((now.getTime() - deadlineTime.getTime()) / ONE_DAY_MS));

  if (isAfterEffectiveDeadline && lockAfterDeadline) {
    return {
      isOverdue: true,
      allowLate: false,
      isLocked: true,
      reason: `เกินกำหนด ${diffDays} วัน (ปิดรับแล้ว)`,
      deadline: matchingDeadline,
    };
  }

  if (isAfterDeadline && !isAfterEffectiveDeadline && allowLate) {
    const graceMinutesLeft = Math.max(0, Math.floor((effectiveDeadline.getTime() - now.getTime()) / 60000));
    return {
      isOverdue: true,
      allowLate: true,
      isLocked: false,
      reason: `เกินกำหนด ${diffDays} วัน (ยังส่งได้อีก ${Math.ceil(graceMinutesLeft / 60)} ชม.)`,
      deadline: matchingDeadline,
    };
  }

  if (isAfterDeadline && !allowLate) {
    return {
      isOverdue: true,
      allowLate: false,
      isLocked: true,
      reason: `เกินกำหนด ${diffDays} วัน (ปิดรับแล้ว)`,
      deadline: matchingDeadline,
    };
  }

  if (isAfterEffectiveDeadline && !lockAfterDeadline && allowLate) {
    return {
      isOverdue: true,
      allowLate: true,
      isLocked: false,
      reason: `เกินกำหนด ${diffDays} วัน (ยังส่งได้แต่จะถูกบันทึกว่าส่งช้า)`,
      deadline: matchingDeadline,
    };
  }

  return { isOverdue: false, isLocked: false, allowLate, reason: null, deadline: matchingDeadline };
}

export default function ProjectPhase2Content() {
  const router = useRouter();
  const { token, user } = useAuth();
  const hydrated = useHydrated();
  const studentId = user?.studentId ?? user?.id;
  const queriesEnabled = hydrated && Boolean(token) && Boolean(studentId);

  const { data: eligibility, isLoading: eligibilityLoading } = useStudentEligibility(token, queriesEnabled);
  const { data: projectStatus } = useStudentProjectStatus(token, queriesEnabled);
  const { data: projectDetail } = useStudentProjectDetail(token, queriesEnabled);

  const { data: deadlines } = useStudentDeadlineCalendar(
    token,
    projectDetail?.academicYear ?? null,
    queriesEnabled
  );

  const projectDetailData = projectDetail ?? null;
  const projectSummary = projectStatus?.project ?? null;
  const project = projectDetailData ?? projectSummary ?? null;
  const workflow = projectStatus?.workflow ?? null;

  const projectDeadlines = useMemo(() => {
    if (!deadlines) return [];
    return deadlines.filter((deadline) => String(deadline.relatedTo || "").toLowerCase().startsWith("project"));
  }, [deadlines]);

  const academicSettings = eligibility?.academicSettings ?? null;
  const currentSemester =
    academicSettings?.currentSemester !== undefined && academicSettings?.currentSemester !== null
      ? Number(academicSettings.currentSemester)
      : null;

  const allowedPhase2Semesters = useMemo(() => {
    const rawSemesters = eligibility?.requirements?.project?.allowedSemesters;
    if (!rawSemesters) return null;

    const normalize = (value: unknown) => {
      if (value === null || value === undefined) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === "object") return Object.values(value as Record<string, unknown>).flat();
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed;
          if (typeof parsed === "object" && parsed !== null) {
            return Object.values(parsed as Record<string, unknown>).flat();
          }
        } catch {
          return [];
        }
      }
      return [];
    };

    return normalize(rawSemesters)
      .map((item) => Number(item))
      .filter((semester) => Number.isInteger(semester));
  }, [eligibility?.requirements?.project?.allowedSemesters]);

  const projectRegistrationStartDate = useMemo(() => {
    const registration = academicSettings?.projectRegistrationPeriod ?? null;
    if (!registration) return null;
    if (typeof registration === "string") {
      try {
        const parsed = JSON.parse(registration);
        return parsed?.startDate ?? null;
      } catch {
        return null;
      }
    }
    if (typeof registration === "object") {
      const value = registration as { startDate?: string | null };
      return value.startDate ?? null;
    }
    return null;
  }, [academicSettings?.projectRegistrationPeriod]);

  const phase2GateReasons = useMemo(() => {
    if (!project) return ["ยังไม่มีข้อมูลโครงงาน"];
    const reasons: string[] = [];
    if (project.examResult !== "passed") {
      reasons.push("ผลสอบหัวข้อยังไม่ผ่าน");
    }
    if (!project.status || !["in_progress", "completed"].includes(project.status)) {
      reasons.push("สถานะโครงงานยังไม่อยู่ในขั้น \"กำลังดำเนินการ\"");
    }

    if (allowedPhase2Semesters && allowedPhase2Semesters.length > 0 && typeof currentSemester === "number") {
      if (!allowedPhase2Semesters.includes(currentSemester)) {
        reasons.push(`ภาคเรียนที่ ${currentSemester} ยังไม่เปิดยื่นสอบโครงงานพิเศษ 2`);
      }
    }

    if (projectRegistrationStartDate) {
      const startDate = new Date(projectRegistrationStartDate);
      if (!Number.isNaN(startDate.getTime()) && new Date() < startDate) {
        const displayDate = formatShortDate(projectRegistrationStartDate);
        reasons.push(
          displayDate !== "-"
            ? `ภาคเรียนถัดไปจะเปิดให้ยื่นสอบโครงงานพิเศษ 2 ในวันที่ ${displayDate}`
            : "ภาคเรียนถัดไปยังไม่เปิดให้ยื่นสอบโครงงานพิเศษ 2"
        );
      }
    }

    return reasons;
  }, [project, allowedPhase2Semesters, currentSemester, projectRegistrationStartDate]);

  const systemTestSummary = projectDetailData?.systemTestRequest ?? null;
  const thesisDefenseRequest = useMemo(() => {
    if (!Array.isArray(projectDetailData?.defenseRequests)) return null;
    return (
      projectDetailData.defenseRequests.find(
        (request) => request.defenseType === "THESIS" && request.status !== "cancelled"
      ) ?? null
    );
  }, [projectDetailData?.defenseRequests]);

  const systemTestReady = useMemo(() => {
    if (!systemTestSummary) return false;
    if (systemTestSummary.status !== "staff_approved") return false;
    if (!systemTestSummary.evidenceSubmittedAt) return false;
    if (!systemTestSummary.testDueDate) return false;
    const due = new Date(systemTestSummary.testDueDate);
    if (Number.isNaN(due.getTime())) return false;
    return new Date() >= due;
  }, [systemTestSummary]);

  const systemTestStatusLabel = useMemo(() => {
    if (!systemTestSummary) return "ยังไม่ยื่นคำขอ";
    if (systemTestSummary.status === "staff_approved" && systemTestSummary.evidenceSubmittedAt) {
      return "อนุมัติครบและอัปโหลดหลักฐานครบแล้ว";
    }
    const mapping: Record<string, string> = {
      pending_advisor: "รออาจารย์อนุมัติ",
      advisor_rejected: "อาจารย์ส่งกลับ",
      pending_staff: "รอเจ้าหน้าที่ตรวจสอบ",
      staff_rejected: "เจ้าหน้าที่ส่งกลับ",
      staff_approved: "อนุมัติครบ (รอหลักฐาน)",
    };
    return mapping[systemTestSummary.status ?? ""] ?? "กำลังดำเนินการ";
  }, [systemTestSummary]);

  const thesisStatusLabel = useMemo(() => {
    if (!thesisDefenseRequest) return "ยังไม่ยื่นคำขอ";
    const mapping: Record<string, string> = {
      submitted: "ยื่นคำขอแล้ว",
      advisor_in_review: "รออาจารย์อนุมัติ",
      advisor_approved: "อาจารย์อนุมัติครบ",
      staff_verified: "เจ้าหน้าที่ตรวจสอบแล้ว",
      scheduled: "นัดสอบแล้ว",
      completed: "บันทึกผลสอบแล้ว",
      cancelled: "คำขอถูกยกเลิก",
      advisor_rejected: "อาจารย์ไม่อนุมัติ",
      staff_returned: "เจ้าหน้าที่ส่งกลับ",
    };
    return mapping[thesisDefenseRequest.status ?? ""] ?? "กำลังดำเนินการ";
  }, [thesisDefenseRequest]);

  const stepStatuses = useMemo(() => {
    const result: Record<string, string> = {};
    result["system-test"] = systemTestStatusLabel;
    result["thesis-defense"] = thesisStatusLabel;
    return result;
  }, [systemTestStatusLabel, thesisStatusLabel]);

  const cardSummary = [
    {
      label: "สถานะ Phase",
      value: workflow?.currentPhase ?? project?.status ?? "ไม่พบข้อมูล",
      hint: workflow?.isBlocked ? `ถูกบล็อก: ${workflow.blockReason || ""}` : "พร้อมดำเนินการ",
    },
    {
      label: "สถานะทดสอบระบบ",
      value: systemTestStatusLabel,
      hint: systemTestSummary?.testDueDate
        ? `ครบกำหนด 30 วัน: ${formatDate(systemTestSummary.testDueDate)}`
        : "ยังไม่มีวันครบกำหนด",
    },
    {
      label: "สถานะคำขอสอบ คพ.03",
      value: thesisStatusLabel,
      hint: systemTestReady ? "พร้อมยื่นสอบ คพ.03" : "รอทดสอบระบบครบ 30 วัน",
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Phase 2 Overview</p>
          <h1 className={styles.title}>โครงงานพิเศษ 2 & ปริญญานิพนธ์</h1>
          <p className={styles.lead}>ติดตามความพร้อมและจัดการคำขอสำคัญของ Phase 2</p>
        </div>
        <div className={styles.heroMeta}>
          <p className={styles.heroLabel}>โครงงาน</p>
          <p className={styles.heroValue}>{project?.projectNameTh || "ยังไม่มีหัวข้อ"}</p>
          <p className={styles.heroHint}>{project?.projectCode ? `รหัส ${project.projectCode}` : "ยังไม่กำหนดรหัส"}</p>
        </div>
      </header>

      <section className={styles.grid}>
        {cardSummary.map((card) => (
          <article key={card.label} className={styles.card}>
            <p className={styles.cardLabel}>{card.label}</p>
            <p className={styles.cardValue}>{card.value}</p>
            <p className={styles.cardHint}>{card.hint}</p>
          </article>
        ))}
      </section>

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
                onClick={() => router.push(step.target)}
              >
                ไปยังขั้นตอนนี้
              </button>
            </article>
          );
        })}
      </section>
    </div>
  );
}
