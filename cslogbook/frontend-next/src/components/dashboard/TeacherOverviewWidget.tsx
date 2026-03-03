"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTeacherOverview } from "@/hooks/useTeacherOverview";
import { useHydrated } from "@/hooks/useHydrated";
import type {
  TeacherDashboardData,
  TeacherMeetingLogItem,
  TeacherDeadline,
  TeacherMeeting,
  TeacherQuickAction,
} from "@/lib/services/teacherService";
import { WidgetState } from "@/components/dashboard/WidgetState";
import styles from "./TeacherOverviewWidget.module.css";

type TeacherOverviewWidgetProps = {
  enabled: boolean;
  data?: TeacherDashboardData | null;
  isLoading?: boolean;
  error?: unknown;
  skipFetch?: boolean;
};

export function TeacherOverviewWidget({
  enabled,
  data,
  isLoading,
  error,
  skipFetch = false,
}: TeacherOverviewWidgetProps) {
  const hydrated = useHydrated();
  const { token } = useAuth();
  const shouldFetch = enabled && hydrated && !skipFetch && !data;
  const { data: fetchedData, isLoading: fetchedLoading, error: fetchedError } = useTeacherOverview(
    token,
    shouldFetch
  );

  const resolvedData = data ?? fetchedData;
  const resolvedLoading = data ? false : fetchedLoading;
  const resolvedError = data ? null : fetchedError;

  const pendingMeetingItems: TeacherMeetingLogItem[] = resolvedData?.queues.meetingLogs.items.slice(0, 3) ?? [];
  const deadlines: TeacherDeadline[] = resolvedData?.deadlines.slice(0, 3) ?? [];
  const upcomingMeetings: TeacherMeeting[] = resolvedData?.upcomingMeetings.slice(0, 3) ?? [];
  const quickActions: TeacherQuickAction[] = resolvedData?.quickActions ?? [];
  const fallbackActions: TeacherQuickAction[] = [
    {
      key: "meetingApprovals",
      label: "บันทึกการพบ",
      description: "ตรวจสอบบันทึกการพบจากนักศึกษา",
      path: "/teacher/meeting-approvals",
    },
    {
      key: "documentApprovals",
      label: "เอกสารที่รออนุมัติ",
      description: "ติดตามคำขอและไฟล์ที่รออนุมัติ",
      path: "/approve-documents",
    },
    {
      key: "deadlines",
      label: "กำหนดส่งสำคัญ",
      description: "ดูปฏิทินเส้นตายที่เกี่ยวข้อง",
      path: "/teacher/deadlines/calendar",
    },
  ];
  const resolvedActions = quickActions.length > 0 ? quickActions : fallbackActions;

  const cards = [
    { label: "นักศึกษาทั้งหมด", value: resolvedData?.advisees.total ?? 0 },
    { label: "ฝึกงานกำลังดำเนินการ", value: resolvedData?.advisees.internshipInProgress ?? 0 },
    { label: "โครงงานกำลังดำเนินการ", value: resolvedData?.advisees.projectInProgress ?? 0 },
    { label: "โปรเจกต์ที่ใช้งานอยู่", value: resolvedData?.projects.active ?? 0 },
  ];

  return (
    <WidgetState
      enabled={enabled}
      hydrated={hydrated}
      isLoading={isLoading ?? resolvedLoading}
      error={error ?? resolvedError}
      loadingFallback={<p>กำลังโหลดข้อมูล...</p>}
      errorFallback={<p className={styles.error}>ไม่สามารถโหลดข้อมูลได้</p>}
    >
      <section className={styles.wrapper}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>ภาพรวมการควบคุม</p>
            <h2 className={styles.title}>{resolvedData?.teacher.name || "แดชบอร์ดอาจารย์"}</h2>
            <p className={styles.subtitle}>{resolvedData?.teacher.position || "อาจารย์"}</p>
          </div>
          <div className={styles.badges}>
            <span className={styles.chip}>
              บันทึกการพบที่รอ: {resolvedData?.queues.meetingLogs.pending ?? 0}
            </span>
            <span className={styles.chip}>เอกสารรอ: {resolvedData?.queues.documents.pending ?? 0}</span>
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
              <span className={styles.count}>{resolvedData?.queues.meetingLogs.pending ?? 0}</span>
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
                {resolvedActions.map((action) => (
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
    </WidgetState>
  );
}
