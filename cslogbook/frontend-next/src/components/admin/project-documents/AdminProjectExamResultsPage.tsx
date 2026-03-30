"use client";

import { useMemo, useState } from "react";
import {
  ADMIN_EXAM_TYPE_PROJECT1,
  ADMIN_EXAM_TYPE_THESIS,
  type AdminExamType,
  type AdminProjectExamRow,
} from "@/lib/services/adminProjectExamResultService";
import {
  useAdminProjectExamAcademicYears,
  useAdminProjectExamMutations,
  useAdminProjectExamPendingResults,
  useAdminProjectExamResultDetail,
} from "@/hooks/useAdminProjectExamResults";
import styles from "@/styles/shared/admin-queue.module.css";
import local from "./AdminProjectExamResultsPage.local.module.css";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const FINAL_DOCUMENT_STATUS_OPTIONS = [
  { value: "pending", label: "รอตรวจสอบ" },
  { value: "approved", label: "อนุมัติ" },
  { value: "rejected", label: "ปฏิเสธ" },
];

const DEFENSE_STATUS_LABEL: Record<string, string> = {
  draft: "แบบร่าง",
  submitted: "ยื่นคำขอแล้ว",
  advisor_in_review: "รออาจารย์ตรวจ",
  advisor_approved: "อาจารย์อนุมัติแล้ว",
  staff_verified: "เจ้าหน้าที่ตรวจสอบแล้ว",
  scheduled: "นัดสอบแล้ว",
  completed: "บันทึกผลสอบแล้ว",
  cancelled: "ยกเลิก",
};

const FINAL_DOCUMENT_LABEL: Record<string, string> = {
  draft: "ร่าง",
  pending: "รอตรวจสอบ",
  approved: "อนุมัติ",
  rejected: "ปฏิเสธ",
  completed: "เรียบร้อย",
  supervisor_evaluated: "หัวหน้าภาคตรวจแล้ว",
  acceptance_approved: "อนุมัติให้รับเล่ม",
  referral_ready: "พร้อมส่งต่อ",
  referral_downloaded: "ดาวน์โหลดแล้ว",
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

function formatResultTag(result: "PASS" | "FAIL" | null) {
  if (result === "PASS") return { label: "ผ่าน", className: styles.tagOk };
  if (result === "FAIL") return { label: "ไม่ผ่าน", className: styles.tagDanger };
  return { label: "รอบันทึกผล", className: styles.tagMuted };
}

function examPageMeta(examType: AdminExamType) {
  if (examType === ADMIN_EXAM_TYPE_THESIS) {
    return {
      title: "บันทึกผลสอบปริญญานิพนธ์",
      subtitle: "บันทึกผลสอบปริญญานิพนธ์และติดตามสถานะเล่มเอกสารหลังสอบ",
    };
  }

  return {
    title: "บันทึกผลสอบโครงงานพิเศษ 1",
    subtitle: "บันทึกผลสอบโครงงานพิเศษ 1 พร้อมหมายเหตุและเงื่อนไขการแก้ไข scope",
  };
}

type AdminProjectExamResultsPageProps = {
  examType: AdminExamType;
};

export function AdminProjectExamResultsPage({ examType }: AdminProjectExamResultsPageProps) {
  const meta = examPageMeta(examType);
  const [status, setStatus] = useState("pending");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTarget, setDrawerTarget] = useState<AdminProjectExamRow | null>(null);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [recordTarget, setRecordTarget] = useState<AdminProjectExamRow | null>(null);
  const [recordResult, setRecordResult] = useState<"PASS" | "FAIL">("PASS");
  const [recordScore, setRecordScore] = useState("");
  const [recordNotes, setRecordNotes] = useState("");
  const [requireScopeRevision, setRequireScopeRevision] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentTarget, setDocumentTarget] = useState<AdminProjectExamRow | null>(null);
  const [documentStatus, setDocumentStatus] = useState("pending");
  const [documentComment, setDocumentComment] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning"; message: string } | null>(null);

  const filters = useMemo(
    () => ({
      status: status || undefined,
      academicYear: academicYear || undefined,
      semester: semester || undefined,
      search: search.trim() || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [academicYear, page, pageSize, search, semester, status],
  );

  const pendingQuery = useAdminProjectExamPendingResults(examType, filters);
  const yearsQuery = useAdminProjectExamAcademicYears();
  const detailQuery = useAdminProjectExamResultDetail(drawerTarget?.projectId ?? null, examType, drawerOpen && Boolean(drawerTarget));
  const { recordExamResult, updateFinalDocumentStatus } = useAdminProjectExamMutations(examType);

  const rows = useMemo(() => pendingQuery.data?.rows ?? [], [pendingQuery.data?.rows]);
  const total = pendingQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const years = yearsQuery.data ?? [];

  const summary = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.total += 1;
          if (!row.examResult) acc.pending += 1;
          else if (row.examResult.result === "PASS") acc.passed += 1;
          else if (row.examResult.result === "FAIL") acc.failed += 1;
          return acc;
        },
        { total: 0, pending: 0, passed: 0, failed: 0 },
      ),
    [rows],
  );

  const isBusy = recordExamResult.isPending || updateFinalDocumentStatus.isPending;

  const openDrawer = (row: AdminProjectExamRow) => {
    setDrawerTarget(row);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerTarget(null);
  };
  const activeRecord = useMemo(() => {
    if (!drawerTarget) return null;
    const detailRow = detailQuery.data;
    if (!detailRow) return drawerTarget;
    return { ...drawerTarget, examResult: detailRow };
  }, [detailQuery.data, drawerTarget]);

  const openRecordModal = (row: AdminProjectExamRow) => {
    setRecordTarget(row);
    setRecordResult("PASS");
    setRecordScore("");
    setRecordNotes("");
    setRequireScopeRevision(false);
    setRecordModalOpen(true);
  };

  const openDocumentModal = (row: AdminProjectExamRow) => {
    setDocumentTarget(row);
    setDocumentStatus(row.finalDocument?.status ?? "pending");
    setDocumentComment("");
    setDocumentModalOpen(true);
  };

  const submitRecordResult = async () => {
    if (!recordTarget?.projectId) return;
    const parsedScore = recordScore.trim() ? Number(recordScore) : null;

    if (recordScore.trim() && (!Number.isFinite(parsedScore) || parsedScore === null || parsedScore < 0 || parsedScore > 100)) {
      setFeedback({ tone: "warning", message: "คะแนนต้องอยู่ระหว่าง 0 - 100" });
      return;
    }

    try {
      await recordExamResult.mutateAsync({
        projectId: recordTarget.projectId,
        examType,
        result: recordResult,
        score: parsedScore,
        notes: recordNotes.trim() || null,
        requireScopeRevision: examType === ADMIN_EXAM_TYPE_PROJECT1 ? requireScopeRevision : false,
      });
      setRecordModalOpen(false);
      setFeedback({ tone: "success", message: "บันทึกผลสอบเรียบร้อยแล้ว" });
    } catch (error) {
      setFeedback({
        tone: "warning",
        message: error instanceof Error ? error.message : "ไม่สามารถบันทึกผลสอบได้",
      });
    }
  };

  const submitDocumentStatus = async () => {
    if (!documentTarget?.projectId) return;
    try {
      await updateFinalDocumentStatus.mutateAsync({
        projectId: documentTarget.projectId,
        documentId: documentTarget.finalDocument?.documentId,
        status: documentStatus,
        comment: documentComment,
      });
      setDocumentModalOpen(false);
      setFeedback({ tone: "success", message: "อัปเดตสถานะเล่มเอกสารเรียบร้อยแล้ว" });
    } catch (error) {
      setFeedback({
        tone: "warning",
        message: error instanceof Error ? error.message : "ไม่สามารถอัปเดตสถานะเล่มเอกสารได้",
      });
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{meta.title}</h1>
          <p className={styles.subtitle}>{meta.subtitle}</p>
        </div>
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setStatus("pending");
              setAcademicYear("");
              setSemester("");
              setSearch("");
              setPage(1);
              closeDrawer();
            }}
          >
            รีเซ็ตตัวกรอง
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setFeedback(null);
              void pendingQuery.refetch();
            }}
            disabled={pendingQuery.isFetching}
          >
            รีเฟรช
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
            <p className={styles.statValue}>{summary.total}</p>
          </div>
          <div className={styles.statItem}>
            <p className={styles.statLabel}>รอบันทึกผล</p>
            <p className={styles.statValue}>{summary.pending}</p>
          </div>
          <div className={styles.statItem}>
            <p className={styles.statLabel}>ผ่าน</p>
            <p className={styles.statValue}>{summary.passed}</p>
          </div>
          <div className={styles.statItem}>
            <p className={styles.statLabel}>ไม่ผ่าน</p>
            <p className={styles.statValue}>{summary.failed}</p>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.filters}>
          <select
            className={styles.select}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="pending">รอบันทึกผล</option>
            <option value="passed">ผ่านแล้ว</option>
            <option value="failed">ไม่ผ่านแล้ว</option>
            <option value="all">ทั้งหมด</option>
          </select>
          <select
            className={styles.select}
            value={academicYear}
            onChange={(event) => {
              setAcademicYear(event.target.value);
              setPage(1);
            }}
          >
            <option value="">ทุกปีการศึกษา</option>
            {years.map((year) => (
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
            <option value="1">ภาคเรียน 1</option>
            <option value="2">ภาคเรียน 2</option>
            <option value="3">ภาคฤดูร้อน</option>
          </select>
          <input
            className={styles.input}
            placeholder="ค้นหาโครงงาน/รหัสนักศึกษา"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>โครงงาน</th>
                <th>สมาชิก</th>
                <th>อาจารย์ที่ปรึกษา</th>
                <th>สถานะ</th>
                {examType === ADMIN_EXAM_TYPE_THESIS ? <th>เล่มเอกสาร</th> : null}
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {pendingQuery.isLoading ? (
                <tr>
                  <td colSpan={examType === ADMIN_EXAM_TYPE_THESIS ? 6 : 5}>
                    <p className={styles.empty}>กำลังโหลดข้อมูล...</p>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={examType === ADMIN_EXAM_TYPE_THESIS ? 6 : 5}>
                    <p className={styles.empty}>ไม่พบรายการโครงงาน</p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const tag = formatResultTag(row.examResult?.result ?? null);
                  return (
                    <tr key={row.projectId}>
                      <td>
                        <p className={styles.name}>{row.projectNameTh || row.projectNameEn || "-"}</p>
                        <p className={styles.subText}>
                          #{row.projectId} {row.projectCode ? `| ${row.projectCode}` : ""} | ปี {row.academicYear || "-"} / เทอม{" "}
                          {row.semester || "-"}
                        </p>
                        {row.projectNameEn && row.projectNameEn !== row.projectNameTh ? (
                          <p className={styles.subText}>{row.projectNameEn}</p>
                        ) : null}
                      </td>
                      <td>
                        {row.members.length ? (
                          row.members.map((member) => (
                            <p key={`${row.projectId}-${member.studentId ?? member.studentCode}`} className={styles.subText}>
                              {member.studentCode || "-"} {member.name || "-"}
                            </p>
                          ))
                        ) : (
                          <p className={styles.subText}>-</p>
                        )}
                      </td>
                      <td>
                        <p className={styles.subText}>หลัก: {row.advisor?.name || "-"}</p>
                        <p className={styles.subText}>ร่วม: {row.coAdvisor?.name || "-"}</p>
                      </td>
                      <td>
                        <span className={`${styles.tag} ${tag.className}`}>{tag.label}</span>
                        <p className={styles.subText}>ตรวจสิทธิ์: {formatDateTime(row.staffVerifiedAt)}</p>
                        {row.examResult ? <p className={styles.subText}>บันทึกผล: {formatDateTime(row.examResult.recordedAt)}</p> : null}
                      </td>
                      {examType === ADMIN_EXAM_TYPE_THESIS ? (
                        <td>
                          {row.finalDocument ? (
                            <>
                              <span className={`${styles.tag} ${styles.tagDoc}`}>
                                {FINAL_DOCUMENT_LABEL[row.finalDocument.status ?? ""] || row.finalDocument.status || "ยังไม่ทราบสถานะ"}
                              </span>
                              <p className={styles.subText}>ส่งเมื่อ: {formatDateTime(row.finalDocument.submittedAt)}</p>
                              <p className={styles.subText}>ตรวจล่าสุด: {formatDateTime(row.finalDocument.reviewDate)}</p>
                            </>
                          ) : (
                            <span className={`${styles.tag} ${styles.tagMuted}`}>ยังไม่ส่งเล่ม</span>
                          )}
                        </td>
                      ) : null}
                      <td>
                        <div className={styles.buttonRow}>
                          <button type="button" className={styles.button} onClick={() => openDrawer(row)}>
                            รายละเอียด
                          </button>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.buttonPrimary}`}
                            onClick={() => openRecordModal(row)}
                            disabled={Boolean(row.examResult)}
                          >
                            {row.examResult ? "บันทึกแล้ว" : "บันทึกผลสอบ"}
                          </button>
                          {examType === ADMIN_EXAM_TYPE_THESIS ? (
                            <button type="button" className={styles.button} onClick={() => openDocumentModal(row)}>
                              อัปเดตสถานะเล่ม
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
          <button type="button" className={styles.button} disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
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

      {pendingQuery.isError ? <p className={styles.empty}>ไม่สามารถโหลดข้อมูลผลสอบได้</p> : null}

      {recordModalOpen && recordTarget ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>บันทึกผลสอบ</h3>
            <p className={styles.subText}>{recordTarget.projectNameTh || recordTarget.projectNameEn || "-"}</p>
            <label className={styles.field}>
              <span>ผลการสอบ</span>
              <select className={styles.select} value={recordResult} onChange={(event) => setRecordResult(event.target.value as "PASS" | "FAIL")}>
                <option value="PASS">ผ่าน</option>
                <option value="FAIL">ไม่ผ่าน</option>
              </select>
            </label>
            {examType === ADMIN_EXAM_TYPE_PROJECT1 && recordResult === "PASS" ? (
              <label className={local.checkboxField}>
                <input
                  type="checkbox"
                  checked={requireScopeRevision}
                  onChange={(event) => setRequireScopeRevision(event.target.checked)}
                />
                ต้องแก้ไข scope ก่อนเข้าขั้นตอนถัดไป
              </label>
            ) : null}
            <label className={styles.field}>
              <span>คะแนน (ถ้ามี)</span>
              <input
                className={styles.input}
                inputMode="decimal"
                placeholder="เช่น 85.50"
                value={recordScore}
                onChange={(event) => setRecordScore(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>หมายเหตุ / ข้อเสนอแนะ</span>
              <textarea
                className={styles.textarea}
                rows={4}
                placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                value={recordNotes}
                onChange={(event) => setRecordNotes(event.target.value)}
              />
            </label>
            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.button}
                onClick={() => {
                  if (isBusy) return;
                  setRecordModalOpen(false);
                }}
              >
                ยกเลิก
              </button>
              <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => void submitRecordResult()} disabled={isBusy}>
                {isBusy ? "กำลังบันทึก..." : "บันทึกผล"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {documentModalOpen && documentTarget ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>อัปเดตสถานะเล่มปริญญานิพนธ์</h3>
            <p className={styles.subText}>{documentTarget.projectNameTh || documentTarget.projectNameEn || "-"}</p>
            {!documentTarget.finalDocument?.documentId ? (
              <div className={local.infoBox}>ยังไม่มีรายการเล่มในระบบ ระบบจะสร้างรายการเล่มแบบออฟไลน์เมื่อบันทึกสถานะ</div>
            ) : null}
            <label className={styles.field}>
              <span>สถานะเล่ม</span>
              <select className={styles.select} value={documentStatus} onChange={(event) => setDocumentStatus(event.target.value)}>
                {FINAL_DOCUMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>บันทึกเพิ่มเติม (ไม่บังคับ)</span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={documentComment}
                onChange={(event) => setDocumentComment(event.target.value)}
                placeholder="ระบุข้อความถึงนักศึกษา/อาจารย์"
              />
            </label>
            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.button}
                onClick={() => {
                  if (isBusy) return;
                  setDocumentModalOpen(false);
                }}
              >
                ยกเลิก
              </button>
              <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => void submitDocumentStatus()} disabled={isBusy}>
                {isBusy ? "กำลังบันทึก..." : "บันทึกสถานะ"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {drawerOpen && drawerTarget ? (
        <div className={styles.drawerOverlay}>
          <aside className={styles.drawer}>
            <header className={styles.drawerHeader}>
              <div>
                <p className={styles.drawerTitle}>รายละเอียดโครงงาน</p>
                <p className={styles.subText}>{activeRecord?.projectNameTh || activeRecord?.projectNameEn || "-"}</p>
              </div>
              <button type="button" className={styles.button} onClick={closeDrawer}>
                ปิด
              </button>
            </header>
            <div className={styles.drawerBody}>
              {detailQuery.isLoading ? <p className={styles.empty}>กำลังโหลดรายละเอียด...</p> : null}

              <section className={styles.detailSection}>
                <h3 className={styles.detailTitle}>ข้อมูลโครงงาน</h3>
                <p>ชื่อไทย: {activeRecord?.projectNameTh || "-"}</p>
                <p>ชื่ออังกฤษ: {activeRecord?.projectNameEn || "-"}</p>
                <p>รหัสโครงงาน: {activeRecord?.projectCode || "-"}</p>
                <p>
                  ปีการศึกษา / ภาคเรียน: {activeRecord?.academicYear || "-"} / {activeRecord?.semester || "-"}
                </p>
                {activeRecord?.members.length ? (
                  <>
                    <p className={styles.subText}>สมาชิก:</p>
                    {activeRecord.members.map((member) => (
                      <p key={`drawer-${activeRecord.projectId}-${member.studentId ?? member.studentCode}`} className={styles.subText}>
                        {member.studentCode || "-"} {member.name || "-"}
                      </p>
                    ))}
                  </>
                ) : (
                  <p className={styles.subText}>สมาชิก: -</p>
                )}
                <p>ที่ปรึกษาหลัก: {activeRecord?.advisor?.name || "-"}</p>
                <p>ที่ปรึกษาร่วม: {activeRecord?.coAdvisor?.name || "-"}</p>
              </section>

              <section className={styles.detailSection}>
                <h3 className={styles.detailTitle}>รายละเอียดการสอบ</h3>
                <p>
                  สถานะคำขอสอบ:{" "}
                  {DEFENSE_STATUS_LABEL[activeRecord?.defenseRequest?.status ?? ""] ||
                    activeRecord?.defenseRequest?.status ||
                    "-"}
                </p>
                <p>วันที่ยื่นคำขอ: {formatDateTime(activeRecord?.defenseRequest?.submittedAt)}</p>
                <p>วันที่อาจารย์อนุมัติ: {formatDateTime(activeRecord?.defenseRequest?.advisorApprovedAt)}</p>
                <p>วันที่เจ้าหน้าที่ตรวจ: {formatDateTime(activeRecord?.defenseRequest?.staffVerifiedAt)}</p>
              </section>

              <section className={styles.detailSection}>
                <h3 className={styles.detailTitle}>ผลการสอบ</h3>
                {activeRecord?.examResult ? (
                  <>
                    <p>ผลสอบ: {activeRecord.examResult.result === "PASS" ? "ผ่าน" : "ไม่ผ่าน"}</p>
                    <p>คะแนน: {activeRecord.examResult.score ?? "-"}</p>
                    <p>หมายเหตุ: {activeRecord.examResult.notes || "-"}</p>
                    <p>ผู้บันทึก: {activeRecord.examResult.recordedByName || "-"}</p>
                    <p>วันที่บันทึก: {formatDateTime(activeRecord.examResult.recordedAt)}</p>
                    {activeRecord.examResult.result === "FAIL" ? (
                      <p>รับทราบผลโดยนักศึกษา: {formatDateTime(activeRecord.examResult.studentAcknowledgedAt)}</p>
                    ) : null}
                    {activeRecord.examResult.result === "PASS" && activeRecord.examResult.requireScopeRevision ? (
                      <p className={styles.subText}>ต้องแก้ไข scope ก่อนเข้าขั้นตอนถัดไป</p>
                    ) : null}
                  </>
                ) : (
                  <p className={styles.empty}>ยังไม่มีผลสอบ</p>
                )}
              </section>

              {examType === ADMIN_EXAM_TYPE_THESIS ? (
                <section className={styles.detailSection}>
                  <h3 className={styles.detailTitle}>สถานะเล่มเอกสาร</h3>
                  <p>
                    สถานะ:{" "}
                    {activeRecord?.finalDocument
                      ? FINAL_DOCUMENT_LABEL[activeRecord.finalDocument.status ?? ""] ||
                        activeRecord.finalDocument.status ||
                        "-"
                      : "ยังไม่ส่งเล่ม"}
                  </p>
                  <p>ส่งเมื่อ: {formatDateTime(activeRecord?.finalDocument?.submittedAt)}</p>
                  <p>ตรวจล่าสุด: {formatDateTime(activeRecord?.finalDocument?.reviewDate)}</p>
                  <p>ผู้ตรวจ: {activeRecord?.finalDocument?.reviewerName || "-"}</p>
                </section>
              ) : null}
            </div>
            <div className={styles.drawerFooter}>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                disabled={Boolean(activeRecord?.examResult)}
                onClick={() => {
                  if (activeRecord) openRecordModal(activeRecord);
                }}
              >
                บันทึกผลสอบ
              </button>
              {examType === ADMIN_EXAM_TYPE_THESIS ? (
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => {
                    if (activeRecord) openDocumentModal(activeRecord);
                  }}
                >
                  อัปเดตสถานะเล่ม
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
