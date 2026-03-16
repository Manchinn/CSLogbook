"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AppShell.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";
import { getMenuGroups, type MenuLink, type MenuNode } from "@/lib/navigation/menuConfig";
import { getCurrentAcademicInfo, type AcademicInfo } from "@/lib/services/academicService";
import { CSLogbookLogo } from "@/components/common/Logo";
import NotificationBell from '@/components/common/NotificationBell';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { signOut, user, token } = useAuth();
  const router = useRouter();
  const { data: eligibilityData, isLoading: isEligibilityLoading } = useStudentEligibility(
    token,
    user?.role === "student"
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [academicInfo, setAcademicInfo] = useState<AcademicInfo | null>(null);
  const [isAcademicLoading, setIsAcademicLoading] = useState(false);

  const canAccessInternship = eligibilityData?.eligibility.internship.canAccessFeature ?? null;
  const canAccessProject = eligibilityData?.eligibility.project.canAccessFeature ?? null;

  const menuGroups = useMemo(
    () => getMenuGroups({ user: user ?? null, canAccessInternship, canAccessProject }),
    [user, canAccessInternship, canAccessProject]
  );

  const isLink = (item: MenuNode): item is MenuLink => item.kind === "link";

  const handleLogout = () => {
    signOut();
    setIsSidebarOpen(false);
    router.push("/login");
  };

  const handleNavigate = (item: MenuLink) => {
    setIsSidebarOpen(false);
    router.push(item.href);
  };

  const renderSkeleton = () => (
    <div className={styles.navSkeleton} aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`section-${index}`} className={styles.navSkeletonSection}>
          <div className={styles.navSkeletonLabel} />
          <div className={styles.navSkeletonItem} />
          <div className={styles.navSkeletonItem} />
          <div className={styles.navSkeletonItem} />
        </div>
      ))}
    </div>
  );

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

  useEffect(() => {
    let isMounted = true;

    const fetchAcademicInfo = async () => {
      setIsAcademicLoading(true);
      try {
        const info = await getCurrentAcademicInfo();
        if (isMounted) {
          setAcademicInfo(info);
        }
      } catch {
        if (isMounted) {
          setAcademicInfo(null);
        }
      } finally {
        if (isMounted) {
          setIsAcademicLoading(false);
        }
      }
    };

    fetchAcademicInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={styles.shell}>
      <aside
        className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}
        aria-label="แถบนำทางหลัก"
      >
        <div className={styles.brandBlock}>
          <div className={styles.brandMark} aria-hidden="true">
            <CSLogbookLogo size={40} className={styles.brandLogo} />
            <p className={styles.brandCaption}>CS Logbook</p>
          </div>
        </div>

        <div className={styles.navSections}>
          {isEligibilityLoading && user?.role === "student"
            ? renderSkeleton()
            : menuGroups.map((group) => (
                <nav key={group.key} className={styles.navSection}>
                  <p className={styles.sectionLabel}>{group.label}</p>
                  {renderNodes(group.items)}
                </nav>
              ))}
        </div>

      </aside>

      <button
        type="button"
        className={`${styles.backdrop} ${isSidebarOpen ? styles.backdropVisible : ""}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-label="ปิดเมนู"
      />
      <button
        type="button"
        className={`${styles.sidebarTrigger} ${isSidebarOpen ? styles.sidebarTriggerAttached : ""}`}
        onClick={() => setIsSidebarOpen(true)}
        aria-label="เปิดเมนู"
      >
        ≡
      </button>

      <div className={styles.contentArea}>
        <header className={styles.header}>
          <div>
            <p className={styles.headerLabel}>
              {isAcademicLoading
                ? "ภาคเรียน กำลังโหลด..."
                : academicInfo?.displayText
                  ? `ภาคเรียน ${academicInfo.displayText.replace("*", "")}${academicInfo.isFromDatabase === false ? " (อัตโนมัติ)" : ""}`
                  : "ภาคเรียน -"}
            </p>
            <h2 className={styles.headerTitle}>
              ระบบบันทึกและติดตามการฝึกงาน โครงงานพิเศษและปริญญานิพนธ์ ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
            </h2>
          </div>
          <div className={styles.headerActions}>
            <NotificationBell />
            <button type="button" className={styles.logoutLink} onClick={handleLogout}>
              ออกจากระบบ
            </button>
          </div>
        </header>

        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
}
