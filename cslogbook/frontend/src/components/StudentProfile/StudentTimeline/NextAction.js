import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { 
  StarOutlined, FormOutlined, ExperimentOutlined, 
  SearchOutlined, UserOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

// คอมโพเนนต์สำหรับแสดงคำแนะนำการดำเนินการถัดไป
const NextAction = ({ student }) => {
  const { nextAction, internshipEligible, projectEligible, 
          internshipStatus, projectStatus, isEnrolledInternship, 
          isEnrolledProject, totalCredits } = student;
  
  // ตัวแปรเพื่อคำนวณว่าควรแนะนำให้ทำอะไรต่อไป
  let recommendedAction = nextAction; // เริ่มต้นจากค่าจาก API
  let actionContent = null;
  
  // หากค่า nextAction เป็น none หรือไม่ระบุ ให้พิจารณาจากสถานะอื่นๆ
  if (!nextAction || nextAction === 'none') {
    // ถ้ามีสิทธิ์ฝึกงานแต่ยังไม่ได้ลงทะเบียน
    if (internshipEligible && !isEnrolledInternship && internshipStatus !== 'completed') {
      recommendedAction = 'register_internship';
    }
    // ถ้าฝึกงานอยู่ ให้บันทึก logbook
    else if (isEnrolledInternship && internshipStatus === 'in_progress') {
      recommendedAction = 'daily_log';
    }
    // ถ้าผ่านฝึกงานแล้ว และมีสิทธิ์ทำโครงงาน แต่ยังไม่ได้ลงทะเบียน
    else if (internshipStatus === 'completed' && projectEligible && !isEnrolledProject) {
      recommendedAction = 'register_project';
    }
    // ถ้าทำโครงงานอยู่
    else if (isEnrolledProject && projectStatus === 'in_progress') {
      recommendedAction = 'continue_project';
    }
    // ถ้ายังไม่มีสิทธิ์ฝึกงาน แต่หน่วยกิตมากกว่า 75 แล้ว
    else if (!internshipEligible && totalCredits > 75) {
      recommendedAction = 'prepare_internship';
    }
  }
  
  switch(recommendedAction) {
    case 'upload_internship_report':
      actionContent = (
        <Space direction="vertical">
          <Text>อัปโหลดรายงานฝึกงานและแบบประเมินหลังจากที่ฝึกงานเสร็จสิ้น</Text>
          <Button type="primary" icon={<FormOutlined />} disabled={internshipStatus !== 'completed'} href="/internship/report/upload">
            อัปโหลดรายงานฝึกงาน
          </Button>
        </Space>
      );
      break;
    case 'daily_log':
      actionContent = (
        <Space direction="vertical">
          <Text>บันทึกการฝึกงานประจำวัน</Text>
          <Button type="primary" icon={<FormOutlined />} href="/internship/log">บันทึกการฝึกงาน</Button>
        </Space>
      );
      break;
    case 'register_internship':
      actionContent = (
        <Space direction="vertical">
          <Text>ลงทะเบียนฝึกงาน</Text>
          <Button type="primary" icon={<FormOutlined />} href="/internship-registration/cs05">ลงทะเบียนฝึกงาน</Button>
        </Space>
      );
      break;
    case 'register_project':
      actionContent = (
        <Space direction="vertical">
          <Text>ลงทะเบียนโครงงานพิเศษ</Text>
          <Button type="primary" icon={<ExperimentOutlined />} href="/project/register">ลงทะเบียนโครงงานพิเศษ</Button>
        </Space>
      );
      break;
    case 'continue_project':
      actionContent = (
        <Space direction="vertical">
          <Text>ดำเนินการโครงงานพิเศษต่อ</Text>
          <Button type="primary" icon={<ExperimentOutlined />} href="/project/dashboard">ดำเนินการต่อ</Button>
        </Space>
      );
      break;
    case 'prepare_internship':
      actionContent = (
        <Space direction="vertical">
          <Text>เตรียมตัวสำหรับการฝึกงาน</Text>
          <Text type="secondary">คุณมีหน่วยกิตสะสม {totalCredits} หน่วยกิต ใกล้ถึงเกณฑ์การฝึกงาน (81 หน่วยกิต) แล้ว</Text>
          <Button type="primary" icon={<SearchOutlined />} href="/internship/info">ดูข้อมูลการฝึกงาน</Button>
        </Space>
      );
      break;
    default:
      // ตรวจสอบสถานะเพิ่มเติม เพื่อแสดงข้อความที่เหมาะสม
      if (totalCredits >= 127 && projectStatus === 'completed' && internshipStatus === 'completed') {
        actionContent = (
          <Space direction="vertical">
            <Text>ยินดีด้วย! คุณน่าจะพร้อมสำหรับการจบการศึกษาแล้ว</Text>
            <Text type="secondary">กรุณาตรวจสอบเงื่อนไขการจบการศึกษาอื่นๆ เพิ่มเติม</Text>
            <Button type="primary" icon={<UserOutlined />} href="/graduate/check">ตรวจสอบการจบการศึกษา</Button>
          </Space>
        );
      } else if (!internshipEligible && !projectEligible) {
        actionContent = (
          <Space direction="vertical">
            <Text>ยังไม่มีสิทธิ์ในการฝึกงานหรือทำโครงงาน</Text>
            <Text type="secondary">ต้องมีหน่วยกิตอย่างน้อย 81 หน่วยกิตสำหรับฝึกงาน และ 95 หน่วยกิตสำหรับโครงงาน</Text>
            <Text type="secondary">ปัจจุบันคุณมี {totalCredits} หน่วยกิต</Text>
          </Space>
        );
      } else {
        actionContent = (
          <Text>ไม่มีการดำเนินการที่ต้องทำในขณะนี้</Text>
        );
      }
  }
  
  return (
    <Card size="small" bordered style={{ backgroundColor: '#f9f0ff', marginBottom: 16 }}>
      <Space align="start">
        <StarOutlined style={{ fontSize: '20px', color: '#722ed1' }} />
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>คำแนะนำการดำเนินการถัดไป</Text>
          {actionContent}
        </div>
      </Space>
    </Card>
  );
};

export default NextAction;