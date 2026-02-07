import { DashboardRoleView } from "../DashboardRoleView";
import { AdminStatsWidget } from "@/components/dashboard/AdminStatsWidget";

const stats = [
  { label: "Active Students", value: "128" },
  { label: "Pending Reviews", value: "24" },
  { label: "Open Requests", value: "9" },
];

export default function AdminDashboardPage() {
  return (
    <DashboardRoleView
      roleLabel="Admin"
      summary="ภาพรวมการจัดการเอกสารและ workflow ของทั้งระบบ"
      stats={stats}
    >
      <AdminStatsWidget />
    </DashboardRoleView>
  );
}
