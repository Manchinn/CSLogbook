import { redirect } from "next/navigation";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

export default function ReportsPage() {
  const enabled = featureFlags.enableReportsPage;
  guardFeatureRoute(enabled, "/app");
  redirect("/admin/reports/internship");
}
