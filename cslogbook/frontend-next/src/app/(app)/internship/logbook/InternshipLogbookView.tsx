"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useCurrentCS05 } from "@/hooks/useCurrentCS05";
import { useAcceptanceLetterStatus } from "@/hooks/useInternshipCompanyInfo";
import {
  useInternshipDateRange,
  useInternshipWorkdays,
  useTimesheetEntries,
  useTimesheetMutations,
  useTimesheetStats,
} from "@/hooks/useInternshipLogbook";
import {
  useInternshipEvaluationStatus,
  useSendEvaluationRequest,
} from "@/hooks/useInternshipEvaluation";
import type { TimesheetEntry } from "@/lib/services/internshipLogbookService";
import { REQUIRED_INTERNSHIP_HOURS } from "@/lib/constants/internship";
import styles from "./logbook.module.css";

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });
const PAGE_SIZE = 10;

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

type GuardMessage = {
  title: string;
  body: string;
  tone?: "warning" | "danger" | "info";
};

type RowStatus = "empty" | "draft" | "submitted" | "approved";

type TimesheetRow = {
  date: string;
  entry: TimesheetEntry | null;
  status: RowStatus;
  hours: number | null;
};

function toneClass(tone: GuardMessage["tone"]) {
  if (tone === "warning") return styles.calloutWarning;
  if (tone === "danger") return styles.calloutDanger;
  if (tone === "info") return styles.calloutInfo;
  return "";
}

function badgeToneClass(status: RowStatus) {
  if (status === "approved") return styles.badgePositive;
  if (status === "submitted") return styles.badgeInfo;
  if (status === "draft") return styles.badgeWarning;
  return styles.badgeMuted;
}

function statusLabel(status: RowStatus) {
  switch (status) {
    case "approved":
      return "อนุมัติแล้ว";
    case "submitted":
      return "บันทึกแล้ว";
    case "draft":
      return "ร่าง";
    default:
      return "ยังไม่บันทึก";
  }
}

function calculateWorkHours(timeIn: string, timeOut: string) {
  const [hIn, mIn] = timeIn.split(":").map((v) => Number.parseInt(v, 10));
  const [hOut, mOut] = timeOut.split(":").map((v) => Number.parseInt(v, 10));
  if (Number.isNaN(hIn) || Number.isNaN(hOut) || Number.isNaN(mIn) || Number.isNaN(mOut)) return 0;
  const diffMinutes = hOut * 60 + mOut - (hIn * 60 + mIn);
  return diffMinutes > 0 ? Number((diffMinutes / 60).toFixed(2)) : 0;
}

export default function InternshipLogbookView() {
  const { token } = useAuth();
  const hydrated = useHydrated();
  const queriesEnabled = hydrated && Boolean(token);

  const cs05Query = useCurrentCS05(token, queriesEnabled);
  const cs05 = cs05Query.data;
  const documentId = cs05?.documentId ?? null;
  const cs05Status = cs05?.status ?? null;

  const acceptanceQuery = useAcceptanceLetterStatus(token, documentId, queriesEnabled && Boolean(documentId));
  const acceptanceStatus = acceptanceQuery.data?.acceptanceStatus ?? null;

  const statsQuery = useTimesheetStats(token, queriesEnabled && Boolean(documentId));
  const workdaysQuery = useInternshipWorkdays(token, queriesEnabled && Boolean(documentId));
  const entriesQuery = useTimesheetEntries(token, queriesEnabled && Boolean(documentId));
  const dateRangeQuery = useInternshipDateRange(token, queriesEnabled && Boolean(documentId));
  const { saveMutation, updateMutation } = useTimesheetMutations(token);

  const evaluationStatusQuery = useInternshipEvaluationStatus(token, queriesEnabled && Boolean(documentId));
  const sendEvaluationMutation = useSendEvaluationRequest(token, documentId);

  const [editingDate, setEditingDate] = useState<string | null>(null);
  const timeInRef = useRef<HTMLInputElement | null>(null);
  const [page, setPage] = useState(1);
  const [formState, setFormState] = useState({
    logTitle: "",
    workDescription: "",
    learningOutcome: "",
    problems: "",
    solutions: "",
    timeIn: "",
    timeOut: "",
    workHours: 0,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const guard: GuardMessage | null = useMemo(() => {
    if (!hydrated) {
      return { title: "กำลังเตรียมข้อมูล", body: "กรุณารอสักครู่", tone: "info" };
    }
    if (cs05Query.isError) {
      return { title: "โหลดข้อมูล คพ.05 ไม่สำเร็จ", body: "กรุณาลองใหม่หรือติดต่อเจ้าหน้าที่", tone: "danger" };
    }
    if (!cs05 && !cs05Query.isLoading) {
      return {
        title: "ยังไม่มีคำร้อง คพ.05",
        body: "ต้องยื่นคำร้องและรออนุมัติจึงจะบันทึก Logbook ได้",
        tone: "warning",
      };
    }
    if (cs05Status && cs05Status !== "approved") {
      const body = cs05Status === "pending"
        ? "คำร้อง คพ.05 อยู่ระหว่างการพิจารณา"
        : cs05Status === "rejected"
        ? "คำร้อง คพ.05 ไม่ได้รับการอนุมัติ"
        : "คำร้อง คพ.05 ยังไม่พร้อมสำหรับขั้นตอนนี้";
      return {
        title: "ยังไม่สามารถบันทึก Logbook",
        body,
        tone: cs05Status === "rejected" ? "danger" : "warning",
      };
    }
    if (!documentId) {
      return { title: "กำลังเตรียมข้อมูล", body: "กำลังโหลดข้อมูลคำร้อง คพ.05", tone: "info" };
    }
    if (acceptanceQuery.isError) {
      return { title: "ตรวจสอบหนังสือตอบรับไม่สำเร็จ", body: "กรุณาลองใหม่", tone: "danger" };
    }
    if (acceptanceQuery.isLoading) {
      return { title: "กำลังตรวจสอบหนังสือตอบรับ", body: "กรุณารอสักครู่", tone: "info" };
    }
    if (acceptanceStatus !== "approved") {
      const body = acceptanceStatus === "pending"
        ? "หนังสือตอบรับอยู่ระหว่างการพิจารณา"
        : acceptanceStatus === "rejected"
        ? "หนังสือตอบรับไม่ได้รับการอนุมัติ"
        : "ต้องอัปโหลดหนังสือตอบรับจากบริษัทก่อน";
      return {
        title: "ต้องได้รับการอนุมัติหนังสือตอบรับก่อน",
        body,
        tone: acceptanceStatus === "rejected" ? "danger" : "warning",
      };
    }
    return null;
  }, [acceptanceQuery.isError, acceptanceQuery.isLoading, acceptanceStatus, cs05, cs05Query.isError, cs05Query.isLoading, cs05Status, documentId, hydrated]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, TimesheetEntry>();
    (entriesQuery.data ?? []).forEach((entry) => {
      const dateKey = entry.workDate?.split("T")[0] ?? "";
      if (dateKey) map.set(dateKey, entry);
    });
    return map;
  }, [entriesQuery.data]);

  const rows: TimesheetRow[] = useMemo(() => {
    const workdays = workdaysQuery.data ?? [];
    return workdays.map((date) => {
      const entry = entriesByDate.get(date) ?? null;
      const hours = entry?.workHours !== undefined && entry?.workHours !== null ? Number(entry.workHours) : null;
      const approved = Boolean(entry && (entry.supervisorApproved === 1 || entry.supervisorApproved === true || entry.advisorApproved));
      const submitted = Boolean(entry && !approved && hours && hours > 0);
      const draft = Boolean(entry && !approved && !submitted && entry.timeIn);
      const status: RowStatus = approved ? "approved" : submitted ? "submitted" : draft ? "draft" : "empty";
      return { date, entry, status, hours };
    });
  }, [entriesByDate, workdaysQuery.data]);

  const canEdit = cs05Status === "approved" && acceptanceStatus === "approved";
  const loadingAny = useMemo(
    () => statsQuery.isLoading || workdaysQuery.isLoading || entriesQuery.isLoading,
    [entriesQuery.isLoading, statsQuery.isLoading, workdaysQuery.isLoading]
  );

  const handleSelectDate = useCallback((date: string) => {
    const entry = entriesByDate.get(date) ?? null;
    setEditingDate(date);
    setFormError(null);
    setFormSuccess(null);
    setFormState({
      logTitle: entry?.logTitle ?? "",
      workDescription: entry?.workDescription ?? "",
      learningOutcome: entry?.learningOutcome ?? "",
      problems: entry?.problems ?? "",
      solutions: entry?.solutions ?? "",
      timeIn: entry?.timeIn ?? "",
      timeOut: entry?.timeOut ?? "",
      workHours: entry?.workHours ? Number(entry.workHours) : 0,
    });
  }, [entriesByDate]);

  const handleCloseModal = useCallback(() => {
    setEditingDate(null);
    setFormError(null);
    setFormSuccess(null);
  }, []);

  useEffect(() => {
    if (!editingDate) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseModal();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      timeInRef.current?.focus();
    }, 0);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      window.clearTimeout(focusTimer);
    };
  }, [editingDate, handleCloseModal]);

  const handleTimeChange = useCallback((field: "timeIn" | "timeOut", value: string) => {
    setFormState((prev) => {
      const next = { ...prev, [field]: value };
      if (next.timeIn && next.timeOut) {
        next.workHours = calculateWorkHours(next.timeIn, next.timeOut);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingDate) return;

    setFormError(null);
    setFormSuccess(null);

    const timeIn = formState.timeIn.trim();
    const timeOut = formState.timeOut.trim();
    const logTitle = formState.logTitle.trim();
    const workDescription = formState.workDescription.trim();
    const learningOutcome = formState.learningOutcome.trim();

    if (!timeIn || !timeOut) {
      setFormError("กรุณากรอกเวลาเข้าและออกงาน");
      return;
    }
    if (!logTitle || !workDescription || !learningOutcome) {
      setFormError("กรุณากรอกหัวข้อ รายละเอียด และผลลัพธ์การเรียนรู้");
      return;
    }

    const computedHours = calculateWorkHours(timeIn, timeOut);
    if (computedHours <= 0) {
      setFormError("เวลาออกงานต้องมากกว่าเวลาเข้างาน");
      return;
    }

    const payload = {
      workDate: editingDate,
      timeIn,
      timeOut,
      workHours: computedHours,
      logTitle,
      workDescription,
      learningOutcome,
      problems: formState.problems.trim() || null,
      solutions: formState.solutions.trim() || null,
    };

    const existing = entriesByDate.get(editingDate);

    try {
      if (existing?.logId) {
        await updateMutation.mutateAsync({ logId: existing.logId, payload });
      } else {
        await saveMutation.mutateAsync(payload);
      }
      setFormSuccess("บันทึกข้อมูลเรียบร้อย");
      setFormError(null);
      setEditingDate(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถบันทึกข้อมูลได้";
      setFormError(message);
    }
  }, [editingDate, entriesByDate, formState, saveMutation, updateMutation]);

  const stats = statsQuery.data;
  const dateRange = dateRangeQuery.data;
  const evaluationStatus = evaluationStatusQuery.data;

  const approvedHours = useMemo(
    () => stats?.approvedBySupervisor ?? stats?.totalHours ?? 0,
    [stats?.approvedBySupervisor, stats?.totalHours]
  );
  const canSendEvaluation = useMemo(
    () => approvedHours >= REQUIRED_INTERNSHIP_HOURS,
    [approvedHours]
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const displayedRows = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return rows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [page, rows]);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Internship Logbook</p>
          <h1 className={styles.title}>บันทึกประจำวันฝึกงาน</h1>
          <p className={styles.lead}>บันทึกการปฏิบัติงานประจำวันตามลักษณะงานที่ได้รับมอบหมาย และติดตามสถานะการอนุมัติ</p>
        </div>
        <div className={styles.heroMeta}>
          <span className={`${styles.badge} ${cs05Status === "approved" ? styles.badgePositive : styles.badgeWarning}`}>
            CS05: {cs05Status ?? "ไม่พบข้อมูล"}
          </span>
          <span className={`${styles.badge} ${acceptanceStatus === "approved" ? styles.badgePositive : styles.badgeWarning}`}>
            หนังสือตอบรับ: {acceptanceStatus ?? "ไม่พบข้อมูล"}
          </span>
          <span className={`${styles.badge} ${styles.badgeNeutral}`}>
            Document ID: {documentId ?? "-"}
          </span>
        </div>
      </header>

      <section className={styles.statusGrid}>
        <article className={styles.statusCard}>
          <p className={styles.statusLabel}>ช่วงฝึกงาน</p>
          <p className={styles.statusValue}>{dateRange ? `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}` : "-"}</p>
          <p className={styles.statusHint}>ดึงจากข้อมูล คพ.05</p>
        </article>
        <article className={styles.statusCard}>
          <p className={styles.statusLabel}>ชั่วโมงสะสม</p>
          <p className={styles.statusValue}>{formatHours(stats?.totalHours ?? null)} ชม.</p>
          <p className={styles.statusHint}>อนุมัติแล้ว {formatHours(stats?.approvedBySupervisor ?? null)} ชม.</p>
        </article>
        <article className={styles.statusCard}>
          <p className={styles.statusLabel}>รายการบันทึก</p>
          <p className={styles.statusValue}>{stats ? `${stats.completed}/${stats.total}` : "-"}</p>
          <p className={styles.statusHint}>เหลือ {stats ? stats.pending : "-"} วัน</p>
        </article>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.panelKicker}>คำชี้แจง</p>
            <h2 className={styles.sectionTitle}>แนวทางการบันทึกการฝึกงาน</h2>
            <p className={styles.formHint}>อ้างอิงคำชี้แจงจากระบบเดิม</p>
          </div>
        </div>
        <ul className={styles.instructionList}>
          <li>นักศึกษาทุกคนต้องบันทึกการปฏิบัติงานทุกวันตามลักษณะงานที่มอบหมาย</li>
          <li>แบบบันทึกเป็นหลักฐานให้ภาควิชาฯ ตรวจสอบความคืบหน้าและความเหมาะสมของงาน</li>
          <li>การบันทึกควรเขียนให้สะอาด อ่านง่าย และเรียงลำดับตามวันที่</li>
          <li>ต้องปฏิบัติงานรวมอย่างน้อย 240 ชั่วโมงขึ้นไป (สามารถบันทึกเกินได้)</li>
        </ul>
        <p className={styles.formHint}>ข้อปฏิบัติ: แต่งกายตามระเบียบ ปฏิบัติตามกฎสถานประกอบการ และแจ้งหัวหน้างานเมื่อมีเหตุจำเป็น</p>
      </section>

      {guard ? (
        <section className={`${styles.callout} ${toneClass(guard.tone)}`}>
          <div>
            <p className={styles.calloutTitle}>{guard.title}</p>
            <p className={styles.calloutText}>{guard.body}</p>
          </div>
          <div className={styles.calloutActions}>
            <Link className={styles.secondaryButton} href="/dashboard">กลับแดชบอร์ด</Link>
            <Link className={styles.primaryButton} href="/internship-registration/flow">ไปหน้าลงทะเบียนฝึกงาน</Link>
          </div>
        </section>
      ) : (
        <>
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.panelKicker}>ภาพรวม</p>
                <h2 className={styles.sectionTitle}>สถิติการบันทึก</h2>
                <p className={styles.formHint}>ข้อมูลจาก /logbooks/internship/timesheet/stats</p>
              </div>
              <div className={styles.sectionBadges}>
                <span className={`${styles.badge} ${styles.badgeMuted}`}>ข้อมูลอัปเดตอัตโนมัติทุก 5 นาที</span>
              </div>
            </div>
            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>วันทั้งหมด</p>
                <p className={styles.statValue}>{stats?.total ?? "-"}</p>
                <p className={styles.statHint}>รวมวันทำงานตาม คพ.05</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>บันทึกแล้ว</p>
                <p className={styles.statValue}>{stats?.completed ?? "-"}</p>
                <p className={styles.statHint}>เหลือ {stats?.pending ?? "-"} วัน</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>ความคืบหน้า</p>
                <p className={styles.statValue}>{stats ? `${formatHours(stats.totalHours ?? 0)} ชม.` : "-"}</p>
                <p className={styles.statHint}>เฉลี่ย {formatHours(stats?.averageHoursPerDay ?? null)} ชม./วัน</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>อนุมัติแล้ว</p>
                <p className={styles.statValue}>{stats?.approvedBySupervisor ?? "-"}</p>
                <p className={styles.statHint}>วันที่พี่เลี้ยงอนุมัติ</p>
              </div>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.panelKicker}>การประเมิน</p>
                <h2 className={styles.sectionTitle}>ส่งคำขอประเมินไปยังพี่เลี้ยง</h2>
                <p className={styles.formHint}>ระบบจะส่งอีเมลลิงก์แบบประเมินให้พี่เลี้ยง</p>
              </div>
              <div className={styles.sectionBadges}>
                <span className={`${styles.badge} ${approvedHours >= 240 ? styles.badgePositive : styles.badgeWarning}`}>
                  ชั่วโมงที่บันทึก {formatHours(approvedHours)}/{REQUIRED_INTERNSHIP_HOURS} ชม.
                </span>
                <span className={`${styles.badge} ${evaluationStatus?.evaluationStatus === "completed" ? styles.badgePositive : styles.badgeInfo}`}>
                  สถานะ: {evaluationStatus?.evaluationStatus ?? (evaluationStatus?.isSent ? "sent" : "not_sent")}
                </span>
              </div>
            </div>

            {evaluationStatusQuery.isError && (
              <div className={`${styles.callout} ${styles.calloutDanger}`}>
                <div>
                  <p className={styles.calloutTitle}>โหลดสถานะการประเมินไม่สำเร็จ</p>
                  <p className={styles.calloutText}>กรุณาลองใหม่หรือแจ้งเจ้าหน้าที่</p>
                </div>
              </div>
            )}

            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>อีเมลพี่เลี้ยง</p>
                <p className={styles.statValue}>{evaluationStatus?.supervisorEmail ?? "-"}</p>
                <p className={styles.statHint}>กำหนดในคำร้อง คพ.05</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>ส่งล่าสุด</p>
                <p className={styles.statValue}>{evaluationStatus?.lastSentDate ? formatDate(evaluationStatus.lastSentDate) : "ยังไม่ส่ง"}</p>
                <p className={styles.statHint}>จะปิดเมื่อครบกำหนดหรือส่งสำเร็จ</p>
              </div>
            </div>

            <div className={styles.callout}>
              <div>
                <p className={styles.calloutTitle}>เงื่อนไขการส่ง</p>
                <p className={styles.calloutText}>
                    ต้องมีชั่วโมงที่บันทึกและอนุมัติแล้วอย่างน้อย 240 ชั่วโมงก่อนส่งคำขอประเมิน
                </p>
                <p className={styles.calloutText}>ลิงก์แบบประเมินมีอายุ 7 วันหลังจากส่งคำขอ</p>
              </div>
              <div className={styles.calloutActions}>
                <button
                  className={styles.primaryButton}
                  onClick={() => sendEvaluationMutation.mutateAsync().catch((error) => console.error(error))}
                  disabled={!canSendEvaluation || sendEvaluationMutation.isPending || evaluationStatusQuery.isLoading}
                >
                  {sendEvaluationMutation.isPending ? "กำลังส่ง..." : "ส่งอีเมลคำขอประเมิน"}
                </button>
                {!canSendEvaluation && (
                  <span className={styles.calloutText}>ต้องครบ {REQUIRED_INTERNSHIP_HOURS} ชั่วโมงก่อน</span>
                )}
              </div>
            </div>

            {sendEvaluationMutation.isSuccess && (
              <div className={`${styles.callout} ${styles.calloutInfo}`}>
                <div>
                  <p className={styles.calloutTitle}>ส่งคำขอแล้ว</p>
                  <p className={styles.calloutText}>{sendEvaluationMutation.data?.message ?? "ระบบได้ส่งอีเมลไปยังพี่เลี้ยงแล้ว"}</p>
                </div>
              </div>
            )}

            {sendEvaluationMutation.isError && (
              <div className={`${styles.callout} ${styles.calloutDanger}`}>
                <div>
                  <p className={styles.calloutTitle}>ส่งคำขอไม่สำเร็จ</p>
                  <p className={styles.calloutText}>
                    {(sendEvaluationMutation.error as Error)?.message || "ไม่สามารถส่งอีเมลคำขอประเมินได้"}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.panelKicker}>บันทึกประจำวัน</p>
                <h2 className={styles.sectionTitle}>ตารางวันทำงาน</h2>
                <p className={styles.formHint}>เลือกวันที่เพื่อกรอกหรือแก้ไขข้อมูล</p>
              </div>
              <div className={styles.sectionBadges}>
                <span className={`${styles.badge} ${styles.badgeMuted}`}>
                  {loadingAny ? "กำลังโหลด" : `${rows.length} วัน`}
                </span>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <div className={styles.tableHead}>
                <span>วันที่</span>
                <span>สถานะ</span>
                <span>ชั่วโมง</span>
                <span>การดำเนินการ</span>
              </div>
              {displayedRows.map((row) => (
                <div key={row.date} className={styles.tableRow}>
                  <div>
                    <p className={styles.rowTitle}>{formatDate(row.date)}</p>
                    <p className={styles.rowHint}>{row.entry?.logTitle || "ยังไม่กรอกหัวข้อ"}</p>
                  </div>
                  <div>
                    <span className={`${styles.badge} ${badgeToneClass(row.status)}`}>{statusLabel(row.status)}</span>
                  </div>
                  <div>
                    <p className={styles.rowValue}>{row.hours !== null ? `${formatHours(row.hours)} ชม.` : "-"}</p>
                    {row.entry?.supervisorApproved ? <p className={styles.rowHint}>รอรับรอง/ส่งใบรับรอง</p> : null}
                  </div>
                  <div className={styles.rowActions}>
                    <button
                      className={styles.primaryButton}
                      type="button"
                      disabled={!canEdit || Boolean(row.entry?.supervisorApproved)}
                      onClick={() => handleSelectDate(row.date)}
                    >
                      {row.entry ? "แก้ไข" : "กรอกข้อมูล"}
                    </button>
                  </div>
                </div>
              ))}
              {rows.length > PAGE_SIZE ? (
                <p className={styles.cardHint}>แสดง {PAGE_SIZE} วันต่อหน้า (ทั้งหมด {rows.length} วัน)</p>
              ) : null}
              {rows.length === 0 && !loadingAny ? <p className={styles.cardHint}>ยังไม่มีช่วงวันที่ให้บันทึก</p> : null}
            </div>
            {rows.length > PAGE_SIZE ? (
              <div className={styles.pagination}>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  หน้าแรก
                </button>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  ก่อนหน้า
                </button>
                <span className={styles.paginationInfo}>หน้า {page} / {totalPages}</span>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  ถัดไป
                </button>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  ท้ายสุด
                </button>
              </div>
            ) : null}
          </section>

          {editingDate ? (
            <div className={styles.modalOverlay} onClick={handleCloseModal} role="presentation">
              <div
                className={styles.modalContent}
                role="dialog"
                aria-modal="true"
                aria-labelledby="logbook-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className={styles.formHeader}>
                  <div>
                    <p className={styles.panelKicker}>บันทึก {formatDate(editingDate)}</p>
                    <h3 className={styles.formTitle} id="logbook-modal-title">กรอกข้อมูลการฝึกงาน</h3>
                    <p className={styles.formHint}>ระบบจะคำนวณชั่วโมงจากเวลาเข้า-ออกงานอัตโนมัติ</p>
                  </div>
                  <div className={styles.calloutActions}>
                    <button className={styles.secondaryButton} type="button" onClick={handleCloseModal}>
                      ปิดแบบฟอร์ม
                    </button>
                  </div>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                  <div className={styles.gridTwo}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="logbook-time-in">เวลาเข้างาน *</label>
                      <input
                        className={styles.input}
                        id="logbook-time-in"
                        type="time"
                        ref={timeInRef}
                        value={formState.timeIn}
                        onChange={(e) => handleTimeChange("timeIn", e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="logbook-time-out">เวลาออกงาน *</label>
                      <input
                        className={styles.input}
                        id="logbook-time-out"
                        type="time"
                        value={formState.timeOut}
                        onChange={(e) => handleTimeChange("timeOut", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="logbook-title">หัวข้อ / งานที่รับผิดชอบ *</label>
                    <input
                      className={styles.input}
                      id="logbook-title"
                      type="text"
                      value={formState.logTitle}
                      onChange={(e) => setFormState((prev) => ({ ...prev, logTitle: e.target.value }))}
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="logbook-description">รายละเอียดงาน *</label>
                    <textarea
                      className={styles.textarea}
                      id="logbook-description"
                      value={formState.workDescription}
                      onChange={(e) => setFormState((prev) => ({ ...prev, workDescription: e.target.value }))}
                      rows={3}
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="logbook-learning">สิ่งที่ได้เรียนรู้ *</label>
                    <textarea
                      className={styles.textarea}
                      id="logbook-learning"
                      value={formState.learningOutcome}
                      onChange={(e) => setFormState((prev) => ({ ...prev, learningOutcome: e.target.value }))}
                      rows={2}
                      required
                    />
                  </div>

                  <div className={styles.gridTwo}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="logbook-problems">ปัญหา/อุปสรรค</label>
                      <textarea
                        className={styles.textarea}
                        id="logbook-problems"
                        value={formState.problems}
                        onChange={(e) => setFormState((prev) => ({ ...prev, problems: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="logbook-solutions">แนวทางแก้ไข</label>
                      <textarea
                        className={styles.textarea}
                        id="logbook-solutions"
                        value={formState.solutions}
                        onChange={(e) => setFormState((prev) => ({ ...prev, solutions: e.target.value }))}
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="logbook-hours">ชั่วโมงที่ระบบคำนวณ</label>
                    <input
                      className={styles.input}
                      id="logbook-hours"
                      type="text"
                      value={`${formatHours(formState.workHours)} ชม.`}
                      readOnly
                    />
                  </div>

                  {formError ? <p className={styles.error}>{formError}</p> : null}
                  {formSuccess ? <p className={styles.success}>{formSuccess}</p> : null}

                  <div className={styles.actions}>
                    <Link className={styles.secondaryButton} href="/dashboard">กลับหน้าแดชบอร์ด</Link>
                    <button className={styles.primaryButton} type="submit" disabled={saveMutation.isPending || updateMutation.isPending}>
                      {saveMutation.isPending || updateMutation.isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
