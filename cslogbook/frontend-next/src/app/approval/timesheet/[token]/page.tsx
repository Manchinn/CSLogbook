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

/* ─── formatters ─── */

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

/* ─── status helpers ─── */

type OverallStatus = "approved" | "rejected" | "pending" | string;

function statusLabel(status?: string | null): string {
  switch (status) {
    case "approved": return "อนุมัติแล้ว";
    case "rejected": return "ปฏิเสธแล้ว";
    case "pending": return "รอการพิจารณา";
    default: return status || "ไม่ทราบสถานะ";
  }
}

function stampClass(status?: string | null) {
  switch (status) {
    case "approved": return styles.stampApproved;
    case "rejected": return styles.stampRejected;
    default: return styles.stampPending;
  }
}

function stampIcon(status?: string | null) {
  switch (status) {
    case "approved": return "✓";
    case "rejected": return "✕";
    default: return "⏳";
  }
}

function entryStatusInfo(entry: TimesheetApprovalEntry): { label: string; cls: string } {
  if (entry.supervisorApproved === 1 || entry.supervisorApproved === true)
    return { label: "อนุมัติแล้ว", cls: styles.entryApproved };
  if (entry.supervisorApproved === -1)
    return { label: "ถูกปฏิเสธ", cls: styles.entryRejected };
  if (entry.advisorApproved)
    return { label: "อนุมัติแล้ว", cls: styles.entryApproved };
  return { label: "รอการอนุมัติ", cls: styles.entryPending };
}

/* ─── component ─── */

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
      setActionError(error instanceof Error ? error.message : "ไม่สามารถอนุมัติได้");
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
      setActionError(error instanceof Error ? error.message : "ไม่สามารถปฏิเสธได้");
    },
  });

  const details = detailsQuery.data ?? null;
  const effectiveStatus: OverallStatus = overrideStatus ?? details?.status ?? "pending";
  const actionDisabled = effectiveStatus !== "pending" || approveMutation.isPending || rejectMutation.isPending;
  const entries = useMemo(() => details?.timesheetEntries ?? [], [details?.timesheetEntries]);
  const totalHours = useMemo(
    () => entries.reduce((sum, e) => sum + (e.workHours ?? 0), 0),
    [entries],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionMessage(null);
    setActionError(null);

    if (!token) { setActionError("ไม่พบลิงก์การอนุมัติ"); return; }
    if (!decision) { setActionError("กรุณาเลือกการดำเนินการ"); return; }
    if (decision === "reject" && !comment.trim()) { setActionError("กรุณาระบุเหตุผลในการปฏิเสธ"); return; }

    if (decision === "approve") approveMutation.mutate();
    else rejectMutation.mutate();
  };

  /* ─── no token ─── */
  if (!token) {
    return (
      <div className={styles.errorPage}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>🔗</div>
          <h2 className={styles.errorTitle}>ไม่พบลิงก์การอนุมัติ</h2>
          <p className={styles.errorMessage}>กรุณาตรวจสอบ URL อีกครั้ง หรือใช้ลิงก์จากอีเมลที่ได้รับ</p>
        </div>
      </div>
    );
  }

  /* ─── loading ─── */
  if (detailsQuery.isLoading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>กำลังโหลดข้อมูลการอนุมัติ...</p>
        </div>
      </div>
    );
  }

  /* ─── error ─── */
  if (detailsQuery.isError || !details) {
    const message = detailsQuery.error instanceof Error ? detailsQuery.error.message : "ไม่พบข้อมูลการอนุมัติ หรือลิงก์หมดอายุแล้ว";
    return (
      <div className={styles.errorPage}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>ไม่สามารถโหลดข้อมูลได้</h2>
          <p className={styles.errorMessage}>{message}</p>
        </div>
      </div>
    );
  }

  /* ─── main render ─── */
  return (
    <div className={styles.page}>
      {/* ── banner ── */}
      <div className={styles.topBanner}>
        <div className={styles.bannerInner}>
          <div className={styles.brandRow}>
            <div className={styles.brandLogo}>CS</div>
            <span className={styles.brandText}>CS Logbook · ระบบอนุมัติบันทึกการฝึกงาน</span>
          </div>
          <h1 className={styles.bannerTitle}>อนุมัติบันทึกการฝึกงาน</h1>
          <p className={styles.bannerSub}>ตรวจสอบรายการบันทึกและยืนยันผลการอนุมัติสำหรับนักศึกษาฝึกงาน</p>
        </div>
      </div>

      {/* ── main content ── */}
      <div className={styles.main}>
        {/* ── summary card ── */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryInfo}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>นักศึกษา</span>
                <span className={styles.summaryValue}>{details.studentName ?? "-"}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>รหัสนักศึกษา</span>
                <span className={styles.summaryValue}>{details.studentCode ?? "-"}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>สถานประกอบการ</span>
                <span className={styles.summaryValue}>{details.companyName ?? "ไม่ระบุ"}</span>
              </div>
            </div>
            <div className={styles.summaryDates}>
              <span>ส่งคำขอเมื่อ {formatDateTime(details.createdAt)}</span>
              <span>หมดอายุ {formatDateTime(details.expiresAt)}</span>
            </div>
          </div>

          <div className={`${styles.statusStamp} ${stampClass(effectiveStatus)}`}>
            <span className={styles.stampIcon}>{stampIcon(effectiveStatus)}</span>
            <span className={styles.stampLabel}>{statusLabel(effectiveStatus)}</span>
          </div>
        </div>

        {/* ── entries table ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>📋</div>
            <h2 className={styles.sectionTitle}>
              รายการบันทึกที่รออนุมัติ
              <span className={styles.sectionCount}>({entries.length} รายการ)</span>
            </h2>
          </div>

          <div className={styles.tableWrap}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>วันที่</th>
                    <th>เวลา</th>
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
                    entries.map((entry) => {
                      const es = entryStatusInfo(entry);
                      return (
                        <tr key={String(entry.logId)}>
                          <td className={styles.cellDate}>{formatDate(entry.workDate)}</td>
                          <td className={styles.cellTime}>{entry.timeIn || "-"} – {entry.timeOut || "-"}</td>
                          <td className={styles.cellHours}>{formatHours(entry.workHours)}</td>
                          <td className={styles.cellTitle}>{entry.logTitle || "-"}</td>
                          <td className={styles.cellDesc}>{entry.workDescription || "-"}</td>
                          <td className={styles.cellStatus}>
                            <span className={`${styles.entryBadge} ${es.cls}`}>
                              <span className={styles.entryDot} />
                              {es.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {entries.length > 0 && (
              <div className={styles.tableSummary}>
                <span>ทั้งหมด <strong>{entries.length}</strong> รายการ</span>
                <span>รวม <strong>{formatHours(totalHours)}</strong> ชั่วโมง</span>
              </div>
            )}
          </div>
        </section>

        {/* ── decision section ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>✍️</div>
            <h2 className={styles.sectionTitle}>ยืนยันผลการอนุมัติ</h2>
          </div>

          <div className={styles.decisionCard}>
            {effectiveStatus !== "pending" ? (
              <div className={effectiveStatus === "approved" ? styles.calloutSuccess : effectiveStatus === "rejected" ? styles.calloutDanger : styles.calloutInfo}>
                <span className={styles.calloutInfoIcon}>
                  {effectiveStatus === "approved" ? "✅" : effectiveStatus === "rejected" ? "❌" : "ℹ️"}
                </span>
                <span>
                  {actionMessage
                    ? actionMessage
                    : `คำขอนี้ถูกดำเนินการแล้ว สถานะปัจจุบันคือ ${statusLabel(effectiveStatus)}`}
                </span>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.radioGroup}>
                  <label className={`${styles.radioCard} ${styles.radioApprove} ${decision === "approve" ? styles.radioSelected : ""}`}>
                    <input
                      type="radio"
                      name="decision"
                      value="approve"
                      checked={decision === "approve"}
                      onChange={() => setDecision("approve")}
                    />
                    <div className={styles.radioCardContent}>
                      <span className={styles.radioCardTitle}>✓ อนุมัติ</span>
                      <span className={styles.radioCardHint}>ยืนยันว่าบันทึกถูกต้อง</span>
                    </div>
                  </label>
                  <label className={`${styles.radioCard} ${styles.radioReject} ${decision === "reject" ? styles.radioSelected : ""}`}>
                    <input
                      type="radio"
                      name="decision"
                      value="reject"
                      checked={decision === "reject"}
                      onChange={() => setDecision("reject")}
                    />
                    <div className={styles.radioCardContent}>
                      <span className={styles.radioCardTitle}>✕ ปฏิเสธ</span>
                      <span className={styles.radioCardHint}>ต้องระบุเหตุผล</span>
                    </div>
                  </label>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="comment">
                    เหตุผล / หมายเหตุ
                  </label>
                  <span className={styles.fieldHint}>
                    {decision === "reject" ? "จำเป็นต้องระบุเหตุผลเมื่อปฏิเสธ" : "ไม่บังคับ — ระบุหมายเหตุเพิ่มเติมหากต้องการ"}
                  </span>
                  <textarea
                    id="comment"
                    className={styles.textarea}
                    placeholder="ระบุหมายเหตุหรือเหตุผล..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                  />
                </div>

                {actionError && <div className={styles.error}>{actionError}</div>}
                {actionMessage && <div className={styles.success}>{actionMessage}</div>}

                <div className={styles.actions}>
                  <button className={styles.primaryButton} type="submit" disabled={actionDisabled}>
                    {approveMutation.isPending || rejectMutation.isPending
                      ? "กำลังบันทึก..."
                      : "ยืนยันการดำเนินการ"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>

      {/* ── footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerDivider} />
        <p>CS Logbook System · คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</p>
      </footer>
    </div>
  );
}
