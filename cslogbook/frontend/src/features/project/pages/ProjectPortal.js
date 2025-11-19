import React, { useMemo } from 'react';
import { Card, Typography, Space } from 'antd';
import { useStudentEligibility } from 'contexts/StudentEligibilityContext';
import ProjectDashboard from './ProjectDashboard';
import { ProjectEligibilityCheck } from 'features/project/components/shared/EligibilityCheck';

/*
  ProjectPortal
  - ศูนย์กลางโครงงานพิเศษสำหรับนักศึกษา
  - ถ้าไม่ผ่าน eligibility: แสดงเหตุผล + ปุ่มไปหน้า requirements / eligibility detail
  - ถ้าผ่าน แต่ยังไม่เคยสร้าง: แสดง CTA ให้สร้าง (ภายใน Dashboard มีปุ่มอยู่) + สรุปเกณฑ์
  - ถ้ามีโครงงานแล้ว: แสดง Dashboard เต็ม (reuse component)
*/
const ProjectPortal = () => {
  const { canAccessProject, isLoading } = useStudentEligibility();
  const { Title, Paragraph, Text } = Typography;

  const notEligible = !isLoading && !canAccessProject;

  const header = useMemo(() => (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      <Title level={3} style={{ margin: 0 }}>โครงงานพิเศษ (Project Portal)</Title>
      <Text type="secondary">ศูนย์รวมการจัดการโครงงานพิเศษ: สร้าง / เพิ่มสมาชิก / ตั้งอาจารย์ที่ปรึกษา / Promote</Text>
    </Space>
  ), [/* no deps */]);

  if (isLoading) {
    return <Card><Text>กำลังโหลดข้อมูลสิทธิ์...</Text></Card>;
  }

  if (notEligible) {
    // แสดงหน้าตรวจสอบคุณสมบัติแบบเต็ม (รวมสเต็ปและคำอธิบาย) ก่อน ผ่านแล้วผู้ใช้ refresh context จะเห็น Dashboard อัตโนมัติ
    return (
      <Space direction="vertical" style={{ width:'100%' }} size="large">
        <Card title={header}>
          <Typography.Paragraph style={{ marginBottom: 4 }}>
            ระบบจะเปิดใช้งานฟังก์ชันโครงงานเมื่อคุณสมบัติครบถ้วนตามเกณฑ์ด้านล่าง
          </Typography.Paragraph>
          <Typography.Text type="secondary">หลังผ่านเกณฑ์ หน้าเดียวกันนี้จะแสดง "Project Dashboard" อัตโนมัติ</Typography.Text>
        </Card>
        <ProjectEligibilityCheck />
      </Space>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title={header}>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>เงื่อนไขเบื้องต้น:</Text> ต้องมีสมาชิก 2 คน (หัวหน้า + สมาชิก), ตั้งชื่อ TH/EN, ประเภท, Track และเลือกอาจารย์ก่อนเริ่มดำเนินการ
        </Paragraph>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          เมื่อพร้อมแล้ว ใช้ปุ่ม "เริ่มดำเนินโครงงาน" ภายในรายละเอียดโครงงานเพื่อเข้าสู่สถานะ in_progress
        </Paragraph>
      </Card>
      {/* Embed Dashboard */}
      <ProjectDashboard />
    </Space>
  );
};

export default ProjectPortal;
