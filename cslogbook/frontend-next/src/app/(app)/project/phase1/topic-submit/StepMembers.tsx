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
    <div className={styles.panel}>
      <div className={styles.notice}>โครงงานพิเศษต้องมีสมาชิก 2 คน</div>
      <div className={styles.field}>
        <label>รหัสนักศึกษาคนที่ 2 (บังคับ)</label>
        <input
          value={member2}
          onChange={(event) => setMember2(event.target.value)}
          placeholder="กรอกรหัสนักศึกษา 13 หลัก"
          disabled={memberLocked}
        />
      </div>
      {errors.length > 0 ? <div className={styles.notice}>{errors.join(" ")}</div> : null}
      {!memberLocked ? (
        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleApply}
          disabled={errors.length > 0 || loading}
        >
          {loading ? "กำลังบันทึก..." : projectId ? "บันทึก & Sync" : "บันทึกในดราฟท์"}
        </button>
      ) : null}
      <div className={styles.tagRow}>
        <span className={styles.tag}>คนที่ 1 (คุณ)</span>
        {members.secondMemberCode ? (
          <span className={`${styles.tag} ${styles.tagSuccess}`}>คนที่ 2: {members.secondMemberCode}</span>
        ) : (
          <span className={styles.tag}>ยังไม่มีสมาชิกเพิ่ม</span>
        )}
        {members.error ? <span className={`${styles.tag} ${styles.tagWarning}`}>{members.error}</span> : null}
      </div>
    </div>
  );
}
