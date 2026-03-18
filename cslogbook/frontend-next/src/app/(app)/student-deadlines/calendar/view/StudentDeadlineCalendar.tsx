"use client";

import { useMemo, useState } from "react";
import styles from "./calendar.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentDeadlineCalendar } from "@/hooks/useStudentDeadlineCalendar";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";
import type { StudentDeadlineDetail } from "@/lib/services/studentService";

const thaiDateTime = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const thaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type CalendarItem = StudentDeadlineDetail & {
  startDate: Date | null;
  endDate: Date | null;
};

function parseDate(dateStr?: string | null, timeStr?: string | null): Date | null {
  if (!dateStr) return null;
  const iso = `${dateStr}T${timeStr || "08:00:00"}+07:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildDates(item: StudentDeadlineDetail) {
  // window period → start/end
  if (item.isWindow && item.windowStartDate) {
    return {
      startDate: parseDate(item.windowStartDate, item.windowStartTime),
      endDate: parseDate(item.windowEndDate, item.windowEndTime),
    };
  }
  // single deadline
  const end = parseDate(item.deadlineDate, item.deadlineTime)
    || (item.effectiveDeadlineAt ? new Date(item.effectiveDeadlineAt) : null)
    || (item.deadlineAt ? new Date(item.deadlineAt) : null);
  return { startDate: null, endDate: end };
}

function relatedLabel(relatedTo?: string | null) {
  if (!relatedTo) return "ทั่วไป";
  if (relatedTo.toLowerCase().includes("internship")) return "ฝึกงาน";
  if (relatedTo.toLowerCase().includes("project2")) return "ปริญญานิพนธ์";
  if (relatedTo.toLowerCase().includes("project1")) return "โครงงานพิเศษ 1";
  if (relatedTo.toLowerCase().includes("project")) return "โครงงานพิเศษ";
  return "ทั่วไป";
}

function relatedSortOrder(relatedTo?: string | null) {
  if (!relatedTo) return 99;
  const r = relatedTo.toLowerCase();
  if (r.includes("project1")) return 1;
  if (r.includes("project2")) return 2;
  if (r.includes("project")) return 3;
  if (r.includes("internship")) return 4;
  return 99;
}

function formatCell(d: Date | null, allDay?: boolean | null) {
  if (!d) return "";
  return allDay ? thaiDate.format(d) : thaiDateTime.format(d);
}

export default function StudentDeadlineCalendar() {
  const { token } = useAuth();
  const hydrated = useHydrated();
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const queriesEnabled = hydrated && Boolean(token);
  const { data, isLoading, error } = useStudentDeadlineCalendar(token, null, queriesEnabled);
  const { data: eligibilityData } = useStudentEligibility(token, queriesEnabled);
  const currentAcademicYear = eligibilityData?.academicSettings?.currentAcademicYear ?? null;

  const calendarData = useMemo(() => {
    if (!data) return [] as CalendarItem[];
    return data
      .map((item) => {
        const { startDate, endDate } = buildDates(item);
        if (!startDate && !endDate) return null;
        return { ...item, startDate, endDate } as CalendarItem;
      })
      .filter((item): item is CalendarItem => item !== null);
  }, [data]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    calendarData.forEach((item) => {
      if (item.academicYear) years.add(String(item.academicYear));
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [calendarData]);

  const filteredData = useMemo(() => {
    if (selectedYear === "all") return calendarData;
    return calendarData.filter((item) => String(item.academicYear) === selectedYear);
  }, [calendarData, selectedYear]);

  // จัดกลุ่มตามหมวด (relatedTo)
  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; order: number; items: CalendarItem[] }>();
    filteredData.forEach((item) => {
      const key = item.relatedTo || "general";
      if (!map.has(key)) {
        map.set(key, {
          label: relatedLabel(item.relatedTo),
          order: relatedSortOrder(item.relatedTo),
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    });
    // sort groups
    const groups = Array.from(map.values()).sort((a, b) => a.order - b.order);
    // sort items within groups by endDate
    groups.forEach((g) =>
      g.items.sort((a, b) => {
        const da = (a.endDate ?? a.startDate)?.getTime() ?? 0;
        const db = (b.endDate ?? b.startDate)?.getTime() ?? 0;
        return da - db;
      })
    );
    return groups;
  }, [filteredData]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>ปฏิทินกำหนดการ</h1>
          <p className={styles.subtitle}>
            กำหนดส่งเอกสาร และเหตุการณ์สำคัญ
            {currentAcademicYear ? ` — ปีการศึกษา ${currentAcademicYear}` : ""}
          </p>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="yearFilter">ปีการศึกษา</label>
          <select
            id="yearFilter"
            className={styles.filterSelect}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="all">ทั้งหมด</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className={styles.error}>โหลดกำหนดการไม่สำเร็จ</p>}
      {isLoading && !calendarData.length && <div className={styles.skeleton} />}

      {!isLoading && filteredData.length === 0 ? (
        <div className={styles.empty}>
          <p>ไม่มีกำหนดการ{selectedYear !== "all" ? ` ในปีการศึกษา ${selectedYear}` : ""}</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thName}>รายการ</th>
                <th className={styles.thDate}>วันเริ่มต้น</th>
                <th className={styles.thDate}>วันสุดท้าย</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((group) => (
                <GroupRows key={group.label} label={group.label} items={group.items} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GroupRows({ label, items }: { label: string; items: CalendarItem[] }) {
  return (
    <>
      <tr className={styles.groupRow}>
        <td colSpan={3} className={styles.groupCell}>
          {label}
        </td>
      </tr>
      {items.map((item) => (
        <tr key={item.id} className={styles.row}>
          <td className={styles.tdName}>
            <span className={styles.nameText}>{item.name}</span>
            {item.isCritical && <span className={styles.criticalBadge}>สำคัญมาก</span>}
          </td>
          <td className={styles.tdDateVal}>{formatCell(item.startDate, item.allDay)}</td>
          <td className={styles.tdDateVal}>{formatCell(item.endDate, item.allDay)}</td>
        </tr>
      ))}
    </>
  );
}
