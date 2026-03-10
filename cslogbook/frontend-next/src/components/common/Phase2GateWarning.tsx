import styles from "@/styles/requestPage.module.css";

interface Phase2GateWarningProps {
  reasons: string[];
}

export function Phase2GateWarning({ reasons }: Phase2GateWarningProps) {
  if (reasons.length === 0) return null;

  return (
    <section className={styles.noticeWarning}>
      <p className={styles.noticeTitle}>ปริญญานิพนธ์ยังไม่ปลดล็อก</p>
      <ul className={styles.noticeList}>
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </section>
  );
}
