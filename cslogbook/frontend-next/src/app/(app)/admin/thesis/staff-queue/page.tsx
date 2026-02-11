"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { DefenseStaffQueuePage } from "@/components/admin/project-documents/DefenseStaffQueuePage";
import { DEFENSE_TYPE_THESIS } from "@/lib/services/adminDefenseQueueService";

export default function AdminThesisStaffQueuePage() {
  return (
    <RoleGuard roles={["admin", "teacher"]}>
      <DefenseStaffQueuePage defenseType={DEFENSE_TYPE_THESIS} />
    </RoleGuard>
  );
}
