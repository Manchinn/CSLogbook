"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import styles from "./settings.module.css";

const SETTINGS_TABS = [
  { href: "/admin/settings/curriculum", label: "หลักสูตร" },
  { href: "/admin/settings/academic", label: "ปีการศึกษา" },
  { href: "/admin/settings/notification-settings", label: "การแจ้งเตือน" },
] as const;

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // constants (hub) page ไม่แสดง tab bar
  const isHub = pathname === "/admin/settings/constants" || pathname === "/admin/settings";

  if (isHub) return <>{children}</>;

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.settingsShell}>
        <header className={styles.settingsHeader}>
          <h1 className={styles.settingsTitle}>การตั้งค่าระบบ</h1>
        </header>

        <nav className={styles.settingsTabBar}>
          {SETTINGS_TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${styles.settingsTab} ${
                pathname.startsWith(tab.href) ? styles.settingsTabActive : ""
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </RoleGuard>
  );
}
