"use client";

import dynamic from "next/dynamic";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

const InternshipFlowContent = dynamic(() => import("./view/InternshipFlowContent"), { ssr: false });

export default function InternshipRegistrationFlowPage() {
  const enabled = featureFlags.enableInternshipFlowPage;
  guardFeatureRoute(enabled, "/app");

  return (
    <RoleGuard roles={["student"]}>
      <InternshipFlowContent />
    </RoleGuard>
  );
}
