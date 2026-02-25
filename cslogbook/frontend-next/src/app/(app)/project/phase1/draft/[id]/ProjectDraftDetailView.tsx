"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { getProjectById, type ProjectDetail, type ProjectMemberSummary } from "@/lib/services/studentService";
import styles from "./draftDetail.module.css";

const STATUS_LABEL: Record<string, string> = {
  draft:            "ร่าง",
  advisor_assigned: "รอเริ่มต้น",
  in_progress:      "กำลังดำเนินการ",
  completed:        "เสร็จสมบูรณ์",
  archived:         "เก็บถาวร",
};

const TYPE_LABEL: Record<string, string> = {
  govern:  "ความร่วมมือกับหน่วยงานรัฐ",
  private: "ความร่วมมือกับภาคเอกชน",
  research:"โครงงานวิจัย",
};

const EXAM_LABEL: Record<string, { text: string; tone: string }> = {
  passed: { text: "หัวข้อผ่าน",   tone: "positive" },
  failed: { text: "หัวข้อไม่ผ่าน", tone: "danger"   },
};

export default function ProjectDraftDetailView() {
  const { token } = useAuth();
  const hydrated  = useHydrated();
  const params    = useParams<{ id: string }>();
  const router    = useRouter();
  const projectId = Number(params?.id);

  const [project,    setProject]    = useState<ProjectDetail | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!token || !projectId || Number.isNaN(projectId)) return;
    try {
      if (silent) setRefreshing(true); else setLoading(true);
      setError(null);
      const data = await getProjectById(token, projectId);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      if (silent) setRefreshing(false); else setLoading(false);
    }
  }, [token, projectId]);

  useEffect(() => {
    if (hydrated) void load();
  }, [hydrated, load]);

  if (!hydrated || loading) {
    return (
      <div className={styles.page}>
        <p className={styles.lead}>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={styles.page}>
        <div className={styles.callout}>
          <p className={styles.calloutTitle}>{error ?? "ไม่พบข้อมูลโครงงาน"}</p>
          <div className={styles.btnRow}>
            <button className={styles.secondaryButton} type="button" onClick={() => void load()}>ลองใหม่</button>
            <button className={styles.secondaryButton} type="button" onClick={() => router.back()}>ย้อนกลับ</button>
          </div>
        </div>
      </div>
    );
  }

  const statusLabel = STATUS_LABEL[project.status ?? ""] ?? (project.status ?? "-");
  const examMeta    = project.examResult ? EXAM_LABEL[project.examResult] : null;
  const tracks      = (project as unknown as { tracks?: string[] }).tracks ?? [];

  return (
    <div className={styles.page}>
      {/* Actions bar */}
      <div className={styles.btnRow} style={{ marginBottom: 24 }}>
        <button className={styles.secondaryButton} type="button" onClick={() => router.back()}>
          ย้อนกลับ
        </button>
        <Link
          href={`/project/phase1/topic-submit?pid=${project.projectId}`}
          className={styles.primaryButton}
        >
          แก้ไข
        </Link>
        <button
          className={styles.secondaryButton}
          type="button"
          disabled={refreshing}
          onClick={() => void load(true)}
        >
          {refreshing ? "กำลังรีเฟรช..." : "รีเฟรช"}
        </button>
      </div>

      {/* Header */}
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Project Draft Detail</p>
          <h1 className={styles.title}>{project.projectNameTh ?? "ไม่มีชื่อ"}</h1>
          {project.projectNameEn && <p className={styles.lead}>{project.projectNameEn}</p>}
        </div>
        <div className={styles.heroMeta}>
          <span className={styles.badge}>{statusLabel}</span>
          {examMeta && (
            <span className={`${styles.badge} ${examMeta.tone === "positive" ? styles.badgePositive : styles.badgeDanger}`}>
              {examMeta.text}
            </span>
          )}
        </div>
      </header>

      {/* Details */}
      <section className={styles.sectionCard}>
        <p className={styles.panelKicker}>ข้อมูลโครงงาน</p>
        <dl className={styles.descList}>
          <dt>ประเภท</dt>
          <dd>{TYPE_LABEL[project.projectType ?? ""] ?? (project.projectType ?? "-")}</dd>

          <dt>หมวดหมู่ (Tracks)</dt>
          <dd>{tracks.length > 0 ? tracks.join(", ") : "-"}</dd>

          <dt>อาจารย์ที่ปรึกษา</dt>
          <dd>{project.advisorId ? `อาจารย์ #${project.advisorId}` : "ยังไม่เลือก"}</dd>

          <dt>อาจารย์ที่ปรึกษาร่วม</dt>
          <dd>{project.coAdvisorId ? `อาจารย์ #${project.coAdvisorId}` : "-"}</dd>

          {(project as unknown as { objective?: string }).objective && (
            <>
              <dt>วัตถุประสงค์</dt>
              <dd>{(project as unknown as { objective?: string }).objective}</dd>
            </>
          )}
          {(project as unknown as { background?: string }).background && (
            <>
              <dt>ที่มาและความสำคัญ</dt>
              <dd>{(project as unknown as { background?: string }).background}</dd>
            </>
          )}
          {(project as unknown as { scope?: string }).scope && (
            <>
              <dt>ขอบเขต</dt>
              <dd>{(project as unknown as { scope?: string }).scope}</dd>
            </>
          )}
          {(project as unknown as { expectedOutcome?: string }).expectedOutcome && (
            <>
              <dt>ผลลัพธ์ที่คาดหวัง</dt>
              <dd>{(project as unknown as { expectedOutcome?: string }).expectedOutcome}</dd>
            </>
          )}
          {(project as unknown as { benefit?: string }).benefit && (
            <>
              <dt>ประโยชน์</dt>
              <dd>{(project as unknown as { benefit?: string }).benefit}</dd>
            </>
          )}
        </dl>
      </section>

      {/* Members */}
      <section className={styles.sectionCard}>
        <p className={styles.panelKicker}>สมาชิก</p>
        <h2 className={styles.sectionTitle}>สมาชิกในโครงงาน</h2>
        {(project.members ?? []).length === 0 ? (
          <p className={styles.formHint}>ไม่มีสมาชิก</p>
        ) : (
          <div className={styles.memberGrid}>
            {(project.members ?? []).map((m: ProjectMemberSummary) => (
              <div key={m.studentId} className={styles.memberCard}>
                <p className={styles.memberName}>{m.name ?? m.studentCode ?? "-"}</p>
                <p className={styles.memberCode}>{m.studentCode}</p>
                {(m.totalCredits != null || m.majorCredits != null) && (
                  <p className={styles.memberHint}>
                    หน่วยกิตรวม {m.totalCredits ?? "-"} | ในสาขา {m.majorCredits ?? "-"}
                  </p>
                )}
              </div>
            ))}
            {(project.members ?? []).length === 1 && (
              <div className={`${styles.memberCard} ${styles.memberCardWarning}`}>
                ยังไม่มีสมาชิกคนที่สอง
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
