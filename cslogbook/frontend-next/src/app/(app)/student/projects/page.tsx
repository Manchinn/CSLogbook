import { RoleGuard } from "@/components/auth/RoleGuard";
import StudentProjectsView from "./StudentProjectsView";

export default function StudentProjectsPage() {
  return (
    <RoleGuard roles={["student"]}>
      <StudentProjectsView />
    </RoleGuard>
  );
}
