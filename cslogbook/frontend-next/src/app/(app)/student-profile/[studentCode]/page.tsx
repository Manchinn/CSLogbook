"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentDeadlines } from "@/hooks/useStudentDeadlines";
import { useStudentInternshipStatus } from "@/hooks/useStudentInternshipStatus";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useStudentProjectStatus } from "@/hooks/useStudentProjectStatus";
import type { StudentDeadline, StudentProfile } from "@/lib/services/studentService";
import { updateStudentContactInfo } from "@/lib/services/studentService";
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

export default function StudentProfilePage() {
  const params = useParams<{ studentCode?: string | string[] }>();
  const { user, token } = useAuth();
  const hydrated = useHydrated();

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    phoneNumber: "",
    classroom: "",
  });
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSaving, setContactSaving] = useState(false);

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

  const handleOpenEdit = () => {
    if (!profileQuery.data) return;
    setContactForm({
      phoneNumber: profileQuery.data.phoneNumber ?? "",
      classroom: profileQuery.data.classroom ?? "",
    });
    setContactError(null);
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
    } catch (error) {
      setContactError(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    } finally {
      setContactSaving(false);
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

      <section className={styles.hero}>
        <div>
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
        <article className={styles.card}>
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

        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <div>
              <p className={styles.cardEyebrow}>Contact</p>
              <h3 className={styles.cardTitle}>ข้อมูลติดต่อ</h3>
            </div>
            {canUseStudentEndpoints && resolvedStudentCode === (user?.studentCode ?? "") ? (
              <button type="button" className={styles.linkButton} onClick={handleOpenEdit}>
                แก้ไขข้อมูลติดต่อ
              </button>
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
        </article>

        <article className={styles.card}>
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

        <article className={styles.card}>
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
          <article className={styles.card}>
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
