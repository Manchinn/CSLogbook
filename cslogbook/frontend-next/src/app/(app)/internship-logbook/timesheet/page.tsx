import { RoleGuard } from "@/components/auth/RoleGuard";
import InternshipTimesheetView from "./InternshipTimesheetView";

export default function InternshipTimesheetPage() {
  return (
    <RoleGuard roles={["student"]}>
      <InternshipTimesheetView />
    </RoleGuard>
  );
}
