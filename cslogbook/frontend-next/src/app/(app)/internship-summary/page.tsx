import { RoleGuard } from "@/components/auth/RoleGuard";
import InternshipSummaryView from "./InternshipSummaryView";

export default function InternshipSummaryPage() {
  return (
    <RoleGuard roles={["student"]}>
      <InternshipSummaryView />
    </RoleGuard>
  );
}
