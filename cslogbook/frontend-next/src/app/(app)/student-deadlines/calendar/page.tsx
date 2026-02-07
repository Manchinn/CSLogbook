"use client";

import dynamic from "next/dynamic";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

const StudentDeadlineCalendar = dynamic(() => import("./view/StudentDeadlineCalendar"), {
  ssr: false,
});

export default function StudentDeadlineCalendarPage() {
  const enabled = featureFlags.enableDeadlinesPage;
  guardFeatureRoute(enabled, "/app");

  return (
    <RoleGuard roles={["student"]}>
      <StudentDeadlineCalendar />
    </RoleGuard>
  );
}
