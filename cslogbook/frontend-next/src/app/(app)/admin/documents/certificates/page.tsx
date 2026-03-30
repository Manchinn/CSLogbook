"use client";

import { useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAdminInternshipAcademicYears } from "@/hooks/useAdminInternshipDocuments";
import {
  useAdminInternshipCertificateDetail,
  useAdminInternshipCertificateMutations,
  useAdminInternshipCertificates,
  useAdminInternshipLogbookSummary,
} from "@/hooks/useAdminInternshipCertificates";
import type { AdminCertificateRequest } from "@/lib/services/adminInternshipCertificatesService";
import { labelStatus } from "@/lib/utils/statusLabels";
import btn from "@/styles/shared/buttons.module.css";
import responsive from "@/styles/shared/responsive.module.css";
import styles from "@/styles/shared/admin-queue.module.css";

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

function generateCertificateNumber() {
  const now = new Date();
  const buddhistYear = now.getFullYear() + 543;
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 9999)).padStart(4, "0");
  return `ว ${buddhistYear}/${month}/${random}`;
}

export default function AdminInternshipCertificatesPage() {
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<AdminCertificateRequest | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [actionRequestId, setActionRequestId] = useState<number | null>(null);
  const [certificateNumber, setCertificateNumber] = useState(generateCertificateNumber());
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [logbookModalOpen, setLogbookModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning"; message: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
  const [bulkApproveIds, setBulkApproveIds] = useState<number[]>([]);
  const [certNumbers, setCertNumbers] = useState<Record<number, string>>({});
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");

  const filters = useMemo(
    () => ({
      status: status || undefined,
      academicYear: academicYear || undefined,
      semester: semester || undefined,
      page,
      limit: pageSize,
    }),
    [academicYear, page, pageSize, semester, status],
  );

  const certificatesQuery = useAdminInternshipCertificates(filters);
  const academicYearsQuery = useAdminInternshipAcademicYears();
  const detailQuery = useAdminInternshipCertificateDetail(selected?.id ?? null, drawerOpen);
  const detail = detailQuery.data;
  const logbookSummaryQuery = useAdminInternshipLogbookSummary(
    detail?.internship?.internshipId ?? null,
    Boolean(logbookModalOpen && detail?.internship?.internshipId),
  );
  const { approveRequest, rejectRequest, downloadRequest, exportMutation } = useAdminInternshipCertificateMutations();

  const rows = useMemo(() => certificatesQuery.data?.rows ?? [], [certificatesQuery.data?.rows]);
  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) => {
      const text = [row.student.fullName, row.student.studentCode, row.internship.companyName].join(" ").toLowerCase();
      return text.includes(keyword);
    });
  }, [rows, search]);

  const total = certificatesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const stats = useMemo(() => {
    const totalCount = rows.length;
    return {
      total: totalCount,
      pending: rows.filter((row) => row.status === "pending").length,
      approved: rows.filter((row) => row.status === "approved").length,
      rejected: rows.filter((row) => row.status === "rejected").length,
    };
  }, [rows]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelected(null);
  };

  const openDetail = (row: AdminCertificateRequest) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  const submitApprove = async (requestId: number) => {
    try {
      await approveRequest.mutateAsync({ requestId, certificateNumber });
      setFeedback({ tone: "success", message: `อนุมัติคำขอเรียบร้อยแล้ว (${certificateNumber})` });
      setActionModalOpen(false);
      closeDrawer();
    } catch (error) {
      setFeedback({
        tone: "warning",
        message: error instanceof Error ? error.message : "ไม่สามารถอนุมัติคำขอได้",
      });
    }
  };

  const submitReject = async (requestId: number) => {
    if (!rejectRemarks.trim()) {
      setFeedback({ tone: "warning", message: "กรุณาระบุเหตุผลการปฏิเสธ" });
      return;
    }
    try {
      await rejectRequest.mutateAsync({ requestId, remarks: rejectRemarks.trim() });
      setFeedback({ tone: "success", message: "ปฏิเสธคำขอเรียบร้อยแล้ว" });
      setActionModalOpen(false);
      closeDrawer();
    } catch (error) {
      setFeedback({
        tone: "warning",
        message: error instanceof Error ? error.message : "ไม่สามารถปฏิเสธคำขอได้",
      });
    }
  };

  const openApproveModal = (requestId: number) => {
    setActionType("approve");
    setActionRequestId(requestId);
    setCertificateNumber(generateCertificateNumber());
    setRejectRemarks("");
    setActionModalOpen(true);
  };

  const openRejectModal = (requestId: number) => {
    setActionType("reject");
    setActionRequestId(requestId);
    setRejectRemarks("");
    setActionModalOpen(true);
  };

  const handleDownload = async (requestId: number) => {
    try {
      await downloadRequest.mutateAsync({ requestId });
    } catch (error) {
      setFeedback({
        tone: "warning",
        message: error instanceof Error ? error.message : "ไม่สามารถดาวน์โหลดไฟล์หนังสือรับรองได้",
      });
    }
  };

  function canSelectRow(row: AdminCertificateRequest): boolean {
    return row.status === "pending";
  }

  const pendingInFiltered = filteredRows.filter(canSelectRow);
  const allPendingSelected =
    pendingInFiltered.length > 0 && pendingInFiltered.every((r) => selectedIds.includes(r.id));

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingInFiltered.map((r) => r.id));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkApprove = () => {
    const initial: Record<number, string> = {};
    const now = new Date();
    const buddhistYear = now.getFullYear() + 543;
    const month = String(now.getMonth() + 1).padStart(2, "0");
    selectedIds.forEach((id) => {
      const rand = String(Math.floor(1000 + Math.random() * 9000));
      initial[id] = `ว ${buddhistYear}/${month}/${rand}`;
    });
    setCertNumbers(initial);
    setBulkApproveIds(selectedIds);
    setBulkApproveOpen(true);
  };

  const submitBulkApprove = async () => {
    const allFilled = bulkApproveIds.every((id) => (certNumbers[id] ?? "").trim() !== "");
    if (!allFilled) {
      setFeedback({ tone: "warning", message: "กรุณากรอกเลขที่ใบรับรองให้ครบทุกรายการ" });
      return;
    }
    const results = await Promise.allSettled(
      bulkApproveIds.map((id) =>
        approveRequest.mutateAsync({ requestId: id, certificateNumber: certNumbers[id].trim() }),
      ),
    );
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    setBulkApproveOpen(false);
    setSelectedIds([]);
    setFeedback({
      tone: failed === 0 ? "success" : "warning",
      message: `อนุมัติสำเร็จ ${succeeded} รายการ${failed > 0 ? ` / ล้มเหลว ${failed} รายการ` : ""}`,
    });
  };

  const submitBulkReject = async () => {
    if (!bulkRejectReason.trim()) {
      setFeedback({ tone: "warning", message: "กรุณาระบุเหตุผลการปฏิเสธ" });
      return;
    }
    const results = await Promise.allSettled(
      selectedIds.map((id) =>
        rejectRequest.mutateAsync({ requestId: id, remarks: bulkRejectReason.trim() }),
      ),
    );
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    setBulkRejectOpen(false);
    setBulkRejectReason("");
    setSelectedIds([]);
    setFeedback({
      tone: failed === 0 ? "success" : "warning",
      message: `ปฏิเสธสำเร็จ ${succeeded} รายการ${failed > 0 ? ` / ล้มเหลว ${failed} รายการ` : ""}`,
    });
  };

  const isActionPending = approveRequest.isPending || rejectRequest.isPending || downloadRequest.isPending;
  const breakdownRows = detail?.evaluationDetail?.breakdown ?? [];
  const breakdownTotalScore = breakdownRows.reduce((acc, row) => acc + (typeof row.score === "number" ? row.score : 0), 0);
  const breakdownTotalMax = breakdownRows.reduce((acc, row) => acc + (typeof row.max === "number" ? row.max : 0), 0);

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>จัดการหนังสือรับรองการฝึกงาน</h1>
            <p className={styles.subtitle}>จัดการคำร้องหนังสือรับรองการฝึกงาน ตรวจสอบและอนุมัติตามลำดับ</p>
          </div>
          <div className={btn.buttonRow}>
            <button
              type="button"
              className={btn.button}
              onClick={() => {
                setSearch("");
                setStatus("pending");
                setAcademicYear("");
                setSemester("");
                setPage(1);
              }}
            >
              รีเซ็ตตัวกรอง
            </button>
            <button
              type="button"
              className={`${btn.button} ${btn.buttonPrimary}`}
              onClick={() =>
                void exportMutation.mutateAsync({
                  status: status || undefined,
                  search: search.trim() || undefined,
                  academicYear: academicYear || undefined,
                  semester: semester || undefined,
                })
              }
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? "กำลังส่งออก..." : "ส่งออก Excel"}
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
              <p className={styles.statLabel}>คำขอทั้งหมด (หน้านี้)</p>
              <p className={styles.statValue}>{stats.total}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>รอดำเนินการ</p>
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
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.filters}>
            <input
              className={styles.input}
              placeholder="ค้นหา ชื่อ/รหัส/บริษัท"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ปฏิเสธ</option>
            </select>
            <select
              className={styles.select}
              value={academicYear}
              onChange={(event) => {
                setAcademicYear(event.target.value);
                setPage(1);
                setSelectedIds([]);
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
                setSelectedIds([]);
              }}
            >
              <option value="">ทุกภาคเรียน</option>
              <option value="1">ภาคเรียนที่ 1</option>
              <option value="2">ภาคเรียนที่ 2</option>
              <option value="3">ภาคฤดูร้อน</option>
            </select>
          </div>
        </section>

        <section className={styles.card}>
          {selectedIds.length > 0 ? (
            <div className={`${btn.buttonRow} ${styles.bulkActionBar}`}>
              <span className={styles.subText}>{selectedIds.length} รายการที่เลือก</span>
              <button
                type="button"
                className={`${btn.button} ${btn.buttonPrimary}`}
                onClick={handleBulkApprove}
                disabled={isActionPending}
              >
                อนุมัติ ({selectedIds.length})
              </button>
              <button
                type="button"
                className={`${btn.button} ${btn.buttonDanger}`}
                onClick={() => setBulkRejectOpen(true)}
                disabled={isActionPending}
              >
                ปฏิเสธ ({selectedIds.length})
              </button>
              <button
                type="button"
                className={btn.button}
                onClick={() => setSelectedIds([])}
              >
                ยกเลิกการเลือก
              </button>
            </div>
          ) : null}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkboxCol}>
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      onChange={toggleSelectAll}
                      disabled={pendingInFiltered.length === 0}
                      aria-label="เลือกทั้งหมด"
                    />
                  </th>
                  <th>รหัสนักศึกษา</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th className={responsive.hideOnMobile}>บริษัท</th>
                  <th className={responsive.hideOnMobile}>วันที่ขอ</th>
                  <th>สถานะ</th>
                  <th>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length ? (
                  filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {canSelectRow(row) ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.id)}
                            onChange={() => toggleSelectRow(row.id)}
                            aria-label={`เลือก ${row.student.fullName}`}
                          />
                        ) : null}
                      </td>
                      <td>{row.student.studentCode || "-"}</td>
                      <td>{row.student.fullName || "-"}</td>
                      <td className={responsive.hideOnMobile}>{row.internship.companyName || "-"}</td>
                      <td className={responsive.hideOnMobile}>{formatDateTime(row.requestDate)}</td>
                      <td>
                        <span className={styles.tag}>{labelStatus(row.status)}</span>
                      </td>
                      <td>
                        <div className={btn.buttonRow}>
                          <button type="button" className={btn.button} onClick={() => openDetail(row)}>
                            รายละเอียด
                          </button>
                          {row.status === "pending" ? (
                            <>
                              <button
                                type="button"
                                className={`${btn.button} ${btn.buttonPrimary}`}
                                onClick={() => openApproveModal(row.id)}
                                disabled={isActionPending}
                              >
                                อนุมัติ
                              </button>
                              <button
                                type="button"
                                className={`${btn.button} ${btn.buttonDanger}`}
                                onClick={() => openRejectModal(row.id)}
                                disabled={isActionPending}
                              >
                                ปฏิเสธ
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <p className={styles.empty}>ไม่พบคำขอหนังสือรับรองที่ตรงตามเงื่อนไข</p>
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

        {certificatesQuery.isLoading ? <p className={styles.empty}>กำลังโหลดข้อมูลคำขอ...</p> : null}
        {certificatesQuery.isError ? <p className={styles.empty}>ไม่สามารถโหลดรายการคำขอได้</p> : null}

        {drawerOpen ? (
          <div className={styles.drawerOverlay}>
            <aside className={styles.drawer}>
              <header className={styles.drawerHeader}>
                <div>
                  <p className={styles.drawerTitle}>รายละเอียดคำขอหนังสือรับรอง</p>
                  <p className={styles.subText}>
                    {selected?.student.fullName || "-"} ({selected?.student.studentCode || "-"})
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
                      <h3 className={styles.detailTitle}>ข้อมูลคำขอ</h3>
                      <p>สถานะ: {labelStatus(detail.status)}</p>
                      <p>วันที่ยื่น: {formatDateTime(detail.requestDate)}</p>
                      <p>บริษัท: {detail.internship?.companyName || "-"}</p>
                      <p>ชั่วโมงฝึกงาน: {detail.internship?.totalHours ?? "-"}</p>
                      <p>หมายเหตุ: {detail.remarks || "-"}</p>
                    </section>
                    <section className={styles.detailSection}>
                      <h3 className={styles.detailTitle}>ข้อมูลการประเมิน</h3>
                      <p>ผู้ประเมิน: {detail.evaluationDetail?.evaluatorName || "-"}</p>
                      <p>
                        คะแนนรวม:{" "}
                        {typeof detail.evaluationDetail?.overallScore === "number"
                          ? `${detail.evaluationDetail.overallScore}/${detail.evaluationDetail?.fullScore ?? (breakdownTotalMax || "-")}`
                          : "-"}
                        {typeof detail.evaluationDetail?.passScore === "number"
                          ? ` (เกณฑ์ผ่าน: ${detail.evaluationDetail.passScore})`
                          : ""}
                      </p>
                      <p>อัปเดตล่าสุด: {formatDateTime(detail.evaluationDetail?.updatedAt)}</p>
                    </section>
                    {breakdownRows.length ? (
                      <section className={styles.detailSection}>
                        <h3 className={styles.detailTitle}>รายการประเมินรายหัวข้อ</h3>
                        <div className={styles.tableWrap}>
                          <table className={styles.table}>
                            <thead>
                              <tr>
                                <th>หมวด</th>
                                <th>หัวข้อ</th>
                                <th>คะแนน</th>
                              </tr>
                            </thead>
                            <tbody>
                              {breakdownRows.map((row, index) => (
                                <tr key={`${row.key ?? row.label ?? "row"}-${index}`}>
                                  <td>{row.categoryLabel || row.category || "-"}</td>
                                  <td>{row.label || "-"}</td>
                                  <td>
                                    {typeof row.score === "number"
                                      ? `${row.score}${typeof row.max === "number" ? `/${row.max}` : ""}`
                                      : "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className={styles.subText}>
                          รวมคะแนน: {breakdownTotalScore}
                          {breakdownTotalMax > 0 ? `/${breakdownTotalMax}` : ""}
                        </p>
                        <p>จุดเด่น: {detail.evaluationDetail?.strengths || "-"}</p>
                        <p>ควรพัฒนา: {detail.evaluationDetail?.weaknessesToImprove || "-"}</p>
                        <p>หมายเหตุเพิ่มเติม: {detail.evaluationDetail?.additionalComments || "-"}</p>
                      </section>
                    ) : null}
                    <div className={btn.buttonRow}>
                      {selected ? (
                        <button
                          type="button"
                          className={btn.button}
                          onClick={() => handleDownload(selected.id)}
                          disabled={isActionPending}
                        >
                          ดาวน์โหลดไฟล์
                        </button>
                      ) : null}
                      {detail?.internship?.internshipId ? (
                        <button
                          type="button"
                          className={btn.button}
                          onClick={() => setLogbookModalOpen(true)}
                        >
                          ดูสรุปบันทึกการฝึกงาน
                        </button>
                      ) : null}
                      {selected?.status === "pending" ? (
                        <>
                          <button
                            type="button"
                            className={`${btn.button} ${btn.buttonPrimary}`}
                            onClick={() => openApproveModal(selected.id)}
                            disabled={isActionPending}
                          >
                            อนุมัติ
                          </button>
                          <button
                            type="button"
                            className={`${btn.button} ${btn.buttonDanger}`}
                            onClick={() => openRejectModal(selected.id)}
                            disabled={isActionPending}
                          >
                            ปฏิเสธ
                          </button>
                        </>
                      ) : null}
                    </div>
                  </>
                ) : detailQuery.isError ? (
                  <p className={styles.empty}>ไม่สามารถโหลดรายละเอียดคำขอ</p>
                ) : null}
              </div>
            </aside>
          </div>
        ) : null}

        {actionModalOpen ? (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3 className={styles.modalTitle}>
                {actionType === "approve" ? "อนุมัติคำขอหนังสือรับรอง" : "ปฏิเสธคำขอหนังสือรับรอง"}
              </h3>
              {actionType === "approve" ? (
                <label className={styles.field}>
                  <span>เลขหนังสือรับรอง</span>
                  <input
                    className={styles.input}
                    value={certificateNumber}
                    onChange={(event) => setCertificateNumber(event.target.value)}
                  />
                </label>
              ) : (
                <label className={styles.field}>
                  <span>เหตุผลการปฏิเสธ</span>
                  <textarea
                    className={styles.textarea}
                    rows={5}
                    value={rejectRemarks}
                    onChange={(event) => setRejectRemarks(event.target.value)}
                    placeholder="ระบุเหตุผลการปฏิเสธ"
                  />
                </label>
              )}
              <div className={btn.buttonRow}>
                <button
                  type="button"
                  className={btn.button}
                  onClick={() => {
                    if (isActionPending) return;
                    setActionModalOpen(false);
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className={`${btn.button} ${actionType === "approve" ? btn.buttonPrimary : btn.buttonDanger}`}
                  disabled={isActionPending || !actionRequestId}
                  onClick={() => {
                    if (!actionRequestId) return;
                    if (actionType === "approve") {
                      void submitApprove(actionRequestId);
                    } else {
                      void submitReject(actionRequestId);
                    }
                  }}
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {logbookModalOpen ? (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>สรุปบันทึกการฝึกงาน</h3>
                <button type="button" className={styles.modalCloseBtn} onClick={() => setLogbookModalOpen(false)} aria-label="ปิด">
                  &times;
                </button>
              </div>
              {logbookSummaryQuery.isLoading ? <p className={styles.empty}>กำลังโหลดข้อมูล...</p> : null}
              {logbookSummaryQuery.isError ? <p className={styles.empty}>ไม่สามารถโหลดข้อมูลสรุปบันทึกได้</p> : null}
              {logbookSummaryQuery.data ? (
                <>
                  <section className={styles.detailSection}>
                    <h3 className={styles.detailTitle}>สรุปภาพรวม</h3>
                    <p>นักศึกษา: {logbookSummaryQuery.data.student?.fullName || "-"}</p>
                    <p>รหัสนักศึกษา: {logbookSummaryQuery.data.student?.studentCode || "-"}</p>
                    <p>บริษัท: {logbookSummaryQuery.data.internship?.companyName || "-"}</p>
                    <p>ช่วงฝึกงาน: {formatDateTime(logbookSummaryQuery.data.internship?.startDate)} - {formatDateTime(logbookSummaryQuery.data.internship?.endDate)}</p>
                    <p>จำนวนบันทึก: {logbookSummaryQuery.data.statistics?.totalEntries ?? "-"} วัน</p>
                    <p>
                      ชั่วโมงรวม:{" "}
                      {typeof logbookSummaryQuery.data.statistics?.totalHours === "number"
                        ? logbookSummaryQuery.data.statistics.totalHours.toLocaleString("th-TH", { maximumFractionDigits: 1 })
                        : "-"}{" "}
                      ชม.
                    </p>
                    <p>
                      ชั่วโมงอนุมัติ:{" "}
                      {typeof logbookSummaryQuery.data.statistics?.approvedHours === "number"
                        ? logbookSummaryQuery.data.statistics.approvedHours.toLocaleString("th-TH", { maximumFractionDigits: 1 })
                        : "-"}{" "}
                      ชม.
                    </p>
                  </section>
                  <section className={styles.detailSection}>
                    <h3 className={styles.detailTitle}>บทสะท้อนการเรียนรู้</h3>
                    <p>ผลการเรียนรู้: {logbookSummaryQuery.data.reflection?.learningOutcome || "-"}</p>
                    <p>สิ่งที่ได้เรียนรู้: {logbookSummaryQuery.data.reflection?.keyLearnings || "-"}</p>
                    <p>การนำไปประยุกต์ใช้: {logbookSummaryQuery.data.reflection?.futureApplication || "-"}</p>
                    <p>ข้อควรพัฒนา: {logbookSummaryQuery.data.reflection?.improvements || "-"}</p>
                  </section>
                </>
              ) : null}
              <div className={btn.buttonRow}>
                <button
                  type="button"
                  className={btn.button}
                  onClick={() => setLogbookModalOpen(false)}
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {bulkApproveOpen ? (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>อนุมัติหนังสือรับรอง ({bulkApproveIds.length} รายการ)</h3>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setBulkApproveOpen(false)}
                  aria-label="ปิด"
                >
                  &times;
                </button>
              </div>
              <div className={styles.reviewItemList}>
                {bulkApproveIds.map((id) => {
                  const row = rows.find((r) => r.id === id);
                  return (
                    <div key={id} className={styles.reviewItem}>
                      <span className={`${styles.subText} ${styles.reviewItemLabel}`}>
                        {row?.student.studentCode || "-"} {row?.student.fullName || "-"}
                      </span>
                      <input
                        className={`${styles.input} ${styles.reviewItemInput}`}
                        placeholder="เลขที่ใบรับรอง"
                        value={certNumbers[id] ?? ""}
                        onChange={(e) => setCertNumbers((prev) => ({ ...prev, [id]: e.target.value }))}
                      />
                    </div>
                  );
                })}
              </div>
              <div className={btn.buttonRow}>
                <button
                  type="button"
                  className={btn.button}
                  onClick={() => setBulkApproveOpen(false)}
                  disabled={isActionPending}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className={`${btn.button} ${btn.buttonPrimary}`}
                  onClick={() => void submitBulkApprove()}
                  disabled={isActionPending}
                >
                  ยืนยันอนุมัติทั้งหมด
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {bulkRejectOpen ? (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3 className={styles.modalTitle}>ปฏิเสธหนังสือรับรอง ({selectedIds.length} รายการ)</h3>
              <label className={styles.field}>
                <span>เหตุผลการปฏิเสธ (ใช้ร่วมกันทุกรายการ)</span>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={bulkRejectReason}
                  onChange={(e) => setBulkRejectReason(e.target.value)}
                  placeholder="ระบุเหตุผลการปฏิเสธ"
                />
              </label>
              <div className={btn.buttonRow}>
                <button
                  type="button"
                  className={btn.button}
                  onClick={() => {
                    setBulkRejectOpen(false);
                    setBulkRejectReason("");
                  }}
                  disabled={isActionPending}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className={`${btn.button} ${btn.buttonDanger}`}
                  onClick={() => void submitBulkReject()}
                  disabled={isActionPending}
                >
                  ยืนยันปฏิเสธทั้งหมด
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RoleGuard>
  );
}
