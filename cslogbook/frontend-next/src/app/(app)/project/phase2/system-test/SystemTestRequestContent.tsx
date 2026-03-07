"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { statusTone as sharedStatusTone } from "@/lib/utils/statusLabels";
import styles from "./systemTest.module.css";

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

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(d);
}

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
  const statusToneValue = sharedStatusTone(request?.status);
  const statusClass =
    statusToneValue === "success"
      ? styles.tagSuccess
      : statusToneValue === "warning"
        ? styles.tagWarning
        : statusToneValue === "danger"
          ? styles.tagDanger
          : statusToneValue === "info"
            ? styles.tagInfo
            : styles.tagDefault;

  const timelineItems = useMemo(() => {
    const timeline = request?.timeline;
    if (!timeline) return [] as Array<{ key: string; label: string; timestamp?: string | null }>;
    const items: Array<{ key: string; label: string; timestamp?: string | null }> = [];
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
    if (!token || !project?.projectId || !evidenceFile) return;
    setUploading(true);
    try {
      const response = await uploadSystemTestEvidence(token, project.projectId, evidenceFile);
      setRequest(response.data ?? null);
      setEvidenceFile(null);
    } finally {
      setUploading(false);
    }
  };

  if (!project) {
    return <div className={styles.notice}>ยังไม่มีโครงงานสำหรับผู้ใช้งานคนนี้</div>;
  }

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div>
          <h1 className={styles.title}>ขอทดสอบระบบ 30 วัน</h1>
          <p className={styles.subtitle}>จัดการคำขอทดสอบระบบและอัปโหลดหลักฐานการประเมิน</p>
        </div>
        <button type="button" className={styles.secondaryButton} onClick={() => router.push("/project/phase2")}> 
          กลับไปภาพรวม
        </button>
      </section>

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

      {allowNewRequest && request && ["advisor_rejected", "staff_rejected"].includes(String(request.status ?? "")) ? (
        <section className={styles.noticeRejection}>
          <p className={styles.noticeTitle}>
            {request.status === "advisor_rejected" ? "อาจารย์ส่งคำขอกลับแล้ว" : "เจ้าหน้าที่ส่งคำขอกลับแล้ว"}
          </p>
          <p>กรุณาตรวจสอบหมายเหตุในรายละเอียดการอนุมัติ และแก้ไขข้อมูลแล้วส่งใหม่ได้เลย</p>
        </section>
      ) : null}

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
          <h3>รายละเอียดการอนุมัติ</h3>
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

      {timelineItems.length > 0 ? (
        <section className={styles.card}>
          <h3>ไทม์ไลน์คำขอ</h3>
          <ul className={styles.timeline}>
            {timelineItems.map((item) => (
              <li key={item.key} className={styles.timelineItem}>
                <span className={styles.timelineDot} />
                <div>
                  <p className={styles.timelineTitle}>{item.label}</p>
                  <p className={styles.timelineMeta}>{formatDate(item.timestamp)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.card}>
        <h3>บันทึกคำขอทดสอบระบบ</h3>
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
        <h3>อัปโหลดหลักฐานการประเมิน</h3>
        <p className={styles.cardHint}>อัปโหลดได้เมื่อเจ้าหน้าที่อนุมัติคำขอแล้ว</p>
        <div className={styles.fieldRow}>
          <label htmlFor="system-test-evidence" className={styles.fieldLabel}>
            แนบหลักฐาน (PDF)
          </label>
          <input
            type="file"
            id="system-test-evidence"
            accept="application/pdf"
            onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)}
            disabled={!canUploadEvidence}
          />
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleUploadEvidence}
            disabled={!canUploadEvidence || uploading || !evidenceFile}
          >
            {uploading ? "กำลังอัปโหลด..." : "อัปโหลดหลักฐาน"}
          </button>
        </div>
        {evidenceFile ? <p className={styles.fieldHint}>เลือกไฟล์: {evidenceFile.name}</p> : null}
      </section>
    </div>
  );
}
