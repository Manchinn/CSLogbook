"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useAdminProjectStats } from "@/hooks/useAdminProjectStats";
import styles from "./AdminProjectWorkflowWidget.module.css";

export function AdminProjectWorkflowWidget({ enabled = true }: { enabled?: boolean }) {
  const { token } = useAuth();
  const hydrated = useHydrated();
  const { data, isLoading, error } = useAdminProjectStats(hydrated && enabled ? token : null);

  if (!enabled) return null;
  if (!hydrated) return <p>Loading project workflow...</p>;
  if (isLoading) return <p>Loading project workflow...</p>;
  if (error) return <p className={styles.error}>ไม่สามารถโหลดข้อมูล workflow โครงงานได้</p>;
  if (!data) return null;

  const cards = [
    { label: "โครงงานทั้งหมด", value: data.overview.totalProjects },
    { label: "กำลังดำเนินการ", value: data.overview.activeProjects },
    { label: "เสร็จสมบูรณ์", value: data.overview.completedProjects },
  ];

  const phaseEntries = Object.entries(data.byPhase || {});

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Project Workflow</p>
          <h2 className={styles.title}>ภาพรวมโครงงานพิเศษ</h2>
        </div>
      </header>

      <div className={styles.grid}>
        {cards.map((card) => (
          <article key={card.label} className={styles.card}>
            <p className={styles.label}>{card.label}</p>
            <p className={styles.value}>{card.value}</p>
          </article>
        ))}
      </div>

      <div className={styles.split}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.panelTitle}>จำนวนตาม Phase</p>
          </div>
          {phaseEntries.length === 0 ? (
            <p className={styles.muted}>ยังไม่มีข้อมูล phase</p>
          ) : (
            <ul className={styles.list}>
              {phaseEntries.map(([phase, value]) => (
                <li key={phase} className={styles.listItem}>
                  <span>{phase}</span>
                  <span className={styles.badge}>{value}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.panelTitle}>ผลสอบ</p>
          </div>
          <div className={styles.examGrid}>
            <div className={styles.examCard}>
              <p className={styles.label}>Project 1</p>
              <p className={styles.examLine}>รอผล: {data.examResults.project1.pending}</p>
              <p className={styles.examLine}>ผ่าน: {data.examResults.project1.pass}</p>
              <p className={styles.examLine}>ไม่ผ่าน: {data.examResults.project1.fail}</p>
            </div>
            <div className={styles.examCard}>
              <p className={styles.label}>Thesis</p>
              <p className={styles.examLine}>รอผล: {data.examResults.thesis.pending}</p>
              <p className={styles.examLine}>ผ่าน: {data.examResults.thesis.pass}</p>
              <p className={styles.examLine}>ไม่ผ่าน: {data.examResults.thesis.fail}</p>
            </div>
          </div>
        </article>
      </div>

      <div className={styles.split}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.panelTitle}>โครงงานที่ถูกบล็อก</p>
          </div>
          {data.blockedProjects.length === 0 ? (
            <p className={styles.muted}>ไม่มีโครงงานถูกบล็อก</p>
          ) : (
            <ul className={styles.list}>
              {data.blockedProjects.map((project) => (
                <li key={project.projectId ?? project.projectCode ?? Math.random()} className={styles.listItem}>
                  <span>{project.projectCode || project.projectTitle || "โครงงาน"}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.panelTitle}>ใกล้เกินกำหนด</p>
          </div>
          {data.overdueProjects.length === 0 ? (
            <p className={styles.muted}>ยังไม่มีโครงงานที่เกินกำหนด</p>
          ) : (
            <ul className={styles.list}>
              {data.overdueProjects.map((project) => (
                <li key={project.projectId ?? project.projectCode ?? Math.random()} className={styles.listItem}>
                  <span>{project.projectCode || project.projectTitle || "โครงงาน"}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
