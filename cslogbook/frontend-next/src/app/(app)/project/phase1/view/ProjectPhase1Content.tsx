"use client";

import { useCallback, useMemo, useState } from "react";
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
import styles from "./phase1.module.css";

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });
const thaiDateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "short" });

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return dateFormatter.format(d);
}

function formatThaiDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return thaiDateFormatter.format(d);
}

type ProjectPhase1ContentProps = Record<string, never>;

export default function ProjectPhase1Content({}: ProjectPhase1ContentProps) {
  const router = useRouter();
  const { token, user } = useAuth();
  const hydrated = useHydrated();
  const [ackLoading, setAckLoading] = useState(false);
  const [ackModalOpen, setAckModalOpen] = useState(false);
  const [activePhaseTab, setActivePhaseTab] = useState<"all" | "phase1" | "phase2">("all");
  const studentId = user?.studentId ?? user?.id;
  const queriesEnabled = hydrated && Boolean(token) && Boolean(studentId);

  const {
    data: eligibility,
    isLoading: eligibilityLoading,
  } = useStudentEligibility(token, queriesEnabled);

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

  const projectDetailData = projectDetail ?? null;
  const projectSummary = projectStatus?.project ?? null;
  const project = projectDetailData ?? projectSummary ?? null;
  const workflow = projectStatus?.workflow ?? null;

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
        const displayDate = formatThaiDate(projectRegistrationStartDate);
        reasons.push(
          displayDate !== "-"
            ? `ภาคเรียนถัดไปจะเปิดให้ยื่นสอบปริญญานิพนธ์ ในวันที่ ${displayDate}`
            : "ภาคเรียนถัดไปยังไม่เปิดให้ยื่นสอบปริญญานิพนธ์"
        );
      }
    }

    return reasons;
  }, [project, allowedPhase2Semesters, currentSemester, projectRegistrationStartDate]);

  const leaderMember = useMemo(() => {
    if (!project || !Array.isArray(project.members)) return null;
    return project.members.find((member) => member.role === "leader") ?? null;
  }, [project]);

  const meetingProgress = useMemo(() => {
    if (!projectDetailData) {
      return { required: 0, approved: 0, totalApproved: 0, satisfied: true };
    }
    const metrics = projectDetailData.meetingMetrics ?? projectDetailData.meetingMetricsPhase1 ?? null;
    if (!metrics) {
      return { required: 0, approved: 0, totalApproved: 0, satisfied: true };
    }
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

  const systemTestSummary = projectDetailData?.systemTestRequest ?? null;

  const stepStatusMap = useMemo(() => {
    const statuses: Record<string, { label: string; tone: "default" | "info" | "success" | "warning" | "danger" }>
      = {};

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
        "phase2-overview",
        "system-test",
        "thesis-defense-request",
      ].forEach((key) => setStatus(key, "ยังไม่มีโครงงาน", "default"));
      return statuses;
    }

    const members = Array.isArray(project.members) ? project.members : [];
    const membersCount = members.length;
    const hasTopicTitles = Boolean(project.projectNameTh) && Boolean(project.projectNameEn);
    const isFailedArchived =
      project.examResult === "failed" && Boolean(projectDetailData?.studentAcknowledgedAt);

    if (isFailedArchived) {
      setStatus("topic-submit", "ต้องยื่นใหม่", "danger");
    } else if (membersCount >= 2 && hasTopicTitles) {
      setStatus("topic-submit", "เสร็จสิ้น", "success");
    } else if (membersCount > 0 || hasTopicTitles) {
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

    if (phase2GateReasons.length > 0) {
      setStatus("phase2-overview", "รอปลดล็อก", "warning");
    } else if (thesisDefenseRequest?.status === "completed") {
      setStatus("phase2-overview", "เสร็จสิ้นปริญญานิพนธ์", "success");
    } else if (thesisDefenseRequest) {
      if (["advisor_rejected", "staff_rejected", "cancelled"].includes(thesisDefenseRequest.status || "")) {
        setStatus("phase2-overview", "คำขอสอบ 2 ถูกส่งกลับ", "danger");
      } else if (["staff_verified", "scheduled"].includes(thesisDefenseRequest.status || "")) {
        setStatus("phase2-overview", "รอสอบปริญญานิพนธ์", "info");
      } else {
        setStatus("phase2-overview", "กำลังยื่นสอบปริญญานิพนธ์", "info");
      }
    } else {
      setStatus("phase2-overview", "พร้อมเริ่มปริญญานิพนธ์", "info");
    }

    if (phase2GateReasons.length > 0) {
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

    if (phase2GateReasons.length > 0) {
      setStatus("thesis-defense-request", "รอปลดล็อก", "warning");
    } else if (!thesisDefenseRequest) {
      setStatus("thesis-defense-request", "ยังไม่ยื่นคำขอ", "default");
    } else if (["advisor_rejected", "staff_rejected", "cancelled"].includes(thesisDefenseRequest.status || "")) {
      setStatus("thesis-defense-request", "คำขอถูกส่งกลับ", "danger");
    } else if (["staff_verified", "scheduled"].includes(thesisDefenseRequest.status || "")) {
      setStatus("thesis-defense-request", "รอสอบปริญญานิพนธ์", "info");
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
    phase2GateReasons,
    systemTestSummary,
    projectDetailData?.studentAcknowledgedAt,
  ]);

  const allSteps = useMemo(() => [phase2Steps[0], ...phase1Steps, ...phase2Steps.slice(1)], []);
  const visibleSteps = useMemo(() => {
    if (activePhaseTab === "all") return allSteps;
    if (activePhaseTab === "phase2") {
      return allSteps.filter((step) => step.phase === "phase2" && step.key !== "phase2-overview");
    }
    return allSteps.filter((step) => step.phase === activePhaseTab);
  }, [activePhaseTab, allSteps]);

  const buildLockReasons = useCallback(
    (
      step: ProjectStep,
      deadlineStatus: { isOverdue: boolean; isLocked: boolean; reason: string | null }
    ) => {
      const reasons: string[] = [];
      if (step.requiresPostTopicUnlock) reasons.push(...postTopicGateReasons);
      const overviewAlwaysEnabled = activePhaseTab === "all" && step.key === "phase2-overview";
      if (step.requiresPhase2Unlock && !overviewAlwaysEnabled) {
        reasons.push(...phase2GateReasons);
      }

      if (deadlineStatus.isLocked && deadlineStatus.reason) {
        reasons.push(deadlineStatus.reason);
      } else if (deadlineStatus.isOverdue && deadlineStatus.reason) {
        reasons.push(deadlineStatus.reason);
      }

      return reasons;
    },
    [activePhaseTab, postTopicGateReasons, phase2GateReasons]
  );

  const handleOpen = useCallback(
    (step: ProjectStep, lockReasons: string[]) => {
      if (!step.implemented) return;
      if (lockReasons.length > 0) return;
      if (step.target) {
        router.push(step.target);
      }
    },
    [router]
  );

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
          <p className={styles.kicker}>Project Workflow</p>
          <h1 className={styles.title}>ระบบโครงงานพิเศษ</h1>
          <p className={styles.lead}>ภาพรวมโครงงานพิเศษ 1 และ ปริญญานิพนธ์</p>
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

      <PhaseStepsGrid
        showPhaseContent={showPhaseContent}
        activePhaseTab={activePhaseTab}
        onTabChange={setActivePhaseTab}
        visibleSteps={visibleSteps}
        stepStatusMap={stepStatusMap}
        getStepDeadlineStatus={getStepDeadlineStatus}
        buildLockReasons={buildLockReasons}
        onOpenStep={handleOpen}
      />

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
