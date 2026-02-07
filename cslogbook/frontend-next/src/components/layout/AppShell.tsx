"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./AppShell.module.css";
import { useAuth } from "@/contexts/AuthContext";

type AppShellProps = {
  children: React.ReactNode;
};

const PRIMARY_MENU_BASE = [
  { label: "App Home", href: "/app" },
  { label: "Student Dashboard", href: "/dashboard/student", roles: ["student"] as const },
  { label: "Teacher Dashboard", href: "/dashboard/teacher", roles: ["teacher"] as const, teacherTypes: ["academic"] },
  { label: "Admin Dashboard", href: "/dashboard/admin", roles: ["admin", "teacher"] as const, teacherTypes: ["support"] },
];

const UTILITY_MENU_BASE = [
  { label: "Timeline", href: "/dashboard/admin", roles: ["admin", "teacher"] as const, teacherTypes: ["support"] },
  { label: "Settings", href: "/dashboard/admin", roles: ["admin", "teacher"] as const, teacherTypes: ["support"] },
];

export function AppShell({ children }: AppShellProps) {
  const { signOut, user } = useAuth();
  const router = useRouter();

  const primaryMenu = useMemo(() => {
    if (!user) {
      return [];
    }

    return PRIMARY_MENU_BASE.filter((item) => {
      if (!item.roles) return true;
      if (!item.roles.includes(user.role)) return false;

      if (item.teacherTypes && user.role === "teacher") {
        return item.teacherTypes.includes(user.teacherType ?? "");
      }

      return true;
    });
  }, [user]);

  const utilityMenu = useMemo(() => {
    if (!user) {
      return [];
    }

    return UTILITY_MENU_BASE.filter((item) => {
      if (!item.roles) return true;
      if (!item.roles.includes(user.role)) return false;

      if (item.teacherTypes && user.role === "teacher") {
        return item.teacherTypes.includes(user.teacherType ?? "");
      }

      return true;
    });
  }, [user]);

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
