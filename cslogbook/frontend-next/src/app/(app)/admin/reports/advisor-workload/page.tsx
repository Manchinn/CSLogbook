"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAdvisorDetail,
  getAdvisorWorkload,
  type AdvisorDetail,
  type AdvisorWorkloadItem,
} from "@/lib/services/reportService";
import styles from "../internship/page.module.css";

export default function AdminAdvisorWorkloadPage() {
  const [advisorData, setAdvisorData] = useState<AdvisorWorkloadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail modal
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorWorkloadItem | null>(null);
  const [advisorDetail, setAdvisorDetail] = useState<AdvisorDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdvisorWorkload();
      setAdvisorData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summaryStats = useMemo(() => {
    if (!advisorData.length) return { totalAdvisors: 0, totalProjects: 0, avgLoad: 0, maxLoad: 0 };
    const totalAdvisors = advisorData.length;
    const totalProjects = advisorData.reduce((sum, item) => sum + (item.advisorProjectCount ?? 0) + (item.coAdvisorProjectCount ?? 0), 0);
    const avgLoad = totalAdvisors > 0 ? totalProjects / totalAdvisors : 0;
    const maxLoad = Math.max(...advisorData.map((item) => (item.advisorProjectCount ?? 0) + (item.coAdvisorProjectCount ?? 0)));
    return { totalAdvisors, totalProjects, avgLoad, maxLoad };
  }, [advisorData]);

  const openDetail = async (record: AdvisorWorkloadItem) => {
    if (!record.teacherId) return;
    setSelectedAdvisor(record);
    setAdvisorDetail(null);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await getAdvisorDetail(record.teacherId);
      setAdvisorDetail(detail);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "ไม่สามารถโหลดรายละเอียดได้");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedAdvisor(null);
    setAdvisorDetail(null);
    setDetailError(null);
  };

  const PROJECT_ROLE_LABELS: Record<string, string> = {
    advisor: "ที่ปรึกษาหลัก",
    "co-advisor": "ที่ปรึกษาร่วม",
  };

  const PROJECT_STATUS_LABELS: Record<string, string> = {
    draft: "แบบร่าง",
    pending: "รออนุมัติ",
    advisor_assigned: "บันทึกที่ปรึกษา",
    approved: "อนุมัติแล้ว",
    in_progress: "กำลังดำเนินการ",
    completed: "เสร็จสิ้น",
    rejected: "ไม่อนุมัติ",
    cancelled: "ยกเลิก",
  };

  return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>รายงานภาระงานอาจารย์ที่ปรึกษา</h1>
            <p className={styles.subtitle}>จำนวนโครงงานที่ดูแลแยกตามบทบาทที่ปรึกษาหลัก/ร่วม</p>
          </div>
          <button type="button" className={styles.button} onClick={loadData} disabled={loading}>
            {loading ? "กำลังโหลด..." : "รีเฟรช"}
          </button>
        </header>

        {error ? <div className={`${styles.alert} ${styles.alertWarning}`}>{error}</div> : null}

        {/* Summary Cards */}
        <section className={styles.card}>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>อาจารย์ที่ปรึกษา</p>
              <p className={styles.statValue}>{summaryStats.totalAdvisors}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>โครงงานทั้งหมด</p>
              <p className={styles.statValue}>{summaryStats.totalProjects}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>ภาระงานเฉลี่ย</p>
              <p className={styles.statValue}>{summaryStats.avgLoad.toFixed(1)} โครงงาน/คน</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>ภาระงานสูงสุด</p>
              <p className={styles.statValue}>{summaryStats.maxLoad} โครงงาน</p>
            </div>
          </div>
        </section>

        {/* Advisor Table */}
        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>รายละเอียดอาจารย์ที่ปรึกษา</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ชื่ออาจารย์</th>
                  <th>รหัส</th>
                  <th>ที่ปรึกษาหลัก</th>
                  <th>ที่ปรึกษาร่วม</th>
                  <th>รวม</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {advisorData.length > 0 ? (
                  advisorData.map((item, idx) => {
                    const total = (item.advisorProjectCount ?? 0) + (item.coAdvisorProjectCount ?? 0);
                    return (
                      <tr key={item.teacherId ?? idx}>
                        <td>{item.name ?? "-"}</td>
                        <td>{item.teacherCode ?? "-"}</td>
                        <td>{item.advisorProjectCount ?? 0}</td>
                        <td>{item.coAdvisorProjectCount ?? 0}</td>
                        <td>
                          <span className={`${styles.tag} ${total > 10 ? styles.buttonDanger : ""}`}>{total}</span>
                        </td>
                        <td>
                          <button type="button" className={styles.button} onClick={() => openDetail(item)}>
                            รายละเอียด
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <p className={styles.empty}>{loading ? "กำลังโหลด..." : "ไม่พบข้อมูล"}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Advisor Detail Modal */}
        {selectedAdvisor ? (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ width: "min(820px, 96vw)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className={styles.modalTitle}>
                  ภาระงาน: {selectedAdvisor.name ?? selectedAdvisor.teacherCode}
                </h3>
                <button type="button" className={styles.button} onClick={closeDetail}>ปิด</button>
              </div>

              {detailLoading ? <p className={styles.empty}>กำลังโหลด...</p> : null}
              {detailError ? <div className={`${styles.alert} ${styles.alertWarning}`}>{detailError}</div> : null}

              {advisorDetail ? (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <div className={styles.stats}>
                    <div className={styles.statItem}>
                      <p className={styles.statLabel}>รหัส</p>
                      <p className={styles.statValue} style={{ fontSize: "1rem" }}>{advisorDetail.teacher?.teacherCode ?? "-"}</p>
                    </div>
                    <div className={styles.statItem}>
                      <p className={styles.statLabel}>ชื่อ</p>
                      <p className={styles.statValue} style={{ fontSize: "1rem" }}>{advisorDetail.teacher?.name ?? "-"}</p>
                    </div>
                    <div className={styles.statItem}>
                      <p className={styles.statLabel}>โครงงานทั้งหมด</p>
                      <p className={styles.statValue}>{advisorDetail.summary?.totalProjects ?? "-"}</p>
                    </div>
                    <div className={styles.statItem}>
                      <p className={styles.statLabel}>ที่ปรึกษาหลัก</p>
                      <p className={styles.statValue}>{advisorDetail.summary?.advisorProjectsCount ?? "-"}</p>
                    </div>
                    <div className={styles.statItem}>
                      <p className={styles.statLabel}>ที่ปรึกษาร่วม</p>
                      <p className={styles.statValue}>{advisorDetail.summary?.coAdvisorProjectsCount ?? "-"}</p>
                    </div>
                  </div>

                  {advisorDetail.projects && advisorDetail.projects.length > 0 ? (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>ชื่อโครงงาน</th>
                            <th>นักศึกษา</th>
                            <th>บทบาท</th>
                            <th>สถานะ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {advisorDetail.projects.map((p) => (
                            <tr key={p.projectId}>
                              <td>{p.projectName}</td>
                              <td>
                                {p.members?.map((m) => (
                                  <div key={m.studentCode} style={{ fontSize: "0.85rem" }}>
                                    {m.studentCode} - {m.name}
                                  </div>
                                ))}
                              </td>
                              <td>
                                <span className={styles.tag}>{PROJECT_ROLE_LABELS[p.role] ?? p.role}</span>
                              </td>
                              <td>
                                <span className={styles.tag}>{PROJECT_STATUS_LABELS[p.status] ?? p.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className={styles.empty}>ไม่มีโครงงาน</p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
  );
}
