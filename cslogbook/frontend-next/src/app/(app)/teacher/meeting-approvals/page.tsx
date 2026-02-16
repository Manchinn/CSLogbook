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

  const { data: meetings = [], isLoading, error } = useTeacherMeetingApprovals();
  const updateApproval = useUpdateMeetingLogApproval();

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

  const handleSubmit = async () => {
    if (!selectedLog || !modalMode) return;

    try {
      await updateApproval.mutateAsync({
        projectId: selectedLog.projectId,
        meetingId: selectedLog.meetingId,
        logId: selectedLog.id,
        decision: modalMode,
        note: note || undefined,
      });
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
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
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
                  <tr key={meeting.id}>
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
        )}

        {modalMode && selectedLog && (
          <div className={styles.modal}>
            <div className={styles.modalBackdrop} onClick={handleCancel} />
            <div className={styles.modalContent}>
              <h2 className={styles.modalTitle}>
                {modalMode === "approve" ? "อนุมัติบันทึกการพบ" : "ปฏิเสธบันทึกการพบ"}
              </h2>
              <div className={styles.modalBody}>
                <p>
                  <strong>โครงงาน:</strong> {selectedLog.projectTitle}
                </p>
                <p>
                  <strong>นักศึกษา:</strong> {selectedLog.studentName} ({selectedLog.studentCode})
                </p>
                <p>
                  <strong>หัวข้อ:</strong> {selectedLog.topic}
                </p>
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
