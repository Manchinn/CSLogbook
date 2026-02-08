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
      await updateProject(token, projectId, {
        projectNameTh: lockedCore ? undefined : basic.projectNameTh,
        projectNameEn: lockedCore ? undefined : basic.projectNameEn,
        projectType: basic.projectType,
        tracks: classification.tracks,
        background: details.background,
        objective: details.objective,
        benefit: details.benefit,
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
    <div className={styles.panel}>
      <h3 className={styles.title}>สรุปข้อมูล</h3>
      <div className={styles.notice}>ตรวจสอบความครบถ้วนก่อนสร้างโครงงาน</div>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>ชื่อโครงงานภาษาไทย</label>
          <div>{basic.projectNameTh || "-"}</div>
        </div>
        <div className={styles.field}>
          <label>ชื่อโครงงานภาษาอังกฤษ</label>
          <div>{basic.projectNameEn || "-"}</div>
        </div>
        <div className={styles.field}>
          <label>ประเภทโครงงาน</label>
          <div>{basic.projectType || "-"}</div>
        </div>
        <div className={styles.field}>
          <label>หมวด</label>
          <div>{classification.tracks.join(", ") || "-"}</div>
        </div>
      </div>

      <div className={styles.tagRow}>
        {readiness.map((item) => (
          <span key={item.key} className={`${styles.tag} ${item.pass ? styles.tagSuccess : styles.tagWarning}`}>
            {item.pass ? "ผ่าน" : "ยังไม่ครบ"} - {item.label}
          </span>
        ))}
      </div>

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

      {projectMembers.length > 0 ? (
        <div className={styles.tagRow}>
          {projectMembers.map((member) => (
            <span key={`${member.studentId}-${member.role}`} className={styles.tag}>
              {member.role === "leader" ? "Leader" : "Member"}: {member.name || member.studentCode}
            </span>
          ))}
        </div>
      ) : null}

      {projectId && readinessMap.member2 && !members.synced ? (
        <div className={styles.notice}>ระบบจะซิงค์สมาชิกคนที่ 2 หลังสร้าง Draft</div>
      ) : null}
    </div>
  );
}
