import { StatCard } from "@/components/dashboard/StatCard";
import styles from "./page.module.css";

type DashboardRoleViewProps = {
  roleLabel: string;
  summary: string;
  stats?: Array<{ label: string; value: string | number }>;
  children?: React.ReactNode;
};

export function DashboardRoleView({ roleLabel, summary, stats, children }: DashboardRoleViewProps) {
  const resolvedStats = stats ?? [];
  return (
    <section className={styles.wrapper}>
      <div className={styles.hero}>
        <h1>{roleLabel} Dashboard</h1>
        <p>{summary}</p>
        <p className={styles.roleBadge}>Current role: {roleLabel}</p>
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
