import { redirect } from "next/navigation";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

export default function SettingsPage() {
  const enabled = featureFlags.enableSettingsPage;
  guardFeatureRoute(enabled, "/app");
  redirect("/admin/settings/constants");
}
