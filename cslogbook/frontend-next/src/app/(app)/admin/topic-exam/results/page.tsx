"use client";

import { useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  useAdminTopicExamAcademicYears,
  useAdminTopicExamAdvisors,
  useAdminTopicExamMutations,
  useAdminTopicExamOverview,
} from "@/hooks/useAdminTopicExam";
import type { AdminTopicExamRecord } from "@/lib/services/adminTopicExamService";
import styles from "./page.module.css";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

type ModalMode = "pass" | "fail" | "edit";

const EXAM_STATUS_META = {
  pending: { label: "รอบันทึกผล", tone: "muted" as const },
  passed: { label: "ผ่าน", tone: "ok" as const },
  failed: { label: "ไม่ผ่าน", tone: "danger" as const },
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function resultLabel(result: "passed" | "failed" | null) {
  if (result === "passed") return EXAM_STATUS_META.passed.label;
  if (result === "failed") return EXAM_STATUS_META.failed.label;
  return EXAM_STATUS_META.pending.label;
}

export default function AdminTopicExamResultsPage() {
  const [search, setSearch] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selected, setSelected] = useState<AdminTopicExamRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("pass");
  const [modalResult, setModalResult] = useState<"passed" | "failed">("passed");
  const [advisorId, setAdvisorId] = useState("");
  const [coAdvisorId, setCoAdvisorId] = useState("");
  const [failReason, setFailReason] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning"; message: string } | null>(null);

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      academicYear: academicYear || undefined,
      semester: semester || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [academicYear, page, pageSize, search, semester],
  );

  const overviewQuery = useAdminTopicExamOverview(filters);
  const yearsQuery = useAdminTopicExamAcademicYears();
  const advisorsQuery = useAdminTopicExamAdvisors();
  const { recordResult, exportOverview } = useAdminTopicExamMutations();

  const rows = useMemo(() => overviewQuery.data?.rows ?? [], [overviewQuery.data?.rows]);
  const total = overviewQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const stats = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.total += 1;
          if (row.examResult === "passed") acc.passed += 1;
          else if (row.examResult === "failed") acc.failed += 1;
          else acc.pending += 1;
          return acc;
        },
        { total: 0, pending: 0, passed: 0, failed: 0 },
      ),
    [rows],
  );

  const availableYears = useMemo(() => {
    if (yearsQuery.data?.length) return yearsQuery.data;
    return overviewQuery.data?.meta.availableAcademicYears ?? [];
  }, [overviewQuery.data?.meta.availableAcademicYears, yearsQuery.data]);

  const semesterOptions = useMemo(() => {
    if (!academicYear) return [1, 2, 3];
    const fromMeta = overviewQuery.data?.meta.availableSemestersByYear[String(academicYear)] ?? [];
    return fromMeta.length ? fromMeta : [1, 2, 3];
  }, [academicYear, overviewQuery.data?.meta.availableSemestersByYear]);

  const openDrawer = (row: AdminTopicExamRecord) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelected(null);
  };

  const openPassModal = (row: AdminTopicExamRecord) => {
    setSelected(row);
    setModalMode("pass");
    setModalResult("passed");
    setAdvisorId(row.advisor?.teacherId ? String(row.advisor.teacherId) : "");
    setCoAdvisorId(row.coAdvisor?.teacherId ? String(row.coAdvisor.teacherId) : "");
    setFailReason("");
    setModalOpen(true);
  };

  const openFailModal = (row: AdminTopicExamRecord) => {
    setSelected(row);
    setModalMode("fail");
    setModalResult("failed");
    setAdvisorId("");
    setCoAdvisorId("");
    setFailReason("");
    setModalOpen(true);
  };

  const openEditModal = (row: AdminTopicExamRecord) => {
    setSelected(row);
    setModalMode("edit");
    setModalResult(row.examResult ?? "passed");
    setAdvisorId(row.advisor?.teacherId ? String(row.advisor.teacherId) : "");
    setCoAdvisorId(row.coAdvisor?.teacherId ? String(row.coAdvisor.teacherId) : "");
    setFailReason(row.examFailReason ?? "");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (recordResult.isPending) return;
    setModalOpen(false);
  };

  const handleExport = async () => {
    try {
      await exportOverview.mutateAsync({
        search: search.trim() || undefined,
        academicYear: academicYear || undefined,
        semester: semester || undefined,
      });
    } catch (error) {
      setFeedback({
        tone: "warning",
        message: error instanceof Error ? error.message : "ไม่สามารถส่งออกข้อมูลได้",
      });
    }
  };

  const submitResult = async () => {
    if (!selected?.projectId) return;

    if (modalResult === "passed") {
      const parsedAdvisorId = Number(advisorId);
      if (!Number.isInteger(parsedAdvisorId) || parsedAdvisorId <= 0) {
        setFeedback({ tone: "warning", message: "กรุณาเลือกอาจารย์ที่ปรึกษา" });
        return;
      }

      const parsedCoAdvisorId = coAdvisorId ? Number(coAdvisorId) : null;
      if (parsedCoAdvisorId && parsedCoAdvisorId === parsedAdvisorId) {
        setFeedback({ tone: "warning", message: "ที่ปรึกษาร่วมต้องไม่ซ้ำกับที่ปรึกษาหลัก" });
        return;
      }

      try {
        const payload: {
          projectId: number;
          result: "passed";
          advisorId: number;
          coAdvisorId?: number | null;
          allowOverwrite: boolean;
        } = {
          projectId: selected.projectId,
          result: "passed",
          advisorId: parsedAdvisorId,
          allowOverwrite: modalMode === "edit",
        };

        if (coAdvisorId) {
          payload.coAdvisorId = parsedCoAdvisorId;
        } else if (selected.coAdvisor?.teacherId && modalMode === "edit") {
          payload.coAdvisorId = null;
        }

        await recordResult.mutateAsync(payload);
        setFeedback({ tone: "success", message: "บันทึกผลสอบหัวข้อเรียบร้อยแล้ว" });
        setModalOpen(false);
      } catch (error) {
        setFeedback({
          tone: "warning",
          message: error instanceof Error ? error.message : "ไม่สามารถบันทึกผลสอบได้",
        });
      }
      return;
    }

    if (failReason.trim().length < 5) {
      setFeedback({ tone: "warning", message: "กรุณากรอกเหตุผลไม่ผ่านอย่างน้อย 5 ตัวอักษร" });
      return;
    }

    try {
      await recordResult.mutateAsync({
        projectId: selected.projectId,
        result: "failed",
        reason: failReason.trim(),
        allowOverwrite: modalMode === "edit",
      });
      setFeedback({ tone: "success", message: "บันทึกผลสอบหัวข้อเรียบร้อยแล้ว" });
      setModalOpen(false);
    } catch (error) {
      setFeedback({
        tone: "warning",
        message: error instanceof Error ? error.message : "ไม่สามารถบันทึกผลสอบได้",
      });
    }
  };

  const isBusy = recordResult.isPending || exportOverview.isPending;

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>บันทึกผลสอบหัวข้อโครงงานพิเศษ</h1>
            <p className={styles.subtitle}>รายการหัวข้อโครงงานพร้อมบันทึกผลสอบและส่งออกข้อมูลตาม flow เดิม</p>
          </div>
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.button}
              onClick={() => {
                setFeedback(null);
                void overviewQuery.refetch();
              }}
              disabled={overviewQuery.isFetching}
            >
              รีเฟรช
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => {
                setSearch("");
                setAcademicYear("");
                setSemester("");
                setPage(1);
              }}
            >
              รีเซ็ตตัวกรอง
            </button>
            <button type="button" className={styles.button} onClick={() => setPreviewOpen(true)}>
              ดูตัวอย่างก่อนส่งออก
            </button>
            <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => void handleExport()} disabled={isBusy}>
              ส่งออก Excel
            </button>
          </div>
        </header>

        {feedback ? (
          <div className={`${styles.alert} ${feedback.tone === "success" ? styles.alertSuccess : styles.alertWarning}`}>
            {feedback.message}
          </div>
        ) : null}

        <section className={styles.card}>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>ทั้งหมด (หน้านี้)</p>
              <p className={styles.statValue}>{stats.total}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>รอบันทึกผล</p>
              <p className={styles.statValue}>{stats.pending}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>ผ่าน</p>
              <p className={styles.statValue}>{stats.passed}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>ไม่ผ่าน</p>
              <p className={styles.statValue}>{stats.failed}</p>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.filters}>
            <input
              className={styles.input}
              placeholder="ค้นหาโครงงาน/รหัสนักศึกษา"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <select
              className={styles.select}
              value={academicYear}
              onChange={(event) => {
                setAcademicYear(event.target.value);
                setSemester("");
                setPage(1);
              }}
            >
              <option value="">ทุกปีการศึกษา</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={semester}
              onChange={(event) => {
                setSemester(event.target.value);
                setPage(1);
              }}
            >
              <option value="">ทุกภาคเรียน</option>
              {semesterOptions.map((item) => (
                <option key={item} value={item}>
                  ภาคเรียน {item}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>โครงงาน</th>
                  <th>สมาชิก</th>
                  <th>อาจารย์ที่ปรึกษา</th>
                  <th>ผลสอบหัวข้อ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {overviewQuery.isLoading ? (
                  <tr>
                    <td colSpan={6}>
                      <p className={styles.empty}>กำลังโหลดข้อมูล...</p>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <p className={styles.empty}>ไม่พบข้อมูลโครงงาน</p>
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.projectId}>
                      <td>{(page - 1) * pageSize + index + 1}</td>
                      <td>
                        <p className={styles.name}>{row.titleTh || row.titleEn || "-"}</p>
                        <p className={styles.subText}>
                          #{row.projectId} {row.projectCode ? `| ${row.projectCode}` : ""}{" "}
                          {(row.academicYear || row.semester) ? `| ปี ${row.academicYear || "-"} / เทอม ${row.semester || "-"}` : ""}
                        </p>
                        {row.titleEn && row.titleEn !== row.titleTh ? <p className={styles.subText}>{row.titleEn}</p> : null}
                      </td>
                      <td>
                        <div className={styles.memberList}>
                          {row.members.length ? (
                            row.members.map((member) => (
                              <p key={`${row.projectId}-${member.studentId ?? member.studentCode}`} className={styles.subText}>
                                {member.studentCode || "-"} {member.name || "-"}
                              </p>
                            ))
                          ) : (
                            <p className={styles.subText}>-</p>
                          )}
                        </div>
                      </td>
                      <td>
                        <p className={styles.subText}>หลัก: {row.advisor?.name || "-"}</p>
                        <p className={styles.subText}>ร่วม: {row.coAdvisor?.name || "-"}</p>
                      </td>
                      <td>
                        <span
                          className={`${styles.tag} ${
                            row.examResult === "passed"
                              ? styles.tagOk
                              : row.examResult === "failed"
                                ? styles.tagDanger
                                : styles.tagMuted
                          }`}
                        >
                          {resultLabel(row.examResult)}
                        </span>
                        <p className={styles.subText}>บันทึกเมื่อ: {formatDateTime(row.examResultAt)}</p>
                        {row.examResult === "failed" && row.examFailReason ? (
                          <p className={styles.failReason}>เหตุผล: {row.examFailReason}</p>
                        ) : null}
                      </td>
                      <td>
                        <div className={styles.buttonRow}>
                          <button type="button" className={styles.button} onClick={() => openDrawer(row)}>
                            รายละเอียด
                          </button>
                          {row.examResult ? (
                            <>
                              <span className={styles.recordedText}>บันทึกแล้ว</span>
                              <button type="button" className={styles.button} onClick={() => openEditModal(row)}>
                                แก้ไขผล
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className={`${styles.button} ${styles.buttonPrimary}`}
                                onClick={() => openPassModal(row)}
                              >
                                ผ่าน
                              </button>
                              <button
                                type="button"
                                className={`${styles.button} ${styles.buttonDanger}`}
                                onClick={() => openFailModal(row)}
                              >
                                ไม่ผ่าน
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <p className={styles.paginationInfo}>
              หน้า {Math.min(page, totalPages)} / {totalPages} (ทั้งหมด {total} รายการ)
            </p>
            <select
              className={styles.select}
              value={String(pageSize)}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} ต่อหน้า
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.button}
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              ก่อนหน้า
            </button>
            <button
              type="button"
              className={styles.button}
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              ถัดไป
            </button>
          </div>
        </section>

      {overviewQuery.isError ? <p className={styles.empty}>ไม่สามารถโหลดข้อมูลผลสอบหัวข้อได้</p> : null}

      {previewOpen ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>ตัวอย่างรายชื่อก่อนส่งออก</h3>
            <p className={styles.subText}>รายการนี้ใช้ตัวกรองเดียวกับหน้าหลัก และเหมาะสำหรับตรวจทานก่อนสร้างไฟล์</p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ชื่อโครงงาน</th>
                    <th>สมาชิก</th>
                    <th>ผลสอบหัวข้อ</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? (
                    rows.map((row) => (
                      <tr key={`preview-${row.projectId}`}>
                        <td>{row.titleTh || row.titleEn || "-"}</td>
                        <td>
                          {row.members.length
                            ? row.members.map((member) => `${member.studentCode || "-"} ${member.name || "-"}`).join(", ")
                            : "-"}
                        </td>
                        <td>{resultLabel(row.examResult)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3}>
                        <p className={styles.empty}>ไม่พบรายการสำหรับส่งออก</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className={styles.buttonRow}>
              <button type="button" className={styles.button} onClick={() => setPreviewOpen(false)}>
                ปิด
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => void handleExport()}
                disabled={isBusy}
              >
                ส่งออก Excel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {drawerOpen && selected ? (
          <div className={styles.drawerOverlay}>
            <aside className={styles.drawer}>
              <header className={styles.drawerHeader}>
                <div>
                  <p className={styles.drawerTitle}>รายละเอียดโครงงาน</p>
                  <p className={styles.subText}>{selected.titleTh || selected.titleEn || "-"}</p>
                </div>
                <button type="button" className={styles.button} onClick={closeDrawer}>
                  ปิด
                </button>
              </header>
              <div className={styles.drawerBody}>
                <section className={styles.detailSection}>
                  <h3 className={styles.detailTitle}>รายละเอียดโครงงาน</h3>
                  <p>ชื่อโครงงาน (ไทย): {selected.titleTh || "-"}</p>
                  <p>ชื่อโครงงาน (อังกฤษ): {selected.titleEn || "-"}</p>
                  <p>รหัสโครงงาน: {selected.projectCode || "-"}</p>
                  <p>ปีการศึกษา / ภาคเรียน: {selected.academicYear || "-"} / {selected.semester || "-"}</p>
                  <p>สถานะโครงงาน: {selected.status || "-"}</p>
                </section>
                <section className={styles.detailSection}>
                  <h3 className={styles.detailTitle}>ข้อมูลผลสอบหัวข้อ</h3>
                  <p>สถานะผลสอบ: {resultLabel(selected.examResult)}</p>
                  <p>วันที่บันทึกผล: {formatDateTime(selected.examResultAt)}</p>
                  <p>เหตุผลไม่ผ่าน: {selected.examFailReason || "-"}</p>
                </section>
                <section className={styles.detailSection}>
                  <h3 className={styles.detailTitle}>ผู้ดูแลโครงงาน</h3>
                  <p>ที่ปรึกษาหลัก: {selected.advisor?.name || "-"}</p>
                  <p>ที่ปรึกษาร่วม: {selected.coAdvisor?.name || "-"}</p>
                </section>
                <section className={styles.detailSection}>
                  <h3 className={styles.detailTitle}>สมาชิกโครงงาน</h3>
                  {selected.members.length ? (
                    <ul className={styles.memberDetailList}>
                      {selected.members.map((member) => (
                        <li key={`${selected.projectId}-member-${member.studentId ?? member.studentCode}`}>
                          {member.studentCode || "-"} {member.name || "-"} ({member.classroom || "-"})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>-</p>
                  )}
                  <p className={styles.subText}>หมายเหตุ: หน้านี้ใช้ข้อมูลเดียวกับตารางหลักเพื่อเทียบความถูกต้องก่อนบันทึก/แก้ไขผลสอบ</p>
                </section>
              </div>
            </aside>
          </div>
        ) : null}

        {modalOpen && selected ? (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3 className={styles.modalTitle}>
                {modalMode === "pass"
                  ? "บันทึกผล: ผ่าน"
                  : modalMode === "fail"
                    ? "บันทึกผล: ไม่ผ่าน"
                    : "แก้ไขผลสอบหัวข้อ"}
              </h3>
              <p className={styles.subText}>{selected.titleTh || selected.titleEn || "-"}</p>

              {modalMode === "edit" ? (
                <label className={styles.field}>
                  <span>ผลสอบ</span>
                  <select
                    className={styles.select}
                    value={modalResult}
                    onChange={(event) => setModalResult(event.target.value as "passed" | "failed")}
                  >
                    <option value="passed">ผ่าน</option>
                    <option value="failed">ไม่ผ่าน</option>
                  </select>
                </label>
              ) : null}

              {modalResult === "passed" ? (
                <>
                  <label className={styles.field}>
                    <span>อาจารย์ที่ปรึกษาหลัก</span>
                    <select className={styles.select} value={advisorId} onChange={(event) => setAdvisorId(event.target.value)}>
                      <option value="">เลือกอาจารย์ที่ปรึกษา</option>
                      {(advisorsQuery.data ?? []).map((advisor) => (
                        <option key={advisor.teacherId} value={advisor.teacherId}>
                          {advisor.teacherCode ? `${advisor.teacherCode} - ` : ""}
                          {advisor.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>อาจารย์ที่ปรึกษาร่วม (ไม่บังคับ)</span>
                    <select className={styles.select} value={coAdvisorId} onChange={(event) => setCoAdvisorId(event.target.value)}>
                      <option value="">ไม่ระบุ</option>
                      {(advisorsQuery.data ?? []).map((advisor) => (
                        <option key={`co-${advisor.teacherId}`} value={advisor.teacherId}>
                          {advisor.teacherCode ? `${advisor.teacherCode} - ` : ""}
                          {advisor.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <label className={styles.field}>
                  <span>เหตุผลไม่ผ่าน</span>
                  <textarea
                    className={styles.textarea}
                    rows={4}
                    value={failReason}
                    onChange={(event) => setFailReason(event.target.value)}
                    placeholder="กรอกเหตุผลอย่างน้อย 5 ตัวอักษร"
                  />
                </label>
              )}

              <div className={styles.buttonRow}>
                <button type="button" className={styles.button} onClick={closeModal} disabled={recordResult.isPending}>
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${modalResult === "passed" ? styles.buttonPrimary : styles.buttonDanger}`}
                  onClick={() => void submitResult()}
                  disabled={recordResult.isPending || advisorsQuery.isLoading}
                >
                  {recordResult.isPending ? "กำลังบันทึก..." : "ยืนยัน"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RoleGuard>
  );
}
