"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTeacherOverview } from "@/hooks/useTeacherOverview";
import { useHydrated } from "@/hooks/useHydrated";
import type { TeacherMeetingLogItem, TeacherDeadline, TeacherMeeting, TeacherQuickAction } from "@/lib/services/teacherService";
import styles from "./TeacherOverviewWidget.module.css";

export function TeacherOverviewWidget({ enabled }: { enabled: boolean }) {
  const hydrated = useHydrated();
  const { token } = useAuth();
  const { data, isLoading, error } = useTeacherOverview(token, enabled && hydrated);

  if (!enabled) {
    return null;
  }

  if (!hydrated) {
    return <p>Loading teacher overview...</p>;
  }

  if (isLoading) {
    return <p>Loading teacher overview...</p>;
  }

  if (error) {
    return <p className={styles.error}>ไม่สามารถโหลด teacher widget ได้</p>;
  }

  const pendingMeetingItems: TeacherMeetingLogItem[] = data?.queues.meetingLogs.items.slice(0, 3) ?? [];
  const deadlines: TeacherDeadline[] = data?.deadlines.slice(0, 3) ?? [];
  const upcomingMeetings: TeacherMeeting[] = data?.upcomingMeetings.slice(0, 3) ?? [];
  const quickActions: TeacherQuickAction[] = data?.quickActions ?? [];

  const cards = [
    { label: "นักศึกษาทั้งหมด", value: data?.advisees.total ?? 0 },
    { label: "ฝึกงานกำลังดำเนินการ", value: data?.advisees.internshipInProgress ?? 0 },
    { label: "โครงงานกำลังดำเนินการ", value: data?.advisees.projectInProgress ?? 0 },
    { label: "โปรเจกต์ที่ active", value: data?.projects.active ?? 0 },
  ];

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Advisor Overview</p>
          <h2 className={styles.title}>{data?.teacher.name || "Teacher Dashboard"}</h2>
          <p className={styles.subtitle}>{data?.teacher.position || "อาจารย์"}</p>
        </div>
        <div className={styles.badges}>
          <span className={styles.chip}>บันทึกการพบที่รอ: {data?.queues.meetingLogs.pending ?? 0}</span>
          <span className={styles.chip}>เอกสารรอ: {data?.queues.documents.pending ?? 0}</span>
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
            <p className={styles.panelTitle}>บันทึกการพบที่รออนุมัติ</p>
            <span className={styles.count}>{data?.queues.meetingLogs.pending ?? 0}</span>
          </div>
          {pendingMeetingItems.length === 0 ? (
            <p className={styles.muted}>ยังไม่มีคิวรออนุมัติ</p>
          ) : (
            <ul className={styles.list}>
              {pendingMeetingItems.map((item) => (
                <li key={item.logId ?? `${item.projectCode}-${item.meetingId}`} className={styles.listItem}>
                  <div>
                    <p className={styles.listTitle}>{item.meetingTitle || "บันทึกการพบ"}</p>
                    <p className={styles.listMeta}>
                      {item.projectCode || ""} • {item.students.map((s) => s.studentCode).join(", ") || "ไม่ระบุ"}
                    </p>
                  </div>
                  <span className={styles.badgeLight}>รอ {item.pendingDays} วัน</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.panelTitle}>กำหนดส่งที่เกี่ยวข้อง</p>
          </div>
          {deadlines.length === 0 ? (
            <p className={styles.muted}>ยังไม่พบกำหนดส่งที่เกี่ยวข้อง</p>
          ) : (
            <ul className={styles.list}>
              {deadlines.map((deadline) => (
                <li key={deadline.id} className={styles.listItem}>
                  <div>
                    <p className={styles.listTitle}>{deadline.name}</p>
                    <p className={styles.listMeta}>{deadline.relatedTo ?? "-"}</p>
                  </div>
                  <span className={styles.badgeLight}>เหลือ {deadline.daysLeft ?? "-"} วัน</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className={styles.split}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.panelTitle}>การนัดหมายที่ใกล้ถึง</p>
          </div>
          {upcomingMeetings.length === 0 ? (
            <p className={styles.muted}>ยังไม่มีนัดหมายใหม่</p>
          ) : (
            <ul className={styles.list}>
              {upcomingMeetings.map((meeting) => (
                <li key={meeting.meetingId ?? meeting.meetingTitle ?? "meeting"} className={styles.listItem}>
                  <div>
                    <p className={styles.listTitle}>{meeting.meetingTitle || "การนัดหมาย"}</p>
                    <p className={styles.listMeta}>{meeting.projectCode || "โครงงาน"}</p>
                  </div>
                  <span className={styles.badgeLight}>อีก {meeting.daysLeft ?? "-"} วัน</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.panelTitle}>ลัดไปยังงานสำคัญ</p>
          </div>
          {quickActions.length === 0 ? (
            <p className={styles.muted}>ยังไม่มี quick action</p>
          ) : (
            <div className={styles.actions}>
              {quickActions.map((action) => (
                <a key={action.key} href={action.path} className={styles.actionButton}>
                  <span>
                    <strong>{action.label}</strong>
                    <span className={styles.actionDesc}>{action.description}</span>
                  </span>
                  {typeof action.pendingCount === "number" ? (
                    <span className={styles.badge}>{action.pendingCount}</span>
                  ) : null}
                </a>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
