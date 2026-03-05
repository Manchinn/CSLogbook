"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { TeacherPageScaffold } from "@/components/teacher/TeacherPageScaffold";
import { AdvisorQueueTable, DecisionModal } from "@/components/teacher/AdvisorQueueTable";
import { useAdvisorThesisQueue, useSubmitKP02AdvisorDecision } from "@/hooks/useTeacherModule";
import type { DefenseRequest } from "@/lib/services/teacherService";

export default function AdvisorThesisQueuePage() {
  const [selectedRequest, setSelectedRequest] = useState<DefenseRequest | null>(null);
  const [modalMode, setModalMode] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filters = statusFilter ? { status: statusFilter } : undefined;
  const { data: response, isLoading, error } = useAdvisorThesisQueue(filters);
  const data = response?.items || [];
  const summary = response?.summary || { pending: 0, approved: 0, rejected: 0, total: 0 };
  const submitDecision = useSubmitKP02AdvisorDecision();

  const handleApprove = (request: DefenseRequest) => {
    setSelectedRequest(request);
    setModalMode("approve");
    setNote("");
  };

  const handleReject = (request: DefenseRequest) => {
    setSelectedRequest(request);
    setModalMode("reject");
    setNote("");
  };

  const handleSubmit = async () => {
    if (!selectedRequest || !modalMode) return;

    try {
      await submitDecision.mutateAsync({
        projectId: selectedRequest.projectId,
        decision: modalMode,
        note: note || undefined,
        defenseType: "THESIS",
      });
      setModalMode(null);
      setSelectedRequest(null);
      setNote("");
    } catch (err) {
      console.error("Failed to submit decision:", err);
    }
  };

  const handleCancel = () => {
    setModalMode(null);
    setSelectedRequest(null);
    setNote("");
  };

  return (
    <RoleGuard roles={["teacher"]} teacherTypes={["academic"]}>
      <TeacherPageScaffold
        title="คำขอสอบ คพ.03"
        description="อนุมัติคำขอสอบปริญญานิพนธ์ของนักศึกษาที่คุณเป็นอาจารย์ที่ปรึกษา"
      >
        <AdvisorQueueTable
          data={data}
          isLoading={isLoading}
          error={error}
          onApprove={handleApprove}
          onReject={handleReject}
          emptyMessage="ไม่มีคำขอสอบ คพ.03 ที่รออนุมัติในขณะนี้"
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          summary={summary}
        />

        <DecisionModal
          item={selectedRequest}
          mode={modalMode}
          note={note}
          onNoteChange={setNote}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isPending={submitDecision.isPending}
          title="คำขอสอบ คพ.03"
        />
      </TeacherPageScaffold>
    </RoleGuard>
  );
}
