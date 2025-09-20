import React from 'react';
import { Typography, Alert } from 'antd';

const { Title, Paragraph } = Typography;

// TopicSubmitPage (รีเซ็ตใหม่)
// โค้ดเดิมฟอร์ม “เสนอหัวข้อโครงงาน” ถูกลบตามคำขอเพื่อเริ่มพัฒนาใหม่ตั้งแต่ศูนย์
// TODO: ออกแบบ UX ใหม่สำหรับขั้นตอนการสร้างโครงงาน (ชื่อ, ประเภท, Tracks, Advisor, สมาชิก, รายละเอียด คพ.01)
// แนวทางที่อาจใช้:
// 1) Wizard หลายขั้น
// 2) Inline progressive form + draft autosave
// 3) แยกส่วน metadata กับรายละเอียด
// ใส่ logic ใหม่ที่นี่ภายหลัง

const TopicSubmitPage = () => {
  return (
    <div style={{ padding: 16 }}>
      <Title level={4} style={{ marginTop: 0 }}>เสนอหัวข้อโครงงาน (กำลังปรับปรุงใหม่)</Title>
      <Paragraph type="secondary">หน้าเก่าได้ถูกลบออกเพื่อลงมือออกแบบใหม่ โปรดรอดำเนินการเวอร์ชันถัดไป</Paragraph>
      <Alert
        type="info"
        showIcon
        message="กำลังพัฒนา"
        description="ฟังก์ชันสร้าง/แก้ไขโครงงานจะกลับมาในเวอร์ชันใหม่ กรุณาอย่า deploy การเปลี่ยนแปลงนี้สู่ production จนกว่าจะมีหน้าใหม่แทน"
      />
    </div>
  );
};

export default TopicSubmitPage;
