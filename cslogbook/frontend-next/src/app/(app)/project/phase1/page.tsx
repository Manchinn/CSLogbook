"use client";

import dynamic from "next/dynamic";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

const ProjectContent = dynamic(() => import("./view/ProjectContent"), { ssr: false });

export default function ProjectPhase1Page() {
  const enabled = featureFlags.enableProjectPhase1Page;
  guardFeatureRoute(enabled, "/app");

  return (
    <RoleGuard roles={["student"]}>
      <ProjectContent />
    </RoleGuard>
  );
}
