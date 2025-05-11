import React from 'react';
import { Card, Space, Tag, Progress, Tooltip, Empty, Button, Typography } from 'antd';
import { 
  LaptopOutlined, UnlockOutlined, LockOutlined, 
  FileDoneOutlined, InfoCircleOutlined 
} from '@ant-design/icons';
import TimelineItems from './TimelineItems';

const { Text, Paragraph } = Typography;

// คอมโพเนนต์สำหรับแสดงส่วนการฝึกงาน
const InternshipSection = ({ student, progress }) => {
  // ตรวจสอบสิทธิ์การฝึกงานจากหลายแหล่งข้อมูล
  const hasInternshipEligibility = () => {
    // กรณีมีข้อมูลจาก eligibility object ซึ่งเป็นรูปแบบใหม่
    if (student.eligibility && student.eligibility.internship && 
        typeof student.eligibility.internship.eligible === 'boolean') {
      return student.eligibility.internship.eligible;
    }
    
    // กรณีมี internshipEligible โดยตรง (รูปแบบเดิม)
    if (typeof student.internshipEligible === 'boolean') {
      return student.internshipEligible;
    }
    
    // กรณีคำนวณจากหน่วยกิต (ถ้าไม่มีข้อมูลอื่น)
    if (student.totalCredits && typeof student.totalCredits === 'number') {
      return student.totalCredits >= 81;
    }
    
    // ค่าเริ่มต้น
    return false;
  };
  
  // ดึงข้อความเหตุผลที่ไม่มีสิทธิ์ (ถ้ามี)
  const getEligibilityMessage = () => {
    if (student.eligibility && student.eligibility.internship && 
        student.eligibility.internship.message) {
      return student.eligibility.internship.message;
    }
    
    if (progress && progress.internship && progress.internship.blockReason) {
      return progress.internship.blockReason;
    }
    
    if (student.internshipEligibleMessage) {
      return student.internshipEligibleMessage;
    }
    
    return "ต้องมีหน่วยกิตสะสมมากกว่า 81 หน่วยกิต";
  };
  
  // สถานะสิทธิ์การฝึกงาน
  const isEligible = hasInternshipEligibility();
  
  // ข้อความเหตุผล
  const eligibilityMessage = getEligibilityMessage();

  // ตรวจสอบว่า progress.internship และ progress.internship.steps มีค่าหรือไม่
  const internshipSteps = progress?.internship?.steps || [];
  const currentStepDisplay = progress?.internship?.currentStepDisplay || 0;
  const totalStepsDisplay = progress?.internship?.totalStepsDisplay || 0;
  const overallProgress = progress?.internship?.progress || 0;

  return (
    <Card 
      title={
        <Space>
          <LaptopOutlined />
          <span>การฝึกงาน</span>
          {progress?.internship?.blocked ? (
            <Tag color="error">ไม่มีสิทธิ์</Tag>
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
            width={40} 
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
      {student.isEnrolledInternship ? (
        internshipSteps.length > 0 ? (
          <TimelineItems items={internshipSteps} />
        ) : (
          <Empty description="ยังไม่มีข้อมูลขั้นตอนการฝึกงาน" />
        )
      ) : (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <FileDoneOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
          <Paragraph>คุณยังไม่ได้ลงทะเบียนฝึกงาน</Paragraph>
          <Button 
            type="primary" 
            href="/internship-registration/cs05" 
            disabled={!isEligible}
          >
            ลงทะเบียนฝึกงาน
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