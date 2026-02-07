"use client";

import InternshipCompaniesView from "./InternshipCompaniesView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function InternshipCompaniesPage() {
  return (
    <RoleGuard roles={["student", "teacher", "admin"]}>
      <InternshipCompaniesView />
    </RoleGuard>
  );
}
