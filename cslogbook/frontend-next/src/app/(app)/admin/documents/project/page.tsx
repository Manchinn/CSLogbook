"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  listAdminProjectDocuments,
  getAdminProjectDocumentDetail,
  reviewAdminProjectDocument,
  rejectAdminProjectDocument,
  previewAdminProjectDocument,
  downloadAdminProjectDocument,
  type AdminProjectDocument,
} from "@/lib/services/adminProjectDocumentsService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { labelStatus } from "@/lib/utils/statusLabels";
import styles from "@/styles/shared/admin-queue.module.css";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function documentNameLabel(name: string | null | undefined): string {
  if (!name) return "-";
  const map: Record<string, string> = {
    KP01: "คพ.01 (เสนอหัวข้อโครงงานพิเศษ)",
    KP02: "คพ.02 (คำร้องขอสอบโครงงานพิเศษ 1)",
    PROJECT_REPORT: "รายงานโครงงาน",
    THESIS_PROPOSAL: "โครงร่างปริญญานิพนธ์",
    THESIS_REPORT: "รายงานปริญญานิพนธ์",
  };
  return map[name] ?? name;
}

function canSelectRow(document: AdminProjectDocument) {
  return document.status === "pending" && !document.reviewerId;
}

export default function AdminProjectDocumentsPage() {
  const queryClient = useQueryClient();
  const { data: academicYears = [] } = useAcademicYears();
  const [academicYear, setAcademicYear] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Default to active academic year once loaded
  useEffect(() => {
    if (!academicYear && academicYears.length > 0) {
      const active = academicYears.find((y) => y.status === "active");
      if (active) setAcademicYear(String(active.academicYear));
    }
  }, [academicYear, academicYears]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selected, setSelected] = useState<AdminProjectDocument | null>(null);
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
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [academicYear, page, pageSize, search, status],
  );

  const documentsQuery = useQuery({
    queryKey: ["admin-project-documents", filters],
    queryFn: () => listAdminProjectDocuments(filters),
  });

  const reviewMutation = useMutation({
    mutationFn: (documentId: number) => reviewAdminProjectDocument(documentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-project-documents"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ documentId, reason }: { documentId: number; reason: string }) =>
      rejectAdminProjectDocument(documentId, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-project-documents"] }),
  });

  const previewMutation = useMutation({
    mutationFn: (documentId: number) => previewAdminProjectDocument(documentId),
  });

  const downloadMutation = useMutation({
    mutationFn: (documentId: number) => downloadAdminProjectDocument(documentId),
  });

  const detailQuery = useQuery({
    queryKey: ["admin-project-document-detail", selected?.id],
    queryFn: () => getAdminProjectDocumentDetail(selected!.id),
    enabled: drawerOpen && !!selected?.id,
  });

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelected(null);
  };

  const listResult = documentsQuery.data;
  const rows = useMemo(() => listResult?.documents ?? [], [listResult?.documents]);
  const total = listResult?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const stats = useMemo(() => {
    const source = listResult?.statistics;
    return {
      total: source?.total ?? total,
      pending: source?.pending ?? rows.filter((r) => r.status === "pending").length,
      approved: source?.approved ?? rows.filter((r) => r.status === "approved").length,
      rejected: source?.rejected ?? rows.filter((r) => r.status === "rejected").length,
    };
  }, [listResult?.statistics, rows, total]);

  const onReset = () => {
    setSearch("");
    setStatus("pending");
    const active = academicYears.find((y) => y.status === "active");
    setAcademicYear(active ? String(active.academicYear) : "");
    setPage(1);
    setSelectedIds([]);
  };

  const onToggleSelected = (id: number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const onToggleAll = (checked: boolean) => {
    setSelectedIds(checked ? rows.filter(canSelectRow).map((r) => r.id) : []);
  };

  const allSelectable = rows.filter(canSelectRow);
  const isAllSelected = allSelectable.length > 0 && selectedIds.length === allSelectable.length;
  const isBulkBusy = reviewMutation.isPending || rejectMutation.isPending;
  const isFileBusy = previewMutation.isPending || downloadMutation.isPending;

  const handleBulkReview = async () => {
    if (!selectedIds.length) return;
    try {
      await Promise.all(selectedIds.map((id) => reviewMutation.mutateAsync(id)));
      setSelectedIds([]);
      setFeedback({ tone: "success", message: "ส่งต่อเอกสารที่เลือกเรียบร้อยแล้ว" });
    } catch (error) {
      setFeedback({ tone: "warning", message: error instanceof Error ? error.message : "ไม่สามารถดำเนินการได้" });
    }
  };

  const handleBulkReject = () => {
    if (!selectedIds.length) return;
    setRejectIds(selectedIds);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleSingleReview = async (doc: AdminProjectDocument) => {
    try {
      await reviewMutation.mutateAsync(doc.id);
      setFeedback({ tone: "success", message: "ส่งต่อเอกสารเรียบร้อยแล้ว" });
      if (drawerOpen) closeDrawer();
    } catch (error) {
      setFeedback({ tone: "warning", message: error instanceof Error ? error.message : "ไม่สามารถดำเนินการได้" });
    }
  };

  const handleSingleReject = (id: number) => {
    setRejectIds([id]);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const submitReject = async () => {
    if (rejectReason.trim().length < 10) {
      setFeedback({ tone: "warning", message: "เหตุผลต้องมีอย่างน้อย 10 ตัวอักษร" });
      return;
    }
    try {
      await Promise.all(rejectIds.map((id) => rejectMutation.mutateAsync({ documentId: id, reason: rejectReason.trim() })));
      setSelectedIds((prev) => prev.filter((id) => !rejectIds.includes(id)));
      setRejectModalOpen(false);
      setRejectReason("");
      setRejectIds([]);
      setFeedback({ tone: "success", message: "ปฏิเสธเอกสารเรียบร้อยแล้ว" });
      if (drawerOpen) closeDrawer();
    } catch (error) {
      setFeedback({ tone: "warning", message: error instanceof Error ? error.message : "ไม่สามารถปฏิเสธเอกสารได้" });
    }
  };

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>จัดการเอกสารโครงงาน</h1>
            <p className={styles.subtitle}>ตรวจสอบและอนุมัติเอกสารที่เกี่ยวกับโครงงานพิเศษและปริญญานิพนธ์</p>
          </div>
          <button type="button" className={styles.button} onClick={onReset}>รีเซ็ตตัวกรอง</button>
        </header>

        {feedback ? (
          <div className={`${styles.alert} ${feedback.tone === "success" ? styles.alertSuccess : styles.alertWarning}`}>
            {feedback.message}
          </div>
        ) : null}

        {/* Stats */}
        <section className={styles.card}>
          <div className={styles.stats}>
            <div className={styles.statItem}><p className={styles.statLabel}>ทั้งหมด</p><p className={styles.statValue}>{stats.total}</p></div>
            <div className={styles.statItem}><p className={styles.statLabel}>รอตรวจสอบ</p><p className={styles.statValue}>{stats.pending}</p></div>
            <div className={styles.statItem}><p className={styles.statLabel}>อนุมัติแล้ว</p><p className={styles.statValue}>{stats.approved}</p></div>
            <div className={styles.statItem}><p className={styles.statLabel}>ปฏิเสธแล้ว</p><p className={styles.statValue}>{stats.rejected}</p></div>
          </div>
        </section>

        {/* Filters */}
        <section className={styles.card}>
          <div className={styles.filters}>
            <input className={styles.input} placeholder="ค้นหาชื่อ/ประเภทเอกสาร/นักศึกษา" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            <select className={styles.select} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); setSelectedIds([]); }}>
              <option value="">ทุกสถานะ</option>
              <option value="pending">รอตรวจสอบ</option>
              <option value="approved">อนุมัติ</option>
              <option value="rejected">ปฏิเสธ</option>
            </select>
            <select className={styles.select} value={academicYear} onChange={(e) => { setAcademicYear(e.target.value); setPage(1); }}>
              <option value="">ทุกปีการศึกษา</option>
              {academicYears.map((y) => (
                <option key={y.academicYear} value={y.academicYear}>
                  {y.academicYear}{y.status === "active" ? " (ปัจจุบัน)" : ""}
                </option>
              ))}
            </select>
            <div className={styles.buttonRow}>
              <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={handleBulkReview} disabled={!selectedIds.length || isBulkBusy}>
                ส่งต่อ ({selectedIds.length})
              </button>
              <button type="button" className={`${styles.button} ${styles.buttonDanger}`} onClick={handleBulkReject} disabled={!selectedIds.length || isBulkBusy}>
                ปฏิเสธ
              </button>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className={styles.card}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th><input type="checkbox" checked={isAllSelected} onChange={(e) => onToggleAll(e.target.checked)} /></th>
                  <th>เอกสาร/นักศึกษา</th>
                  <th>โครงงาน</th>
                  <th>วันที่ส่ง</th>
                  <th>สถานะ</th>
                  <th>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          disabled={!canSelectRow(row)}
                          onChange={(e) => onToggleSelected(row.id, e.target.checked)}
                        />
                      </td>
                      <td>
                        <p className={styles.name}>{documentNameLabel(row.documentName)}</p>
                        <p className={styles.subText}>{row.studentName || "-"}</p>
                      </td>
                      <td>
                        <p className={styles.subText}>{row.projectCode || "-"}</p>
                        <p className={styles.subText}>{row.projectTitle || "-"}</p>
                      </td>
                      <td>{formatDateTime(row.createdAt)}</td>
                      <td>
                        <span className={`${styles.tag} ${styles.tagStatus}`}>{labelStatus(row.status)}</span>
                      </td>
                      <td>
                        <div className={styles.buttonRow}>
                          <button type="button" className={styles.button} onClick={() => { setSelected(row); setDrawerOpen(true); }}>รายละเอียด</button>
                          {canSelectRow(row) ? (
                            <>
                              <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => handleSingleReview(row)} disabled={isBulkBusy}>ส่งต่อ</button>
                              <button type="button" className={`${styles.button} ${styles.buttonDanger}`} onClick={() => handleSingleReject(row.id)} disabled={isBulkBusy}>ปฏิเสธ</button>
                            </>
                          ) : null}
                          <button type="button" className={styles.iconButton} onClick={() => previewMutation.mutate(row.id)} disabled={isFileBusy} title="ดูไฟล์">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button type="button" className={styles.iconButton} onClick={() => downloadMutation.mutate(row.id)} disabled={isFileBusy} title="ดาวน์โหลด">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6}><p className={styles.empty}>{documentsQuery.isLoading ? "กำลังโหลด..." : "ไม่พบเอกสาร"}</p></td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <p className={styles.paginationInfo}>หน้า {page} / {totalPages} (ทั้งหมด {total} รายการ)</p>
            <select className={styles.select} value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
              {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s} ต่อหน้า</option>)}
            </select>
            <button type="button" className={styles.button} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>ก่อนหน้า</button>
            <button type="button" className={styles.button} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>ถัดไป</button>
          </div>
        </section>

        {/* Drawer */}
        {drawerOpen && selected ? (
          <div className={styles.drawerOverlay}>
            <aside className={styles.drawer}>
              <header className={styles.drawerHeader}>
                <div>
                  <p className={styles.drawerTitle}>รายละเอียดเอกสาร</p>
                  <p className={styles.subText}>{documentNameLabel(selected.documentName)} / {selected.studentName}</p>
                </div>
                <button type="button" className={styles.button} onClick={closeDrawer}>ปิด</button>
              </header>
              <div className={styles.drawerBody}>
                {detailQuery.isLoading ? (
                  <p className={styles.subText}>กำลังโหลด...</p>
                ) : detailQuery.isError ? (
                  <p className={styles.subText}>ไม่สามารถโหลดข้อมูลได้</p>
                ) : (
                  <section className={styles.detailSection}>
                    <h3 className={styles.detailTitle}>ข้อมูลเอกสาร</h3>
                    <p>ชื่อเอกสาร: {documentNameLabel(detailQuery.data?.documentName ?? selected.documentName)}</p>
                    <p>นักศึกษา: {detailQuery.data?.studentName || selected.studentName || "-"}</p>
                    {detailQuery.data?.studentCode ? <p>รหัสนักศึกษา: {detailQuery.data.studentCode}</p> : null}
                    <p>สถานะ: {labelStatus(detailQuery.data?.status ?? selected.status)}</p>
                    <p>วันที่ส่ง: {formatDateTime(detailQuery.data?.createdAt ?? selected.createdAt)}</p>
                    {detailQuery.data?.reviewDate ? <p>วันที่ตรวจสอบ: {formatDateTime(detailQuery.data.reviewDate)}</p> : null}
                    {(detailQuery.data?.reviewComment ?? selected.reviewComment) ? (
                      <p>ความเห็น: {detailQuery.data?.reviewComment ?? selected.reviewComment}</p>
                    ) : null}
                    {(detailQuery.data?.projectCode ?? selected.projectCode) ? (
                      <p>รหัสโครงงาน: {detailQuery.data?.projectCode ?? selected.projectCode}</p>
                    ) : null}
                    {(detailQuery.data?.projectTitle ?? selected.projectTitle) ? (
                      <p>ชื่อโครงงาน: {detailQuery.data?.projectTitle ?? selected.projectTitle}</p>
                    ) : null}
                  </section>
                )}
              </div>
              <div className={styles.drawerFooter}>
                <div className={styles.buttonRow}>
                  <button type="button" className={styles.iconButton} onClick={() => previewMutation.mutate(selected.id)} disabled={isFileBusy} title="ดูไฟล์">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                  <button type="button" className={styles.iconButton} onClick={() => downloadMutation.mutate(selected.id)} disabled={isFileBusy} title="ดาวน์โหลด">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                </div>
                {canSelectRow(selected) ? (
                  <div className={styles.buttonRow}>
                    <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => handleSingleReview(selected)} disabled={isBulkBusy}>ส่งต่อ</button>
                    <button type="button" className={`${styles.button} ${styles.buttonDanger}`} onClick={() => handleSingleReject(selected.id)} disabled={isBulkBusy}>ปฏิเสธ</button>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        ) : null}

        {/* Reject Modal */}
        {rejectModalOpen ? (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3 className={styles.modalTitle}>ระบุเหตุผลการปฏิเสธ</h3>
              <p className={styles.subText}>ระบบจะปฏิเสธเอกสาร {rejectIds.length} รายการ</p>
              <textarea className={styles.textarea} rows={5} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="กรอกเหตุผลอย่างน้อย 10 ตัวอักษร" />
              <div className={styles.buttonRow}>
                <button type="button" className={styles.button} onClick={() => setRejectModalOpen(false)} disabled={isBulkBusy}>ยกเลิก</button>
                <button type="button" className={`${styles.button} ${styles.buttonDanger}`} onClick={submitReject} disabled={isBulkBusy}>ยืนยันปฏิเสธ</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RoleGuard>
  );
}
