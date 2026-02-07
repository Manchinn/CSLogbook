"use client";

import { DashboardRoleView } from "../DashboardRoleView";
import { StudentEligibilityWidget } from "@/components/dashboard/StudentEligibilityWidget";
import { StudentDeadlinesWidget } from "@/components/dashboard/StudentDeadlinesWidget";
import { StudentInternshipStatusWidget } from "@/components/dashboard/StudentInternshipStatusWidget";
import { StudentProjectStatusWidget } from "@/components/dashboard/StudentProjectStatusWidget";
import { featureFlags } from "@/lib/config/featureFlags";
import { RoleGuard } from "@/components/auth/RoleGuard";

const stats = [
  { label: "My Tasks", value: "12" },
  { label: "Pending Submissions", value: "3" },
  { label: "Upcoming Deadlines", value: "2" },
];

export default function StudentDashboardPage() {
  const studentWidgetsEnabled = featureFlags.enableStudentWidgetMigration;
  const internshipWidgetEnabled = featureFlags.enableStudentInternshipWidget;
  const projectWidgetEnabled = featureFlags.enableStudentProjectWidget;

  return (
    <RoleGuard roles={["student"]}>
      <DashboardRoleView
        roleLabel="Student"
        summary="ติดตามงานฝึกงาน/โครงงาน และกำหนดส่งที่ใกล้ถึง"
        stats={stats}
      >
        <StudentEligibilityWidget enabled={studentWidgetsEnabled} />
        <StudentDeadlinesWidget enabled={studentWidgetsEnabled} />
        <StudentInternshipStatusWidget enabled={studentWidgetsEnabled && internshipWidgetEnabled} />
        <StudentProjectStatusWidget enabled={studentWidgetsEnabled && projectWidgetEnabled} />
      </DashboardRoleView>
    </RoleGuard>
  );
}
