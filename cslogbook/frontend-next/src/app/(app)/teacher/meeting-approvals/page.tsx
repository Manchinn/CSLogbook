"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { TeacherPageScaffold, TeacherEmptyState } from "@/components/teacher/TeacherPageScaffold";
import { useTeacherMeetingApprovals, useUpdateMeetingLogApproval } from "@/hooks/useTeacherModule";
import type { MeetingLogApproval } from "@/lib/services/teacherService";
import styles from "./MeetingApprovals.module.css";

export default function MeetingApprovalsPage() {
  const [selectedLog, setSelectedLog] = useState<MeetingLogApproval | null>(null);
  const [modalMode, setModalMode] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: meetings = [], isLoading, error } = useTeacherMeetingApprovals();
  const updateApproval = useUpdateMeetingLogApproval();

  // Ensure meetings is always an array
  const meetingsArray = Array.isArray(meetings) ? meetings : [];

  // Filter pending meetings for batch operations
  const pendingMeetings = meetingsArray.filter((m) => m.status === "pending");
  const selectedCount = selectedIds.size;
  const allPendingSelected =
    pendingMeetings.length > 0 && selectedIds.size === pendingMeetings.length;

  const handleApprove = (log: MeetingLogApproval) => {
    setSelectedLog(log);
    setModalMode("approve");
    setNote("");
  };

  const handleReject = (log: MeetingLogApproval) => {
    setSelectedLog(log);
    setModalMode("reject");
    setNote("");
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleToggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingMeetings.map((m) => m.id)));
    }
  };

  const handleBulkAction = (action: "approve" | "reject") => {
    setModalMode(action);
    setNote("");
  };

  const handleSubmit = async () => {
    if (!modalMode) return;

    try {
      if (selectedLog) {
        // Single approval
        await updateApproval.mutateAsync({
          projectId: selectedLog.projectId,
          meetingId: selectedLog.meetingId,
          logId: selectedLog.id,
          decision: modalMode,
          note: note || undefined,
        });
      } else if (selectedIds.size > 0) {
        // Bulk approval
        const selectedMeetings = meetings.filter((m) => selectedIds.has(m.id));
        await Promise.all(
          selectedMeetings.map((meeting) =>
            updateApproval.mutateAsync({
              projectId: meeting.projectId,
              meetingId: meeting.meetingId,
              logId: meeting.id,
              decision: modalMode,
              note: note || undefined,
            })
          )
        );
        setSelectedIds(new Set());
      }
      setModalMode(null);
      setSelectedLog(null);
      setNote("");
    } catch (err) {
      console.error("Failed to update approval:", err);
    }
  };

  const handleCancel = () => {
    setModalMode(null);
    setSelectedLog(null);
    setNote("");
  };

  return (
    <RoleGuard roles={["teacher"]} teacherTypes={["academic"]}>
      <TeacherPageScaffold
        title="อนุมัติบันทึกการพบ"
        description="อนุมัติหรือปฏิเสธบันทึกการประชุมของนักศึกษา"
      >
        {isLoading && (
          <div className={styles.loadingState}>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorState}>
            <p>เกิดข้อผิดพลาด: {error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลได้"}</p>
          </div>
        )}

        {!isLoading && !error && meetings.length === 0 && (
          <TeacherEmptyState message="ไม่มีบันทึกการพบที่รออนุมัติในขณะนี้" icon="✓" />
        )}

        {!isLoading && !error && meetings.length > 0 && (
          <>
            {/* Bulk Action Bar */}
            {selectedCount > 0 && (
              <div className={styles.bulkActionBar}>
                <div className={styles.bulkActionInfo}>
                  <span className={styles.bulkActionCount}>เลือก {selectedCount} รายการ</span>
                  <button
                    type="button"
                    className={styles.btnClearSelection}
                    onClick={() => setSelectedIds(new Set())}
                  >
                    ล้างการเลือก
                  </button>
                </div>
                <div className={styles.bulkActionButtons}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnBulkApprove}`}
                    onClick={() => handleBulkAction("approve")}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    อนุมัติทั้งหมด ({selectedCount})
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnBulkReject}`}
                    onClick={() => handleBulkAction("reject")}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    ปฏิเสธทั้งหมด ({selectedCount})
                  </button>
                </div>
              </div>
            )}

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>
                      {pendingMeetings.length > 0 && (
                        <input
                          type="checkbox"
                          checked={allPendingSelected}
                          onChange={handleToggleSelectAll}
                          className={styles.checkbox}
                          title={
                            allPendingSelected
                              ? "ยกเลิกการเลือกทั้งหมด"
                              : "เลือกทั้งหมด"
                          }
                        />
                      )}
                    </th>
                    <th>รหัสโครงงาน</th>
                    <th>ชื่อโครงงาน</th>
                    <th>นักศึกษา</th>
                    <th>หัวข้อการประชุม</th>
                    <th>วันที่ประชุม</th>
                    <th>วันที่ส่งบันทึก</th>
                    <th>สถานะ</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((meeting) => (
                    <tr key={meeting.id} className={selectedIds.has(meeting.id) ? styles.selectedRow : ""}>
                      <td>
                        {meeting.status === "pending" && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(meeting.id)}
                            onChange={() => handleToggleSelect(meeting.id)}
                            className={styles.checkbox}
                          />
                        )}
                      </td>
                    <td>
                      {meeting.projectCode ? (
                        <span className={styles.projectCodeBadge}>{meeting.projectCode}</span>
                      ) : (
                        <span className={styles.noCode}>-</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.projectTitle}>{meeting.projectTitle}</div>
                    </td>
                    <td>
                      <div className={styles.studentInfo}>
                        <div className={styles.studentName}>{meeting.studentName}</div>
                        <div className={styles.studentCode}>{meeting.studentCode}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.meetingTopic}>{meeting.topic}</div>
                    </td>
                    <td>
                      <div className={styles.dateCell}>
                        {new Date(meeting.meetingDate).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </td>
                    <td>
                      {meeting.submittedAt ? (
                        <div className={styles.dateCell}>
                          {new Date(meeting.submittedAt).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      ) : (
                        <span className={styles.noData}>-</span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge-${meeting.status}`]}`}>
                        {meeting.status === "pending" && "รออนุมัติ"}
                        {meeting.status === "approved" && "อนุมัติแล้ว"}
                        {meeting.status === "rejected" && "ปฏิเสธแล้ว"}
                      </span>
                    </td>
                    <td>
                      {meeting.status === "pending" && (
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnApprove}`}
                            onClick={() => handleApprove(meeting)}
                          >
                            อนุมัติ
                          </button>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnReject}`}
                            onClick={() => handleReject(meeting)}
                          >
                            ปฏิเสธ
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
        )}

        {modalMode && (selectedLog || selectedIds.size > 0) && (
          <div className={styles.modal}>
            <div className={styles.modalBackdrop} onClick={handleCancel} />
            <div className={styles.modalContent}>
              <h2 className={styles.modalTitle}>
                {modalMode === "approve"
                  ? selectedIds.size > 0
                    ? `อนุมัติบันทึกการพบ (${selectedIds.size} รายการ)`
                    : "อนุมัติบันทึกการพบ"
                  : selectedIds.size > 0
                  ? `ปฏิเสธบันทึกการพบ (${selectedIds.size} รายการ)`
                  : "ปฏิเสธบันทึกการพบ"}
              </h2>
              <div className={styles.modalBody}>
                {selectedLog ? (
                  <>
                    <p>
                      <strong>โครงงาน:</strong> {selectedLog.projectTitle}
                    </p>
                    <p>
                      <strong>นักศึกษา:</strong> {selectedLog.studentName} ({selectedLog.studentCode})
                    </p>
                    <p>
                      <strong>หัวข้อ:</strong> {selectedLog.topic}
                    </p>
                  </>
                ) : (
                  <p>
                    <strong>คุณกำลังจะดำเนินการกับ {selectedIds.size} รายการ</strong>
                  </p>
                )}
                <div className={styles.formGroup}>
                  <label htmlFor="note">
                    หมายเหตุ {modalMode === "reject" && <span className={styles.required}>*</span>}
                  </label>
                  <textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      modalMode === "reject"
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
                  onClick={handleCancel}
                  disabled={updateApproval.isPending}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${
                    modalMode === "approve" ? styles.btnPrimary : styles.btnDanger
                  }`}
                  onClick={handleSubmit}
                  disabled={updateApproval.isPending || (modalMode === "reject" && !note.trim())}
                >
                  {updateApproval.isPending ? "กำลังดำเนินการ..." : modalMode === "approve" ? "ยืนยันการอนุมัติ" : "ยืนยันการปฏิเสธ"}
                </button>
              </div>
            </div>
          </div>
        )}
      </TeacherPageScaffold>
    </RoleGuard>
  );
}
