"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getWorkflowProgress, type WorkflowProgressData } from "@/lib/services/reportService";
import styles from "../internship/page.module.css";

const WORKFLOW_TYPES = [
  { value: "internship", label: "ฝึกงาน" },
  { value: "project1", label: "โครงงานพิเศษ 1" },
  { value: "project2", label: "ปริญญานิพนธ์" },
];

export default function AdminWorkflowProgressPage() {
  const [workflowType, setWorkflowType] = useState("internship");
  const [data, setData] = useState<WorkflowProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (type: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getWorkflowProgress({ workflowType: type });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(workflowType);
  }, [workflowType, loadData]);

  const summaryKpis = useMemo(() => {
    if (!data?.summary) return [];
    return [
      { label: "นักศึกษาทั้งหมด", value: data.summary.totalStudents },
      { label: "กำลังดำเนินการ", value: data.summary.inProgress },
      { label: "เสร็จสิ้น", value: data.summary.completed },
      { label: "ติดขัด/หยุดนิ่ง", value: data.summary.blocked },
    ];
  }, [data]);

  const typeLabel = WORKFLOW_TYPES.find((t) => t.value === workflowType)?.label ?? workflowType;

  return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>รายงานความคืบหน้า Workflow</h1>
            <p className={styles.subtitle}>ติดตามการเดินทางของนักศึกษาผ่านขั้นตอนต่างๆ</p>
          </div>
          <button type="button" className={styles.button} onClick={() => loadData(workflowType)} disabled={loading}>
            {loading ? "กำลังโหลด..." : "รีเฟรช"}
          </button>
        </header>

        {error ? <div className={`${styles.alert} ${styles.alertWarning}`}>{error}</div> : null}

        {/* Workflow Type Filter */}
        <section className={styles.card}>
          <div className={styles.filters}>
            <select className={styles.select} value={workflowType} onChange={(e) => setWorkflowType(e.target.value)}>
              {WORKFLOW_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className={styles.empty}>กำลังแสดง: {typeLabel}</p>
          </div>
        </section>

        {/* KPI Summary */}
        {summaryKpis.length > 0 ? (
          <section className={styles.card}>
            <div className={styles.stats}>
              {summaryKpis.map((kpi) => (
                <div key={kpi.label} className={styles.statItem}>
                  <p className={styles.statLabel}>{kpi.label}</p>
                  <p className={styles.statValue}>{kpi.value ?? "-"}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Funnel Steps */}
        {data?.funnelSteps && data.funnelSteps.length > 0 ? (
          <section className={styles.card}>
            <h3 className={styles.sectionTitle}>ขั้นตอนการดำเนินงาน (Funnel)</h3>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ขั้นตอน</th>
                    <th>จำนวนนักศึกษา</th>
                    <th>เปอร์เซ็นต์</th>
                  </tr>
                </thead>
                <tbody>
                  {data.funnelSteps.map((step, idx) => (
                    <tr key={step.stepName ?? idx}>
                      <td>{step.stepName}</td>
                      <td>{step.count}</td>
                      <td>{step.percentage != null ? `${step.percentage.toFixed(1)}%` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Bottlenecks */}
        {data?.bottlenecks && data.bottlenecks.length > 0 ? (
          <section className={styles.card}>
            <h3 className={styles.sectionTitle}>จุดที่นักศึกษาติดขัด (Bottlenecks)</h3>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ขั้นตอน</th>
                    <th>จำนวนที่ติดขัด</th>
                    <th>เฉลี่ยวันที่ค้าง</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bottlenecks.map((b, idx) => (
                    <tr key={b.stepName ?? idx}>
                      <td>{b.stepName}</td>
                      <td>{b.stuckCount}</td>
                      <td>{b.avgDaysStuck != null ? `${b.avgDaysStuck.toFixed(1)} วัน` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Blocked Students */}
        {data?.blockedStudents && data.blockedStudents.length > 0 ? (
          <section className={styles.card}>
            <h3 className={styles.sectionTitle}>นักศึกษาที่ติดขัด</h3>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>รหัส</th>
                    <th>ชื่อ</th>
                    <th>ขั้นตอนที่ติดขัด</th>
                    <th>วันที่ผ่านมาแล้ว</th>
                  </tr>
                </thead>
                <tbody>
                  {data.blockedStudents.map((s, idx) => (
                    <tr key={s.studentCode ?? idx}>
                      <td>{s.studentCode ?? "-"}</td>
                      <td>{s.fullName ?? "-"}</td>
                      <td>{s.stuckStepName ?? "-"}</td>
                      <td>{s.daysSinceLastUpdate != null ? `${s.daysSinceLastUpdate} วัน` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {!loading && !data && !error ? (
          <section className={styles.card}>
            <p className={styles.empty}>ไม่พบข้อมูล Workflow</p>
          </section>
        ) : null}
      </div>
  );
}
