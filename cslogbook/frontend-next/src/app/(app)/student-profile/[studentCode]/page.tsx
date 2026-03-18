"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useStudentDocumentsOverview } from "@/hooks/useStudentDocuments";
import { useWorkflowTimeline } from "@/hooks/useWorkflowTimeline";
import { WorkflowTimeline } from "@/components/workflow/WorkflowTimeline";
import type { StudentProfile } from "@/lib/services/studentService";
import { updateStudentContactInfo, updateStudentCredits } from "@/lib/services/studentService";
import { changePasswordInit, confirmPasswordChange } from "@/lib/api/authService";
import {
  viewDocument,
  downloadDocument,
  downloadReferralLetter,
  downloadCertificate,
  previewCertificate,
  type StudentDocumentOverviewItem,
} from "@/lib/services/documentService";
import styles from "./page.module.css";

type Tone = "positive" | "danger" | "muted";

function toneClass(tone: Tone | "neutral" | "warning") {
  if (tone === "positive") return styles.badgePositive;
  if (tone === "danger") return styles.badgeDanger;
  if (tone === "warning") return styles.badgeWarning;
  if (tone === "neutral") return styles.badgeNeutral;
  return styles.badgeMuted;
}

function formatStudentYear(value: StudentProfile["studentYear"]) {
  if (typeof value === "number") return value;
  if (value && typeof value === "object") return value.year ?? "-";
  return "-";
}

function buildEligibilityBadge(eligible?: boolean | null): { tone: Tone; label: string } {
  if (eligible === true) return { tone: "positive", label: "ผ่านเกณฑ์" };
  if (eligible === false) return { tone: "danger", label: "ยังไม่ผ่าน" };
  return { tone: "muted", label: "ไม่มีข้อมูล" };
}

function normalizeEmail(email?: string | null) {
  const value = (email ?? "").trim();
  if (!value) return null;

  const lowered = value.toLowerCase();
  if (lowered === "undefined" || lowered === "null" || lowered === "none") return null;
  if (lowered.startsWith("undefined@") || lowered.startsWith("null@")) return null;
  if (!value.includes("@")) return null;

  return value;
}

function statusToneClass(status: string) {
  if (["approved", "ready", "downloaded", "completed"].includes(status)) return styles.badgePositive;
  if (["pending", "pending_approval", "not_requested"].includes(status)) return styles.badgeWarning;
  if (["rejected", "not_ready"].includes(status)) return styles.badgeMuted;
  return styles.badgeNeutral;
}

function DocumentOverviewList({
  documents,
  onView,
  onDownload,
  loading,
  error,
}: {
  documents: StudentDocumentOverviewItem[];
  onView: (doc: StudentDocumentOverviewItem) => void;
  onDownload: (doc: StudentDocumentOverviewItem) => void;
  loading: boolean;
  error: string | null;
}) {
  if (error) return <p className={styles.error}>{error}</p>;
  if (loading) return <p className={styles.muted}>กำลังโหลดเอกสาร...</p>;
  if (!documents.length) return <p className={styles.muted}>ยังไม่มีเอกสาร</p>;

  return (
    <ul className={styles.docList}>
      {documents.map((doc) => (
        <li key={doc.type} className={styles.docItem}>
          <div>
            <p className={styles.docName}>{doc.name}</p>
            <span className={`${styles.badge} ${styles.badgeSmall} ${statusToneClass(doc.status)}`}>
              {doc.statusLabel}
            </span>
          </div>
          <div className={styles.docActions}>
            {doc.canView ? (
              <button type="button" className={styles.secondaryButton} onClick={() => onView(doc)}>
                ดูตัวอย่าง
              </button>
            ) : null}
            {doc.canDownload ? (
              <button type="button" className={styles.primaryButton} onClick={() => onDownload(doc)}>
                ดาวน์โหลด
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function StudentProfilePage() {
  const params = useParams<{ studentCode?: string | string[] }>();
  const { user, token, signOut } = useAuth();
  const hydrated = useHydrated();
  const router = useRouter();

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    phoneNumber: "",
    classroom: "",
  });
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);

  const [isEditingCredits, setIsEditingCredits] = useState(false);
  const [creditsForm, setCreditsForm] = useState({ totalCredits: 0, majorCredits: 0 });
  const [creditsError, setCreditsError] = useState<string | null>(null);
  const [creditsSaving, setCreditsSaving] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStep, setPasswordStep] = useState<"init" | "otp">("init");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
    otp: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"education" | "timeline" | "documents">("education");

  const rawStudentCode = Array.isArray(params?.studentCode) ? params?.studentCode?.[0] : params?.studentCode;
  const resolvedStudentCode = useMemo(() => {
    if (rawStudentCode === "me" || !rawStudentCode) {
      return user?.studentCode ?? "";
    }
    return rawStudentCode;
  }, [rawStudentCode, user?.studentCode]);

  const canUseStudentEndpoints = user?.role === "student";

  const profileQuery = useStudentProfile(resolvedStudentCode || null, token, hydrated);
  const documentsQuery = useStudentDocumentsOverview(token, hydrated && canUseStudentEndpoints);
  // Timeline ต้องใช้ studentId (number PK) ไม่ใช่ studentCode (string)
  const timelineStudentId = user?.studentId ?? user?.id ?? null;
  const {
    data: internshipTimeline,
    isLoading: internshipTimelineLoading,
    error: internshipTimelineError,
  } = useWorkflowTimeline(token, "internship", timelineStudentId, hydrated && canUseStudentEndpoints);
  const {
    data: projectTimeline,
    isLoading: projectTimelineLoading,
    error: projectTimelineError,
  } = useWorkflowTimeline(token, "project", timelineStudentId, hydrated && canUseStudentEndpoints);

  const handleOpenEdit = () => {
    if (!profileQuery.data) return;
    setContactForm({
      phoneNumber: profileQuery.data.phoneNumber ?? "",
      classroom: profileQuery.data.classroom ?? "",
    });
    setContactError(null);
    setContactSuccess(null);
    setIsEditingContact(true);
  };

  const handleSaveContact = async () => {
    if (!token || !resolvedStudentCode) return;
    setContactSaving(true);
    setContactError(null);
    try {
      await updateStudentContactInfo(resolvedStudentCode, token, contactForm);
      await profileQuery.refetch();
      setIsEditingContact(false);
      setContactSuccess("บันทึกข้อมูลติดต่อเรียบร้อยแล้ว");
    } catch (error) {
      setContactError(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    } finally {
      setContactSaving(false);
    }
  };

  const handleStartPasswordChange = async () => {
    if (!token) return;
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError("ยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePasswordInit(token, passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordStep("otp");
      setPasswordSuccess("ส่ง OTP ไปยังอีเมลแล้ว กรุณากรอกรหัสยืนยัน");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "ไม่สามารถส่ง OTP ได้");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleOpenCreditsEdit = () => {
    if (!profileQuery.data) return;
    setCreditsForm({
      totalCredits: Number(profileQuery.data.totalCredits ?? 0),
      majorCredits: Number(profileQuery.data.majorCredits ?? 0),
    });
    setCreditsError(null);
    setIsEditingCredits(true);
  };

  const handleCancelCredits = () => {
    setIsEditingCredits(false);
    setCreditsError(null);
  };

  const handleSaveCredits = async () => {
    if (!token || !resolvedStudentCode) return;
    setCreditsSaving(true);
    setCreditsError(null);
    try {
      await updateStudentCredits(resolvedStudentCode, token, creditsForm);
      await profileQuery.refetch();
      setIsEditingCredits(false);
    } catch (error) {
      setCreditsError(error instanceof Error ? error.message : "บันทึกหน่วยกิตไม่สำเร็จ");
    } finally {
      setCreditsSaving(false);
    }
  };

  const handleConfirmPassword = async () => {
    if (!token) return;
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      await confirmPasswordChange(token, passwordForm.otp);
      setPasswordSuccess("เปลี่ยนรหัสผ่านสำเร็จ กำลังออกจากระบบ...");
      setTimeout(() => {
        setIsChangingPassword(false);
        signOut();
        router.push("/login");
      }, 800);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "ยืนยันรหัสผ่านไม่สำเร็จ");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!hydrated) {
    return <p className={styles.muted}>กำลังเตรียมข้อมูล...</p>;
  }

  if (!resolvedStudentCode) {
    return <p className={styles.error}>ไม่พบรหัสนักศึกษาใน URL</p>;
  }

  if (profileQuery.isLoading) {
    return <p className={styles.muted}>กำลังโหลดข้อมูลโปรไฟล์...</p>;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <p className={styles.error}>ไม่สามารถโหลดข้อมูลนักศึกษาได้</p>;
  }

  const profile = profileQuery.data;
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "ไม่ระบุชื่อ";
  const year = formatStudentYear(profile.studentYear);

  const internshipEligibility = buildEligibilityBadge(
    profile.eligibility?.internship?.eligible ?? profile.isEligibleInternship
  );
  const projectEligibility = buildEligibilityBadge(
    profile.eligibility?.project?.eligible ?? profile.isEligibleProject
  );

  const displayEmail = normalizeEmail(profile.email) ?? normalizeEmail(user?.email) ?? "ไม่ระบุ";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const documents = documentsQuery.data?.documents ?? [];

  const handleViewDoc = async (doc: StudentDocumentOverviewItem) => {
    if (!token) return;
    try {
      let blob: Blob;
      if (doc.downloadType === "certificate") {
        blob = await previewCertificate(token);
      } else if (doc.documentId) {
        blob = await viewDocument(doc.documentId, token);
      } else {
        return;
      }
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      alert("ไม่สามารถเปิดเอกสารได้");
    }
  };

  const handleDownloadDoc = async (doc: StudentDocumentOverviewItem) => {
    if (!token) return;
    try {
      let blob: Blob;
      if (doc.downloadType === "referral" && doc.documentId) {
        blob = await downloadReferralLetter(doc.documentId, token);
      } else if (doc.downloadType === "certificate") {
        blob = await downloadCertificate(token);
      } else if (doc.documentId) {
        blob = await downloadDocument(doc.documentId, token);
      } else {
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${doc.name || "document"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("ไม่สามารถดาวน์โหลดเอกสารได้");
    }
  };

  return (
    <div className={styles.page}>
      <ContactEditModal
        open={isEditingContact}
        onClose={() => setIsEditingContact(false)}
        onSave={handleSaveContact}
        saving={contactSaving}
        error={contactError}
        form={contactForm}
        setForm={setContactForm}
      />

      <PasswordChangeModal
        open={isChangingPassword}
        onClose={() => setIsChangingPassword(false)}
        onStart={handleStartPasswordChange}
        onConfirm={handleConfirmPassword}
        step={passwordStep}
        saving={passwordSaving}
        error={passwordError}
        success={passwordSuccess}
        form={passwordForm}
        setForm={setPasswordForm}
      />

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <section className={`${styles.card} ${styles.profileCard}`}>
            <div className={styles.avatar}>{initials || "?"}</div>
            <h1 className={styles.profileName}>{name}</h1>
            <p className={styles.profileCode}>{profile.studentCode}</p>
            <div className={styles.profileBadges}>
              <span className={`${styles.badge} ${toneClass("neutral")}`}>ชั้นปี {year}</span>
              <span className={`${styles.badge} ${toneClass(internshipEligibility.tone)}`}>
                {internshipEligibility.label}
              </span>
              <span className={`${styles.badge} ${toneClass(projectEligibility.tone)}`}>
                {projectEligibility.label}
              </span>
            </div>
          </section>

          <article className={`${styles.card} ${styles.cardContact}`}>
            <header className={styles.cardHeader}>
              <div>
                <p className={styles.cardEyebrow}>Contact</p>
                <h3 className={styles.cardTitle}>ข้อมูลติดต่อ</h3>
              </div>
            </header>
            <dl className={styles.detailList}>
              <div className={`${styles.detailRow} ${styles.detailRowStacked}`}>
                <dt>อีเมล</dt>
                <dd>{displayEmail}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>เบอร์โทร</dt>
                <dd>{profile.phoneNumber || "ไม่ระบุ"}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>ห้องเรียน</dt>
                <dd>{profile.classroom || "ไม่ระบุ"}</dd>
              </div>
            </dl>
            {canUseStudentEndpoints && resolvedStudentCode === (user?.studentCode ?? "") ? (
              <div className={`${styles.actionRow} ${styles.actionRowBottom}`}>
                <button type="button" className={styles.linkButton} onClick={handleOpenEdit}>
                  แก้ไขข้อมูลติดต่อ
                </button>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => {
                    setIsChangingPassword(true);
                    setPasswordStep("init");
                    setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "", otp: "" });
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                >
                  เปลี่ยนรหัสผ่าน
                </button>
              </div>
            ) : null}
            {contactSuccess ? <p className={styles.success}>{contactSuccess}</p> : null}
          </article>
        </aside>

        <main className={styles.main}>
          <nav className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "education" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("education")}
            >
              ข้อมูลการศึกษา
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "timeline" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("timeline")}
            >
              ไทม์ไลน์
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "documents" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("documents")}
            >
              เอกสาร
            </button>
          </nav>

          <section className={styles.grid}>
            {activeTab === "education" ? (
              <article className={`${styles.card} ${styles.cardCredits}`}>
              <header className={styles.cardHeader}>
                <div>
                  <p className={styles.cardEyebrow}>Credits</p>
                  <h3 className={styles.cardTitle}>ข้อมูลการศึกษา</h3>
                </div>
                {canUseStudentEndpoints && resolvedStudentCode === (user?.studentCode ?? "") ? (
                  isEditingCredits ? (
                    <div className={styles.actionRow}>
                      <button type="button" className={styles.secondaryButton} onClick={handleCancelCredits} disabled={creditsSaving}>
                        ยกเลิก
                      </button>
                      <button type="button" className={styles.primaryButton} onClick={handleSaveCredits} disabled={creditsSaving}>
                        {creditsSaving ? "กำลังบันทึก..." : "บันทึกหน่วยกิต"}
                      </button>
                    </div>
                  ) : (
                    <button type="button" className={styles.primaryButton} onClick={handleOpenCreditsEdit}>
                      แก้ไขหน่วยกิต
                    </button>
                  )
                ) : null}
              </header>
              <div className={styles.statGrid}>
                <div className={styles.statBlock}>
                  <p className={styles.statLabel}>หน่วยกิตรวมสะสม</p>
                  {isEditingCredits ? (
                    <div className={styles.creditInputRow}>
                      <input
                        type="number"
                        min={0}
                        className={styles.creditInput}
                        value={creditsForm.totalCredits}
                        onChange={(e) => setCreditsForm((prev) => ({ ...prev, totalCredits: Number(e.target.value) }))}
                      />
                      <span className={styles.creditUnit}>หน่วยกิต</span>
                    </div>
                  ) : (
                    <p className={styles.statValue}>{profile.totalCredits ?? 0} หน่วยกิต</p>
                  )}
                </div>
                <div className={styles.statBlock}>
                  <p className={styles.statLabel}>หน่วยกิตภาควิชา</p>
                  {isEditingCredits ? (
                    <div className={styles.creditInputRow}>
                      <input
                        type="number"
                        min={0}
                        className={styles.creditInput}
                        value={creditsForm.majorCredits}
                        onChange={(e) => setCreditsForm((prev) => ({ ...prev, majorCredits: Number(e.target.value) }))}
                      />
                      <span className={styles.creditUnit}>หน่วยกิต</span>
                    </div>
                  ) : (
                    <p className={styles.statValue}>{profile.majorCredits ?? 0} หน่วยกิต</p>
                  )}
                </div>
              </div>
              {isEditingCredits && (
                <div className={styles.policyNote}>
                  <strong>กรุณากรอกหน่วยกิตตามข้อมูลจริงจากระบบลงทะเบียน</strong>
                  <p>การกรอกข้อมูลไม่ตรงกับความเป็นจริงอาจส่งผลต่อสิทธิ์การลงทะเบียนฝึกงาน/โครงงานของนักศึกษาเอง ระบบจะบันทึกประวัติการแก้ไขทุกครั้ง</p>
                </div>
              )}
              {creditsError ? <p className={styles.error}>{creditsError}</p> : null}
            </article>
            ) : null}

            {activeTab === "timeline" ? (
              <div className={styles.timelineSection}>
                <WorkflowTimeline
                  title="ความคืบหน้าฝึกงาน"
                  subtitle="แสดงขั้นตอนทั้งหมดตั้งแต่ลงทะเบียนจนฝึกงานเสร็จ"
                  timeline={internshipTimeline}
                  isLoading={internshipTimelineLoading}
                  error={internshipTimelineError ? "โหลดข้อมูลไม่สำเร็จ" : null}
                />

                <WorkflowTimeline
                  title="ความคืบหน้าโครงงาน"
                  subtitle="แสดงขั้นตอนทั้งหมดตั้งแต่เริ่มจนโครงงานเสร็จ"
                  timeline={projectTimeline}
                  isLoading={projectTimelineLoading}
                  error={projectTimelineError ? "โหลดข้อมูลไม่สำเร็จ" : null}
                />
              </div>
            ) : null}

            {activeTab === "documents" && canUseStudentEndpoints ? (
              <article className={`${styles.card} ${styles.cardDocuments}`}>
              <header className={styles.cardHeader}>
                <div>
                  <p className={styles.cardEyebrow}>Documents</p>
                  <h3 className={styles.cardTitle}>เอกสารฝึกงาน</h3>
                </div>
              </header>
              <DocumentOverviewList
                documents={documents}
                onView={handleViewDoc}
                onDownload={handleDownloadDoc}
                loading={documentsQuery.isLoading}
                error={documentsQuery.isError ? "ไม่สามารถโหลดเอกสารได้" : null}
              />
            </article>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}

function ContactEditModal({
  open,
  onClose,
  onSave,
  saving,
  error,
  form,
  setForm,
}: {
  open: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
  error: string | null;
  form: { phoneNumber: string; classroom: string };
  setForm: (next: { phoneNumber: string; classroom: string }) => void;
}) {
  if (!open) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>แก้ไขข้อมูลติดต่อ</h3>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <label className={styles.field}>
          <span>เบอร์โทร</span>
          <input
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            placeholder="08x-xxx-xxxx"
          />
        </label>

        <label className={styles.field}>
          <span>ห้องเรียน</span>
          <input
            type="text"
            value={form.classroom}
            onChange={(e) => setForm({ ...form, classroom: e.target.value })}
            placeholder="เช่น SC-xxxx"
          />
        </label>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={saving}>
            ยกเลิก
          </button>
          <button type="button" className={styles.primaryButton} onClick={onSave} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordChangeModal({
  open,
  onClose,
  onStart,
  onConfirm,
  step,
  saving,
  error,
  success,
  form,
  setForm,
}: {
  open: boolean;
  onClose: () => void;
  onStart: () => Promise<void>;
  onConfirm: () => Promise<void>;
  step: "init" | "otp";
  saving: boolean;
  error: string | null;
  success: string | null;
  form: { currentPassword: string; newPassword: string; confirmNewPassword: string; otp: string };
  setForm: (next: { currentPassword: string; newPassword: string; confirmNewPassword: string; otp: string }) => void;
}) {
  if (!open) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>เปลี่ยนรหัสผ่าน</h3>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {step === "init" ? (
          <>
            <label className={styles.field}>
              <span>รหัสผ่านปัจจุบัน</span>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>รหัสผ่านใหม่</span>
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>ยืนยันรหัสผ่านใหม่</span>
              <input
                type="password"
                value={form.confirmNewPassword}
                onChange={(e) => setForm({ ...form, confirmNewPassword: e.target.value })}
              />
            </label>
          </>
        ) : (
          <label className={styles.field}>
            <span>OTP ที่ได้รับทางอีเมล</span>
            <input
              type="text"
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value })}
              placeholder="กรอกรหัส 6 หลัก"
            />
          </label>
        )}

        {error ? <p className={styles.error}>{error}</p> : null}
        {success ? <p className={styles.success}>{success}</p> : null}

        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={saving}>
            ยกเลิก
          </button>
          {step === "init" ? (
            <button type="button" className={styles.primaryButton} onClick={onStart} disabled={saving}>
              {saving ? "กำลังส่ง OTP..." : "ส่ง OTP"}
            </button>
          ) : (
            <button type="button" className={styles.primaryButton} onClick={onConfirm} disabled={saving}>
              {saving ? "กำลังยืนยัน..." : "ยืนยันรหัส"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
