import { StatCard } from "@/components/dashboard/StatCard";
import styles from "./page.module.css";

// แปลง role เป็นภาษาไทยสำหรับแสดงผลใน UI
const ROLE_LABELS: Record<string, string> = {
  student: "นักศึกษา",
  teacher: "อาจารย์",
  admin: "ผู้ดูแลระบบ",
};

type DashboardRoleViewProps = {
  roleLabel: string;
  summary: string;
  stats?: Array<{ label: string; value: string | number }>;
  children?: React.ReactNode;
};

export function DashboardRoleView({ roleLabel, summary, stats, children }: DashboardRoleViewProps) {
  const resolvedStats = stats ?? [];
  // ใช้ชื่อภาษาไทยถ้ามี มิฉะนั้นใช้ค่า roleLabel เดิม
  const displayLabel = ROLE_LABELS[roleLabel.toLowerCase()] ?? roleLabel;
  return (
    <section className={styles.wrapper}>
      <div className={styles.hero}>
        <h1>แดชบอร์ด{displayLabel}</h1>
        <p>{summary}</p>
        <p className={styles.roleBadge}>สิทธิ์การเข้าถึง: {displayLabel}</p>
      </div>

      {resolvedStats.length > 0 ? (
        <div className={styles.grid}>
          {resolvedStats.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      ) : null}

      {children}
    </section>
  );
}
