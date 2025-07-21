import React from "react";
import {
  Card,
  Timeline,
  Tag,
  Button,
  Typography,
  Spin,
  Alert,
  Space,
  Progress,
  Tooltip,
} from "antd";
import { 
  BankOutlined, 
  UnlockOutlined, 
  LockOutlined,
  SolutionOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import { useInternshipStatus } from "../../../contexts/InternshipStatusContext";

const { Text, Paragraph } = Typography;


const InternshipSection = () => {
  const {
    cs05Status,
    internshipDate,
    summaryCompleted,
    certificateStatus,
    student,
    loading,
    error,
    evaluationCompleted,
    evaluationPending,
  } = useInternshipStatus();

  // กำหนดขั้นตอนหลักของ timeline
  const steps = [
    {
      key: "cs05",
      title: "ลงทะเบียนคำร้องฝึกงาน",
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
      key: "evaluation",
      title: "การประเมินฝึกงาน",
      description:
        summaryCompleted === true
          ? "การประเมินฝึกงานเสร็จสมบูรณ์แล้ว"
          : "กรุณาส่งแบบประเมินฝึกงานให้พี่เลี้ยง",
      action: summaryCompleted !== true && (
        <Button
          type="primary"
          href="/internship-summary"
          style={{ marginTop: 8 }}
        >
          ส่งแบบประเมินฝึกงาน
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
      case "evaluation":
        if (summaryCompleted === true) return "finish";
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

  // คำนวณ progress และ current step
  const calculateProgress = () => {
    const finishedSteps = steps.filter(step => getStepStatus(step.key) === "finish").length;
    const totalSteps = steps.length;
    const progress = Math.round((finishedSteps / totalSteps) * 100);
    
    // หา current step (step แรกที่ไม่ใช่ finish)
    const currentStepIndex = steps.findIndex(step => getStepStatus(step.key) !== "finish");
    const currentStep = currentStepIndex !== -1 ? currentStepIndex + 1 : totalSteps;
    
    return { progress, currentStep, totalSteps };
  };

  const { progress: overallProgress, currentStep, totalSteps } = calculateProgress();

  // ตรวจสอบสิทธิ์การลงทะเบียนฝึกงาน
  const isEligible = student?.eligibility?.internship?.eligible !== false;
  const eligibilityMessage = student?.eligibility?.internship?.message || "คุณยังไม่มีสิทธิ์ลงทะเบียนฝึกงาน กรุณาตรวจสอบเกณฑ์หรือรอการอนุมัติ";
  const isEnrolledInternship = !!cs05Status;

  // ตรวจสอบการแสดง blocked status
  const isBlocked = !isEligible;

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

  if (loading) {
    return (
      <Card 
        title={
          <Space>
            <BankOutlined />
            <span>ฝึกงาน</span>
            <Tag color="processing">กำลังโหลด</Tag>
          </Space>
        }
      >
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <Spin size="large" tip="กำลังโหลดข้อมูล..." />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card 
        title={
          <Space>
            <BankOutlined />
            <span>ฝึกงาน</span>
            <Tag color="error">เกิดข้อผิดพลาด</Tag>
          </Space>
        }
      >
        <Alert
          type="error"
          message="เกิดข้อผิดพลาด"
          description={error}
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <BankOutlined />
          <span>ฝึกงาน</span>
          {isBlocked ? (
            <Tag color="error">ไม่มีสิทธิ์</Tag>
          ) : !isEnrolledInternship ? (
            <Tag color="default">ยังไม่เริ่ม</Tag>
          ) : (
            <Tag color={overallProgress === 100 ? "success" : "processing"}>
              {overallProgress === 100 ? "เสร็จสิ้น" : "กำลังดำเนินการ"}
            </Tag>
          )}
        </Space>
      }
      extra={
        <Space>
          <Progress 
            type="circle" 
            percent={overallProgress} 
            size={40} 
            format={percent => `${percent}%`}
          />
          {totalSteps > 0 && (
            <Text type="secondary">
              ขั้นตอนที่ {currentStep}/{totalSteps}
            </Text>
          )}
          {isEligible ? (
            <Tag color="success"><UnlockOutlined /> มีสิทธิ์</Tag>
          ) : (
            <Tooltip title={eligibilityMessage}>
              <Tag color="error"><LockOutlined /> ยังไม่มีสิทธิ์</Tag>
            </Tooltip>
          )}
        </Space>
      }
    >
      {isEnrolledInternship ? (
        <Timeline>
          {steps.map((step) => {
            const status = getStepStatus(step.key);
            return (
              <Timeline.Item
                key={step.key}
                color={getColor(status)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Typography.Text strong style={{ fontSize: 16 }}>{step.title}</Typography.Text>
                  <Tag color={getColor(status)} size="small">
                    {getStatusText(status)}
                  </Tag>
                </div>
                <div style={{ margin: "6px 0 12px 0", color: "#444", fontSize: 15 }}>
                  {step.description}
                </div>
                {step.action}
              </Timeline.Item>
            );
          })}
        </Timeline>
      ) : (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <SolutionOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
          <Paragraph>คุณยังไม่ได้ลงทะเบียนฝึกงาน</Paragraph>
          <Button 
            type="primary" 
            href="/internship-registration/flow" 
            disabled={!isEligible}
          >
            ลงทะเบียนคำร้องฝึกงาน
          </Button>
          {!isEligible && (
            <Paragraph style={{ marginTop: 16 }} type="danger">
              <InfoCircleOutlined /> {eligibilityMessage}
            </Paragraph>
          )}
        </div>
      )}
    </Card>
  );
};

export default InternshipSection;
