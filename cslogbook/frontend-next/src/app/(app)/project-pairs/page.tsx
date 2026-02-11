import { RoleGuard } from "@/components/auth/RoleGuard";
import { AdminRouteScaffold } from "@/components/admin/scaffold/AdminRouteScaffold";

const apiChecklist = [
  "GET /project-members",
  "GET /admin/projects/student/:studentCode",
  "GET /admin/advisors",
  "GET /admin/projects/tracks",
  "POST /admin/projects/create-manually",
];

const implementationChecklist = [
  "Scaffold list view + advanced filters (status, track, projectType, academic year, semester).",
  "Wire React Query for project pairs summary and list refresh.",
  "Add project detail drawer with parity fields from legacy.",
  "Implement add-project modal with student eligibility checks.",
  "Add follow-up mutations for update/cancel project flows.",
];

export default function ProjectPairsPage() {
  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <AdminRouteScaffold
        title="นักศึกษาโครงงานพิเศษ"
        description="Scaffold หน้าจัดการโครงงานพิเศษและทีมโครงงาน เพื่อย้าย flow จาก legacy ไป Next.js."
        legacyPath="frontend/src/features/user-management/components/ProjectPairs"
        apiChecklist={apiChecklist}
        implementationChecklist={implementationChecklist}
      />
    </RoleGuard>
  );
}
