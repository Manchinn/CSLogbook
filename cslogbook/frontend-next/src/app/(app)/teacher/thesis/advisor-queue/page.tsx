"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { TeacherPageScaffold, TeacherEmptyState } from "@/components/teacher/TeacherPageScaffold";

export default function AdvisorThesisQueuePage() {
  return (
    <RoleGuard roles={["teacher"]} teacherTypes={["academic"]}>
      <TeacherPageScaffold
        title="คำขอสอบ คพ.03"
        description="ดูและอนุมัติคำขอสอบปริญญานิพนธ์ของนักศึกษาที่คุณเป็นอาจารย์ที่ปรึกษา"
      >
        <TeacherEmptyState message="กำลังพัฒนาฟีเจอร์นี้ - ระบบจะเปิดใช้งานในเร็วๆ นี้" />
      </TeacherPageScaffold>
    </RoleGuard>
  );
}
