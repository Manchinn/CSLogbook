"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cancelInternship,
  getEnrolledInternshipStudents,
  getInternshipAcademicYears,
  getInternshipEvaluationSummary,
  getInternshipStudentSummary,
  updateInternship,
  type EnrolledInternshipStudent,
} from "@/lib/services/reportService";
import { StatSkeleton, TableSkeleton } from "@/components/common/Skeleton";
import btn from "@/styles/shared/buttons.module.css";
import styles from "./page.module.css";
import { currentBuddhistYear } from "@/lib/utils/thaiDateUtils";
import { downloadCSV } from "@/lib/utils/csvExport";

const STATUS_LABELS: Record<string, string> = {
  not_started: "ยังไม่เริ่ม",
  pending_approval: "รออนุมัติ",
  in_progress: "อยู่ระหว่างฝึกงาน",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิกการฝึกงาน",
};

const STATUS_COLORS: Record<string, string> = {
  not_started: "default",
  pending_approval: "processing",
  in_progress: "warning",
  completed: "success",
  cancelled: "error",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { dateStyle: "short" }).format(d);
}

type EditForm = {
  companyName: string;
  internshipPosition: string;
  supervisorName: string;
};

export default function AdminInternshipReportPage() {
  const anchorYear = useRef(currentBuddhistYear());
  const [year, setYear] = useState(anchorYear.current);
  const [semester, setSemester] = useState<number | undefined>(undefined);
  const [yearOptions, setYearOptions] = useState<number[]>([]);
  const [summary, setSummary] = useState<{ enrolledCount?: number | null; completed?: number | null; inProgress?: number | null; notStarted?: number | null } | null>(null);
  const [evaluation, setEvaluation] = useState<{ criteriaAverages?: Array<{ criteriaName: string; average: number }> | null } | null>(null);
  const [students, setStudents] = useState<EnrolledInternshipStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  // Edit modal
  const [editTarget, setEditTarget] = useState<EnrolledInternshipStudent | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ companyName: "", internshipPosition: "", supervisorName: "" });
  const [editBusy, setEditBusy] = useState(false);

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState<EnrolledInternshipStudent | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);

  const loadData = useCallback(async (targetYear: number, targetSemester?: number) => {
    setLoading(true);
    setMessage(null);
    try {
      const [sum, evalSum, studentList, availableYears] = await Promise.all([
        getInternshipStudentSummary({ year: targetYear, semester: targetSemester }),
        getInternshipEvaluationSummary({ year: targetYear, semester: targetSemester }),
        getEnrolledInternshipStudents({ year: targetYear }),
        getInternshipAcademicYears(),
      ]);
      setSummary(sum);
      setEvaluation(evalSum);
      setStudents(Array.isArray(studentList) ? studentList : []);
      if (availableYears.length > 0) setYearOptions(availableYears);
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลได้" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(year, semester);
  }, [year, semester, loadData]);

  const kpis = useMemo(() => {
    const enrolledCount = summary?.enrolledCount ?? students.length;
    const completedVal = summary?.completed ?? students.filter((s) => s.internshipStatus === "completed").length;
    const inProgressVal = summary?.inProgress ?? students.filter((s) => ["in_progress", "pending_approval"].includes(s.internshipStatus ?? "")).length;
    const notStartedVal = summary?.notStarted ?? 0;
    return [
      { label: "ลงทะเบียนฝึกงาน", value: enrolledCount, filterValue: "" },
      { label: "ฝึกงานเสร็จแล้ว", value: completedVal, filterValue: "completed" },
      { label: "อยู่ระหว่างฝึกงาน", value: inProgressVal, filterValue: "in_progress" },
      { label: "ยังไม่เริ่ม", value: notStartedVal, filterValue: "not_started" },
    ];
  }, [summary, students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (statusFilter && s.internshipStatus !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !s.studentCode?.toLowerCase().includes(q) &&
          !s.fullName?.toLowerCase().includes(q) &&
          !s.companyName?.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [students, statusFilter, search]);

  const openEdit = (record: EnrolledInternshipStudent) => {
    setEditTarget(record);
    setEditForm({
      companyName: record.companyName ?? "",
      internshipPosition: record.internshipPosition ?? "",
      supervisorName: record.supervisorName ?? "",
    });
  };

  const submitEdit = async () => {
    if (!editTarget?.internshipId) return;
    setEditBusy(true);
    try {
      await updateInternship(editTarget.internshipId, editForm);
      setMessage({ tone: "success", text: "อัปเดตข้อมูลสำเร็จ" });
      setEditTarget(null);
      await loadData(year, semester);
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "ไม่สามารถอัปเดตข้อมูลได้" });
    } finally {
      setEditBusy(false);
    }
  };

  const openCancel = (record: EnrolledInternshipStudent) => {
    setCancelTarget(record);
    setCancelReason("");
  };

  const submitCancel = async () => {
    if (!cancelTarget?.internshipId) return;
    if (!cancelReason.trim()) {
      setMessage({ tone: "error", text: "กรุณาระบุเหตุผลการยกเลิก" });
      return;
    }
    setCancelBusy(true);
    try {
      await cancelInternship(cancelTarget.internshipId, cancelReason.trim());
      setMessage({ tone: "success", text: "ยกเลิกการฝึกงานสำเร็จ" });
      setCancelTarget(null);
      await loadData(year, semester);
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "ไม่สามารถยกเลิกการฝึกงานได้" });
    } finally {
      setCancelBusy(false);
    }
  };

  const displayYears = yearOptions.length > 0 ? yearOptions : [anchorYear.current, anchorYear.current - 1, anchorYear.current - 2];

  return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>รายงานการฝึกงาน</h1>
            <p className={styles.subtitle}>ข้อมูลนักศึกษาฝึกงานและผลการประเมิน</p>
          </div>
          <div className={btn.buttonRow}>
            <button type="button" className={btn.button} onClick={() => loadData(year, semester)} disabled={loading}>
              {loading ? "กำลังโหลด..." : "รีเฟรช"}
            </button>
            <button
              type="button"
              className={btn.button}
              disabled={filteredStudents.length === 0}
              onClick={() =>
                downloadCSV(
                  filteredStudents,
                  [
                    { key: "studentCode", header: "รหัสนักศึกษา" },
                    { key: "fullName", header: "ชื่อ-นามสกุล" },
                    { key: "studentYear", header: "ชั้นปี" },
                    { key: "internshipStatus", header: "สถานะ", format: (v) => STATUS_LABELS[String(v ?? "")] ?? String(v ?? "") },
                    { key: "companyName", header: "บริษัท" },
                    { key: "internshipPosition", header: "ตำแหน่ง" },
                    { key: "supervisorName", header: "พี่เลี้ยง" },
                    { key: "startDate", header: "วันเริ่ม", format: (v) => formatDate(v as string) },
                    { key: "endDate", header: "วันสิ้นสุด", format: (v) => formatDate(v as string) },
                  ],
                  `internship-report-${year}`
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
            <select
              aria-label="ปีการศึกษา"
              className={styles.select}
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {displayYears.map((y) => (
                <option key={y} value={y}>
                  ปีการศึกษา {y}
                </option>
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
          ) : (
            <div className={styles.stats}>
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className={`${styles.statItem} ${styles.statItemClickable} ${statusFilter === kpi.filterValue ? styles.statItemActive : ""}`}
                  onClick={() => setStatusFilter(statusFilter === kpi.filterValue ? "" : kpi.filterValue)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") setStatusFilter(statusFilter === kpi.filterValue ? "" : kpi.filterValue); }}
                >
                  <p className={styles.statLabel}>{kpi.label}</p>
                  <p className={styles.statValue}>{kpi.value ?? "-"}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Evaluation Summary */}
        {evaluation?.criteriaAverages && evaluation.criteriaAverages.length > 0 ? (
          <section className={styles.card}>
            <h3 className={styles.sectionTitle}>ค่าเฉลี่ยการประเมิน (รายหัวข้อ)</h3>
            <div className={styles.evalGrid}>
              {evaluation.criteriaAverages.map((c, i) => (
                <div key={c.criteriaName ?? `criteria-${i}`} className={styles.evalItem}>
                  <p className={styles.statLabel}>{c.criteriaName}</p>
                  <p className={styles.statValue}>{c.average?.toFixed(2) ?? "-"}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Student Table */}
        <section className={styles.card}>
          <div className={styles.filters}>
            <input
              className={styles.input}
              placeholder="ค้นหา รหัส / ชื่อ / บริษัท"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select aria-label="สถานะฝึกงาน" className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">ทุกสถานะ</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>ชั้นปี</th>
                  <th>สถานะ</th>
                  <th>บริษัท</th>
                  <th>ตำแหน่ง</th>
                  <th>พี่เลี้ยง</th>
                  <th>วันเริ่ม</th>
                  <th>วันสิ้นสุด</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading && filteredStudents.length === 0 ? (
                  <TableSkeleton rows={5} columns={10} />
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((s, idx) => (
                    <tr key={s.internshipId ?? idx}>
                      <td>{s.studentCode ?? "-"}</td>
                      <td>{s.fullName ?? "-"}</td>
                      <td>{s.studentYear ?? "-"}</td>
                      <td>
                        <span
                          className={`${styles.tag} ${styles[`tagStatus${STATUS_COLORS[s.internshipStatus ?? ""] ?? "default"}`] ?? ""} ${styles.tagStatus}`}
                        >
                          {STATUS_LABELS[s.internshipStatus ?? ""] ?? s.internshipStatus ?? "-"}
                        </span>
                      </td>
                      <td>{s.companyName ?? "-"}</td>
                      <td>{s.internshipPosition ?? "-"}</td>
                      <td>{s.supervisorName ?? "-"}</td>
                      <td>{formatDate(s.startDate)}</td>
                      <td>{formatDate(s.endDate)}</td>
                      <td>
                        <div className={btn.buttonRow}>
                          <button type="button" className={btn.button} onClick={() => openEdit(s)}>
                            แก้ไข
                          </button>
                          {s.internshipStatus !== "cancelled" ? (
                            <button type="button" className={`${btn.button} ${btn.buttonDanger}`} onClick={() => openCancel(s)}>
                              ยกเลิก
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10}>
                      <p className={styles.empty}>{loading ? "กำลังโหลด..." : "ไม่พบข้อมูล"}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className={styles.empty}>ทั้งหมด {filteredStudents.length} รายการ</p>
        </section>

        {/* Edit Modal */}
        {editTarget ? (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3 className={styles.modalTitle}>แก้ไขข้อมูลฝึกงาน: {editTarget.fullName}</h3>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  ชื่อบริษัท
                  <input
                    className={styles.input}
                    value={editForm.companyName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, companyName: e.target.value }))}
                  />
                </label>
                <label className={styles.field}>
                  ตำแหน่ง
                  <input
                    className={styles.input}
                    value={editForm.internshipPosition}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, internshipPosition: e.target.value }))}
                  />
                </label>
                <label className={styles.field}>
                  ชื่อพี่เลี้ยง
                  <input
                    className={styles.input}
                    value={editForm.supervisorName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, supervisorName: e.target.value }))}
                  />
                </label>
              </div>
              <div className={btn.buttonRow}>
                <button type="button" className={btn.button} onClick={() => setEditTarget(null)} disabled={editBusy}>
                  ยกเลิก
                </button>
                <button type="button" className={`${btn.button} ${btn.buttonPrimary}`} onClick={submitEdit} disabled={editBusy}>
                  {editBusy ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Cancel Modal */}
        {cancelTarget ? (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3 className={styles.modalTitle}>ยกเลิกการฝึกงาน: {cancelTarget.fullName}</h3>
              <p className={styles.empty}>การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              <label className={styles.field}>
                เหตุผลการยกเลิก
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="กรุณาระบุเหตุผล"
                />
              </label>
              <div className={btn.buttonRow}>
                <button type="button" className={btn.button} onClick={() => setCancelTarget(null)} disabled={cancelBusy}>
                  ปิด
                </button>
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
