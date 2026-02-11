"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { AdminSystemTestQueueRecord } from "@/lib/services/adminSystemTestService";
import {
  useAdminSystemTestQueue,
  useAdminSystemTestAcademicYears,
  useAdminSystemTestDetail,
  useAdminSystemTestMutations,
} from "@/hooks/useAdminSystemTestQueue";
import styles from "./DefenseStaffQueuePage.module.css";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    dateStyle: "medium",
  }).format(date);
}

function statusLabel(status: string) {
  if (status === "pending_advisor") return "รออาจารย์อนุมัติ";
  if (status === "advisor_rejected") return "อาจารย์ส่งกลับ";
  if (status === "pending_staff") return "รอเจ้าหน้าที่ตรวจสอบ";
  if (status === "staff_rejected") return "เจ้าหน้าที่ส่งกลับ";
  if (status === "staff_approved") return "อนุมัติแล้ว (รอหลักฐาน)";
  if (status === "evidence_submitted") return "ส่งหลักฐานแล้ว";
  return status || "-";
}

function statusMeta(status: string) {
  if (status === "pending_advisor") return { className: styles.tagWarning };
  if (status === "advisor_rejected") return { className: styles.tagDanger };
  if (status === "pending_staff") return { className: styles.tagWarning };
  if (status === "staff_rejected") return { className: styles.tagDanger };
  if (status === "staff_approved") return { className: styles.tagOk };
  if (status === "evidence_submitted") return { className: styles.tagOk };
  return { className: styles.tagStatus };
}

export function SystemTestStaffQueuePage() {
  const { user } = useAuth();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<AdminSystemTestQueueRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<"approve" | "reject">("approve");
  const [decisionNote, setDecisionNote] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning"; message: string } | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  const isStaff = Boolean(user && (user.role === "admin" || (user.role === "teacher" && user.teacherType === "support")));
  const canView = isStaff;

  const filters = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      search: search.trim() || undefined,
      academicYear: academicYear || undefined,
      semester: semester || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [academicYear, page, pageSize, search, semester, status],
  );

  const queueQuery = useAdminSystemTestQueue(filters, canView);
  const yearsQuery = useAdminSystemTestAcademicYears(canView);
  const detailQuery = useAdminSystemTestDetail(selected?.projectId ?? null, drawerOpen && canView);
  const { submitDecision } = useAdminSystemTestMutations();

  const rows = useMemo(() => queueQuery.data?.rows ?? [], [queueQuery.data?.rows]);
  const total = queueQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isBusy = submitDecision.isPending;

  const stats = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.total += 1;
          if (row.status === "pending_staff") acc.pending += 1;
          if (row.status === "staff_approved") acc.approved += 1;
          if (row.status === "staff_rejected") acc.rejected += 1;
          if (row.status === "advisor_rejected") acc.advisorRejected += 1;
          return acc;
        },
        { total: 0, pending: 0, approved: 0, rejected: 0, advisorRejected: 0 },
      ),
    [rows],
  );

  const activeRecord = useMemo(() => detailQuery.data ?? selected, [detailQuery.data, selected]);

  const pageTitle = "คำขอทดสอบระบบ (System Test)";
  const pageSubtitle = "ติดตามและพิจารณาคำขอทดสอบระบบจากนักศึกษา ตรวจสอบเอกสารและหลักฐานประกอบ";

  const openDrawer = (row: AdminSystemTestQueueRecord) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelected(null);
  };

  const openDecisionModal = (row: AdminSystemTestQueueRecord, type: "approve" | "reject") => {
    setSelected(row);
    setDecisionType(type);
    setDecisionNote("");
    setDecisionModalOpen(true);
  };

  const submitDecisionAction = async () => {
    if (!selected?.projectId) return;
    try {
      await submitDecision.mutateAsync({
        projectId: selected.projectId,
        decision: decisionType,
        note: decisionNote.trim() || undefined,
      });
      setFeedback({
        tone: "success",
        message: decisionType === "approve" ? "อนุมัติคำขอเรียบร้อยแล้ว" : "ส่งกลับคำขอเรียบร้อยแล้ว",
      });
      setDecisionModalOpen(false);
    } catch (error) {
      setFeedback({
        tone: "warning",
        message: error instanceof Error ? error.message : "ไม่สามารถบันทึกการตัดสินใจได้",
      });
    }
  };

  const openPdfPreview = (url: string) => {
    setPdfPreviewUrl(url);
  };

  const closePdfPreview = () => {
    setPdfPreviewUrl(null);
  };

  if (!canView) {
    return (
      <div className={styles.page}>
        <section className={styles.card}>
          <h1 className={styles.title}>{pageTitle}</h1>
          <p className={styles.subtitle}>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{pageTitle}</h1>
          <p className={styles.subtitle}>{pageSubtitle}</p>
        </div>
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setStatus("all");
              setSearch("");
              setAcademicYear("");
              setSemester("");
              setPage(1);
            }}
          >
            รีเซ็ตตัวกรอง
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
            <p className={styles.statLabel}>รอเจ้าหน้าที่ตรวจสอบ</p>
            <p className={styles.statValue}>{stats.pending}</p>
          </div>
          <div className={styles.statItem}>
            <p className={styles.statLabel}>อนุมัติแล้ว</p>
            <p className={styles.statValue}>{stats.approved}</p>
          </div>
          <div className={styles.statItem}>
            <p className={styles.statLabel}>ส่งกลับจากเจ้าหน้าที่</p>
            <p className={styles.statValue}>{stats.rejected}</p>
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
            <option value="all">ทุกสถานะ</option>
            <option value="pending_staff">รอเจ้าหน้าที่ตรวจสอบ</option>
            <option value="staff_approved">อนุมัติแล้ว</option>
            <option value="staff_rejected">ส่งกลับจากเจ้าหน้าที่</option>
            <option value="advisor_rejected">ส่งกลับจากอาจารย์</option>
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
            {(yearsQuery.data ?? []).map((year) => (
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
                <th>ผู้ยื่นคำขอ</th>
                <th>ช่วงเวลาทดสอบ</th>
                <th>สถานะ</th>
                <th>ยื่นคำขอ / อัปเดต</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {queueQuery.isLoading ? (
                <tr>
                  <td colSpan={6}>
                    <p className={styles.empty}>กำลังโหลดข้อมูล...</p>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <p className={styles.empty}>ไม่พบคำขอทดสอบระบบที่ตรงตามเงื่อนไข</p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.requestId}>
                    <td>
                      <p className={styles.name}>{row.projectSnapshot.projectNameTh || row.projectSnapshot.projectNameEn || "-"}</p>
                      <p className={styles.subText}>
                        #{row.projectId} {row.projectSnapshot.projectCode ? `| ${row.projectSnapshot.projectCode}` : ""}
                      </p>
                    </td>
                    <td>
                      {row.submittedBy ? (
                        <>
                          <p className={styles.subText}>{row.submittedBy.studentCode}</p>
                          <p className={styles.subText}>{row.submittedBy.name}</p>
                        </>
                      ) : (
                        <p className={styles.subText}>-</p>
                      )}
                    </td>
                    <td>
                      <p className={styles.subText}>เริ่ม: {formatDate(row.testStartDate)}</p>
                      <p className={styles.subText}>สิ้นสุด: {formatDate(row.testDueDate)}</p>
                    </td>
                    <td>
                      <span className={`${styles.tag} ${statusMeta(row.status).className}`}>{statusLabel(row.status)}</span>
                      {row.deadlineTag ? (
                        <span className={`${styles.tag} ${styles.tagLate}`} title={row.deadlineTag.tooltip || ""}>
                          {row.deadlineTag.text}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <p className={styles.subText}>ยื่นคำขอ: {formatDateTime(row.submittedAt)}</p>
                      <p className={styles.subText}>อัปเดตล่าสุด: {formatDateTime(row.updatedAt)}</p>
                    </td>
                    <td>
                      <div className={styles.buttonRow}>
                        <button type="button" className={styles.button} onClick={() => openDrawer(row)}>
                          รายละเอียด
                        </button>
                        {isStaff && row.status === "pending_staff" ? (
                          <>
                            <button
                              type="button"
                              className={`${styles.button} ${styles.buttonPrimary}`}
                              onClick={() => openDecisionModal(row, "approve")}
                              disabled={isBusy}
                            >
                              อนุมัติ
                            </button>
                            <button type="button" className={styles.button} onClick={() => openDecisionModal(row, "reject")} disabled={isBusy}>
                              ส่งกลับ
                            </button>
                          </>
                        ) : null}
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

      {queueQuery.isError ? <p className={styles.empty}>ไม่สามารถโหลดรายการคำขอทดสอบระบบได้</p> : null}

      {drawerOpen && selected ? (
        <div className={styles.drawerOverlay}>
          <aside className={styles.drawer}>
            <header className={styles.drawerHeader}>
              <div>
                <p className={styles.drawerTitle}>รายละเอียดคำขอทดสอบระบบ</p>
                <p className={styles.subText}>
                  {activeRecord?.projectSnapshot.projectNameTh || activeRecord?.projectSnapshot.projectNameEn || "-"}
                </p>
              </div>
              <button type="button" className={styles.button} onClick={closeDrawer}>
                ปิด
              </button>
            </header>
            <div className={styles.drawerBody}>
              {detailQuery.isLoading ? <p className={styles.empty}>กำลังโหลดรายละเอียด...</p> : null}
              <section className={styles.detailSection}>
                <h3 className={styles.detailTitle}>ภาพรวมคำขอ</h3>
                <p>
                  สถานะ: <span className={`${styles.tag} ${statusMeta(activeRecord?.status || "").className}`}>{statusLabel(activeRecord?.status || "")}</span>
                </p>
                <p>วันที่ยื่นคำขอ: {formatDateTime(activeRecord?.submittedAt)}</p>
                <p>ช่วงเวลาทดสอบ: {formatDate(activeRecord?.testStartDate)} ถึง {formatDate(activeRecord?.testDueDate)}</p>
                <p>หมายเหตุจากนักศึกษา: {activeRecord?.studentNote || "-"}</p>
                <p>ผู้ยื่นคำขอ: {activeRecord?.submittedBy?.name || "-"} ({activeRecord?.submittedBy?.studentCode || "-"})</p>
              </section>

              <section className={styles.detailSection}>
                <h3 className={styles.detailTitle}>ข้อมูลโครงงาน</h3>
                <p>รหัสโครงงาน: {activeRecord?.projectSnapshot.projectCode || "-"}</p>
                <p>ชื่อโครงงาน (ไทย): {activeRecord?.projectSnapshot.projectNameTh || "-"}</p>
                <p>ชื่อโครงงาน (EN): {activeRecord?.projectSnapshot.projectNameEn || "-"}</p>
              </section>

              <section className={styles.detailSection}>
                <h3 className={styles.detailTitle}>เอกสารและหลักฐาน</h3>
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  <div>
                    <p className={styles.subText} style={{ fontWeight: 600 }}>เอกสารคำขอ:</p>
                    {activeRecord?.requestFile?.url ? (
                      <button
                        type="button"
                        className={`${styles.button} ${styles.buttonPrimary}`}
                        onClick={() => openPdfPreview(activeRecord.requestFile?.url || "")}
                        style={{ marginTop: "0.25rem" }}
                      >
                        📄 ดูเอกสาร {activeRecord.requestFile.name ? `(${activeRecord.requestFile.name})` : ""}
                      </button>
                    ) : (
                      <p className={styles.subText}>ไม่มีเอกสารคำขอ</p>
                    )}
                  </div>
                  <div>
                    <p className={styles.subText} style={{ fontWeight: 600 }}>หลักฐานการทดสอบ:</p>
                    {activeRecord?.evidence?.url ? (
                      <>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.buttonPrimary}`}
                          onClick={() => openPdfPreview(activeRecord.evidence?.url || "")}
                          style={{ marginTop: "0.25rem" }}
                        >
                          📄 ดูหลักฐาน {activeRecord.evidence.name ? `(${activeRecord.evidence.name})` : ""}
                        </button>
                        <p className={styles.subText}>อัปโหลดเมื่อ: {formatDateTime(activeRecord?.evidenceSubmittedAt)}</p>
                      </>
                    ) : (
                      <p className={styles.subText}>ยังไม่มีหลักฐาน</p>
                    )}
                  </div>
                </div>
              </section>

              <section className={styles.detailSection}>
                <h3 className={styles.detailTitle}>Timeline การพิจารณา</h3>
                <ul className={styles.timeline}>
                  {activeRecord?.timeline?.submittedAt ? (
                    <li>
                      <p className={styles.timelineTitle}>📤 ยื่นคำขอ</p>
                      <p className={styles.subText}>{formatDateTime(activeRecord.timeline.submittedAt)}</p>
                    </li>
                  ) : null}
                  {activeRecord?.advisorDecision ? (
                    <li>
                      <p className={styles.timelineTitle}>👨‍🏫 อาจารย์ที่ปรึกษาหลัก</p>
                      <p className={styles.subText}>ผู้พิจารณา: {activeRecord.advisorDecision.name || "-"}</p>
                      <p className={styles.subText}>เวลา: {formatDateTime(activeRecord.advisorDecision.decidedAt)}</p>
                      {activeRecord.advisorDecision.note ? <p className={styles.subText}>หมายเหตุ: {activeRecord.advisorDecision.note}</p> : null}
                    </li>
                  ) : null}
                  {activeRecord?.coAdvisorDecision ? (
                    <li>
                      <p className={styles.timelineTitle}>👨‍🏫 อาจารย์ที่ปรึกษาร่วม</p>
                      <p className={styles.subText}>ผู้พิจารณา: {activeRecord.coAdvisorDecision.name || "-"}</p>
                      <p className={styles.subText}>เวลา: {formatDateTime(activeRecord.coAdvisorDecision.decidedAt)}</p>
                      {activeRecord.coAdvisorDecision.note ? (
                        <p className={styles.subText}>หมายเหตุ: {activeRecord.coAdvisorDecision.note}</p>
                      ) : null}
                    </li>
                  ) : null}
                  {activeRecord?.staffDecision ? (
                    <li>
                      <p className={styles.timelineTitle}>👔 เจ้าหน้าที่</p>
                      <p className={styles.subText}>ผู้พิจารณา: {activeRecord.staffDecision.name || "-"}</p>
                      <p className={styles.subText}>เวลา: {formatDateTime(activeRecord.staffDecision.decidedAt)}</p>
                      {activeRecord.staffDecision.note ? <p className={styles.subText}>หมายเหตุ: {activeRecord.staffDecision.note}</p> : null}
                    </li>
                  ) : null}
                  {activeRecord?.timeline?.evidenceSubmittedAt ? (
                    <li>
                      <p className={styles.timelineTitle}>📎 อัปโหลดหลักฐาน</p>
                      <p className={styles.subText}>{formatDateTime(activeRecord.timeline.evidenceSubmittedAt)}</p>
                    </li>
                  ) : null}
                </ul>
              </section>
            </div>
          </aside>
        </div>
      ) : null}

      {decisionModalOpen && selected ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>
              {decisionType === "approve" ? "อนุมัติคำขอทดสอบระบบ" : "ส่งกลับคำขอทดสอบระบบ"}
            </h3>
            <p className={styles.subText}>{selected.projectSnapshot.projectNameTh || selected.projectSnapshot.projectNameEn || "-"}</p>
            <label className={styles.field}>
              <span>หมายเหตุถึงนักศึกษา (ไม่บังคับ)</span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={decisionNote}
                onChange={(event) => setDecisionNote(event.target.value)}
                placeholder="ระบุหมายเหตุเพิ่มเติม"
              />
            </label>
            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.button}
                onClick={() => {
                  if (submitDecision.isPending) return;
                  setDecisionModalOpen(false);
                }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => void submitDecisionAction()}
                disabled={submitDecision.isPending}
              >
                {submitDecision.isPending ? "กำลังบันทึก..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pdfPreviewUrl ? (
        <div className={styles.modalOverlay} onClick={closePdfPreview}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ width: "min(900px, 95%)", maxHeight: "90vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h3 className={styles.modalTitle}>ดูเอกสาร</h3>
              <button type="button" className={styles.button} onClick={closePdfPreview}>
                ปิด
              </button>
            </div>
            <div style={{ height: "70vh", overflow: "auto" }}>
              <iframe
                src={pdfPreviewUrl}
                style={{ width: "100%", height: "100%", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem" }}
                title="PDF Preview"
              />
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <a href={pdfPreviewUrl} target="_blank" rel="noreferrer" className={styles.link}>
                เปิดในแท็บใหม่
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
