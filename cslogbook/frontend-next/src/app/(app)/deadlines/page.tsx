import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { buildLegacyHref } from "@/lib/navigation/legacyNavigation";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

export default function DeadlinesPage() {
  const enabled = featureFlags.enableDeadlinesPage && !featureFlags.useLegacyFrontend;
  const legacyHref = buildLegacyHref("/student-deadlines/calendar");

  guardFeatureRoute(enabled, "/student-deadlines/calendar");

  return (
    <AuthGuard>
      <FeaturePlaceholder
        title="กำหนดส่งทั้งหมด"
        description="ศูนย์รวมกำหนดส่งจากทุก workflow (internship, project, meeting)"
        legacyHref={legacyHref}
      />
    </AuthGuard>
  );
}
