"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";
import { featureFlags } from "@/lib/config/featureFlags";
import { TopicSubmitContent } from "./TopicSubmitContent";

export default function TopicSubmitPage() {
  guardFeatureRoute(featureFlags.enableProjectPhase1Page, "/app");

  return (
    <RoleGuard roles={["student"]}>
      <TopicSubmitContent />
    </RoleGuard>
  );
}
