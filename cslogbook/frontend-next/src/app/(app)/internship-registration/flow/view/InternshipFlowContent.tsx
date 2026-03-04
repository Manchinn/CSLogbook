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
import { useAcceptanceLetterStatus, useUploadAcceptanceLetter } from "@/hooks/useInternshipCompanyInfo";
import { WorkflowTimeline } from "@/components/workflow/WorkflowTimeline";
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

function formatHours(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("th-TH", { maximumFractionDigits: 1 });
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

  const eligibilityStatus = eligibility?.status.internship;
  const summary = internshipStatus?.summary;
  const stats = internshipStatus?.stats;
  const certificate = internshipStatus?.certificateStatus;
  const checkingEligibility = !hydrated || !queriesEnabled || eligibilityLoading;

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

  const cards = [
    {
      label: "สิทธิ์เข้าระบบ",
      value: checkingEligibility
        ? "กำลังตรวจสอบ..."
        : eligibilityError
          ? "ตรวจสอบไม่สำเร็จ"
          : eligibilityStatus?.canAccess
            ? "ผ่าน"
            : "ยังไม่ผ่าน",
      hint: eligibilityError ? "โปรดลองใหม่ภายหลัง" : eligibilityStatus?.reason ?? "ตรวจสอบข้อมูลสิทธิ์จากระบบ",
    },
    {
      label: "สิทธิ์ลงทะเบียน",
      value: checkingEligibility
        ? "กำลังตรวจสอบ..."
        : eligibilityError
          ? "ตรวจสอบไม่สำเร็จ"
          : eligibilityStatus?.canRegister
            ? "พร้อมลงทะเบียน"
            : "รอตรวจสอบ",
      hint: eligibilityError
        ? "โปรดลองใหม่ภายหลัง"
        : eligibilityStatus?.registrationReason ?? "ระบบจะอัปเดตสิทธิ์อัตโนมัติ",
    },
    {
      label: "สถานะฝึกงาน",
      value: internshipLoading ? "กำลังโหลด..." : summary?.status ?? "ไม่พบข้อมูล",
      hint: internshipError ? "โหลดข้อมูลไม่สำเร็จ" : summary?.companyName || "ยังไม่เลือกสถานประกอบการ",
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Internship Registration</p>
          <h1 className={styles.title}>ลงทะเบียนฝึกงาน</h1>
          
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

      <section className={styles.stepGrid}>
        <article className={styles.stepCard}>
          <p className={styles.stepNumber}>01</p>
          <p className={styles.stepTitle}>กรอกข้อมูล คพ.05</p>
          <p className={styles.stepText}>กรอกข้อมูลบริษัท นักศึกษา และอัปโหลดเอกสารประกอบให้ครบถ้วน</p>
        </article>
        <article className={styles.stepCard}>
          <p className={styles.stepNumber}>02</p>
          <p className={styles.stepTitle}>ตรวจสอบข้อมูล</p>
          <p className={styles.stepText}>ตรวจสอบความถูกต้องก่อนยืนยันส่งคำร้องเข้าระบบ</p>
        </article>
        <article className={styles.stepCard}>
          <p className={styles.stepNumber}>03</p>
          <p className={styles.stepTitle}>ส่งคำร้อง</p>
          <p className={styles.stepText}>ระบบจะส่งคำร้องให้เจ้าหน้าที่ตรวจสอบและอนุมัติ</p>
        </article>
      </section>

      <section className={styles.split}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelKicker}>สถานประกอบการ</p>
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
              <div>
                <dt>ผู้ควบคุมงาน</dt>
                <dd>
                  {summary.supervisorName || "-"}
                  {summary.supervisorPosition ? ` (${summary.supervisorPosition})` : ""}
                </dd>
              </div>
              <div>
                <dt>ชั่วโมงที่บันทึก</dt>
                <dd>
                  {formatHours(stats?.totalHours ?? summary.totalHours)} ชม. (อนุมัติแล้ว {formatHours(stats?.approvedBySupervisor ?? summary.approvedHours)} ชม.)
                </dd>
              </div>
              <div>
                <dt>ใบรับรอง</dt>
                <dd>{certificate?.status ?? "ยังไม่ร้องขอ"}</dd>
              </div>
            </dl>
          ) : (
            !internshipLoading && <p className={styles.cardHint}>ยังไม่มีคำร้อง คพ.05 ที่ระบบรับรู้</p>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelKicker}>กำหนดส่ง</p>
              <h2 className={styles.panelTitle}>เดดไลน์ที่เกี่ยวข้อง</h2>
            </div>
          </div>
          {filteredDeadlines.length === 0 ? (
            deadlinesLoading ? (
              <p className={styles.cardHint}>กำลังโหลดเดดไลน์...</p>
            ) : deadlinesError ? (
              <p className={styles.error}>โหลดเดดไลน์ไม่สำเร็จ</p>
            ) : (
              <p className={styles.cardHint}>ยังไม่พบกำหนดส่งที่เกี่ยวข้องใน 21 วัน</p>
            )
          ) : (
            <ul className={styles.deadlineList}>
              {filteredDeadlines.map((deadline) => (
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

      {/* ========= Step 4: ดาวน์โหลดเอกสาร (แสดงเฉพาะเมื่อ CS05 อนุมัติแล้ว) ========= */}
      {showDownloadPanel && (
        <section className={styles.downloadPanel}>
          <p className={styles.downloadPanelKicker}>Step 4 — รอหนังสือตอบรับ</p>
          <h2 className={styles.downloadPanelTitle}>เอกสารที่ต้องดาวน์โหลด</h2>
          <p className={styles.cardHint}>
            ดาวน์โหลดหนังสือส่งตัวเพื่อนำไปยื่นต่อสถานประกอบการ และดาวน์โหลดแบบฟอร์มหนังสือตอบรับ
          </p>

          <div className={styles.downloadBtnRow}>
            {/* ปุ่มดาวน์โหลดหนังสือส่งตัวนักศึกษา */}
            {referralStatus?.isReady ? (
              <button
                type="button"
                className={styles.downloadBtn}
                disabled={downloadReferralMutation.isPending}
                onClick={() => documentId && downloadReferralMutation.mutate(documentId)}
              >
                {downloadReferralMutation.isPending ? "กำลังดาวน์โหลด..." : "ดาวน์โหลดหนังสือขอความอนุเคราะห์ฝึกงาน"}
              </button>
            ) : (
              <span className={styles.downloadBtnDisabled}>
                ดาวน์โหลดหนังสือขอความอนุเคราะห์ฝึกงาน
                <span className={styles.downloadBadge}>
                  {referralLoading ? "กำลังตรวจสอบ" : "รอออกหนังสือ"}
                </span>
              </span>
            )}

            {/* ปุ่มดาวน์โหลดแบบฟอร์มหนังสือตอบรับ (เปิดได้เสมอ) */}
            <button
              type="button"
              className={styles.downloadBtnSecondary}
              onClick={() => window.open(acceptanceTemplateUrl, "_blank")}
            >
              ดาวน์โหลดแบบฟอร์มหนังสือตอบรับ
            </button>
          </div>

          {/* แสดง error ถ้าดาวน์โหลดไม่สำเร็จ */}
          {downloadReferralMutation.isError && (
            <p className={styles.downloadError}>
              {downloadReferralMutation.error?.message ?? "ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่"}
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
                  ? "✓ อนุมัติแล้ว"
                  : acceptanceStatus.acceptanceStatus === "rejected"
                    ? "✗ ไม่ผ่าน"
                    : acceptanceStatus.acceptanceStatus === "pending"
                      ? "⏳ รอตรวจสอบ"
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
        title="Timeline ฝึกงาน"
        subtitle="ข้อมูลจาก workflow/timeline และสถานะล่าสุด"
        timeline={timeline}
        isLoading={timelineLoading}
        error={timelineError ? "โหลด timeline ไม่สำเร็จ" : null}
      />
    </div>
  );
}
