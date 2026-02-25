import { RoleGuard } from "@/components/auth/RoleGuard";
import ProjectEligibilityView from "./ProjectEligibilityView";

export default function ProjectEligibilityPage() {
  return (
    <RoleGuard roles={["student"]}>
      <ProjectEligibilityView />
    </RoleGuard>
  );
}
