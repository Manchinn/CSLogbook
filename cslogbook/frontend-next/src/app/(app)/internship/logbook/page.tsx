import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";
import InternshipLogbookView from "./InternshipLogbookView";

export default function InternshipLogbookPage() {
  const enabled = featureFlags.enableInternshipLogbookPage;

  guardFeatureRoute(enabled, "/app");

  return (
    <RoleGuard roles={["student"]}>
      <InternshipLogbookView />
    </RoleGuard>
  );
}
