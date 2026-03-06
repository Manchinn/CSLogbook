"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { getDeadlineCompliance, type DeadlineComplianceReport } from "@/lib/services/reportService";
import styles from "../internship/page.module.css";
import { currentBuddhistYear } from "@/lib/utils/thaiDateUtils";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { dateStyle: "medium" }).format(d);
}

export default function AdminDeadlineCompliancePage() {
  const anchorYear = useRef(currentBuddhistYear());
  const [year, setYear] = useState(anchorYear.current);
  const [semester, setSemester] = useState<number | undefined>(undefined);
  const [data, setData] = useState<DeadlineComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (targetYear: number, targetSemester?: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDeadlineCompliance({ year: targetYear, semester: targetSemester });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(year, semester);
  }, [year, semester, loadData]);

  const kpis = useMemo(() => {
    if (!data) return [];
    return [
      { label: "กำหนดการทั้งหมด", value: data.totalDeadlines },
      { label: "ส่งตรงเวลา (%)", value: data.onTimePercentage != null ? `${data.onTimePercentage.toFixed(1)}%` : "-" },
      { label: "กำหนดการที่กำลังจะมาถึง", value: data.upcomingCount },
      { label: "เลยกำหนดแล้ว", value: data.overdueCount },
    ];
  }, [data]);

  const displayYears = [anchorYear.current, anchorYear.current - 1, anchorYear.current - 2];

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>รายงานการส่งงานตามกำหนด</h1>
            <p className={styles.subtitle}>ติดตามอัตราการส่งงานตรงเวลาและนักศึกษาที่ส่งล่าช้า</p>
          </div>
          <button type="button" className={styles.button} onClick={() => loadData(year, semester)} disabled={loading}>
            {loading ? "กำลังโหลด..." : "รีเฟรช"}
          </button>
        </header>

        {error ? <div className={`${styles.alert} ${styles.alertWarning}`}>{error}</div> : null}

        {/* Filters */}
        <section className={styles.card}>
          <div className={styles.filters}>
            <select className={styles.select} value={String(year)} onChange={(e) => setYear(Number(e.target.value))}>
              {displayYears.map((y) => (
                <option key={y} value={y}>ปีการศึกษา {y}</option>
              ))}
            </select>
            <select
              className={styles.select}
              value={semester !== undefined ? String(semester) : ""}
              onChange={(e) => setSemester(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">ทุกภาคเรียน</option>
              <option value="1">ภาค 1</option>
              <option value="2">ภาค 2</option>
              <option value="3">ภาคฤดูร้อน</option>
            </select>
          </div>
        </section>

        {/* KPIs */}
        {kpis.length > 0 ? (
          <section className={styles.card}>
            <div className={styles.stats}>
              {kpis.map((kpi) => (
                <div key={kpi.label} className={styles.statItem}>
                  <p className={styles.statLabel}>{kpi.label}</p>
                  <p className={styles.statValue}>{kpi.value ?? "-"}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Deadlines compliance table */}
        {data?.deadlines && data.deadlines.length > 0 ? (
          <section className={styles.card}>
            <h3 className={styles.sectionTitle}>อัตราการส่งงานของแต่ละกำหนดการ</h3>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>กำหนดการ</th>
                    <th>วันครบกำหนด</th>
                    <th>ส่งตรงเวลา</th>
                    <th>ส่งช้า</th>
                    <th>ทั้งหมด</th>
                    <th>อัตรา (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deadlines.map((d) => (
                    <tr key={d.deadlineId}>
                      <td>{d.deadlineName}</td>
                      <td>{formatDate(d.deadlineDate)}</td>
                      <td>{d.onTimeCount}</td>
                      <td>{d.lateCount}</td>
                      <td>{d.totalStudents}</td>
                      <td>{d.complianceRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Upcoming deadlines */}
        {data?.upcomingDeadlines && data.upcomingDeadlines.length > 0 ? (
          <section className={styles.card}>
            <h3 className={styles.sectionTitle}>กำหนดการที่กำลังจะมาถึง (7 วันข้างหน้า)</h3>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>กำหนดการ</th>
                    <th>วันที่</th>
                    <th>อีกกี่วัน</th>
                  </tr>
                </thead>
                <tbody>
                  {data.upcomingDeadlines.map((d) => (
                    <tr key={d.deadlineId}>
                      <td>{d.deadlineName}</td>
                      <td>{formatDate(d.deadlineDate)}</td>
                      <td>{d.daysUntil} วัน</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Late students */}
        {data?.lateStudents && data.lateStudents.length > 0 ? (
          <section className={styles.card}>
            <h3 className={styles.sectionTitle}>นักศึกษาที่ส่งล่าช้า</h3>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>รหัส</th>
                    <th>ชื่อ</th>
                    <th>กำหนดการ</th>
                    <th>ส่งช้า (วัน)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lateStudents.map((s, idx) => (
                    <tr key={`${s.studentCode}-${s.deadlineName}-${idx}`}>
                      <td>{s.studentCode}</td>
                      <td>{s.fullName}</td>
                      <td>{s.deadlineName}</td>
                      <td>{s.daysLate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {!loading && !data && !error ? (
          <section className={styles.card}>
            <p className={styles.empty}>ไม่พบข้อมูล</p>
          </section>
        ) : null}
      </div>
    </RoleGuard>
  );
}
