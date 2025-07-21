import React from "react";
import {
  Card,
  Timeline,
  Tag,
  Button,
  Typography,
  Spin,
  Alert,
} from "antd";
import { useInternshipStatus } from "../../../contexts/InternshipStatusContext";

const { Title, Text } = Typography;

const InternshipSection = () => {
  const {
    cs05Status,
    internshipDate,
    summaryCompleted,
    certificateStatus,
    student,
    loading,
    error,
  } = useInternshipStatus();

  // ฟังก์ชันแปลงสถานะเป็นสีของ Tag
  const getColor = (status) => {
    switch (status) {
      case "finish":
        return "green";
      case "process":
        return "blue";
      default:
        return "gray";
    }
  };

  // ฟังก์ชันแปลงสถานะเป็นข้อความ
  const getStatusText = (status) => {
    switch (status) {
      case "finish":
        return "เสร็จสิ้น";
      case "process":
        return "กำลังดำเนินการ";
      default:
        return "รอดำเนินการ";
    }
  };

  // ฟังก์ชันแปลงสถานะสำหรับแต่ละ step
  const getStepStatus = (stepKey) => {
    switch (stepKey) {
      case "eligibility":
        return student?.eligibility?.internship?.eligible ? "finish" : "process";
      case "cs05":
        if (!cs05Status) return "wait";
        if (
          ["approved", "supervisor_approved", "supervisor_evaluated"].includes(
            cs05Status
          )
        )
          return "finish";
        return "process";
      case "wait_start":
        if (!internshipDate?.startDate) return "wait";
        const now = new Date();
        const start = new Date(internshipDate.startDate);
        if (now < start) return "process";
        return "finish";
      case "in_progress":
        if (!internshipDate?.startDate) return "wait";
        const now2 = new Date();
        const start2 = new Date(internshipDate.startDate);
        const end2 = new Date(internshipDate.endDate);
        if (now2 >= start2 && now2 <= end2) return "process";
        if (now2 > end2) return "finish";
        return "wait";
      case "summary":
        if (summaryCompleted === true) return "finish";
        if (summaryCompleted === false) return "process";
        return "wait";
      case "certificate":
        if (certificateStatus === "ready") return "finish";
        if (certificateStatus === "pending") return "process";
        return "wait";
      case "done":
        if (certificateStatus === "ready") return "finish";
        return "wait";
      default:
        return "wait";
    }
  };

  // กำหนดขั้นตอนหลักของ timeline
  const steps = [
    {
      key: "cs05",
      title: "ลงทะเบียนคำร้องฝึกงาน (คพ.05)",
      description: !cs05Status
        ? (student?.eligibility?.internship?.eligible === false
            ? "คุณยังไม่มีสิทธิ์ลงทะเบียนฝึกงาน กรุณาตรวจสอบเกณฑ์หรือรอการอนุมัติ"
            : "ยังไม่ได้ลงทะเบียนคำร้องฝึกงาน")
        : "ลงทะเบียนคำร้องฝึกงานเรียบร้อยแล้ว",
      action: !cs05Status && student?.eligibility?.internship?.eligible !== false && (
        <Button
          type="primary"
          href="/internship-registration/flow"
          style={{ marginTop: 8 }}
        >
          ลงทะเบียนคำร้องฝึกงาน
        </Button>
      ),
    },
    {
      key: "wait_start",
      title: "รอเริ่มการฝึกงาน",
      description: internshipDate?.startDate
        ? `รอถึงวันเริ่มฝึกงาน (${new Date(
            internshipDate.startDate
          ).toLocaleDateString()})`
        : "ยังไม่มีข้อมูลวันเริ่มฝึกงาน",
    },
    {
      key: "in_progress",
      title: "อยู่ระหว่างการฝึกงาน",
      description:
        internshipDate?.startDate && internshipDate?.endDate
          ? `ช่วงฝึกงาน: ${new Date(
              internshipDate.startDate
            ).toLocaleDateString()} - ${new Date(
              internshipDate.endDate
            ).toLocaleDateString()}`
          : "ยังไม่มีข้อมูลช่วงฝึกงาน",
    },
    {
      key: "summary",
      title: "ส่งเอกสารสรุปผลการฝึกงาน",
      description: summaryCompleted
        ? "ส่งเอกสารสรุปผลเรียบร้อยแล้ว"
        : "กรุณาส่งเอกสารสรุปผลการฝึกงาน",
      action: !summaryCompleted && (
        <Button
          type="primary"
          href="/internship-summary"
          style={{ marginTop: 8 }}
        >
          ส่งเอกสารสรุปผล
        </Button>
      ),
    },
    {
      key: "certificate",
      title: "ขอหนังสือรับรองการฝึกงาน",
      description:
        certificateStatus === "ready"
          ? "ได้รับหนังสือรับรองแล้ว"
          : certificateStatus === "pending"
          ? "รอเจ้าหน้าที่อนุมัติหนังสือรับรอง"
          : "สามารถขอหนังสือรับรองการฝึกงานได้",
      action: certificateStatus !== "ready" && (
        <Button
          type="primary"
          href="/internship-certificate"
          style={{ marginTop: 8 }}
        >
          ขอหนังสือรับรอง
        </Button>
      ),
    },
    {
      key: "done",
      title: "เสร็จสิ้นการฝึกงาน",
      description:
        certificateStatus === "ready"
          ? "กระบวนการฝึกงานของคุณเสร็จสมบูรณ์แล้ว"
          : "รอรับหนังสือรับรองการฝึกงาน",
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <Spin size="large" tip="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="เกิดข้อผิดพลาด"
        description={error}
        showIcon
      />
    );
  }

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>Timeline การฝึกงาน</Title>}
      style={{ marginBottom: 24 }}
    >
      <Timeline>
        {steps.map((step) => {
          const status = getStepStatus(step.key);
          return (
            <Timeline.Item
              key={step.key}
              color={getColor(status)}
              dot={
                <Tag color={getColor(status)} style={{ fontWeight: "bold", fontSize: 14 }}>
                  {getStatusText(status)}
                </Tag>
              }
            >
              <Text strong style={{ fontSize: 16 }}>{step.title}</Text>
              <div style={{ margin: "6px 0 12px 0", color: "#444", fontSize: 15 }}>
                {step.description}
              </div>
              {step.action}
            </Timeline.Item>
          );
        })}
      </Timeline>
    </Card>
  );
};

export default InternshipSection;
