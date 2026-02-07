import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { buildLegacyHref } from "@/lib/navigation/legacyNavigation";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

export default function InternshipLogbookPage() {
  const enabled = featureFlags.enableInternshipLogbookPage && !featureFlags.useLegacyFrontend;
  const legacyHref = buildLegacyHref("/internship-logbook/timesheet");

  guardFeatureRoute(enabled, "/internship-logbook/timesheet");

  return (
    <RoleGuard roles={["student"]}>
      <FeaturePlaceholder
        title="บันทึกประจำวันฝึกงาน"
        description="หน้ารวม logbook และ timesheet ฝึกงาน พร้อมสรุปสถิติ"
        legacyHref={legacyHref}
      />
    </RoleGuard>
  );
}
