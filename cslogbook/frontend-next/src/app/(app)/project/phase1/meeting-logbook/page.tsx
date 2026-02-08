"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentProjectDetail } from "@/hooks/useStudentProjectDetail";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";
import { featureFlags } from "@/lib/config/featureFlags";
import {
  createMeeting,
  createMeetingLog,
  listMeetings,
} from "@/lib/services/meetingService";
import styles from "./meetingLogbook.module.css";

export default function MeetingLogbookPage() {
  guardFeatureRoute(featureFlags.enableProjectPhase1Page, "/app");
  const { token } = useAuth();
  const { data: project } = useStudentProjectDetail(token, Boolean(token));
  const [meetings, setMeetings] = useState<Array<Record<string, unknown>>>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    meetingTitle: "",
    meetingDate: "",
    meetingMethod: "onsite",
    meetingLocation: "",
    meetingLink: "",
    phase: "phase1",
  });
  const [logForm, setLogForm] = useState({
    meetingId: "",
    discussionTopic: "",
    currentProgress: "",
    problemsIssues: "",
    nextActionItems: "",
  });

  const canUsePhase = useMemo(() => {
    if (!project) return false;
    if (project.examResult !== "passed") return false;
    return ["in_progress", "completed"].includes(project.status ?? "");
  }, [project]);

  const loadMeetings = useCallback(async () => {
    if (!token || !project?.projectId || !canUsePhase) return;
    try {
      setLoading(true);
      const response = await listMeetings(token, project.projectId);
      setMeetings(Array.isArray(response.data) ? response.data : []);
      setStats((response as { stats?: Record<string, unknown> }).stats ?? null);
    } finally {
      setLoading(false);
    }
  }, [token, project?.projectId, canUsePhase]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const handleCreateMeeting = async () => {
    if (!token || !project?.projectId) return;
    await createMeeting(token, project.projectId, {
      meetingTitle: meetingForm.meetingTitle,
      meetingDate: meetingForm.meetingDate ? new Date(meetingForm.meetingDate).toISOString() : null,
      meetingMethod: meetingForm.meetingMethod,
      meetingLocation: meetingForm.meetingLocation || null,
      meetingLink: meetingForm.meetingLink || null,
      phase: meetingForm.phase,
    });
    setMeetingForm({
      meetingTitle: "",
      meetingDate: "",
      meetingMethod: "onsite",
      meetingLocation: "",
      meetingLink: "",
      phase: "phase1",
    });
    await loadMeetings();
  };

  const handleCreateLog = async () => {
    if (!token || !project?.projectId || !logForm.meetingId) return;
    await createMeetingLog(token, project.projectId, Number(logForm.meetingId), {
      discussionTopic: logForm.discussionTopic,
      currentProgress: logForm.currentProgress,
      problemsIssues: logForm.problemsIssues || null,
      nextActionItems: logForm.nextActionItems,
    });
    setLogForm({
      meetingId: "",
      discussionTopic: "",
      currentProgress: "",
      problemsIssues: "",
      nextActionItems: "",
    });
    await loadMeetings();
  };

  return (
    <RoleGuard roles={["student"]}>
      <div className={styles.page}>
        <section className={styles.header}>
          <h1 className={styles.title}>บันทึกการพบอาจารย์</h1>
          <p className={styles.subtitle}>จัดการการประชุมและบันทึก log การพบอาจารย์</p>
        </section>

        {!project ? <div className={styles.notice}>ยังไม่มีโครงงานในระบบ</div> : null}
        {project && !canUsePhase ? (
          <div className={styles.notice}>ขั้นตอนนี้เปิดหลังสอบหัวข้อผ่านและโครงงานอยู่ในสถานะดำเนินการ</div>
        ) : null}

        {stats ? (
          <div className={styles.tagRow}>
            <span className={styles.tag}>จำนวนประชุม: {String(stats.totalMeetings ?? 0)}</span>
            <span className={styles.tag}>บันทึกทั้งหมด: {String(stats.totalLogs ?? 0)}</span>
            <span className={styles.tagSuccess}>อนุมัติ: {String(stats.approvedLogs ?? 0)}</span>
          </div>
        ) : null}

        <section className={styles.grid}>
          <div className={styles.card}>
            <h3>สร้างการประชุม</h3>
            <div className={styles.form}>
              <div className={styles.field}>
                <label>หัวข้อการประชุม</label>
                <input
                  value={meetingForm.meetingTitle}
                  onChange={(event) => setMeetingForm((prev) => ({ ...prev, meetingTitle: event.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label>วันและเวลา</label>
                <input
                  type="datetime-local"
                  value={meetingForm.meetingDate}
                  onChange={(event) => setMeetingForm((prev) => ({ ...prev, meetingDate: event.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label>รูปแบบการประชุม</label>
                <select
                  value={meetingForm.meetingMethod}
                  onChange={(event) => setMeetingForm((prev) => ({ ...prev, meetingMethod: event.target.value }))}
                >
                  <option value="onsite">พบที่ภาควิชา</option>
                  <option value="online">ออนไลน์</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>สถานที่</label>
                <input
                  value={meetingForm.meetingLocation}
                  onChange={(event) => setMeetingForm((prev) => ({ ...prev, meetingLocation: event.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label>ลิงก์ประชุม</label>
                <input
                  value={meetingForm.meetingLink}
                  onChange={(event) => setMeetingForm((prev) => ({ ...prev, meetingLink: event.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label>Phase</label>
                <select
                  value={meetingForm.phase}
                  onChange={(event) => setMeetingForm((prev) => ({ ...prev, phase: event.target.value }))}
                >
                  <option value="phase1">โครงงานพิเศษ 1</option>
                  <option value="phase2">โครงงานพิเศษ 2</option>
                </select>
              </div>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleCreateMeeting}
                disabled={!project || !canUsePhase}
              >
                บันทึกการประชุม
              </button>
            </div>
          </div>

          <div className={styles.card}>
            <h3>บันทึก log การพบอาจารย์</h3>
            <div className={styles.form}>
              <div className={styles.field}>
                <label>เลือกการประชุม</label>
                <select
                  value={logForm.meetingId}
                  onChange={(event) => setLogForm((prev) => ({ ...prev, meetingId: event.target.value }))}
                >
                  <option value="">เลือกการประชุม</option>
                  {meetings.map((meeting) => (
                    <option key={String(meeting.meetingId)} value={String(meeting.meetingId)}>
                      {String(meeting.meetingTitle || "การประชุม")}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>หัวข้อที่สนทนา</label>
                <textarea
                  value={logForm.discussionTopic}
                  onChange={(event) => setLogForm((prev) => ({ ...prev, discussionTopic: event.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label>ความคืบหน้าปัจจุบัน</label>
                <textarea
                  value={logForm.currentProgress}
                  onChange={(event) => setLogForm((prev) => ({ ...prev, currentProgress: event.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label>ปัญหา/อุปสรรค</label>
                <textarea
                  value={logForm.problemsIssues}
                  onChange={(event) => setLogForm((prev) => ({ ...prev, problemsIssues: event.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label>งานถัดไป</label>
                <textarea
                  value={logForm.nextActionItems}
                  onChange={(event) => setLogForm((prev) => ({ ...prev, nextActionItems: event.target.value }))}
                />
              </div>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleCreateLog}
                disabled={!project || !canUsePhase || !logForm.meetingId}
              >
                บันทึก log
              </button>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h3>รายการประชุม</h3>
          {loading ? <div className={styles.notice}>กำลังโหลดข้อมูล...</div> : null}
          {meetings.length === 0 && !loading ? <div className={styles.notice}>ยังไม่มีการประชุม</div> : null}
          <div className={styles.list}>
            {meetings.map((meeting) => (
              <div key={String(meeting.meetingId)} className={styles.listItem}>
                <strong>{String(meeting.meetingTitle || "การประชุม")}</strong>
                <div className={styles.meta}>{String(meeting.meetingDate || "-")}</div>
                <div className={styles.meta}>Phase: {String(meeting.phase || "phase1")}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </RoleGuard>
  );
}
