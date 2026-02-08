"use client";

import { useProjectDraft } from "./ProjectDraftContext";
import styles from "./topicSubmit.module.css";

export function StepDetails() {
  const { details, setDetails, projectStatus } = useProjectDraft();
  const readOnly = ["completed", "archived"].includes(projectStatus);

  return (
    <div className={styles.formGrid}>
      <div className={styles.field}>
        <label>ที่มา / เหตุผล</label>
        <textarea
          value={details.background}
          onChange={(event) => setDetails({ background: event.target.value })}
          placeholder="ที่มาของโครงงาน / ปัญหาที่ต้องการแก้ไข"
          disabled={readOnly}
        />
      </div>
      <div className={styles.field}>
        <label>เป้าหมาย</label>
        <textarea
          value={details.objective}
          onChange={(event) => setDetails({ objective: event.target.value })}
          placeholder="วัตถุประสงค์หลักของโครงงาน"
          disabled={readOnly}
        />
      </div>
      <div className={styles.field}>
        <label>ประโยชน์ที่จะได้รับ</label>
        <textarea
          value={details.benefit}
          onChange={(event) => setDetails({ benefit: event.target.value })}
          placeholder="ใครจะได้ประโยชน์ / ได้ประโยชน์อย่างไร"
          disabled={readOnly}
        />
      </div>
    </div>
  );
}
