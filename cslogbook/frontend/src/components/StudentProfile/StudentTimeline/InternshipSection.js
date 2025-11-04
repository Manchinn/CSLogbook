import React from "react";
import {
  Card,
  Tag,
  Button,
  Typography,
  Spin,
  Alert,
  Space,
  Progress,
  Tooltip,
  Empty,
  Timeline,
} from "antd";
import { 
  BankOutlined,
  UnlockOutlined, 
  LockOutlined,
  SolutionOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useInternshipStatus } from "../../../contexts/InternshipStatusContext";

const { Text, Paragraph } = Typography;

// คอมโพเนนต์สำหรับแสดงส่วนฝึกงาน
const InternshipSection = () => {
  // ดึงข้อมูลจาก Context
  const {
    cs05Status,
    internshipDate,
    summaryCompleted,
    certificateStatus,
    student,
    loading,
    error,
    internshipStatus,
  } = useInternshipStatus();
  
  // ข้อมูลพื้นฐาน
  const hasInternshipHistory = !!cs05Status;
  
  // สร้าง Timeline Steps จากข้อมูล Context
  const timelineSteps = buildTimelineSteps({
    cs05Status,
    internshipDate,
    summaryCompleted,
    certificateStatus,
    student,
  });
  
  // สถานะโดยรวม
  const overallStatus = internshipStatus || 'not_started';
  const completedSteps = timelineSteps.filter(s => s.status === 'finish').length;
  const overallProgress = timelineSteps.length > 0 ? Math.round((completedSteps / timelineSteps.length) * 100) : 0;
  const currentStepIndex = timelineSteps.findIndex(s => s.status !== 'finish');
  const currentStepDisplay = currentStepIndex !== -1 ? currentStepIndex + 1 : timelineSteps.length;
  const totalStepsDisplay = timelineSteps.length;

  // ตรวจสอบสิทธิ์การฝึกงาน
  const hasInternshipEligibility = () => {
    if (student?.eligibility?.internship?.eligible !== undefined) {
      return student.eligibility.internship.eligible;
    }
    if (typeof student?.internshipEligible === 'boolean') {
      return student.internshipEligible;
    }
    return false;
  };
  
  const getEligibilityMessage = () => {
    if (student?.eligibility?.internship?.message) {
      return student.eligibility.internship.message;
    }
    if (student?.internshipEligibleMessage) {
      return student.internshipEligibleMessage;
    }
    return "ต้องมีหน่วยกิตสะสมไม่น้อยกว่า 75 หน่วยกิต";
  };
  
  const isEligible = hasInternshipEligibility();
  const eligibilityMessage = getEligibilityMessage();
  const isEnrolledInternship = !!cs05Status || hasInternshipHistory;
  const showEligibilityWarning = !isEligible && !hasInternshipHistory;

  // 4. Config สำหรับ status tag
  const statusTagConfig = (() => {
    switch (overallStatus) {
      case 'completed':
        return { color: 'success', label: 'เสร็จสิ้น', icon: <CheckCircleOutlined /> };
      case 'failed':
        return { color: 'error', label: 'ไม่ผ่าน', icon: <ExclamationCircleOutlined /> };
      case 'not_started':
        return { color: 'default', label: 'ยังไม่เริ่ม', icon: <InfoCircleOutlined /> };
      default:
        return { color: 'processing', label: 'กำลังดำเนินการ', icon: <ClockCircleOutlined /> };
    }
  })();


  // 6. Loading state
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
          <Spin size="large" spinning={true} tip="กำลังโหลดข้อมูล...">
            <div style={{ minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div>{/* Loading content */}</div>
            </div>
          </Spin>
        </div>
      </Card>
    );
  }

  // 7. Error state
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

  // 8. แสดง overall status tag
  const renderStatusTag = () => {
    if (showEligibilityWarning) {
      return <Tag color="error" icon={<LockOutlined />}>ยังไม่มีสิทธิ์</Tag>;
    }
    
    return (
      <Tag color={statusTagConfig.color} icon={statusTagConfig.icon}>
        {statusTagConfig.label}
      </Tag>
    );
  };

  // Render เนื้อหาส่วนหลัก
  const renderContent = () => {
    // กรณีที่ยังไม่ได้ลงทะเบียน
    if (!isEnrolledInternship && !hasInternshipHistory) {
      return (
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
      );
    }

    // กรณีที่มี cs05Status - แสดง Timeline Steps
    if (cs05Status && timelineSteps.length > 0) {
      return (
        <Timeline
          items={timelineSteps.map((step) => ({
            key: step.key,
            color: getStepColor(step.status),
            children: (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Typography.Text strong style={{ fontSize: 16 }}>{step.title}</Typography.Text>
                  <Tag color={getStepColor(step.status)} size="small">
                    {getStepStatusText(step.status)}
                  </Tag>
                </div>
                <div style={{ margin: "6px 0 12px 0", color: "#444", fontSize: 15 }}>
                  {step.description}
                </div>
                {step.action}
              </>
            )
          }))}
        />
      );
    }

    // กรณีอื่นๆ
    return <Empty description="ยังไม่มีข้อมูลขั้นตอนฝึกงาน" />;
  };

  return (
    <Card 
      title={
        <Space>
          <BankOutlined />
          <span>ฝึกงาน</span>
          {renderStatusTag()}
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
          {totalStepsDisplay > 0 && (
            <Text type="secondary">
              ขั้นตอนที่ {currentStepDisplay}/{totalStepsDisplay}
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
      {renderContent()}
    </Card>
  );
};

// Helper Functions

// ฟังก์ชันสร้าง Timeline Steps จากข้อมูล Context
const buildTimelineSteps = ({ cs05Status, internshipDate, summaryCompleted, certificateStatus, student }) => {
  const steps = [];

  // Step 1: ลงทะเบียนคำร้อง CS05
  steps.push({
    key: 'cs05',
    title: 'ลงทะเบียนคำร้องฝึกงาน',
    description: !cs05Status
      ? (student?.eligibility?.internship?.eligible === false
          ? "คุณยังไม่มีสิทธิ์ลงทะเบียนฝึกงาน กรุณาตรวจสอบเกณฑ์"
          : "ยังไม่ได้ลงทะเบียนคำร้องฝึกงาน")
      : `สถานะคำร้อง: ${getCS05StatusText(cs05Status)}`,
    status: !cs05Status ? 'wait' : 
            ['approved', 'supervisor_approved', 'supervisor_evaluated'].includes(cs05Status) ? 'finish' : 'process',
    action: !cs05Status && student?.eligibility?.internship?.eligible !== false && (
      <Button type="primary" href="/internship-registration/flow" style={{ marginTop: 8 }}>
        ลงทะเบียนคำร้องฝึกงาน
      </Button>
    ),
  });

  // Step 2: รอเริ่มการฝึกงาน
  if (internshipDate?.startDate) {
    const now = new Date();
    const start = new Date(internshipDate.startDate);
    steps.push({
      key: 'wait_start',
      title: 'รอเริ่มการฝึกงาน',
      description: `รอถึงวันเริ่มฝึกงาน (${start.toLocaleDateString('th-TH')})`,
      status: now >= start ? 'finish' : 'process',
    });
  }

  // Step 3: อยู่ระหว่างการฝึกงาน
  if (internshipDate?.startDate && internshipDate?.endDate) {
    const now = new Date();
    const start = new Date(internshipDate.startDate);
    const end = new Date(internshipDate.endDate);
    steps.push({
      key: 'in_progress',
      title: 'อยู่ระหว่างการฝึกงาน',
      description: `ช่วงฝึกงาน: ${start.toLocaleDateString('th-TH')} - ${end.toLocaleDateString('th-TH')}`,
      status: now > end ? 'finish' : now >= start ? 'process' : 'wait',
      action: now >= start && now <= end && (
        <Button type="primary" href="/internship-logbook" style={{ marginTop: 8 }}>
          บันทึก Logbook
        </Button>
      ),
    });
  }

  // Step 4: ส่งสรุปผลการฝึกงาน
  if (internshipDate?.endDate) {
    const now = new Date();
    const end = new Date(internshipDate.endDate);
    steps.push({
      key: 'summary',
      title: 'ส่งสรุปผลการฝึกงาน',
      description: summaryCompleted
        ? 'ส่งสรุปผลการฝึกงานเรียบร้อยแล้ว'
        : 'กรุณาส่งสรุปผลการฝึกงาน',
      status: summaryCompleted ? 'finish' : now > end ? 'process' : 'wait',
      action: !summaryCompleted && now > end && (
        <Button type="primary" href="/internship-summary" style={{ marginTop: 8 }}>
          ส่งสรุปผล
        </Button>
      ),
    });
  }

  // Step 5: ขอหนังสือรับรอง
  if (summaryCompleted || certificateStatus) {
    steps.push({
      key: 'certificate',
      title: 'ขอหนังสือรับรองการฝึกงาน',
      description: certificateStatus === 'ready'
        ? 'ได้รับหนังสือรับรองแล้ว'
        : certificateStatus === 'pending'
        ? 'รอเจ้าหน้าที่อนุมัติหนังสือรับรอง'
        : 'สามารถขอหนังสือรับรองการฝึกงานได้',
      status: certificateStatus === 'ready' ? 'finish' : certificateStatus === 'pending' ? 'process' : 'wait',
      action: certificateStatus !== 'ready' && summaryCompleted && (
        <Button type="primary" href="/internship-certificate" style={{ marginTop: 8 }}>
          ขอหนังสือรับรอง
        </Button>
      ),
    });
  }

  // Step 6: เสร็จสิ้นการฝึกงาน
  if (certificateStatus) {
    steps.push({
      key: 'done',
      title: 'เสร็จสิ้นการฝึกงาน',
      description: certificateStatus === 'ready'
        ? 'กระบวนการฝึกงานของคุณเสร็จสมบูรณ์แล้ว'
        : 'รอรับหนังสือรับรองการฝึกงาน',
      status: certificateStatus === 'ready' ? 'finish' : 'wait',
    });
  }

  return steps;
};

// ฟังก์ชันแปลงสถานะเป็นสี
const getStepColor = (status) => {
  switch (status) {
    case 'finish': return 'green';
    case 'process': return 'blue';
    default: return 'gray';
  }
};

// ฟังก์ชันแปลงสถานะเป็นข้อความ
const getStepStatusText = (status) => {
  switch (status) {
    case 'finish': return 'เสร็จสิ้น';
    case 'process': return 'กำลังดำเนินการ';
    default: return 'รอดำเนินการ';
  }
};

// ฟังก์ชันแปลงสถานะ CS05 เป็นภาษาไทย
const getCS05StatusText = (status) => {
  const statusMap = {
    'draft': 'ร่างคำร้อง',
    'submitted': 'ส่งคำร้องแล้ว',
    'pending': 'รอการอนุมัติ',
    'approved': 'อนุมัติแล้ว',
    'rejected': 'ไม่อนุมัติ',
    'supervisor_approved': 'อาจารย์ที่ปรึกษาอนุมัติแล้ว',
    'supervisor_evaluated': 'อาจารย์ที่ปรึกษาประเมินแล้ว'
  };
  return statusMap[status] || status;
};

export default InternshipSection;
