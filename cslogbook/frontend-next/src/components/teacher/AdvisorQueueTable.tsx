"use client";

import { useMemo, useState } from "react";
import type { DefenseRequest, SystemTestRequest } from "@/lib/services/teacherService";
import responsive from "@/styles/shared/responsive.module.css";
import styles from "./AdvisorQueue.module.css";

type QueueItem = DefenseRequest | SystemTestRequest;

type QueueSummary = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
};

type AdvisorQueueTableProps<T extends QueueItem> = {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  onApprove: (item: T) => void;
  onReject: (item: T) => void;
  onViewPDF?: (url: string, fileName: string) => void;
  emptyMessage?: string;
  showTestDates?: boolean;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  summary?: QueueSummary;
  /** ใช้สำหรับ system-test ที่มี PDF */
  showPDFColumn?: boolean;
};

// Helper: ดึง academicYear/semester จาก item
function getItemAcademicInfo(item: QueueItem): { academicYear?: number; semester?: number } {
  if ("project" in item && item.project) {
    return { academicYear: item.project.academicYear, semester: item.project.semester };
  }
  if ("projectSnapshot" in item && item.projectSnapshot) {
    return { academicYear: item.projectSnapshot.academicYear, semester: item.projectSnapshot.semester };
  }
  return {};
}

// Helper function to get student names from either type
function getStudentNames(item: QueueItem): string[] {
  if ("project" in item && item.project?.members) {
    return item.project.members.map((m) => m.name);
  }
  if ("submittedBy" in item && item.submittedBy) {
    return [item.submittedBy.name];
  }
  return [];
}

// Helper function to get project title
function getProjectTitle(item: QueueItem): string {
  if ("project" in item && item.project) {
    return item.project.projectNameTh || item.project.projectNameEn || item.projectTitle || "ไม่ระบุชื่อโครงงาน";
  }
  if ("projectSnapshot" in item && item.projectSnapshot) {
    return item.projectSnapshot.projectNameTh || item.projectSnapshot.projectNameEn || item.projectTitle || "ไม่ระบุชื่อโครงงาน";
  }
  return item.projectTitle || "ไม่ระบุชื่อโครงงาน";
}

// Component for expandable row details
function ExpandedRowDetails({ item, onViewPDF }: { item: QueueItem; onViewPDF?: (url: string, fileName: string) => void }) {
  const isDefenseRequest = "project" in item;
  const isSystemTest = "testStartDate" in item;
  const defenseItem = item as DefenseRequest & {
    defenseScheduledAt?: string;
    defenseLocation?: string;
    defenseNote?: string;
    submittedLate?: boolean;
    staffVerificationNote?: string;
  };
  const systemTestItem = item as SystemTestRequest;
  const thDateOpts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };

  return (
    <div className={styles.expandedDetails}>
      <div className={styles.detailsGrid}>
        {/* ข้อมูลคำขอ — Defense Request (คพ.02 / คพ.03) */}
        {isDefenseRequest && (
          <div className={styles.detailSection}>
            <h4 className={styles.detailTitle}>ข้อมูลคำขอ</h4>
            <div className={styles.metrics}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>วันที่ยื่น:</span>
                <span className={styles.metricValue}>
                  {item.submittedAt
                    ? new Date(item.submittedAt).toLocaleDateString("th-TH", thDateOpts)
                    : "-"}
                </span>
              </div>
              {defenseItem.submittedLate && (
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>สถานะ:</span>
                  <span className={`${styles.metricValue} ${styles.lateText}`}>ส่งล่าช้า</span>
                </div>
              )}
              {defenseItem.defenseScheduledAt && (
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>วันนัดสอบ:</span>
                  <span className={styles.metricValue}>
                    {new Date(defenseItem.defenseScheduledAt).toLocaleDateString("th-TH", thDateOpts)}
                  </span>
                </div>
              )}
              {defenseItem.defenseLocation && (
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>สถานที่สอบ:</span>
                  <span className={styles.metricValue}>{defenseItem.defenseLocation}</span>
                </div>
              )}
            </div>
            {defenseItem.defenseNote && (
              <div className={styles.noteBox}>{defenseItem.defenseNote}</div>
            )}
          </div>
        )}

        {/* Meeting Metrics (Logbook) — คพ.02 / คพ.03 */}
        {isDefenseRequest && defenseItem.meetingMetrics && (
          <div className={styles.detailSection}>
            <h4 className={styles.detailTitle}>สถิติบันทึกการพบอาจารย์</h4>
            <div className={styles.metrics}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>จำนวนการพบทั้งหมด:</span>
                <span className={styles.metricValue}>{defenseItem.meetingMetrics.totalMeetings} ครั้ง</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>อนุมัติแล้ว:</span>
                <span className={styles.metricValue}>{defenseItem.meetingMetrics.approvedLogs} ครั้ง</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>ขั้นต่ำที่ต้องอนุมัติ:</span>
                <span className={styles.metricValue}>{defenseItem.meetingMetrics.minimumRequired} ครั้ง</span>
              </div>
              {defenseItem.meetingMetrics.lastApprovalDate && (
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>อนุมัติล่าสุด:</span>
                  <span className={styles.metricValue}>
                    {new Date(defenseItem.meetingMetrics.lastApprovalDate).toLocaleDateString("th-TH", thDateOpts)}
                  </span>
                </div>
              )}
            </div>
            {defenseItem.meetingMetrics.approvedLogs < defenseItem.meetingMetrics.minimumRequired && (
              <div className={styles.warningBox}>
                บันทึกการพบที่อนุมัติยังไม่ถึงขั้นต่ำ ({defenseItem.meetingMetrics.approvedLogs}/{defenseItem.meetingMetrics.minimumRequired})
              </div>
            )}
          </div>
        )}

        {/* ข้อมูลคำขอ — System Test */}
        {isSystemTest && (
          <div className={styles.detailSection}>
            <h4 className={styles.detailTitle}>ข้อมูลคำขอทดสอบระบบ</h4>
            <div className={styles.metrics}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>วันเริ่มทดสอบ:</span>
                <span className={styles.metricValue}>
                  {systemTestItem.testStartDate ? new Date(systemTestItem.testStartDate).toLocaleDateString("th-TH", thDateOpts) : "-"}
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>วันสิ้นสุด:</span>
                <span className={styles.metricValue}>
                  {systemTestItem.testDueDate ? new Date(systemTestItem.testDueDate).toLocaleDateString("th-TH", thDateOpts) : "-"}
                </span>
              </div>
            </div>

            {/* หมายเหตุจากนักศึกษา */}
            {systemTestItem.studentNote && (
              <div className={styles.noteBox}>{systemTestItem.studentNote}</div>
            )}

            {/* เอกสารคำขอ PDF */}
            {systemTestItem.pdfFile && onViewPDF && (
              <div className={styles.pdfSection}>
                <button
                  type="button"
                  className={styles.btnViewPDF}
                  onClick={() => onViewPDF(systemTestItem.pdfFile!.url, systemTestItem.pdfFile!.filename)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>ดูเอกสารคำขอ</span>
                  <span className={styles.fileNameBadge}>{systemTestItem.pdfFile.filename}</span>
                </button>
              </div>
            )}

            {/* ไฟล์หลักฐาน (requestFile จาก backend) */}
            {(item as SystemTestRequest & { requestFile?: { url: string; filename: string } }).requestFile && onViewPDF && (
              <div className={styles.pdfSection}>
                <button
                  type="button"
                  className={styles.btnViewPDF}
                  onClick={() => {
                    const rf = (item as SystemTestRequest & { requestFile?: { url: string; filename: string } }).requestFile!;
                    onViewPDF(rf.url, rf.filename);
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>ดูเอกสารคำขอ</span>
                  <span className={styles.fileNameBadge}>
                    {(item as SystemTestRequest & { requestFile?: { url: string; filename: string } }).requestFile!.filename}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* หมายเหตุจากเจ้าหน้าที่ */}
        {((item as QueueItem & { staffNote?: string }).staffNote || defenseItem.staffVerificationNote) && (
          <div className={styles.detailSection}>
            <h4 className={styles.detailTitle}>หมายเหตุจากเจ้าหน้าที่</h4>
            <div className={styles.noteBox}>
              {(item as QueueItem & { staffNote?: string }).staffNote || defenseItem.staffVerificationNote}
            </div>
          </div>
        )}

        {/* สถานะการอนุมัติของอาจารย์ */}
        {item.advisors && item.advisors.length > 0 && (
          <div className={styles.detailSection}>
            <h4 className={styles.detailTitle}>สถานะการอนุมัติของอาจารย์</h4>
            <div className={styles.advisorList}>
              {item.advisors.map((advisor, idx) => (
                <div key={idx} className={styles.advisorItem}>
                  <div className={styles.advisorHeader}>
                    <span className={styles.advisorName}>{advisor.teacherName}</span>
                    <span className={`${styles.advisorBadge} ${styles[`badge-${advisor.status}`]}`}>
                      {advisor.status === "approved" && "อนุมัติแล้ว"}
                      {advisor.status === "rejected" && "ปฏิเสธแล้ว"}
                      {advisor.status === "pending" && "รออนุมัติ"}
                    </span>
                  </div>
                  <div className={styles.advisorRole}>
                    {advisor.role === "advisor" ? "อาจารย์ที่ปรึกษา" : "อาจารย์ที่ปรึกษาร่วม"}
                  </div>
                  {advisor.approvedAt && (
                    <div className={styles.advisorDate}>
                      {new Date(advisor.approvedAt).toLocaleDateString("th-TH", thDateOpts)}
                    </div>
                  )}
                  {advisor.note && (
                    <div className={styles.advisorNote}>หมายเหตุ: {advisor.note}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdvisorQueueTable<T extends QueueItem>({
  data,
  isLoading,
  error,
  onApprove,
  onReject,
  onViewPDF,
  emptyMessage = "ไม่มีคำขอที่รออนุมัติในขณะนี้",
  showTestDates = false,
  statusFilter,
  onStatusFilterChange,
  summary,
}: AdvisorQueueTableProps<T>) {
  const [detailItem, setDetailItem] = useState<T | null>(null);
  const [yearFilter, setYearFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  // คำนวณ available years/semesters จาก data (client-side)
  const { availableYears, availableSemesters } = useMemo(() => {
    const yearsSet = new Set<number>();
    const semByYear: Record<number, Set<number>> = {};

    for (const item of data) {
      const { academicYear, semester } = getItemAcademicInfo(item);
      if (academicYear) {
        yearsSet.add(academicYear);
        if (!semByYear[academicYear]) semByYear[academicYear] = new Set();
        if (semester) semByYear[academicYear].add(semester);
      }
    }

    const years = Array.from(yearsSet).sort((a, b) => b - a);
    const semesters = yearFilter && semByYear[Number(yearFilter)]
      ? Array.from(semByYear[Number(yearFilter)]).sort((a, b) => a - b)
      : [];
    return { availableYears: years, availableSemesters: semesters };
  }, [data, yearFilter]);

  // Client-side filter by year/semester
  const filteredData = useMemo(() => {
    if (!yearFilter && !semesterFilter) return data;
    return data.filter((item) => {
      const { academicYear, semester } = getItemAcademicInfo(item);
      if (yearFilter && String(academicYear) !== yearFilter) return false;
      if (semesterFilter && String(semester) !== semesterFilter) return false;
      return true;
    });
  }, [data, yearFilter, semesterFilter]);

  const hasExtraFilters = !!yearFilter || !!semesterFilter;

  const resetFilters = () => {
    setYearFilter("");
    setSemesterFilter("");
    if (onStatusFilterChange) onStatusFilterChange("");
  };

  const toolbarContent = (
    <div className={styles.toolbar}>
      <div className={styles.filterBar}>
        {availableYears.length > 0 && (
          <>
            <label htmlFor="advisorYearFilter" className={styles.filterLabel}>ปีการศึกษา</label>
            <select
              id="advisorYearFilter"
              className={styles.filterSelect}
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setSemesterFilter("");
              }}
            >
              <option value="">ทุกปี</option>
              {availableYears.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </>
        )}

        {availableSemesters.length > 0 && (
          <>
            <label htmlFor="advisorSemesterFilter" className={styles.filterLabel}>ภาคเรียน</label>
            <select
              id="advisorSemesterFilter"
              className={styles.filterSelect}
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
            >
              <option value="">ทุกภาค</option>
              {availableSemesters.map((s) => (
                <option key={s} value={String(s)}>ภาคเรียนที่ {s}</option>
              ))}
            </select>
          </>
        )}

        {onStatusFilterChange && (
          <>
            <label htmlFor="advisorStatusFilter" className={styles.filterLabel}>สถานะ</label>
            <select
              id="advisorStatusFilter"
              className={styles.filterSelect}
              value={statusFilter || ""}
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              <option value="pending,pending_advisor">รออนุมัติ</option>
              <option value="approved,staff_approved">อนุมัติแล้ว</option>
              <option value="rejected">ปฏิเสธแล้ว</option>
              {showTestDates && <option value="pending_staff">รอเจ้าหน้าที่</option>}
            </select>
          </>
        )}

        {(hasExtraFilters || statusFilter) && (
          <button type="button" className={styles.btnClearFilter} onClick={resetFilters}>
            ล้างตัวกรอง
          </button>
        )}
      </div>
      {summary && summary.total > 0 && (
        <div className={styles.summaryBar}>
          <span className={`${styles.summaryBadge} ${styles.summaryTotal}`}>
            ทั้งหมด {summary.total}
          </span>
          <span className={`${styles.summaryBadge} ${styles.summaryPending}`}>
            รออนุมัติ {summary.pending}
          </span>
          <span className={`${styles.summaryBadge} ${styles.summaryApproved}`}>
            อนุมัติแล้ว {summary.approved}
          </span>
          <span className={`${styles.summaryBadge} ${styles.summaryRejected}`}>
            ปฏิเสธแล้ว {summary.rejected}
          </span>
        </div>
      )}
    </div>
  );

  const colCount = 5; // โครงงาน, นักศึกษา, วันที่ยื่นคำขอ, สถานะ, การดำเนินการ

  if (isLoading) {
    return (
      <>
        {toolbarContent}
        <div className={styles.loadingState}>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {toolbarContent}
        <div className={styles.errorState}>
          <p>เกิดข้อผิดพลาด: {error.message || "ไม่สามารถโหลดข้อมูลได้"}</p>
        </div>
      </>
    );
  }

  return (
    <>
    {toolbarContent}
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ชื่อโครงงาน</th>
            <th>นักศึกษา</th>
            <th className={responsive.hideOnMobile}>วันที่ยื่นคำขอ</th>
            <th>สถานะ</th>
            <th>การดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length === 0 && (
            <tr>
              <td colSpan={colCount} className={styles.emptyRow}>
                {statusFilter || hasExtraFilters ? "ไม่พบรายการที่ตรงกับตัวกรอง" : emptyMessage}
              </td>
            </tr>
          )}
          {filteredData.map((item, idx) => {
            const studentNames = getStudentNames(item);
            const projectTitle = getProjectTitle(item);
            const requestDate = item.requestDate || item.submittedAt || "";

            const isPending =
              item.status === "pending" ||
              item.status === "pending_advisor" ||
              (item as DefenseRequest).myApproval?.status === "pending";

            return (
              <tr key={`${item.id}-${idx}`}>
                <td>
                  <div className={styles.projectTitle}>{projectTitle}</div>
                </td>
                <td>
                  <div className={styles.students}>
                    {studentNames.length > 0 ? (
                      studentNames.map((name, i) => (
                        <div key={i} className={styles.studentName}>
                          {name}
                        </div>
                      ))
                    ) : (
                      <div className={styles.studentName}>-</div>
                    )}
                  </div>
                </td>
                <td className={responsive.hideOnMobile}>
                  <div className={styles.dateCell}>
                    {requestDate ? new Date(requestDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "-"}
                  </div>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[`badge-${item.status}`]}`}>
                    {item.status === "pending" && "รออนุมัติ"}
                    {item.status === "pending_advisor" && "รออาจารย์พิจารณา"}
                    {item.status === "approved" && "อนุมัติแล้ว"}
                    {item.status === "rejected" && "ปฏิเสธแล้ว"}
                    {item.status === "pending_staff" && "รอเจ้าหน้าที่"}
                    {item.status === "staff_approved" && "เจ้าหน้าที่อนุมัติแล้ว"}
                    {item.status === "completed" && "เสร็จสิ้น"}
                    {item.status === "advisor_rejected" && "อาจารย์ปฏิเสธ"}
                    {!["pending", "pending_advisor", "approved", "rejected", "pending_staff", "staff_approved", "completed", "advisor_rejected"].includes(item.status ?? "") &&
                      (item.status ?? "ไม่ทราบสถานะ")}
                  </span>
                </td>
                <td>
                  {isPending ? (
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnApprove}`}
                        onClick={() => onApprove(item)}
                      >
                        อนุมัติ
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnReject}`}
                        onClick={() => onReject(item)}
                      >
                        ปฏิเสธ
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnDetail}`}
                      onClick={() => setDetailItem(item)}
                    >
                      ดูรายละเอียด
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {/* Detail Modal — แสดงรายละเอียดเมื่อกด "ดูรายละเอียด" */}
    {detailItem && (
      <div className={styles.modal}>
        <div className={styles.modalBackdrop} onClick={() => setDetailItem(null)} />
        <div className={styles.modalContent}>
          <h2 className={styles.modalTitle}>รายละเอียดคำขอ</h2>
          <div className={styles.modalBody}>
            <ExpandedRowDetails item={detailItem} onViewPDF={onViewPDF} />
          </div>
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => setDetailItem(null)}
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

type DecisionModalProps<T extends QueueItem> = {
  item: T | null;
  mode: "approve" | "reject" | null;
  note: string;
  onNoteChange: (note: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  title: string;
};

export function DecisionModal<T extends QueueItem>({
  item,
  mode,
  note,
  onNoteChange,
  onSubmit,
  onCancel,
  isPending,
  title,
}: DecisionModalProps<T>) {
  if (!mode || !item) return null;

  const studentNames = getStudentNames(item);
  const projectTitle = getProjectTitle(item);
  const isDefenseRequest = "project" in item;
  const defenseItem = item as DefenseRequest;
  const meetingMetrics = isDefenseRequest ? defenseItem.meetingMetrics : undefined;

  return (
    <div className={styles.modal}>
      <div className={styles.modalBackdrop} onClick={onCancel} />
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>
          {mode === "approve" ? `อนุมัติ${title}` : `ปฏิเสธ${title}`}
        </h2>
        <div className={styles.modalBody}>
          <p>
            <strong>โครงงาน:</strong> {projectTitle}
          </p>
          <p>
            <strong>นักศึกษา:</strong>
            <br />
            {studentNames.length > 0 ? (
              studentNames.map((name, idx) => (
                <span key={idx}>
                  {name}
                  <br />
                </span>
              ))
            ) : (
              <span>-</span>
            )}
          </p>

          {/* #3: แสดง meeting metrics ใน modal */}
          {meetingMetrics && (
            <div className={styles.modalMetrics}>
              <div className={styles.modalMetricItem}>
                <span className={styles.modalMetricLabel}>จำนวนการพบ</span>
                <span className={styles.modalMetricValue}>{meetingMetrics.totalMeetings} ครั้ง</span>
              </div>
              <div className={styles.modalMetricItem}>
                <span className={styles.modalMetricLabel}>อนุมัติแล้ว</span>
                <span className={styles.modalMetricValue}>{meetingMetrics.approvedLogs} ครั้ง</span>
              </div>
              <div className={styles.modalMetricItem}>
                <span className={styles.modalMetricLabel}>ขั้นต่ำ</span>
                <span className={styles.modalMetricValue}>{meetingMetrics.minimumRequired} ครั้ง</span>
              </div>
            </div>
          )}

          {/* #3: แสดง advisor approvals ใน modal */}
          {item.advisors && item.advisors.length > 0 && (
            <div className={styles.modalAdvisorSection}>
              <strong className={styles.modalSectionLabel}>สถานะอาจารย์ที่ปรึกษา</strong>
              {item.advisors.map((advisor, idx) => (
                <div key={idx} className={styles.modalAdvisorRow}>
                  <span className={styles.modalAdvisorName}>
                    {advisor.teacherName}
                    <span className={styles.modalAdvisorRole}>
                      {advisor.role === "advisor" ? " (ที่ปรึกษา)" : " (ร่วม)"}
                    </span>
                  </span>
                  <span className={`${styles.advisorBadge} ${styles[`badge-${advisor.status}`]}`}>
                    {advisor.status === "approved" && "อนุมัติแล้ว"}
                    {advisor.status === "rejected" && "ปฏิเสธแล้ว"}
                    {advisor.status === "pending" && "รออนุมัติ"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="note">
              หมายเหตุ {mode === "reject" && <span className={styles.required}>*</span>}
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder={
                mode === "reject"
                  ? "กรุณาระบุเหตุผลในการปฏิเสธ"
                  : "หมายเหตุเพิ่มเติม (ถ้ามี)"
              }
              className={styles.textarea}
              rows={4}
            />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={onCancel}
            disabled={isPending}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            className={`${styles.btn} ${mode === "approve" ? styles.btnPrimary : styles.btnDanger}`}
            onClick={onSubmit}
            disabled={isPending || (mode === "reject" && !note.trim())}
          >
            {isPending
              ? "กำลังดำเนินการ..."
              : mode === "approve"
                ? "ยืนยันการอนุมัติ"
                : "ยืนยันการปฏิเสธ"}
          </button>
        </div>
      </div>
    </div>
  );
}
