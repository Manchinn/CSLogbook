import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>CSLogbook Frontend Starter</h1>
          <p>
            โปรเจกต์เริ่มต้นสำหรับพัฒนา frontend ด้วย Next.js และ TypeScript
            เพื่อใช้เป็นฐานสำหรับระบบ CSLogbook เวอร์ชันใหม่
          </p>
        </div>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Next.js Docs
          </a>
          <a
            className={styles.secondary}
            href="https://www.typescriptlang.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            TypeScript Docs
          </a>
        </div>
      </main>
    </div>
  );
}
