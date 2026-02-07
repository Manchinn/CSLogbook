"use client";

import { DashboardRoleView } from "../DashboardRoleView";
import { TeacherOverviewWidget } from "@/components/dashboard/TeacherOverviewWidget";
import { featureFlags } from "@/lib/config/featureFlags";
import { RoleGuard } from "@/components/auth/RoleGuard";

const stats = [
  { label: "Assigned Students", value: "38" },
  { label: "Review Queue", value: "11" },
  { label: "Meetings Today", value: "4" },
];

export default function TeacherDashboardPage() {
  return (
    <RoleGuard roles={["teacher"]} teacherTypes={["academic"]}>
      <DashboardRoleView
        roleLabel="Teacher"
        summary="ภาพรวมงานที่ต้องตรวจและนัดหมายที่ต้องดูแลวันนี้"
        stats={stats}
      >
        <TeacherOverviewWidget enabled={featureFlags.enableTeacherWidgetMigration} />
      </DashboardRoleView>
    </RoleGuard>
  );
}
