"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getStudentProfile } from "@/lib/services/studentService";
import { addMember } from "@/lib/services/projectService";
import { useProjectDraft } from "./ProjectDraftContext";
import styles from "./topicSubmit.module.css";

const studentCodeRegex = /^[0-9]{5,13}$/;

export function StepMembers() {
  const { token } = useAuth();
  const { members, setMembers, projectId, projectStatus } = useProjectDraft();
  const [member2, setMember2] = useState(members.secondMemberCode || "");
  const [loading, setLoading] = useState(false);
  const memberLocked = ["in_progress", "completed", "archived"].includes(projectStatus);

  useEffect(() => {
    setMember2(members.secondMemberCode || "");
  }, [members.secondMemberCode]);

  const errors = useMemo(() => {
    const errs: string[] = [];
    if (member2 && !studentCodeRegex.test(member2)) {
      errs.push("รหัสนักศึกษาคนที่ 2 ไม่ถูกต้อง");
    }
    return errs;
  }, [member2]);

  const handleApply = async () => {
    const trimmed = member2.trim();
    setMembers({ secondMemberCode: trimmed, error: null });
    if (!trimmed) return;
    if (!studentCodeRegex.test(trimmed)) return;

    if (!token) return;

    if (!projectId) {
      try {
        setLoading(true);
        await getStudentProfile(trimmed, token);
        setMembers({ validated: true, error: null });
      } catch (error) {
        setMembers({ validated: false, error: (error as Error).message || "ไม่พบข้อมูลนักศึกษา" });
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      await addMember(token, projectId, trimmed);
      setMembers({ synced: true, validated: true, error: null });
    } catch (error) {
      setMembers({ synced: false, validated: false, error: (error as Error).message || "เพิ่มสมาชิกไม่สำเร็จ" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.sectionContent}>
      <p className={styles.sectionHint}>โครงงานพิเศษต้องมีสมาชิก 2 คน</p>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="member2-input">รหัสนักศึกษาคนที่ 2 (บังคับ)</label>
          <input
            id="member2-input"
            value={member2}
            onChange={(event) => setMember2(event.target.value)}
            placeholder="กรอกรหัสนักศึกษา 5–13 หลัก"
            disabled={memberLocked}
          />
        </div>
      </div>
      {errors.length > 0 ? (
        <p className={styles.fieldError}>{errors.join(" ")}</p>
      ) : null}
      {!memberLocked ? (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleApply}
            disabled={errors.length > 0 || loading}
          >
            {loading ? "กำลังตรวจสอบ..." : projectId ? "บันทึก & ซิงค์" : "ตรวจสอบรหัสนักศึกษา"}
          </button>
        </div>
      ) : null}
      <div className={styles.memberBadgeRow}>
        <span className={`${styles.memberBadge} ${styles.memberBadgeOk}`}>👤 สมาชิก: (คุณ)</span>
        {members.secondMemberCode ? (
          <span className={`${styles.memberBadge} ${members.validated ? styles.memberBadgeOk : styles.memberBadgePending}`}>
            👤 คนที่ 2: {members.secondMemberCode}
            {members.validated ? " ✓" : " (รอตรวจสอบ)"}
          </span>
        ) : (
          <span className={styles.memberBadge}>คนที่ 2: ยังไม่ระบุ</span>
        )}
        {members.error ? (
          <span className={`${styles.memberBadge} ${styles.memberBadgeError}`}>⚠ {members.error}</span>
        ) : null}
      </div>
    </div>
  );
}
