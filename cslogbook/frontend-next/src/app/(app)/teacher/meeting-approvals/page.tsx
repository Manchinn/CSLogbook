"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { TeacherPageScaffold } from "@/components/teacher/TeacherPageScaffold";
import { useTeacherMeetingApprovals, useUpdateMeetingLogApproval } from "@/hooks/useTeacherModule";
import type { MeetingLogApproval, MeetingApprovalFilters } from "@/lib/services/teacherService";
import responsive from "@/styles/shared/responsive.module.css";
import styles from "./MeetingApprovals.module.css";

export default function MeetingApprovalsPage() {
  const [selectedLog, setSelectedLog] = useState<MeetingLogApproval | null>(null);
  const [modalMode, setModalMode] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [semesterFilter, setSemesterFilter] = useState<string>("");
  const [phaseFilter, setPhaseFilter] = useState<string>("");
  const [bulkError, setBulkError] = useState<string | null>(null);

  const filters: MeetingApprovalFilters = {};
  if (statusFilter) filters.status = statusFilter;
  if (yearFilter) filters.academicYear = yearFilter;
  if (semesterFilter) filters.semester = semesterFilter;

  const hasFilters = Object.keys(filters).length > 0 || !!phaseFilter;
  const { data: response, isLoading, error } = useTeacherMeetingApprovals(Object.keys(filters).length > 0 ? filters : undefined);
  const updateApproval = useUpdateMeetingLogApproval();

  // Client-side phase filter (backend ไม่มี phase filter ใน approval endpoint)
  const allMeetings = response?.items || [];
  const meetings = phaseFilter
    ? allMeetings.filter((m) => m.phase === phaseFilter)
    : allMeetings;
  const summary = response?.summary || { pending: 0, approved: 0, rejected: 0, total: 0 };
  const meta = response?.meta;

  const meetingsArray = Array.isArray(meetings) ? meetings : [];
  const pendingMeetings = meetingsArray.filter((m) => m.status === "pending");
  const selectedCount = selectedIds.size;
  const allPendingSelected =
    pendingMeetings.length > 0 && selectedIds.size === pendingMeetings.length;

  // ปีการศึกษาและภาคเรียนที่มีให้เลือก
  const availableYears = meta?.availableAcademicYears ?? [];
  const availableSemesters = yearFilter && meta?.availableSemestersByYear
    ? (meta.availableSemestersByYear[yearFilter] ?? [])
    : [];

  const handleApprove = (log: MeetingLogApproval) => {
    setSelectedLog(log);
    setModalMode("approve");
    setNote("");
    setBulkError(null);
  };

  const handleReject = (log: MeetingLogApproval) => {
    setSelectedLog(log);
    setModalMode("reject");
    setNote("");
    setBulkError(null);
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
    setSelectedLog(null);
    setModalMode(action);
    setNote("");
    setBulkError(null);
  };

  const handleSubmit = async () => {
    if (!modalMode) return;
    setBulkError(null);

    try {
      if (selectedLog) {
        await updateApproval.mutateAsync({
          projectId: selectedLog.projectId,
          meetingId: selectedLog.meetingId,
          logId: selectedLog.id,
          decision: modalMode,
          note: note || undefined,
        });
      } else if (selectedIds.size > 0) {
        // P4: ใช้ Promise.allSettled แทน Promise.all เพื่อจัดการ partial failure
        const selectedMeetings = meetings.filter((m) => selectedIds.has(m.id));
        const results = await Promise.allSettled(
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

        const failed = results.filter((r) => r.status === "rejected");
        const succeeded = results.filter((r) => r.status === "fulfilled");

        if (failed.length > 0 && succeeded.length > 0) {
          setBulkError(`ดำเนินการสำเร็จ ${succeeded.length} รายการ, ล้มเหลว ${failed.length} รายการ`);
        } else if (failed.length > 0 && succeeded.length === 0) {
          setBulkError(`ดำเนินการล้มเหลวทั้งหมด ${failed.length} รายการ`);
        }

        setSelectedIds(new Set());
      }

      if (!bulkError) {
        setModalMode(null);
        setSelectedLog(null);
        setNote("");
      }
    } catch (err) {
      console.error("Failed to update approval:", err);
    }
  };

  const handleCancel = () => {
    setModalMode(null);
    setSelectedLog(null);
    setNote("");
    setBulkError(null);
  };

  const resetFilters = () => {
    setStatusFilter("");
    setYearFilter("");
    setSemesterFilter("");
    setPhaseFilter("");
    setSelectedIds(new Set());
  };

  return (
    <RoleGuard roles={["teacher"]} teacherTypes={["academic"]}>
      <TeacherPageScaffold
        title="อนุมัติบันทึกการพบ"
        description="อนุมัติหรือปฏิเสธบันทึกการประชุมของนักศึกษา"
      >
        {/* P2: Filter bar — ปีการศึกษา + ภาคเรียน + สถานะ */}
        <div className={styles.toolbar}>
          <div className={styles.filterBar}>
            {availableYears.length > 0 && (
              <>
                <label htmlFor="yearFilter" className={styles.filterLabel}>ปีการศึกษา</label>
                <select
                  id="yearFilter"
                  className={styles.filterSelect}
                  value={yearFilter}
                  onChange={(e) => {
                    setYearFilter(e.target.value);
                    setSemesterFilter("");
                    setSelectedIds(new Set());
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
                <label htmlFor="semesterFilter" className={styles.filterLabel}>ภาคเรียน</label>
                <select
                  id="semesterFilter"
                  className={styles.filterSelect}
                  value={semesterFilter}
                  onChange={(e) => {
                    setSemesterFilter(e.target.value);
                    setSelectedIds(new Set());
                  }}
                >
                  <option value="">ทุกภาค</option>
                  {availableSemesters.map((s) => (
                    <option key={s} value={String(s)}>ภาคเรียนที่ {s}</option>
                  ))}
                </select>
              </>
            )}

            <label htmlFor="phaseFilter" className={styles.filterLabel}>ประเภท</label>
            <select
              id="phaseFilter"
              className={styles.filterSelect}
              value={phaseFilter}
              onChange={(e) => {
                setPhaseFilter(e.target.value);
                setSelectedIds(new Set());
              }}
            >
              <option value="">ทั้งหมด</option>
              <option value="phase1">โครงงานพิเศษ 1</option>
              <option value="phase2">ปริญญานิพนธ์</option>
            </select>

            <label htmlFor="statusFilter" className={styles.filterLabel}>สถานะ</label>
            <select
              id="statusFilter"
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setSelectedIds(new Set());
              }}
            >
              <option value="">ทั้งหมด</option>
              <option value="pending">รออนุมัติ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ปฏิเสธแล้ว</option>
            </select>

            {hasFilters && (
              <button type="button" className={styles.btnClearFilter} onClick={resetFilters}>
                ล้างตัวกรอง
              </button>
            )}
          </div>

          {summary.total > 0 && (
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

        {!isLoading && !error && (
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    อนุมัติทั้งหมด ({selectedCount})
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnBulkReject}`}
                    onClick={() => handleBulkAction("reject")}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    <th className={styles.checkboxCol}>
                      {pendingMeetings.length > 0 && (
                        <input
                          type="checkbox"
                          checked={allPendingSelected}
                          onChange={handleToggleSelectAll}
                          className={styles.checkbox}
                          aria-label={allPendingSelected ? "ยกเลิกการเลือกทั้งหมด" : "เลือกทั้งหมด"}
                          title={allPendingSelected ? "ยกเลิกการเลือกทั้งหมด" : "เลือกทั้งหมด"}
                        />
                      )}
                    </th>
                    <th>ชื่อโครงงาน</th>
                    <th>นักศึกษา</th>
                    <th className={responsive.hideOnMobile}>หัวข้อการประชุม</th>
                    <th>วันที่ประชุม</th>
                    <th className={responsive.hideOnMobile}>วันที่ส่งบันทึก</th>
                    <th>สถานะ</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.length === 0 && (
                    <tr>
                      <td colSpan={8} className={styles.emptyRow}>
                        {hasFilters ? "ไม่พบรายการที่ตรงกับตัวกรอง" : "ไม่มีบันทึกการพบที่รออนุมัติในขณะนี้"}
                      </td>
                    </tr>
                  )}
                  {meetings.map((meeting) => (
                    <tr key={meeting.id} className={selectedIds.has(meeting.id) ? styles.selectedRow : ""}>
                      <td>
                        {meeting.status === "pending" && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(meeting.id)}
                            onChange={() => handleToggleSelect(meeting.id)}
                            className={styles.checkbox}
                            aria-label={`เลือก ${meeting.projectTitle}`}
                          />
                        )}
                      </td>
                      <td>
                        <div className={styles.projectTitle}>{meeting.projectTitle}</div>
                        <span className={`${styles.phaseBadge} ${styles[`phase-${meeting.phase}`]}`}>
                          {meeting.phase === "phase1" ? "โครงงานพิเศษ 1" : "ปริญญานิพนธ์"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.studentInfo}>
                          <div className={styles.studentName}>{meeting.studentName}</div>
                          <div className={styles.studentCode}>{meeting.studentCode}</div>
                        </div>
                      </td>
                      <td className={responsive.hideOnMobile}>
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
                      <td className={responsive.hideOnMobile}>
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
                        {/* P3: แสดง advisorNotes สำหรับ approved/rejected */}
                        {meeting.advisorNotes && meeting.status !== "pending" && (
                          <div className={styles.advisorNote}>{meeting.advisorNotes}</div>
                        )}
                      </td>
                      <td>
                        {meeting.status === "pending" ? (
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
                        ) : (
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnDetail}`}
                            onClick={() => handleApprove(meeting)}
                          >
                            ดูรายละเอียด
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* P1: Modal พร้อมรายละเอียด log */}
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
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>โครงงาน</span>
                      <span className={styles.detailValue}>{selectedLog.projectTitle}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>นักศึกษา</span>
                      <span className={styles.detailValue}>{selectedLog.studentName} ({selectedLog.studentCode})</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>หัวข้อการประชุม</span>
                      <span className={styles.detailValue}>{selectedLog.topic}</span>
                    </div>

                    {/* P1: แสดงรายละเอียดเนื้อหา log */}
                    {selectedLog.currentProgress && (
                      <div className={styles.detailSection}>
                        <h4 className={styles.detailSectionTitle}>ความคืบหน้า</h4>
                        <p className={styles.detailSectionContent}>{selectedLog.currentProgress}</p>
                      </div>
                    )}
                    {selectedLog.problemsIssues && (
                      <div className={styles.detailSection}>
                        <h4 className={styles.detailSectionTitle}>ปัญหาที่พบ</h4>
                        <p className={styles.detailSectionContent}>{selectedLog.problemsIssues}</p>
                      </div>
                    )}
                    {selectedLog.nextActionItems && (
                      <div className={styles.detailSection}>
                        <h4 className={styles.detailSectionTitle}>สิ่งที่ต้องทำต่อไป</h4>
                        <p className={styles.detailSectionContent}>{selectedLog.nextActionItems}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p>
                    <strong>คุณกำลังจะดำเนินการกับ {selectedIds.size} รายการ</strong>
                  </p>
                )}

                {/* P4: แสดง bulk error */}
                {bulkError && (
                  <div className={styles.bulkErrorMessage}>{bulkError}</div>
                )}

                {/* แสดง note form เฉพาะ pending */}
                {selectedLog?.status === "pending" || selectedIds.size > 0 ? (
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
                ) : null}
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={handleCancel}
                  disabled={updateApproval.isPending}
                >
                  {selectedLog?.status !== "pending" && selectedIds.size === 0 ? "ปิด" : "ยกเลิก"}
                </button>
                {/* แสดงปุ่มยืนยันเฉพาะ pending */}
                {(selectedLog?.status === "pending" || selectedIds.size > 0) && (
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
                )}
              </div>
            </div>
          </div>
        )}
      </TeacherPageScaffold>
    </RoleGuard>
  );
}
