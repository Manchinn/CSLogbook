import { DashboardRoleView } from "../DashboardRoleView";

const stats = [
  { label: "My Tasks", value: "12" },
  { label: "Pending Submissions", value: "3" },
  { label: "Upcoming Deadlines", value: "2" },
];

export default function StudentDashboardPage() {
  return (
    <DashboardRoleView
      roleLabel="Student"
      summary="ติดตามงานฝึกงาน/โครงงาน และกำหนดส่งที่ใกล้ถึง"
      stats={stats}
    />
  );
}
