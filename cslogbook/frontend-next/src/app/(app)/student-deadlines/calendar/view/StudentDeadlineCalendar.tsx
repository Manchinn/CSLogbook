"use client";

import { useMemo, useState } from "react";
import styles from "./calendar.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentDeadlineCalendar } from "@/hooks/useStudentDeadlineCalendar";
import type { StudentDeadlineDetail } from "@/lib/services/studentService";

const monthLabelFormatter = new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" });
const dayFormatter = new Intl.DateTimeFormat("th-TH", { day: "2-digit" });
const monthShortFormatter = new Intl.DateTimeFormat("th-TH", { month: "short" });
const dateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  hour12: false,
});

type StudentDeadlineCalendarProps = Record<string, never>;

type CalendarItem = StudentDeadlineDetail & { eventDate: Date };

function buildLocalDate(deadline: StudentDeadlineDetail): Date | null {
  const { windowEndDate, windowEndTime, deadlineDate, deadlineTime, effectiveDeadlineAt, deadlineAt } = deadline;
  const fallbackDate = windowEndDate || deadlineDate;
  const fallbackTime = windowEndDate ? windowEndTime || deadlineTime : deadlineTime;

  if (fallbackDate) {
    const localIso = `${fallbackDate}T${fallbackTime || "23:59:59"}+07:00`;
    const parsed = new Date(localIso);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (effectiveDeadlineAt) {
    const parsed = new Date(effectiveDeadlineAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (deadlineAt) {
    const parsed = new Date(deadlineAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function statusLabel(status?: string | null) {
  switch (status) {
    case "in_window":
      return "กำลังเปิดรับ";
    case "overdue":
      return "เกินกำหนด";
    case "locked":
      return "ปิดรับ";
    case "submitted":
      return "ส่งแล้ว";
    case "submitted_late":
      return "ส่งแล้ว (ช้า)";
    case "announcement":
      return "ประกาศ";
    default:
      return "กำลังจะถึง";
  }
}

function statusTone(status?: string | null) {
  switch (status) {
    case "submitted":
      return styles.toneSuccess;
    case "submitted_late":
      return styles.toneAccent;
    case "in_window":
      return styles.toneInfo;
    case "overdue":
      return styles.toneWarning;
    case "locked":
      return styles.toneMuted;
    case "announcement":
      return styles.toneAccent;
    default:
      return styles.toneInfo;
  }
}

function relatedLabel(relatedTo?: string | null) {
  if (!relatedTo) return "ทั่วไป";
  if (relatedTo.toLowerCase().includes("internship")) return "ฝึกงาน";
  if (relatedTo.toLowerCase().includes("project2")) return "โครงงาน 2";
  if (relatedTo.toLowerCase().includes("project1")) return "โครงงาน 1";
  if (relatedTo.toLowerCase().includes("project")) return "โครงงานพิเศษ";
  return "ทั่วไป";
}

function formatRange(deadline: StudentDeadlineDetail) {
  if (deadline.isWindow && deadline.windowStartDate && deadline.windowEndDate) {
    const startIso = `${deadline.windowStartDate}T${deadline.windowStartTime || "00:00:00"}+07:00`;
    const endIso = `${deadline.windowEndDate}T${deadline.windowEndTime || "23:59:59"}+07:00`;
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return `${dateTimeFormatter.format(start)} - ${dateTimeFormatter.format(end)}`;
    }
  }
  return null;
}

export default function StudentDeadlineCalendar({}: StudentDeadlineCalendarProps) {
  const { token } = useAuth();
  const hydrated = useHydrated();
  const [selectedYear, setSelectedYear] = useState<string | "all">("all");
  const [hideSubmitted, setHideSubmitted] = useState(false);
  const [focusOpenOnly, setFocusOpenOnly] = useState(true);

  const queriesEnabled = hydrated && Boolean(token);
  const { data, isLoading, isFetching, error } = useStudentDeadlineCalendar(
    token,
    selectedYear === "all" ? null : selectedYear,
    queriesEnabled
  );

  const calendarData = useMemo(() => {
    if (!data) return [] as CalendarItem[];
    return data
      .map((item) => {
        const eventDate = buildLocalDate(item);
        if (!eventDate) return null;
        return { ...item, eventDate } as CalendarItem;
      })
      .filter(Boolean)
      .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime()) as CalendarItem[];
  }, [data]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    calendarData.forEach((item) => {
      if (item.academicYear) years.add(String(item.academicYear));
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [calendarData]);

  const filtered = useMemo(() => {
    let items = calendarData;
    if (hideSubmitted) {
      items = items.filter((item) => !(item.submission?.submitted));
    }
    if (focusOpenOnly) {
      items = items.filter((item) => !["submitted", "submitted_late", "locked"].includes(item.status ?? ""));
    }
    return items;
  }, [calendarData, focusOpenOnly, hideSubmitted]);

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
    const submitted = calendarData.filter((item) => item.submission?.submitted).length;
    const overdue = calendarData.filter((item) => ["overdue", "locked"].includes(item.status ?? "")).length;
    const open = calendarData.filter((item) => ["in_window", "upcoming"].includes(item.status ?? "")).length;
    return { total, submitted, overdue, open };
  }, [calendarData]);

  const renderDeadlineCard = (item: CalendarItem) => {
    const status = statusLabel(item.status);
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
            <span className={`${styles.statusChip} ${statusTone(item.status)}`}>{status}</span>
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

          <div className={styles.submissionRow}>
            {item.submission?.submitted ? (
              <p className={styles.submissionOk}>
                ส่งแล้ว • {item.submission.late ? "ช้า" : "ตรงเวลา"}
                {item.submission.status ? ` • ${item.submission.status}` : ""}
              </p>
            ) : (
              <p className={styles.submissionPending}>ยังไม่ส่ง ({item.acceptingSubmissions === false ? "ปิดรับ" : "เปิดรับ"})</p>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Student Deadlines</p>
          <h1 className={styles.title}>ปฏิทินกำหนดการนักศึกษา</h1>
          <p className={styles.lead}>ดู timeline ของทุก workflow พร้อมสถานะส่งงานแบบรวมศูนย์</p>
        </div>
        <div className={styles.heroActions}>{isFetching ? <span className={styles.fetching}>กำลังอัปเดต...</span> : null}</div>
      </section>

      <section className={styles.controls}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="academicYear">
            ปีการศึกษา
          </label>
          <select
            id="academicYear"
            className={styles.select}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="all">ทั้งหมด</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={focusOpenOnly}
            onChange={(e) => setFocusOpenOnly(e.target.checked)}
          />
          แสดงเฉพาะรายการที่ยังเปิดหรือใกล้ถึง
        </label>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={hideSubmitted}
            onChange={(e) => setHideSubmitted(e.target.checked)}
          />
          ซ่อนรายการที่ส่งแล้ว
        </label>
      </section>

      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>กำหนดส่งทั้งหมด</p>
          <p className={styles.statValue}>{summary.total}</p>
          <p className={styles.statHint}>รวมทุก workflow และประเภทเอกสาร</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>กำลังเปิด / ใกล้ถึง</p>
          <p className={styles.statValue}>{summary.open}</p>
          <p className={styles.statHint}>ยังมีเวลาเตรียมตัว</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>ส่งแล้ว</p>
          <p className={styles.statValue}>{summary.submitted}</p>
          <p className={styles.statHint}>รวมส่งตรงเวลาและส่งช้า</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>เกินกำหนด / ปิดรับ</p>
          <p className={styles.statValue}>{summary.overdue}</p>
          <p className={styles.statHint}>ควรติดตามเจ้าหน้าที่หากจำเป็น</p>
        </article>
      </section>

      {error ? <p className={styles.error}>โหลดกำหนดการไม่สำเร็จ</p> : null}
      {isLoading && !calendarData.length ? <div className={styles.skeleton} /> : null}

      {!isLoading && filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>ยังไม่มีกำหนดการที่ตรงกับตัวกรอง</p>
          <p className={styles.emptyHint}>ลองเลือกปีการศึกษาอื่น หรือปิดตัวกรองซ่อนรายการ</p>
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
}
