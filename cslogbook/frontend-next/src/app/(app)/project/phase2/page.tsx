import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

export default function ProjectPhase2Page() {
  const enabled = featureFlags.enableProjectPhase2Page;
    
    guardFeatureRoute(enabled, "/app");

  return (
    <RoleGuard roles={["student"]}>
      <FeaturePlaceholder
        title="ขั้นตอนโครงงานพิเศษ (Phase 2)"
        description="โครงร่างหน้าโครงงานพิเศษ 2 / thesis workflow และสิทธิ์ยื่นสอบ"
      />
    </RoleGuard>
  );
}
