"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useCurrentCS05 } from "@/hooks/useCurrentCS05";
import {
  useTimesheetStats,
  useTimesheetEntries,
} from "@/hooks/useInternshipLogbook";
import {
  sendTimesheetApprovalRequest,
  type TimesheetEntry,
} from "@/lib/services/internshipLogbookService";
import styles from "./timesheet.module.css";

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });
function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : dateFormatter.format(d);
}

function getEntryStatus(entry: TimesheetEntry) {
  if (!entry.timeIn) return "pending";
  if (!entry.timeOut || !entry.logTitle) return "incomplete";
  if (entry.supervisorApproved === 1 || entry.supervisorApproved === true) return "approved";
  if (entry.supervisorApproved === -1) return "rejected";
  if (entry.logId) return "submitted";
  return "incomplete";
}

type ApprovalType = "full" | "weekly";

export default function InternshipTimesheetView() {
  const { token, user } = useAuth();
  const hydrated      = useHydrated();
  const queriesEnabled = hydrated && Boolean(token);

  const cs05Query = useCurrentCS05(token, queriesEnabled);
  const cs05      = cs05Query.data;
  const documentId = cs05?.documentId ?? null;

  const statsQuery   = useTimesheetStats(token, queriesEnabled && Boolean(documentId));
  const entriesQuery = useTimesheetEntries(token, queriesEnabled && Boolean(documentId));

  const stats    = statsQuery.data;
  const entries  = entriesQuery.data ?? [];

  /* approval form state */
  const [approvalType, setApprovalType] = useState<ApprovalType>("full");
  const [startDate, setStartDate]       = useState("");
  const [endDate, setEndDate]           = useState("");
  const [approvalMsg, setApprovalMsg]   = useState<string | null>(null);
  const [approvalErr, setApprovalErr]   = useState<string | null>(null);

  const approvalMutation = useMutation({
    mutationFn: () => {
      const studentId = user?.studentId;
      if (!studentId) throw new Error("ไม่พบรหัสนักศึกษา");
      return sendTimesheetApprovalRequest(token ?? "", studentId, {
        type: approvalType,
        ...(approvalType === "weekly" && startDate && endDate ? { startDate, endDate } : {}),
      });
    },
    onSuccess: (data) => {
      if (data.emailSent === false) {
        if (data.reason === "notification_disabled") {
          setApprovalMsg("คำขออนุมัติบันทึกแล้ว แต่ไม่ส่งอีเมลเนื่องจากการแจ้งเตือนถูกปิด");
        } else {
          setApprovalMsg(`คำขออนุมัติบันทึกแล้ว แต่ส่งอีเมลไม่สำเร็จ: ${data.reason ?? "ไม่ทราบสาเหตุ"}`);
        }
      } else {
        setApprovalMsg("ส่งคำขออนุมัติผ่านอีเมลไปยังหัวหน้างานเรียบร้อยแล้ว");
      }
      setApprovalErr(null);
    },
    onError: (err: Error) => {
      setApprovalErr(err.message ?? "ไม่สามารถส่งคำขออนุมัติได้");
      setApprovalMsg(null);
    },
  });

  /* entries that still need approval */
  const pendingEntries = useMemo(
    () => entries.filter((e) => {
      const s = getEntryStatus(e);
      return s === "submitted" || s === "incomplete" || s === "rejected";
    }),
    [entries]
  );

  const hasPending = pendingEntries.length > 0;

  if (!hydrated || cs05Query.isLoading) {
    return <div className={styles.page}><p className={styles.lead}>กำลังโหลดข้อมูล...</p></div>;
  }

  if (!cs05) {
    return (
      <div className={styles.page}>
        <div className={styles.callout}>
          <p className={styles.calloutTitle}>ยังไม่มีคำร้อง คพ.05</p>
          <p className={styles.calloutText}>ต้องยื่นและได้รับอนุมัติก่อนจึงจะเข้าถึง Timesheet</p>
          <Link href="/internship-registration/flow" className={styles.primaryButton}>ยื่น คพ.05</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Internship Timesheet</p>
          <h1 className={styles.title}>Timesheet &amp; คำขออนุมัติ</h1>
          <p className={styles.lead}>
            ดูสถิติบันทึกการฝึกงานและส่งคำขออนุมัติไปยังหัวหน้างานผ่านอีเมล
          </p>
        </div>
        <div className={styles.heroMeta}>
          <Link href="/internship/logbook" className={styles.secondaryButton}>
            บันทึกประจำวัน (Logbook)
          </Link>
        </div>
      </header>

      {/* Stats */}
      <section className={styles.statGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>วันฝึกงานทั้งหมด</p>
          <p className={styles.statValue}>{stats?.total ?? "-"}</p>
          <p className={styles.statHint}>วัน</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>ชั่วโมงสะสม</p>
          <p className={styles.statValue}>{stats?.totalHours ?? "-"}</p>
          <p className={styles.statHint}>ชั่วโมง</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>บันทึกแล้ว</p>
          <p className={styles.statValue}>{stats?.completed ?? "-"}</p>
          <p className={styles.statHint}>รอบันทึก {stats?.pending ?? "-"} วัน</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>อนุมัติโดยหัวหน้างาน</p>
          <p className={styles.statValue}>{stats?.approvedBySupervisor ?? "-"}</p>
          <p className={styles.statHint}>วัน</p>
        </div>
        <div className={`${styles.statCard} ${styles.statCardWide}`}>
          <p className={styles.statLabel}>ความคืบหน้า (เป้าหมาย 240 ชม.)</p>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(100, Math.round(((stats?.totalHours ?? 0) / 240) * 100))}%` }}
            />
          </div>
          <p className={styles.statHint}>
            {Math.min(100, Math.round(((stats?.totalHours ?? 0) / 240) * 100))}%
          </p>
        </div>
      </section>

      {/* Approval Request Section */}
      <section className={styles.sectionCard}>
        <p className={styles.panelKicker}>การขออนุมัติ</p>
        <h2 className={styles.sectionTitle}>ส่งคำขออนุมัติผ่านอีเมลไปยังหัวหน้างาน</h2>

        <div className={styles.calloutInfo}>
          <ul className={styles.noteList}>
            <li>ระบบจะส่งอีเมลไปยังหัวหน้างานที่ระบุไว้ใน คพ.05</li>
            <li>หัวหน้างานสามารถอนุมัติหรือปฏิเสธผ่านลิงก์ในอีเมลโดยตรง</li>
            <li>คำขออนุมัติหมดอายุหลัง 7 วัน</li>
          </ul>
        </div>

        <div className={styles.formRow}>
          <label className={styles.label}>ประเภทการขออนุมัติ
            <select className={styles.input} value={approvalType} onChange={(e) => setApprovalType(e.target.value as ApprovalType)}>
              <option value="full">ทั้งหมด (ที่ยังไม่ได้รับการอนุมัติ)</option>
              <option value="weekly">รายสัปดาห์</option>
            </select>
          </label>
        </div>

        {approvalType === "weekly" && (
          <div className={styles.formRow}>
            <label className={styles.label}>วันที่เริ่มต้น
              <input className={styles.input} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label className={styles.label}>วันที่สิ้นสุด
              <input className={styles.input} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>
        )}

        {approvalMsg && <p className={styles.success}>{approvalMsg}</p>}
        {approvalErr && <p className={styles.error}>{approvalErr}</p>}

        <button
          className={styles.primaryButton}
          type="button"
          disabled={!hasPending || approvalMutation.isPending}
          onClick={() => { setApprovalMsg(null); setApprovalErr(null); approvalMutation.mutate(); }}
          title={!hasPending ? "ไม่มีรายการที่รอการอนุมัติ หรือข้อมูลไม่ครบถ้วน" : undefined}
        >
          {approvalMutation.isPending ? "กำลังส่ง..." : "ส่งคำขออนุมัติผ่านอีเมล"}
        </button>
        {!hasPending && (
          <p className={styles.formHint}>ไม่มีรายการที่รอการอนุมัติ หรือบันทึกข้อมูลไม่ครบถ้วน</p>
        )}
      </section>

      {/* Entries that need attention */}
      {pendingEntries.length > 0 && (
        <section className={styles.sectionCard}>
          <p className={styles.panelKicker}>ต้องดำเนินการ</p>
          <h2 className={styles.sectionTitle}>รายการที่รอการอนุมัติ ({pendingEntries.length} รายการ)</h2>
          <div className={styles.entryTable}>
            <div className={styles.entryHead}>
              <span>วันที่</span>
              <span>หัวข้อ</span>
              <span>สถานะ</span>
            </div>
            {pendingEntries.slice(0, 10).map((entry) => {
              const status = getEntryStatus(entry);
              return (
                <div key={entry.logId ?? entry.workDate} className={styles.entryRow}>
                  <span>{formatDate(entry.workDate)}</span>
                  <span>{entry.logTitle ?? "ยังไม่กรอกหัวข้อ"}</span>
                  <span>
                    {status === "rejected" && <span className={styles.badgeDanger}>ปฏิเสธ</span>}
                    {status === "submitted" && <span className={styles.badgeInfo}>รอพิจารณา</span>}
                    {status === "incomplete" && <span className={styles.badgeWarning}>ไม่สมบูรณ์</span>}
                    {status === "pending" && <span className={styles.badgeMuted}>รอบันทึก</span>}
                  </span>
                </div>
              );
            })}
          </div>
          <Link href="/internship/logbook" className={styles.secondaryButton} style={{ marginTop: 12, display: "inline-block" }}>
            แก้ไขใน Logbook
          </Link>
        </section>
      )}
    </div>
  );
}
