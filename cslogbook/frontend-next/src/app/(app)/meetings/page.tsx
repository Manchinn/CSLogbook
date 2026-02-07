import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

export default function MeetingsPage() {
  const enabled = featureFlags.enableMeetingsPage;

  guardFeatureRoute(enabled, "/app");

  return (
    <AuthGuard>
      <FeaturePlaceholder
        title="การนัดหมาย / Meeting Logs"
        description="คิวการนัดหมาย การอนุมัติบันทึกการพบ และสรุปการประชุม"
      />
    </AuthGuard>
  );
}
