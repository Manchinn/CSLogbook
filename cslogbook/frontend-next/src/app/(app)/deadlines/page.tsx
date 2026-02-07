import { redirect } from "next/navigation";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

export default function DeadlinesPage() {
  const enabled = featureFlags.enableDeadlinesPage;

  guardFeatureRoute(enabled, "/app");

  redirect("/student-deadlines/calendar");
}
