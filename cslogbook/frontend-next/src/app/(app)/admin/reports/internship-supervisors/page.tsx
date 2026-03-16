"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getInternshipSupervisorReport,
  getInternshipAcademicYears,
  type InternshipSupervisorReportData,
  type InternshipSupervisorItem,
} from "@/lib/services/reportService";
import { downloadCSV } from "@/lib/utils/csvExport";
import { StatSkeleton } from "@/components/common/Skeleton";
import btn from "@/styles/shared/buttons.module.css";
import styles from "./page.module.css";

function rateClass(rate: number) {
  if (rate >= 80) return styles.rateHigh;
  if (rate >= 50) return styles.rateMid;
  return styles.rateLow;
}

function rateColor(rate: number) {
  if (rate >= 80) return "#22c55e";
  if (rate >= 50) return "#f59e0b";
  return "#ef4444";
}

export default function InternshipSupervisorsPage() {
  const [year, setYear] = useState<number | undefined>();
  const [semester, setSemester] = useState<number | undefined>();
  const [years, setYears] = useState<number[]>([]);
  const [data, setData] = useState<InternshipSupervisorReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadYears = useCallback(async () => {
    const y = await getInternshipAcademicYears();
    setYears(y);
    setYear(prev => prev === undefined && y.length > 0 ? y[0] : prev);
  }, []);

  const loadData = useCallback(async (y?: number, sem?: number) => {
    setLoading(true);
    try {
      const result = await getInternshipSupervisorReport({ year: y, semester: sem });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadYears(); }, [loadYears]);
  useEffect(() => { if (year) loadData(year, semester); }, [year, semester, loadData]);

  const filtered = useMemo(() => {
    const list = data?.supervisors ?? [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((s: InternshipSupervisorItem) =>
      s.companyName.toLowerCase().includes(q) ||
      s.supervisorName.toLowerCase().includes(q) ||
      (s.supervisorEmail ?? "").toLowerCase().includes(q)
    );
  }, [data, search]);

  // KPIs
  const totalSupervisors = filtered.length;
  const totalStudents = filtered.reduce((s, a) => s + a.studentCount, 0);
  const avgSupervisorRate = totalSupervisors
    ? +(filtered.reduce((s, a) => s + a.supervisorApprovalRate, 0) / totalSupervisors).toFixed(1)
    : 0;
  const avgEval = totalSupervisors
    ? +(filtered.reduce((s, a) => s + a.evaluationCompletionRate, 0) / totalSupervisors).toFixed(1)
    : 0;
  const uniqueCompanies = new Set(filtered.map(s => s.companyName)).size;

  const handleExportCsv = () => {
    downloadCSV(
      filtered.map(s => ({ ...s })),
      [
        { key: "companyName", header: "บริษัท" },
        { key: "supervisorName", header: "พี่เลี้ยง" },
        { key: "supervisorEmail", header: "อีเมลพี่เลี้ยง" },
        { key: "studentCount", header: "จำนวน นศ." },
        { key: "totalLogs", header: "Logbook ทั้งหมด" },
        { key: "supervisorApprovalRate", header: "พี่เลี้ยงอนุมัติ (%)" },
        { key: "evaluationCompletionRate", header: "ประเมินครบ (%)" },
        { key: "evaluatedStudents", header: "ประเมินแล้ว (คน)" },
      ],
      `internship-supervisors-${year ?? "all"}`
    );
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>รายงานสถานประกอบการ</h1>
          <p className={styles.subtitle}>สถิติบริษัท, พี่เลี้ยง, สถานะ logbook, และการประเมิน</p>
        </div>
        <div className={btn.buttonRow}>
          <button type="button" className={btn.button} onClick={() => loadData(year, semester)} disabled={loading}>
            {loading ? "กำลังโหลด..." : "รีเฟรช"}
          </button>
          <button type="button" className={btn.button} disabled={filtered.length === 0} onClick={handleExportCsv}>
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
        <input
          className={styles.input}
          placeholder="ค้นหาบริษัท / พี่เลี้ยง / อีเมล"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* KPI Strip */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>สรุปภาพรวม</h2>
        {loading && !data ? (
          <StatSkeleton count={5} />
        ) : (
          <div className={styles.kpiStrip}>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>บริษัท</p>
              <p className={styles.kpiValue}>{uniqueCompanies}</p>
              <p className={styles.kpiSub}>แห่ง</p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>พี่เลี้ยง</p>
              <p className={styles.kpiValue}>{totalSupervisors}</p>
              <p className={styles.kpiSub}>คน</p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>นักศึกษา</p>
              <p className={styles.kpiValue}>{totalStudents}</p>
              <p className={styles.kpiSub}>คน</p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>พี่เลี้ยงอนุมัติ เฉลี่ย</p>
              <p className={styles.kpiValue}>
                <span className={`${styles.ratePill} ${rateClass(avgSupervisorRate)}`}>{avgSupervisorRate}%</span>
              </p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>ประเมินครบ เฉลี่ย</p>
              <p className={styles.kpiValue}>
                <span className={`${styles.ratePill} ${rateClass(avgEval)}`}>{avgEval}%</span>
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Supervisor Table */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>รายละเอียดพี่เลี้ยง</h2>
        {loading && filtered.length === 0 ? (
          <p className={styles.empty}>กำลังโหลด...</p>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>ไม่พบข้อมูลพี่เลี้ยงฝึกงาน</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>บริษัท</th>
                  <th style={{ width: "14%" }}>พี่เลี้ยง</th>
                  <th style={{ width: "6%", textAlign: "right" }}>นศ.</th>
                  <th style={{ width: "7%", textAlign: "right" }}>Logbook</th>
                  <th style={{ width: "18%" }}>พี่เลี้ยงอนุมัติ</th>
                  <th style={{ width: "16%" }}>ประเมินครบ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: InternshipSupervisorItem, idx: number) => (
                  <tr key={`${s.companyName}-${s.supervisorName}-${idx}`}>
                    <td><strong>{s.companyName}</strong></td>
                    <td>
                      {s.supervisorName}
                      {s.supervisorEmail && (
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{s.supervisorEmail}</div>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>{s.studentCount}</td>
                    <td style={{ textAlign: "right" }}>{s.totalLogs}</td>
                    <td>
                      <div className={styles.rateCell}>
                        <span className={`${styles.ratePill} ${rateClass(s.supervisorApprovalRate)}`}>
                          {s.supervisorApprovalRate}%
                        </span>
                        <div className={styles.sparkBar}>
                          <div className={styles.sparkFill} style={{ width: `${s.supervisorApprovalRate}%`, background: rateColor(s.supervisorApprovalRate) }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.rateCell}>
                        <span className={`${styles.ratePill} ${rateClass(s.evaluationCompletionRate)}`}>
                          {s.evaluationCompletionRate}%
                        </span>
                        <div className={styles.sparkBar}>
                          <div className={styles.sparkFill} style={{ width: `${s.evaluationCompletionRate}%`, background: rateColor(s.evaluationCompletionRate) }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <p className={styles.empty}>ทั้งหมด {filtered.length} รายการ จาก {uniqueCompanies} บริษัท</p>
        )}
      </section>
    </div>
  );
}
