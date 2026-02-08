import { RoleGuard } from "@/components/auth/RoleGuard";
import InternshipEligibilityView from "./InternshipEligibilityView";

export default function InternshipEligibilityPage() {
  return (
    <RoleGuard roles={["student"]}>
      <InternshipEligibilityView />
    </RoleGuard>
  );
}
