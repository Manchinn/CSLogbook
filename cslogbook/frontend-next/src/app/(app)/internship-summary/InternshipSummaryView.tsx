"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentInternshipStatus } from "@/hooks/useStudentInternshipStatus";
import styles from "./summary.module.css";

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });

function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return dateFormatter.format(parsed);
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("th-TH", { maximumFractionDigits: 1 });
}

export default function InternshipSummaryView() {
  const { token } = useAuth();
  const hydrated = useHydrated();
  const enabled = hydrated && Boolean(token);

  const statusQuery = useStudentInternshipStatus(token, enabled);

  if (!enabled) {
    return <div className={styles.card}>กำลังเตรียมข้อมูล...</div>;
  }

  if (statusQuery.isLoading) {
    return <div className={styles.card}>กำลังโหลดข้อมูลสรุปการฝึกงาน...</div>;
  }

  if (statusQuery.isError) {
    return (
      <div className={`${styles.card} ${styles.calloutDanger}`}>
        โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่
      </div>
    );
  }

  const summary = statusQuery.data?.summary ?? null;
  const stats = statusQuery.data?.stats ?? null;

  if (!summary) {
    return (
      <div className={`${styles.card} ${styles.callout}`}> 
        <div className={styles.calloutTitle}>ยังไม่มีข้อมูลสรุปการฝึกงาน</div>
        <div className={styles.calloutBody}>
          กรุณาบันทึกสมุดบันทึกและส่งข้อมูลให้ครบถ้วนเพื่อสร้างสรุป
        </div>
        <Link className={styles.linkButton} href="/internship/logbook">
          ไปที่สมุดบันทึก
        </Link>
      </div>
    );
  }

  const companyName = summary.companyName || "สถานประกอบการ";
  const supervisorContact = [summary.supervisorPhone, summary.supervisorEmail]
    .filter(Boolean)
    .join(" | ") || "-";

  return (
    <div className={styles.page}>
      <div className={styles.titleBar}>
        <div>
          <div className={styles.overline}>สรุปผลการฝึกงาน</div>
          <h1 className={styles.heading}>{companyName}</h1>
          <p className={styles.subhead}>
            ช่วงฝึกงาน {formatDate(summary.startDate)} - {formatDate(summary.endDate)}
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/internship/logbook" className={styles.linkButton}>
            เปิดสมุดบันทึก
          </Link>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.label}>ชั่วโมงที่อนุมัติแล้ว</div>
          <div className={styles.statValue}>{formatNumber(summary.approvedHours)}</div>
          <div className={styles.statLabel}>
            จากทั้งหมด {formatNumber(summary.totalHours)} ชั่วโมง
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>จำนวนวันทำงาน</div>
          <div className={styles.statValue}>{formatNumber(summary.approvedDays)}</div>
          <div className={styles.statLabel}>
            บันทึกทั้งหมด {formatNumber(summary.totalDays)} วัน
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>ค่าเฉลี่ยชั่วโมง/วัน</div>
          <div className={styles.statValue}>{formatNumber(stats?.averageHoursPerDay ?? null)}</div>
          <div className={styles.statLabel}>
            เหลืออีก {formatNumber(stats?.remainingDays ?? null)} วัน
          </div>
        </div>
      </div>

      <div className={styles.gridWide}>
        <div className={styles.card}>
          <div className={styles.label}>ที่อยู่บริษัท</div>
          <div className={styles.value}>{summary.companyAddress || "-"}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>ผู้ควบคุมงาน</div>
          <div className={styles.value}>{summary.supervisorName || "-"}</div>
          <div className={styles.meta}>{summary.supervisorPosition || ""}</div>
          <div className={styles.meta}>{supervisorContact}</div>
        </div>
      </div>

      {summary.learningOutcome ? (
        <div className={styles.card}>
          <div className={styles.label}>บทสรุปประสบการณ์</div>
          <div className={styles.value}>{summary.learningOutcome}</div>
        </div>
      ) : null}
    </div>
  );
}
