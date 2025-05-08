import React from 'react';
import { Card, Space, Tag, Progress, Tooltip, Empty, Button, Typography, Timeline } from 'antd';
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

  return (
    <Card 
      title={
        <Space>
          <LaptopOutlined />
          <span>การฝึกงาน</span>
          {student.internshipStatus === 'completed' && <Tag color="success">เสร็จสิ้น</Tag>}
          {student.internshipStatus === 'in_progress' && <Tag color="processing">กำลังดำเนินการ</Tag>}
        </Space>
      }
      extra={
        <Space>
          <Progress 
            type="circle" 
            percent={progress.internship.progress} 
            width={40} 
            format={percent => `${percent}%`}
          />
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
        progress.internship.steps.length > 0 ? (
          <TimelineItems items={progress.internship.steps} />
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