"use client";

import { useMemo } from "react";
import { formatThaiDateTime } from "@/lib/utils/thaiDateUtils";
import type { ImportantDeadline } from "@/lib/services/importantDeadlineService";
import styles from "./DeadlineTimeline.module.css";

const THAI_MONTHS = [
  "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const RELATED_LABEL: Record<string, string> = {
  internship: "ฝึกงาน",
  project1: "โครงงานพิเศษ 1",
  project2: "ปริญญานิพนธ์",
  project: "โครงงานพิเศษ",
  general: "ทั่วไป",
};

const RELATED_TAG: Record<string, string> = {
  internship: styles.tagInternship,
  project1: styles.tagProject1,
  project2: styles.tagProject2,
  project: styles.tagProject,
  general: styles.tagGeneral,
};

const TYPE_LABEL: Record<string, string> = {
  SUBMISSION: "ส่งเอกสาร",
  ANNOUNCEMENT: "ประกาศ",
  MILESTONE: "เหตุการณ์สำคัญ",
  MANUAL: "กำหนดเอง",
};

type MonthGroup = {
  key: string;
  label: string;
  items: ImportantDeadline[];
};

function groupByMonth(deadlines: ImportantDeadline[]): MonthGroup[] {
  const map = new Map<string, ImportantDeadline[]>();

  const sorted = [...deadlines].sort((a, b) => {
    const da = a.deadlineDate || "";
    const db = b.deadlineDate || "";
    return da.localeCompare(db);
  });

  for (const d of sorted) {
    const dateStr = d.deadlineDate || "";
    if (!dateStr) {
      const key = "no-date";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
      continue;
    }
    // dateStr format: YYYY-MM-DD
    const [year, month] = dateStr.split("-");
    const key = `${year}-${month}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(d);
  }

  return Array.from(map.entries()).map(([key, items]) => {
    if (key === "no-date") {
      return { key, label: "ไม่ระบุวันที่", items };
    }
    const [year, month] = key.split("-");
    const m = parseInt(month, 10);
    const beYear = parseInt(year, 10) >= 2500 ? parseInt(year, 10) : parseInt(year, 10) + 543;
    return {
      key,
      label: `${THAI_MONTHS[m]} ${beYear}`,
      items,
    };
  });
}

type Props = {
  deadlines: ImportantDeadline[];
};

export function DeadlineTimeline({ deadlines }: Props) {
  const groups = useMemo(() => groupByMonth(deadlines), [deadlines]);

  if (deadlines.length === 0) {
    return <div className={styles.empty}>ไม่มีกำหนดการที่ตรงกับตัวกรอง</div>;
  }

  return (
    <div className={styles.timeline}>
      {groups.map((group) => (
        <div key={group.key} className={styles.monthGroup}>
          <div className={styles.monthHeader}>
            {group.label}
            <span className={styles.monthBadge}>{group.items.length}</span>
          </div>
          {group.items.map((d) => {
            const related = (d.relatedTo || "general").toLowerCase();
            return (
              <div key={d.id} className={styles.item}>
                <div className={styles.itemMain}>
                  <div className={styles.itemName}>{d.name}</div>
                  <div className={styles.itemMeta}>
                    <span className={`${styles.tag} ${RELATED_TAG[related] || styles.tagGeneral}`}>
                      {RELATED_LABEL[related] || related}
                    </span>
                    {d.deadlineType && (
                      <span className={`${styles.tag} ${styles.tagType}`}>
                        {TYPE_LABEL[d.deadlineType] || d.deadlineType}
                      </span>
                    )}
                    {d.isCritical && (
                      <span className={`${styles.tag} ${styles.tagCritical}`}>สำคัญ</span>
                    )}
                    <span>{d.academicYear ?? ""}/{d.semester ?? ""}</span>
                  </div>
                </div>
                <div>
                  <div className={styles.itemDate}>
                    {formatThaiDateTime(d.deadlineDate, undefined)}
                  </div>
                  {d.deadlineTime && (
                    <div className={styles.itemTime}>{d.deadlineTime} น.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
