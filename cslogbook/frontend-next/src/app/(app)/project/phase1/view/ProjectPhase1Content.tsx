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
import { WorkflowTimeline } from "@/components/workflow/WorkflowTimeline";
import {
  acknowledgeTopicExamResult,
  type StudentDeadlineDetail,
} from "@/lib/services/studentService";
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

function parseDateValue(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function getDeadlineBaseTime(deadline: StudentDeadlineDetail) {
  if (deadline.deadlineAt) return parseDateValue(deadline.deadlineAt);
  if (deadline.deadlineDate) {
    const time = deadline.deadlineTime ?? "00:00:00";
    return parseDateValue(`${deadline.deadlineDate}T${time}`);
  }
  return null;
}

function getDeadlineSortTime(deadline: StudentDeadlineDetail) {
  const effective = parseDateValue(deadline.effectiveDeadlineAt ?? null);
  const base = effective ?? getDeadlineBaseTime(deadline);
  return base ? base.getTime() : Number.POSITIVE_INFINITY;
}


type ProjectStep = {
  key: string;
  phase: "phase1" | "phase2";
  phaseLabel?: string | null;
  title: string;
  desc: string;
  icon: string;
  implemented: boolean;
  comingSoon?: boolean;
  requiresPostTopicUnlock?: boolean;
  requiresPhase2Unlock?: boolean;
  target?: string | null;
  deadlineName?: string | null;
  relatedTo?: string | null;
};

const phase1Steps: ProjectStep[] = [
  {
    key: "topic-submit",
    phase: "phase1",
    phaseLabel: "โครงงานพิเศษ 1",
    title: "เสนอหัวข้อโครงงานพิเศษ",
    desc: "ส่งหัวข้อและข้อมูลโครงงานเพื่อเข้าสู่ขั้นตอนถัดไป",
    icon: "KP01",
    implemented: true,
    target: "/project/phase1/topic-submit",
    deadlineName: "ส่งหัวข้อโครงงานพิเศษ 1",
    relatedTo: "project1",
  },
  {
    key: "meeting-logbook",
    phase: "phase1",
    phaseLabel: "โครงงานพิเศษ 1",
    title: "บันทึกการพบอาจารย์",
    desc: "จองและบันทึกการประชุม พร้อมส่งอีเมลแจ้งเตือน",
    icon: "LOG",
    implemented: true,
    requiresPostTopicUnlock: true,
    target: "/project/phase1/meeting-logbook",
  },
  {
    key: "exam-submit",
    phase: "phase1",
    phaseLabel: "โครงงานพิเศษ 1",
    title: "ส่งเอกสารสอบ",
    desc: "ส่งคำขอสอบ คพ.02 และเอกสารประกอบการสอบ",
    icon: "KP02",
    implemented: true,
    requiresPostTopicUnlock: true,
    target: "/project/phase1/exam-submit",
    deadlineName: "ส่งคำร้องขอสอบ (คพ.02)",
    relatedTo: "project1",
  },
];

const phase2Steps: ProjectStep[] = [
  {
    key: "phase2-overview",
    phase: "phase2",
    phaseLabel: "ภาพรวม",
    title: "โครงงานพิเศษ & ปริญญานิพนธ์ – ภาพรวม",
    desc: "ติดตามสถานะและไทม์ไลน์โครงงานพิเศษ 2",
    icon: "OVR",
    implemented: true,
    requiresPhase2Unlock: true,
    target: "/project/phase2",
  },
  {
    key: "system-test",
    phase: "phase2",
    phaseLabel: "โครงงานพิเศษ 2",
    title: "ขอทดสอบระบบ 30 วัน",
    desc: "ส่งคำขอทดสอบระบบและติดตามสถานะอนุมัติ",
    icon: "TEST",
    implemented: true,
    requiresPhase2Unlock: true,
    target: "/project/phase2/system-test",
    deadlineName: "ยื่นคำขอทดสอบระบบ",
    relatedTo: "project2",
  },
  {
    key: "thesis-defense-request",
    phase: "phase2",
    phaseLabel: "โครงงานพิเศษ 2",
    title: "ยื่นคำขอสอบ คพ.03",
    desc: "ส่งคำขอสอบโครงงานพิเศษ 2 พร้อมหลักฐานสำคัญ",
    icon: "KP03",
    implemented: true,
    requiresPhase2Unlock: true,
    target: "/project/phase2/thesis-defense",
    deadlineName: "ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)",
    relatedTo: "project2",
  },
];

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

  const {
    data: timeline,
    isLoading: timelineLoading,
    error: timelineError,
  } = useWorkflowTimeline(token, "project", studentId ?? null, queriesEnabled);

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
        reasons.push(`ภาคเรียนที่ ${currentSemester} ยังไม่เปิดยื่นสอบโครงงานพิเศษ 2`);
      }
    }

    if (projectRegistrationStartDate) {
      const startDate = new Date(projectRegistrationStartDate);
      if (!Number.isNaN(startDate.getTime()) && new Date() < startDate) {
        const displayDate = formatThaiDate(projectRegistrationStartDate);
        reasons.push(
          displayDate !== "-"
            ? `ภาคเรียนถัดไปจะเปิดให้ยื่นสอบโครงงานพิเศษ 2 ในวันที่ ${displayDate}`
            : "ภาคเรียนถัดไปยังไม่เปิดให้ยื่นสอบโครงงานพิเศษ 2"
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
        "meeting-logbook",
        "exam-submit",
        "phase2-overview",
        "system-test",
        "thesis-defense-request",
      ].forEach((key) =>
        setStatus(key, "ยังไม่มีโครงงาน", "default")
      );
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

    const project1Status = project1DefenseRequest?.status;
    if (!project1Status) {
      setStatus("exam-submit", "ยังไม่ยื่นคำขอ", "default");
    } else if (["advisor_rejected", "staff_returned", "cancelled"].includes(project1Status)) {
      setStatus("exam-submit", "คำขอถูกส่งกลับ", "danger");
    } else if (["staff_verified", "scheduled", "completed"].includes(project1Status)) {
      setStatus("exam-submit", "ส่งเรียบร้อย", "success");
    } else if (project1Status === "advisor_approved") {
      setStatus("exam-submit", "อาจารย์อนุมัติครบ", "warning");
    } else {
      setStatus("exam-submit", "รอการอนุมัติ", "info");
    }

    if (phase2GateReasons.length > 0) {
      setStatus("phase2-overview", "รอปลดล็อก", "warning");
    } else if (thesisDefenseRequest?.status === "completed") {
      setStatus("phase2-overview", "เสร็จสิ้น Phase 2", "success");
    } else if (thesisDefenseRequest) {
      if (["advisor_rejected", "staff_returned", "cancelled"].includes(thesisDefenseRequest.status || "")) {
        setStatus("phase2-overview", "คำขอสอบ 2 ถูกส่งกลับ", "danger");
      } else if (["staff_verified", "scheduled"].includes(thesisDefenseRequest.status || "")) {
        setStatus("phase2-overview", "รอสอบโครงงานพิเศษ 2", "info");
      } else {
        setStatus("phase2-overview", "กำลังยื่นสอบ Phase 2", "info");
      }
    } else {
      setStatus("phase2-overview", "พร้อมเริ่ม Phase 2", "info");
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
    } else if (["advisor_rejected", "staff_returned", "cancelled"].includes(thesisDefenseRequest.status || "")) {
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
    (step: ProjectStep) => {
      const reasons: string[] = [];
      if (step.requiresPostTopicUnlock) reasons.push(...postTopicGateReasons);
      if (step.phase !== "phase2") {
        const overviewAlwaysEnabled = activePhaseTab === "all" && step.key === "phase2-overview";
        if (step.requiresPhase2Unlock && !overviewAlwaysEnabled) {
          reasons.push(...phase2GateReasons);
        }
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

  const cards = [
    {
      label: "สถานะ Phase",
      value: workflow?.currentPhase ?? project?.status ?? "ไม่พบข้อมูล",
      hint: workflow?.isBlocked ? `ถูกบล็อก: ${workflow.blockReason || ""}` : "พร้อมดำเนินการ",
    },
    {
      label: "สิทธิ์ยื่นสอบหัวข้อ",
      value: workflow?.canSubmitTopicDefense ? "พร้อม" : "ยังไม่ครบ",
      hint: workflow?.topicExamResult ? `ผลสอบหัวข้อ: ${workflow.topicExamResult}` : "รอผลสอบหรือ log meeting",
    },
    {
      label: "สมาชิกในกลุ่ม",
      value: project?.members?.length ? `${project.members.length} คน` : "ยังไม่ตั้งกลุ่ม",
      hint: project?.projectCode ? `รหัสโครงงาน ${project.projectCode}` : "สร้างโครงงานเพื่อรับรหัส",
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Project Workflow</p>
          <h1 className={styles.title}>ระบบโครงงานพิเศษ</h1>
          <p className={styles.lead}>ภาพรวมโครงงานพิเศษ 1 และ โครงงานพิเศษ 2 (ปริญญานิพนธ์)</p>
        </div>
      </header>

      <section className={styles.grid}>
        {cards.map((card) => (
          <article key={card.label} className={styles.card}>
            <p className={styles.cardLabel}>{card.label}</p>
            <p className={styles.cardValue}>{card.value}</p>
            <p className={styles.cardHint}>{card.hint}</p>
          </article>
        ))}
      </section>

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
          {projectAccessReason ? (
            <p className={styles.noticeReason}>{projectAccessReason}</p>
          ) : null}
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

      {showAck ? (
        <section className={styles.noticeDanger}>
          <p className={styles.noticeTitle}>ผลสอบหัวข้อ: ไม่ผ่าน</p>
          <p className={styles.noticeBody}>คุณต้องรับทราบผลเพื่อให้ระบบเก็บหัวข้อนี้</p>
          {projectDetailData?.examFailReason ? (
            <p className={styles.noticeReason}>เหตุผล: {projectDetailData.examFailReason}</p>
          ) : null}
          <div className={styles.noticeActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setAckModalOpen(true)}
              disabled={ackLoading}
            >
              {ackLoading ? "กำลังบันทึก..." : "รับทราบผล"}
            </button>
          </div>
        </section>
      ) : null}

      {project && postTopicLockReasons.length > 0 ? (
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
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => router.push("/dashboard/student")}
            >
              กลับไปหน้าแรก
            </button>
          </div>
        </section>
      ) : null}

      {showPhaseContent ? (
        <section className={styles.stepGrid}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabButton} ${activePhaseTab === "all" ? styles.tabButtonActive : ""}`}
              onClick={() => setActivePhaseTab("all")}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activePhaseTab === "phase1" ? styles.tabButtonActive : ""}`}
              onClick={() => setActivePhaseTab("phase1")}
            >
              โครงงานพิเศษ 1
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activePhaseTab === "phase2" ? styles.tabButtonActive : ""}`}
              onClick={() => setActivePhaseTab("phase2")}
            >
              โครงงานพิเศษ 2
            </button>
          </div>
          {visibleSteps.map((step) => {
            const lockReasons = buildLockReasons(step);
            const isDisabled = !step.implemented || lockReasons.length > 0;
            const status = stepStatusMap[step.key];
            return (
              <article
                key={step.key}
                className={`${styles.stepCard} ${isDisabled ? styles.stepCardDisabled : ""}`}
              >
                <button
                  type="button"
                  className={styles.stepButton}
                  onClick={() => handleOpen(step, lockReasons)}
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
                    {step.comingSoon && !step.implemented ? (
                      <span className={`${styles.tag} ${styles.tagMuted}`}>Coming Soon</span>
                    ) : null}
                  </div>
                  {lockReasons.length > 0 ? (
                    <p className={styles.stepHint}>{lockReasons.join(" • ")}</p>
                  ) : null}
                </button>
              </article>
            );
          })}
        </section>
      ) : null}

      {showPhaseContent ? (
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
                <dd>{project.advisorId ? `ID ${project.advisorId}` : "ยังไม่ระบุ"}</dd>
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
      ) : null}

      {showPhaseContent ? (
        <WorkflowTimeline
          title="Timeline โครงงานพิเศษ"
          subtitle="ครอบคลุม Phase 1 และ Phase 2 ตาม workflow"
          timeline={timeline}
          isLoading={timelineLoading}
          error={timelineError ? "โหลด timeline ไม่สำเร็จ" : null}
        />
      ) : null}

      {ackModalOpen ? (
        <div className={styles.modalOverlay} role="presentation">
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="ack-title">
            <div className={styles.modalHeader}>
              <h2 id="ack-title" className={styles.modalTitle}>ยืนยันการรับทราบผลสอบไม่ผ่าน</h2>
            </div>
            <div className={styles.modalBody}>
              <p>เมื่อรับทราบผล หัวข้อจะถูกเก็บถาวร และไม่สามารถย้อนกลับได้</p>
              {projectDetailData?.examFailReason ? (
                <p className={styles.modalHint}>เหตุผล: {projectDetailData.examFailReason}</p>
              ) : null}
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setAckModalOpen(false)}
                disabled={ackLoading}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={handleAcknowledge}
                disabled={ackLoading}
              >
                {ackLoading ? "กำลังบันทึก..." : "ยืนยันรับทราบ"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
