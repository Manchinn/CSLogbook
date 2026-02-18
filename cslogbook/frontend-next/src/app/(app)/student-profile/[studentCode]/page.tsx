"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentDeadlines } from "@/hooks/useStudentDeadlines";
import { useStudentInternshipStatus } from "@/hooks/useStudentInternshipStatus";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useStudentProjectStatus } from "@/hooks/useStudentProjectStatus";
import { useStudentDocuments } from "@/hooks/useStudentDocuments";
import type { StudentDeadline, StudentProfile } from "@/lib/services/studentService";
import { updateStudentContactInfo } from "@/lib/services/studentService";
import { changePasswordInit, confirmPasswordChange } from "@/lib/api/authService";
import { downloadDocument, viewDocument, type DocumentItem } from "@/lib/services/documentService";
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

function formatStatus(status?: string | null) {
  if (!status) return "ยังไม่มีสถานะ";
  const normalized = status.replace(/_/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function DeadlineList({ deadlines }: { deadlines: StudentDeadline[] }) {
  if (!deadlines.length) {
    return <p className={styles.muted}>ยังไม่มีกำหนดส่งในช่วงนี้</p>;
  }

  return (
    <ul className={styles.deadlineList}>
      {deadlines.map((deadline) => (
        <li key={deadline.id} className={styles.deadlineItem}>
          <div>
            <p className={styles.deadlineName}>{deadline.name}</p>
            <p className={styles.deadlineMeta}>{new Date(deadline.deadlineAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", hour12: false })}</p>
          </div>
          <span className={`${styles.badge} ${styles.badgeWarning}`}>
            {deadline.deadlineType ? deadline.deadlineType : "กำหนดส่ง"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function DocumentList({
  documents,
  onView,
  onDownload,
  loading,
  error,
}: {
  documents: DocumentItem[];
  onView: (doc: DocumentItem) => void;
  onDownload: (doc: DocumentItem) => void;
  loading: boolean;
  error: string | null;
}) {
  if (error) return <p className={styles.error}>{error}</p>;
  if (loading) return <p className={styles.muted}>กำลังโหลดเอกสาร...</p>;
  if (!documents.length) return <p className={styles.muted}>ยังไม่มีเอกสาร</p>;

  return (
    <ul className={styles.docList}>
      {documents.map((doc) => {
        const id = doc.documentId ?? doc.id ?? "";
        const name = doc.name || doc.documentName || "ไม่ระบุ";
        return (
          <li key={`${name}-${id}`} className={styles.docItem}>
            <div>
              <p className={styles.docName}>{name}</p>
              <p className={styles.docMeta}>{doc.status || "ไม่ระบุสถานะ"}</p>
            </div>
            <div className={styles.docActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => onView(doc)} disabled={!id}>
                ดูตัวอย่าง
              </button>
              <button type="button" className={styles.primaryButton} onClick={() => onDownload(doc)} disabled={!id}>
                ดาวน์โหลด
              </button>
            </div>
          </li>
        );
      })}
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

  const rawStudentCode = Array.isArray(params?.studentCode) ? params?.studentCode?.[0] : params?.studentCode;
  const resolvedStudentCode = useMemo(() => {
    if (rawStudentCode === "me" || !rawStudentCode) {
      return user?.studentCode ?? "";
    }
    return rawStudentCode;
  }, [rawStudentCode, user?.studentCode]);

  const canUseStudentEndpoints = user?.role === "student";

  const profileQuery = useStudentProfile(resolvedStudentCode || null, token, hydrated);
  const deadlinesQuery = useStudentDeadlines(token, 14, hydrated && canUseStudentEndpoints);
  const internshipQuery = useStudentInternshipStatus(token, hydrated && canUseStudentEndpoints);
  const projectQuery = useStudentProjectStatus(token, hydrated && canUseStudentEndpoints);
  const documentsQuery = useStudentDocuments(token, hydrated && canUseStudentEndpoints, { type: "internship", lettersOnly: 1 });

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

  const internshipStatus = formatStatus(
    profile.internshipStatus || internshipQuery.data?.summary?.status || (profile.isEnrolledInternship ? "in_progress" : "")
  );
  const projectStatus = formatStatus(
    profile.projectStatus || projectQuery.data?.workflow?.projectStatus || projectQuery.data?.workflow?.currentPhase
  );

  const deadlines = deadlinesQuery.data ?? [];
  const documents = documentsQuery.data?.documents ?? [];

  const handleViewDoc = async (doc: DocumentItem) => {
    if (!token) return;
    const id = doc.documentId ?? doc.id;
    if (!id) return;
    try {
      const blob = await viewDocument(id, token);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      alert("ไม่สามารถเปิดเอกสารได้");
    }
  };

  const handleDownloadDoc = async (doc: DocumentItem) => {
    if (!token) return;
    const id = doc.documentId ?? doc.id;
    if (!id) return;
    try {
      const blob = await downloadDocument(id, token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.name || doc.documentName || "document"}.pdf`;
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

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Student record</p>
          <h1 className={styles.title}>{name}</h1>
          <p className={styles.subtitle}>รหัสนักศึกษา {profile.studentCode}</p>
        </div>
        <div className={styles.heroBadges}>
          <span className={`${styles.badge} ${toneClass("neutral")}`}>ชั้นปี {year}</span>
          <span className={`${styles.badge} ${toneClass(internshipEligibility.tone)}`}>
            ฝึกงาน: {internshipEligibility.label}
          </span>
          <span className={`${styles.badge} ${toneClass(projectEligibility.tone)}`}>
            โครงงาน: {projectEligibility.label}
          </span>
        </div>
      </section>

      <section className={styles.grid}>
        <article className={`${styles.card} ${styles.cardCredits}`}>
          <header className={styles.cardHeader}>
            <div>
              <p className={styles.cardEyebrow}>Credits</p>
              <h3 className={styles.cardTitle}>สรุปหน่วยกิต</h3>
            </div>
          </header>
          <div className={styles.statGrid}>
            <div className={styles.statBlock}>
              <p className={styles.statLabel}>รวมทั้งหมด</p>
              <p className={styles.statValue}>{profile.totalCredits ?? 0}</p>
            </div>
            <div className={styles.statBlock}>
              <p className={styles.statLabel}>วิชาเอก</p>
              <p className={styles.statValue}>{profile.majorCredits ?? 0}</p>
            </div>
            <div className={styles.statBlock}>
              <p className={styles.statLabel}>เกณฑ์ฝึกงาน</p>
              <p className={styles.statValue}>{profile.requirements?.internshipBaseCredits ?? "—"}</p>
            </div>
            <div className={styles.statBlock}>
              <p className={styles.statLabel}>เกณฑ์โครงงาน</p>
              <p className={styles.statValue}>
                {profile.requirements?.projectBaseCredits ?? "—"} / วิชาเอก {profile.requirements?.projectMajorBaseCredits ?? "—"}
              </p>
            </div>
          </div>
        </article>

        <article className={`${styles.card} ${styles.cardContact}`}>
          <header className={styles.cardHeader}>
            <div>
              <p className={styles.cardEyebrow}>Contact</p>
              <h3 className={styles.cardTitle}>ข้อมูลติดต่อ</h3>
            </div>
            {canUseStudentEndpoints && resolvedStudentCode === (user?.studentCode ?? "") ? (
              <div className={styles.actionRow}>
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
          </header>
          <dl className={styles.detailList}>
            <div className={styles.detailRow}>
              <dt>อีเมล</dt>
              <dd>{profile.email || "ไม่ระบุ"}</dd>
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
          {contactSuccess ? <p className={styles.success}>{contactSuccess}</p> : null}
        </article>

        <article className={`${styles.card} ${styles.cardInternship} ${styles.statusCard}`}>
          <header className={styles.cardHeader}>
            <div>
              <p className={styles.cardEyebrow}>Internship</p>
              <h3 className={styles.cardTitle}>สถานะฝึกงาน</h3>
            </div>
            <span className={`${styles.badge} ${toneClass(internshipEligibility.tone)}`}>
              {internshipEligibility.label}
            </span>
          </header>
          <p className={styles.statusText}>{internshipStatus}</p>
          {profile.eligibility?.internship?.message ? (
            <p className={styles.note}>{profile.eligibility.internship.message}</p>
          ) : null}
        </article>

        <article className={`${styles.card} ${styles.cardProject} ${styles.statusCard}`}>
          <header className={styles.cardHeader}>
            <div>
              <p className={styles.cardEyebrow}>Project</p>
              <h3 className={styles.cardTitle}>สถานะโครงงาน</h3>
            </div>
            <span className={`${styles.badge} ${toneClass(projectEligibility.tone)}`}>
              {projectEligibility.label}
            </span>
          </header>
          <p className={styles.statusText}>{projectStatus}</p>
          {profile.eligibility?.project?.message ? (
            <p className={styles.note}>{profile.eligibility.project.message}</p>
          ) : null}
        </article>

        {canUseStudentEndpoints ? (
          <article className={`${styles.card} ${styles.cardDeadlines}`}>
            <header className={styles.cardHeader}>
              <div>
                <p className={styles.cardEyebrow}>Deadlines</p>
                <h3 className={styles.cardTitle}>กำหนดส่งที่ใกล้ถึง</h3>
              </div>
              <span className={`${styles.badge} ${toneClass("neutral")}`}>14 วัน</span>
            </header>
            {deadlinesQuery.isLoading ? (
              <p className={styles.muted}>กำลังโหลดกำหนดส่ง...</p>
            ) : deadlinesQuery.isError ? (
              <p className={styles.error}>โหลดกำหนดส่งไม่สำเร็จ</p>
            ) : (
              <DeadlineList deadlines={deadlines.slice(0, 5)} />
            )}
          </article>
        ) : null}

        {canUseStudentEndpoints ? (
          <article className={`${styles.card} ${styles.cardDocuments}`}>
            <header className={styles.cardHeader}>
              <div>
                <p className={styles.cardEyebrow}>Documents</p>
                <h3 className={styles.cardTitle}>เอกสารฝึกงาน</h3>
              </div>
            </header>
            <DocumentList
              documents={documents}
              onView={handleViewDoc}
              onDownload={handleDownloadDoc}
              loading={documentsQuery.isLoading}
              error={documentsQuery.isError ? "ไม่สามารถโหลดเอกสารได้" : null}
            />
          </article>
        ) : null}
      </section>
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
