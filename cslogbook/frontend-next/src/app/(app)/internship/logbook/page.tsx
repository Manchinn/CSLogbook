import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

export default function InternshipLogbookPage() {
  const enabled = featureFlags.enableInternshipLogbookPage;

  guardFeatureRoute(enabled, "/app");

  return (
    <RoleGuard roles={["student"]}>
      <FeaturePlaceholder
        title="บันทึกประจำวันฝึกงาน"
        description="หน้ารวม logbook และ timesheet ฝึกงาน พร้อมสรุปสถิติ"
      />
    </RoleGuard>
  );
}
