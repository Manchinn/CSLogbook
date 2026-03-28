"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { RejectionDetailModal } from "@/components/common/RejectionDetailModal";
import { RejectionNotice } from "@/components/common/RejectionNotice";
import { approvalStatusLabel } from "@/lib/utils/statusLabels";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useCurrentCS05 } from "@/hooks/useCurrentCS05";
import { useAcceptanceLetterStatus } from "@/hooks/useInternshipCompanyInfo";
import {
  useCertificateStatus,
  useDownloadCertificate,
  usePreviewCertificate,
  useSubmitCertificateRequest,
} from "@/hooks/useInternshipCertificate";
import type { InternshipCertificateStatus } from "@/lib/services/internshipCertificateService";
import styles from "./certificate.module.css";

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return dateFormatter.format(d);
}

function formatHours(value?: number | null) {
  if (value === null || value === undefined) return "0";
  return value.toLocaleString("th-TH", { maximumFractionDigits: 1 });
}

type GuardMessage = {
  title: string;
  body: string;
  tone?: "warning" | "danger" | "info";
};

type StatusLabel = {
  text: string;
  tone: "positive" | "warning" | "danger" | "info" | "muted";
};

function statusLabel(status: string | null | undefined): StatusLabel {
  switch (status) {
    case "ready":
    case "approved":
      return { text: "พร้อมดาวน์โหลด", tone: "positive" };
    case "pending":
      return { text: "รอการดำเนินการ", tone: "warning" };
    case "not_requested":
      return { text: "ยังไม่ส่งคำขอ", tone: "muted" };
    default:
      return { text: status || "ไม่ทราบสถานะ", tone: "info" };
  }
}

function toneClass(tone: GuardMessage["tone"]) {
  if (tone === "warning") return styles.calloutWarning;
  if (tone === "danger") return styles.calloutDanger;
  if (tone === "info") return styles.calloutInfo;
  return "";
}

function badgeTone(tone: StatusLabel["tone"]) {
  if (tone === "positive") return styles.badgePositive;
  if (tone === "warning") return styles.badgeWarning;
  if (tone === "danger") return styles.badgeDanger;
  if (tone === "info") return styles.badgeInfo;
  return styles.badgeMuted;
}

function computeProgress(requirements: InternshipCertificateStatus["requirements"]): number {
  const required = requirements?.totalHours?.required ?? 240;
  const approved = requirements?.totalHours?.approved ?? 0;
  const hoursRatio = Math.min(approved / required, 1);
  const evaluationDone = requirements?.supervisorEvaluation?.completed ?? false;
  const base = hoursRatio * 0.5 + (evaluationDone ? 0.5 : 0);
  return Math.round(base * 100);
}

export default function InternshipCertificateView() {
  const { token, user } = useAuth();
  const hydrated = useHydrated();
  const queriesEnabled = hydrated && Boolean(token);

  const cs05Query = useCurrentCS05(token, queriesEnabled);
  const cs05 = cs05Query.data;
  const documentId = cs05?.documentId ?? null;
  const cs05Status = cs05?.status ?? null;

  const acceptanceQuery = useAcceptanceLetterStatus(
    token,
    documentId,
    queriesEnabled && Boolean(documentId)
  );
  const acceptanceStatus = acceptanceQuery.data?.acceptanceStatus ?? null;

  const certificateQuery = useCertificateStatus(
    token,
    queriesEnabled && Boolean(documentId)
  );
  const certificate = certificateQuery.data;

  const submitRequest = useSubmitCertificateRequest(token);
  const preview = usePreviewCertificate(token);
  const download = useDownloadCertificate(token);

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const openRejectionModal = useCallback(() => setRejectionModalOpen(true), []);
  const closeRejectionModal = useCallback(() => setRejectionModalOpen(false), []);

  const guard: GuardMessage | null = useMemo(() => {
    if (!hydrated) {
      return { title: "กำลังเตรียมข้อมูล", body: "กรุณารอสักครู่", tone: "info" };
    }
    if (cs05Query.isError) {
      return { title: "โหลดข้อมูลหนังสือคำร้องขอฝึกงานไม่สำเร็จ", body: "กรุณาลองใหม่หรือติดต่อเจ้าหน้าที่", tone: "danger" };
    }
    if (!cs05 && !cs05Query.isLoading) {
      return {
        title: "ยังไม่มีหนังสือคำร้องขอฝึกงาน",
        body: "ต้องยื่นคำร้องและรออนุมัติจึงจะขอหนังสือรับรองได้",
        tone: "warning",
      };
    }
    if (cs05Status && cs05Status !== "approved") {
      const body = cs05Status === "pending"
        ? "หนังสือคำร้องขอฝึกงานอยู่ระหว่างการพิจารณา"
        : cs05Status === "rejected"
        ? "หนังสือคำร้องขอฝึกงานไม่ได้รับการอนุมัติ"
        : "หนังสือคำร้องขอฝึกงานยังไม่พร้อมสำหรับขั้นตอนนี้";
      return { title: "ยังไม่ผ่านเงื่อนไขหนังสือคำร้องขอฝึกงาน", body, tone: cs05Status === "rejected" ? "danger" : "warning" };
    }
    if (!documentId) {
      return { title: "กำลังโหลดข้อมูลฝึกงาน", body: "กรุณารอสักครู่", tone: "info" };
    }
    if (acceptanceQuery.isError) {
      return { title: "ตรวจสอบหนังสือตอบรับไม่สำเร็จ", body: "กรุณาลองใหม่", tone: "danger" };
    }
    if (acceptanceQuery.isLoading) {
      return { title: "กำลังตรวจสอบหนังสือตอบรับ", body: "รอสักครู่", tone: "info" };
    }
    if (acceptanceStatus !== "approved") {
      const body = acceptanceStatus === "pending"
        ? "หนังสือตอบรับอยู่ระหว่างการพิจารณา"
        : acceptanceStatus === "rejected"
        ? "หนังสือตอบรับไม่ได้รับการอนุมัติ"
        : "ต้องอัปโหลดหนังสือตอบรับจากบริษัทก่อน";
      return { title: "ยังไม่ผ่านเงื่อนไขหนังสือตอบรับ", body, tone: acceptanceStatus === "rejected" ? "danger" : "warning" };
    }
    return null;
  }, [acceptanceQuery.isError, acceptanceQuery.isLoading, acceptanceStatus, cs05, cs05Query.isError, cs05Query.isLoading, cs05Status, documentId, hydrated]);

  const requirements = certificate?.requirements;
  const approvedHours = requirements?.totalHours?.approved ?? 0;
  const totalHours = requirements?.totalHours?.current ?? 0;
  const requiredHours = requirements?.totalHours?.required ?? 240;
  const evaluationDone = requirements?.supervisorEvaluation?.completed ?? false;
  const summaryDone = requirements?.summarySubmission?.completed ?? false;
  const certificateStatus = certificate?.status ?? "not_requested";
  const statusMeta = statusLabel(certificateStatus);

  const canRequest =
    certificate?.canRequestCertificate &&
    acceptanceStatus === "approved" &&
    cs05Status === "approved";

  const progressPercent = computeProgress(requirements);

  const companyName =
    certificate?.companyInfo?.companyName || cs05?.companyName || "-";
  const internshipStart = certificate?.companyInfo?.internshipStartDate || cs05?.startDate;
  const internshipEnd = certificate?.companyInfo?.internshipEndDate || cs05?.endDate;

  const requestInfo = certificate?.certificateRequest;

  const loadingAny =
    certificateQuery.isLoading ||
    cs05Query.isLoading ||
    acceptanceQuery.isLoading;

  const actionBusy =
    submitRequest.isPending ||
    preview.isPending ||
    download.isPending;

  const handleSubmitRequest = async () => {
    if (!certificate) return;
    setActionMessage(null);
    setActionError(null);
    try {
      const payload = {
        studentId: user?.studentCode || user?.studentId?.toString() || "",
        requestDate: new Date().toISOString(),
        totalHours,
        approvedHours,
        evaluationStatus: evaluationDone ? "completed" : "pending",
        summaryStatus: summaryDone ? "submitted" : "ignored",
      };
      const res = await submitRequest.mutateAsync(payload);
      setActionMessage(res?.message || "ส่งคำขอแล้ว");
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถส่งคำขอได้";
      setActionError(message);
    }
  };

  const handlePreview = async () => {
    setActionMessage(null);
    setActionError(null);
    try {
      const res = await preview.mutateAsync();
      setActionMessage(res?.message || "เปิดตัวอย่างแล้ว");
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถเปิดตัวอย่างได้";
      setActionError(message);
    }
  };

  const handleDownload = async () => {
    setActionMessage(null);
    setActionError(null);
    try {
      const res = await download.mutateAsync();
      setActionMessage(res?.message || "ดาวน์โหลดหนังสือรับรองแล้ว");
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถดาวน์โหลดได้";
      setActionError(message);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Internship Certificate</p>
          <h1 className={styles.title}>หนังสือรับรองการฝึกงาน</h1>
          <p className={styles.lead}>
            ตรวจสอบคุณสมบัติ ส่งคำขอ และดาวน์โหลดหนังสือรับรองหลังได้รับอนุมัติ
          </p>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${badgeTone(statusMeta.tone)}`}>
              สถานะ: {statusMeta.text}
            </span>
            <span className={`${styles.badge} ${cs05Status === "approved" ? styles.badgePositive : styles.badgeWarning}`}>
              หนังสือคำร้องขอฝึกงาน: {approvalStatusLabel(cs05Status)}
            </span>
            <span className={`${styles.badge} ${acceptanceStatus === "approved" ? styles.badgePositive : styles.badgeWarning}`}>
              หนังสือตอบรับ: {approvalStatusLabel(acceptanceStatus)}
            </span>
          </div>
        </div>
        <div className={styles.heroActions}>
          {certificateStatus === "ready" || certificateStatus === "approved" ? (
            <div className={styles.actionStack}>
              <button
                className={styles.primaryButton}
                onClick={handleDownload}
                disabled={download.isPending || actionBusy}
              >
                {download.isPending ? "กำลังดาวน์โหลด..." : "ดาวน์โหลดหนังสือรับรอง"}
              </button>
              <button
                className={styles.secondaryButton}
                onClick={handlePreview}
                disabled={preview.isPending || actionBusy}
              >
                {preview.isPending ? "กำลังโหลดตัวอย่าง..." : "ดูตัวอย่าง PDF"}
              </button>
            </div>
          ) : (
            <button
              className={styles.primaryButton}
              onClick={handleSubmitRequest}
              disabled={!canRequest || submitRequest.isPending || Boolean(guard)}
            >
              {submitRequest.isPending ? "กำลังส่งคำขอ..." : "ส่งคำขอหนังสือรับรอง"}
            </button>
          )}
        </div>
      </header>

      {guard ? (
        <section className={`${styles.callout} ${toneClass(guard.tone)}`}>
          <div>
            <p className={styles.calloutTitle}>{guard.title}</p>
            <p className={styles.calloutText}>{guard.body}</p>
          </div>
          <div className={styles.calloutActions}>
            <Link className={styles.secondaryButton} href="/dashboard">กลับหน้าหลัก</Link>
            <Link className={styles.ghostButton} href="/internship-registration">ไปหน้าลงทะเบียนฝึกงาน</Link>
          </div>
        </section>
      ) : null}

      {cs05Status === "rejected" ? (
        <>
          <RejectionNotice
            status="rejected"
            details={cs05?.rejectionReason ?? cs05?.reviewComment ?? null}
            message="หนังสือคำร้องขอฝึกงานไม่ได้รับการอนุมัติ กรุณาตรวจสอบเหตุผลและแก้ไขแล้วส่งใหม่"
            actionText="กรุณาแก้ไขคำร้องแล้วยื่นใหม่ที่หน้าลงทะเบียนฝึกงาน"
            onViewDetails={cs05?.rejectionReason || cs05?.reviewComment ? openRejectionModal : undefined}
          />
          <RejectionDetailModal
            isOpen={rejectionModalOpen}
            onClose={closeRejectionModal}
            title="รายละเอียดการปฏิเสธหนังสือคำร้องขอฝึกงาน"
            rejectorName="เจ้าหน้าที่/อาจารย์"
            rejectedAt={null}
            reason={cs05?.rejectionReason ?? cs05?.reviewComment ?? null}
            guidance="กรุณาตรวจสอบข้อมูลและแก้ไขแล้วยื่นคำร้องใหม่ที่หน้าลงทะเบียนฝึกงาน"
          />
        </>
      ) : null}

      {certificateQuery.isError && (
        <section className={`${styles.callout} ${styles.calloutDanger}`}>
          <div>
            <p className={styles.calloutTitle}>โหลดสถานะหนังสือรับรองไม่สำเร็จ</p>
            <p className={styles.calloutText}>กรุณาลองใหม่หรือติดต่อเจ้าหน้าที่</p>
          </div>
        </section>
      )}

      {actionMessage || actionError ? (
        <section className={`${styles.callout} ${actionError ? styles.calloutDanger : styles.calloutInfo}`}>
          <p className={styles.calloutTitle}>{actionError ? "มีข้อผิดพลาด" : "เสร็จสิ้น"}</p>
          <p className={styles.calloutText}>{actionError || actionMessage}</p>
        </section>
      ) : null}

      <section className={styles.grid}>
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.panelKicker}>คุณสมบัติ</p>
              <h2 className={styles.cardTitle}>ความพร้อมในการขอหนังสือรับรอง</h2>
            </div>
            <span className={`${styles.badge} ${badgeTone(statusMeta.tone)}`}>{statusMeta.text}</span>
          </div>
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
            </div>
            <p className={styles.progressText}>{progressPercent}% ความพร้อม</p>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>ชั่วโมงอนุมัติ</p>
              <p className={styles.statValue}>{formatHours(approvedHours)} / {formatHours(requiredHours)} ชม.</p>
              <p className={styles.statHint}>รวมทั้งหมด {formatHours(totalHours)} ชม.</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>การประเมินผู้ควบคุมงาน</p>
              <p className={styles.statValue}>{evaluationDone ? "ครบถ้วน" : "รอประเมิน"}</p>
              <p className={styles.statHint}>ต้องได้รับการส่งแบบประเมิน</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>รายงานสรุปผล</p>
              <p className={styles.statValue}>{summaryDone ? "ส่งแล้ว" : "รอดำเนินการ"}</p>
              <p className={styles.statHint}>ระบบตรวจสอบการส่งแบบประเมินการฝึกงาน</p>
            </div>
          </div>
          <ul className={styles.requirementList}>
            <li className={approvedHours >= requiredHours ? styles.requirementDone : styles.requirementPending}>
              ชั่วโมงฝึกงานอนุมัติครบ {formatHours(approvedHours)} / {formatHours(requiredHours)}
            </li>
            <li className={evaluationDone ? styles.requirementDone : styles.requirementPending}>
              ผู้ควบคุมงานส่งการประเมิน
            </li>
            <li className={summaryDone ? styles.requirementDone : styles.requirementMuted}>
              ส่งรายงานสรุปผลการฝึกงาน
            </li>
          </ul>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.panelKicker}>คำขอ</p>
              <h2 className={styles.cardTitle}>สถานะคำขอหนังสือรับรอง</h2>
            </div>
            <span className={`${styles.badge} ${badgeTone(statusMeta.tone)}`}>{statusMeta.text}</span>
          </div>
          <div className={styles.timeline}>
            <div className={`${styles.timelineItem} ${certificateStatus !== "not_requested" ? styles.timelineDone : styles.timelineMuted}`}>
              <div className={styles.timelineDot} />
              <div>
                <p className={styles.timelineTitle}>ส่งคำขอ</p>
                <p className={styles.timelineText}>{requestInfo?.requestDate ? formatDate(requestInfo.requestDate) : "ยังไม่ส่ง"}</p>
              </div>
            </div>
            <div className={`${styles.timelineItem} ${certificateStatus === "pending" || certificateStatus === "ready" || certificateStatus === "approved" ? styles.timelineActive : styles.timelineMuted}`}>
              <div className={styles.timelineDot} />
              <div>
                <p className={styles.timelineTitle}>เจ้าหน้าที่ตรวจสอบ</p>
                <p className={styles.timelineText}>{certificateStatus === "pending" ? "กำลังดำเนินการ" : "รอดำเนินการ"}</p>
              </div>
            </div>
            <div className={`${styles.timelineItem} ${certificateStatus === "ready" || certificateStatus === "approved" ? styles.timelineDone : styles.timelineMuted}`}>
              <div className={styles.timelineDot} />
              <div>
                <p className={styles.timelineTitle}>พร้อมดาวน์โหลด</p>
                <p className={styles.timelineText}>{requestInfo?.processedDate ? formatDate(requestInfo.processedDate) : "รอการอนุมัติ"}</p>
              </div>
            </div>
          </div>
          <div className={styles.helperBox}>
            <p className={styles.helperTitle}>เวลาการดำเนินการ</p>
            <p className={styles.helperText}>เจ้าหน้าที่ภาควิชาจะใช้เวลาตรวจสอบประมาณ 3-5 วันทำการ หากมีปัญหาโปรดติดต่อภาควิชา</p>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.panelKicker}>ข้อมูลการฝึกงาน</p>
              <h2 className={styles.cardTitle}>สถานประกอบการ & ระยะเวลา</h2>
            </div>
          </div>
          <div className={styles.infoGrid}>
            <div>
              <p className={styles.infoLabel}>สถานประกอบการ</p>
              <p className={styles.infoValue}>{companyName}</p>
            </div>
            <div>
              <p className={styles.infoLabel}>ช่วงฝึกงาน</p>
              <p className={styles.infoValue}>{formatDate(internshipStart)} - {formatDate(internshipEnd)}</p>
            </div>
            <div>
              <p className={styles.infoLabel}>สถานะ</p>
              <p className={styles.infoValue}>{statusMeta.text}</p>
            </div>
          </div>
        </article>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.panelKicker}>แนวทาง</p>
            <h2 className={styles.cardTitle}>ขั้นตอนสั้น ๆ</h2>
          </div>
        </div>
        <div className={styles.stepGrid}>
          <div className={styles.stepCard}>
            <p className={styles.stepNumber}>01</p>
            <p className={styles.stepTitle}>บันทึกชั่วโมงและส่งแบบประเมิน</p>
            <p className={styles.stepText}>ต้องมีชั่วโมงที่พี่เลี้ยงอนุมัติครบ {requiredHours} ชั่วโมงและได้รับการประเมิน</p>
          </div>
          <div className={styles.stepCard}>
            <p className={styles.stepNumber}>02</p>
            <p className={styles.stepTitle}>ส่งคำขอหนังสือรับรอง</p>
            <p className={styles.stepText}>เมื่อผ่านเงื่อนไขแล้วกดปุ่ม &quot;ส่งคำขอ&quot; ระบบจะส่งข้อมูลให้เจ้าหน้าที่</p>
          </div>
          <div className={styles.stepCard}>
            <p className={styles.stepNumber}>03</p>
            <p className={styles.stepTitle}>ดาวน์โหลด PDF</p>
            <p className={styles.stepText}>หลังสถานะเป็นพร้อมดาวน์โหลด สามารถดูตัวอย่างหรือดาวน์โหลดได้ทันที</p>
          </div>
        </div>
      </section>

      {loadingAny && (
        <p className={styles.loadingText}>กำลังโหลดข้อมูลล่าสุด...</p>
      )}
    </div>
  );
}
