"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { TeacherPageScaffold, TeacherEmptyState } from "@/components/teacher/TeacherPageScaffold";

export default function AdvisorKP02QueuePage() {
  return (
    <RoleGuard roles={["teacher"]} teacherTypes={["academic"]}>
      <TeacherPageScaffold
        title="คำขอสอบ คพ.02"
        description="ดูและอนุมัติคำขอสอบโครงงานพิเศษ 1 ของนักศึกษาที่คุณเป็นอาจารย์ที่ปรึกษา"
      >
        <TeacherEmptyState message="กำลังพัฒนาฟีเจอร์นี้ - ระบบจะเปิดใช้งานในเร็วๆ นี้" />
      </TeacherPageScaffold>
    </RoleGuard>
  );
}
