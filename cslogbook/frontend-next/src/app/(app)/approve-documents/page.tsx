"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { TeacherPageScaffold } from "@/components/teacher/TeacherPageScaffold";
import {
  useCS05HeadQueue,
  useApproveCS05Document,
  useRejectCS05Document,
  useAcceptanceLetterHeadQueue,
  useApproveAcceptanceLetter,
  useRejectAcceptanceLetter,
} from "@/hooks/useTeacherModule";
import type { InternshipDocument } from "@/lib/services/teacherService";
import { isCs05PostApproved } from "@/constants/cs05Statuses";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import btn from "@/styles/shared/buttons.module.css";
import responsive from "@/styles/shared/responsive.module.css";
import styles from "./ApproveDocuments.module.css";

/* ─── Helpers ─── */

type TabType = "cs05" | "acceptance-letter";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    dateStyle: "medium",
  }).format(date);
}

function isApprovedForTab(status: string, tab: TabType): boolean {
  return tab === "cs05" ? isCs05PostApproved(status) : status === "approved";
}

function statusLabel(status: string, tab: TabType) {
  if (status === "pending") return "รออนุมัติ";
  if (status === "rejected") return "ปฏิเสธแล้ว";
  if (status === "cancelled") return "ยกเลิกแล้ว";
  if (isApprovedForTab(status, tab)) return "อนุมัติแล้ว";
  return status || "-";
}

function statusTagClass(status: string, tab: TabType) {
  if (status === "pending") return styles.tagPending;
  if (status === "rejected") return styles.tagRejected;
  if (isApprovedForTab(status, tab)) return styles.tagApproved;
  return "";
}

/* ─── SVG Icons (inline, no icon library) ─── */

function DocumentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function EyeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ─── Empty State Illustration ─── */

function EmptyIllustration() {
  return (
    <svg className={styles.emptyIllustration} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="15" width="60" height="80" rx="4" fill="#e5edff" stroke="#2563eb" strokeWidth="1.5" />
      <rect x="40" y="30" width="30" height="3" rx="1.5" fill="#93b4f5" />
      <rect x="40" y="40" width="40" height="3" rx="1.5" fill="#93b4f5" />
      <rect x="40" y="50" width="25" height="3" rx="1.5" fill="#93b4f5" />
      <rect x="40" y="60" width="35" height="3" rx="1.5" fill="#93b4f5" />
      <circle cx="80" cy="80" r="20" fill="#f0fdf4" stroke="#52c41a" strokeWidth="1.5" />
      <polyline points="70,80 77,87 90,74" fill="none" stroke="#52c41a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Main Component ─── */

export default function ApproveDocumentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab จาก URL query
  const tabParam = searchParams.get("tab") as TabType | null;
  const activeTab: TabType = tabParam === "acceptance-letter" ? "acceptance-letter" : "cs05";

  function setActiveTab(tab: TabType) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  }

  // Academic years (dynamic)
  const { data: academicYears = [] } = useAcademicYears();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("");
  const [semesterFilter, setSemesterFilter] = useState<string>("");

  // Drawer state
  const [selectedDocument, setSelectedDocument] = useState<InternshipDocument | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [decisionMode, setDecisionMode] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [letterType, setLetterType] = useState("");
  const [reason, setReason] = useState("");

  // Feedback
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning"; message: string } | null>(null);

  // Auto-dismiss feedback
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Build filters
  const filters = useMemo(
    () => ({
      status: statusFilter || undefined,
      academicYear: academicYearFilter || undefined,
      semester: semesterFilter || undefined,
    }),
    [statusFilter, academicYearFilter, semesterFilter],
  );

  // Hooks — fetch ทั้ง 2 tabs เพื่อแสดง pending count ใน tab badge
  const { data: cs05Documents = [], isLoading: cs05Loading, error: cs05Error } = useCS05HeadQueue(filters);
  const approveCS05 = useApproveCS05Document();
  const rejectCS05 = useRejectCS05Document();

  const {
    data: acceptanceLetterDocs = [],
    isLoading: acceptanceLoading,
    error: acceptanceError,
  } = useAcceptanceLetterHeadQueue(filters);
  const approveAcceptanceLetter = useApproveAcceptanceLetter();
  const rejectAcceptanceLetter = useRejectAcceptanceLetter();

  // Current tab data
  const currentData = activeTab === "cs05" ? cs05Documents : acceptanceLetterDocs;
  const currentLoading = activeTab === "cs05" ? cs05Loading : acceptanceLoading;
  const currentError = activeTab === "cs05" ? cs05Error : acceptanceError;

  // Stats (from current tab)
  const stats = useMemo(
    () => ({
      total: currentData.length,
      pending: currentData.filter((d) => d.status === "pending").length,
      approved: currentData.filter((d) => isApprovedForTab(d.status, activeTab)).length,
      rejected: currentData.filter((d) => d.status === "rejected").length,
    }),
    [currentData, activeTab],
  );

  // Tab badge counts (pending, across all filters — use raw data)
  const cs05PendingCount = cs05Documents.filter((d) => d.status === "pending").length;
  const acceptancePendingCount = acceptanceLetterDocs.filter((d) => d.status === "pending").length;

  // Drawer handlers
  const openDrawer = useCallback((doc: InternshipDocument) => {
    setSelectedDocument(doc);
    setDrawerOpen(true);
    setDecisionMode(null);
    setComment("");
    setLetterType("");
    setReason("");
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedDocument(null);
    setDecisionMode(null);
    setComment("");
    setLetterType("");
    setReason("");
  }, []);

  // Keyboard: Escape closes drawer
  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, closeDrawer]);

  // Submit decision
  const isSubmitting =
    approveCS05.isPending ||
    rejectCS05.isPending ||
    approveAcceptanceLetter.isPending ||
    rejectAcceptanceLetter.isPending;

  const handleSubmit = async () => {
    if (!selectedDocument || !decisionMode) return;

    try {
      if (activeTab === "cs05") {
        if (decisionMode === "approve") {
          await approveCS05.mutateAsync({
            documentId: String(selectedDocument.documentId),
            comment: comment || undefined,
            letterType: letterType || undefined,
          });
        } else {
          await rejectCS05.mutateAsync({
            documentId: String(selectedDocument.documentId),
            reason,
          });
        }
      } else {
        if (decisionMode === "approve") {
          await approveAcceptanceLetter.mutateAsync({
            documentId: String(selectedDocument.documentId),
            comment: comment || undefined,
          });
        } else {
          await rejectAcceptanceLetter.mutateAsync({
            documentId: String(selectedDocument.documentId),
            reason,
          });
        }
      }

      setFeedback({
        tone: "success",
        message: decisionMode === "approve" ? "อนุมัติเอกสารเรียบร้อยแล้ว" : "ปฏิเสธเอกสารเรียบร้อยแล้ว",
      });
      closeDrawer();
    } catch (err) {
      setFeedback({
        tone: "warning",
        message: err instanceof Error ? err.message : "ไม่สามารถดำเนินการได้",
      });
    }
  };

  // PDF view
  const handleViewPdf = (doc: InternshipDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (doc.pdfFile?.url) {
      window.open(doc.pdfFile.url, "_blank", "noopener,noreferrer");
    }
  };

  // Stat card click → set status filter
  const handleStatClick = (status: string) => {
    setStatusFilter(statusFilter === status ? "" : status);
  };

  return (
    <RoleGuard roles={["teacher"]} teacherTypes={["academic"]} requireHeadOfDepartment>
      <TeacherPageScaffold
        title="อนุมัติเอกสาร"
        description="อนุมัติหนังสือขอความอนุเคราะห์ฝึกงานและหนังสือส่งตัวนักศึกษา"
      >
        <div className={styles.page}>
          {/* Feedback Alert */}
          {feedback ? (
            <div className={`${styles.alert} ${feedback.tone === "success" ? styles.alertSuccess : styles.alertWarning}`}>
              {feedback.message}
            </div>
          ) : null}

          {/* Stats Grid */}
          {currentLoading ? (
            <div className={styles.skeletonStats}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`${styles.skeleton} ${styles.skeletonStatCard}`} />
              ))}
            </div>
          ) : (
            <div className={styles.statsGrid}>
              <div
                className={`${styles.statCard} ${styles.statCardTotal} ${statusFilter === "" ? styles.statCardActive : ""}`}
                onClick={() => handleStatClick("")}
              >
                <p className={styles.statLabel}>เอกสารทั้งหมด</p>
                <p className={styles.statValue}>{stats.total}</p>
              </div>
              <div
                className={`${styles.statCard} ${styles.statCardPending} ${statusFilter === "pending" ? styles.statCardActive : ""}`}
                onClick={() => handleStatClick("pending")}
              >
                <p className={styles.statLabel}>รออนุมัติ</p>
                <p className={styles.statValue}>{stats.pending}</p>
              </div>
              <div
                className={`${styles.statCard} ${styles.statCardApproved} ${statusFilter === "approved" ? styles.statCardActive : ""}`}
                onClick={() => handleStatClick("approved")}
              >
                <p className={styles.statLabel}>อนุมัติแล้ว</p>
                <p className={styles.statValue}>{stats.approved}</p>
              </div>
              <div
                className={`${styles.statCard} ${styles.statCardRejected} ${statusFilter === "rejected" ? styles.statCardActive : ""}`}
                onClick={() => handleStatClick("rejected")}
              >
                <p className={styles.statLabel}>ปฏิเสธแล้ว</p>
                <p className={styles.statValue}>{stats.rejected}</p>
              </div>
            </div>
          )}

          {/* Tab Bar */}
          <div className={styles.tabBar}>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "cs05" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("cs05")}
            >
              <span className={styles.tabIcon}><DocumentIcon /></span>
              หนังสือขอความอนุเคราะห์
              {cs05PendingCount > 0 && <span className={styles.tabCount}>{cs05PendingCount}</span>}
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "acceptance-letter" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("acceptance-letter")}
            >
              <span className={styles.tabIcon}><SendIcon /></span>
              หนังสือส่งตัวนักศึกษา
              {acceptancePendingCount > 0 && <span className={styles.tabCount}>{acceptancePendingCount}</span>}
            </button>
          </div>

          {/* Content Card */}
          <div className={styles.card}>
            {/* Filter Bar */}
            <div className={styles.filterBar}>
              <select
                className={styles.select}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="กรองตามสถานะ"
              >
                <option value="">ทุกสถานะ</option>
                <option value="pending">รออนุมัติ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="rejected">ปฏิเสธแล้ว</option>
              </select>
              <select
                className={styles.select}
                value={academicYearFilter}
                onChange={(e) => setAcademicYearFilter(e.target.value)}
                aria-label="กรองตามปีการศึกษา"
              >
                <option value="">ทุกปีการศึกษา</option>
                {academicYears.map((y) => (
                  <option key={y.academicYear} value={String(y.academicYear)}>
                    {y.academicYear}
                  </option>
                ))}
              </select>
              <select
                className={styles.select}
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                aria-label="กรองตามภาคเรียน"
              >
                <option value="">ทุกภาคเรียน</option>
                <option value="1">ภาคเรียนที่ 1</option>
                <option value="2">ภาคเรียนที่ 2</option>
                <option value="3">ภาคฤดูร้อน</option>
              </select>
            </div>

            {/* Table Content */}
            {currentLoading ? (
              <div className={styles.skeletonWrap}>
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className={styles.skeletonRow}>
                    <div className={`${styles.skeleton} ${styles.skeletonText}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonText}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonShort}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonBadge}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonShort}`} />
                  </div>
                ))}
              </div>
            ) : currentError ? (
              <div className={styles.errorState}>
                เกิดข้อผิดพลาด: {currentError.message || "ไม่สามารถโหลดข้อมูลได้"}
              </div>
            ) : currentData.length === 0 ? (
              <div className={styles.emptyState}>
                <EmptyIllustration />
                <p className={styles.emptyTitle}>ไม่มีเอกสารที่ต้องอนุมัติ</p>
                <p className={styles.emptySubtitle}>
                  {statusFilter
                    ? "ลองเปลี่ยนตัวกรองเพื่อดูเอกสารอื่น"
                    : activeTab === "cs05"
                      ? "ยังไม่มีหนังสือขอความอนุเคราะห์ที่ส่งเข้ามา"
                      : "ยังไม่มีหนังสือส่งตัวนักศึกษาที่ส่งเข้ามา"}
                </p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>นักศึกษา</th>
                      <th>บริษัท/หน่วยงาน</th>
                      <th className={responsive.hideOnMobile}>ปี/ภาค</th>
                      <th className={responsive.hideOnMobile}>วันที่ยื่น</th>
                      <th>สถานะ</th>
                      <th>ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((doc, index) => (
                      <tr
                        key={doc.documentId ?? `doc-${index}`}
                        onClick={() => openDrawer(doc)}
                      >
                        <td>
                          <div className={styles.studentCell}>
                            <span className={styles.studentName}>{doc.studentName}</span>
                            <span className={styles.studentCode}>{doc.studentCode || doc.studentId}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.companyCell}>{doc.companyName}</span>
                        </td>
                        <td className={responsive.hideOnMobile}>
                          <span className={styles.yearSemester}>{doc.academicYear}/{doc.semester}</span>
                        </td>
                        <td className={responsive.hideOnMobile}>
                          <span className={styles.dateCell}>{formatDateTime(doc.submittedDate || doc.submittedAt)}</span>
                        </td>
                        <td>
                          <span className={`${styles.tag} ${statusTagClass(doc.status, activeTab)}`}>
                            {statusLabel(doc.status, activeTab)}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionCell} onClick={(e) => e.stopPropagation()}>
                            {doc.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  className={`${btn.button} ${btn.buttonPrimary}`}
                                  onClick={() => {
                                    openDrawer(doc);
                                    // ต้อง defer setDecisionMode เพราะ openDrawer reset มัน
                                    setTimeout(() => setDecisionMode("approve"), 0);
                                  }}
                                >
                                  อนุมัติ
                                </button>
                                <button
                                  type="button"
                                  className={`${btn.button} ${btn.buttonDanger}`}
                                  onClick={() => {
                                    openDrawer(doc);
                                    setTimeout(() => setDecisionMode("reject"), 0);
                                  }}
                                >
                                  ปฏิเสธ
                                </button>
                              </>
                            )}
                            {doc.pdfFile?.url && (
                              <button
                                type="button"
                                className={styles.pdfButton}
                                onClick={(e) => handleViewPdf(doc, e)}
                                title="ดูเอกสาร PDF"
                              >
                                <EyeIcon />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Drawer */}
        {drawerOpen && selectedDocument ? (
          <div className={styles.drawerOverlay}>
            <div className={styles.drawerBackdrop} onClick={closeDrawer} />
            <aside className={styles.drawer}>
              <header className={styles.drawerHeader}>
                <div className={styles.drawerHeaderInfo}>
                  <h2 className={styles.drawerTitle}>
                    {activeTab === "cs05" ? "หนังสือขอความอนุเคราะห์ฝึกงาน" : "หนังสือส่งตัวนักศึกษา"}
                  </h2>
                  <p className={styles.drawerSubtitle}>
                    {selectedDocument.studentName} ({selectedDocument.studentCode || selectedDocument.studentId})
                  </p>
                </div>
                <button type="button" className={styles.drawerCloseBtn} onClick={closeDrawer} title="ปิด">
                  <CloseIcon />
                </button>
              </header>

              <div className={styles.drawerBody}>
                {/* ข้อมูลนักศึกษา */}
                <section className={styles.detailSection}>
                  <h3 className={styles.detailTitle}>ข้อมูลนักศึกษา</h3>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>ชื่อ-นามสกุล</span>
                      <span className={styles.detailValue}>{selectedDocument.studentName}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>รหัสนักศึกษา</span>
                      <span className={styles.detailValue}>{selectedDocument.studentCode || selectedDocument.studentId}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>ปีการศึกษา</span>
                      <span className={styles.detailValue}>{selectedDocument.academicYear}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>ภาคการศึกษา</span>
                      <span className={styles.detailValue}>{selectedDocument.semester}</span>
                    </div>
                  </div>
                </section>

                {/* ข้อมูลบริษัท */}
                <section className={styles.detailSection}>
                  <h3 className={styles.detailTitle}>ข้อมูลสถานประกอบการ</h3>
                  <div className={styles.detailGrid}>
                    <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                      <span className={styles.detailLabel}>บริษัท/หน่วยงาน</span>
                      <span className={styles.detailValue}>{selectedDocument.companyName}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>วันที่ยื่น</span>
                      <span className={styles.detailValue}>{formatDateTime(selectedDocument.submittedDate || selectedDocument.submittedAt)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>สถานะปัจจุบัน</span>
                      <span className={`${styles.tag} ${statusTagClass(selectedDocument.status, activeTab)}`}>
                        {statusLabel(selectedDocument.status, activeTab)}
                      </span>
                    </div>
                  </div>
                </section>

                {/* PDF View */}
                {selectedDocument.pdfFile?.url && (
                  <button
                    type="button"
                    className={styles.pdfPreviewBtn}
                    onClick={() => handleViewPdf(selectedDocument)}
                  >
                    <EyeIcon size={16} />
                    ดูเอกสาร PDF
                  </button>
                )}

                {/* Decision Section — pending only */}
                {selectedDocument.status === "pending" && (
                  <section className={styles.decisionSection}>
                    <div className={styles.decisionToggle}>
                      <button
                        type="button"
                        className={`${styles.decisionToggleBtn} ${decisionMode === "approve" ? styles.decisionToggleBtnApprove : ""}`}
                        onClick={() => setDecisionMode("approve")}
                      >
                        อนุมัติ
                      </button>
                      <button
                        type="button"
                        className={`${styles.decisionToggleBtn} ${decisionMode === "reject" ? styles.decisionToggleBtnReject : ""}`}
                        onClick={() => setDecisionMode("reject")}
                      >
                        ปฏิเสธ
                      </button>
                    </div>

                    {decisionMode === "approve" && (
                      <>
                        {activeTab === "cs05" && (
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel} htmlFor="drawer-letterType">ประเภทหนังสือ</label>
                            <select
                              id="drawer-letterType"
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
                          <label className={styles.formLabel} htmlFor="drawer-comment">หมายเหตุ</label>
                          <textarea
                            id="drawer-comment"
                            className={styles.textarea}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                            rows={3}
                          />
                        </div>
                      </>
                    )}

                    {decisionMode === "reject" && (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel} htmlFor="drawer-reason">
                          เหตุผลในการปฏิเสธ<span className={styles.required}>*</span>
                        </label>
                        <textarea
                          id="drawer-reason"
                          className={styles.textarea}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="กรุณาระบุเหตุผลในการปฏิเสธ"
                          rows={3}
                        />
                      </div>
                    )}
                  </section>
                )}

                {/* Previous Decision (non-pending) */}
                {isApprovedForTab(selectedDocument.status, activeTab) && (
                  <div className={`${styles.decisionDisplay} ${styles.decisionDisplayApproved}`}>
                    <div className={styles.decisionDisplayLabel}>อนุมัติแล้ว</div>
                    {selectedDocument.comment && (
                      <p className={styles.decisionDisplayText}>หมายเหตุ: {selectedDocument.comment}</p>
                    )}
                  </div>
                )}

                {selectedDocument.status === "rejected" && (
                  <div className={`${styles.decisionDisplay} ${styles.decisionDisplayRejected}`}>
                    <div className={styles.decisionDisplayLabel}>ปฏิเสธแล้ว</div>
                    {selectedDocument.rejectionReason && (
                      <p className={styles.decisionDisplayText}>เหตุผล: {selectedDocument.rejectionReason}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              {selectedDocument.status === "pending" && decisionMode && (
                <div className={styles.drawerFooter}>
                  <button
                    type="button"
                    className={btn.button}
                    onClick={closeDrawer}
                    disabled={isSubmitting}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    className={`${btn.button} ${decisionMode === "approve" ? btn.buttonPrimary : btn.buttonDangerFilled}`}
                    onClick={handleSubmit}
                    disabled={isSubmitting || (decisionMode === "reject" && !reason.trim())}
                  >
                    {isSubmitting
                      ? "กำลังดำเนินการ..."
                      : decisionMode === "approve"
                        ? "ยืนยันการอนุมัติ"
                        : "ยืนยันการปฏิเสธ"}
                  </button>
                </div>
              )}
            </aside>
          </div>
        ) : null}
      </TeacherPageScaffold>
    </RoleGuard>
  );
}
