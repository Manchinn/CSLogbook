"use client";

import { useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";
import { useStudentInternshipStatus } from "@/hooks/useStudentInternshipStatus";
import { useStudentDeadlines } from "@/hooks/useStudentDeadlines";
import { useWorkflowTimeline } from "@/hooks/useWorkflowTimeline";
import { useCurrentCS05 } from "@/hooks/useCurrentCS05";
import { useReferralLetterStatus, useDownloadReferralLetter } from "@/hooks/useInternshipReferralLetter";
import { useDownloadCooperationLetter } from "@/hooks/useInternshipCooperationLetter";
import { useAcceptanceLetterStatus, useUploadAcceptanceLetter } from "@/hooks/useInternshipCompanyInfo";
import { WorkflowTimeline } from "@/components/workflow/WorkflowTimeline";
import { labelStatus } from "@/lib/utils/statusLabels";
import styles from "./flow.module.css";

/** CS05 status ที่แสดง download panel (ทุก status หลัง approved ขึ้นไป) */
const STATUSES_WITH_DOWNLOADS = new Set([
  "approved",
  "acceptance_pending",
  "acceptance_approved",
  "referral_letter_pending",
  "referral_letter_ready",
  "active",
  "completed",
  // รองรับ status ทั่วไปของ Document model
  "supervisor_approved",
  "supervisor_evaluated",
]);

const acceptanceTemplateUrl =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/internship/acceptance-letter-template`
    : "/api/internship/acceptance-letter-template";

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return dateFormatter.format(d);
}

type InternshipFlowContentProps = Record<string, never>;

export default function InternshipFlowContent({}: InternshipFlowContentProps) {
  const { token, user } = useAuth();
  const hydrated = useHydrated();
  const studentId = user?.studentId ?? user?.id;
  const queriesEnabled = hydrated && Boolean(token) && Boolean(studentId);

  const {
    data: eligibility,
    isLoading: eligibilityLoading,
    error: eligibilityError,
  } = useStudentEligibility(token, queriesEnabled);
  const {
    data: internshipStatus,
    isLoading: internshipLoading,
    error: internshipError,
  } = useStudentInternshipStatus(token, queriesEnabled);
  const {
    data: timeline,
    isLoading: timelineLoading,
    error: timelineError,
  } = useWorkflowTimeline(token, "internship", studentId ?? null, queriesEnabled);
  const {
    data: deadlines,
    isLoading: deadlinesLoading,
    error: deadlinesError,
  } = useStudentDeadlines(token, 21, queriesEnabled);

  const filteredDeadlines = useMemo(() => {
    if (!deadlines) return [];
    return deadlines
      .filter((d) => !d.relatedTo || d.relatedTo.toLowerCase().includes("internship"))
      .slice(0, 4);
  }, [deadlines]);

  // จำกัด timeline แสดงถึง step 6 (ได้รับหนังสือตอบรับแล้ว) — full timeline อยู่ใน student-profile
  const limitedTimeline = useMemo(() => {
    if (!timeline) return null;
    const maxStep = 6;
    const limitedSteps = timeline.steps.filter((s) => (s.order ?? 0) <= maxStep);
    const completedCount = limitedSteps.filter((s) => s.completed).length;
    const progress = limitedSteps.length > 0
      ? Math.round((completedCount / limitedSteps.length) * 100)
      : 0;
    return {
      ...timeline,
      steps: limitedSteps,
      progress: Math.min(progress, 100),
      totalStepsDisplay: limitedSteps.length,
      currentStepDisplay: Math.min(timeline.currentStepDisplay, maxStep),
    };
  }, [timeline]);

  const eligibilityStatus = eligibility?.status.internship;
  const summary = internshipStatus?.summary;
  const checkingEligibility = !hydrated || !queriesEnabled || eligibilityLoading;

  // รวม eligibility เป็นค่าเดียว — ต้องผ่านทั้ง canAccess + canRegister
  const eligibilityValue = checkingEligibility
    ? "กำลังตรวจสอบ..."
    : eligibilityError
      ? "ตรวจสอบไม่สำเร็จ"
      : eligibilityStatus?.canAccess && eligibilityStatus?.canRegister
        ? "พร้อมลงทะเบียน"
        : eligibilityStatus?.canAccess
          ? "ผ่านเกณฑ์เข้าระบบ รอตรวจสอบสิทธิ์ลงทะเบียน"
          : "ยังไม่ผ่านเกณฑ์";
  const eligibilityHint = eligibilityError
    ? "โปรดลองใหม่ภายหลัง"
    : eligibilityStatus?.registrationReason ?? eligibilityStatus?.reason ?? "ระบบจะอัปเดตสิทธิ์อัตโนมัติ";

  // ดึงข้อมูล CS05 โดยตรง — ไม่มี pre-check เรื่อง acceptance letter
  // (ใช้ summary.documentId ไม่ได้ เพราะ /internship/summary จะ throw เมื่อ acceptance letter ยังไม่ approved)
  const { data: cs05Data } = useCurrentCS05(token, queriesEnabled);

  // แสดง download panel ทันทีแต่ CS05 ได้รับการอนุมัติ (ไม่ต้องรอ acceptance letter approved)
  const documentId = cs05Data?.documentId ?? null;
  const showDownloadPanel =
    Boolean(documentId) && STATUSES_WITH_DOWNLOADS.has(cs05Data?.status ?? "");

  // ดึงสถานะหนังสือส่งตัว — เปิดใช้เฉพาะเมื่อ showDownloadPanel = true
  const { data: referralStatus, isLoading: referralLoading } = useReferralLetterStatus(
    token,
    documentId,
    queriesEnabled && showDownloadPanel
  );
  const downloadReferralMutation = useDownloadReferralLetter(token);
  const downloadCooperationMutation = useDownloadCooperationLetter(token);

  // สถานะหนังสือตอบรับ + upload mutation
  const { data: acceptanceStatus } = useAcceptanceLetterStatus(
    token,
    documentId,
    queriesEnabled && showDownloadPanel
  );
  const uploadAcceptanceMutation = useUploadAcceptanceLetter(token);

  // state สำหรับ file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Internship Registration</p>
          <h1 className={styles.title}>ลงทะเบียนฝึกงาน</h1>
        </div>
      </header>

      {/* Status Cards — 2 cards: สิทธิ์ + สถานะฝึกงาน */}
      <section className={styles.grid}>
        <article className={styles.card}>
          <p className={styles.cardLabel}>สิทธิ์การลงทะเบียน</p>
          <p className={styles.cardValue}>{eligibilityValue}</p>
          <p className={styles.cardHint}>{eligibilityHint}</p>
        </article>
        <article className={styles.card}>
          <p className={styles.cardLabel}>สถานะฝึกงาน</p>
          <p className={styles.cardValue}>
            {internshipLoading ? "กำลังโหลด..." : labelStatus(summary?.status, "ไม่พบข้อมูล")}
          </p>
          <p className={styles.cardHint}>
            {internshipError ? "โหลดข้อมูลไม่สำเร็จ" : summary?.companyName || "ยังไม่เลือกสถานประกอบการ"}
          </p>
        </article>
      </section>

      {/* เดดไลน์ — compact row (แสดงเฉพาะเมื่อมีข้อมูล) */}
      {!deadlinesLoading && !deadlinesError && filteredDeadlines.length > 0 && (
        <section className={styles.deadlineBar}>
          <p className={styles.deadlineBarTitle}>กำหนดส่งที่ใกล้ถึง</p>
          <ul className={styles.deadlineList}>
            {filteredDeadlines.map((deadline) => (
              <li key={deadline.id} className={styles.deadlineItem}>
                <div>
                  <p className={styles.deadlineName}>{deadline.name}</p>
                  <p className={styles.deadlineMeta}>
                    เหลือ {deadline.daysLeft ?? "-"} วัน
                  </p>
                </div>
                <span className={styles.deadlineDate}>{formatDate(deadline.deadlineAt ?? deadline.deadlineDate)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ข้อมูลคำร้อง คพ.05 — บริษัท + ช่วงฝึกงาน */}
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelKicker}>คำร้องฝึกงาน</p>
            <h2 className={styles.panelTitle}>ข้อมูลใบคำร้อง คพ.05</h2>
          </div>
        </div>

        {internshipError ? <p className={styles.error}>โหลดข้อมูลฝึกงานไม่สำเร็จ</p> : null}
        {internshipLoading ? <div className={styles.skeleton} /> : null}

        {summary ? (
          <dl className={styles.metaGrid}>
            <div>
              <dt>บริษัท</dt>
              <dd>{summary.companyName || "-"}</dd>
            </div>
            <div>
              <dt>ที่อยู่</dt>
              <dd>{summary.companyAddress || "-"}</dd>
            </div>
            <div>
              <dt>ช่วงฝึกงาน</dt>
              <dd>
                {formatDate(summary.startDate)} - {formatDate(summary.endDate)}
              </dd>
            </div>
          </dl>
        ) : (
          !internshipLoading && <p className={styles.cardHint}>ยังไม่มีคำร้อง คพ.05 ที่ระบบรับรู้</p>
        )}
      </section>

      {/* ========= ดาวน์โหลดเอกสาร (แสดงเฉพาะเมื่อ CS05 อนุมัติแล้ว) ========= */}
      {showDownloadPanel && (
        <section className={styles.downloadPanel}>
          <p className={styles.downloadPanelKicker}>เอกสารฝึกงาน</p>
          <h2 className={styles.downloadPanelTitle}>ดาวน์โหลดและอัปโหลดเอกสาร</h2>
          <p className={styles.cardHint}>
            ดาวน์โหลดหนังสือขอความอนุเคราะห์เพื่อนำไปยื่นต่อสถานประกอบการ พร้อมแบบฟอร์มหนังสือตอบรับ
          </p>

          <div className={styles.downloadBtnRow}>
            {/* ปุ่ม 1: ดาวน์โหลดหนังสือขอความอนุเคราะห์ — enable ทันทีหลัง CS05 approved */}
            <button
              type="button"
              className={styles.downloadBtn}
              disabled={downloadCooperationMutation.isPending}
              onClick={() => documentId && downloadCooperationMutation.mutate(documentId)}
            >
              {downloadCooperationMutation.isPending ? "กำลังดาวน์โหลด..." : "ดาวน์โหลดหนังสือขอความอนุเคราะห์ฝึกงาน"}
            </button>

            {/* ปุ่ม 2: ดาวน์โหลดแบบฟอร์มหนังสือตอบรับ (เปิดได้เสมอ) */}
            <button
              type="button"
              className={styles.downloadBtnSecondary}
              onClick={() => window.open(acceptanceTemplateUrl, "_blank")}
            >
              ดาวน์โหลดแบบฟอร์มหนังสือตอบรับ
            </button>

            {/* ปุ่ม 3: ดาวน์โหลดหนังสือส่งตัว — enable หลัง acceptance approved */}
            {referralStatus?.isReady ? (
              <button
                type="button"
                className={styles.downloadBtn}
                disabled={downloadReferralMutation.isPending}
                onClick={() => documentId && downloadReferralMutation.mutate(documentId)}
              >
                {downloadReferralMutation.isPending ? "กำลังดาวน์โหลด..." : "ดาวน์โหลดหนังสือส่งตัวฝึกงาน"}
              </button>
            ) : (
              <span className={styles.downloadBtnDisabled}>
                ดาวน์โหลดหนังสือส่งตัวฝึกงาน
                <span className={styles.downloadBadge}>
                  {referralLoading
                    ? "กำลังตรวจสอบ"
                    : referralStatus?.missingRequirements?.length
                      ? referralStatus.missingRequirements[0]
                      : "รอหนังสือตอบรับอนุมัติ"}
                </span>
              </span>
            )}
          </div>

          {/* แสดง error ถ้าดาวน์โหลดไม่สำเร็จ */}
          {downloadCooperationMutation.isError && (
            <p className={styles.downloadError}>
              {downloadCooperationMutation.error?.message ?? "ดาวน์โหลดหนังสือขอความอนุเคราะห์ไม่สำเร็จ กรุณาลองใหม่"}
            </p>
          )}
          {downloadReferralMutation.isError && (
            <p className={styles.downloadError}>
              {downloadReferralMutation.error?.message ?? "ดาวน์โหลดหนังสือส่งตัวไม่สำเร็จ กรุณาลองใหม่"}
            </p>
          )}

          {/* ===== อัปโหลดหนังสือตอบรับ ===== */}
          <div className={styles.uploadDivider} />
          <p className={styles.uploadSectionTitle}>อัปโหลดหนังสือตอบรับจากสถานประกอบการ</p>

          {/* แสดงสถานะปัจจุบัน */}
          {acceptanceStatus && (
            <div className={styles.uploadStatusRow}>
              <span className={styles.uploadStatusLabel}>สถานะปัจจุบัน:</span>
              <span
                className={
                  acceptanceStatus.acceptanceStatus === "approved"
                    ? styles.statusBadgeApproved
                    : acceptanceStatus.acceptanceStatus === "rejected"
                      ? styles.statusBadgeRejected
                      : acceptanceStatus.acceptanceStatus === "pending"
                        ? styles.statusBadgePending
                        : styles.statusBadgeDefault
                }
              >
                {acceptanceStatus.acceptanceStatus === "approved"
                  ? "อนุมัติแล้ว"
                  : acceptanceStatus.acceptanceStatus === "rejected"
                    ? "ไม่ผ่าน"
                    : acceptanceStatus.acceptanceStatus === "pending"
                      ? "รอตรวจสอบ"
                      : "ยังไม่อัปโหลด"}
              </span>
              {acceptanceStatus.fileName && (
                <span className={styles.uploadFileName}>{acceptanceStatus.fileName}</span>
              )}
            </div>
          )}

          {/* เหตุผลที่ไม่ผ่าน (rejection reason) */}
          {acceptanceStatus?.acceptanceStatus === "rejected" &&
            acceptanceStatus.rejectionReason && (
              <p className={styles.downloadError}>
                เหตุผล: {acceptanceStatus.rejectionReason}
              </p>
            )}

          {/* แสดง file picker + upload button เมื่อยังไม่ approved */}
          {acceptanceStatus?.acceptanceStatus !== "approved" && (
            <div className={styles.uploadRow}>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className={styles.fileInputHidden}
                aria-label="เลือกไฟล์หนังสือตอบรับ PDF"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                className={styles.downloadBtnSecondary}
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? selectedFile.name : "เลือกไฟล์ PDF"}
              </button>
              <button
                type="button"
                className={selectedFile ? styles.downloadBtn : styles.downloadBtnDisabled}
                disabled={!selectedFile || uploadAcceptanceMutation.isPending}
                onClick={() => {
                  if (selectedFile && documentId) {
                    uploadAcceptanceMutation.mutate(
                      { documentId, file: selectedFile },
                      {
                        onSuccess: () => setSelectedFile(null),
                      }
                    );
                  }
                }}
              >
                {uploadAcceptanceMutation.isPending ? "กำลังอัปโหลด..." : "อัปโหลดหนังสือตอบรับ"}
              </button>
            </div>
          )}
          {uploadAcceptanceMutation.isSuccess && (
            <p className={styles.uploadSuccess}>อัปโหลดสำเร็จ รอเจ้าหน้าที่ตรวจสอบ</p>
          )}
          {uploadAcceptanceMutation.isError && (
            <p className={styles.downloadError}>
              {uploadAcceptanceMutation.error?.message ?? "อัปโหลดไม่สำเร็จ กรุณาลองใหม่"}
            </p>
          )}
        </section>
      )}

      <WorkflowTimeline
        title="ความคืบหน้าการลงทะเบียน"
        subtitle="ขั้นตอนตั้งแต่ยื่นคำร้องจนถึงได้รับหนังสือตอบรับ"
        timeline={limitedTimeline}
        isLoading={timelineLoading}
        error={timelineError ? "โหลดข้อมูลไม่สำเร็จ" : null}
      />
    </div>
  );
}
