"use client";

import dynamic from "next/dynamic";
import { RoleGuard } from "@/components/auth/RoleGuard";

const InternshipFlowContent = dynamic(() => import("./view/InternshipFlowContent"), { ssr: false });

export default function FlowPageClient() {
  return (
    <RoleGuard roles={["student"]}>
      <InternshipFlowContent />
    </RoleGuard>
  );
}
