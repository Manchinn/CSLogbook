"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { TeacherPageScaffold, TeacherEmptyState } from "@/components/teacher/TeacherPageScaffold";

export default function TopicExamOverviewPage() {
  return (
    <RoleGuard roles={["teacher"]} teacherTypes={["academic"]} requireTopicExamAccess>
      <TeacherPageScaffold
        title="รายชื่อหัวข้อโครงงานพิเศษ"
        description="ดูรายชื่อหัวข้อโครงงานพิเศษทั้งหมด (สำหรับอาจารย์ที่มีสิทธิ์)"
      >
        <TeacherEmptyState message="กำลังพัฒนาฟีเจอร์นี้ - ระบบจะเปิดใช้งานในเร็วๆ นี้" />
      </TeacherPageScaffold>
    </RoleGuard>
  );
}
