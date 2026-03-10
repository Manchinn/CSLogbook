import styles from "@/styles/requestPage.module.css";

export interface TimelineItem {
  key: string;
  label: string;
  timestamp?: string | null;
  extra?: string;
}

interface RequestTimelineProps {
  items: TimelineItem[];
  loading?: boolean;
  emptyText?: string;
  formatTimestamp: (value?: string | null) => string;
}

export function RequestTimeline({
  items,
  loading,
  emptyText = "ยังไม่มีข้อมูลไทม์ไลน์",
  formatTimestamp,
}: RequestTimelineProps) {
  return (
    <section className={styles.card}>
      <h3 className={styles.sectionTitle}>ไทม์ไลน์สถานะ</h3>
      {loading ? <p className={styles.notice}>กำลังโหลดสถานะ...</p> : null}
      {!loading && items.length === 0 ? <p className={styles.notice}>{emptyText}</p> : null}
      {items.length > 0 ? (
        <ul className={styles.timeline}>
          {items.map((item) => (
            <li key={item.key} className={styles.timelineItem}>
              <span className={styles.timelineDot} />
              <div>
                <p className={styles.timelineTitle}>{item.label}</p>
                <p className={styles.timelineMeta}>{formatTimestamp(item.timestamp)}</p>
                {item.extra ? <p className={styles.timelineMeta}>{item.extra}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
