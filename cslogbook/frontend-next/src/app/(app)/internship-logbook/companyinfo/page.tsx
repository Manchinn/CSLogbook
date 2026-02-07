"use client";

import CompanyInfoView from "./CompanyInfoView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function CompanyInfoPage() {
  return (
    <RoleGuard roles={["student"]}>
      <CompanyInfoView />
    </RoleGuard>
  );
}
