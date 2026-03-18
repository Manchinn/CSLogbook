import { RoleGuard } from "@/components/auth/RoleGuard";
import ProjectRequirementsContent from "./ProjectRequirementsContent";

export default function ProjectRequirementsPage() {
  return (
    <RoleGuard roles={["student"]}>
      <ProjectRequirementsContent />
    </RoleGuard>
  );
}
