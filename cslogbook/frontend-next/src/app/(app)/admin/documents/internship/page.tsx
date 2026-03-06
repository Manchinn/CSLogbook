"use client";

import { useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  useAdminInternshipAcademicYears,
  useAdminInternshipDocumentDetail,
  useAdminInternshipDocumentMutations,
  useAdminInternshipDocuments,
  useAdminInternshipLateSubmissions,
} from "@/hooks/useAdminInternshipDocuments";
import type { AdminInternshipDocument } from "@/lib/services/adminInternshipDocumentsService";
import btn from "@/styles/shared/buttons.module.css";
import responsive from "@/styles/shared/responsive.module.css";
import styles from "./page.module.css";

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

function statusLabel(status: string, reviewerId: number | null) {
  if (status === "pending" && reviewerId) return "รอหัวหน้าภาค";
  if (status === "pending") return "รอตรวจสอบ";
  if (status === "approved") return "อนุมัติ";
  if (status === "rejected") return "ไม่อนุมัติ";
  if (status === "cancelled") return "ยกเลิกการฝึกงาน";
  return status || "-";
}

function lateLabel(status: string) {
  if (status === "overdue") return "เลยกำหนด";
  if (status === "very_late") return "ส่งช้ามาก";
  return "ส่งช้า";
}

function documentNameLabel(documentName: string | null | undefined): string {
  if (!documentName) return "-";
  const normalized = documentName.toUpperCase();
  if (normalized === "CS05") return "แบบคำร้องขอฝึกงาน";
  if (normalized === "ACCEPTANCE_LETTER") return "หนังสือตอบรับการฝึกงาน";
  return documentName;
}

function canSelectRow(document: AdminInternshipDocument) {
  return document.status === "pending" && !document.reviewerId;
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { dateStyle: "long" }).format(date);
}

export default function AdminInternshipDocumentsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("pending");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selected, setSelected] = useState<AdminInternshipDocument | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectIds, setRejectIds] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning"; message: string } | null>(null);

  const filters = useMemo(
    () => ({
      status: status || undefined,
      search: search.trim() || undefined,
      academicYear: academicYear || undefined,
      semester: semester || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [academicYear, page, pageSize, search, semester, status],
  );

  const documentsQuery = useAdminInternshipDocuments(filters);
  const academicYearsQuery = useAdminInternshipAcademicYears();
  const lateSubmissionsQuery = useAdminInternshipLateSubmissions({
    academicYear: academicYear || undefined,
    semester: semester || undefined,
  });
  const detailQuery = useAdminInternshipDocumentDetail(selected?.id ?? null, drawerOpen);
  const { reviewDocument, rejectDocument, previewDocument, downloadDocument } = useAdminInternshipDocumentMutations();

  const listResult = documentsQuery.data;
  const rows = useMemo(() => listResult?.documents ?? [], [listResult?.documents]);
  const total = listResult?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const lateMap = useMemo(() => {
    const map = new Map<number, { status: string; daysLate?: number; hoursLate?: number }>();
    (lateSubmissionsQuery.data ?? []).forEach((item) => {
      if (!item) return;
      map.set(item.documentId, { status: item.status, daysLate: item.daysLate, hoursLate: item.hoursLate });
    });
    return map;
  }, [lateSubmissionsQuery.data]);

  const stats = useMemo(() => {
    const source = listResult?.statistics;
    const lateCount = rows.filter((row) => lateMap.has(row.id)).length;
    return {
      total: source?.total ?? total,
      pending: source?.pending ?? rows.filter((row) => row.status === "pending").length,
      approved: source?.approved ?? rows.filter((row) => row.status === "approved").length,
      rejected: source?.rejected ?? rows.filter((row) => row.status === "rejected").length,
      lateCount,
    };
  }, [lateMap, listResult?.statistics, rows, total]);

  const onResetFilters = () => {
    setSearch("");
    setStatus("pending");
    setAcademicYear("");
    setSemester("");
    setPage(1);
    setSelectedIds([]);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelected(null);
  };

  const openDetail = (document: AdminInternshipDocument) => {
    setSelected(document);
    setDrawerOpen(true);
  };

  const onToggleSelected = (documentId: number, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return [...prev, documentId];
      return prev.filter((id) => id !== documentId);
    });
  };

  const onToggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds([]);
      return;
    }
    const allIds = rows.filter(canSelectRow).map((row) => row.id);
    setSelectedIds(allIds);
  };

  const handleBulkReview = async () => {
    if (!selectedIds.length) return;
    try {
      await Promise.all(
        selectedIds.map((documentId) => {
          const row = rows.find((item) => item.id === documentId);
          return reviewDocument.mutateAsync({
            documentId,
            documentName: row?.documentName,
          });
        }),
      );
      setSelectedIds([]);
      setFeedback({ tone: "success", message: "ตรวจและส่งต่อเอกสารที่เลือกเรียบร้อยแล้ว" });
    } catch (error) {
      setFeedback({
        tone: "warning",
        message: error instanceof Error ? error.message : "ไม่สามารถตรวจและส่งต่อเอกสารได้",
      });
    }
  };

  const handleBulkReject = async () => {
    if (!selectedIds.length) return;
    setRejectIds(selectedIds);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleSingleReject = (documentId: number) => {
    setRejectIds([documentId]);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const submitReject = async () => {
    if (rejectReason.trim().length < 10) {
      setFeedback({ tone: "warning", message: "เหตุผลการปฏิเสธต้องมีอย่างน้อย 10 ตัวอักษร" });
      return;
    }

    try {
      await Promise.all(
        rejectIds.map((documentId) =>
          rejectDocument.mutateAsync({
            documentId,
            reason: rejectReason.trim(),
          }),
        ),
      );
      setSelectedIds((prev) => prev.filter((id) => !rejectIds.includes(id)));
      setRejectModalOpen(false);
      setRejectReason("");
      setRejectIds([]);
      setFeedback({ tone: "success", message: "ปฏิเสธเอกสารเรียบร้อยแล้ว" });
    } catch (error) {
      setFeedback({
        tone: "warning",
        message: error instanceof Error ? error.message : "ไม่สามารถปฏิเสธเอกสารได้",
      });
    }
  };

  const handleSingleReview = async (document: AdminInternshipDocument) => {
    try {
      await reviewDocument.mutateAsync({ documentId: document.id, documentName: document.documentName });
      setFeedback({ tone: "success", message: "ตรวจและส่งต่อเอกสารเรียบร้อยแล้ว" });
    } catch (error) {
      setFeedback({
        tone: "warning",
        message: error instanceof Error ? error.message : "ไม่สามารถตรวจและส่งต่อเอกสารได้",
      });
    }
  };

  const handlePreview = async (documentId: number) => {
    try {
      await previewDocument.mutateAsync({ documentId });
    } catch (error) {
      setFeedback({
        tone: "warning",
        message: error instanceof Error ? error.message : "ไม่สามารถเปิดเอกสารได้",
      });
    }
  };

  const handleDownload = async (documentId: number) => {
    try {
      await downloadDocument.mutateAsync({ documentId });
    } catch (error) {
      setFeedback({
        tone: "warning",
        message: error instanceof Error ? error.message : "ไม่สามารถดาวน์โหลดเอกสารได้",
      });
    }
  };

  const allSelectableRows = rows.filter(canSelectRow);
  const isAllSelected = allSelectableRows.length > 0 && selectedIds.length === allSelectableRows.length;
  const selectedCount = selectedIds.length;
  const isBulkBusy = reviewDocument.isPending || rejectDocument.isPending;
  const isFileBusy = previewDocument.isPending || downloadDocument.isPending;
  const canActionSelected = selected ? canSelectRow(selected) : false;
  const detail = detailQuery.data;
  const isCS05 = detail?.documentName?.toUpperCase() === "CS05";
  const studentCode = detail?.owner?.student?.studentCode ?? "-";
  const totalCredits = detail?.owner?.student?.totalCredits ?? "-";
  const studentYear = detail?.owner?.student?.studentYear ?? "-";

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>จัดการเอกสารคำร้องขอฝึกงาน</h1>
            <p className={styles.subtitle}>จัดการคำร้องขอฝึกงานของนักศึกษา ตรวจสอบ และอนุมัติเอกสาร</p>
          </div>
          <div className={btn.buttonRow}>
            <button type="button" className={btn.button} onClick={onResetFilters}>
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
              <p className={styles.statLabel}>เอกสารทั้งหมด</p>
              <p className={styles.statValue}>{stats.total}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>รอตรวจสอบ</p>
              <p className={styles.statValue}>{stats.pending}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>อนุมัติแล้ว</p>
              <p className={styles.statValue}>{stats.approved}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>ปฏิเสธแล้ว</p>
              <p className={styles.statValue}>{stats.rejected}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>เอกสารส่งช้า (หน้านี้)</p>
              <p className={styles.statValue}>{stats.lateCount}</p>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.filters}>
            <input
              className={styles.input}
              placeholder="ค้นหาชื่อ/ประเภทเอกสาร"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <select
              className={styles.select}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
                setSelectedIds([]);
              }}
            >
              <option value="">ทุกสถานะ</option>
              <option value="pending">รอตรวจสอบ</option>
              <option value="approved">อนุมัติ</option>
              <option value="rejected">ปฏิเสธ</option>
              <option value="cancelled">ยกเลิกการฝึกงาน</option>
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
              {(academicYearsQuery.data ?? []).map((year) => (
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
              <option value="1">ภาคเรียนที่ 1</option>
              <option value="2">ภาคเรียนที่ 2</option>
              <option value="3">ภาคฤดูร้อน</option>
            </select>
            <div className={btn.buttonRow}>
              <button
                type="button"
                className={`${btn.button} ${btn.buttonPrimary}`}
                onClick={handleBulkReview}
                disabled={!selectedCount || isBulkBusy}
              >
                ตรวจและส่งต่อ ({selectedCount})
              </button>
              <button
                type="button"
                className={`${btn.button} ${btn.buttonDanger}`}
                onClick={handleBulkReject}
                disabled={!selectedCount || isBulkBusy}
              >
                ปฏิเสธ
              </button>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(event) => onToggleSelectAll(event.target.checked)}
                    />
                  </th>
                  <th>เอกสาร/นักศึกษา</th>
                  <th className={responsive.hideOnMobile}>วันที่ส่ง</th>
                  <th>สถานะ</th>
                  <th>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row) => {
                    const lateInfo = lateMap.get(row.id);
                    const selectedRow = selectedIds.includes(row.id);
                    const selectable = canSelectRow(row);

                    return (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedRow}
                            disabled={!selectable}
                            onChange={(event) => onToggleSelected(row.id, event.target.checked)}
                          />
                        </td>
                        <td>
                          <p className={styles.name}>{documentNameLabel(row.documentName)}</p>
                          <p className={styles.subText}>{row.studentName || "-"}</p>
                        </td>
                        <td className={responsive.hideOnMobile}>{formatDateTime(row.createdAt)}</td>
                        <td>
                          <span className={`${styles.tag} ${styles.tagStatus}`}>{statusLabel(row.status, row.reviewerId)}</span>
                          {lateInfo ? (
                            <span className={`${styles.tag} ${styles.tagLate}`}>
                              {lateLabel(lateInfo.status)}
                              {typeof lateInfo.daysLate === "number" && lateInfo.daysLate > 0 ? ` ${lateInfo.daysLate} วัน` : ""}
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <div className={btn.buttonRow}>
                            <button type="button" className={btn.button} onClick={() => openDetail(row)}>
                              รายละเอียด
                            </button>
                            {canSelectRow(row) ? (
                              <>
                                <button
                                  type="button"
                                  className={`${btn.button} ${btn.buttonPrimary}`}
                                  onClick={() => handleSingleReview(row)}
                                  disabled={isBulkBusy}
                                >
                                  ส่งต่อ
                                </button>
                                <button
                                  type="button"
                                  className={`${btn.button} ${btn.buttonDanger}`}
                                  onClick={() => handleSingleReject(row.id)}
                                  disabled={isBulkBusy}
                                >
                                  ปฏิเสธ
                                </button>
                              </>
                            ) : null}
                            <button
                              type="button"
                              className={styles.iconButton}
                              onClick={() => handlePreview(row.id)}
                              disabled={isFileBusy}
                              title="ดูไฟล์"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className={styles.iconButton}
                              onClick={() => handleDownload(row.id)}
                              disabled={isFileBusy}
                              title="ดาวน์โหลด"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <p className={styles.empty}>ไม่พบเอกสารที่ตรงตามเงื่อนไข</p>
                    </td>
                  </tr>
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
                const nextSize = Number(event.target.value);
                setPageSize(nextSize);
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
              className={btn.button}
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              ก่อนหน้า
            </button>
            <button
              type="button"
              className={btn.button}
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              ถัดไป
            </button>
          </div>
        </section>

        {documentsQuery.isLoading ? <p className={styles.empty}>กำลังโหลดข้อมูลเอกสาร...</p> : null}
        {documentsQuery.isError ? <p className={styles.empty}>ไม่สามารถโหลดรายการเอกสารได้</p> : null}

        {drawerOpen ? (
          <div className={styles.drawerOverlay}>
            <aside className={styles.drawer}>
              <header className={styles.drawerHeader}>
                <div>
                  <p className={styles.drawerTitle}>รายละเอียดเอกสาร</p>
                  <p className={styles.subText}>
                    {documentNameLabel(selected?.documentName)} / {selected?.studentName || "-"}
                  </p>
                </div>
                <button type="button" className={btn.button} onClick={closeDrawer}>
                  ปิด
                </button>
              </header>
              <div className={styles.drawerBody}>
                {detailQuery.isLoading ? <p className={styles.empty}>กำลังโหลดรายละเอียด...</p> : null}
                {detail ? (
                  <>
                    <section className={styles.detailSection}>
                      <h3 className={styles.detailTitle}>ข้อมูลเอกสาร</h3>
                      <p>ชื่อเอกสาร: {documentNameLabel(detail.documentName)}</p>
                      <p>สถานะ: {statusLabel(detail.status ?? "", selected?.reviewerId ?? null)}</p>
                      <p>วันที่ส่ง: {formatDateTime(detail.submittedAt)}</p>
                      <p>หมายเหตุ: {typeof detail.reviewComment === "string" && detail.reviewComment ? detail.reviewComment : "-"}</p>
                    </section>
                    <section className={styles.detailSection}>
                      <h3 className={styles.detailTitle}>ข้อมูลฝึกงาน</h3>
                      <p>บริษัท: {detail.internshipDocument?.companyName || "-"}</p>
                      <p>ตำแหน่ง: {detail.internshipDocument?.internshipPosition || "-"}</p>
                      <p>ช่วงฝึกงาน: {formatDateTime(detail.internshipDocument?.startDate)} - {formatDateTime(detail.internshipDocument?.endDate)}</p>
                    </section>
                    {isCS05 ? (
                      <section className={styles.detailSection}>
                        <h3 className={styles.detailTitle}>ข้อมูลตามฟอร์ม คพ.05</h3>
                        <p>รหัสนักศึกษา: {studentCode}</p>
                        <p>ชั้นปี: {studentYear}</p>
                        <p>หน่วยกิตสะสม: {totalCredits}</p>
                        <p>บริษัท/หน่วยงาน: {detail.internshipDocument?.companyName || "-"}</p>
                        <p>สถานที่ตั้ง: {detail.internshipDocument?.companyAddress || "-"}</p>
                        <p>ตำแหน่งฝึกงาน: {detail.internshipDocument?.internshipPosition || "-"}</p>
                        <p>
                          ระยะเวลา: {formatShortDate(detail.internshipDocument?.startDate)} -{" "}
                          {formatShortDate(detail.internshipDocument?.endDate)}
                        </p>
                      </section>
                    ) : null}
                    {selected ? (
                      <div className={btn.buttonRow}>
                        {canActionSelected ? (
                          <>
                            <button
                              type="button"
                              className={`${btn.button} ${btn.buttonPrimary}`}
                              onClick={() => handleSingleReview(selected)}
                              disabled={isBulkBusy}
                            >
                              ตรวจและส่งต่อ
                            </button>
                            <button
                              type="button"
                              className={`${btn.button} ${btn.buttonDanger}`}
                              onClick={() => handleSingleReject(selected.id)}
                              disabled={isBulkBusy}
                            >
                              ปฏิเสธ
                            </button>
                          </>
                        ) : null}
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => handlePreview(selected.id)}
                          disabled={isFileBusy}
                          title="ดูไฟล์"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => handleDownload(selected.id)}
                          disabled={isFileBusy}
                          title="ดาวน์โหลด"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : detailQuery.isError ? (
                  <p className={styles.empty}>ไม่สามารถโหลดรายละเอียดเอกสาร</p>
                ) : null}
              </div>
            </aside>
          </div>
        ) : null}

        {rejectModalOpen ? (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3 className={styles.modalTitle}>ระบุเหตุผลการปฏิเสธ</h3>
              <p className={styles.subText}>ระบบจะปฏิเสธเอกสาร {rejectIds.length} รายการ</p>
              <textarea
                className={styles.textarea}
                rows={5}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="กรอกเหตุผลอย่างน้อย 10 ตัวอักษร"
              />
              <div className={btn.buttonRow}>
                <button
                  type="button"
                  className={btn.button}
                  onClick={() => {
                    if (isBulkBusy) return;
                    setRejectModalOpen(false);
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className={`${btn.button} ${btn.buttonDanger}`}
                  onClick={submitReject}
                  disabled={isBulkBusy}
                >
                  ยืนยันปฏิเสธ
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RoleGuard>
  );
}
