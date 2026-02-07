import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

export default function InternshipCertificatePage() {
  const enabled = featureFlags.enableInternshipCertificatePage;

  guardFeatureRoute(enabled, "/app");

  return (
    <RoleGuard roles={["student"]}>
      <FeaturePlaceholder
        title="หนังสือรับรองฝึกงาน"
        description="ตรวจสอบสถานะคำร้องหนังสือรับรองฝึกงาน และดาวน์โหลดเอกสาร"
      />
    </RoleGuard>
  );
}
