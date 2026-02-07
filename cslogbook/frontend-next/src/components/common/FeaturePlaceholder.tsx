import styles from "./FeaturePlaceholder.module.css";

type FeaturePlaceholderProps = {
  title: string;
  description: string;
  legacyHref?: string | null;
  children?: React.ReactNode;
};

export function FeaturePlaceholder({ title, description, legacyHref, children }: FeaturePlaceholderProps) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <p className={styles.badge}>Coming soon</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </header>

      {children ? <div className={styles.content}>{children}</div> : null}

      <footer className={styles.footer}>
        <p className={styles.hint}>ฟีเจอร์นี้กำลังถูกย้ายเข้ามาใน frontend-next</p>
        {legacyHref ? (
          <a className={styles.link} href={legacyHref} rel="noopener noreferrer">
            เปิดหน้าระบบเดิม
          </a>
        ) : null}
      </footer>
    </section>
  );
}
