"use client";

import { DashboardRoleView } from "../DashboardRoleView";
import { TeacherOverviewWidget } from "@/components/dashboard/TeacherOverviewWidget";
import { featureFlags } from "@/lib/config/featureFlags";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useTeacherOverview } from "@/hooks/useTeacherOverview";

export default function TeacherDashboardPage() {
  const { token } = useAuth();
  const hydrated = useHydrated();
  const enabled = featureFlags.enableTeacherWidgetMigration;
  const { data, isLoading, error } = useTeacherOverview(token, enabled && hydrated);

  const stats = [
    { label: "นักศึกษาที่ดูแล", value: data?.advisees.total ?? 0 },
    { label: "บันทึกการพบรออนุมัติ", value: data?.queues.meetingLogs.pending ?? 0 },
    { label: "เอกสารรออนุมัติ", value: data?.queues.documents.pending ?? 0 },
  ];

  return (
    <RoleGuard roles={["teacher"]} teacherTypes={["academic"]}>
      <DashboardRoleView
        roleLabel="Teacher"
        summary="ภาพรวมงานที่ต้องตรวจและนัดหมายที่ต้องดูแลวันนี้"
        stats={stats}
      >
        <TeacherOverviewWidget
          enabled={enabled}
          data={data}
          isLoading={isLoading}
          error={error}
          skipFetch
        />
      </DashboardRoleView>
    </RoleGuard>
  );
}
