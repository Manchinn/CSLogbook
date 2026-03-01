"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentProjectDetail } from "@/hooks/useStudentProjectDetail";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";
import { featureFlags } from "@/lib/config/featureFlags";
import {
  createMeeting,
  createMeetingLog,
  deleteMeeting,
  deleteMeetingLog,
  listMeetings,
  updateMeeting,
  updateMeetingLog,
} from "@/lib/services/meetingService";
import styles from "./meetingLogbook.module.css";

type MeetingLogRecord = {
  logId: number;
  status?: string | null;
  notes?: string | null;
  discussionTopic?: string | null;
  currentProgress?: string | null;
  problemsIssues?: string | null;
  nextActionItems?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type MeetingRecord = {
  meetingId: number;
  meetingTitle?: string | null;
  meetingDate?: string | null;
  meetingMethod?: string | null;
  meetingLocation?: string | null;
  meetingLink?: string | null;
  phase?: string | null;
  logs?: MeetingLogRecord[];
};

type MeetingStats = {
  totalMeetings?: number;
  totalLogs?: number;
  approvedLogs?: number;
  pendingLogs?: number;
  phaseBreakdown?: Record<string, MeetingStats>;
};

const meetingStatusLabels: Record<string, string> = {
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ขอปรับปรุง",
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function toLocalDateTimeString(value: string) {
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return value;
  return `${datePart}T${timePart}:00`;
}

export default function MeetingLogbookPage() {
  guardFeatureRoute(featureFlags.enableProjectPhase1Page, "/app");
  const { token } = useAuth();
  const hydrated = useHydrated();
  const { data: project } = useStudentProjectDetail(token, hydrated && Boolean(token));
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<"phase1" | "phase2">("phase1");

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

  const [editMeeting, setEditMeeting] = useState<MeetingRecord | null>(null);
  const [editMeetingForm, setEditMeetingForm] = useState({
    meetingTitle: "",
    meetingDate: "",
    meetingMethod: "onsite",
    meetingLocation: "",
    meetingLink: "",
    phase: "phase1",
  });

  const [editLog, setEditLog] = useState<MeetingLogRecord | null>(null);
  const [editLogMeetingId, setEditLogMeetingId] = useState<number | null>(null);
  const [editLogForm, setEditLogForm] = useState({
    discussionTopic: "",
    currentProgress: "",
    problemsIssues: "",
    nextActionItems: "",
  });

  const postTopicLockReasons = useMemo(() => {
    if (!project) return [] as string[];
    const reasons: string[] = [];
    if (!project.examResult) {
      reasons.push("เจ้าหน้าที่ภาควิชายังไม่ได้บันทึกผลสอบหัวข้อ");
    } else if (project.examResult !== "passed") {
      reasons.push("ผลสอบหัวข้อยังไม่ผ่าน");
    }
    if (!project.status || !["in_progress", "completed"].includes(project.status)) {
      reasons.push("สถานะโครงงานยังไม่อยู่ในขั้น \"กำลังดำเนินการ\" หรือ \"เสร็จสิ้น\"");
    }
    return reasons;
  }, [project]);

  const isPostTopicLocked = Boolean(project && postTopicLockReasons.length > 0);

  const phase2LockReasons = useMemo(() => {
    if (!project) return ["ยังไม่มีโครงงาน"];
    const reasons: string[] = [];
    if (project.examResult !== "passed") {
      reasons.push("ผลสอบหัวข้อยังไม่ผ่าน");
    }
    if (!project.status || !["in_progress", "completed"].includes(project.status)) {
      reasons.push("สถานะโครงงานยังไม่อยู่ในขั้น \"กำลังดำเนินการ\"");
    }
    return reasons;
  }, [project]);

  const canAccessPhase2 = phase2LockReasons.length === 0;
  const canManage = project?.status === "in_progress";

  const meetingsByPhase = useMemo(() => {
    return meetings.reduce(
      (acc, meeting) => {
        const phase = (meeting.phase || "phase1") as "phase1" | "phase2";
        acc[phase].push(meeting);
        return acc;
      },
      { phase1: [] as MeetingRecord[], phase2: [] as MeetingRecord[] }
    );
  }, [meetings]);

  const statsByPhase = useMemo(() => {
    const breakdown = stats?.phaseBreakdown ?? {};
    return {
      phase1: breakdown.phase1 ?? {},
      phase2: breakdown.phase2 ?? {},
    } as Record<"phase1" | "phase2", MeetingStats>;
  }, [stats]);

  const activeMeetings = meetingsByPhase[activePhase];
  const activeStats = statsByPhase[activePhase] ?? {};

  const loadMeetings = useCallback(async () => {
    if (!token || !project?.projectId || isPostTopicLocked) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await listMeetings(token, project.projectId);
      setMeetings(Array.isArray(response.data) ? response.data : []);
      setStats((response as { stats?: MeetingStats }).stats ?? null);
    } catch {
      setErrorMessage("โหลดข้อมูลการประชุมไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }, [isPostTopicLocked, project?.projectId, token]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  useEffect(() => {
    if (!canAccessPhase2 && activePhase === "phase2") {
      setActivePhase("phase1");
    }
  }, [activePhase, canAccessPhase2]);

  useEffect(() => {
    if (!canAccessPhase2) {
      setMeetingForm((prev) => ({ ...prev, phase: "phase1" }));
    }
  }, [canAccessPhase2]);

  const handleCreateMeeting = async () => {
    if (!token || !project?.projectId || isPostTopicLocked) return;
    if (!meetingForm.meetingDate) {
      setErrorMessage("กรุณาระบุวันและเวลาการประชุม");
      return;
    }
    setErrorMessage(null);
    try {
      await createMeeting(token, project.projectId, {
        meetingTitle: meetingForm.meetingTitle,
        meetingDate: meetingForm.meetingDate ? toLocalDateTimeString(meetingForm.meetingDate) : null,
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
        phase: canAccessPhase2 ? activePhase : "phase1",
      });
      await loadMeetings();
    } catch {
      setErrorMessage("สร้างการประชุมไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const handleCreateLog = async () => {
    if (!token || !project?.projectId || isPostTopicLocked) return;
    if (!logForm.meetingId) return;
    setErrorMessage(null);
    try {
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
    } catch {
      setErrorMessage("เพิ่มบันทึกการพบไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const handleOpenEditMeeting = (meeting: MeetingRecord) => {
    setEditMeeting(meeting);
    setEditMeetingForm({
      meetingTitle: meeting.meetingTitle || "",
      meetingDate: meeting.meetingDate ? meeting.meetingDate.slice(0, 16) : "",
      meetingMethod: meeting.meetingMethod || "onsite",
      meetingLocation: meeting.meetingLocation || "",
      meetingLink: meeting.meetingLink || "",
      phase: meeting.phase || "phase1",
    });
  };

  const handleUpdateMeeting = async () => {
    if (!token || !project?.projectId || !editMeeting) return;
    setErrorMessage(null);
    try {
      await updateMeeting(token, project.projectId, editMeeting.meetingId, {
        meetingTitle: editMeetingForm.meetingTitle,
        meetingDate: editMeetingForm.meetingDate ? toLocalDateTimeString(editMeetingForm.meetingDate) : null,
        meetingMethod: editMeetingForm.meetingMethod,
        meetingLocation: editMeetingForm.meetingLocation || null,
        meetingLink: editMeetingForm.meetingLink || null,
        phase: editMeetingForm.phase,
      });
      setEditMeeting(null);
      await loadMeetings();
    } catch {
      setErrorMessage("อัปเดตการประชุมไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const handleDeleteMeeting = async (meetingId: number) => {
    if (!token || !project?.projectId) return;
    if (!window.confirm("ยืนยันลบการประชุมนี้?")) return;
    setErrorMessage(null);
    try {
      await deleteMeeting(token, project.projectId, meetingId);
      await loadMeetings();
    } catch {
      setErrorMessage("ลบการประชุมไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const handleOpenEditLog = (meetingId: number, log: MeetingLogRecord) => {
    setEditLog(log);
    setEditLogMeetingId(meetingId);
    setEditLogForm({
      discussionTopic: log.discussionTopic || "",
      currentProgress: log.currentProgress || "",
      problemsIssues: log.problemsIssues || "",
      nextActionItems: log.nextActionItems || "",
    });
  };

  const handleUpdateLog = async () => {
    if (!token || !project?.projectId || !editLog || !editLogMeetingId) return;
    setErrorMessage(null);
    try {
      await updateMeetingLog(token, project.projectId, editLogMeetingId, editLog.logId, {
        discussionTopic: editLogForm.discussionTopic,
        currentProgress: editLogForm.currentProgress,
        problemsIssues: editLogForm.problemsIssues || null,
        nextActionItems: editLogForm.nextActionItems,
      });
      setEditLog(null);
      setEditLogMeetingId(null);
      await loadMeetings();
    } catch {
      setErrorMessage("อัปเดตบันทึกการพบไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const handleDeleteLog = async (meetingId: number, logId: number) => {
    if (!token || !project?.projectId) return;
    if (!window.confirm("ยืนยันลบบันทึกนี้?")) return;
    setErrorMessage(null);
    try {
      await deleteMeetingLog(token, project.projectId, meetingId, logId);
      await loadMeetings();
    } catch {
      setErrorMessage("ลบบันทึกการพบไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  return (
    <RoleGuard roles={["student"]}>
      <div className={styles.page}>
        <section className={styles.header}>
          <h1 className={styles.title}>บันทึกการพบอาจารย์</h1>
          <p className={styles.subtitle}>จัดการการประชุมและบันทึก log การพบอาจารย์</p>
        </section>

        {errorMessage ? <p className={styles.notice}>{errorMessage}</p> : null}

        {!project ? <div className={styles.notice}>ยังไม่มีโครงงานในระบบ</div> : null}

        {project && postTopicLockReasons.length > 0 ? (
          <div className={styles.noticeWarning}>
            <p className={styles.noticeTitle}>ขั้นตอนนี้เปิดหลังสอบหัวข้อผ่าน</p>
            <ul className={styles.noticeList}>
              {postTopicLockReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {stats ? (
          <div className={styles.tagRow}>
            <span className={styles.tag}>จำนวนประชุม: {String(stats.totalMeetings ?? 0)}</span>
            <span className={styles.tag}>บันทึกทั้งหมด: {String(stats.totalLogs ?? 0)}</span>
            <span className={styles.tagSuccess}>อนุมัติ: {String(stats.approvedLogs ?? 0)}</span>
          </div>
        ) : null}

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabButton} ${activePhase === "phase1" ? styles.tabButtonActive : ""}`}
            onClick={() => setActivePhase("phase1")}
          >
            โครงงานพิเศษ 1
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activePhase === "phase2" ? styles.tabButtonActive : ""}`}
            onClick={() => setActivePhase("phase2")}
            disabled={!canAccessPhase2}
          >
            ปริญญานิพนธ์
          </button>
        </div>

        <section className={styles.tagRow}>
          <span className={styles.tag}>ประชุม: {String(activeStats.totalMeetings ?? 0)}</span>
          <span className={styles.tag}>บันทึก: {String(activeStats.totalLogs ?? 0)}</span>
          <span className={styles.tagSuccess}>อนุมัติ: {String(activeStats.approvedLogs ?? 0)}</span>
          <span className={styles.tagWarning}>รออนุมัติ: {String(activeStats.pendingLogs ?? 0)}</span>
        </section>

        <section className={styles.grid}>
          <div className={styles.card}>
            <h3>สร้างการประชุม</h3>
            <div className={styles.form}>
              <div className={styles.field}>
                <label>หัวข้อการประชุม</label>
                <input
                  value={meetingForm.meetingTitle}
                  onChange={(event) => setMeetingForm((prev) => ({ ...prev, meetingTitle: event.target.value }))}
                  disabled={!canManage || isPostTopicLocked}
                />
              </div>
              <div className={styles.field}>
                <label>วันและเวลา</label>
                <input
                  type="datetime-local"
                  value={meetingForm.meetingDate}
                  onChange={(event) => setMeetingForm((prev) => ({ ...prev, meetingDate: event.target.value }))}
                  disabled={!canManage || isPostTopicLocked}
                />
              </div>
              <div className={styles.field}>
                <label>รูปแบบการประชุม</label>
                <select
                  value={meetingForm.meetingMethod}
                  onChange={(event) => setMeetingForm((prev) => ({ ...prev, meetingMethod: event.target.value }))}
                  disabled={!canManage || isPostTopicLocked}
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
                  disabled={!canManage || isPostTopicLocked}
                />
              </div>
              <div className={styles.field}>
                <label>ลิงก์ประชุม</label>
                <input
                  value={meetingForm.meetingLink}
                  onChange={(event) => setMeetingForm((prev) => ({ ...prev, meetingLink: event.target.value }))}
                  disabled={!canManage || isPostTopicLocked}
                />
              </div>
              <div className={styles.field}>
                <label>Phase</label>
                <select
                  value={meetingForm.phase}
                  onChange={(event) => setMeetingForm((prev) => ({ ...prev, phase: event.target.value }))}
                  disabled={!canManage || isPostTopicLocked}
                >
                  <option value="phase1">โครงงานพิเศษ 1</option>
                  <option value="phase2" disabled={!canAccessPhase2}>
                    ปริญญานิพนธ์
                  </option>
                </select>
              </div>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleCreateMeeting}
                disabled={!project || !canManage || isPostTopicLocked}
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
                  disabled={!canManage || isPostTopicLocked}
                >
                  <option value="">เลือกการประชุม</option>
                  {activeMeetings.map((meeting) => (
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
                  disabled={!canManage || isPostTopicLocked}
                />
              </div>
              <div className={styles.field}>
                <label>ความคืบหน้าปัจจุบัน</label>
                <textarea
                  value={logForm.currentProgress}
                  onChange={(event) => setLogForm((prev) => ({ ...prev, currentProgress: event.target.value }))}
                  disabled={!canManage || isPostTopicLocked}
                />
              </div>
              <div className={styles.field}>
                <label>ปัญหา/อุปสรรค</label>
                <textarea
                  value={logForm.problemsIssues}
                  onChange={(event) => setLogForm((prev) => ({ ...prev, problemsIssues: event.target.value }))}
                  disabled={!canManage || isPostTopicLocked}
                />
              </div>
              <div className={styles.field}>
                <label>งานถัดไป</label>
                <textarea
                  value={logForm.nextActionItems}
                  onChange={(event) => setLogForm((prev) => ({ ...prev, nextActionItems: event.target.value }))}
                  disabled={!canManage || isPostTopicLocked}
                />
              </div>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleCreateLog}
                disabled={!project || !canManage || isPostTopicLocked || !logForm.meetingId}
              >
                บันทึก log
              </button>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h3>รายการประชุม ({activePhase === "phase1" ? "โครงงานพิเศษ 1" : "ปริญญานิพนธ์"})</h3>
          {loading ? <div className={styles.notice}>กำลังโหลดข้อมูล...</div> : null}
          {activeMeetings.length === 0 && !loading ? <div className={styles.notice}>ยังไม่มีการประชุม</div> : null}
          <div className={styles.list}>
            {activeMeetings.map((meeting) => (
              <div key={String(meeting.meetingId)} className={styles.listItem}>
                <div className={styles.listHeader}>
                  <div>
                    <strong>{String(meeting.meetingTitle || "การประชุม")}</strong>
                    <div className={styles.meta}>{formatDateTime(meeting.meetingDate)}</div>
                    <div className={styles.meta}>Phase: {String(meeting.phase || "phase1")}</div>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => handleOpenEditMeeting(meeting)}
                      disabled={!canManage}
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => handleDeleteMeeting(meeting.meetingId)}
                      disabled={!canManage}
                    >
                      ลบ
                    </button>
                  </div>
                </div>

                {meeting.logs && meeting.logs.length > 0 ? (
                  <div className={styles.logList}>
                    {meeting.logs.map((log) => (
                      <div key={String(log.logId)} className={styles.logItem}>
                        <div>
                          <div className={styles.logTitle}>
                            {log.discussionTopic || "บันทึกการพบอาจารย์"}
                          </div>
                          <div className={styles.meta}>{formatDateTime(log.updatedAt || log.createdAt)}</div>
                          <div className={styles.tagRow}>
                            {log.status ? (
                              <span
                                className={`${styles.tag} ${
                                  log.status === "approved"
                                    ? styles.tagSuccess
                                    : log.status === "rejected"
                                      ? styles.tagDanger
                                      : styles.tagWarning
                                }`}
                              >
                                {meetingStatusLabels[log.status] || log.status}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => handleOpenEditLog(meeting.meetingId, log)}
                            disabled={!canManage}
                          >
                            แก้ไข
                          </button>
                          <button
                            type="button"
                            className={styles.dangerButton}
                            onClick={() => handleDeleteLog(meeting.meetingId, log.logId)}
                            disabled={!canManage}
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noticeInline}>ยังไม่มีบันทึกการพบอาจารย์</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {editMeeting ? (
          <div className={styles.modalOverlay} role="presentation">
            <div className={styles.modal} role="dialog" aria-modal="true">
              <h3 className={styles.modalTitle}>แก้ไขการประชุม</h3>
              <div className={styles.form}>
                <div className={styles.field}>
                  <label>หัวข้อการประชุม</label>
                  <input
                    value={editMeetingForm.meetingTitle}
                    onChange={(event) =>
                      setEditMeetingForm((prev) => ({ ...prev, meetingTitle: event.target.value }))
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>วันและเวลา</label>
                  <input
                    type="datetime-local"
                    value={editMeetingForm.meetingDate}
                    onChange={(event) =>
                      setEditMeetingForm((prev) => ({ ...prev, meetingDate: event.target.value }))
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>รูปแบบการประชุม</label>
                  <select
                    value={editMeetingForm.meetingMethod}
                    onChange={(event) =>
                      setEditMeetingForm((prev) => ({ ...prev, meetingMethod: event.target.value }))
                    }
                  >
                    <option value="onsite">พบที่ภาควิชา</option>
                    <option value="online">ออนไลน์</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>สถานที่</label>
                  <input
                    value={editMeetingForm.meetingLocation}
                    onChange={(event) =>
                      setEditMeetingForm((prev) => ({ ...prev, meetingLocation: event.target.value }))
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>ลิงก์ประชุม</label>
                  <input
                    value={editMeetingForm.meetingLink}
                    onChange={(event) =>
                      setEditMeetingForm((prev) => ({ ...prev, meetingLink: event.target.value }))
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>Phase</label>
                  <select
                    value={editMeetingForm.phase}
                    onChange={(event) =>
                      setEditMeetingForm((prev) => ({ ...prev, phase: event.target.value }))
                    }
                  >
                    <option value="phase1">โครงงานพิเศษ 1</option>
                    <option value="phase2" disabled={!canAccessPhase2}>
                      โครงงานพิเศษ 2
                    </option>
                  </select>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setEditMeeting(null)}>
                  ยกเลิก
                </button>
                <button type="button" className={styles.primaryButton} onClick={handleUpdateMeeting}>
                  บันทึกการแก้ไข
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {editLog ? (
          <div className={styles.modalOverlay} role="presentation">
            <div className={styles.modal} role="dialog" aria-modal="true">
              <h3 className={styles.modalTitle}>แก้ไขบันทึกการพบ</h3>
              <div className={styles.form}>
                <div className={styles.field}>
                  <label>หัวข้อที่สนทนา</label>
                  <textarea
                    value={editLogForm.discussionTopic}
                    onChange={(event) =>
                      setEditLogForm((prev) => ({ ...prev, discussionTopic: event.target.value }))
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>ความคืบหน้าปัจจุบัน</label>
                  <textarea
                    value={editLogForm.currentProgress}
                    onChange={(event) =>
                      setEditLogForm((prev) => ({ ...prev, currentProgress: event.target.value }))
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>ปัญหา/อุปสรรค</label>
                  <textarea
                    value={editLogForm.problemsIssues}
                    onChange={(event) =>
                      setEditLogForm((prev) => ({ ...prev, problemsIssues: event.target.value }))
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>งานถัดไป</label>
                  <textarea
                    value={editLogForm.nextActionItems}
                    onChange={(event) =>
                      setEditLogForm((prev) => ({ ...prev, nextActionItems: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    setEditLog(null);
                    setEditLogMeetingId(null);
                  }}
                >
                  ยกเลิก
                </button>
                <button type="button" className={styles.primaryButton} onClick={handleUpdateLog}>
                  บันทึกการแก้ไข
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RoleGuard>
  );
}
