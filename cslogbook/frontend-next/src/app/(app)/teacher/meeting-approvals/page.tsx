"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { TeacherPageScaffold, TeacherEmptyState } from "@/components/teacher/TeacherPageScaffold";

export default function MeetingApprovalsPage() {
  return (
    <RoleGuard roles={["teacher"]} teacherTypes={["academic"]}>
      <TeacherPageScaffold
        title="อนุมัติบันทึกการพบ"
        description="อนุมัติหรือปฏิเสธบันทึกการประชุมของนักศึกษา"
      >
        <TeacherEmptyState message="กำลังพัฒนาฟีเจอร์นี้ - ระบบจะเปิดใช้งานในเร็วๆ นี้" />
      </TeacherPageScaffold>
    </RoleGuard>
  );
}
