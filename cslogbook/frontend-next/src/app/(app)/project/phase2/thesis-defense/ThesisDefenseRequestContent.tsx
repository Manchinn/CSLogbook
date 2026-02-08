"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";
import { useStudentProjectDetail } from "@/hooks/useStudentProjectDetail";
import {
  getThesisDefenseRequest,
  submitThesisDefenseRequest,
} from "@/lib/services/projectService";
import styles from "./thesisDefense.module.css";

const statusLabels: Record<string, string> = {
  submitted: "ยื่นคำขอแล้ว",
  advisor_in_review: "รออาจารย์อนุมัติ",
  advisor_approved: "อาจารย์อนุมัติครบ",
  staff_verified: "เจ้าหน้าที่ตรวจสอบแล้ว",
  scheduled: "นัดสอบแล้ว",
  completed: "บันทึกผลสอบเรียบร้อย",
  cancelled: "คำขอถูกยกเลิก",
  advisor_rejected: "อาจารย์ไม่อนุมัติ",
  staff_returned: "เจ้าหน้าที่ส่งกลับ",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(d);
}

export default function ThesisDefenseRequestContent() {
  const router = useRouter();
  const { token, user } = useAuth();
  const hydrated = useHydrated();
  const [request, setRequest] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Array<Record<string, string>>>([]);

  const queriesEnabled = hydrated && Boolean(token);
  const { data: project } = useStudentProjectDetail(token, queriesEnabled);
  const { data: eligibility } = useStudentEligibility(token, queriesEnabled);

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
        const displayDate = formatDate(projectRegistrationStartDate);
        reasons.push(
          displayDate !== "-"
            ? `ภาคเรียนถัดไปจะเปิดให้ยื่นสอบโครงงานพิเศษ 2 ในวันที่ ${displayDate}`
            : "ภาคเรียนถัดไปยังไม่เปิดให้ยื่นสอบโครงงานพิเศษ 2"
        );
      }
    }

    return reasons;
  }, [project, allowedPhase2Semesters, currentSemester, projectRegistrationStartDate]);

  const systemTestReady = useMemo(() => {
    const summary = project?.systemTestRequest;
    if (!summary) return false;
    if (summary.status !== "staff_approved") return false;
    if (!summary.evidenceSubmittedAt) return false;
    if (!summary.testDueDate) return false;
    const due = new Date(summary.testDueDate);
    if (Number.isNaN(due.getTime())) return false;
    return new Date() >= due;
  }, [project?.systemTestRequest]);

  const meetingRequirement = useMemo(() => {
    const metrics = project?.meetingMetricsPhase2 ?? project?.meetingMetrics;
    if (!metrics) {
      return { approved: 0, required: 0, satisfied: true };
    }
    const perStudent = Array.isArray(metrics.perStudent) ? metrics.perStudent : [];
    const currentStudentId = user?.studentId;
    const currentApproved = currentStudentId
      ? Number(perStudent.find((item) => Number(item.studentId) === Number(currentStudentId))?.approvedLogs || 0)
      : 0;
    const required = Number(metrics.requiredApprovedLogs) || 0;
    return {
      approved: currentApproved,
      required,
      satisfied: required === 0 || currentApproved >= required,
    };
  }, [project?.meetingMetrics, project?.meetingMetricsPhase2, user?.studentId]);

  const loadRequest = useCallback(async () => {
    if (!token || !project?.projectId) return;
    const data = await getThesisDefenseRequest(token, project.projectId);
    if (data) {
      setRequest(data as Record<string, unknown>);
      const payload = (data as { formPayload?: Record<string, unknown> }).formPayload;
      if (payload && Array.isArray(payload.students)) {
        setStudents(payload.students as Array<Record<string, string>>);
      }
    }
  }, [project?.projectId, token]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  useEffect(() => {
    if (!project) return;
    const baseStudents = (project.members || []).map((member) => ({
      studentId: String(member.studentId),
      studentCode: member.studentCode || "",
      name: member.name || member.studentCode || "",
      phone: member.phone || "",
      email: member.email || "",
    }));
    if (baseStudents.length) {
      setStudents(baseStudents);
    }
  }, [project]);

  const handleSubmit = async () => {
    if (!token || !project?.projectId) return;
    try {
      setSaving(true);
      const payload = {
        requestDate: new Date().toISOString().slice(0, 10),
        students: students.map((student) => ({
          studentId: student.studentId,
          phone: student.phone,
          email: student.email,
        })),
      };
      const response = await submitThesisDefenseRequest(token, project.projectId, payload);
      setRequest(response.data ?? null);
    } finally {
      setSaving(false);
    }
  };

  if (!project) {
    return <div className={styles.notice}>ยังไม่มีโครงงานสำหรับผู้ใช้งานคนนี้</div>;
  }

  const status = String(request?.status || "");
  const statusLabel = statusLabels[status] || "ยังไม่พบสถานะคำขอ";
  const formLocked = ["staff_verified", "scheduled", "completed"].includes(status);
  const disabledSubmission =
    phase2GateReasons.length > 0 || !meetingRequirement.satisfied || !systemTestReady || formLocked;

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div>
          <h1 className={styles.title}>คำขอสอบโครงงานพิเศษ 2 (คพ.03)</h1>
          <p className={styles.subtitle}>บันทึกข้อมูลคำขอสอบและติดตามสถานะคำร้อง</p>
        </div>
        <button type="button" className={styles.secondaryButton} onClick={() => router.push("/project/phase2")}> 
          กลับไปภาพรวม
        </button>
      </section>

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

      <section className={styles.card}>
        <div className={styles.tagRow}>
          <span className={styles.tag}>สถานะคำขอ: {statusLabel}</span>
          {!meetingRequirement.satisfied ? (
            <span className={styles.tagWarning}>
              ยังไม่ครบ log ({meetingRequirement.approved}/{meetingRequirement.required})
            </span>
          ) : (
            <span className={styles.tagSuccess}>ครบเกณฑ์ log แล้ว</span>
          )}
        </div>
        <div className={styles.metaGrid}>
          <div>
            <p className={styles.metaLabel}>สถานะทดสอบระบบ</p>
            <p className={styles.metaValue}>{systemTestReady ? "พร้อมแล้ว" : "ยังไม่พร้อม"}</p>
          </div>
          <div>
            <p className={styles.metaLabel}>ครบกำหนดทดสอบ</p>
            <p className={styles.metaValue}>{formatDate(project.systemTestRequest?.testDueDate)}</p>
          </div>
        </div>
      </section>

      {!systemTestReady ? (
        <section className={styles.noticeWarning}>
          ยังไม่ครบเงื่อนไขทดสอบระบบ 30 วันและหลักฐานการประเมิน
        </section>
      ) : null}

      <section className={styles.card}>
        <h3>ข้อมูลนักศึกษา</h3>
        <div className={styles.table}>
          {students.map((student, index) => (
            <div key={`${student.studentId}-${index}`} className={styles.row}>
              <input value={student.studentCode || ""} disabled aria-label="รหัสนักศึกษา" />
              <input value={student.name || ""} disabled aria-label="ชื่อ-นามสกุล" />
              <input
                value={student.phone || ""}
                onChange={(event) => {
                  const next = [...students];
                  next[index] = { ...next[index], phone: event.target.value };
                  setStudents(next);
                }}
                disabled={formLocked}
                aria-label="เบอร์โทรศัพท์"
              />
              <input
                value={student.email || ""}
                onChange={(event) => {
                  const next = [...students];
                  next[index] = { ...next[index], email: event.target.value };
                  setStudents(next);
                }}
                disabled={formLocked}
                aria-label="อีเมล"
              />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleSubmit}
          disabled={saving || disabledSubmission}
        >
          {saving ? "กำลังบันทึก..." : "บันทึกคำขอสอบ"}
        </button>
      </section>
    </div>
  );
}
