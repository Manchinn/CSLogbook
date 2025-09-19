import React, { useMemo } from 'react';
import { Card, Typography, Row, Col, Tag, Button, Space } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  FileAddOutlined,
  ScheduleOutlined,
  FileSyncOutlined,
  UploadOutlined,
  CalendarOutlined,
  EditOutlined
} from '@ant-design/icons';

// Phase1Dashboard: ศูนย์รวมขั้นตอน โครงงานพิเศษ 1
// - แสดงการ์ดขั้นตอนทั้งหมด (Phase1) ในหน้าเดียว
// - คลิกการ์ดแล้ว navigate ไปยัง sub-route เฉพาะ (placeholder ณ ตอนนี้)
// - Sub-route จะ render ผ่าน <Outlet /> ด้านล่าง (ถ้ามี)

// metadata ของขั้นตอนแต่ละการ์ด สามารถขยายเพิ่ม field อื่นได้ในอนาคต เช่น requiredRoles, permissions
const steps = [
  {
    key: 'topic-submit',
    title: 'เสนอหัวข้อ',
    desc: 'เพิ่ม/แก้ไขชื่อโครงงาน TH/EN ประเภท Track และตั้งอาจารย์',
    icon: <FileAddOutlined style={{ fontSize: 28 }} />,
    implemented: true
  },
  {
    key: 'topic-exam',
    title: 'สอบหัวข้อ',
    desc: 'จัดตารางและบันทึกผลการสอบเสนอหัวข้อ (ภายหลัง)',
    icon: <ScheduleOutlined style={{ fontSize: 28 }} />,
    implemented: false,
    comingSoon: true
  },
  {
    key: 'proposal-revision',
    title: 'แก้ไขข้อเสนอ (Proposal)',
    desc: 'อัปโหลดเอกสาร Proposal เวอร์ชัน และติดตามสถานะ (เชื่อม proposal upload ปัจจุบัน)',
    icon: <FileSyncOutlined style={{ fontSize: 28 }} />,
    implemented: false,
    comingSoon: true
  },
  {
    key: 'exam-submit',
    title: 'ส่งเอกสารสอบ',
    desc: 'เตรียมเอกสารประกอบการสอบปลายภาคโครงงานพิเศษ 1',
    icon: <UploadOutlined style={{ fontSize: 28 }} />,
    implemented: false,
    comingSoon: true
  },
  {
    key: 'exam-day',
    title: 'วันสอบ',
    desc: 'สรุปกำหนดการ / บันทึกผล (อนาคต)',
    icon: <CalendarOutlined style={{ fontSize: 28 }} />,
    implemented: false,
    comingSoon: true
  },
  {
    key: 'scope-adjust',
    title: 'ปรับ Scope',
    desc: 'บันทึกการปรับขอบเขตหลังสอบ (อนาคต)',
    icon: <EditOutlined style={{ fontSize: 28 }} />,
    implemented: false,
    comingSoon: true
  }
];

const Phase1Dashboard = () => {
  const { Title, Paragraph, Text } = Typography;
  const navigate = useNavigate();
  const location = useLocation();

  // ตรวจว่ากำลังอยู่ในหน้า sub-step หรือไม่
  const activeSub = useMemo(() => {
    const match = location.pathname.match(/\/project\/phase1\/(.+)$/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const stepsMap = useMemo(() => steps.reduce((acc, s) => { acc[s.key] = s; return acc; }, {}), []);

  const handleOpen = (stepKey) => {
    const meta = stepsMap[stepKey];
    if (!meta) return;
    // ถ้ายังไม่ implement ป้องกันการเข้า (อาจเปลี่ยนเป็น Modal แจ้งเตือนในอนาคต)
    if (!meta.implemented) return;
    navigate(`/project/phase1/${stepKey}`);
  };

  const activeStepMeta = activeSub ? stepsMap[activeSub] : null;

  // ถ้า URL ไม่ตรงกับ step ที่มี ให้ถือว่าไม่มี activeSub
  if (activeSub && !activeStepMeta) {
    // reset กลับ root
    navigate('/project/phase1', { replace: true });
  }

  // Root view (ยังไม่เลือก step) -> แสดง overview การ์ดทั้งหมด
  if (!activeSub) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Card title={<Title level={3} style={{ margin: 0 }}>โครงงานพิเศษ 1 (Phase 1)</Title>}>
          <Paragraph style={{ marginBottom: 4 }}>เลือกขั้นตอนที่ต้องการทำงาน</Paragraph>
          <Text type="secondary">เฉพาะการ์ดที่พร้อม (Implemented) เท่านั้นที่คลิกได้ ส่วนอื่นอยู่ระหว่างพัฒนา</Text>
        </Card>
        <Row gutter={[16,16]}>
          {steps.map(s => {
            const disabled = !s.implemented;
            return (
              <Col xs={24} sm={12} md={8} key={s.key}>
                <Card
                  hoverable={!disabled}
                  onClick={() => handleOpen(s.key)}
                  bodyStyle={{ minHeight: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: disabled ? 0.55 : 1 }}
                  style={disabled ? { cursor: 'not-allowed' } : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {s.icon}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{s.title}</div>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>{s.desc}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    {s.implemented ? <Tag color="blue">พร้อมใช้งาน</Tag> : <Tag>กำลังพัฒนา</Tag>}
                    {s.comingSoon && !s.implemented && <Tag color="default">Coming Soon</Tag>}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  }

  // Sub view (อยู่ภายในขั้นตอนใดขั้นตอนหนึ่ง) -> แสดง header + Outlet เต็มความกว้าง
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card
          title={<Space align="center">{activeStepMeta?.icon}<span>{activeStepMeta?.title}</span></Space>}
          extra={<Button onClick={() => navigate('/project/phase1')}>ย้อนกลับ</Button>}
        >
          <Paragraph style={{ marginBottom: 0 }}>{activeStepMeta?.desc}</Paragraph>
        </Card>
        <Card bodyStyle={{ padding: 16 }}>
          {/* แสดงคอนเทนต์ย่อยที่ route โหลด (ไม่ใช่ placeholder) */}
          <Outlet />
        </Card>
      </Space>
    </div>
  );
};

export default Phase1Dashboard;
