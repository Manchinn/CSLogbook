"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./AppShell.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";
import { getMenuGroups, type MenuLink, type MenuNode } from "@/lib/navigation/menuConfig";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { signOut, user, token } = useAuth();
  const router = useRouter();
  const { data: eligibilityData } = useStudentEligibility(token, user?.role === "student");

  const canAccessInternship = eligibilityData?.eligibility.internship.canAccessFeature ?? null;
  const canAccessProject = eligibilityData?.eligibility.project.canAccessFeature ?? null;

  const menuGroups = useMemo(
    () => getMenuGroups({ user: user ?? null, canAccessInternship, canAccessProject }),
    [user, canAccessInternship, canAccessProject]
  );

  const isLink = (item: MenuNode): item is MenuLink => item.kind === "link";

  const handleLogout = () => {
    signOut();
    router.push("/login");
  };

  const handleNavigate = (item: MenuLink) => {
    if (item.external) {
      window.location.assign(item.href);
      return;
    }
    router.push(item.href);
  };

  const renderNodes = (items: MenuNode[], isChild?: boolean) => (
    <ul className={isChild ? styles.navChildList : styles.navList}>
      {items.map((item) => (
        <li key={item.key} className={styles.navItem}>
          {isLink(item) ? (
            <button type="button" className={styles.navLink} onClick={() => handleNavigate(item)}>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          ) : (
            <div className={styles.navGroupLabel}>
              <span className={styles.navLabel}>{item.label}</span>
            </div>
          )}
          {item.children ? renderNodes(item.children, true) : null}
        </li>
      ))}
    </ul>
  );

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="แถบนำทางหลัก">
        <div className={styles.brandBlock}>
          <p className={styles.brandCaption}>CSLogbook</p>
          <h1 className={styles.brandTitle}>Frontend Base</h1>
        </div>

        {menuGroups.map((group) => (
          <nav key={group.key} className={styles.navSection}>
            <p className={styles.sectionLabel}>{group.label}</p>
            {renderNodes(group.items)}
          </nav>
        ))}

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
