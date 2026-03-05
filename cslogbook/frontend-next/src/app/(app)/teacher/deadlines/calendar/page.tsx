"use client";

import { useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { TeacherPageScaffold } from "@/components/teacher/TeacherPageScaffold";
import { useTeacherImportantDeadlines } from "@/hooks/useTeacherModule";
import type { TeacherDeadline } from "@/lib/services/teacherService";
import styles from "./TeacherCalendar.module.css";

/* ── Thai formatters ── */

const monthLabelFormatter = new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" });
const dayFormatter = new Intl.DateTimeFormat("th-TH", { day: "2-digit" });
const monthShortFormatter = new Intl.DateTimeFormat("th-TH", { month: "short" });
const dateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  hour12: false,
});

/* ── Helpers ── */

type CalendarItem = TeacherDeadline & { eventDate: Date };

function buildLocalDate(d: TeacherDeadline): Date | null {
  const fallbackDate = d.windowEndDate || d.deadlineDate;
  const fallbackTime = d.windowEndDate ? d.windowEndTime || d.deadlineTime : d.deadlineTime;

  if (fallbackDate) {
    const parsed = new Date(`${fallbackDate}T${fallbackTime || "23:59:59"}+07:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (d.effectiveDeadlineAt) {
    const parsed = new Date(d.effectiveDeadlineAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (d.deadlineAt) {
    const parsed = new Date(d.deadlineAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function statusLabel(status?: string | null) {
  switch (status) {
    case "in_window": return "กำลังเปิดรับ";
    case "overdue": return "เกินกำหนด";
    case "locked": return "ปิดรับ";
    case "announcement": return "ประกาศ";
    default: return "กำลังจะถึง";
  }
}

function statusTone(status?: string | null) {
  switch (status) {
    case "in_window": return styles.toneInfo;
    case "overdue": return styles.toneWarning;
    case "locked": return styles.toneMuted;
    case "announcement": return styles.toneAccent;
    default: return styles.toneInfo;
  }
}

function relatedLabel(relatedTo?: string | null) {
  if (!relatedTo) return "ทั่วไป";
  const val = relatedTo.toLowerCase();
  if (val.includes("internship")) return "ฝึกงาน";
  if (val.includes("project2")) return "ปริญญานิพนธ์";
  if (val.includes("project1")) return "โครงงานพิเศษ 1";
  if (val.includes("project")) return "โครงงานพิเศษ";
  return "ทั่วไป";
}

function formatRange(d: TeacherDeadline) {
  if (d.isWindow && d.windowStartDate && d.windowEndDate) {
    const start = new Date(`${d.windowStartDate}T${d.windowStartTime || "00:00:00"}+07:00`);
    const end = new Date(`${d.windowEndDate}T${d.windowEndTime || "23:59:59"}+07:00`);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return `${dateTimeFormatter.format(start)} - ${dateTimeFormatter.format(end)}`;
    }
  }
  return null;
}

/* ── Component ── */

export default function TeacherDeadlinesCalendarPage() {
  const { data: deadlines = [], isLoading, isFetching, error } = useTeacherImportantDeadlines();
  const [selectedYear, setSelectedYear] = useState<string | "all">("all");
  const [focusOpenOnly, setFocusOpenOnly] = useState(true);

  const calendarData = useMemo(() => {
    if (!deadlines.length) return [] as CalendarItem[];
    return deadlines
      .map((item) => {
        const eventDate = buildLocalDate(item);
        if (!eventDate) return null;
        return { ...item, eventDate } as CalendarItem;
      })
      .filter((item): item is CalendarItem => item !== null)
      .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
  }, [deadlines]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    calendarData.forEach((item) => {
      if (item.academicYear) years.add(String(item.academicYear));
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [calendarData]);

  const filtered = useMemo(() => {
    let items = calendarData;
    if (selectedYear !== "all") {
      items = items.filter((item) => String(item.academicYear) === selectedYear);
    }
    if (focusOpenOnly) {
      items = items.filter((item) => !["locked"].includes(item.status ?? ""));
    }
    return items;
  }, [calendarData, selectedYear, focusOpenOnly]);

  const groupedByMonth = useMemo(() => {
    const groups = new Map<string, { label: string; items: CalendarItem[] }>();
    filtered.forEach((item) => {
      const key = `${item.eventDate.getFullYear()}-${item.eventDate.getMonth()}`;
      if (!groups.has(key)) {
        groups.set(key, { label: monthLabelFormatter.format(item.eventDate), items: [] });
      }
      groups.get(key)?.items.push(item);
    });
    return Array.from(groups.values()).map((group) => ({
      ...group,
      items: group.items.sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime()),
    }));
  }, [filtered]);

  const summary = useMemo(() => {
    const total = calendarData.length;
    const overdue = calendarData.filter((item) => ["overdue", "locked"].includes(item.status ?? "")).length;
    const open = calendarData.filter((item) => ["in_window", "upcoming"].includes(item.status ?? "")).length;
    return { total, overdue, open };
  }, [calendarData]);

  const renderDeadlineCard = (item: CalendarItem) => {
    const range = formatRange(item);
    const countdown = item.daysLeft !== undefined && item.daysLeft !== null ? `${item.daysLeft} วัน` : "-";

    return (
      <article key={`${item.id}-${item.eventDate.toISOString()}`} className={styles.deadlineCard}>
        <div className={styles.dateBadge}>
          <span className={styles.dateDay}>{dayFormatter.format(item.eventDate)}</span>
          <span className={styles.dateMonth}>{monthShortFormatter.format(item.eventDate)}</span>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.deadlineLabel}>{relatedLabel(item.relatedTo)}</p>
              <h3 className={styles.deadlineTitle}>{item.name}</h3>
            </div>
            <span className={`${styles.statusChip} ${statusTone(item.status)}`}>
              {statusLabel(item.status)}
            </span>
          </div>

          <p className={styles.metaRow}>
            ปี/เทอม {item.academicYear ?? "-"}/{item.semester ?? "-"} • {item.deadlineType ?? "SUBMISSION"}
          </p>

          <div className={styles.timelineRow}>
            <div className={styles.timelineDot} />
            <div className={styles.timelineContent}>
              <p className={styles.timeLabel}>{dateTimeFormatter.format(item.eventDate)}</p>
              {range ? <p className={styles.rangeLabel}>{range}</p> : null}
            </div>
          </div>

          <div className={styles.flagsRow}>
            <span className={styles.flag}>เหลือ {countdown}</span>
            {item.acceptingSubmissions === false ? <span className={styles.flagMuted}>ไม่เปิดรับ</span> : null}
            {item.allowLate ? <span className={styles.flag}>ยื่นสายได้</span> : null}
            {item.lockAfterDeadline ? <span className={styles.flagDanger}>ล็อกหลังครบกำหนด</span> : null}
            {item.isCritical ? <span className={styles.flagDanger}>Critical</span> : null}
          </div>
        </div>
      </article>
    );
  };

  const pageContent = (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Teacher Deadlines</p>
          <h1 className={styles.title}>ปฏิทินกำหนดการ</h1>
          <p className={styles.lead}>ดู timeline ของกำหนดการสำคัญทั้งหมดของภาควิชา</p>
        </div>
        <div className={styles.heroActions}>
          {isFetching ? <span className={styles.fetching}>กำลังอัปเดต...</span> : null}
        </div>
      </section>

      <section className={styles.controls}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="teacherAcademicYear">ปีการศึกษา</label>
          <select
            id="teacherAcademicYear"
            className={styles.select}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="all">ทั้งหมด</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={focusOpenOnly}
            onChange={(e) => setFocusOpenOnly(e.target.checked)}
          />
          ซ่อนรายการที่ปิดรับแล้ว
        </label>
      </section>

      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>กำหนดการทั้งหมด</p>
          <p className={styles.statValue}>{summary.total}</p>
          <p className={styles.statHint}>รวมทุกประเภทและหมวดหมู่</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>กำลังเปิด / ใกล้ถึง</p>
          <p className={styles.statValue}>{summary.open}</p>
          <p className={styles.statHint}>ยังไม่ถึงกำหนดหรือเปิดรับอยู่</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>เกินกำหนด / ปิดรับ</p>
          <p className={styles.statValue}>{summary.overdue}</p>
          <p className={styles.statHint}>ผ่านวันกำหนดไปแล้ว</p>
        </article>
      </section>

      {error ? <p className={styles.error}>โหลดกำหนดการไม่สำเร็จ</p> : null}
      {isLoading && !calendarData.length ? <div className={styles.skeleton} /> : null}

      {!isLoading && filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>ยังไม่มีกำหนดการที่ตรงกับตัวกรอง</p>
          <p className={styles.emptyHint}>ลองเลือกปีการศึกษาอื่น หรือปิดตัวกรอง</p>
        </div>
      ) : null}

      <div className={styles.monthGrid}>
        {groupedByMonth.map((group) => (
          <section key={group.label} className={styles.monthSection}>
            <div className={styles.monthHeader}>
              <div>
                <p className={styles.monthKicker}>เดือน</p>
                <h2 className={styles.monthTitle}>{group.label}</h2>
              </div>
              <span className={styles.monthCount}>{group.items.length} รายการ</span>
            </div>
            <div className={styles.cardList}>{group.items.map(renderDeadlineCard)}</div>
          </section>
        ))}
      </div>
    </div>
  );

  return (
    <RoleGuard roles={["teacher"]} teacherTypes={["academic"]}>
      <TeacherPageScaffold
        title="ปฏิทินกำหนดการ"
        description="ดูปฏิทินกำหนดการและ deadline สำคัญของภาควิชา"
      >
        {pageContent}
      </TeacherPageScaffold>
    </RoleGuard>
  );
}
