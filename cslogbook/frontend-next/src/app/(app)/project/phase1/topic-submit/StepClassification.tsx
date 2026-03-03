"use client";

import { PROJECT_TRACKS } from "@/lib/constants/projectTracks";
import { useProjectDraft } from "./ProjectDraftContext";
import styles from "./topicSubmit.module.css";

export function StepClassification() {
  const { classification, setClassification, projectStatus } = useProjectDraft();
  const tracksReadOnly = ["completed", "archived"].includes(projectStatus);

  const toggleTrack = (code: string) => {
    if (tracksReadOnly) return;
    const exists = classification.tracks.includes(code);
    if (exists) {
      setClassification({ tracks: classification.tracks.filter((track) => track !== code) });
    } else {
      setClassification({ tracks: [...classification.tracks, code] });
    }
  };

  return (
    <div className={styles.sectionContent}>
      <p className={styles.sectionHint}>เลือกแทร็กอย่างน้อย 1 สาย (กดเพื่อเลือก/ยกเลิก)</p>
      <div className={styles.tagRow}>
        {PROJECT_TRACKS.map((track) => {
          const selected = classification.tracks.includes(track.code);
          return (
            <button
              key={track.code}
              type="button"
              className={`${styles.trackButton} ${selected ? styles.trackButtonSelected : ""}`}
              onClick={() => toggleTrack(track.code)}
              disabled={tracksReadOnly}
            >
              {selected ? "✓ " : ""}{track.label}
            </button>
          );
        })}
      </div>
      <p className={styles.sectionHint}>อาจารย์ที่ปรึกษาจะถูกกำหนดโดยเจ้าหน้าที่ภาควิชาหลังสอบหัวข้อ</p>
    </div>
  );
}
