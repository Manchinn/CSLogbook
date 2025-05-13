import React from 'react';
import { Card, Space, Tag, Progress, Tooltip, Empty, Button, Typography } from 'antd';
import { 
  ExperimentOutlined, UnlockOutlined, LockOutlined, 
  SolutionOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import TimelineItems from './TimelineItems';

const { Text, Paragraph } = Typography;

// คอมโพเนนต์สำหรับแสดงส่วนโครงงานพิเศษ
const ProjectSection = ({ student, progress }) => {
  // ตรวจสอบสิทธิ์การทำโครงงานจากหลายแหล่งข้อมูล
  const hasProjectEligibility = () => {
    // กรณีมีข้อมูลจาก eligibility object ซึ่งเป็นรูปแบบใหม่
    if (student.eligibility && student.eligibility.project && 
        typeof student.eligibility.project.eligible === 'boolean') {
      return student.eligibility.project.eligible;
    }
    
    // กรณีมี projectEligible โดยตรง (รูปแบบเดิม)
    if (typeof student.projectEligible === 'boolean') {
      return student.projectEligible;
    }
    
    // กรณีคำนวณจากหน่วยกิต (ถ้าไม่มีข้อมูลอื่น)
    if (student.totalCredits && typeof student.totalCredits === 'number' &&
        student.majorCredits && typeof student.majorCredits === 'number') {
      return student.totalCredits >= 95 && student.majorCredits >= 47;
    }
    
    // ค่าเริ่มต้น
    return false;
  };
  
  // ดึงข้อความเหตุผลที่ไม่มีสิทธิ์ (ถ้ามี)
  const getEligibilityMessage = () => {
    if (student.eligibility && student.eligibility.project && 
        student.eligibility.project.message) {
      return student.eligibility.project.message;
    }
    
    if (progress && progress.project && progress.project.blockReason) {
      return progress.project.blockReason;
    }
    
    if (student.projectEligibleMessage) {
      return student.projectEligibleMessage;
    }
    
    return "ต้องมีหน่วยกิตสะสมมากกว่า 95 หน่วยกิต และหน่วยกิตวิชาเอกมากกว่า 47 หน่วยกิต";
  };
  
  // สถานะสิทธิ์การทำโครงงาน
  const isEligible = hasProjectEligibility();
  
  // ข้อความเหตุผล
  const eligibilityMessage = getEligibilityMessage();

  // ตรวจสอบว่า progress.project และ progress.project.steps มีค่าหรือไม่
  const projectSteps = progress?.project?.steps || [];
  const currentStepDisplay = progress?.project?.currentStepDisplay || 0;
  const totalStepsDisplay = progress?.project?.totalStepsDisplay || 0;
  const overallProgress = progress?.project?.progress || 0;
  
  // ตรวจสอบการแสดง blocked status
  const isBlocked = progress?.project?.blocked || !isEligible;

  // Handler สำหรับการคลิกปุ่มดำเนินการ
  const handleAction = (item) => {
    if (item.actionLink) {
      window.location.href = item.actionLink;
    }
    // ถ้ามีฟังก์ชันเพิ่มเติมสำหรับการจัดการ action สามารถเพิ่มได้ที่นี่
  };

  return (
    <Card 
      title={
        <Space>
          <ExperimentOutlined />
          <span>โครงงานพิเศษ</span>
          {isBlocked ? (
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
      {student.isEnrolledProject ? (
        projectSteps.length > 0 ? (
          <TimelineItems items={projectSteps} onAction={handleAction} />
        ) : (
          <Empty description="ยังไม่มีข้อมูลขั้นตอนโครงงาน" />
        )
      ) : (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <SolutionOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
          <Paragraph>คุณยังไม่ได้ลงทะเบียนโครงงานพิเศษ</Paragraph>
          <Button 
            type="primary" 
            href="/project-registration" 
            disabled={!isEligible}
          >
            ลงทะเบียนโครงงาน
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

export default ProjectSection;