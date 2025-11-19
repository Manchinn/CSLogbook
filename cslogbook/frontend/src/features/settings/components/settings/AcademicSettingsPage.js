import React from 'react';
import { Card, Typography, Alert, Space, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { 
  CalendarOutlined, 
  HomeOutlined, 
  SettingOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';
import AcademicSettings from './constants/academic/AcademicSettings';
import './constants/styles.css';

const { Title, Text } = Typography;

/**
 * หน้าการจัดการปีการศึกษาและภาคเรียนสำหรับ Admin
 */
const AcademicSettingsPage = () => {
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
          <CalendarOutlined style={{ marginRight: 4 }} />
          ปีการศึกษา/ภาคเรียน
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
            <CalendarOutlined style={{ marginRight: 8 }} />
            ตั้งค่าปีการศึกษาและภาคเรียน
          </Title>
          <Text type="secondary">
            กำหนดปีการศึกษา ภาคเรียน และช่วงเวลาการลงทะเบียนสำหรับนักศึกษา รวมทั้งกำหนดระยะเวลาต่างๆ ในระบบ
          </Text>
          
          {/* คำแนะนำการใช้งาน */}
          <Alert
            message="คำแนะนำการใช้งาน"
            description={
              <div>
                <p>• <strong>ตั้งปีการศึกษา:</strong> กำหนดปี พ.ศ. ที่เปิดใช้งาน ปิดปีเก่า และตั้งค่าปีปัจจุบันให้ระบบอ้างอิงกับทุกบริการ</p>
                <p>• <strong>บริหารภาคเรียน:</strong> ระบุช่วงวันเริ่ม-สิ้นสุดของภาคเรียนปกติ / ฤดูร้อน พร้อมกำหนดช่วงลงทะเบียนของแต่ละแผนการเรียน</p>
                <p>• <strong>จัดการช่วงลงทะเบียน:</strong> กำหนดวันเปิด-ปิดสำหรับฝึกงานและโครงงาน พร้อมกำหนดเงื่อนไขกรณีพิเศษ (เช่น อนุญาตส่งล่าช้า)</p>
                <p>• <strong>ตั้งกำหนดการสำคัญ:</strong> เพิ่มกิจกรรม เช่น วันสอบหัวข้อ วันส่งรายงาน และสามารถกำหนดระยะเวลาส่งล่าช้าแบบวัน/ชั่วโมง/นาทีได้</p>
                <p>• <strong>ตรวจสอบก่อนบันทึก:</strong> ตรวจดูสรุปรายการด้านล่างทุกครั้งเพื่อหลีกเลี่ยงการทับซ้อนของช่วงวันหรือการปิดระบบก่อนกำหนด</p>
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
      <AcademicSettings />
    </div>
  );
};

export default AcademicSettingsPage;