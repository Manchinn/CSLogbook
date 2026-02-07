import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";
import InternshipCertificateView from "./InternshipCertificateView";

export default function InternshipCertificatePage() {
  const enabled = featureFlags.enableInternshipCertificatePage;

  guardFeatureRoute(enabled, "/app");

  return (
    <RoleGuard roles={["student"]}>
      <InternshipCertificateView />
    </RoleGuard>
  );
}
