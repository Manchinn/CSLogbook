"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./AppShell.module.css";
import { useAuth } from "@/contexts/AuthContext";

type AppShellProps = {
  children: React.ReactNode;
};

const primaryMenu = [
  { label: "App Home", href: "/app" },
  { label: "Student Dashboard", href: "/dashboard/student" },
  { label: "Teacher Dashboard", href: "/dashboard/teacher" },
  { label: "Admin Dashboard", href: "/dashboard/admin" },
];

const utilityMenu = [
  { label: "Timeline", href: "/dashboard/admin" },
  { label: "Settings", href: "/dashboard/admin" },
];

export function AppShell({ children }: AppShellProps) {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    signOut();
    router.push("/login");
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="แถบนำทางหลัก">
        <div className={styles.brandBlock}>
          <p className={styles.brandCaption}>CSLogbook</p>
          <h1 className={styles.brandTitle}>Frontend Base</h1>
        </div>

        <nav className={styles.navSection}>
          <p className={styles.sectionLabel}>Main Menu</p>
          <ul className={styles.navList}>
            {primaryMenu.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className={styles.navLink}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className={styles.navSection}>
          <p className={styles.sectionLabel}>System</p>
          <ul className={styles.navList}>
            {utilityMenu.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className={styles.navLinkMuted}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button type="button" className={styles.logoutLink} onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <div className={styles.contentArea}>
        <header className={styles.header}>
          <div>
            <p className={styles.headerLabel}>Academic Workflow</p>
            <h2 className={styles.headerTitle}>CSLogbook UX/UI Foundation</h2>
          </div>
          <button type="button" className={styles.headerButton}>
            + New Task
          </button>
        </header>

        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
}
