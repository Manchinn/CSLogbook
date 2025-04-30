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
  return (
    <Card 
      title={
        <Space>
          <ExperimentOutlined />
          <span>โครงงานพิเศษ</span>
          {progress.project.blocked && <Tag color="error">ไม่สามารถดำเนินการได้</Tag>}
          {student.projectStatus === 'in_progress' && <Tag color="processing">กำลังดำเนินการ</Tag>}
          {student.projectStatus === 'completed' && <Tag color="success">เสร็จสิ้น</Tag>}
        </Space>
      }
      extra={
        <Space>
          <Progress 
            type="circle" 
            percent={progress.project.progress} 
            width={40} 
            status={progress.project.blocked ? 'exception' : 'normal'}
          />
          {student.projectEligible ? (
            <Tag color="success"><UnlockOutlined /> มีสิทธิ์</Tag>
          ) : (
            <Tooltip title="ต้องมีหน่วยกิตสะสมมากกว่า 95 หน่วยกิต และผ่านการฝึกงาน">
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
          <Paragraph type="secondary">{progress.project.blockReason}</Paragraph>
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
            <Button type="primary" href="/project/register">ลงทะเบียนโครงงาน</Button>
          </div>
        )
      )}
    </Card>
  );
};

export default ProjectSection;