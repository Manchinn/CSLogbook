import styles from "./page.module.css";

type DashboardPageProps = {
  searchParams: Promise<{
    role?: string;
  }>;
};

const stats = [
  { label: "Active Students", value: "128" },
  { label: "Pending Reviews", value: "24" },
  { label: "Upcoming Deadlines", value: "7" },
];

const roleLabelMap: Record<string, string> = {
  student: "Student",
  teacher: "Teacher",
  admin: "Admin",
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const role = params.role ?? "student";

  return (
    <section className={styles.wrapper}>
      <div className={styles.hero}>
        <h1>Dashboard</h1>
        <p>ภาพรวมงานล่าสุดของระบบ เพื่อเริ่มจัดการ workflow ประจำวัน</p>
        <p className={styles.roleBadge}>Current role: {roleLabelMap[role] ?? "Student"}</p>
      </div>

      <div className={styles.grid}>
        {stats.map((item) => (
          <article className={styles.card} key={item.label}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
