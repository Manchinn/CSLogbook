import React, { useMemo, useState } from 'react';
import { Card, Typography, Row, Col, Tag, Button, Space, Alert, Modal, message } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  FileAddOutlined,
  ScheduleOutlined,
  UploadOutlined,
  CalendarOutlined,
  EditOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useStudentProject } from '../../../hooks/useStudentProject';
import { useStudentEligibility } from '../../../contexts/StudentEligibilityContext';
import ProjectDashboard from '../ProjectDashboard';
import { ProjectEligibilityCheck } from '../eligibility';

// Phase1Dashboard: ศูนย์รวมขั้นตอน โครงงานพิเศษ 1
// - แสดงการ์ดขั้นตอนทั้งหมด (Phase1) ในหน้าเดียว
// - คลิกการ์ดแล้ว navigate ไปยัง sub-route เฉพาะ (placeholder ณ ตอนนี้)
// - Sub-route จะ render ผ่าน <Outlet /> ด้านล่าง (ถ้ามี)

// metadata ของขั้นตอนแต่ละการ์ด สามารถขยายเพิ่ม field อื่นได้ในอนาคต เช่น requiredRoles, permissions
const steps = [
  {
    key: 'topic-submit',
    title: 'เสนอหัวข้อโครงงานพิเศษ',
    desc: 'แต่ละหัวข้อโครงงาน ส่งได้เพียงครั้งเดียวเท่านั้น',
    icon: <FileAddOutlined style={{ fontSize: 28 }} />,
    implemented: true
  },
  {
    key: 'topic-exam',
    title: 'สอบหัวข้อ',
    desc: 'จัดตารางและบันทึกผลการสอบเสนอหัวข้อ (ภายหลัง)',
    icon: <ScheduleOutlined style={{ fontSize: 28 }} />,
    implemented: true,
    comingSoon: false
  },
  {
    key: 'meeting-logbook',
    title: 'บันทึกการพบอาจารย์',
    desc: 'จองการพบและบันทึก log พร้อมส่งอีเมลขออนุมัติ',
    icon: <TeamOutlined style={{ fontSize: 28 }} />,
    implemented: true
  },
  {
    key: 'exam-submit',
    title: 'ส่งเอกสารสอบ',
    desc: 'เตรียมเอกสารประกอบการสอบปลายภาคโครงงานพิเศษ 1',
    icon: <UploadOutlined style={{ fontSize: 28 }} />,
    implemented: true
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
  // โหลดข้อมูลโครงงานของผู้ใช้ (automatic load) อยู่ใน component (ไม่ใส่ก่อนประกาศ component)
  const { activeProject, loadProjects } = useStudentProject({ autoLoad: true });
  const {
    canAccessProject,
    isLoading: eligibilityLoading,
    projectReason,
    messages
  } = useStudentEligibility();
  const [ackLoading, setAckLoading] = useState(false);
  const [ackModalOpen, setAckModalOpen] = useState(false);
  const containerStyle = useMemo(() => ({
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24
  }), []);
  const projectAccessReason = projectReason || messages?.project || null;

  const showAck = activeProject && activeProject.examResult === 'failed' && !activeProject.studentAcknowledgedAt;
  const showPassed = activeProject && activeProject.examResult === 'passed';

  const handleAcknowledge = async () => {
    if (!activeProject) return;
    try {
      setAckLoading(true);
      const res = await (await import('../../../services/projectService')).default.acknowledgeExamResult(activeProject.projectId);
      if (!res.success) {
        message.error(res.message || 'รับทราบผลไม่สำเร็จ');
      } else {
        message.success('รับทราบผลแล้ว หัวข้อถูกเก็บถาวร');
        await loadProjects(); // จะทำให้ activeProject เปลี่ยน (อาจเป็น null)
      }
    } catch (e) {
      message.error(e.message || 'รับทราบผลไม่สำเร็จ');
    } finally {
      setAckLoading(false);
      setAckModalOpen(false);
    }
  };

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
    if (eligibilityLoading) {
      return (
        <div style={containerStyle}>
          <Card bodyStyle={{ padding: 24 }}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Title level={4} style={{ margin: 0 }}>โครงงานพิเศษ 1 (Phase 1)</Title>
              <Text type="secondary">กำลังตรวจสอบสิทธิ์การใช้งานโครงงานของคุณ...</Text>
            </Space>
          </Card>
        </div>
      );
    }

    if (!canAccessProject) {
      return (
        <div style={containerStyle}>
          <Card bodyStyle={{ padding: 24 }} title={<Title level={3} style={{ margin: 0 }}>โครงงานพิเศษ 1 (Phase 1)</Title>}>
            <Paragraph style={{ marginBottom: 8 }}>
              ระบบจะเปิดใช้งานฟีเจอร์โครงงานพิเศษเมื่อคุณผ่านเกณฑ์ตามข้อกำหนดด้านล่าง
            </Paragraph>
            <Text type="secondary">ตรวจสอบสถานะล่าสุดและเตรียมข้อมูลให้พร้อม จากนั้นรีเฟรชหน้านี้เพื่อใช้งานชุดเครื่องมือ Phase 1</Text>
            {projectAccessReason && (
              <Alert
                style={{ marginTop: 16 }}
                type="warning"
                showIcon
                message="ยังไม่สามารถใช้งานโครงงานพิเศษ"
                description={projectAccessReason}
              />
            )}
          </Card>
          <ProjectEligibilityCheck />
        </div>
      );
    }

    const ackModal = (
      <Modal
        open={ackModalOpen}
        title="ยืนยันการรับทราบผลสอบไม่ผ่าน"
        okText="ยืนยันรับทราบ"
        okButtonProps={{ danger: true, loading: ackLoading }}
        cancelText="ยกเลิก"
        onOk={handleAcknowledge}
        onCancel={() => !ackLoading && setAckModalOpen(false)}
      >
        <Typography.Paragraph>
          เมื่อรับทราบผล หัวข้อจะถูกเก็บถาวร (Archived) และคุณจะสามารถยื่นหัวข้อใหม่ในรอบถัดไป การกระทำนี้ไม่สามารถย้อนกลับได้
        </Typography.Paragraph>
        {activeProject?.examFailReason && (
          <Typography.Paragraph type="secondary" style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
            เหตุผล: {activeProject.examFailReason}
          </Typography.Paragraph>
        )}
      </Modal>
    );

    return (
      <>
        <div style={containerStyle}>
          {showAck && (
            <Card bodyStyle={{ padding: 16 }} style={{ border: '1px solid #ffa39e', background: '#fff1f0' }}>
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <Alert
                  type="error"
                  showIcon
                  message={<span><strong>ผลสอบหัวข้อ: ไม่ผ่าน</strong></span>}
                  description={
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      <div style={{ marginBottom: 8 }}>เหตุผล: {activeProject.examFailReason || '—'}</div>
                      <div style={{ fontSize: 12, color: '#555' }}>คุณต้องยื่นหัวข้อใหม่ในรอบถัดไป กรุณากด "รับทราบผล" เพื่อเคลียร์หัวข้อนี้ออกจากระบบ</div>
                    </div>
                  }
                />
                <div>
                  <Button danger type="primary" onClick={() => setAckModalOpen(true)} loading={ackLoading}>
                    รับทราบผล (หัวข้อจะถูกเก็บถาวร)
                  </Button>
                </div>
              </Space>
            </Card>
          )}
          {showPassed && (
            <Card bodyStyle={{ padding: 16 }} style={{ border: '1px solid #b7eb8f', background: '#f6ffed' }}>
              <Space direction="vertical" style={{ width: '100%' }} size={6}>
                <Alert
                  type="success"
                  showIcon
                  message={<span><strong>ผลสอบหัวข้อ: ผ่าน</strong></span>}
                  description={<div style={{ whiteSpace: 'pre-wrap' }}>
                    <div style={{ marginBottom: 4 }}>คุณสามารถเตรียมขั้นตอนต่อไป เช่น การจัดทำ Proposal (ฟีเจอร์กำลังพัฒนา)</div>
                    <div style={{ fontSize: 12, color: '#555' }}>ระบบจะเปิดให้ทำกิจกรรมขั้นต่อไปเมื่อฟีเจอร์พร้อม</div>
                  </div>}
                />
              </Space>
            </Card>
          )}
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
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {s.implemented ? <Tag color="blue">พร้อมใช้งาน</Tag> : <Tag>กำลังพัฒนา</Tag>}
                      {s.comingSoon && !s.implemented && <Tag color="default">Coming Soon</Tag>}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
          <ProjectDashboard />
        </div>
        {ackModal}
      </>
    );
  }

  // Sub view (อยู่ภายในขั้นตอนใดขั้นตอนหนึ่ง) -> แสดง header + Outlet เต็มความกว้าง
  return (
    <>
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
    <Modal
      open={ackModalOpen}
      title="ยืนยันการรับทราบผลสอบไม่ผ่าน"
      okText="ยืนยันรับทราบ"
      okButtonProps={{ danger: true, loading: ackLoading }}
      cancelText="ยกเลิก"
      onOk={handleAcknowledge}
      onCancel={() => !ackLoading && setAckModalOpen(false)}
    >
      <Typography.Paragraph>
        เมื่อรับทราบผล หัวข้อจะถูกเก็บถาวร (Archived) และคุณจะสามารถยื่นหัวข้อใหม่ในรอบถัดไป การกระทำนี้ไม่สามารถย้อนกลับได้
      </Typography.Paragraph>
    </Modal>
    </>
  );
};

export default Phase1Dashboard;
