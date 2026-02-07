"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";
import RegistrationLanding from "./view/RegistrationLanding";

export default function InternshipRegistrationPage() {
  const enabled = featureFlags.enableInternshipFlowPage;
  guardFeatureRoute(enabled, "/app");

  return (
    <RoleGuard roles={["student"]}>
      <RegistrationLanding />
    </RoleGuard>
  );
}
