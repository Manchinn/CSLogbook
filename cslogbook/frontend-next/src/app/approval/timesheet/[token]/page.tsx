"use client";

import { FormEvent, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import styles from "./timesheetApproval.module.css";
import {
  approveTimesheet,
  getTimesheetApprovalDetails,
  rejectTimesheet,
  type TimesheetApprovalEntry,
} from "@/lib/services/timesheetApprovalService";

type Tone = "positive" | "warning" | "danger" | "info" | "muted";

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" });

function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return dateFormatter.format(parsed);
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return dateTimeFormatter.format(parsed);
}

function formatHours(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("th-TH", { maximumFractionDigits: 1 });
}

function statusMeta(status?: string | null): { label: string; tone: Tone } {
  switch (status) {
    case "approved":
      return { label: "อนุมัติแล้ว", tone: "positive" };
    case "rejected":
      return { label: "ปฏิเสธแล้ว", tone: "danger" };
    case "pending":
      return { label: "รอการพิจารณา", tone: "warning" };
    default:
      return { label: status || "ไม่ทราบสถานะ", tone: "muted" };
  }
}

function toneClass(tone: Tone) {
  switch (tone) {
    case "positive":
      return styles.badgePositive;
    case "warning":
      return styles.badgeWarning;
    case "danger":
      return styles.badgeDanger;
    case "info":
      return styles.badgeInfo;
    default:
      return styles.badgeMuted;
  }
}

function entryStatus(entry: TimesheetApprovalEntry) {
  if (entry.supervisorApproved === 1 || entry.supervisorApproved === true) return "อนุมัติแล้ว";
  if (entry.supervisorApproved === -1) return "ถูกปฏิเสธ";
  if (entry.advisorApproved) return "อนุมัติแล้ว";
  return "รอการอนุมัติ";
}

export default function TimesheetApprovalPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<string | null>(null);

  const detailsQuery = useQuery({
    queryKey: ["timesheet-approval", token],
    queryFn: () => getTimesheetApprovalDetails(token as string),
    enabled: Boolean(token),
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: () => approveTimesheet(token as string, comment),
    onSuccess: () => {
      setActionError(null);
      setActionMessage("อนุมัติบันทึกการฝึกงานเรียบร้อยแล้ว");
      setOverrideStatus("approved");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "ไม่สามารถอนุมัติได้";
      setActionError(message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectTimesheet(token as string, comment.trim()),
    onSuccess: () => {
      setActionError(null);
      setActionMessage("ปฏิเสธบันทึกการฝึกงานเรียบร้อยแล้ว");
      setOverrideStatus("rejected");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "ไม่สามารถปฏิเสธได้";
      setActionError(message);
    },
  });

  const details = detailsQuery.data ?? null;
  const effectiveStatus = overrideStatus ?? details?.status ?? null;
  const statusInfo = statusMeta(effectiveStatus);
  const actionDisabled = effectiveStatus !== "pending" || approveMutation.isPending || rejectMutation.isPending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionMessage(null);
    setActionError(null);

    if (!token) {
      setActionError("ไม่พบลิงก์การอนุมัติ");
      return;
    }
    if (!decision) {
      setActionError("กรุณาเลือกการดำเนินการ");
      return;
    }
    if (decision === "reject" && !comment.trim()) {
      setActionError("กรุณาระบุเหตุผลในการปฏิเสธ");
      return;
    }

    if (decision === "approve") {
      approveMutation.mutate();
    } else {
      rejectMutation.mutate();
    }
  };

  const entries = useMemo(() => details?.timesheetEntries ?? [], [details?.timesheetEntries]);

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>ไม่พบลิงก์การอนุมัติ กรุณาตรวจสอบ URL อีกครั้ง</div>
      </div>
    );
  }

  if (detailsQuery.isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>กำลังโหลดข้อมูลการอนุมัติ...</div>
      </div>
    );
  }

  if (detailsQuery.isError || !details) {
    const message = detailsQuery.error instanceof Error ? detailsQuery.error.message : "ไม่พบข้อมูลการอนุมัติ";
    return (
      <div className={styles.page}>
        <div className={`${styles.card} ${styles.calloutDanger}`}>{message}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Timesheet Approval</p>
          <h1 className={styles.title}>อนุมัติบันทึกการฝึกงาน</h1>
          <p className={styles.lead}>ตรวจสอบรายการบันทึกและยืนยันผลการอนุมัติสำหรับนักศึกษา</p>
        </div>
        <div className={styles.heroMeta}>
          <span className={`${styles.badge} ${toneClass(statusInfo.tone)}`}>สถานะ: {statusInfo.label}</span>
          <span className={styles.badge}>นักศึกษา: {details.studentName ?? "-"}</span>
          <span className={styles.badge}>รหัส: {details.studentCode ?? "-"}</span>
          <span className={styles.badge}>สถานประกอบการ: {details.companyName ?? "-"}</span>
        </div>
        <div className={styles.heroMetaSecondary}>
          <span>ส่งคำขอเมื่อ {formatDateTime(details.createdAt)}</span>
          <span>หมดอายุ {formatDateTime(details.expiresAt)}</span>
        </div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>รายการบันทึกที่รออนุมัติ ({entries.length})</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>เวลาเข้า-ออก</th>
                <th>ชั่วโมง</th>
                <th>หัวข้องาน</th>
                <th>รายละเอียด</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>ไม่พบรายการบันทึก</td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={String(entry.logId)}>
                    <td>{formatDate(entry.workDate)}</td>
                    <td>{entry.timeIn || "-"} - {entry.timeOut || "-"}</td>
                    <td>{formatHours(entry.workHours)}</td>
                    <td>{entry.logTitle || "-"}</td>
                    <td>{entry.workDescription || "-"}</td>
                    <td>{entryStatus(entry)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ยืนยันผลการอนุมัติ</h2>
        {effectiveStatus !== "pending" ? (
          <div className={`${styles.card} ${styles.calloutInfo}`}>
            คำขอนี้ถูกดำเนินการแล้ว สถานะปัจจุบันคือ {statusInfo.label}
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.radioGroup}>
              <label className={`${styles.radioCard} ${decision === "approve" ? styles.radioSelected : ""}`}>
                <input
                  type="radio"
                  name="decision"
                  value="approve"
                  checked={decision === "approve"}
                  onChange={() => setDecision("approve")}
                />
                <span>อนุมัติบันทึกการฝึกงาน</span>
              </label>
              <label className={`${styles.radioCard} ${decision === "reject" ? styles.radioSelected : ""}`}>
                <input
                  type="radio"
                  name="decision"
                  value="reject"
                  checked={decision === "reject"}
                  onChange={() => setDecision("reject")}
                />
                <span>ปฏิเสธบันทึกการฝึกงาน</span>
              </label>
            </div>

            <label className={styles.fieldLabel} htmlFor="comment">เหตุผล / หมายเหตุ</label>
            <textarea
              id="comment"
              className={styles.textarea}
              placeholder="ระบุหมายเหตุหรือเหตุผล (จำเป็นเมื่อปฏิเสธ)"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
            />

            {actionError ? <div className={styles.error}>{actionError}</div> : null}
            {actionMessage ? <div className={styles.success}>{actionMessage}</div> : null}

            <button className={styles.primaryButton} type="submit" disabled={actionDisabled}>
              {approveMutation.isPending || rejectMutation.isPending ? "กำลังบันทึก..." : "ยืนยันการดำเนินการ"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
