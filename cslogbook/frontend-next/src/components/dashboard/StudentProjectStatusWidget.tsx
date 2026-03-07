"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentProjectStatus } from "@/hooks/useStudentProjectStatus";
import { labelStatus } from "@/lib/utils/statusLabels";
import styles from "./StudentProjectStatusWidget.module.css";

type StudentProjectStatusWidgetProps = {
  enabled: boolean;
};

function formatLabel(th?: string | null, en?: string | null) {
  if (th && en) return `${th} / ${en}`;
  return th || en || "-";
}

export function StudentProjectStatusWidget({ enabled }: StudentProjectStatusWidgetProps) {
  const hydrated = useHydrated();
  const { token } = useAuth();
  const { data, isLoading, error } = useStudentProjectStatus(token, enabled && hydrated);

  if (!enabled) return null;

  const project = data?.project;
  const workflow = data?.workflow;

  if (!hydrated || isLoading) {
    return (
      <section className={styles.wrapper} aria-busy>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.error}>โหลดสถานะโครงงานไม่สำเร็จ</div>
      </section>
    );
  }

  if (!project) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.empty}>ยังไม่มีโครงงานในระบบ เริ่มสร้างโครงงานหรือเชิญเพื่อนร่วมกลุ่มเพื่อแสดงสถานะที่นี่</div>
      </section>
    );
  }

  const phaseChip = workflow?.currentPhase || project.status || "draft";
  const projectName = formatLabel(project.projectNameTh, project.projectNameEn);
  const memberCount = project.members?.length ?? 0;

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>โครงงาน</p>
          <h3 className={styles.title}>สถานะโครงงาน</h3>
        </div>
        <div className={styles.badges}>
          <span className={styles.chip}>ระยะ: {labelStatus(phaseChip)}</span>
          {workflow?.isBlocked ? <span className={`${styles.chip} ${styles.chipNegative}`}>ถูกบล็อก</span> : null}
          {workflow?.isComplete ? <span className={`${styles.chip} ${styles.chipPositive}`}>เสร็จสิ้น</span> : null}
        </div>
      </div>

      <div className={styles.grid}>
        <article className={styles.card}>
          <p className={styles.cardTitle}>ข้อมูลโครงงาน</p>
          <dl className={styles.metaList}>
            <div className={styles.metaRow}>
              <dt>ชื่อโครงงาน</dt>
              <dd>{projectName}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>รหัสโครงงาน</dt>
              <dd>{project.projectCode || "-"}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>ภาคการศึกษา</dt>
              <dd>
                {project.academicYear ?? "-"}/{project.semester ?? "-"}
              </dd>
            </div>
            <div className={styles.metaRow}>
              <dt>อาจารย์ที่ปรึกษา</dt>
              <dd>{project.advisorName || "ยังไม่ระบุ"}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>สมาชิก</dt>
              <dd>{memberCount} คน</dd>
            </div>
          </dl>
        </article>

        <article className={styles.card}>
          <p className={styles.cardTitle}>ความคืบหน้า</p>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>สถานะโครงงาน</span>
              <strong className={styles.statValue}>{labelStatus(project.status, "ร่าง")}</strong>
              <p className={styles.statMeta}>บันทึกล่าสุด: {workflow?.lastActivityAt ? new Date(workflow.lastActivityAt).toLocaleDateString("th-TH") : "-"}</p>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>สิทธิ์ยื่นสอบหัวข้อ</span>
              <strong className={styles.statValue}>{workflow?.canSubmitTopicDefense ? "พร้อม" : "ยัง"}</strong>
              <p className={styles.statMeta}>สอบหัวข้อ: {labelStatus(workflow?.topicExamResult)}</p>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>สิทธิ์ยื่นสอบปริญญานิพนธ์</span>
              <strong className={styles.statValue}>{workflow?.canSubmitThesisDefense ? "พร้อม" : "ยัง"}</strong>
              <p className={styles.statMeta}>สอบปริญญานิพนธ์: {labelStatus(workflow?.thesisExamResult)}</p>
            </div>
          </div>
          {workflow?.blockReason ? <p className={styles.blockNote}>สาเหตุบล็อก: {workflow.blockReason}</p> : null}
        </article>
      </div>
    </section>
  );
}
