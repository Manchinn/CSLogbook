"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import RegistrationLanding from "./view/RegistrationLanding";

export default function LandingPageClient() {
  return (
    <RoleGuard roles={["student"]}>
      <RegistrationLanding />
    </RoleGuard>
  );
}
