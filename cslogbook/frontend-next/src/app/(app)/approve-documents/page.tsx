"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { TeacherPageScaffold } from "@/components/teacher/TeacherPageScaffold";
import { PDFPreviewModal } from "@/components/teacher/PDFPreviewModal";
import {
  useCS05HeadQueue,
  useApproveCS05Document,
  useRejectCS05Document,
  useAcceptanceLetterHeadQueue,
  useApproveAcceptanceLetter,
  useRejectAcceptanceLetter,
} from "@/hooks/useTeacherModule";
import type { InternshipDocument } from "@/lib/services/teacherService";
import styles from "./ApproveDocuments.module.css";

type TabType = "cs05" | "acceptance-letter";

export default function ApproveDocumentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("cs05");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("");
  const [semesterFilter, setSemesterFilter] = useState<string>("");

  // Modal state
  const [selectedDocument, setSelectedDocument] = useState<InternshipDocument | null>(null);
  const [modalMode, setModalMode] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [letterType, setLetterType] = useState("");
  const [reason, setReason] = useState("");

  // PDF Preview Modal state
  const [pdfModal, setPdfModal] = useState<{ isOpen: boolean; url: string; fileName: string }>({
    isOpen: false,
    url: "",
    fileName: "",
  });

  // Build filters
  const filters = {
    status: statusFilter || undefined,
    academicYear: academicYearFilter || undefined,
    semester: semesterFilter || undefined,
  };

  // CS05 hooks
  const { data: cs05Documents = [], isLoading: cs05Loading, error: cs05Error } = useCS05HeadQueue(
    filters,
    activeTab === "cs05"
  );
  const approveCS05 = useApproveCS05Document();
  const rejectCS05 = useRejectCS05Document();

  // Acceptance Letter hooks
  const {
    data: acceptanceLetterDocs = [],
    isLoading: acceptanceLoading,
    error: acceptanceError,
  } = useAcceptanceLetterHeadQueue(filters, activeTab === "acceptance-letter");
  const approveAcceptanceLetter = useApproveAcceptanceLetter();
  const rejectAcceptanceLetter = useRejectAcceptanceLetter();

  const currentData = activeTab === "cs05" ? cs05Documents : acceptanceLetterDocs;
  const currentLoading = activeTab === "cs05" ? cs05Loading : acceptanceLoading;
  const currentError = activeTab === "cs05" ? cs05Error : acceptanceError;

  const handleApprove = (document: InternshipDocument) => {
    setSelectedDocument(document);
    setModalMode("approve");
    setComment("");
    setLetterType("");
    setReason("");
  };

  const handleReject = (document: InternshipDocument) => {
    setSelectedDocument(document);
    setModalMode("reject");
    setComment("");
    setLetterType("");
    setReason("");
  };

  const handleViewPDF = (url: string, fileName: string) => {
    setPdfModal({ isOpen: true, url, fileName });
  };

  const handleClosePDF = () => {
    setPdfModal({ isOpen: false, url: "", fileName: "" });
  };

  const handleSubmit = async () => {
    if (!selectedDocument || !modalMode) return;

    try {
      if (activeTab === "cs05") {
        if (modalMode === "approve") {
          await approveCS05.mutateAsync({
            documentId: String(selectedDocument.id),
            comment: comment || undefined,
            letterType: letterType || undefined,
          });
        } else {
          await rejectCS05.mutateAsync({
            documentId: String(selectedDocument.id),
            reason,
          });
        }
      } else {
        if (modalMode === "approve") {
          await approveAcceptanceLetter.mutateAsync({
            documentId: String(selectedDocument.id),
            comment: comment || undefined,
          });
        } else {
          await rejectAcceptanceLetter.mutateAsync({
            documentId: String(selectedDocument.id),
            reason,
          });
        }
      }

      handleCancel();
    } catch (err) {
      console.error("Failed to submit decision:", err);
    }
  };

  const handleCancel = () => {
    setModalMode(null);
    setSelectedDocument(null);
    setComment("");
    setLetterType("");
    setReason("");
  };

  const isSubmitting =
    approveCS05.isPending ||
    rejectCS05.isPending ||
    approveAcceptanceLetter.isPending ||
    rejectAcceptanceLetter.isPending;

  return (
    <RoleGuard roles={["teacher"]} teacherTypes={["academic"]} requireHeadOfDepartment>
      <TeacherPageScaffold
        title="อนุมัติเอกสาร"
        description="อนุมัติหนังสือขอความอนุเคราะห์ (CS05) และหนังสือส่งตัวนักศึกษาจากหัวหน้าภาค"
      >
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "cs05" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("cs05")}
          >
            หนังสือขอความอนุเคราะห์ (CS05)
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "acceptance-letter" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("acceptance-letter")}
          >
            หนังสือส่งตัวนักศึกษา
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label htmlFor="status">สถานะ</label>
            <select
              id="status"
              className={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              <option value="pending">รออนุมัติ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ปฏิเสธแล้ว</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="academicYear">ปีการศึกษา</label>
            <select
              id="academicYear"
              className={styles.select}
              value={academicYearFilter}
              onChange={(e) => setAcademicYearFilter(e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              <option value="2567">2567</option>
              <option value="2566">2566</option>
              <option value="2565">2565</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="semester">ภาคการศึกษา</label>
            <select
              id="semester"
              className={styles.select}
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3 (ภาคฤดูร้อน)</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {currentLoading ? (
          <div className={styles.loadingState}>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        ) : currentError ? (
          <div className={styles.errorState}>
            <p>เกิดข้อผิดพลาด: {currentError.message || "ไม่สามารถโหลดข้อมูลได้"}</p>
          </div>
        ) : currentData.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📄</div>
            <p className={styles.emptyMessage}>ไม่มีเอกสารที่ต้องอนุมัติในขณะนี้</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>นักศึกษา</th>
                  <th>บริษัท/หน่วยงาน</th>
                  <th>ปี/ภาค</th>
                  <th>วันที่ยื่น</th>
                  <th>เอกสาร</th>
                  <th>สถานะ</th>
                  <th>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((doc, index) => (
                  <tr key={doc.id ?? `doc-${index}`}>
                    <td>
                      <div className={styles.studentInfo}>
                        <div className={styles.studentName}>{doc.studentName}</div>
                        <div className={styles.studentId}>{doc.studentId}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.companyName}>{doc.companyName}</div>
                    </td>
                    <td>
                      <div className={styles.academicInfo}>
                        {doc.academicYear}/{doc.semester}
                      </div>
                    </td>
                    <td>{new Date(doc.submittedDate).toLocaleDateString("th-TH")}</td>
                    <td>
                      {doc.pdfFile ? (
                        <button
                          type="button"
                          className={styles.btnViewDoc}
                          onClick={() => handleViewPDF(doc.pdfFile!.url, doc.pdfFile!.filename)}
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
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                          ดูเอกสาร
                        </button>
                      ) : (
                        <span className={styles.noDocument}>-</span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge-${doc.status}`]}`}>
                        {doc.status === "pending" && "รออนุมัติ"}
                        {doc.status === "approved" && "อนุมัติแล้ว"}
                        {doc.status === "rejected" && "ปฏิเสธแล้ว"}
                      </span>
                    </td>
                    <td>
                      {doc.status === "pending" && (
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnApprove}`}
                            onClick={() => handleApprove(doc)}
                          >
                            อนุมัติ
                          </button>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnReject}`}
                            onClick={() => handleReject(doc)}
                          >
                            ปฏิเสธ
                          </button>
                        </div>
                      )}
                      {doc.status !== "pending" && (
                        <div className={styles.statusNote}>
                          {doc.comment && <div className={styles.commentText}>หมายเหตุ: {doc.comment}</div>}
                          {doc.rejectionReason && (
                            <div className={styles.rejectionText}>เหตุผล: {doc.rejectionReason}</div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {modalMode && selectedDocument && (
          <div className={styles.modal}>
            <div className={styles.modalBackdrop} onClick={handleCancel} />
            <div className={styles.modalContent}>
              <h2 className={styles.modalTitle}>
                {modalMode === "approve"
                  ? activeTab === "cs05"
                    ? "อนุมัติหนังสือ CS05"
                    : "อนุมัติหนังสือส่งตัวนักศึกษา"
                  : activeTab === "cs05"
                    ? "ปฏิเสธหนังสือ CS05"
                    : "ปฏิเสธหนังสือส่งตัวนักศึกษา"}
              </h2>
              <div className={styles.modalBody}>
                <p>
                  <strong>นักศึกษา:</strong> {selectedDocument.studentName} ({selectedDocument.studentId})
                </p>
                <p>
                  <strong>บริษัท/หน่วยงาน:</strong> {selectedDocument.companyName}
                </p>
                <p>
                  <strong>ปีการศึกษา/ภาคการศึกษา:</strong> {selectedDocument.academicYear}/
                  {selectedDocument.semester}
                </p>

                {modalMode === "approve" ? (
                  <>
                    {activeTab === "cs05" && (
                      <div className={styles.formGroup}>
                        <label htmlFor="letterType">ประเภทหนังสือ</label>
                        <select
                          id="letterType"
                          className={styles.select}
                          value={letterType}
                          onChange={(e) => setLetterType(e.target.value)}
                        >
                          <option value="">เลือกประเภทหนังสือ (ถ้ามี)</option>
                          <option value="standard">หนังสือมาตรฐาน</option>
                          <option value="special">หนังสือพิเศษ</option>
                        </select>
                      </div>
                    )}
                    <div className={styles.formGroup}>
                      <label htmlFor="comment">หมายเหตุ</label>
                      <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                        className={styles.textarea}
                        rows={4}
                      />
                    </div>
                  </>
                ) : (
                  <div className={styles.formGroup}>
                    <label htmlFor="reason">
                      เหตุผลในการปฏิเสธ <span className={styles.required}>*</span>
                    </label>
                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="กรุณาระบุเหตุผลในการปฏิเสธ"
                      className={styles.textarea}
                      rows={4}
                    />
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${modalMode === "approve" ? styles.btnPrimary : styles.btnDanger}`}
                  onClick={handleSubmit}
                  disabled={isSubmitting || (modalMode === "reject" && !reason.trim())}
                >
                  {isSubmitting
                    ? "กำลังดำเนินการ..."
                    : modalMode === "approve"
                      ? "ยืนยันการอนุมัติ"
                      : "ยืนยันการปฏิเสธ"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Preview Modal */}
        <PDFPreviewModal
          isOpen={pdfModal.isOpen}
          onClose={handleClosePDF}
          pdfUrl={pdfModal.url}
          fileName={pdfModal.fileName}
          title={activeTab === "cs05" ? "หนังสือขอความอนุเคราะห์ (CS05)" : "หนังสือส่งตัวนักศึกษา"}
        />
      </TeacherPageScaffold>
    </RoleGuard>
  );
}
