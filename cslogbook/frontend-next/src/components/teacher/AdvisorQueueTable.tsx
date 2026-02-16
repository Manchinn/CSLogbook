"use client";

import { useState } from "react";
import type { DefenseRequest, SystemTestRequest } from "@/lib/services/teacherService";
import styles from "./AdvisorQueue.module.css";

type QueueItem = DefenseRequest | SystemTestRequest;

type AdvisorQueueTableProps<T extends QueueItem> = {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  onApprove: (item: T) => void;
  onReject: (item: T) => void;
  onViewPDF?: (url: string, fileName: string) => void;
  emptyMessage?: string;
  showTestDates?: boolean;
};

// Helper function to get student names from either type
function getStudentNames(item: QueueItem): string[] {
  // For DefenseRequest with project.members
  if ("project" in item && item.project?.members) {
    return item.project.members.map((m) => m.name);
  }

  // For SystemTestRequest with submittedBy
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

  return (
    <div className={styles.expandedDetails}>
      {/* Timeline for System Test */}
      {isSystemTest && (
        <div className={styles.timelineSection}>
          <h4 className={styles.detailTitle}>สถานะการอนุมัติ</h4>
          <div className={styles.timelineMiniContainer}>
            {/* Mini timeline visualization */}
            <div className={styles.miniTimeline}>
              <div className={styles.miniTimelineItem}>
                <div className={`${styles.miniTimelineDot} ${styles.miniTimelineDotCompleted}`} />
                <span className={styles.miniTimelineLabel}>ยื่นคำขอ</span>
              </div>

              {item.advisors?.map((advisor, idx) => (
                <div key={idx} className={styles.miniTimelineItem}>
                  <div
                    className={`${styles.miniTimelineDot} ${
                      advisor.status === "approved"
                        ? styles.miniTimelineDotCompleted
                        : advisor.status === "rejected"
                        ? styles.miniTimelineDotRejected
                        : styles.miniTimelineDotPending
                    }`}
                  />
                  <span className={styles.miniTimelineLabel}>{advisor.teacherName}</span>
                </div>
              ))}

              {(item.status === "staff_approved" || item.status === "pending_staff") && (
                <div className={styles.miniTimelineItem}>
                  <div
                    className={`${styles.miniTimelineDot} ${
                      item.status === "staff_approved"
                        ? styles.miniTimelineDotCompleted
                        : styles.miniTimelineDotPending
                    }`}
                  />
                  <span className={styles.miniTimelineLabel}>เจ้าหน้าที่</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={styles.detailsGrid}>
        {/* Timeline Section for Defense Requests */}
        {isDefenseRequest && (
          <div className={styles.detailSection}>
            <h4 className={styles.detailTitle}>Timeline</h4>
            <div className={styles.timelineContainer}>
              <div className={styles.timelineItem}>
                <div className={styles.timelineDot}></div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineLabel}>ยื่นคำขอ</div>
                  <div className={styles.timelineDate}>
                    {item.requestDate || item.submittedAt
                      ? new Date(item.requestDate || item.submittedAt!).toLocaleString("th-TH")
                      : "-"}
                  </div>
                </div>
              </div>

              {isDefenseRequest && (item as DefenseRequest).myApproval && (
                <div className={styles.timelineItem}>
                  <div
                    className={`${styles.timelineDot} ${
                      (item as DefenseRequest).myApproval.status === "approved"
                        ? styles.timelineDotApproved
                        : styles.timelineDotPending
                    }`}
                  ></div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineLabel}>การอนุมัติของฉัน</div>
                    <div className={styles.timelineDate}>
                      {(item as DefenseRequest).myApproval.status === "approved"
                        ? "อนุมัติแล้ว"
                        : "รออนุมัติ"}
                    </div>
                  </div>
                </div>
              )}

              {item.status === "approved" && (
                <div className={styles.timelineItem}>
                  <div className={`${styles.timelineDot} ${styles.timelineDotApproved}`}></div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineLabel}>อนุมัติสมบูรณ์</div>
                    <div className={styles.timelineDate}>
                      {item.approvedAt ? new Date(item.approvedAt).toLocaleString("th-TH") : "-"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Meeting Metrics (for Defense Requests) */}
        {isDefenseRequest && (item as DefenseRequest).project && (
          <div className={styles.detailSection}>
            <h4 className={styles.detailTitle}>ข้อมูลโครงงาน</h4>
            <div className={styles.metrics}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>รหัสโครงงาน:</span>
                <span className={styles.metricValue}>
                  {(item as DefenseRequest).project.projectCode || "-"}
                </span>
              </div>
              {(item as DefenseRequest).project?.members && (
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>จำนวนสมาชิก:</span>
                  <span className={styles.metricValue}>
                    {(item as DefenseRequest).project.members.length} คน
                  </span>
                </div>
              )}
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>ประเภท:</span>
                <span className={styles.metricValue}>
                  {(item as DefenseRequest).requestType === "defense_request"
                    ? "สอบป้องกัน"
                    : "อื่นๆ"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Staff Verification Notes */}
        {item.staffNote && (
          <div className={styles.detailSection}>
            <h4 className={styles.detailTitle}>หมายเหตุจากเจ้าหน้าที่</h4>
            <div className={styles.noteBox}>{item.staffNote}</div>
          </div>
        )}

        {/* Approval Notes */}
        {item.advisorNote && (
          <div className={styles.detailSection}>
            <h4 className={styles.detailTitle}>หมายเหตุจากอาจารย์</h4>
            <div className={styles.noteBox}>{item.advisorNote}</div>
          </div>
        )}

        {/* System Test Specific Info */}
        {isSystemTest && (
          <div className={styles.detailSection}>
            <h4 className={styles.detailTitle}>ข้อมูลการทดสอบระบบ</h4>
            <div className={styles.metrics}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>วันเริ่มทดสอบ:</span>
                <span className={styles.metricValue}>
                  {item.testStartDate ? new Date(item.testStartDate).toLocaleDateString("th-TH") : "-"}
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>วันสิ้นสุด:</span>
                <span className={styles.metricValue}>
                  {item.testDueDate ? new Date(item.testDueDate).toLocaleDateString("th-TH") : "-"}
                </span>
              </div>
              {item.projectSnapshot?.projectCode && (
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>รหัสโครงงาน:</span>
                  <span className={styles.metricValue}>{item.projectSnapshot.projectCode}</span>
                </div>
              )}
            </div>

            {/* PDF View Button */}
            {item.pdfFile && onViewPDF && (
              <div className={styles.pdfSection}>
                <button
                  type="button"
                  className={styles.btnViewPDF}
                  onClick={() => onViewPDF(item.pdfFile!.url, item.pdfFile!.filename)}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>ดูเอกสาร PDF</span>
                  <span className={styles.fileNameBadge}>{item.pdfFile.filename}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Advisor Approvals Timeline */}
        {item.advisors && item.advisors.length > 0 && (
          <div className={styles.detailSection}>
            <h4 className={styles.detailTitle}>สถานะการอนุมัติของอาจารย์</h4>
            <div className={styles.advisorList}>
              {item.advisors.map((advisor, idx) => (
                <div key={idx} className={styles.advisorItem}>
                  <div className={styles.advisorHeader}>
                    <span className={styles.advisorName}>{advisor.teacherName}</span>
                    <span
                      className={`${styles.advisorBadge} ${styles[`badge-${advisor.status}`]}`}
                    >
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
                      {new Date(advisor.approvedAt).toLocaleString("th-TH")}
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
}: AdvisorQueueTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <p>เกิดข้อผิดพลาด: {error.message || "ไม่สามารถโหลดข้อมูลได้"}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>✓</div>
        <p className={styles.emptyMessage}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: "40px" }}></th>
            <th>โครงงาน</th>
            <th>นักศึกษา</th>
            <th>วันที่ยื่นคำขอ</th>
            {showTestDates && (
              <>
                <th>วันเริ่มทดสอบ</th>
                <th>วันสิ้นสุด</th>
              </>
            )}
            <th>สถานะ</th>
            <th>การดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => {
            const studentNames = getStudentNames(item);
            const projectTitle = getProjectTitle(item);
            const requestDate = item.requestDate || item.submittedAt || "";

            // Determine if status is pending
            const isPending =
              item.status === "pending" ||
              item.status === "pending_advisor" ||
              (item as DefenseRequest).myApproval?.status === "pending";

            const isExpanded = expandedRows.has(item.id);

            return (
              <>
                <tr key={`${item.id}-${idx}`}>
                  <td>
                    <button
                      type="button"
                      className={styles.expandBtn}
                      onClick={() => toggleExpand(item.id)}
                      aria-label={isExpanded ? "ย่อรายละเอียด" : "ขยายรายละเอียด"}
                    >
                      {isExpanded ? "▼" : "▶"}
                    </button>
                  </td>
                  <td>
                    <div className={styles.projectTitle}>{projectTitle}</div>
                  </td>
                  <td>
                    <div className={styles.students}>
                      {studentNames.length > 0 ? (
                        studentNames.map((name, idx) => (
                          <div key={idx} className={styles.studentName}>
                            {name}
                          </div>
                        ))
                      ) : (
                        <div className={styles.studentName}>-</div>
                      )}
                    </div>
                  </td>
                  <td>{requestDate ? new Date(requestDate).toLocaleDateString("th-TH") : "-"}</td>
                  {showTestDates && "testStartDate" in item && (
                    <>
                      <td>
                        {item.testStartDate
                          ? new Date(item.testStartDate).toLocaleDateString("th-TH")
                          : "-"}
                      </td>
                      <td>
                        {item.testDueDate
                          ? new Date(item.testDueDate).toLocaleDateString("th-TH")
                          : "-"}
                      </td>
                    </>
                  )}
                  <td>
                    <span className={`${styles.badge} ${styles[`badge-${item.status}`]}`}>
                      {item.status === "pending" && "รออนุมัติ"}
                      {item.status === "pending_advisor" && "รออาจารย์พิจารณา"}
                      {item.status === "approved" && "อนุมัติแล้ว"}
                      {item.status === "rejected" && "ปฏิเสธแล้ว"}
                      {item.status === "pending_staff" && "รอเจ้าหน้าที่"}
                      {item.status === "staff_approved" && "เจ้าหน้าที่อนุมัติแล้ว"}
                    </span>
                  </td>
                  <td>
                    {isPending && (
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
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${item.id}-expanded`} className={styles.expandedRow}>
                    <td colSpan={showTestDates ? 8 : 6}>
                      <ExpandedRowDetails item={item} onViewPDF={onViewPDF} />
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
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
