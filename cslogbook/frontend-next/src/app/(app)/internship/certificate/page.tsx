import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { buildLegacyHref } from "@/lib/navigation/legacyNavigation";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

export default function InternshipCertificatePage() {
  const enabled = featureFlags.enableInternshipCertificatePage && !featureFlags.useLegacyFrontend;
  const legacyHref = buildLegacyHref("/internship-certificate");

  guardFeatureRoute(enabled, "/internship-certificate");

  return (
    <RoleGuard roles={["student"]}>
      <FeaturePlaceholder
        title="หนังสือรับรองฝึกงาน"
        description="ตรวจสอบสถานะคำร้องหนังสือรับรองฝึกงาน และดาวน์โหลดเอกสาร"
        legacyHref={legacyHref}
      />
    </RoleGuard>
  );
}
