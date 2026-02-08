"use client";

import dynamic from "next/dynamic";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

const SystemTestRequestContent = dynamic(() => import("./SystemTestRequestContent"), { ssr: false });

export default function SystemTestRequestPage() {
  guardFeatureRoute(featureFlags.enableProjectPhase2Page, "/app");

  return (
    <RoleGuard roles={["student"]}>
      <SystemTestRequestContent />
    </RoleGuard>
  );
}
