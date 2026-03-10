"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cancelProject,
  getProjectAcademicYears,
  getProjectStatusSummary,
  type ProjectListItem,
  type ProjectStatusSummary,
} from "@/lib/services/reportService";
import { apiFetch } from "@/lib/api/client";
import { StatSkeleton, TableSkeleton } from "@/components/common/Skeleton";
import styles from "../internship/page.module.css";
import btn from "@/styles/shared/buttons.module.css";
import { currentBuddhistYear } from "@/lib/utils/thaiDateUtils";
import { downloadCSV } from "@/lib/utils/csvExport";

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

type ProjectFilters = {
  status: string;
  academicYear: number;
  page: number;
  limit: number;
};

type ProjectsResult = {
  projects?: ProjectListItem[];
  pagination?: { currentPage: number; itemsPerPage: number; totalItems: number };
};

async function fetchProjectList(filters: ProjectFilters): Promise<ProjectsResult> {
  const query = new URLSearchParams();
  if (filters.status) query.set("status", filters.status);
  if (filters.academicYear) query.set("academicYear", String(filters.academicYear));
  query.set("page", String(filters.page));
  query.set("limit", String(filters.limit));
  const qs = query.toString();
  const res = await apiFetch<{ success: boolean; data: ProjectsResult }>(`/admin/projects?${qs}`);
  return res.data ?? {};
}

export default function AdminProjectReportPage() {
  const anchorYear = useRef(currentBuddhistYear());
  const [year, setYear] = useState(anchorYear.current);
  const [semester, setSemester] = useState<number | undefined>(undefined);
  const [yearOptions, setYearOptions] = useState<number[]>([]);
  const [summary, setSummary] = useState<ProjectStatusSummary | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>({ status: "", academicYear: anchorYear.current, page: 1, limit: 20 });

  // Cancel
  const [cancelTarget, setCancelTarget] = useState<ProjectListItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);

  const loadSummary = useCallback(async (targetYear: number, targetSemester?: number) => {
    setLoading(true);
    try {
      const [sum, years] = await Promise.all([getProjectStatusSummary({ year: targetYear, semester: targetSemester }), getProjectAcademicYears()]);
      setSummary(sum);
      if (years.length > 0) setYearOptions(years);
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลได้" });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProjects = useCallback(async (f: ProjectFilters) => {
    setProjectsLoading(true);
    try {
      const result = await fetchProjectList(f);
      setProjects(result.projects ?? []);
      setTotalProjects(result.pagination?.totalItems ?? 0);
    } catch {
      // silently fail on project list
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary(year, semester);
  }, [year, semester, loadSummary]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, academicYear: year, page: 1 }));
  }, [year]);

  useEffect(() => {
    loadProjects(filters);
  }, [filters, loadProjects]);

  const kpis = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "โครงงานทั้งหมด", value: summary.totalProjects, filterValue: "" },
      { label: "กำลังดำเนินการ", value: summary.activeProjects, filterValue: "in_progress" },
      { label: "เสร็จสิ้น", value: summary.completedProjects, filterValue: "completed" },
      { label: "ยกเลิก", value: summary.criticalIssues, filterValue: "cancelled" },
    ];
  }, [summary]);

  const submitCancel = async () => {
    if (!cancelTarget?.projectId) return;
    setCancelBusy(true);
    try {
      await cancelProject(cancelTarget.projectId, cancelReason || "ยกเลิกโดยเจ้าหน้าที่ภาควิชา");
      setMessage({ tone: "success", text: "ยกเลิกโครงงานสำเร็จ" });
      setCancelTarget(null);
      await loadProjects(filters);
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "ไม่สามารถยกเลิกโครงงานได้" });
    } finally {
      setCancelBusy(false);
    }
  };

  const displayYears = yearOptions.length > 0 ? yearOptions : [anchorYear.current, anchorYear.current - 1, anchorYear.current - 2];
  const totalPages = Math.max(1, Math.ceil(totalProjects / filters.limit));

  return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>รายงานโครงงาน</h1>
            <p className={styles.subtitle}>สถิติและผลการสอบโครงงานพิเศษและปริญญานิพนธ์</p>
          </div>
          <div className={btn.buttonRow}>
            <button type="button" className={btn.button} onClick={() => { loadSummary(year); loadProjects(filters); }} disabled={loading}>
              {loading ? "กำลังโหลด..." : "รีเฟรช"}
            </button>
            <button
              type="button"
              className={btn.button}
              disabled={projects.length === 0}
              onClick={() =>
                downloadCSV(
                  projects,
                  [
                    { key: "projectTitle", header: "ชื่อโครงงาน" },
                    { key: "status", header: "สถานะ", format: (v) => PROJECT_STATUS_LABELS[String(v ?? "")] ?? String(v ?? "") },
                    { key: "members", header: "นักศึกษา", format: (v) => ((v as ProjectListItem["members"]) ?? []).map((m) => `${m.studentCode} ${m.name}`).join(", ") },
                    { key: "advisorName", header: "ที่ปรึกษา" },
                  ],
                  `project-report-${year}`
                )
              }
            >
              ส่งออก CSV
            </button>
          </div>
        </header>

        {message ? (
          <div className={`${styles.alert} ${message.tone === "success" ? styles.alertSuccess : styles.alertWarning}`}>
            {message.text}
          </div>
        ) : null}

        {/* Filters */}
        <section className={styles.card}>
          <div className={styles.filters}>
            <select aria-label="ปีการศึกษา" className={styles.select} value={String(year)} onChange={(e) => setYear(Number(e.target.value))}>
              {displayYears.map((y) => (
                <option key={y} value={y}>ปีการศึกษา {y}</option>
              ))}
            </select>
            <select
              aria-label="ภาคเรียน"
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

        {/* KPI Cards */}
        <section className={styles.card}>
          {loading && !summary ? (
            <StatSkeleton count={4} />
          ) : kpis.length > 0 ? (
            <div className={styles.stats}>
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className={`${styles.statItem} ${styles.statItemClickable} ${filters.status === kpi.filterValue ? styles.statItemActive : ""}`}
                  onClick={() => setFilters((prev) => ({ ...prev, status: prev.status === kpi.filterValue ? "" : kpi.filterValue, page: 1 }))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") setFilters((prev) => ({ ...prev, status: prev.status === kpi.filterValue ? "" : kpi.filterValue, page: 1 })); }}
                >
                  <p className={styles.statLabel}>{kpi.label}</p>
                  <p className={styles.statValue}>{kpi.value ?? "-"}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {/* Project 1 & 2 */}
        {summary ? (
          <section className={styles.card}>
            <h3 className={styles.sectionTitle}>ผลสอบโครงงาน</h3>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <p className={styles.statLabel}>โครงงานพิเศษ 1 (ทั้งหมด)</p>
                <p className={styles.statValue}>{summary.project1?.total ?? "-"}</p>
              </div>
              <div className={styles.statItem}>
                <p className={styles.statLabel}>ผ่าน</p>
                <p className={styles.statValue}>{summary.project1?.passed ?? "-"}</p>
              </div>
              <div className={styles.statItem}>
                <p className={styles.statLabel}>ไม่ผ่าน</p>
                <p className={styles.statValue}>{summary.project1?.failed ?? "-"}</p>
              </div>
              <div className={styles.statItem}>
                <p className={styles.statLabel}>ปริญญานิพนธ์ (ทั้งหมด)</p>
                <p className={styles.statValue}>{summary.project2?.total ?? "-"}</p>
              </div>
              <div className={styles.statItem}>
                <p className={styles.statLabel}>ผ่าน</p>
                <p className={styles.statValue}>{summary.project2?.passed ?? "-"}</p>
              </div>
              <div className={styles.statItem}>
                <p className={styles.statLabel}>ไม่ผ่าน</p>
                <p className={styles.statValue}>{summary.project2?.failed ?? "-"}</p>
              </div>
            </div>
          </section>
        ) : null}

        {/* Projects List */}
        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>รายการโครงงาน</h3>
          <div className={styles.filters}>
            <select
              aria-label="สถานะโครงงาน"
              className={styles.select}
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
            >
              <option value="">ทุกสถานะ</option>
              {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <colgroup>
                <col className={styles.colTitle} />
                <col className={styles.colStatus} />
                <col className={styles.colMembers} />
                <col className={styles.colAdvisor} />
                <col className={styles.colAction} />
              </colgroup>
              <thead>
                <tr>
                  <th>ชื่อโครงงาน</th>
                  <th>สถานะ</th>
                  <th>นักศึกษา</th>
                  <th>ที่ปรึกษา</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {projects.length > 0 ? (
                  projects.map((p, idx) => (
                    <tr key={p.projectId ?? idx}>
                      <td>{p.projectTitle ?? "-"}</td>
                      <td>
                        <span className={styles.tag}>{PROJECT_STATUS_LABELS[p.status ?? ""] ?? p.status ?? "-"}</span>
                      </td>
                      <td>
                        {p.members?.map((m, memberIndex) => {
                          const memberKey = [
                            p.projectId ?? p.projectCode ?? "project",
                            m.studentCode ?? m.name ?? "member",
                            memberIndex,
                          ].join("-");

                          return (
                            <div key={memberKey}>
                              {m.studentCode} - {m.name}
                            </div>
                          );
                        }) ?? "-"}
                      </td>
                      <td>{p.advisorName ?? "-"}</td>
                      <td>
                        {p.status !== "cancelled" ? (
                          <button
                            type="button"
                            className={`${btn.button} ${btn.buttonDanger}`}
                            onClick={() => { setCancelTarget(p); setCancelReason(""); }}
                          >
                            ยกเลิก
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                ) : (
                  projectsLoading ? (
                    <TableSkeleton rows={5} columns={5} />
                  ) : (
                    <tr><td colSpan={5}><p className={styles.empty}>ไม่พบข้อมูล</p></td></tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <p className={styles.paginationInfo}>หน้า {filters.page} / {totalPages} (ทั้งหมด {totalProjects} รายการ)</p>
            <button type="button" className={btn.button} disabled={filters.page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}>ก่อนหน้า</button>
            <button type="button" className={btn.button} disabled={filters.page >= totalPages} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}>ถัดไป</button>
          </div>
        </section>

        {/* Cancel Modal */}
        {cancelTarget ? (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3 className={styles.modalTitle}>ยกเลิกโครงงาน</h3>
              <p className={styles.empty}>{cancelTarget.projectTitle ?? cancelTarget.projectCode}</p>
              <label className={styles.field}>
                เหตุผล
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="ระบุเหตุผล (ถ้าไม่ระบุจะใช้ค่าเริ่มต้น)"
                />
              </label>
              <div className={btn.buttonRow}>
                <button type="button" className={btn.button} onClick={() => setCancelTarget(null)} disabled={cancelBusy}>ปิด</button>
                <button type="button" className={`${btn.button} ${btn.buttonDanger}`} onClick={submitCancel} disabled={cancelBusy}>
                  {cancelBusy ? "กำลังยกเลิก..." : "ยืนยันยกเลิก"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
  );
}
