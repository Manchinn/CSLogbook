"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DEFENSE_TYPE_THESIS,
  type DefenseQueueRecord,
  type DefenseType,
} from "@/lib/services/adminDefenseQueueService";
import {
  useAdminDefenseAcademicYears,
  useAdminDefenseDetail,
  useAdminDefenseQueue,
  useAdminDefenseQueueMutations,
} from "@/hooks/useAdminDefenseQueue";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import styles from "@/styles/shared/admin-queue.module.css";
import local from "./DefenseStaffQueuePage.local.module.css";

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

function statusLabel(status: string) {
  if (status === "advisor_in_review") return "รออาจารย์อนุมัติครบ";
  if (status === "advisor_approved") return "รอเจ้าหน้าที่ตรวจสอบ";
  if (status === "staff_verified") return "ตรวจสอบแล้ว";
  if (status === "scheduled") return "นัดสอบแล้ว (legacy)";
  if (status === "completed") return "บันทึกผลสอบแล้ว";
  return status || "-";
}

function approvalStatusLabel(status: string | null | undefined) {
  const normalized = (status || "").toLowerCase();
  if (normalized === "approved") return "อนุมัติแล้ว";
  if (normalized === "rejected") return "ปฏิเสธ";
  if (normalized === "pending") return "รอพิจารณา";
  return status || "รอพิจารณา";
}

function teacherRoleLabel(role: string | null | undefined) {
  if (role === "advisor") return "อาจารย์ที่ปรึกษาหลัก";
  if (role === "co_advisor") return "อาจารย์ที่ปรึกษาร่วม";
  return "อาจารย์ที่ปรึกษา";
}

function systemTestStatusMeta(status: string | null | undefined) {
  if (status === "pending_advisor") return { text: "รออาจารย์อนุมัติ", className: styles.tagWarning };
  if (status === "advisor_rejected") return { text: "อาจารย์ส่งกลับ", className: styles.tagDanger };
  if (status === "pending_staff") return { text: "รอเจ้าหน้าที่ตรวจสอบ", className: styles.tagWarning };
  if (status === "staff_rejected") return { text: "เจ้าหน้าที่ส่งกลับ", className: styles.tagDanger };
  if (status === "staff_approved") return { text: "อนุมัติครบ (รอหลักฐาน)", className: styles.tagOk };
  return { text: "ยังไม่ยื่นคำขอ", className: styles.tagStatus };
}

type DefenseStaffQueuePageProps = {
  defenseType: DefenseType;
};

export function DefenseStaffQueuePage({ defenseType }: DefenseStaffQueuePageProps) {
  const { user } = useAuth();
  const { data: academicYearOptions = [] } = useAcademicYears();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");

  // Default to active academic year once loaded
  useEffect(() => {
    if (!academicYear && academicYearOptions.length > 0) {
      const active = academicYearOptions.find((y) => y.status === "active");
      if (active) setAcademicYear(String(active.academicYear));
    }
  }, [academicYear, academicYearOptions]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<DefenseQueueRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyNote, setVerifyNote] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning"; message: string } | null>(null);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkVerifyOpen, setBulkVerifyOpen] = useState(false);
  const [bulkVerifyNote, setBulkVerifyNote] = useState("");
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");

  const isStaff = Boolean(user && (user.role === "admin" || (user.role === "teacher" && user.teacherType === "support")));
  const canExportProject1 = Boolean(user && user.role === "teacher" && user.canExportProject1);
  const canExportThesis = Boolean(
    user &&
      user.role === "teacher" &&
      ((user as { canExportThesis?: boolean }).canExportThesis ?? user.canExportProject1),
  );
  const canExport = isStaff || (defenseType === DEFENSE_TYPE_THESIS ? canExportThesis : canExportProject1);
  const canView = isStaff || canExport;

  const filters = useMemo(
    () => ({
      status: status === "all" ? "advisor_approved,staff_verified,scheduled,completed" : status,
      search: search.trim() || undefined,
      academicYear: academicYear || undefined,
      semester: semester || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [academicYear, page, pageSize, search, semester, status],
  );

  const queueQuery = useAdminDefenseQueue(defenseType, filters, canView);
  const yearsQuery = useAdminDefenseAcademicYears(canView);
  const detailQuery = useAdminDefenseDetail(selected?.projectId ?? null, defenseType, drawerOpen && canView);
  const { verifyRequest, rejectRequest, exportQueue } = useAdminDefenseQueueMutations(defenseType);

  const rows = useMemo(() => queueQuery.data?.rows ?? [], [queueQuery.data?.rows]);
  const total = queueQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isBusy = verifyRequest.isPending || rejectRequest.isPending || exportQueue.isPending;

  function canSelectRow(row: DefenseQueueRecord): boolean {
    return row.status === "advisor_approved";
  }

  const onToggleSelected = (requestId: number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, requestId] : prev.filter((id) => id !== requestId)));
  };

  const onToggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? rows.filter(canSelectRow).map((r) => r.requestId) : []);
  };

  const allSelectableRows = rows.filter(canSelectRow);
  const isAllSelected = allSelectableRows.length > 0 && selectedIds.length === allSelectableRows.length;
  const selectedCount = selectedIds.length;

  const stats = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.total += 1;
          if (row.status === "advisor_approved") acc.waiting += 1;
          if (row.status === "staff_verified") acc.verified += 1;
          if (row.status === "completed") acc.completed += 1;
          return acc;
        },
        { total: 0, waiting: 0, verified: 0, completed: 0 },
      ),
    [rows],
  );
  const activeRecord = useMemo(() => detailQuery.data ?? selected, [detailQuery.data, selected]);
  const perStudentMetrics = activeRecord?.meetingMetrics?.perStudent ?? [];

  const pageTitle = defenseType === DEFENSE_TYPE_THESIS ? "คำร้องขอสอบปริญญานิพนธ์ (คพ.03)" : "คำร้องขอสอบโครงงานพิเศษ 1 (คพ.02)";
  const pageSubtitle =
    defenseType === DEFENSE_TYPE_THESIS
      ? "ติดตามคำขอสอบปริญญานิพนธ์ ตรวจสอบรายการ และส่งออกชุดข้อมูลสำหรับนัดสอบ"
      : "ติดตามคำขอสอบ คพ.02 ตรวจสอบรายการ และส่งออกชุดข้อมูลสำหรับนัดสอบ";

  const submitBulkVerify = async () => {
    if (!selectedCount) return;
    const targets = rows.filter((r) => selectedIds.includes(r.requestId));
    const results = await Promise.allSettled(
      targets.map((r) =>
        verifyRequest.mutateAsync({ projectId: r.projectId, defenseType, note: bulkVerifyNote }),
      ),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = results.length - failed;
    setBulkVerifyOpen(false);
    setSelectedIds([]);
    setBulkVerifyNote("");
    setFeedback(
      failed === 0
        ? { tone: "success", message: `ตรวจสอบแล้ว ${succeeded} รายการ` }
        : { tone: "warning", message: `สำเร็จ ${succeeded} รายการ / ล้มเหลว ${failed} รายการ` },
    );
  };

  const submitBulkReject = async () => {
    if (!selectedCount || bulkRejectReason.trim().length < 10) return;
    const targets = rows.filter((r) => selectedIds.includes(r.requestId));
    const results = await Promise.allSettled(
      targets.map((r) =>
        rejectRequest.mutateAsync({ projectId: r.projectId, defenseType, reason: bulkRejectReason }),
      ),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = results.length - failed;
    setBulkRejectOpen(false);
    setSelectedIds([]);
    setBulkRejectReason("");
    setFeedback(
      failed === 0
        ? { tone: "success", message: `ปฏิเสธแล้ว ${succeeded} รายการ` }
        : { tone: "warning", message: `สำเร็จ ${succeeded} รายการ / ล้มเหลว ${failed} รายการ` },
    );
  };

  const openDrawer = (row: DefenseQueueRecord) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelected(null);
  };

  const openVerify = (row: DefenseQueueRecord) => {
    setSelected(row);
    setVerifyNote("");
    setVerifyModalOpen(true);
  };

  const submitVerify = async () => {
    if (!selected?.projectId) return;
    try {
      await verifyRequest.mutateAsync({
        projectId: selected.projectId,
        defenseType,
        note: verifyNote,
      });
      setFeedback({ tone: "success", message: "บันทึกการตรวจสอบเรียบร้อยแล้ว" });
      setVerifyModalOpen(false);
    } catch (error) {
      setFeedback({
        tone: "warning",
        message: error instanceof Error ? error.message : "ไม่สามารถบันทึกการตรวจสอบได้",
      });
    }
  };

  const handleExport = async () => {
    try {
      await exportQueue.mutateAsync({
        status: status === "all" ? undefined : status,
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
          {isStaff ? (
            <>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                disabled={!selectedCount || isBusy}
                onClick={() => {
                  setBulkVerifyNote("");
                  setBulkVerifyOpen(true);
                }}
              >
                ตรวจสอบแล้ว ({selectedCount})
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonDanger}`}
                disabled={!selectedCount || isBusy}
                onClick={() => {
                  setBulkRejectReason("");
                  setBulkRejectOpen(true);
                }}
              >
                ปฏิเสธ ({selectedCount})
              </button>
            </>
          ) : null}
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setStatus("all");
              setSearch("");
              const active = academicYearOptions.find((y) => y.status === "active");
              setAcademicYear(active ? String(active.academicYear) : "");
              setSemester("");
              setPage(1);
              setSelectedIds([]);
            }}
          >
            รีเซ็ตตัวกรอง
          </button>
          <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => void handleExport()} disabled={!canExport || isBusy}>
            ส่งออกข้อมูล
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
            <p className={styles.statValue}>{stats.waiting}</p>
          </div>
          <div className={styles.statItem}>
            <p className={styles.statLabel}>ตรวจสอบแล้ว</p>
            <p className={styles.statValue}>{stats.verified}</p>
          </div>
          <div className={styles.statItem}>
            <p className={styles.statLabel}>บันทึกผลสอบแล้ว</p>
            <p className={styles.statValue}>{stats.completed}</p>
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
              setSelectedIds([]);
            }}
          >
            <option value="all">ทุกสถานะ</option>
            <option value="advisor_approved">รอเจ้าหน้าที่ตรวจสอบ</option>
            <option value="staff_verified">ตรวจสอบแล้ว</option>
            <option value="completed">บันทึกผลสอบแล้ว</option>
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
              setSelectedIds([]);
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
              setSelectedIds([]);
            }}
          />
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {isStaff ? (
                  <th>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      disabled={allSelectableRows.length === 0}
                      onChange={(e) => onToggleSelectAll(e.target.checked)}
                      aria-label="เลือกทั้งหมด"
                    />
                  </th>
                ) : null}
                <th>โครงงาน</th>
                <th>สมาชิก</th>
                <th>สถานะ</th>
                <th>ยื่นคำขอ / อัปเดต</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {queueQuery.isLoading ? (
                <tr>
                  <td colSpan={isStaff ? 6 : 5}>
                    <p className={styles.empty}>กำลังโหลดข้อมูล...</p>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={isStaff ? 6 : 5}>
                    <p className={styles.empty}>ไม่พบคำขอสอบที่ตรงตามเงื่อนไข</p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.requestId}>
                    {isStaff ? (
                      <td>
                        {canSelectRow(row) ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.requestId)}
                            onChange={(e) => onToggleSelected(row.requestId, e.target.checked)}
                            aria-label={`เลือก ${row.project.projectNameTh || row.project.projectNameEn || row.requestId}`}
                          />
                        ) : null}
                      </td>
                    ) : null}
                    <td>
                      <p className={styles.name}>{row.project.projectNameTh || row.project.projectNameEn || "-"}</p>
                      <p className={styles.subText}>#{row.projectId} {row.project.projectCode ? `| ${row.project.projectCode}` : ""}</p>
                    </td>
                    <td>
                      {row.project.members.length ? (
                        row.project.members.map((member) => (
                          <p key={`${row.requestId}-${member.studentId ?? member.studentCode}`} className={styles.subText}>
                            {member.studentCode || "-"} {member.name || "-"}
                          </p>
                        ))
                      ) : (
                        <p className={styles.subText}>-</p>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.tag} ${styles.tagStatus}`}>{statusLabel(row.status)}</span>
                      {row.deadlineTag ? (
                        <span className={`${styles.tag} ${styles.tagLate}`} title={row.deadlineTag.tooltip || ""}>
                          {row.deadlineTag.text}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <p className={styles.subText}>ยื่นคำขอ: {formatDateTime(row.submittedAt)}</p>
                      <p className={styles.subText}>อนุมัติครบ: {formatDateTime(row.advisorApprovedAt)}</p>
                      <p className={styles.subText}>ตรวจสอบแล้ว: {formatDateTime(row.staffVerifiedAt)}</p>
                    </td>
                    <td>
                      <div className={styles.buttonRow}>
                        <button type="button" className={styles.button} onClick={() => openDrawer(row)}>
                          รายละเอียด
                        </button>
                        {isStaff ? (
                          <button
                            type="button"
                            className={`${styles.button} ${styles.buttonPrimary}`}
                            onClick={() => openVerify(row)}
                            disabled={row.status !== "advisor_approved" || isBusy}
                          >
                            ตรวจสอบแล้ว
                          </button>
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

      {queueQuery.isError ? <p className={styles.empty}>ไม่สามารถโหลดรายการคำขอสอบได้</p> : null}

      {drawerOpen && selected ? (
        <div className={styles.drawerOverlay}>
          <aside className={styles.drawer}>
            <header className={styles.drawerHeader}>
              <div>
                <p className={styles.drawerTitle}>รายละเอียดคำขอสอบ</p>
                <p className={styles.subText}>{activeRecord?.project.projectNameTh || activeRecord?.project.projectNameEn || "-"}</p>
              </div>
              <button type="button" className={styles.button} onClick={closeDrawer}>
                ปิด
              </button>
            </header>
            <div className={styles.drawerBody}>
              {detailQuery.isLoading ? <p className={styles.empty}>กำลังโหลดรายละเอียด...</p> : null}
              <section className={styles.detailSection}>
                <h3 className={styles.detailTitle}>ภาพรวมคำขอ</h3>
                <p>สถานะคำขอ: {statusLabel(activeRecord?.status || "")}</p>
                <p>วันที่ยื่นคำขอ: {formatDateTime(activeRecord?.submittedAt)}</p>
                <p>วันที่จากฟอร์มคำขอ: {formatDateTime(activeRecord?.requestDate)}</p>
                {defenseType === DEFENSE_TYPE_THESIS ? (
                  <p>วันที่คาดว่าจะสอบ: {formatDateTime(activeRecord?.intendedDefenseDate)}</p>
                ) : null}
                <p>หมายเหตุจากคำขอ: {activeRecord?.additionalNotes || "-"}</p>
                <p>หมายเหตุเจ้าหน้าที่: {activeRecord?.staffVerificationNote || "-"}</p>
                <p>ผู้ตรวจล่าสุด: {activeRecord?.staffVerifiedByName || "-"}</p>
              </section>
              <section className={styles.detailSection}>
                <h3 className={styles.detailTitle}>ข้อมูลโครงงาน</h3>
                <p>ชื่อโครงงาน: {activeRecord?.project.projectNameTh || activeRecord?.project.projectNameEn || "-"}</p>
                <p>อาจารย์ที่ปรึกษา: {activeRecord?.project.advisor?.name || "-"}</p>
                <p>อาจารย์ร่วม: {activeRecord?.project.coAdvisor?.name || "-"}</p>
                <p>สถานที่สอบ: {activeRecord?.defenseLocation || "ติดตามผ่านปฏิทินภาควิชา"}</p>
                <p>หมายเหตุนัดสอบ: {activeRecord?.defenseNote || "-"}</p>
                {activeRecord?.additionalMaterials?.length ? (
                  <>
                    <p className={styles.subText}>เอกสารแนบจากคำขอ:</p>
                    <ul className={local.list}>
                      {activeRecord.additionalMaterials.map((item, index) => (
                        <li key={`${item.label}-${item.value}-${index}`}>
                          {(item.label || "เอกสาร")} {item.value || "-"}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </section>
              <section className={styles.detailSection}>
                <h3 className={styles.detailTitle}>Meeting Metrics</h3>
                <p>ต้องมีขั้นต่ำ: {activeRecord?.meetingMetrics?.requiredApprovedLogs ?? "-"}</p>
                <p>จำนวน meeting ทั้งหมด: {activeRecord?.meetingMetrics?.totalMeetings ?? "-"}</p>
                <p>อนุมัติแล้ว: {activeRecord?.meetingMetrics?.totalApprovedLogs ?? "-"}</p>
                <p>อนุมัติล่าสุด: {formatDateTime(activeRecord?.meetingMetrics?.lastApprovedLogAt ?? null)}</p>
                {perStudentMetrics.length ? (
                  <>
                    <p className={styles.subText}>รายละเอียดต่อสมาชิก:</p>
                    <ul className={local.list}>
                      {perStudentMetrics.map((item, index) => {
                        const members = activeRecord?.project.members ?? [];
                        const memberName =
                          members.find((member) => member.studentId === item.studentId)?.name || "-";
                        return (
                          <li key={`${item.studentId}-${index}`}>
                            {memberName}: อนุมัติ {item.approvedLogs ?? 0} ครั้ง / เข้าพบ {item.attendedMeetings ?? 0} ครั้ง
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : null}
              </section>
              <section className={styles.detailSection}>
                <h3 className={styles.detailTitle}>Timeline การพิจารณา</h3>
                <ul className={local.timeline}>
                  <li>
                    <p className={local.timelineTitle}>ส่งคำขอ</p>
                    <p className={styles.subText}>{formatDateTime(activeRecord?.submittedAt)}</p>
                  </li>
                  {(activeRecord?.advisorApprovals ?? []).map((approval, index) => (
                    <li key={`${approval.approvalId ?? index}-${approval.teacher?.teacherId ?? index}`}>
                      <p className={local.timelineTitle}>{teacherRoleLabel(approval.teacherRole)}</p>
                      <p className={styles.subText}>
                        {approval.teacher?.name || "-"}: {approvalStatusLabel(approval.status)}
                      </p>
                      <p className={styles.subText}>เวลา: {formatDateTime(approval.approvedAt)}</p>
                      {approval.note ? <p className={styles.subText}>หมายเหตุ: {approval.note}</p> : null}
                    </li>
                  ))}
                  <li>
                    <p className={local.timelineTitle}>เจ้าหน้าที่ตรวจสอบ</p>
                    <p className={styles.subText}>{formatDateTime(activeRecord?.staffVerifiedAt)}</p>
                    <p className={styles.subText}>ผู้ตรวจ: {activeRecord?.staffVerifiedByName || "-"}</p>
                  </li>
                </ul>
              </section>
              {defenseType === DEFENSE_TYPE_THESIS ? (
                <section className={styles.detailSection}>
                  <h3 className={styles.detailTitle}>System Test Snapshot</h3>
                  <span className={`${styles.tag} ${systemTestStatusMeta(activeRecord?.thesisSystemTestSnapshot?.status).className}`}>
                    {systemTestStatusMeta(activeRecord?.thesisSystemTestSnapshot?.status).text}
                  </span>
                  <p>ช่วงทดสอบ: {formatDateTime(activeRecord?.thesisSystemTestSnapshot?.testStartDate)} - {formatDateTime(activeRecord?.thesisSystemTestSnapshot?.testDueDate)}</p>
                  <p>อนุมัติล่าสุด: {formatDateTime(activeRecord?.thesisSystemTestSnapshot?.staffDecidedAt)}</p>
                  <p>อัปโหลดหลักฐาน: {formatDateTime(activeRecord?.thesisSystemTestSnapshot?.evidenceSubmittedAt)}</p>
                  {activeRecord?.thesisSystemTestSnapshot?.evidence?.url ? (
                    <a
                      className={styles.link}
                      href={activeRecord.thesisSystemTestSnapshot.evidence.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      เปิดไฟล์หลักฐาน {activeRecord.thesisSystemTestSnapshot.evidence.name ? `(${activeRecord.thesisSystemTestSnapshot.evidence.name})` : ""}
                    </a>
                  ) : (
                    <p className={styles.subText}>ยังไม่มีไฟล์หลักฐาน</p>
                  )}
                </section>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      {verifyModalOpen && selected ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>ยืนยันการตรวจสอบคำขอ</h3>
            <p className={styles.subText}>{selected.project.projectNameTh || selected.project.projectNameEn || "-"}</p>
            <label className={styles.field}>
              <span>หมายเหตุถึงนักศึกษา (ไม่บังคับ)</span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={verifyNote}
                onChange={(event) => setVerifyNote(event.target.value)}
                placeholder="ระบุหมายเหตุเพิ่มเติม"
              />
            </label>
            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.button}
                onClick={() => {
                  if (verifyRequest.isPending) return;
                  setVerifyModalOpen(false);
                }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => void submitVerify()}
                disabled={verifyRequest.isPending}
              >
                {verifyRequest.isPending ? "กำลังบันทึก..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bulkVerifyOpen ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>ยืนยันการตรวจสอบ ({selectedCount} รายการ)</h3>
            <p className={styles.subText}>รายการที่เลือกจะถูกเปลี่ยนสถานะเป็น "ตรวจสอบแล้ว"</p>
            <label className={styles.field}>
              <span>หมายเหตุถึงนักศึกษา (ไม่บังคับ)</span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={bulkVerifyNote}
                onChange={(event) => setBulkVerifyNote(event.target.value)}
                placeholder="ระบุหมายเหตุเพิ่มเติม"
              />
            </label>
            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.button}
                disabled={verifyRequest.isPending}
                onClick={() => setBulkVerifyOpen(false)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => void submitBulkVerify()}
                disabled={verifyRequest.isPending}
              >
                {verifyRequest.isPending ? "กำลังบันทึก..." : `ยืนยัน ${selectedCount} รายการ`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bulkRejectOpen ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>ปฏิเสธคำขอ ({selectedCount} รายการ)</h3>
            <p className={styles.subText}>รายการที่เลือกจะถูกส่งกลับไปสถานะ "รออาจารย์อนุมัติ"</p>
            <label className={styles.field}>
              <span>เหตุผลการปฏิเสธ (บังคับ ขั้นต่ำ 10 ตัวอักษร)</span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={bulkRejectReason}
                onChange={(event) => setBulkRejectReason(event.target.value)}
                placeholder="ระบุเหตุผลการปฏิเสธ"
              />
            </label>
            {bulkRejectReason.length > 0 && bulkRejectReason.trim().length < 10 ? (
              <p className={styles.fieldError}>กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร</p>
            ) : null}
            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.button}
                disabled={rejectRequest.isPending}
                onClick={() => setBulkRejectOpen(false)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonDanger}`}
                onClick={() => void submitBulkReject()}
                disabled={rejectRequest.isPending || bulkRejectReason.trim().length < 10}
              >
                {rejectRequest.isPending ? "กำลังบันทึก..." : `ปฏิเสธ ${selectedCount} รายการ`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
