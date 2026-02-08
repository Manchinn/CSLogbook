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
    <div className={styles.panel}>
      <p className={styles.subtitle}>เลือกแทร็กอย่างน้อย 1 สาย</p>
      <div className={styles.tagRow}>
        {PROJECT_TRACKS.map((track) => {
          const selected = classification.tracks.includes(track.code);
          return (
            <button
              key={track.code}
              type="button"
              className={`${styles.tag} ${selected ? styles.tagSuccess : ""}`}
              onClick={() => toggleTrack(track.code)}
              disabled={tracksReadOnly}
            >
              {track.label}
            </button>
          );
        })}
      </div>
      <div className={styles.notice}>
        อาจารย์ที่ปรึกษาจะถูกกำหนดโดยเจ้าหน้าที่ภาควิชาหลังสอบหัวข้อ
      </div>
    </div>
  );
}
