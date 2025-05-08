import React from 'react';
import { Card, Space, Tag, Progress, Tooltip, Empty, Button, Typography } from 'antd';
import { 
  ExperimentOutlined, UnlockOutlined, LockOutlined, 
  SolutionOutlined 
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

  return (
    <Card 
      title={
        <Space>
          <ExperimentOutlined />
          <span>โครงงานพิเศษ</span>
          {progress.project.blocked && <Tag color="error">ไม่สามารถดำเนินการได้</Tag>}
        </Space>
      }
      extra={
        <Space>
          <Progress 
            type="circle" 
            percent={progress.project.progress} 
            width={40} 
            format={percent => `${percent}%`}
          />
          {isEligible ? (
            <Tooltip title="มีสิทธิ์ทำโครงงานพิเศษ">
              <Tag color="success"><UnlockOutlined /> มีสิทธิ์</Tag>
            </Tooltip>
          ) : (
            <Tooltip title={eligibilityMessage}>
              <Tag color="error"><LockOutlined /> ยังไม่มีสิทธิ์</Tag>
            </Tooltip>
          )}
        </Space>
      }
    >
      {progress.project.blocked ? (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <LockOutlined style={{ fontSize: 32, color: '#ff4d4f', marginBottom: 16 }} />
          <Paragraph>
            <Text type="danger">ยังไม่สามารถเริ่มโครงงานได้</Text>
          </Paragraph>
          <Paragraph type="secondary">{eligibilityMessage}</Paragraph>
        </div>
      ) : (
        student.isEnrolledProject ? (
          progress.project.steps.length > 0 ? (
            <TimelineItems items={progress.project.steps} />
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
          </div>
        )
      )}
    </Card>
  );
};

export default ProjectSection;