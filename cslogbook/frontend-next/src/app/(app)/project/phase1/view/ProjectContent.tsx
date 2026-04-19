"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";
import { useStudentProjectDetail } from "@/hooks/useStudentProjectDetail";
import { useStudentProjectStatus } from "@/hooks/useStudentProjectStatus";
import { useStudentDeadlineCalendar } from "@/hooks/useStudentDeadlineCalendar";
import { useWorkflowTimeline } from "@/hooks/useWorkflowTimeline";
import { acknowledgeTopicExamResult } from "@/lib/services/studentService";
import {
  extractDeadlineKeywords,
  getDeadlineBaseTime,
  getDeadlineSortTime,
  parseDateValue,
} from "@/lib/project/deadlineUtils";
import { phase1Steps, phase2Steps, type ProjectStep } from "./projectPhase1Steps";
import {
  AcknowledgeModal,
  AcknowledgeNotice,
  EligibilityNotices,
  PhaseStepsGrid,
  ProjectLockNotices,
  ProjectOverviewPanels,
} from "./ProjectPhase1Sections";
import {
  MeetingLogbookSection,
  Phase2GateNotice,
  SummaryCards,
  ThesisFailNotice,
} from "../../phase2/view/ProjectPhase2Sections";
import styles from "./phase1.module.css";

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });
const shortDateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "short" });

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

// TODO: TEMP FLAG — ตั้งค่าเป็น true เพื่อปลดล็อก card ทั้งหมดชั่วคราวสำหรับทดสอบ UI ภายใน
// sync กับ FORCE_ENABLE_CARD ใน ProjectPhase1Sections.tsx — เปลี่ยนกลับเป็น false ทั้งสองไฟล์พร้อมกัน
const FORCE_ENABLE_CARD = false;

export default function ProjectContent() {
  const router = useRouter();
  const { token, user } = useAuth();
  const hydrated = useHydrated();
  const [ackLoading, setAckLoading] = useState(false);
  const [ackModalOpen, setAckModalOpen] = useState(false);
  const [activePhaseTab, setActivePhaseTab] = useState<"all" | "phase1" | "phase2">("all");
  const studentId = user?.studentId ?? user?.id;
  const queriesEnabled = hydrated && Boolean(token) && Boolean(studentId);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: eligibility, isLoading: eligibilityLoading } = useStudentEligibility(token, queriesEnabled);
  const {
    data: projectStatus,
    isLoading: projectLoading,
    error: projectError,
  } = useStudentProjectStatus(token, queriesEnabled);
  const {
    data: projectDetail,
    isLoading: projectDetailLoading,
    refetch: refetchProjectDetail,
  } = useStudentProjectDetail(token, queriesEnabled);
  // timeline data — hook ยังใช้เพื่อ prefetch; ค่า destructure ยังไม่ได้ render
  useWorkflowTimeline(token, "project", studentId ?? null, queriesEnabled);
  const { data: deadlines } = useStudentDeadlineCalendar(
    token,
    projectDetail?.academicYear ?? null,
    queriesEnabled
  );

  // ── Core data ──────────────────────────────────────────────────────────────
  const projectDetailData = projectDetail ?? null;
  const projectSummary = projectStatus?.project ?? null;
  const project = projectDetailData ?? projectSummary ?? null;
  const projectMembers = projectDetailData?.members ?? null;
  const workflow = projectStatus?.workflow ?? null;

  // ── Deadlines ──────────────────────────────────────────────────────────────
  const projectDeadlines = useMemo(() => {
    if (!deadlines) return [];
    const list = deadlines.filter((deadline) =>
      String(deadline.relatedTo || "").toLowerCase().startsWith("project")
    );
    return list.slice().sort((a, b) => getDeadlineSortTime(a) - getDeadlineSortTime(b));
  }, [deadlines]);

  const getStepDeadlineStatus = useCallback(
    (step: ProjectStep) => {
      if (!step.deadlineName || !step.relatedTo) {
        return { isOverdue: false, isLocked: false, reason: null, deadline: null, allowLate: false };
      }

      const match = projectDeadlines.find((deadline) => {
        const deadlineName = String(deadline.name || "").trim();
        const stepDeadlineName = String(step.deadlineName || "").trim();
        const relatedToMatch =
          String(deadline.relatedTo || "").toLowerCase() === (step.relatedTo?.toLowerCase() ?? "");

        if (!relatedToMatch) return false;
        if (deadlineName === stepDeadlineName) return true;

        const deadlineKeywords = extractDeadlineKeywords(deadlineName);
        const stepKeywords = extractDeadlineKeywords(stepDeadlineName);
        const common = deadlineKeywords.filter((keyword) => stepKeywords.includes(keyword));
        if (common.length >= 2) return true;

        if (deadlineName.includes(stepDeadlineName) || stepDeadlineName.includes(deadlineName)) {
          return true;
        }

        return false;
      });

      if (!match) {
        return { isOverdue: false, isLocked: false, reason: null, deadline: null, allowLate: false };
      }

      const baseDate = getDeadlineBaseTime(match);
      if (!baseDate) {
        return { isOverdue: false, isLocked: false, reason: null, deadline: match, allowLate: false };
      }

      const allowLate = Boolean(match.allowLate);
      const lockAfterDeadline = Boolean(match.lockAfterDeadline);
      const graceMinutes = Number(match.gracePeriodMinutes ?? 0);
      const baseMs = baseDate.getTime();
      const effectiveDate =
        parseDateValue(match.effectiveDeadlineAt ?? null) ??
        (allowLate && graceMinutes > 0 ? new Date(baseMs + graceMinutes * 60 * 1000) : baseDate);
      const effectiveMs = effectiveDate.getTime();
      const nowMs = Date.now();
      const isAfterDeadline = nowMs > baseMs;
      const isAfterEffective = nowMs > effectiveMs;

      if (!isAfterDeadline) {
        return { isOverdue: false, isLocked: false, reason: null, deadline: match, allowLate };
      }

      const diffDays = Math.max(0, Math.floor((nowMs - baseMs) / (24 * 60 * 60 * 1000)));

      if (isAfterEffective && lockAfterDeadline) {
        return {
          isOverdue: true,
          isLocked: true,
          allowLate: false,
          reason: `เกินกำหนด ${diffDays} วัน (ปิดรับแล้ว)`,
          deadline: match,
        };
      }

      if (isAfterDeadline && !isAfterEffective && allowLate) {
        const graceMinutesLeft = Math.max(0, Math.ceil((effectiveMs - nowMs) / (60 * 1000)));
        const graceHoursLeft = Math.max(1, Math.ceil(graceMinutesLeft / 60));
        return {
          isOverdue: true,
          isLocked: false,
          allowLate: true,
          reason: `เกินกำหนด ${diffDays} วัน (ยังส่งได้อีก ${graceHoursLeft} ชม. แต่จะถูกบันทึกว่าส่งช้า)`,
          deadline: match,
        };
      }

      if (isAfterDeadline && !allowLate) {
        return {
          isOverdue: true,
          isLocked: true,
          allowLate: false,
          reason: `เกินกำหนด ${diffDays} วัน (ปิดรับแล้ว)`,
          deadline: match,
        };
      }

      if (isAfterEffective && !lockAfterDeadline && allowLate) {
        return {
          isOverdue: true,
          isLocked: false,
          allowLate: true,
          reason: `เกินกำหนด ${diffDays} วัน (ยังส่งได้แต่จะถูกบันทึกว่าส่งช้า)`,
          deadline: match,
        };
      }

      return { isOverdue: false, isLocked: false, reason: null, deadline: match, allowLate };
    },
    [projectDeadlines]
  );

  const upcomingDeadlines = useMemo(() => {
    const now = Date.now();
    return projectDeadlines.filter((deadline) => getDeadlineSortTime(deadline) >= now).slice(0, 4);
  }, [projectDeadlines]);

  // ── Eligibility ────────────────────────────────────────────────────────────
  const canAccessProject =
    eligibility?.status?.project?.canAccess ??
    eligibility?.eligibility?.project?.canAccessFeature ??
    false;
  const projectAccessReason =
    eligibility?.status?.project?.reason ??
    eligibility?.eligibility?.project?.reason ??
    null;

  const eligibilitySnapshot = useMemo(() => {
    if (!eligibility) return null;
    return {
      currentCredits: eligibility.student?.totalCredits ?? 0,
      currentMajorCredits: eligibility.student?.majorCredits ?? 0,
      requiredCredits: eligibility.requirements?.project?.totalCredits ?? null,
      requiredMajorCredits: eligibility.requirements?.project?.majorCredits ?? null,
      canRegister: eligibility.status?.project?.canRegister ?? null,
    };
  }, [eligibility]);

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

  // ── Project lock states ────────────────────────────────────────────────────
  const isProjectCancelled = project?.status === "cancelled";

  const postTopicLockReasons = useMemo(() => {
    if (!project) return [];
    const reasons: string[] = [];
    if (!project.examResult) {
      reasons.push("เจ้าหน้าที่ภาควิชายังไม่ได้บันทึกผลสอบหัวข้อในระบบ");
    } else if (project.examResult !== "passed") {
      reasons.push("ผลสอบหัวข้อยังไม่ผ่าน จึงไม่สามารถดำเนินขั้นตอนถัดไปได้");
    }
    if (!project.status || !["in_progress", "completed"].includes(project.status)) {
      reasons.push("สถานะโครงงานยังไม่เป็น \"กำลังดำเนินการ\"");
    }
    return reasons;
  }, [project]);

  const postTopicGateReasons = useMemo(() => {
    if (!project) {
      return ["ยังไม่มีข้อมูลโครงงานที่เจ้าหน้าที่ภาควิชาบันทึกในระบบ"];
    }
    return postTopicLockReasons;
  }, [project, postTopicLockReasons]);

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
        reasons.push(`ภาคเรียนที่ ${currentSemester} ยังไม่เปิดยื่นสอบปริญญานิพนธ์`);
      }
    }
    if (projectRegistrationStartDate) {
      const startDate = new Date(projectRegistrationStartDate);
      if (!Number.isNaN(startDate.getTime()) && new Date() < startDate) {
        const displayDate = formatShortDate(projectRegistrationStartDate);
        reasons.push(
          displayDate !== "-"
            ? `ภาคเรียนถัดไปจะเปิดให้ยื่นสอบปริญญานิพนธ์ ในวันที่ ${displayDate}`
            : "ภาคเรียนถัดไปยังไม่เปิดให้ยื่นสอบปริญญานิพนธ์"
        );
      }
    }
    return reasons;
  }, [project, allowedPhase2Semesters, currentSemester, projectRegistrationStartDate]);

  const phase2Unlocked = phase2GateReasons.length === 0;

  // ── Meeting progress Phase 1 ───────────────────────────────────────────────
  const leaderMember = useMemo(() => {
    if (!project || !Array.isArray(project.members)) return null;
    return project.members.find((member) => member.role === "leader") ?? null;
  }, [project]);

  const meetingProgress = useMemo(() => {
    if (!projectDetailData) return { required: 0, approved: 0, totalApproved: 0, satisfied: true };
    const metrics = projectDetailData.meetingMetrics ?? projectDetailData.meetingMetricsPhase1 ?? null;
    if (!metrics) return { required: 0, approved: 0, totalApproved: 0, satisfied: true };
    const required = Number(metrics.requiredApprovedLogs) || 0;
    const perStudent = Array.isArray(metrics.perStudent)
      ? metrics.perStudent
      : ([] as Array<{ studentId: number; approvedLogs?: number }>);
    const leaderId = leaderMember?.studentId;
    const leaderApproved = leaderId
      ? Number(perStudent.find((item) => Number(item.studentId) === Number(leaderId))?.approvedLogs || 0)
      : 0;
    const totalApproved = Number(metrics.totalApprovedLogs) || leaderApproved;
    return {
      required,
      approved: leaderApproved,
      totalApproved,
      satisfied: required === 0 || leaderApproved >= required,
    };
  }, [projectDetailData, leaderMember]);

  // ── Phase 2 specific data ──────────────────────────────────────────────────
  const systemTestSummary = projectDetailData?.systemTestRequest ?? null;

  const project1DefenseRequest = useMemo(() => {
    if (!Array.isArray(projectDetailData?.defenseRequests)) return null;
    return (
      projectDetailData.defenseRequests.find(
        (request) => request.defenseType === "PROJECT1" && request.status !== "cancelled"
      ) ?? null
    );
  }, [projectDetailData?.defenseRequests]);

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
    const mapping: Record<string, string> = {
      pending_advisor: "รออาจารย์อนุมัติ",
      advisor_rejected: "อาจารย์ส่งกลับ",
      pending_staff: "รอเจ้าหน้าที่ตรวจสอบ",
      staff_rejected: "เจ้าหน้าที่ส่งกลับ",
      staff_approved: "อนุมัติครบ (รอหลักฐาน)",
      evidence_submitted: "อนุมัติครบและอัปโหลดหลักฐานครบแล้ว",
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
      staff_rejected: "เจ้าหน้าที่ส่งกลับ",
    };
    return mapping[thesisDefenseRequest.status ?? ""] ?? "กำลังดำเนินการ";
  }, [thesisDefenseRequest]);

  const cardSummaryPhase2 = useMemo(() => {
    const cards: Array<{ label: string; value: React.ReactNode; hint?: React.ReactNode }> = [
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

    if (workflow?.thesisExamResult) {
      const passed = workflow.thesisExamResult === "PASS";
      cards.push({
        label: "ผลสอบปริญญานิพนธ์ (คพ.03)",
        value: passed
          ? <span className={styles.cardValueSuccess}>ผ่านการสอบ</span>
          : <span className={styles.cardValueDanger}>ไม่ผ่านการสอบ</span>,
        hint: passed
          ? "ยินดีด้วย! ผ่านการสอบปริญญานิพนธ์เรียบร้อยแล้ว"
          : "กรุณาติดต่ออาจารย์ที่ปรึกษาเพื่อดำเนินการต่อ",
      });
    }

    return cards;
  }, [workflow, systemTestStatusLabel, systemTestSummary?.testDueDate, thesisStatusLabel, systemTestReady]);

  // ── Meeting logbook Phase 2 ────────────────────────────────────────────────
  const meetingMetricsP2 = projectDetailData?.meetingMetricsPhase2 ?? null;

  const meetingRequirementP2 = useMemo(() => {
    if (!meetingMetricsP2) return { required: 0, totalApproved: 0, satisfied: true };
    const required = Number(meetingMetricsP2.requiredApprovedLogs) || 0;
    const totalApproved = Number(meetingMetricsP2.totalApprovedLogs) || 0;
    return { required, totalApproved, satisfied: required === 0 || totalApproved >= required };
  }, [meetingMetricsP2]);

  const meetingBreakdownP2 = useMemo(() => {
    const members = Array.isArray(projectMembers) ? projectMembers : [];
    const perStudentMap = new Map<number, { approvedLogs: number; attendedMeetings: number }>();
    if (Array.isArray(meetingMetricsP2?.perStudent)) {
      for (const entry of meetingMetricsP2.perStudent) {
        if (entry?.studentId == null) continue;
        perStudentMap.set(Number(entry.studentId), {
          approvedLogs: Number(entry.approvedLogs) || 0,
          attendedMeetings: Number(entry.attendedMeetings) || 0,
        });
      }
    }
    return members.map((member) => {
      const counts = perStudentMap.get(Number(member.studentId)) ?? { approvedLogs: 0, attendedMeetings: 0 };
      return {
        studentId: member.studentId,
        name: member.name || member.studentCode || "สมาชิก",
        studentCode: member.studentCode || "-",
        role: member.role || "member",
        approvedLogs: counts.approvedLogs,
        attendedMeetings: counts.attendedMeetings,
      };
    });
  }, [projectMembers, meetingMetricsP2]);

  // ── Step status map ────────────────────────────────────────────────────────
  const stepStatusMap = useMemo(() => {
    const statuses: Record<string, { label: string; tone: "default" | "info" | "success" | "warning" | "danger" }> = {};

    const setStatus = (
      key: string,
      label: string,
      tone: "default" | "info" | "success" | "warning" | "danger" = "default"
    ) => {
      statuses[key] = { label, tone };
    };

    if (!project) {
      [
        "topic-submit",
        "topic-exam",
        "proposal-revision",
        "meeting-logbook",
        "exam-submit",
        "exam-day",
        "system-test",
        "thesis-defense-request",
      ].forEach((key) => setStatus(key, "ยังไม่มีโครงงาน", "default"));
      return statuses;
    }

    const members = Array.isArray(project.members) ? project.members : [];
    const hasTopicTitles = Boolean(project.projectNameTh) && Boolean(project.projectNameEn);
    const isFailedArchived =
      project.examResult === "failed" && Boolean(projectDetailData?.studentAcknowledgedAt);

    if (isFailedArchived) {
      setStatus("topic-submit", "ต้องยื่นใหม่", "danger");
    } else if (members.length >= 2 && hasTopicTitles) {
      setStatus("topic-submit", "เสร็จสิ้น", "success");
    } else if (members.length > 0 || hasTopicTitles) {
      setStatus("topic-submit", "กำลังดำเนินการ", "info");
    } else {
      setStatus("topic-submit", "ยังไม่เริ่ม", "default");
    }

    const project1Status = project1DefenseRequest?.status;
    if (project.examResult === "passed") {
      setStatus("topic-exam", "ผ่านการสอบหัวข้อ", "success");
    } else if (project.examResult === "failed") {
      setStatus(
        "topic-exam",
        projectDetailData?.studentAcknowledgedAt ? "ไม่ผ่าน (รับทราบแล้ว)" : "ไม่ผ่าน",
        "danger"
      );
    } else if (project1Status) {
      if (["advisor_rejected", "staff_rejected", "cancelled"].includes(project1Status)) {
        setStatus("topic-exam", "คำขอถูกส่งกลับ", "danger");
      } else if (["staff_verified", "scheduled"].includes(project1Status)) {
        setStatus("topic-exam", "รอวันสอบ", "info");
      } else if (project1Status === "completed") {
        setStatus("topic-exam", "รอประกาศผล", "info");
      } else {
        setStatus("topic-exam", "อยู่ระหว่างพิจารณา", "info");
      }
    } else {
      setStatus("topic-exam", "ยังไม่ยื่นคำขอสอบ", "default");
    }

    if (project.examResult === "failed") {
      setStatus("proposal-revision", "ยังไม่ผ่านหัวข้อ", "danger");
    } else if (project.examResult === "passed") {
      setStatus("proposal-revision", "พร้อมอัปโหลด", "success");
    } else {
      setStatus("proposal-revision", "รอผลสอบหัวข้อ", "default");
    }

    if (meetingProgress.required > 0) {
      if (meetingProgress.satisfied) {
        setStatus("meeting-logbook", `ครบเกณฑ์ ${meetingProgress.approved}/${meetingProgress.required}`, "success");
      } else if (meetingProgress.approved > 0) {
        setStatus("meeting-logbook", `อนุมัติแล้ว ${meetingProgress.approved}/${meetingProgress.required}`, "info");
      } else {
        setStatus("meeting-logbook", `ยังไม่บันทึก (${meetingProgress.required})`, "default");
      }
    } else if (meetingProgress.approved > 0) {
      setStatus("meeting-logbook", `บันทึกแล้ว ${meetingProgress.approved}`, "info");
    } else {
      setStatus("meeting-logbook", "พร้อมบันทึก", "default");
    }

    if (!project1Status) {
      setStatus("exam-submit", "ยังไม่ยื่นคำขอ", "default");
    } else if (["advisor_rejected", "staff_rejected", "cancelled"].includes(project1Status)) {
      setStatus("exam-submit", "คำขอถูกส่งกลับ", "danger");
    } else if (["staff_verified", "scheduled", "completed"].includes(project1Status)) {
      setStatus("exam-submit", "ส่งเรียบร้อย", "success");
    } else if (project1Status === "advisor_approved") {
      setStatus("exam-submit", "อาจารย์อนุมัติครบ", "warning");
    } else {
      setStatus("exam-submit", "รอการอนุมัติ", "info");
    }

    if (!project1Status) {
      setStatus("exam-day", "ยังไม่ยื่นคำขอ", "default");
    } else if (["advisor_rejected", "staff_rejected", "cancelled"].includes(project1Status)) {
      setStatus("exam-day", "คำขอถูกส่งกลับ", "danger");
    } else if (["staff_verified", "scheduled"].includes(project1Status)) {
      setStatus("exam-day", "รอวันสอบ", "info");
    } else if (project1Status === "completed") {
      setStatus("exam-day", "บันทึกผลสอบแล้ว", "success");
    } else {
      setStatus("exam-day", "รอการอนุมัติ", "info");
    }

    if (!phase2Unlocked) {
      setStatus("system-test", "รอปลดล็อก", "warning");
    } else if (!systemTestSummary) {
      setStatus("system-test", "ยังไม่ยื่นคำขอ", "default");
    } else if (["advisor_rejected", "staff_rejected"].includes(systemTestSummary.status || "")) {
      setStatus("system-test", "คำขอถูกส่งกลับ", "danger");
    } else if (systemTestSummary.status === "staff_approved") {
      if (systemTestSummary.evidenceSubmittedAt) {
        setStatus("system-test", "อนุมัติครบแล้ว", "success");
      } else {
        setStatus("system-test", "รออัปโหลดหลักฐาน", "warning");
      }
    } else if (systemTestSummary.status === "pending_staff") {
      setStatus("system-test", "รอเจ้าหน้าที่ตรวจสอบ", "info");
    } else if (systemTestSummary.status === "pending_advisor") {
      setStatus("system-test", "รออาจารย์อนุมัติ", "info");
    } else {
      setStatus("system-test", "กำลังดำเนินการ", "info");
    }

    if (!phase2Unlocked) {
      setStatus("thesis-defense-request", "รอปลดล็อก", "warning");
    } else if (!thesisDefenseRequest) {
      setStatus("thesis-defense-request", "ยังไม่ยื่นคำขอ", "default");
    } else if (["advisor_rejected", "staff_rejected", "cancelled"].includes(thesisDefenseRequest.status || "")) {
      setStatus("thesis-defense-request", "คำขอถูกส่งกลับ", "danger");
    } else if (["staff_verified", "scheduled"].includes(thesisDefenseRequest.status || "")) {
      setStatus("thesis-defense-request", "รอสอบโครงงานพิเศษ 2", "info");
    } else if (thesisDefenseRequest.status === "completed") {
      setStatus("thesis-defense-request", "บันทึกผลสอบแล้ว", "success");
    } else if (thesisDefenseRequest.status === "advisor_approved") {
      setStatus("thesis-defense-request", "อาจารย์อนุมัติครบ", "warning");
    } else {
      setStatus("thesis-defense-request", "รอการอนุมัติ", "info");
    }

    return statuses;
  }, [
    project,
    meetingProgress,
    project1DefenseRequest,
    thesisDefenseRequest,
    phase2Unlocked,
    systemTestSummary,
    projectDetailData?.studentAcknowledgedAt,
  ]);

  // ── Step visibility ────────────────────────────────────────────────────────
  // "phase2-overview" is replaced by a section divider — excluded from allSteps
  const allSteps = useMemo(
    () => [...phase1Steps, ...phase2Steps.filter((s) => s.key !== "phase2-overview")],
    []
  );

  const visibleSteps = useMemo(() => {
    if (activePhaseTab === "all") return allSteps;
    if (activePhaseTab === "phase2") return allSteps.filter((s) => s.phase === "phase2");
    return allSteps.filter((s) => s.phase === activePhaseTab);
  }, [activePhaseTab, allSteps]);

  const buildLockReasons = useCallback(
    (
      step: ProjectStep,
      deadlineStatus: { isOverdue: boolean; isLocked: boolean; reason: string | null }
    ) => {
      const reasons: string[] = [];
      if (step.requiresPostTopicUnlock) reasons.push(...postTopicGateReasons);
      if (step.requiresPhase2Unlock) reasons.push(...phase2GateReasons);
      if (deadlineStatus.isLocked && deadlineStatus.reason) {
        reasons.push(deadlineStatus.reason);
      } else if (deadlineStatus.isOverdue && deadlineStatus.reason) {
        reasons.push(deadlineStatus.reason);
      }
      return reasons;
    },
    [postTopicGateReasons, phase2GateReasons]
  );

  const handleOpen = useCallback(
    (step: ProjectStep, lockReasons: string[]) => {
      if (!step.implemented && !FORCE_ENABLE_CARD) return;
      if (lockReasons.length > 0 && !FORCE_ENABLE_CARD) return;
      if (step.target) router.push(step.target);
    },
    [router]
  );

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const showAck = Boolean(project && project.examResult === "failed" && !projectDetailData?.studentAcknowledgedAt);
  const showPhaseContent = canAccessProject && !eligibilityLoading && !isProjectCancelled;

  const handleAcknowledge = useCallback(async () => {
    if (!project?.projectId || !token) return;
    try {
      setAckLoading(true);
      await acknowledgeTopicExamResult(token, project.projectId);
      await refetchProjectDetail();
    } finally {
      setAckLoading(false);
      setAckModalOpen(false);
    }
  }, [project?.projectId, token, refetchProjectDetail]);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>โครงงานพิเศษ & ปริญญานิพนธ์</p>
          <h1 className={styles.title}>{project?.projectNameTh || "ระบบโครงงานพิเศษ"}</h1>
          <p className={styles.lead}>{project?.projectNameEn || "ภาพรวมโครงงานพิเศษ 1 และ ปริญญานิพนธ์"}</p>
        </div>
        <div className={styles.heroMeta}>
          <p className={styles.heroLabel}>อาจารย์ที่ปรึกษา</p>
          <p className={styles.heroValue}>{project?.advisorName || "ยังไม่ระบุ"}</p>
          {project?.coAdvisorName && (
            <>
              <p className={styles.heroLabel} style={{ marginTop: 6 }}>อาจารย์ที่ปรึกษาร่วม</p>
              <p className={styles.heroHint}>{project.coAdvisorName}</p>
            </>
          )}
          <p className={styles.heroLabel} style={{ marginTop: 10 }}>ภาคการศึกษา</p>
          <p className={styles.heroHint}>
            {project?.academicYear && project?.semester
              ? `${project.academicYear}/${project.semester}`
              : "ยังไม่ระบุ"}
          </p>
        </div>
      </header>

      <EligibilityNotices
        eligibilityLoading={eligibilityLoading}
        canAccessProject={canAccessProject}
        projectAccessReason={projectAccessReason}
        eligibilitySnapshot={eligibilitySnapshot}
      />

      <AcknowledgeNotice
        showAck={showAck}
        ackLoading={ackLoading}
        examFailReason={projectDetailData?.examFailReason}
        onOpen={() => setAckModalOpen(true)}
      />

      <ProjectLockNotices
        projectExists={Boolean(project)}
        postTopicLockReasons={postTopicLockReasons}
        isProjectCancelled={isProjectCancelled}
        onBackToDashboard={() => router.push("/dashboard/student")}
      />

      {showPhaseContent && phase2Unlocked && (
        <SummaryCards cards={cardSummaryPhase2} />
      )}

      {showPhaseContent && phase2Unlocked && (
        <ThesisFailNotice thesisExamResult={workflow?.thesisExamResult} />
      )}

      {showPhaseContent && (
        <Phase2GateNotice eligibilityLoading={eligibilityLoading} phase2GateReasons={phase2GateReasons} />
      )}

      <PhaseStepsGrid
        showPhaseContent={showPhaseContent}
        activePhaseTab={activePhaseTab}
        onTabChange={setActivePhaseTab}
        visibleSteps={visibleSteps}
        stepStatusMap={stepStatusMap}
        getStepDeadlineStatus={getStepDeadlineStatus}
        buildLockReasons={buildLockReasons}
        onOpenStep={handleOpen}
        showSectionDividers
      />

      {showPhaseContent && phase2Unlocked && (
        <MeetingLogbookSection
          meetingRequirement={meetingRequirementP2}
          meetingBreakdown={meetingBreakdownP2}
          lastApprovedLogAt={meetingMetricsP2?.lastApprovedLogAt ?? null}
          formatDate={formatDate}
          onNavigateToMeetings={() => router.push("/meetings")}
        />
      )}

      <ProjectOverviewPanels
        showPhaseContent={showPhaseContent}
        project={project}
        workflow={workflow}
        projectError={Boolean(projectError)}
        projectLoading={projectLoading}
        projectDetailLoading={projectDetailLoading}
        upcomingDeadlines={upcomingDeadlines}
        formatDate={formatDate}
      />

      {/* {showPhaseContent ? (
        <WorkflowTimeline
          title="Timeline โครงงานพิเศษ"
          subtitle="ครอบคลุม Phase 1 และ ปริญญานิพนธ์ ตาม workflow"
          timeline={timeline}
          isLoading={timelineLoading}
          error={timelineError ? "โหลด timeline ไม่สำเร็จ" : null}
        />
      ) : null} */}

      <AcknowledgeModal
        ackModalOpen={ackModalOpen}
        ackLoading={ackLoading}
        examFailReason={projectDetailData?.examFailReason}
        onClose={() => setAckModalOpen(false)}
        onConfirm={handleAcknowledge}
      />
    </div>
  );
}
