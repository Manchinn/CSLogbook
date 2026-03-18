import { RoleGuard } from "@/components/auth/RoleGuard";
import InternshipRequirementsContent from "./InternshipRequirementsContent";

export default function InternshipRequirementsPage() {
  return (
    <RoleGuard roles={["student"]}>
      <InternshipRequirementsContent />
    </RoleGuard>
  );
}
