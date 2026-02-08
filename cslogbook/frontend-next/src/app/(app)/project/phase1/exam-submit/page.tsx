"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentProjectDetail } from "@/hooks/useStudentProjectDetail";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";
import { featureFlags } from "@/lib/config/featureFlags";
import {
  getProject1DefenseRequest,
  submitProject1DefenseRequest,
} from "@/lib/services/projectService";
import styles from "./examSubmit.module.css";

const statusLabels: Record<string, string> = {
  submitted: "ยื่นคำขอแล้ว",
  advisor_in_review: "รออาจารย์อนุมัติ",
  advisor_approved: "อาจารย์อนุมัติครบ",
  staff_verified: "เจ้าหน้าที่ตรวจสอบแล้ว",
  scheduled: "นัดสอบแล้ว",
  completed: "บันทึกผลสอบเรียบร้อย",
  cancelled: "คำขอถูกยกเลิก",
  advisor_rejected: "อาจารย์ไม่อนุมัติ",
};

export default function ExamSubmitPage() {
  guardFeatureRoute(featureFlags.enableProjectPhase1Page, "/app");
  const { token, user } = useAuth();
  const { data: project } = useStudentProjectDetail(token, Boolean(token));
  const [request, setRequest] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    advisorName: "",
    coAdvisorName: "",
    additionalNotes: "",
  });
  const [students, setStudents] = useState<Array<Record<string, string>>>([]);

  useEffect(() => {
    const loadRequest = async () => {
      if (!token || !project?.projectId) return;
      const data = await getProject1DefenseRequest(token, project.projectId);
      if (data) {
        setRequest(data as Record<string, unknown>);
        const payload = (data as { formPayload?: Record<string, unknown> }).formPayload;
        if (payload) {
          setForm({
            advisorName: String(payload.advisorName || ""),
            coAdvisorName: String(payload.coAdvisorName || ""),
            additionalNotes: String(payload.additionalNotes || ""),
          });
          if (Array.isArray(payload.students)) {
            setStudents(payload.students as Array<Record<string, string>>);
          }
        }
      }
    };
    loadRequest();
  }, [project?.projectId, token]);

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

  const meetingRequirement = useMemo(() => {
    const metrics = project?.meetingMetrics;
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
  }, [project?.meetingMetrics, user?.studentId]);

  const handleSubmit = async () => {
    if (!token || !project?.projectId) return;
    try {
      setSaving(true);
      const payload = {
        requestDate: new Date().toISOString().slice(0, 10),
        advisorName: form.advisorName,
        coAdvisorName: form.coAdvisorName,
        additionalNotes: form.additionalNotes,
        students,
        projectSnapshotOverride: {
          projectCode: project.projectCode ?? null,
          projectNameTh: project.projectNameTh ?? null,
          projectNameEn: project.projectNameEn ?? null,
        },
      };
      const response = await submitProject1DefenseRequest(token, project.projectId, payload);
      setRequest(response.data ?? null);
    } finally {
      setSaving(false);
    }
  };

  if (!project) {
    return (
      <RoleGuard roles={["student"]}>
        <div className={styles.notice}>ยังไม่มีโครงงานสำหรับผู้ใช้งานคนนี้</div>
      </RoleGuard>
    );
  }

  const status = String(request?.status || "");
  const statusLabel = statusLabels[status] || "ยังไม่พบสถานะคำขอ";
  const formLocked = ["staff_verified", "scheduled", "completed"].includes(status);
  const disabledSubmission = ["completed", "archived", "failed"].includes(project.status ?? "") || !meetingRequirement.satisfied;

  return (
    <RoleGuard roles={["student"]}>
      <div className={styles.page}>
        <section className={styles.header}>
          <h1 className={styles.title}>คำขอสอบโครงงานพิเศษ 1 (คพ.02)</h1>
          <p className={styles.subtitle}>บันทึกข้อมูลคำขอและติดตามสถานะคำร้อง</p>
        </section>

        <section className={styles.card}>
          <div className={styles.tagRow}>
            <span className={styles.tag}>สถานะ: {statusLabel}</span>
            {!meetingRequirement.satisfied ? (
              <span className={styles.tagWarning}>ยังไม่ครบจำนวน log ที่อนุมัติ</span>
            ) : (
              <span className={styles.tagSuccess}>ครบเกณฑ์ log แล้ว</span>
            )}
          </div>
        </section>

        <section className={styles.card}>
          <h3>ข้อมูลคำขอ</h3>
          <div className={styles.form}>
            <div className={styles.field}>
              <label>ชื่ออาจารย์ที่ปรึกษา</label>
              <input
                value={form.advisorName}
                onChange={(event) => setForm((prev) => ({ ...prev, advisorName: event.target.value }))}
                disabled={formLocked}
              />
            </div>
            <div className={styles.field}>
              <label>ชื่ออาจารย์ร่วม</label>
              <input
                value={form.coAdvisorName}
                onChange={(event) => setForm((prev) => ({ ...prev, coAdvisorName: event.target.value }))}
                disabled={formLocked}
              />
            </div>
            <div className={styles.field}>
              <label>หมายเหตุเพิ่มเติม</label>
              <textarea
                value={form.additionalNotes}
                onChange={(event) => setForm((prev) => ({ ...prev, additionalNotes: event.target.value }))}
                disabled={formLocked}
              />
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h3>ข้อมูลนักศึกษา</h3>
          <div className={styles.table}>
            {students.map((student, index) => (
              <div key={`${student.studentId}-${index}`} className={styles.row}>
                <input value={student.studentCode || ""} disabled />
                <input value={student.name || ""} disabled />
                <input
                  value={student.phone || ""}
                  onChange={(event) => {
                    const next = [...students];
                    next[index] = { ...next[index], phone: event.target.value };
                    setStudents(next);
                  }}
                  disabled={formLocked}
                />
                <input
                  value={student.email || ""}
                  onChange={(event) => {
                    const next = [...students];
                    next[index] = { ...next[index], email: event.target.value };
                    setStudents(next);
                  }}
                  disabled={formLocked}
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
            disabled={saving || formLocked || disabledSubmission}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกคำขอสอบ"}
          </button>
        </section>
      </div>
    </RoleGuard>
  );
}
