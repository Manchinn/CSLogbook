import React from 'react';
import { Card, Typography, Alert, Space, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { 
  SettingOutlined, 
  InfoCircleOutlined, 
  HomeOutlined, 
  ToolOutlined,
  BookOutlined,
  CalendarOutlined,
  BellOutlined,
  TeamOutlined
} from '@ant-design/icons';
import WorkflowStepManagement from './WorkflowSteps/WorkflowStepManagement';

const { Title, Text } = Typography;

/**
 * หน้าการตั้งค่าขั้นตอน Workflow Steps สำหรับ admin
 */
const WorkflowStepsSettingsPage = () => {
  // กำหนด breadcrumb items สำหรับ Ant Design เวอร์ชันใหม่ พร้อม navigation links
  const breadcrumbItems = [
    {
      title: (
        <Link to="/admin/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>
          <HomeOutlined style={{ marginRight: 4 }} />
          หน้าหลัก
        </Link>
      )
    },
    {
      title: (
        <Link to="/admin/settings" style={{ color: 'inherit', textDecoration: 'none' }}>
          <SettingOutlined style={{ marginRight: 4 }} />
          การตั้งค่าระบบ
        </Link>
      )
    },
    {
      title: (
        <span>
          <ToolOutlined style={{ marginRight: 4 }} />
          จัดการขั้นตอน Workflow
        </span>
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      {/* Breadcrumb Navigation พร้อม link navigation */}
      <Breadcrumb 
        items={breadcrumbItems}
        style={{ marginBottom: '20px' }}
      />

      {/* Header Section */}
      <Card style={{ marginBottom: '20px' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>
            <ToolOutlined style={{ marginRight: 8 }} />
            การตั้งค่าขั้นตอน Workflow
          </Title>
          <Text type="secondary">
            จัดการขั้นตอนสำหรับการฝึกงานและโครงงานพิเศษ กำหนดลำดับและข้อกำหนดของแต่ละขั้นตอน
          </Text>
          
          {/* คำแนะนำการใช้งาน */}
          <Alert
            message="คำแนะนำการใช้งาน"
            description={
              <div>
                <p>• <strong>การฝึกงาน:</strong> จัดการขั้นตอนตั้งแต่การยื่นคำร้อง การอนุมัติ ไปจนถึงการประเมินผล</p>
                <p>• <strong>โครงงานพิเศษ:</strong> จัดการขั้นตอนตั้งแต่การเสนอหัวข้อ การนำเสนอ ไปจนถึงการส่งรูปเล่มปริญญานิพนธ์</p>
                <p>• <strong>การจัดเรียงลำดับ:</strong> สามารถเปลี่ยนลำดับขั้นตอนได้โดยการลากและวาง</p>
                <p>• <strong>การตรวจสอบการใช้งาน:</strong> ดูสถิติว่ามีนักศึกษากี่คนอยู่ในขั้นตอนใด</p>
                <p>• <strong>การสร้างขั้นตอนใหม่:</strong> กำหนดขั้นตอนเพิ่มเติมตามความต้องการของหลักสูตร</p>
              </div>
            }
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginTop: 16 }}
          />
        </Space>
      </Card>

      {/* Main Content */}
      <WorkflowStepManagement />
    </div>
  );
};

export default WorkflowStepsSettingsPage;