"use client";

import type { DefenseRequest, SystemTestRequest } from "@/lib/services/teacherService";
import styles from "./AdvisorQueue.module.css";

type QueueItem = DefenseRequest | SystemTestRequest;

type AdvisorQueueTableProps<T extends QueueItem> = {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  onApprove: (item: T) => void;
  onReject: (item: T) => void;
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

export function AdvisorQueueTable<T extends QueueItem>({
  data,
  isLoading,
  error,
  onApprove,
  onReject,
  emptyMessage = "ไม่มีคำขอที่รออนุมัติในขณะนี้",
  showTestDates = false,
}: AdvisorQueueTableProps<T>) {
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
          {data.map((item) => {
            const studentNames = getStudentNames(item);
            const projectTitle = getProjectTitle(item);
            const requestDate = item.requestDate || item.submittedAt || "";

            // Determine if status is pending
            const isPending =
              item.status === "pending" ||
              item.status === "pending_advisor" ||
              (item as DefenseRequest).myApproval?.status === "pending";

            return (
              <tr key={item.id}>
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
