"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import styles from "../settings/settings.module.css";

const REPORT_TABS = [
  { href: "/admin/reports/internship", label: "ฝึกงาน" },
  { href: "/admin/reports/project", label: "โครงงาน" },
  { href: "/admin/reports/document-pipeline", label: "สถานะเอกสาร" },
  { href: "/admin/reports/internship-supervisors", label: "สถานประกอบการ" },
] as const;

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.settingsShell}>
        <nav className={styles.settingsTabBar}>
          {REPORT_TABS.map((tab) => (
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
