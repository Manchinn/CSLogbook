import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

export default function ReportsPage() {
  const enabled = featureFlags.enableReportsPage;

  guardFeatureRoute(enabled, "/app");

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support", "academic"]}>
      <FeaturePlaceholder
        title="ศูนย์รายงาน"
        description="แดชบอร์ดรายงานใหม่ (internship, project, workload)"
      />
    </RoleGuard>
  );
}
}
