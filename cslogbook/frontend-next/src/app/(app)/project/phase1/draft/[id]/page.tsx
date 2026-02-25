import { RoleGuard } from "@/components/auth/RoleGuard";
import ProjectDraftDetailView from "./ProjectDraftDetailView";

export default function ProjectDraftDetailPage() {
  return (
    <RoleGuard roles={["student"]}>
      <ProjectDraftDetailView />
    </RoleGuard>
  );
}
