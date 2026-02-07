"use client";

import CompanyInfoView from "./CompanyInfoView";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useCurrentCS05 } from "@/hooks/useCurrentCS05"; // Importing the new hook

export default function CompanyInfoPage() {
  return (
    <RoleGuard roles={["student"]}>
      <CompanyInfoView />
    </RoleGuard>
  );
}
