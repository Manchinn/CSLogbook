"use client";

import { useProjectDraft } from "./ProjectDraftContext";
import styles from "./topicSubmit.module.css";

export function StepBasic() {
  const { basic, setBasic, projectStatus } = useProjectDraft();
  const locked = ["in_progress", "completed", "archived"].includes(projectStatus);
  const typeReadOnly = ["completed", "archived"].includes(projectStatus);

  return (
    <div className={styles.formGrid}>
      <div className={styles.field}>
        <label>ชื่อโครงงานภาษาไทย</label>
        <input
          value={basic.projectNameTh}
          onChange={(event) => setBasic({ projectNameTh: event.target.value })}
          disabled={locked}
          placeholder="กรอกชื่อโครงงานภาษาไทย"
        />
      </div>
      <div className={styles.field}>
        <label>ชื่อโครงงานภาษาอังกฤษ</label>
        <input
          value={basic.projectNameEn}
          onChange={(event) => setBasic({ projectNameEn: event.target.value })}
          disabled={locked}
          placeholder="Enter project name in English"
        />
      </div>
      <div className={styles.field}>
        <label>ประเภทโครงงาน</label>
        <select
          value={basic.projectType ?? ""}
          onChange={(event) => setBasic({ projectType: event.target.value || null })}
          disabled={typeReadOnly}
        >
          <option value="">เลือกประเภทโครงงาน</option>
          <option value="govern">องค์กรภายนอก</option>
          <option value="private">ภาควิชา</option>
          <option value="research">งานวิจัย</option>
        </select>
      </div>
    </div>
  );
}
