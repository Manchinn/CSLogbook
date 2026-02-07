import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { buildLegacyHref } from "@/lib/navigation/legacyNavigation";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

export default function ProjectPhase2Page() {
  const enabled = featureFlags.enableProjectPhase2Page && !featureFlags.useLegacyFrontend;
  const legacyHref = buildLegacyHref("/project/phase2");

  guardFeatureRoute(enabled, "/project/phase2");

  return (
    <RoleGuard roles={["student"]}>
      <FeaturePlaceholder
        title="ขั้นตอนโครงงานพิเศษ (Phase 2)"
        description="โครงร่างหน้าโครงงานพิเศษ 2 / thesis workflow และสิทธิ์ยื่นสอบ"
        legacyHref={legacyHref}
      />
    </RoleGuard>
  );
}
