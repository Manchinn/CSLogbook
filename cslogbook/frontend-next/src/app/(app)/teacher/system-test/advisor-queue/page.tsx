"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { TeacherPageScaffold } from "@/components/teacher/TeacherPageScaffold";
import { AdvisorQueueTable, DecisionModal } from "@/components/teacher/AdvisorQueueTable";
import { PDFPreviewModal } from "@/components/teacher/PDFPreviewModal";
import {
  useAdvisorSystemTestQueue,
  useSubmitSystemTestAdvisorDecision,
} from "@/hooks/useTeacherModule";
import type { SystemTestRequest } from "@/lib/services/teacherService";

export default function AdvisorSystemTestQueuePage() {
  const [selectedRequest, setSelectedRequest] = useState<SystemTestRequest | null>(null);
  const [modalMode, setModalMode] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [pdfModal, setPdfModal] = useState<{ isOpen: boolean; url: string; fileName: string }>({
    isOpen: false,
    url: "",
    fileName: "",
  });

  const [statusFilter, setStatusFilter] = useState("");

  const filters = statusFilter ? { status: statusFilter } : undefined;
  const { data = [], isLoading, error } = useAdvisorSystemTestQueue(filters);
  const submitDecision = useSubmitSystemTestAdvisorDecision();

  const handleApprove = (request: SystemTestRequest) => {
    setSelectedRequest(request);
    setModalMode("approve");
    setNote("");
  };

  const handleReject = (request: SystemTestRequest) => {
    setSelectedRequest(request);
    setModalMode("reject");
    setNote("");
  };

  const handleViewPDF = (url: string, fileName: string) => {
    setPdfModal({ isOpen: true, url, fileName });
  };

  const handleClosePDF = () => {
    setPdfModal({ isOpen: false, url: "", fileName: "" });
  };

  const handleSubmit = async () => {
    if (!selectedRequest || !modalMode) return;

    try {
      await submitDecision.mutateAsync({
        projectId: selectedRequest.projectId,
        decision: modalMode,
        note: note || undefined,
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
        title="คำขอทดสอบระบบ"
        description="อนุมัติคำขอทดสอบระบบของนักศึกษาที่คุณเป็นอาจารย์ที่ปรึกษา"
      >
        <AdvisorQueueTable
          data={data}
          isLoading={isLoading}
          error={error}
          onApprove={handleApprove}
          onReject={handleReject}
          onViewPDF={handleViewPDF}
          emptyMessage="ไม่มีคำขอทดสอบระบบที่รออนุมัติในขณะนี้"
          showTestDates
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <DecisionModal
          item={selectedRequest}
          mode={modalMode}
          note={note}
          onNoteChange={setNote}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isPending={submitDecision.isPending}
          title="คำขอทดสอบระบบ"
        />

        <PDFPreviewModal
          isOpen={pdfModal.isOpen}
          onClose={handleClosePDF}
          pdfUrl={pdfModal.url}
          fileName={pdfModal.fileName}
          title="เอกสารคำขอทดสอบระบบ"
        />
      </TeacherPageScaffold>
    </RoleGuard>
  );
}
