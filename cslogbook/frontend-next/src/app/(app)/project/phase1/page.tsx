"use client";

import dynamic from "next/dynamic";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { buildLegacyHref } from "@/lib/navigation/legacyNavigation";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

const ProjectPhase1Content = dynamic(() => import("./view/ProjectPhase1Content"), { ssr: false });

export default function ProjectPhase1Page() {
  const enabled = featureFlags.enableProjectPhase1Page && !featureFlags.useLegacyFrontend;
  const legacyHref = buildLegacyHref("/project/phase1");

  guardFeatureRoute(enabled, "/project/phase1");

  return (
    <RoleGuard roles={["student"]}>
      <ProjectPhase1Content legacyHref={legacyHref} />
    </RoleGuard>
  );
}
