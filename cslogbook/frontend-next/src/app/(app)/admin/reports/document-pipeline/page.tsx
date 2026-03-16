"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getDocumentPipeline,
  getInternshipAcademicYears,
  type DocumentPipelineData,
  type DocumentPipelineItem,
} from "@/lib/services/reportService";
import { downloadCSV } from "@/lib/utils/csvExport";
import { StatSkeleton } from "@/components/common/Skeleton";
import btn from "@/styles/shared/buttons.module.css";
import styles from "./page.module.css";

/* ─── Status Mapping ─── */
const STATUS_LABELS: Record<string, string> = {
  draft: "แบบร่าง",
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
  supervisor_evaluated: "พี่เลี้ยงประเมิน",
  acceptance_approved: "อนุมัติส่งตัว",
  referral_ready: "พร้อมออกหนังสือ",
  referral_downloaded: "ดาวน์โหลดแล้ว",
};

const BAR_COLORS: Record<string, string> = {
  pending: styles.barPending,
  approved: styles.barApproved,
  rejected: styles.barRejected,
  completed: styles.barCompleted,
  draft: styles.barDraft,
  cancelled: styles.barCancelled,
  supervisor_evaluated: styles.barSupervisorEvaluated,
  acceptance_approved: styles.barAcceptanceApproved,
  referral_ready: styles.barReferralReady,
  referral_downloaded: styles.barReferralDownloaded,
};

const LEGEND_HEX: Record<string, string> = {
  pending: "#3b82f6",
  approved: "#22c55e",
  rejected: "#ef4444",
  completed: "#0ea5e9",
  draft: "#94a3b8",
  cancelled: "#f87171",
  supervisor_evaluated: "#f59e0b",
  acceptance_approved: "#10b981",
  referral_ready: "#6366f1",
  referral_downloaded: "#14b8a6",
};

/* ─── Mini Donut Ring ─── */
function Ring({ value, total, color }: { value: number; total: number; color: string }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? value / total : 0;
  return (
    <div className={styles.ringWrap}>
      <svg viewBox="0 0 52 52">
        <circle className={styles.ringBg} cx="26" cy="26" r={r} />
        <circle
          className={styles.ringFg}
          cx="26" cy="26" r={r}
          stroke={color}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span className={styles.ringValue}>{value}</span>
    </div>
  );
}

export default function DocumentPipelinePage() {
  const [year, setYear] = useState<number | undefined>();
  const [semester, setSemester] = useState<number | undefined>();
  const [docType, setDocType] = useState("");
  const [years, setYears] = useState<number[]>([]);
  const [data, setData] = useState<DocumentPipelineData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadYears = useCallback(async () => {
    const y = await getInternshipAcademicYears();
    setYears(y);
    setYear(prev => prev === undefined && y.length > 0 ? y[0] : prev);
  }, []);

  const loadData = useCallback(async (y?: number, sem?: number, dt?: string) => {
    setLoading(true);
    try {
      const result = await getDocumentPipeline({ year: y, semester: sem, documentType: dt || undefined });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadYears(); }, [loadYears]);
  useEffect(() => { if (year) loadData(year, semester, docType); }, [year, semester, docType, loadData]);

  const pipeline = useMemo(() => data?.pipeline ?? [], [data]);
  const summary = data?.summary;

  // Collect all visible statuses for legend
  const visibleStatuses = useMemo(() => {
    const set = new Set<string>();
    pipeline.forEach(d => Object.keys(d.statuses).forEach(s => set.add(s)));
    return Array.from(set);
  }, [pipeline]);

  const handleExportCsv = () => {
    const rows: { documentType: string; documentName: string; status: string; statusLabel: string; count: number }[] = [];
    pipeline.forEach((doc) => {
      Object.entries(doc.statuses).forEach(([status, count]) => {
        rows.push({
          documentType: doc.documentType === "INTERNSHIP" ? "ฝึกงาน" : "โครงงาน",
          documentName: doc.documentName,
          status,
          statusLabel: STATUS_LABELS[status] || status,
          count,
        });
      });
    });
    downloadCSV(
      rows,
      [
        { key: "documentType", header: "ประเภท" },
        { key: "documentName", header: "ชื่อเอกสาร" },
        { key: "statusLabel", header: "สถานะ" },
        { key: "count", header: "จำนวน" },
      ],
      `document-pipeline-${year ?? "all"}`
    );
  };

  const summaryCards = summary
    ? [
        { label: "ทั้งหมด", value: summary.total, color: "#475569" },
        { label: "รออนุมัติ", value: summary.pending, color: "#3b82f6" },
        { label: "อนุมัติแล้ว", value: summary.approved, color: "#22c55e" },
        { label: "ปฏิเสธ", value: summary.rejected, color: "#ef4444" },
        { label: "เสร็จสิ้น", value: summary.completed, color: "#0ea5e9" },
        { label: "แบบร่าง", value: summary.draft, color: "#94a3b8" },
      ]
    : [];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>สถานะเอกสาร</h1>
          <p className={styles.subtitle}>ภาพรวมเอกสารแยกตามประเภทและสถานะอนุมัติ</p>
        </div>
        <div className={btn.buttonRow}>
          <button type="button" className={btn.button} onClick={() => loadData(year, semester, docType)} disabled={loading}>
            {loading ? "กำลังโหลด..." : "รีเฟรช"}
          </button>
          <button type="button" className={btn.button} disabled={pipeline.length === 0} onClick={handleExportCsv}>
            ส่งออก CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <select className={styles.select} value={year ?? ""} onChange={e => setYear(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">ทุกปี</option>
          {years.map(y => <option key={y} value={y}>ปีการศึกษา {y}</option>)}
        </select>
        <select className={styles.select} value={semester ?? ""} onChange={e => setSemester(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">ทุกภาคเรียน</option>
          <option value="1">ภาค 1</option>
          <option value="2">ภาค 2</option>
          <option value="3">ภาคฤดูร้อน</option>
        </select>
        <select className={styles.select} value={docType} onChange={e => setDocType(e.target.value)}>
          <option value="">ทุกประเภท</option>
          <option value="INTERNSHIP">ฝึกงาน</option>
          <option value="PROJECT">โครงงาน</option>
        </select>
      </div>

      {/* Summary Rings */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>สรุปภาพรวม</h2>
        {loading && !summary ? (
          <StatSkeleton count={6} />
        ) : (
          <div className={styles.summaryGrid}>
            {summaryCards.map(c => (
              <div key={c.label} className={styles.summaryItem}>
                <Ring value={c.value} total={summary?.total ?? 1} color={c.color} />
                <p className={styles.summaryLabel}>{c.label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pipeline Bars */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>สัดส่วนสถานะแต่ละเอกสาร</h2>
        {loading && pipeline.length === 0 ? (
          <p className={styles.empty}>กำลังโหลด...</p>
        ) : pipeline.length === 0 ? (
          <p className={styles.empty}>ไม่พบข้อมูลเอกสาร</p>
        ) : (
          <>
            <div className={styles.pipelineList}>
              {pipeline.map((doc: DocumentPipelineItem) => (
                <div key={`${doc.documentType}:${doc.documentName}`} className={styles.pipelineRow}>
                  <div className={styles.pipelineMeta}>
                    <p className={styles.pipelineDocName}>{doc.documentName}</p>
                    <p className={styles.pipelineDocType}>
                      {doc.documentType === "INTERNSHIP" ? "ฝึกงาน" : "โครงงาน"} &middot; {doc.total}
                    </p>
                  </div>
                  <div className={styles.pipelineBarTrack}>
                    {Object.entries(doc.statuses)
                      .sort((a, b) => b[1] - a[1])
                      .map(([status, count]) => {
                        const pct = doc.total > 0 ? (count / doc.total) * 100 : 0;
                        if (pct < 1) return null;
                        return (
                          <div
                            key={status}
                            className={`${styles.pipelineBarSeg} ${BAR_COLORS[status] ?? styles.barOther}`}
                            style={{ width: `${pct}%` }}
                            title={`${STATUS_LABELS[status] || status}: ${count} (${pct.toFixed(1)}%)`}
                            data-label={pct > 8 ? `${count}` : undefined}
                          />
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className={styles.legend}>
              {visibleStatuses.map(s => (
                <span key={s} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: LEGEND_HEX[s] ?? "#a78bfa" }} />
                  {STATUS_LABELS[s] || s}
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Detail Table */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>ตารางรายละเอียด</h2>
        {pipeline.length === 0 ? (
          <p className={styles.empty}>ไม่มีข้อมูล</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "12%" }}>ประเภท</th>
                  <th style={{ width: "14%" }}>เอกสาร</th>
                  <th style={{ width: "10%", textAlign: "right" }}>รวม</th>
                  {visibleStatuses.map(s => (
                    <th key={s} style={{ textAlign: "right" }}>{STATUS_LABELS[s] || s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pipeline.map((doc) => (
                  <tr key={`${doc.documentType}:${doc.documentName}`}>
                    <td>{doc.documentType === "INTERNSHIP" ? "ฝึกงาน" : "โครงงาน"}</td>
                    <td><strong>{doc.documentName}</strong></td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{doc.total}</td>
                    {visibleStatuses.map(s => (
                      <td key={s} style={{ textAlign: "right" }}>
                        {doc.statuses[s] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
