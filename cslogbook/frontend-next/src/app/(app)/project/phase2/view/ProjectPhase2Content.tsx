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
import { getDeadlineBaseTime, getEffectiveDeadline, isDeadlineMatch } from "@/lib/project/deadlineUtils";
import { getPhase2GateReasons } from "@/lib/project/phase2Gate";
import { phase2Steps, type ProjectStep } from "./projectPhase2Steps";
import { MeetingLogbookSection, Phase2GateNotice, StepGrid, SummaryCards } from "./ProjectPhase2Sections";
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

function getStepDeadlineStatus(step: ProjectStep, deadlines: StudentDeadlineDetail[]): StepDeadlineStatus {
  if (!step.deadlineName || !step.relatedTo) {
    return { isOverdue: false, isLocked: false, allowLate: false, reason: null, deadline: null };
  }

  const matchingDeadline = deadlines.find((deadline) => isDeadlineMatch(step, deadline, DEADLINE_KEYWORD_FILTER)) ?? null;
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

  const phase2GateReasons = useMemo(
    () => getPhase2GateReasons({ project: project ?? null, eligibility: eligibility ?? null, formatDate: formatShortDate }),
    [project, eligibility]
  );

  // Meeting logbook metrics (Phase 2 specific, falls back to general metrics)
  const meetingMetrics = projectDetailData?.meetingMetricsPhase2 ?? projectDetailData?.meetingMetrics ?? null;
  const meetingRequirement = useMemo(() => {
    if (!meetingMetrics) return { required: 0, totalApproved: 0, satisfied: true };
    const required = Number(meetingMetrics.requiredApprovedLogs) || 0;
    const totalApproved = Number(meetingMetrics.totalApprovedLogs) || 0;
    return { required, totalApproved, satisfied: required === 0 || totalApproved >= required };
  }, [meetingMetrics]);

  const meetingBreakdown = useMemo(() => {
    const members = Array.isArray(projectDetailData?.members) ? projectDetailData.members : [];
    const perStudentMap = new Map<number, { approvedLogs: number; attendedMeetings: number }>();
    if (Array.isArray(meetingMetrics?.perStudent)) {
      for (const entry of meetingMetrics.perStudent) {
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
  }, [projectDetailData?.members, meetingMetrics]);

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

      <SummaryCards cards={cardSummary} />

      <Phase2GateNotice eligibilityLoading={eligibilityLoading} phase2GateReasons={phase2GateReasons} />

      <MeetingLogbookSection
        meetingRequirement={meetingRequirement}
        meetingBreakdown={meetingBreakdown}
        lastApprovedLogAt={meetingMetrics?.lastApprovedLogAt ?? null}
        formatDate={formatDate}
      />

      <StepGrid
        steps={phase2Steps}
        stepStatuses={stepStatuses}
        phase2GateReasons={phase2GateReasons}
        systemTestReady={systemTestReady}
        projectDeadlines={projectDeadlines}
        getStepDeadlineStatus={getStepDeadlineStatus}
        onOpenStep={(target) => router.push(target)}
        formatDate={formatDate}
      />
    </div>
  );
}
