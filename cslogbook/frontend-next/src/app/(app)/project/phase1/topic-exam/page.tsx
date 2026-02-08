"use client";

import dynamic from "next/dynamic";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

const TopicExamContent = dynamic(() => import("./TopicExamContent"), { ssr: false });

export default function TopicExamPage() {
  guardFeatureRoute(featureFlags.enableProjectPhase1Page, "/app");

  return (
    <RoleGuard roles={["student"]}>
      <TopicExamContent />
    </RoleGuard>
  );
}
