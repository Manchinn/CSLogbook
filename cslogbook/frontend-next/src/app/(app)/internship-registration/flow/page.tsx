"use client";

import dynamic from "next/dynamic";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { buildLegacyHref } from "@/lib/navigation/legacyNavigation";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

const InternshipFlowContent = dynamic(() => import("./view/InternshipFlowContent"), { ssr: false });

export default function InternshipRegistrationFlowPage() {
  const enabled = featureFlags.enableInternshipFlowPage && !featureFlags.useLegacyFrontend;
  const legacyHref = buildLegacyHref("/internship-registration/flow");

  guardFeatureRoute(enabled, "/internship-registration/flow");

  return (
    <RoleGuard roles={["student"]}>
      <InternshipFlowContent legacyHref={legacyHref} />
    </RoleGuard>
  );
}
