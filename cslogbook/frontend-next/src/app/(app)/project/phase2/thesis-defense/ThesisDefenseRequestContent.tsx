"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DefenseRequestStepper } from "@/components/common/DefenseRequestStepper";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";
import { useStudentProjectDetail } from "@/hooks/useStudentProjectDetail";
import { getPhase2GateReasons } from "@/lib/project/phase2Gate";
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

const statusTones: Record<string, "default" | "info" | "warning" | "success" | "danger"> = {
  submitted: "info",
  advisor_in_review: "info",
  advisor_approved: "warning",
  staff_verified: "success",
  scheduled: "info",
  completed: "success",
  cancelled: "danger",
  advisor_rejected: "danger",
  staff_returned: "danger",
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
  const phase2GateReasons = useMemo(
    () => getPhase2GateReasons({ project: project ?? null, eligibility: eligibility ?? null, formatDate }),
    [project, eligibility]
  );

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
  const statusTone = statusTones[status] ?? "default";
  const statusClass =
    statusTone === "success"
      ? styles.tagSuccess
      : statusTone === "warning"
        ? styles.tagWarning
        : statusTone === "danger"
          ? styles.tagDanger
          : statusTone === "info"
            ? styles.tagInfo
            : styles.tagDefault;
  const formLocked = ["staff_verified", "scheduled", "completed"].includes(status);
  const disabledSubmission =
    phase2GateReasons.length > 0 || !meetingRequirement.satisfied || !systemTestReady || formLocked;

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div>
          <h1 className={styles.title}>คำขอสอบปริญญานิพนธ์ (คพ.03)</h1>
          <p className={styles.subtitle}>บันทึกข้อมูลคำขอสอบและติดตามสถานะคำร้อง</p>
        </div>
        <button type="button" className={styles.secondaryButton} onClick={() => router.push("/project/phase2")}> 
          กลับไปภาพรวม
        </button>
      </section>

      <DefenseRequestStepper status={status} />

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

      <section className={styles.card}>
        <div className={styles.tagRow}>
          <span className={`${styles.tag} ${statusClass}`}>สถานะคำขอ: {statusLabel}</span>
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

      {["advisor_rejected", "staff_returned"].includes(status) ? (
        <section className={styles.noticeRejection}>
          <p className={styles.noticeTitle}>
            {status === "advisor_rejected" ? "อาจารย์ส่งคำขอกลับแล้ว" : "เจ้าหน้าที่ส่งคำขอกลับแล้ว"}
          </p>
          <p>กรุณาตรวจสอบข้อมูลและแก้ไขแล้วส่งใหม่ได้เลย</p>
        </section>
      ) : null}

      {!systemTestReady ? (
        <section className={styles.noticeWarning}>
          <p className={styles.noticeTitle}>ยังไม่ครบเงื่อนไขทดสอบระบบ 30 วัน</p>
          <p>
            ต้องทดสอบระบบให้ครบและอัปโหลดหลักฐานก่อนยื่นคำขอนี้{" "}
            <Link href="/project/phase2/system-test" className={styles.link}>ไปหน้าทดสอบระบบ →</Link>
          </p>
        </section>
      ) : null}

      <section className={styles.card}>
        <h3>ข้อมูลนักศึกษา</h3>
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span className={styles.tableHeaderCell}>รหัสนักศึกษา</span>
            <span className={styles.tableHeaderCell}>ชื่อ-นามสกุล</span>
            <span className={styles.tableHeaderCell}>เบอร์โทรศัพท์</span>
            <span className={styles.tableHeaderCell}>อีเมล</span>
          </div>
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
        {disabledSubmission && !formLocked ? (
          <div className={styles.buttonHint}>
            <p>ส่งคำขอไม่ได้เนื่องจาก:</p>
            <ul className={styles.buttonHintList}>
              {phase2GateReasons.length > 0 ? <li>ปริญญานิพนธ์ยังไม่ปลดล็อก</li> : null}
              {!meetingRequirement.satisfied ? (
                <li>
                  บันทึกการพบอาจารย์ยังไม่ครบ ({meetingRequirement.approved}/{meetingRequirement.required} ครั้ง){" "}
                  <Link href="/project/phase1/meeting-logbook" className={styles.link}>ไปบันทึก →</Link>
                </li>
              ) : null}
              {!systemTestReady ? <li>เงื่อนไขทดสอบระบบ 30 วันยังไม่ครบสมบูรณ์</li> : null}
            </ul>
          </div>
        ) : formLocked ? (
          <p className={styles.noticeInline}>คำขอนี้ถูกล็อกแล้ว — ไม่สามารถแก้ไขได้หลังเจ้าหน้าที่รับเรื่อง</p>
        ) : null}
      </section>
    </div>
  );
}
