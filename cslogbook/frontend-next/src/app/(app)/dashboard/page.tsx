import styles from "./page.module.css";

const stats = [
  { label: "Active Students", value: "128" },
  { label: "Pending Reviews", value: "24" },
  { label: "Upcoming Deadlines", value: "7" },
];

export default function DashboardPage() {
  return (
    <section className={styles.wrapper}>
      <div className={styles.hero}>
        <h1>Dashboard</h1>
        <p>ภาพรวมงานล่าสุดของระบบ เพื่อเริ่มจัดการ workflow ประจำวัน</p>
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
