"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { TeacherPageScaffold, TeacherEmptyState } from "@/components/teacher/TeacherPageScaffold";

export default function ApproveDocumentsPage() {
  return (
    <RoleGuard roles={["teacher"]} teacherTypes={["academic"]} requireHeadOfDepartment>
      <TeacherPageScaffold
        title="อนุมัติเอกสาร"
        description="อนุมัติหนังสือขอความอนุเคราะห์ (CS05) และหนังสือส่งตัวนักศึกษาจากหัวหน้าภาค"
      >
        <TeacherEmptyState message="กำลังพัฒนาฟีเจอร์นี้ - ระบบจะเปิดใช้งานในเร็วๆ นี้" />
      </TeacherPageScaffold>
    </RoleGuard>
  );
}
