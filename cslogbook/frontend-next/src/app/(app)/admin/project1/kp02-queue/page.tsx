"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { DefenseStaffQueuePage } from "@/components/admin/project-documents/DefenseStaffQueuePage";
import { DEFENSE_TYPE_PROJECT1 } from "@/lib/services/adminDefenseQueueService";

export default function AdminProject1Kp02QueuePage() {
  return (
    <RoleGuard roles={["admin", "teacher"]}>
      <DefenseStaffQueuePage defenseType={DEFENSE_TYPE_PROJECT1} />
    </RoleGuard>
  );
}
