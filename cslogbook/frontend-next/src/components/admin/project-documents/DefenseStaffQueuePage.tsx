"use client";

import { useMemo, useState } from "react";
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

function statusLabel(status: string) {
  if (status === "advisor_in_review") return "รออาจารย์อนุมัติครบ";
  if (status === "advisor_approved") return "รอเจ้าหน้าที่ตรวจสอบ";
  if (status === "staff_verified") return "ตรวจสอบแล้ว";
  if (status === "scheduled") return "นัดสอบแล้ว (legacy)";
  if (status === "completed") return "บันทึกผลสอบแล้ว";
  return status || "-";
}

type DefenseStaffQueuePageProps = {
  defenseType: DefenseType;
};

export function DefenseStaffQueuePage({ defenseType }: DefenseStaffQueuePageProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<DefenseQueueRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyNote, setVerifyNote] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning"; message: string } | null>(null);

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
  const { verifyRequest, exportQueue } = useAdminDefenseQueueMutations(defenseType);

  const rows = useMemo(() => queueQuery.data?.rows ?? [], [queueQuery.data?.rows]);
  const total = queueQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isBusy = verifyRequest.isPending || exportQueue.isPending;

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

  const pageTitle = defenseType === DEFENSE_TYPE_THESIS ? "คำร้องขอสอบปริญญานิพนธ์ (คพ.03)" : "คำร้องขอสอบโครงงานพิเศษ 1 (คพ.02)";
  const pageSubtitle =
    defenseType === DEFENSE_TYPE_THESIS
      ? "ติดตามคำขอสอบปริญญานิพนธ์ ตรวจสอบรายการ และส่งออกชุดข้อมูลสำหรับนัดสอบ"
      : "ติดตามคำขอสอบ คพ.02 ตรวจสอบรายการ และส่งออกชุดข้อมูลสำหรับนัดสอบ";

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
                <th>สมาชิก</th>
                <th>สถานะ</th>
                <th>ยื่นคำขอ / อัปเดต</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {queueQuery.isLoading ? (
                <tr>
                  <td colSpan={5}>
                    <p className={styles.empty}>กำลังโหลดข้อมูล...</p>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <p className={styles.empty}>ไม่พบคำขอสอบที่ตรงตามเงื่อนไข</p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.requestId}>
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
                <p className={styles.subText}>{selected.project.projectNameTh || selected.project.projectNameEn || "-"}</p>
              </div>
              <button type="button" className={styles.button} onClick={closeDrawer}>
                ปิด
              </button>
            </header>
            <div className={styles.drawerBody}>
              {detailQuery.isLoading ? <p className={styles.empty}>กำลังโหลดรายละเอียด...</p> : null}
              <section className={styles.detailSection}>
                <h3 className={styles.detailTitle}>ภาพรวมคำขอ</h3>
                <p>สถานะคำขอ: {statusLabel(selected.status)}</p>
                <p>วันที่ยื่นคำขอ: {formatDateTime(selected.submittedAt)}</p>
                <p>หมายเหตุเจ้าหน้าที่: {selected.staffVerificationNote || "-"}</p>
                <p>ผู้ตรวจล่าสุด: {selected.staffVerifiedByName || "-"}</p>
              </section>
              <section className={styles.detailSection}>
                <h3 className={styles.detailTitle}>ข้อมูลโครงงาน</h3>
                <p>ชื่อโครงงาน: {selected.project.projectNameTh || selected.project.projectNameEn || "-"}</p>
                <p>อาจารย์ที่ปรึกษา: {selected.project.advisor?.name || "-"}</p>
                <p>อาจารย์ร่วม: {selected.project.coAdvisor?.name || "-"}</p>
              </section>
              <section className={styles.detailSection}>
                <h3 className={styles.detailTitle}>Meeting Metrics</h3>
                <p>ต้องมีขั้นต่ำ: {selected.meetingMetrics?.requiredApprovedLogs ?? "-"}</p>
                <p>อนุมัติแล้ว: {selected.meetingMetrics?.totalApprovedLogs ?? "-"}</p>
                <p>อนุมัติล่าสุด: {formatDateTime(selected.meetingMetrics?.lastApprovedLogAt ?? null)}</p>
              </section>
              {defenseType === DEFENSE_TYPE_THESIS ? (
                <section className={styles.detailSection}>
                  <h3 className={styles.detailTitle}>System Test Snapshot</h3>
                  <p>สถานะ: {selected.thesisSystemTestSnapshot?.status || "-"}</p>
                  <p>ช่วงทดสอบ: {formatDateTime(selected.thesisSystemTestSnapshot?.testStartDate)} - {formatDateTime(selected.thesisSystemTestSnapshot?.testDueDate)}</p>
                  <p>อัปโหลดหลักฐาน: {formatDateTime(selected.thesisSystemTestSnapshot?.evidenceSubmittedAt)}</p>
                  {selected.thesisSystemTestSnapshot?.evidence?.url ? (
                    <a
                      className={styles.link}
                      href={selected.thesisSystemTestSnapshot.evidence.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      เปิดไฟล์หลักฐาน
                    </a>
                  ) : null}
                </section>
              ) : null}
              {detailQuery.data ? (
                <section className={`${styles.detailSection} ${styles.rawSection}`}>
                  <h3 className={styles.detailTitle}>ข้อมูลแบบคำขอ (raw)</h3>
                  <p className={styles.rawHint}>แสดง payload ดิบจาก API สำหรับเทียบ parity กับ legacy</p>
                  <pre className={styles.rawBlock}>{JSON.stringify(detailQuery.data, null, 2)}</pre>
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
    </div>
  );
}
