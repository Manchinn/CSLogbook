import Link from "next/link";
import styles from "./AdminRouteScaffold.module.css";

type AdminRouteScaffoldProps = {
  title: string;
  description: string;
  legacyPath: string;
  apiChecklist: string[];
  implementationChecklist: string[];
};

export function AdminRouteScaffold({
  title,
  description,
  legacyPath,
  apiChecklist,
  implementationChecklist,
}: AdminRouteScaffoldProps) {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </section>

      <section className={styles.cardGrid}>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Legacy Reference</h2>
          <p className={styles.description}>
            อ้างอิง flow เดิมจาก{" "}
            <code>{legacyPath}</code>
          </p>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>API Checklist</h2>
          <ul className={styles.list}>
            {apiChecklist.map((item) => (
              <li key={item}>
                <code>{item}</code>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Next Steps</h2>
          <ul className={styles.list}>
            {implementationChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Related Pages</h2>
        <p className={styles.description}>
          ใช้งานเมนู admin ต่อเนื่องได้ที่{" "}
          <Link href="/dashboard/admin" className={styles.link}>
            /dashboard/admin
          </Link>{" "}
          และ{" "}
          <Link href="/admin/upload" className={styles.link}>
            /admin/upload
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
