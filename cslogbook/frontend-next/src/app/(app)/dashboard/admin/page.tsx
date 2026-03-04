"use client";

import Link from "next/link";
import { DashboardRoleView } from "../DashboardRoleView";
import { AdminStatsWidget } from "@/components/dashboard/AdminStatsWidget";
import { AdminProjectWorkflowWidget } from "@/components/dashboard/AdminProjectWorkflowWidget";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { SurveyBanner } from "@/components/dashboard/SurveyBanner";
import { featureFlags } from "@/lib/config/featureFlags";
import styles from "./page.module.css";

const quickActions = [
  {
    key: "upload",
    title: "อัปโหลดรายชื่อนักศึกษา",
    description: "นำเข้าข้อมูลนักศึกษาแบบไฟล์",
    href: "/admin/upload",
  },
  {
    key: "internship-docs",
    title: "เอกสารฝึกงาน",
    description: "ตรวจสอบและจัดการคำร้อง",
    href: "/admin/documents/internship",
  },
];

export default function AdminDashboardPage() {
  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <DashboardRoleView
        roleLabel="Admin"
        summary="ภาพรวมการจัดการเอกสารและ workflow ของทั้งระบบ"
        stats={[]}
      >
        <SurveyBanner />
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>งานด่วนสำหรับผู้ดูแลระบบ</h2>
          <div className={styles.actions}>
            {quickActions.map((action) => (
              <Link key={action.key} href={action.href} className={styles.actionCard}>
                <div>
                  <strong>{action.title}</strong>
                  <p className={styles.actionMeta}>{action.description}</p>
                </div>
                <span className={styles.actionArrow}>→</span>
              </Link>
            ))}
          </div>
        </section>
        <AdminStatsWidget enabled={featureFlags.enableAdminWidgetMigration} />
        <AdminProjectWorkflowWidget
          enabled={featureFlags.enableAdminProjectWorkflowWidget}
        />
      </DashboardRoleView>
    </RoleGuard>
  );
}
