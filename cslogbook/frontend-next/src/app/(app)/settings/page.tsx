import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { buildLegacyHref } from "@/lib/navigation/legacyNavigation";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

export default function SettingsPage() {
  const enabled = featureFlags.enableSettingsPage && !featureFlags.useLegacyFrontend;
  const legacyHref = buildLegacyHref("/admin/settings");

  guardFeatureRoute(enabled, "/admin/settings");

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <FeaturePlaceholder
        title="การตั้งค่า (ใหม่)"
        description="โครงร่างหน้าตั้งค่าและฟีเจอร์สวิตช์สำหรับ frontend-next"
        legacyHref={legacyHref}
      />
    </RoleGuard>
  );
}
