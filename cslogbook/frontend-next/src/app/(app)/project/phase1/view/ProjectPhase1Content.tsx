"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentProjectStatus } from "@/hooks/useStudentProjectStatus";
import { useStudentDeadlines } from "@/hooks/useStudentDeadlines";
import { useWorkflowTimeline } from "@/hooks/useWorkflowTimeline";
import { WorkflowTimeline } from "@/components/workflow/WorkflowTimeline";
import styles from "./phase1.module.css";

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return dateFormatter.format(d);
}

type ProjectPhase1ContentProps = {
  legacyHref?: string | null;
};

export default function ProjectPhase1Content({ legacyHref }: ProjectPhase1ContentProps) {
  const { token, user } = useAuth();
  const hydrated = useHydrated();
  const studentId = user?.studentId ?? user?.id;
  const queriesEnabled = hydrated && Boolean(token) && Boolean(studentId);

  const {
    data: projectStatus,
    isLoading: projectLoading,
    error: projectError,
  } = useStudentProjectStatus(token, queriesEnabled);

  const {
    data: timeline,
    isLoading: timelineLoading,
    error: timelineError,
  } = useWorkflowTimeline(token, "project", studentId ?? null, queriesEnabled);

  const { data: deadlines } = useStudentDeadlines(token, 30, queriesEnabled);

  const filteredDeadlines = useMemo(() => {
    if (!deadlines) return [];
    return deadlines
      .filter((d) => (d.relatedTo || "").toLowerCase().includes("project"))
      .slice(0, 4);
  }, [deadlines]);

  const project = projectStatus?.project;
  const workflow = projectStatus?.workflow;

  const cards = [
    {
      label: "สถานะ Phase",
      value: workflow?.currentPhase ?? project?.status ?? "ไม่พบข้อมูล",
      hint: workflow?.isBlocked ? `ถูกบล็อก: ${workflow.blockReason || ""}` : "พร้อมดำเนินการ",
    },
    {
      label: "สิทธิ์ยื่นสอบหัวข้อ",
      value: workflow?.canSubmitTopicDefense ? "พร้อม" : "ยังไม่ครบ",
      hint: workflow?.topicExamResult ? `ผลสอบหัวข้อ: ${workflow.topicExamResult}` : "รอผลสอบหรือ log meeting",
    },
    {
      label: "สมาชิกในกลุ่ม",
      value: project?.members?.length ? `${project.members.length} คน` : "ยังไม่ตั้งกลุ่ม",
      hint: project?.projectCode ? `รหัสโครงงาน ${project.projectCode}` : "สร้างโครงงานเพื่อรับรหัส",
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Project 1</p>
          <h1 className={styles.title}>ขั้นตอนโครงงานพิเศษ (Phase 1)</h1>
          <p className={styles.lead}>ติดตามความคืบหน้า, สิทธิ์ยื่นสอบ, และ timeline โครงงานพิเศษ 1</p>
        </div>
        {legacyHref ? (
          <a className={styles.legacyLink} href={legacyHref} rel="noopener noreferrer">
            เปิดหน้าระบบเดิม
          </a>
        ) : null}
      </header>

      <section className={styles.grid}>
        {cards.map((card) => (
          <article key={card.label} className={styles.card}>
            <p className={styles.cardLabel}>{card.label}</p>
            <p className={styles.cardValue}>{card.value}</p>
            <p className={styles.cardHint}>{card.hint}</p>
          </article>
        ))}
      </section>

      <section className={styles.split}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelKicker}>รายละเอียดโครงงาน</p>
              <h2 className={styles.panelTitle}>{project?.projectNameTh || project?.projectNameEn || "ยังไม่ตั้งชื่อ"}</h2>
            </div>
          </div>

          {projectError ? <p className={styles.error}>โหลดข้อมูลโครงงานไม่สำเร็จ</p> : null}
          {projectLoading ? <div className={styles.skeleton} /> : null}

          {project ? (
            <dl className={styles.metaGrid}>
              <div>
                <dt>ชื่อ (EN)</dt>
                <dd>{project.projectNameEn || "-"}</dd>
              </div>
              <div>
                <dt>ภาคการศึกษา</dt>
                <dd>
                  {project.academicYear ?? "-"}/{project.semester ?? "-"}
                </dd>
              </div>
              <div>
                <dt>อาจารย์ที่ปรึกษา</dt>
                <dd>{project.advisorId ? `ID ${project.advisorId}` : "ยังไม่ระบุ"}</dd>
              </div>
              <div>
                <dt>อัปเดตล่าสุด</dt>
                <dd>{workflow?.lastActivityAt ? formatDate(workflow.lastActivityAt) : "-"}</dd>
              </div>
            </dl>
          ) : (
            !projectLoading && <p className={styles.cardHint}>ยังไม่มีโครงงานในระบบ</p>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelKicker}>เดดไลน์</p>
              <h2 className={styles.panelTitle}>กำหนดส่งที่เกี่ยวข้อง</h2>
            </div>
          </div>
          {filteredDeadlines.length === 0 ? (
            <p className={styles.cardHint}>ยังไม่พบกำหนดส่งที่เกี่ยวข้องใน 30 วัน</p>
          ) : (
            <ul className={styles.deadlineList}>
              {filteredDeadlines.map((deadline) => (
                <li key={deadline.id} className={styles.deadlineItem}>
                  <div>
                    <p className={styles.deadlineName}>{deadline.name}</p>
                    <p className={styles.deadlineMeta}>
                      {deadline.relatedTo ?? "-"} • เหลือ {deadline.daysLeft ?? "-"} วัน
                    </p>
                  </div>
                  <span className={styles.deadlineDate}>{formatDate(deadline.deadlineAt ?? deadline.deadlineDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <WorkflowTimeline
        title="Timeline โครงงานพิเศษ 1"
        subtitle="สอดคล้องกับ workflow state และผลสอบ"
        timeline={timeline}
        isLoading={timelineLoading}
        error={timelineError ? "โหลด timeline ไม่สำเร็จ" : null}
      />
    </div>
  );
}
