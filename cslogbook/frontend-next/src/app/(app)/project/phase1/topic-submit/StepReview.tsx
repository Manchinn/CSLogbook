"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addMember, createProject, updateProject } from "@/lib/services/projectService";
import { useProjectDraft } from "./ProjectDraftContext";
import styles from "./topicSubmit.module.css";

export function StepReview() {
  const { token } = useAuth();
  const {
    basic,
    classification,
    members,
    details,
    projectId,
    projectStatus,
    projectMembers,
    setProjectId,
    setProjectStatus,
    setProjectMembers,
    setMembers,
    setStatus,
    computeReadiness,
  } = useProjectDraft();

  const readiness = computeReadiness();
  const readinessMap = useMemo(() => {
    return readiness.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.key] = item.pass;
      return acc;
    }, {});
  }, [readiness]);

  const lockedCore = ["in_progress", "completed", "archived"].includes(projectStatus);
  const readOnly = ["completed", "archived"].includes(projectStatus);

  const handleCreate = async () => {
    if (!token) return;
    try {
      setStatus({ creating: true });
      const payload = {
        projectNameTh: basic.projectNameTh || undefined,
        projectNameEn: basic.projectNameEn || undefined,
        projectType: basic.projectType || undefined,
        tracks: classification.tracks.length ? classification.tracks : undefined,
        background: details.background || undefined,
        objective: details.objective || undefined,
        benefit: details.benefit || undefined,
        secondMemberStudentCode: members.secondMemberCode || undefined,
      };
      const res = await createProject(token, payload);
      const project = res.data ?? res.project;
      if (project?.projectId) {
        setProjectId(project.projectId);
        setProjectStatus(project.status ?? "draft");
        setProjectMembers(project.members || []);
        setMembers({ synced: true, validated: true, error: null });
      }
    } finally {
      setStatus({ creating: false });
    }
  };

  const handleUpdate = async () => {
    if (!token || !projectId) return;
    if (readOnly) return;
    try {
      setStatus({ saving: true });
      // backend validateUpdateProject รับแค่ projectNameTh, projectNameEn, description
      // field อื่น (projectType, tracks, background ฯลฯ) ถูก Joi ปฏิเสธ
      await updateProject(token, projectId, {
        projectNameTh: lockedCore ? undefined : basic.projectNameTh || undefined,
        projectNameEn: lockedCore ? undefined : basic.projectNameEn || undefined,
      });
    } finally {
      setStatus({ saving: false });
    }
  };

  const handleSyncMember = async () => {
    if (!token || !projectId || !members.secondMemberCode) return;
    try {
      setStatus({ saving: true });
      await addMember(token, projectId, members.secondMemberCode);
      setMembers({ synced: true, validated: true, error: null });
    } finally {
      setStatus({ saving: false });
    }
  };

  return (
    <div className={styles.sectionContent}>
      {/* ── ข้อมูลสรุป ─────────────────────────────── */}
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>ชื่อโครงงาน (ไทย)</label>
          <div className={styles.fieldValue}>{basic.projectNameTh || <span className={styles.fieldEmpty}>ยังไม่ระบุ</span>}</div>
        </div>
        <div className={styles.field}>
          <label>ชื่อโครงงาน (อังกฤษ)</label>
          <div className={styles.fieldValue}>{basic.projectNameEn || <span className={styles.fieldEmpty}>ยังไม่ระบุ</span>}</div>
        </div>
        <div className={styles.field}>
          <label>ประเภทโครงงาน</label>
          <div className={styles.fieldValue}>{basic.projectType || <span className={styles.fieldEmpty}>ยังไม่ระบุ</span>}</div>
        </div>
        <div className={styles.field}>
          <label>หมวด (Track)</label>
          <div className={styles.fieldValue}>
            {classification.tracks.length > 0
              ? classification.tracks.join(", ")
              : <span className={styles.fieldEmpty}>ยังไม่เลือก</span>}
          </div>
        </div>
      </div>

      {/* ── ผลตรวจสอบความครบถ้วน ────────────────── */}
      <div className={styles.readinessGrid}>
        {readiness.map((item) => (
          <div
            key={item.key}
            className={`${styles.readinessBadge} ${item.pass ? styles.readinessBadgePass : styles.readinessBadgeFail}`}
          >
            <span className={styles.readinessIcon}>{item.pass ? "✓" : "✗"}</span>
            <span className={styles.readinessLabel}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* ── สมาชิกที่ sync แล้ว ─────────────────── */}
      {projectMembers.length > 0 ? (
        <div className={styles.memberBadgeRow}>
          {projectMembers.map((member) => (
            <span
              key={`${member.studentId}-${member.role}`}
              className={`${styles.memberBadge} ${styles.memberBadgeOk}`}
            >
              👤 สมาชิก: {member.name || member.studentCode}
            </span>
          ))}
        </div>
      ) : null}

      {/* ── Actions ──────────────────────────────── */}
      <div className={styles.actions}>
        {!projectId ? (
          <button type="button" className={styles.primaryButton} onClick={handleCreate}>
            สร้าง Draft โครงงาน
          </button>
        ) : (
          <>
            <button type="button" className={styles.primaryButton} onClick={handleUpdate} disabled={readOnly}>
              บันทึกการแก้ไข
            </button>
            {!members.synced && members.secondMemberCode ? (
              <button type="button" className={styles.secondaryButton} onClick={handleSyncMember}>
                ซิงค์สมาชิกคนที่ 2
              </button>
            ) : null}
          </>
        )}
      </div>

      {projectId && readinessMap.member2 && !members.synced ? (
        <p className={styles.sectionHint}>ระบบจะซิงค์สมาชิกคนที่ 2 หลังสร้าง Draft เรียบร้อยแล้ว</p>
      ) : null}
    </div>
  );
}
