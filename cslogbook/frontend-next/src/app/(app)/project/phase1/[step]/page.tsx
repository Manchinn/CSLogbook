"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";

const stepCopy: Record<string, { title: string; description: string }> = {
  "topic-submit": {
    title: "เสนอหัวข้อโครงงานพิเศษ",
    description: "ฟอร์มและรายการตรวจสอบสำหรับยื่นหัวข้อโครงงานพิเศษ 1",
  },
  "meeting-logbook": {
    title: "บันทึกการพบอาจารย์",
    description: "สร้างนัดหมายและบันทึกการประชุมในช่วงโครงงานพิเศษ 1",
  },
  "exam-submit": {
    title: "ส่งเอกสารสอบ",
    description: "เตรียมเอกสารและยื่นคำขอสอบ คพ.02",
  },
};

export default function ProjectPhase1StepPage() {
  const enabled = featureFlags.enableProjectPhase1Page;
  guardFeatureRoute(enabled, "/app");

  const params = useParams<{ step?: string }>();
  const content = useMemo(() => {
    const key = params?.step ?? "";
    return (
      stepCopy[key] ?? {
        title: "ขั้นตอนโครงงานพิเศษ",
        description: "ยังไม่มีหน้าสำหรับขั้นตอนนี้",
      }
    );
  }, [params?.step]);

  return (
    <RoleGuard roles={["student"]}>
      <FeaturePlaceholder title={content.title} description={content.description} />
    </RoleGuard>
  );
}
