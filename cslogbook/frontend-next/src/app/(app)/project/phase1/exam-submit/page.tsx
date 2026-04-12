"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DefenseRequestStepper } from "@/components/common/DefenseRequestStepper";
import { RejectionNotice } from "@/components/common/RejectionNotice";
import { RejectionDetailModal } from "@/components/common/RejectionDetailModal";
import { RequestTimeline, type TimelineItem } from "@/components/common/RequestTimeline";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StudentTable } from "@/components/common/StudentTable";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentProjectDetail } from "@/hooks/useStudentProjectDetail";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";
import { featureFlags } from "@/lib/config/featureFlags";
import {
  getProject1DefenseRequest,
  submitProject1DefenseRequest,
  type ProjectDefenseRequest,
} from "@/lib/services/projectService";
import { formatDateTime, getBangkokDateString } from "@/lib/utils/formatDateTime";
import { statusTone } from "@/lib/utils/statusLabels";
import { toneClassName } from "@/lib/utils/toneStyles";
import styles from "@/styles/requestPage.module.css";

/** Context-specific labels สำหรับคำขอสอบ คพ.02 */
const statusLabels: Record<string, string> = {
  submitted: "ยื่นคำขอแล้ว (รออาจารย์อนุมัติ)",
  advisor_in_review: "รอการอนุมัติจากอาจารย์ที่ปรึกษา",
  advisor_approved: "อาจารย์อนุมัติครบแล้ว",
  staff_verified: "เจ้าหน้าที่ตรวจสอบแล้ว",
  scheduled: "นัดสอบแล้ว",
  completed: "บันทึกผลสอบเรียบร้อย",
  cancelled: "คำขอถูกยกเลิก",
  advisor_rejected: "อาจารย์ไม่อนุมัติ",
  staff_rejected: "เจ้าหน้าที่ส่งกลับ",
};

const approvalMeta: Record<string, { label: string; tone: "default" | "success" | "danger" }> = {
  pending: { label: "รอดำเนินการ", tone: "default" },
  approved: { label: "อนุมัติ", tone: "success" },
  rejected: { label: "ปฏิเสธ", tone: "danger" },
};

export default function ExamSubmitPage() {
  guardFeatureRoute(featureFlags.enableProjectPhase1Page, "/app");
  const { token, user } = useAuth();
  const hydrated = useHydrated();
  const queriesEnabled = hydrated && Boolean(token);
  const { data: project } = useStudentProjectDetail(token, queriesEnabled);
  const [request, setRequest] = useState<ProjectDefenseRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    advisorName: "",
    coAdvisorName: "",
    additionalNotes: "",
  });
  const [students, setStudents] = useState<Array<Record<string, string>>>([]);

  useEffect(() => {
    const loadRequest = async () => {
      if (!token || !project?.projectId) return;
      setLoadingRequest(true);
      setErrorMessage(null);
      try {
        const data = await getProject1DefenseRequest(token, project.projectId);
        setRequest(data ?? null);
        const payload = (data as { formPayload?: Record<string, unknown> }).formPayload ?? null;
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
      } catch {
        setErrorMessage("โหลดข้อมูลคำขอสอบไม่สำเร็จ กรุณาลองใหม่");
      } finally {
        setLoadingRequest(false);
      }
    };
    loadRequest();
  }, [project?.projectId, token]);

  useEffect(() => {
    if (!project) return;
    const members = project.members || [];
    if (members.length === 0) return;

    const existingById = new Map(students.map((student) => [String(student.studentId), student]));
    const nextStudents = members.map((member) => {
      const memberId = String(member.studentId);
      const existing = existingById.get(memberId);
      if (existing) return existing;
      return {
        studentId: memberId,
        studentCode: member.studentCode || "",
        name: member.name || member.studentCode || "",
        phone: member.phone || "",
        email: member.email || "",
      };
    });

    const memberIds = new Set(members.map((member) => String(member.studentId)));
    const shouldUpdate =
      students.length === 0 ||
      nextStudents.length !== students.length ||
      students.some((student) => !memberIds.has(String(student.studentId)));

    if (shouldUpdate) {
      setStudents(nextStudents);
    }
  }, [project, students]);

  const meetingRequirement = useMemo(() => {
    const metrics = project?.meetingMetrics ?? project?.meetingMetricsPhase1;
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
  }, [project?.meetingMetrics, project?.meetingMetricsPhase1, user?.studentId]);

  const timelineItems = useMemo(() => {
    if (!request) return [] as TimelineItem[];
    const items: TimelineItem[] = [];
    if (request.submittedAt) items.push({ key: "submitted", label: "ส่งคำขอ", timestamp: request.submittedAt });
    if (request.advisorApprovedAt) {
      items.push({ key: "advisor", label: "อาจารย์อนุมัติครบ", timestamp: request.advisorApprovedAt });
    }
    if (request.staffVerifiedAt) {
      items.push({ key: "staff", label: "เจ้าหน้าที่ตรวจสอบแล้ว", timestamp: request.staffVerifiedAt });
    }
    if (request.defenseScheduledAt) {
      items.push({
        key: "scheduled",
        label: "กำหนดวันสอบ",
        timestamp: request.defenseScheduledAt,
        extra: request.defenseLocation || undefined,
      });
    }
    if (!items.length && request.updatedAt) {
      items.push({ key: "updated", label: "อัปเดตล่าสุด", timestamp: request.updatedAt });
    }
    return items;
  }, [request]);

  const advisorApprovals = Array.isArray(request?.advisorApprovals) ? request?.advisorApprovals : [];
  const rejectedApproval = advisorApprovals.find((a) => a.status === "rejected") ?? null;
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const openRejectionModal = useCallback(() => setRejectionModalOpen(true), []);
  const closeRejectionModal = useCallback(() => setRejectionModalOpen(false), []);

  if (!project) {
    return (
      <RoleGuard roles={["student"]}>
        <div className={styles.notice}>ยังไม่มีโครงงานสำหรับผู้ใช้งานคนนี้</div>
      </RoleGuard>
    );
  }

  const status = String(request?.status || "");
  const label = statusLabels[status] ?? "ยังไม่พบสถานะคำขอ";
  const statusClass = styles[toneClassName(statusTone(status))];
  const formLocked = ["staff_verified", "scheduled", "completed"].includes(status);
  const disabledSubmission =
    ["completed", "archived", "failed"].includes(project.status ?? "") || !meetingRequirement.satisfied;

  const handleSubmit = async () => {
    if (!token || !project?.projectId) return;
    try {
      setSaving(true);
      setErrorMessage(null);
      const payload = {
        requestDate: getBangkokDateString(),
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
    } catch {
      setErrorMessage("บันทึกคำขอสอบไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  const handleStudentChange = (index: number, field: string, value: string) => {
    const next = [...students];
    next[index] = { ...next[index], [field]: value };
    setStudents(next);
  };

  return (
    <RoleGuard roles={["student"]}>
      <div className={styles.page}>
        <section className={styles.header}>
          <h1 className={styles.title}>คำขอสอบโครงงานพิเศษ 1 (คพ.02)</h1>
          <p className={styles.subtitle}>บันทึกข้อมูลคำขอและติดตามสถานะคำร้อง</p>
        </section>

        <DefenseRequestStepper status={status} />

        <RejectionNotice
          status={status}
          visible={!!rejectedApproval}
          details={rejectedApproval?.note ? String(rejectedApproval.note) : null}
          message="กรุณาตรวจสอบสถานะอาจารย์ด้านล่าง แก้ไขข้อมูลแล้วส่งใหม่ได้เลย"
          actionText="กรุณาแก้ไขข้อมูลแล้วกดส่งคำขอสอบใหม่"
          onViewDetails={openRejectionModal}
        />

        {errorMessage ? <p className={styles.notice}>{errorMessage}</p> : null}

        <section className={styles.card}>
          <div className={styles.tagRow}>
            <span className={`${styles.tag} ${statusClass}`}>
              สถานะ: {label}
            </span>
            {!meetingRequirement.satisfied ? (
              <span className={styles.tagWarning}>
                ยังไม่ครบ log ({meetingRequirement.approved}/{meetingRequirement.required})
              </span>
            ) : (
              <span className={styles.tagSuccess}>ครบเกณฑ์ log แล้ว</span>
            )}
            {request?.submittedLate ? <span className={styles.tagWarning}>ส่งช้า</span> : null}
          </div>
          <div className={styles.metaGrid}>
            <div>
              <p className={styles.metaLabel}>อัปเดตล่าสุด</p>
              <p className={styles.metaValue}>{formatDateTime(request?.updatedAt)}</p>
            </div>
            <div>
              <p className={styles.metaLabel}>ส่งคำขอเมื่อ</p>
              <p className={styles.metaValue}>{formatDateTime(request?.submittedAt)}</p>
            </div>
            <div>
              <p className={styles.metaLabel}>เจ้าหน้าที่ตรวจสอบ</p>
              <p className={styles.metaValue}>{request?.staffVerifiedBy?.fullName || "-"}</p>
            </div>
          </div>
          {request?.staffVerificationNote ? (
            <p className={styles.noticeInline}>หมายเหตุเจ้าหน้าที่: {request.staffVerificationNote}</p>
          ) : null}
        </section>

        <RequestTimeline
          items={timelineItems}
          loading={loadingRequest}
          formatTimestamp={formatDateTime}
        />

        {advisorApprovals.length > 0 ? (
          <section className={styles.card}>
            <h3 className={styles.sectionTitle}>สถานะอาจารย์ที่ปรึกษา</h3>
            <div className={styles.list}>
              {advisorApprovals.map((approval) => {
                const approvalStatus = approval.status ? approvalMeta[approval.status] : approvalMeta.pending;
                return (
                  <div key={String(approval.approvalId)} className={styles.listItem}>
                    <div>
                      <span>{approval.teacher?.name ? String(approval.teacher.name) : `อาจารย์ที่ปรึกษา`}</span>
                      {approval.status === "rejected" && approval.note ? (
                        <p className={styles.approvalNote}>เหตุผล: {String(approval.note)}</p>
                      ) : null}
                    </div>
                    <span
                      className={`${styles.tag} ${
                        approvalStatus.tone === "success"
                          ? styles.tagSuccess
                          : approvalStatus.tone === "danger"
                            ? styles.tagDanger
                            : styles.tagDefault
                      }`}
                    >
                      {approvalStatus.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>ข้อมูลคำขอ</h3>
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

        <StudentTable
          students={students}
          onStudentChange={handleStudentChange}
          disabled={formLocked}
        />

        <section className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleSubmit}
            disabled={saving || formLocked || disabledSubmission}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกคำขอสอบ"}
          </button>
          {!meetingRequirement.satisfied && !formLocked ? (
            <div className={styles.buttonHint}>
              บันทึกการพบอาจารย์ยังไม่ครบ ({meetingRequirement.approved}/{meetingRequirement.required} ครั้ง){" "}
              <Link href="/project/phase1/meeting-logbook" className={styles.link}>ไปบันทึกการพบ →</Link>
            </div>
          ) : formLocked ? (
            <p className={styles.noticeInline}>คำขออยู่ระหว่างดำเนินการ — ไม่สามารถแก้ไขได้</p>
          ) : null}
        </section>

        <RejectionDetailModal
          isOpen={rejectionModalOpen}
          onClose={closeRejectionModal}
          title="รายละเอียดการปฏิเสธคำขอสอบ"
          rejectorName={rejectedApproval?.teacher?.name ? String(rejectedApproval.teacher.name) : "อาจารย์ที่ปรึกษา"}
          rejectedAt={rejectedApproval?.approvedAt ? String(rejectedApproval.approvedAt) : request?.updatedAt ? String(request.updatedAt) : null}
          reason={rejectedApproval?.note ? String(rejectedApproval.note) : null}
          guidance="กรุณาตรวจสอบข้อมูลและแก้ไขแล้วส่งคำขอสอบโครงงานพิเศษใหม่"
        />
      </div>
    </RoleGuard>
  );
}
