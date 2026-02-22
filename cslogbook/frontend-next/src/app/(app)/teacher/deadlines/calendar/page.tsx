"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { TeacherPageScaffold } from "@/components/teacher/TeacherPageScaffold";
import { useTeacherImportantDeadlines } from "@/hooks/useTeacherModule";
import styles from "./TeacherCalendar.module.css";

export default function TeacherDeadlinesCalendarPage() {
  const { data: deadlines = [], isLoading, error } = useTeacherImportantDeadlines();

  const getDaysLeft = (dateString: string) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineStatus = (daysLeft: number) => {
    if (daysLeft < 0) return "overdue";
    if (daysLeft === 0) return "today";
    if (daysLeft <= 7) return "urgent";
    if (daysLeft <= 14) return "soon";
    return "normal";
  };

  if (isLoading) {
    return (
      <RoleGuard roles={["teacher"]} teacherTypes={["academic"]}>
        <TeacherPageScaffold
          title="ปฏิทินกำหนดการ"
          description="ดูปฏิทินกำหนดการและ deadline สำคัญของภาควิชา"
        >
          <div className={styles.loadingState}>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        </TeacherPageScaffold>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard roles={["teacher"]} teacherTypes={["academic"]}>
        <TeacherPageScaffold
          title="ปฏิทินกำหนดการ"
          description="ดูปฏิทินกำหนดการและ deadline สำคัญของภาควิชา"
        >
          <div className={styles.errorState}>
            <p>เกิดข้อผิดพลาด: {error.message || "ไม่สามารถโหลดข้อมูลได้"}</p>
          </div>
        </TeacherPageScaffold>
      </RoleGuard>
    );
  }

  if (deadlines.length === 0) {
    return (
      <RoleGuard roles={["teacher"]} teacherTypes={["academic"]}>
        <TeacherPageScaffold
          title="ปฏิทินกำหนดการ"
          description="ดูปฏิทินกำหนดการและ deadline สำคัญของภาควิชา"
        >
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📅</div>
            <p className={styles.emptyMessage}>ไม่มีกำหนดการที่ต้องติดตามในขณะนี้</p>
          </div>
        </TeacherPageScaffold>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard roles={["teacher"]} teacherTypes={["academic"]}>
      <TeacherPageScaffold
        title="ปฏิทินกำหนดการ"
        description="ดูปฏิทินกำหนดการและ deadline สำคัญของภาควิชา"
      >
        <div className={styles.deadlinesList}>
          {deadlines.map((deadline) => {
            const daysLeft = getDaysLeft(deadline.dueAt || "");
            const status = getDeadlineStatus(daysLeft);

            return (
              <div key={deadline.id} className={`${styles.deadlineCard} ${styles[`status-${status}`]}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.deadlineTitle}>{deadline.name}</h3>
                  <span className={`${styles.badge} ${styles[`badge-${status}`]}`}>
                    {status === "overdue" && "เลยกำหนด"}
                    {status === "today" && "วันนี้"}
                    {status === "urgent" && "เร่งด่วน"}
                    {status === "soon" && "ใกล้ถึง"}
                    {status === "normal" && "ปกติ"}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.dateSection}>
                    <div className={styles.dateLabel}>วันที่</div>
                    <div className={styles.dateValue}>
                      {new Date(deadline.dueAt || "").toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  <div className={styles.daysLeftSection}>
                    <div className={styles.daysLeftLabel}>เวลาที่เหลือ</div>
                    <div className={`${styles.daysLeftValue} ${styles[`days-${status}`]}`}>
                      {daysLeft < 0 && `เลยมา ${Math.abs(daysLeft)} วัน`}
                      {daysLeft === 0 && "วันนี้"}
                      {daysLeft > 0 && `อีก ${daysLeft} วัน`}
                    </div>
                  </div>

                  {deadline.relatedTo && (
                    <div className={styles.topicSection}>
                      <div className={styles.topicLabel}>หัวข้อที่เกี่ยวข้อง</div>
                      <div className={styles.topicValue}>{deadline.relatedTo}</div>
                    </div>
                  )}

                  {deadline.relatedTo && (
                    <div className={styles.descriptionSection}>
                      <div className={styles.descriptionLabel}>รายละเอียด</div>
                      <div className={styles.descriptionValue}>{deadline.relatedTo}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </TeacherPageScaffold>
    </RoleGuard>
  );
}
