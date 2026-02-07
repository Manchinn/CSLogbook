import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { buildLegacyHref } from "@/lib/navigation/legacyNavigation";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

export default function MeetingsPage() {
  const enabled = featureFlags.enableMeetingsPage && !featureFlags.useLegacyFrontend;
  const legacyHref = buildLegacyHref("/teacher/meeting-approvals");

  guardFeatureRoute(enabled, "/teacher/meeting-approvals");

  return (
    <AuthGuard>
      <FeaturePlaceholder
        title="การนัดหมาย / Meeting Logs"
        description="คิวการนัดหมาย การอนุมัติบันทึกการพบ และสรุปการประชุม"
        legacyHref={legacyHref}
      />
    </AuthGuard>
  );
}
