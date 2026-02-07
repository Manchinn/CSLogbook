import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { buildLegacyHref } from "@/lib/navigation/legacyNavigation";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

export default function ReportsPage() {
  const enabled = featureFlags.enableReportsPage && !featureFlags.useLegacyFrontend;
  const legacyHref = buildLegacyHref("/admin/reports/project");

  guardFeatureRoute(enabled, "/admin/reports/project");

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support", "academic"]}>
      <FeaturePlaceholder
        title="ศูนย์รายงาน"
        description="แดชบอร์ดรายงานใหม่ (internship, project, workload)"
        legacyHref={legacyHref}
      />
    </RoleGuard>
  );
}
