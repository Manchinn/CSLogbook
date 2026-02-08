"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentProjectDetail } from "@/hooks/useStudentProjectDetail";
import { useStudentDeadlineCalendar } from "@/hooks/useStudentDeadlineCalendar";
import {
  acknowledgeTopicExamResult,
  type StudentDeadlineDetail,
} from "@/lib/services/studentService";
import styles from "./topicExam.module.css";

function classifyTopicExam(deadline: StudentDeadlineDetail) {
  const name = String(deadline.name || "").toLowerCase();
  if (name.includes("สอบหัวข้อ") || name.includes("สอบเสนอ") || name.includes("topic exam")) {
    return true;
  }
  const relatedTo = String(deadline.relatedTo || "").toLowerCase();
  if (["project", "project1"].includes(relatedTo) && deadline.deadlineType === "MILESTONE") {
    return name.includes("สอบ");
  }
  return false;
}

function formatDeadline(deadline: StudentDeadlineDetail) {
  if (deadline.isWindow) {
    return `เริ่ม: ${deadline.windowStartDate || "-"} ${deadline.windowStartTime || ""} / สิ้นสุด: ${
      deadline.windowEndDate || "-"
    } ${deadline.windowEndTime || ""}`.trim();
  }
  if (deadline.deadlineDate) {
    return `${deadline.deadlineDate} ${deadline.deadlineTime || ""}`.trim();
  }
  return deadline.deadlineAt || "-";
}

export default function TopicExamContent() {
  const { token } = useAuth();
  const hydrated = useHydrated();
  const queriesEnabled = hydrated && Boolean(token);
  const { data: project, refetch } = useStudentProjectDetail(token, queriesEnabled);
  const { data: deadlines, isLoading } = useStudentDeadlineCalendar(
    token,
    project?.academicYear ?? null,
    queriesEnabled
  );
  const [ackModalOpen, setAckModalOpen] = useState(false);
  const [ackLoading, setAckLoading] = useState(false);

  const topicExamDeadlines = useMemo(() => {
    if (!deadlines) return [];
    return deadlines.filter((deadline) => classifyTopicExam(deadline));
  }, [deadlines]);

  const showFailedBox = Boolean(project && project.examResult === "failed" && !project.studentAcknowledgedAt);
  const showPassedBox = Boolean(project && project.examResult === "passed");

  const handleAcknowledge = useCallback(async () => {
    if (!token || !project?.projectId) return;
    try {
      setAckLoading(true);
      await acknowledgeTopicExamResult(token, project.projectId);
      await refetch();
    } finally {
      setAckLoading(false);
      setAckModalOpen(false);
    }
  }, [project?.projectId, refetch, token]);

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <h1 className={styles.title}>ตารางสอบเสนอหัวข้อ</h1>
        <p className={styles.subtitle}>
          แสดงจาก Important Deadlines ที่เข้าข่ายเกี่ยวกับการสอบเสนอหัวข้อโครงงานพิเศษ 1
        </p>
      </section>

      {showFailedBox ? (
        <section className={styles.noticeDanger}>
          <p className={styles.noticeTitle}>ผลสอบหัวข้อ: ไม่ผ่าน</p>
          <p className={styles.noticeBody}>
            กรุณากดรับทราบผลเพื่อให้ระบบเก็บหัวข้อนี้ออกจากระบบก่อนยื่นหัวข้อใหม่
          </p>
          <div className={styles.noticeActions}>
            <button type="button" className={styles.primaryButton} onClick={() => setAckModalOpen(true)}>
              รับทราบผล
            </button>
          </div>
        </section>
      ) : null}

      {showPassedBox ? (
        <section className={styles.noticeSuccess}>
          <p className={styles.noticeTitle}>ผลสอบหัวข้อ: ผ่าน</p>
          <p className={styles.noticeBody}>
            ยินดีด้วย! ระบบจะเปิดขั้นตอนถัดไปตามการกำหนดของภาควิชา
          </p>
        </section>
      ) : null}

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>กำหนดการสอบหัวข้อ</h2>
        {isLoading ? <p className={styles.notice}>กำลังโหลดกำหนดการ...</p> : null}
        {!isLoading && topicExamDeadlines.length === 0 ? (
          <p className={styles.notice}>ยังไม่มีกำหนดการสอบหัวข้อในระบบ</p>
        ) : null}
        <div className={styles.list}>
          {topicExamDeadlines.map((deadline) => (
            <article key={deadline.id} className={styles.listItem}>
              <div>
                <h3 className={styles.deadlineTitle}>{deadline.name}</h3>
                <p className={styles.deadlineDesc}>{deadline.description || "-"}</p>
                <p className={styles.deadlineMeta}>{formatDeadline(deadline)}</p>
              </div>
              <div className={styles.tagRow}>
                {deadline.status ? <span className={styles.tag}>{deadline.status}</span> : null}
                {typeof deadline.daysLeft === "number" ? (
                  <span className={styles.tag}>เหลือ {deadline.daysLeft} วัน</span>
                ) : null}
                {deadline.submission?.submitted ? (
                  <span className={styles.tag}>{deadline.submission.late ? "ส่งช้า" : "มีการส่ง"}</span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      {ackModalOpen ? (
        <div className={styles.modalOverlay} role="presentation">
          <div className={styles.modal} role="dialog" aria-modal="true">
            <h3 className={styles.modalTitle}>ยืนยันการรับทราบผลสอบไม่ผ่าน</h3>
            <p className={styles.modalBody}>
              เมื่อรับทราบผล หัวข้อจะถูกเก็บถาวร และไม่สามารถย้อนกลับได้
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setAckModalOpen(false)}
                disabled={ackLoading}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleAcknowledge}
                disabled={ackLoading}
              >
                {ackLoading ? "กำลังบันทึก..." : "ยืนยันรับทราบ"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
