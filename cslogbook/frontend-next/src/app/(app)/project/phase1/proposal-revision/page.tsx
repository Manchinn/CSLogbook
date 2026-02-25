import { RoleGuard } from "@/components/auth/RoleGuard";
import ProposalRevisionView from "./ProposalRevisionView";

export default function ProposalRevisionPage() {
  return (
    <RoleGuard roles={["student"]}>
      <ProposalRevisionView />
    </RoleGuard>
  );
}
