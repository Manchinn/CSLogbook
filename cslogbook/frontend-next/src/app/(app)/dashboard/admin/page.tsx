"use client";

import { DashboardRoleView } from "../DashboardRoleView";
import { AdminStatsWidget } from "@/components/dashboard/AdminStatsWidget";
import { AdminProjectWorkflowWidget } from "@/components/dashboard/AdminProjectWorkflowWidget";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";

const stats = [
  { label: "Active Students", value: "128" },
  { label: "Pending Reviews", value: "24" },
  { label: "Open Requests", value: "9" },
];

export default function AdminDashboardPage() {
  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <DashboardRoleView
        roleLabel="Admin"
        summary="ภาพรวมการจัดการเอกสารและ workflow ของทั้งระบบ"
        stats={stats}
      >
        <AdminStatsWidget enabled={featureFlags.enableAdminWidgetMigration} />
        <AdminProjectWorkflowWidget
          enabled={featureFlags.enableAdminProjectWorkflowWidget}
        />
      </DashboardRoleView>
    </RoleGuard>
  );
}
