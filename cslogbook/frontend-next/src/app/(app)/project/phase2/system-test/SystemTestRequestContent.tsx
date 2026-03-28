"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Phase2GateWarning } from "@/components/common/Phase2GateWarning";
import { RejectionDetailModal } from "@/components/common/RejectionDetailModal";
import { RejectionNotice } from "@/components/common/RejectionNotice";
import { RequestTimeline, type TimelineItem } from "@/components/common/RequestTimeline";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";
import { useStudentProjectDetail } from "@/hooks/useStudentProjectDetail";
import { getPhase2GateReasons } from "@/lib/project/phase2Gate";
import {
  getSystemTestRequest,
  submitSystemTestRequest,
  uploadSystemTestEvidence,
  type SystemTestRequest,
} from "@/lib/services/projectService";
import { formatDate } from "@/lib/utils/formatDateTime";
import { statusTone } from "@/lib/utils/statusLabels";
import { toneClassName } from "@/lib/utils/toneStyles";
import styles from "@/styles/requestPage.module.css";

/** Context-specific labels สำหรับคำขอทดสอบระบบ */
const statusLabels: Record<string, string> = {
  pending_advisor: "รออาจารย์ที่ปรึกษาอนุมัติ",
  advisor_rejected: "อาจารย์ไม่อนุมัติ",
  pending_staff: "รอเจ้าหน้าที่ภาควิชาตรวจสอบ",
  staff_rejected: "เจ้าหน้าที่ส่งกลับ",
  staff_approved: "เจ้าหน้าที่อนุมัติแล้ว",
  evidence_submitted: "ส่งหลักฐานแล้ว",
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function SystemTestRequestContent() {
  const router = useRouter();
  const { token } = useAuth();
  const hydrated = useHydrated();
  const [request, setRequest] = useState<SystemTestRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    note: "",
  });
  const [requestFile, setRequestFile] = useState<File | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceDriveLink, setEvidenceDriveLink] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queriesEnabled = hydrated && Boolean(token);
  const { data: project } = useStudentProjectDetail(token, queriesEnabled);
  const { data: eligibility } = useStudentEligibility(token, queriesEnabled);
  const phase2GateReasons = useMemo(
    () => getPhase2GateReasons({ project: project ?? null, eligibility: eligibility ?? null, formatDate }),
    [project, eligibility]
  );

  const loadRequest = useCallback(async () => {
    if (!token || !project?.projectId) return;
    setLoadingRequest(true);
    try {
      const data = await getSystemTestRequest(token, project.projectId);
      setRequest(data ?? null);
      if (data) {
        setForm({
          startDate: data.testStartDate ?? "",
          endDate: data.testDueDate ?? "",
          note: data.studentNote ?? "",
        });
      }
    } finally {
      setLoadingRequest(false);
    }
  }, [project?.projectId, token]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const allowNewRequest = useMemo(() => {
    if (!request) return true;
    return ["advisor_rejected", "staff_rejected"].includes(request.status ?? "");
  }, [request]);

  const canUploadEvidence = useMemo(() => {
    if (!request) return false;
    if (request.status !== "staff_approved") return false;
    return !request.evidence;
  }, [request]);

  const statusLabel = statusLabels[request?.status ?? ""] ?? "ยังไม่เคยส่งคำขอ";
  const statusClass = styles[toneClassName(statusTone(request?.status))];

  const timelineItems = useMemo(() => {
    const timeline = request?.timeline;
    if (!timeline) return [] as TimelineItem[];
    const items: TimelineItem[] = [];
    if (timeline.submittedAt) items.push({ key: "submitted", label: "ส่งคำขอ", timestamp: timeline.submittedAt });
    if (timeline.advisorDecidedAt) {
      items.push({ key: "advisor", label: "อาจารย์ที่ปรึกษาตัดสิน", timestamp: timeline.advisorDecidedAt });
    }
    if (timeline.coAdvisorDecidedAt) {
      items.push({ key: "co-advisor", label: "อาจารย์ร่วมตัดสิน", timestamp: timeline.coAdvisorDecidedAt });
    }
    if (timeline.staffDecidedAt) {
      items.push({ key: "staff", label: "เจ้าหน้าที่ตรวจสอบ", timestamp: timeline.staffDecidedAt });
    }
    if (timeline.evidenceSubmittedAt) {
      items.push({ key: "evidence", label: "อัปโหลดหลักฐาน", timestamp: timeline.evidenceSubmittedAt });
    }
    return items;
  }, [request?.timeline]);

  const rejectionInfo = useMemo(() => {
    if (!request) return null;
    const status = request.status ?? "";
    if (status === "advisor_rejected" && request.advisorDecision) {
      return {
        note: request.advisorDecision.note ?? null,
        name: request.advisorDecision.name ?? "อาจารย์ที่ปรึกษา",
        decidedAt: request.advisorDecision.decidedAt ?? request.updatedAt ?? null,
      };
    }
    if (status === "staff_rejected" && request.staffDecision) {
      return {
        note: request.staffDecision.note ?? null,
        name: "เจ้าหน้าที่ภาควิชา",
        decidedAt: request.updatedAt ?? null,
      };
    }
    return null;
  }, [request]);

  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const openRejectionModal = useCallback(() => setRejectionModalOpen(true), []);
  const closeRejectionModal = useCallback(() => setRejectionModalOpen(false), []);

  const dateRangeDays = useMemo(() => {
    if (!form.startDate || !form.endDate) return null;
    const s = new Date(form.startDate);
    const e = new Date(form.endDate);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
    return Math.floor((e.getTime() - s.getTime()) / ONE_DAY_MS);
  }, [form.startDate, form.endDate]);

  const handleSubmit = async () => {
    if (!token || !project?.projectId) return;
    if (!form.startDate || !form.endDate) {
      setErrorMessage("กรุณาระบุวันที่เริ่มและสิ้นสุดการทดสอบ");
      return;
    }

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setErrorMessage("วันที่ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    const diffDays = Math.floor((end.getTime() - start.getTime()) / ONE_DAY_MS);
    if (diffDays < 29) {
      setErrorMessage(`ระยะเวลาต้องไม่น้อยกว่า 30 วัน (ตอนนี้: ${diffDays} วัน — กรุณาปรับวันสิ้นสุด)`);
      return;
    }

    setErrorMessage(null);
    setSaving(true);
    try {
      const response = await submitSystemTestRequest(token, project.projectId, {
        testStartDate: form.startDate,
        testDueDate: form.endDate,
        studentNote: form.note,
        requestFile,
      });
      setRequest(response.data ?? null);
      setRequestFile(null);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadEvidence = async () => {
    if (!token || !project?.projectId) return;
    if (!evidenceFile && !evidenceDriveLink.trim()) return;
    if (evidenceDriveLink.trim() && !/^https?:\/\//.test(evidenceDriveLink.trim())) {
      setErrorMessage("ลิงก์ Google Drive ต้องเริ่มต้นด้วย http:// หรือ https://");
      return;
    }
    setErrorMessage(null);
    setUploading(true);
    try {
      const response = await uploadSystemTestEvidence(
        token,
        project.projectId,
        evidenceFile,
        { driveLink: evidenceDriveLink.trim() || undefined }
      );
      setRequest(response.data ?? null);
      setEvidenceFile(null);
      setEvidenceDriveLink("");
    } finally {
      setUploading(false);
    }
  };

  if (!project) {
    return <div className={styles.notice}>ยังไม่มีโครงงานสำหรับผู้ใช้งานคนนี้</div>;
  }

  return (
    <div className={styles.page}>
      <section className={styles.headerWithBack}>
        <div>
          <h1 className={styles.title}>ขอทดสอบระบบ 30 วัน</h1>
          <p className={styles.subtitle}>จัดการคำขอทดสอบระบบและอัปโหลดหลักฐานการประเมิน</p>
        </div>
        <button type="button" className={styles.secondaryButton} onClick={() => router.push("/project/phase2")}>
          กลับไปภาพรวม
        </button>
      </section>

      <Phase2GateWarning reasons={phase2GateReasons} />

      <RejectionNotice
        status={allowNewRequest && request ? String(request.status ?? "") : ""}
        details={rejectionInfo?.note ?? null}
        message="กรุณาตรวจสอบหมายเหตุในรายละเอียดการอนุมัติ และแก้ไขข้อมูลแล้วส่งใหม่ได้เลย"
        actionText="กรุณาแก้ไขข้อมูลแล้วส่งคำขอทดสอบระบบใหม่"
        onViewDetails={rejectionInfo ? openRejectionModal : undefined}
      />

      {errorMessage ? (
        <section className={styles.noticeError}>{errorMessage}</section>
      ) : null}

      <section className={styles.card}>
        <div className={styles.tagRow}>
          <span className={`${styles.tag} ${statusClass}`}>สถานะคำขอ: {statusLabel}</span>
          {request?.submittedLate ? <span className={styles.tagWarning}>ส่งช้า</span> : null}
        </div>
        <div className={styles.metaGrid}>
          <div>
            <p className={styles.metaLabel}>เริ่มทดสอบ</p>
            <p className={styles.metaValue}>{formatDate(request?.testStartDate)}</p>
          </div>
          <div>
            <p className={styles.metaLabel}>ครบกำหนด 30 วัน</p>
            <p className={styles.metaValue}>{formatDate(request?.testDueDate)}</p>
          </div>
          <div>
            <p className={styles.metaLabel}>หลักฐานการประเมิน</p>
            <p className={styles.metaValue}>{request?.evidenceSubmittedAt ? "อัปโหลดแล้ว" : "ยังไม่อัปโหลด"}</p>
          </div>
        </div>
        {request?.requestFile?.url ? (
          <a className={styles.link} href={request.requestFile.url} target="_blank" rel="noreferrer">
            เปิดไฟล์คำขอ
          </a>
        ) : null}
        {request?.evidence?.url ? (
          <a className={styles.link} href={request.evidence.url} target="_blank" rel="noreferrer">
            เปิดไฟล์หลักฐานการประเมิน
          </a>
        ) : null}
      </section>

      {(request?.advisorDecision || request?.coAdvisorDecision || request?.staffDecision) && (
        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>รายละเอียดการอนุมัติ</h3>
          <div className={styles.decisionList}>
            {request?.advisorDecision ? (
              <div className={styles.decisionItem}>
                <div>
                  <p className={styles.decisionTitle}>อาจารย์ที่ปรึกษา</p>
                  <p className={styles.decisionMeta}>{request.advisorDecision.name || "-"}</p>
                </div>
                <div>
                  <p className={styles.decisionMeta}>{request.advisorDecision.note || "ไม่มีหมายเหตุ"}</p>
                  <p className={styles.decisionMeta}>{formatDate(request.advisorDecision.decidedAt)}</p>
                </div>
              </div>
            ) : null}
            {request?.coAdvisorDecision ? (
              <div className={styles.decisionItem}>
                <div>
                  <p className={styles.decisionTitle}>อาจารย์ที่ปรึกษาร่วม</p>
                  <p className={styles.decisionMeta}>{request.coAdvisorDecision.name || "-"}</p>
                </div>
                <div>
                  <p className={styles.decisionMeta}>{request.coAdvisorDecision.note || "ไม่มีหมายเหตุ"}</p>
                  <p className={styles.decisionMeta}>{formatDate(request.coAdvisorDecision.decidedAt)}</p>
                </div>
              </div>
            ) : null}
            {request?.staffDecision ? (
              <div className={styles.decisionItem}>
                <div>
                  <p className={styles.decisionTitle}>เจ้าหน้าที่ภาควิชา</p>
                  <p className={styles.decisionMeta}>{request.staffDecision.note || "ไม่มีหมายเหตุ"}</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      <RequestTimeline
        items={timelineItems}
        loading={loadingRequest}
        emptyText="ยังไม่มีข้อมูลไทม์ไลน์"
        formatTimestamp={formatDate}
      />

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>บันทึกคำขอทดสอบระบบ</h3>
        <div className={styles.form}>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="system-test-start">วันที่เริ่มทดสอบ</label>
              <input
                type="date"
                id="system-test-start"
                value={form.startDate}
                onChange={(event) => {
                const newStart = event.target.value;
                const autoEnd = newStart
                  ? new Date(new Date(newStart).getTime() + 30 * ONE_DAY_MS)
                      .toISOString()
                      .slice(0, 10)
                  : "";
                setForm((prev) => ({ ...prev, startDate: newStart, endDate: autoEnd }));
              }}
                disabled={!allowNewRequest || phase2GateReasons.length > 0}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="system-test-end">
                วันสิ้นสุด 30 วัน
              </label>
              <input
                type="date"
                id="system-test-end"
                value={form.endDate}
                onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                disabled={!allowNewRequest || phase2GateReasons.length > 0}
              />
              {dateRangeDays !== null ? (
                <p className={`${styles.fieldHint} ${dateRangeDays < 29 ? styles.fieldHintError : ""}`}>
                  ระยะเวลา: {dateRangeDays} วัน{dateRangeDays >= 29 ? " ✓" : " (ต้องไม่น้อยกว่า 30 วัน)"}
                </p>
              ) : null}
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="system-test-note">หมายเหตุจากนักศึกษา</label>
            <textarea
              id="system-test-note"
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              disabled={!allowNewRequest || phase2GateReasons.length > 0}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="system-test-file">ไฟล์คำขอ (PDF)</label>
            <input
              type="file"
              id="system-test-file"
              accept="application/pdf"
              onChange={(event) => setRequestFile(event.target.files?.[0] ?? null)}
              disabled={!allowNewRequest || phase2GateReasons.length > 0}
            />
            {requestFile ? <p className={styles.fieldHint}>เลือกไฟล์: {requestFile.name}</p> : null}
          </div>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleSubmit}
            disabled={saving || !allowNewRequest || phase2GateReasons.length > 0}
          >
            {saving ? "กำลังบันทึก..." : "ส่งคำขอทดสอบระบบ"}
          </button>
          {loadingRequest ? <span className={styles.loadingText}>กำลังโหลดข้อมูลคำขอ...</span> : null}
        </div>
        {!allowNewRequest && request ? (
          <p className={styles.noticeInline}>คำขอนี้อยู่ระหว่างดำเนินการ — สามารถส่งใหม่ได้หลังถูกส่งกลับ</p>
        ) : phase2GateReasons.length > 0 ? (
          <p className={styles.buttonHint}>ปริญญานิพนธ์ยังไม่ปลดล็อก — ตรวจสอบเงื่อนไขด้านบน</p>
        ) : null}
      </section>

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>อัปโหลดหลักฐานการประเมิน</h3>
        <p className={styles.cardHint}>อัปโหลดได้เมื่อเจ้าหน้าที่อนุมัติคำขอแล้ว</p>
        <div className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="system-test-evidence">แนบหลักฐาน (PDF)</label>
            <input
              type="file"
              id="system-test-evidence"
              accept="application/pdf"
              onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)}
              disabled={!canUploadEvidence}
            />
            {evidenceFile ? <p className={styles.fieldHint}>เลือกไฟล์: {evidenceFile.name}</p> : null}
          </div>
          <div className={styles.field}>
            <label htmlFor="system-test-drive-link">ลิงก์ Google Drive (ทางเลือก — สำหรับไฟล์ขนาดใหญ่)</label>
            <input
              type="url"
              id="system-test-drive-link"
              placeholder="https://drive.google.com/..."
              value={evidenceDriveLink}
              onChange={(event) => setEvidenceDriveLink(event.target.value)}
              disabled={!canUploadEvidence}
            />
          </div>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleUploadEvidence}
            disabled={!canUploadEvidence || uploading || (!evidenceFile && !evidenceDriveLink.trim())}
          >
            {uploading ? "กำลังอัปโหลด..." : "อัปโหลดหลักฐาน"}
          </button>
        </div>
        {request?.evidenceDriveLink ? (
          <p className={styles.fieldHint}>
            ลิงก์ Google Drive:{" "}
            <a href={request.evidenceDriveLink} target="_blank" rel="noreferrer" className={styles.link}>
              {request.evidenceDriveLink}
            </a>
          </p>
        ) : null}
      </section>

      <RejectionDetailModal
        isOpen={rejectionModalOpen}
        onClose={closeRejectionModal}
        title="รายละเอียดการปฏิเสธคำขอทดสอบระบบ"
        rejectorName={rejectionInfo?.name ?? "-"}
        rejectedAt={rejectionInfo?.decidedAt ? String(rejectionInfo.decidedAt) : null}
        reason={rejectionInfo?.note ?? null}
        guidance="กรุณาตรวจสอบข้อมูลและแก้ไขแล้วส่งคำขอทดสอบระบบใหม่"
      />
    </div>
  );
}
