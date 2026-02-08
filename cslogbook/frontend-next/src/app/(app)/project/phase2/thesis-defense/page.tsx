"use client";

import dynamic from "next/dynamic";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

const ThesisDefenseRequestContent = dynamic(() => import("./ThesisDefenseRequestContent"), { ssr: false });

export default function ThesisDefenseRequestPage() {
  guardFeatureRoute(featureFlags.enableProjectPhase2Page, "/app");

  return (
    <RoleGuard roles={["student"]}>
      <ThesisDefenseRequestContent />
    </RoleGuard>
  );
}
