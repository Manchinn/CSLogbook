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
          {student.internshipEligible ? (
            <Tag color="success"><UnlockOutlined /> มีสิทธิ์</Tag>
          ) : (
            <Tooltip title="ต้องมีหน่วยกิตสะสมมากกว่า 81 หน่วยกิต">
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
            disabled={!student.internshipEligible}
          >
            ลงทะเบียนฝึกงาน
          </Button>
          {!student.internshipEligible && (
            <Paragraph style={{ marginTop: 16 }} type="danger">
              <InfoCircleOutlined /> {progress.internship.blockReason}
            </Paragraph>
          )}
        </div>
      )}
    </Card>
  );
};

export default InternshipSection;