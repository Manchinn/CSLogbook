import { RoleGuard } from "@/components/auth/RoleGuard";
import { AdminRouteScaffold } from "@/components/admin/scaffold/AdminRouteScaffold";

const apiChecklist = [
  "GET /admin/teachers",
  "POST /admin/teachers",
  "PUT /admin/teachers/:id",
  "DELETE /admin/teachers/:id",
];

const implementationChecklist = [
  "Scaffold list view + filters (search, position, teacher type).",
  "Wire React Query for list and mutation flows.",
  "Add drawer/form for create and update.",
  "Keep parity for teacher permission fields (canAccessTopicExam, canExportProject1).",
  "Match legacy empty/loading/error states.",
];

export default function AdminTeachersPage() {
  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <AdminRouteScaffold
        title="จัดการข้อมูลอาจารย์"
        description="Scaffold หน้าจัดการข้อมูลอาจารย์ในระบบใหม่ พร้อม checklist สำหรับ migration แบบ parity-first."
        legacyPath="frontend/src/features/user-management/components/TeacherList"
        apiChecklist={apiChecklist}
        implementationChecklist={implementationChecklist}
      />
    </RoleGuard>
  );
}
