import { DashboardRoleView } from "../DashboardRoleView";

const stats = [
  { label: "Assigned Students", value: "38" },
  { label: "Review Queue", value: "11" },
  { label: "Meetings Today", value: "4" },
];

export default function TeacherDashboardPage() {
  return (
    <DashboardRoleView
      roleLabel="Teacher"
      summary="ภาพรวมงานที่ต้องตรวจและนัดหมายที่ต้องดูแลวันนี้"
      stats={stats}
    />
  );
}
