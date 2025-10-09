import React, { useMemo, useState } from 'react';
import { Card, Typography, Row, Col, Tag, Button, Space, Alert, Modal, message, Tooltip } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  FileAddOutlined,
  UploadOutlined,
  TeamOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import { useStudentProject } from '../../../hooks/useStudentProject';
import { useStudentEligibility } from '../../../contexts/StudentEligibilityContext';
import ProjectDashboard from '../ProjectDashboard';
import { ProjectEligibilityCheck } from '../eligibility';
import { phase2CardSteps } from '../phase2';

// Phase1Dashboard: ศูนย์รวมขั้นตอน โครงงานพิเศษ 1
// - แสดงการ์ดขั้นตอนทั้งหมด (Phase1) ในหน้าเดียว
// - คลิกการ์ดแล้ว navigate ไปยัง sub-route เฉพาะ (placeholder ณ ตอนนี้)
// - Sub-route จะ render ผ่าน <Outlet /> ด้านล่าง (ถ้ามี)

// metadata ของการ์ดขั้นตอน Phase 1 สามารถขยาย field เพิ่มเติมได้ในอนาคต เช่น requiredRoles, permissions
const phase1Steps = Object.freeze([
  {
    key: 'topic-submit',
    phase: 'phase1',
  phaseLabel: 'โครงงานพิเศษ1',
    title: 'เสนอหัวข้อโครงงานพิเศษ',
    desc: 'แต่ละหัวข้อโครงงาน ส่งได้เพียงครั้งเดียวเท่านั้น',
    icon: <FileAddOutlined style={{ fontSize: 28 }} />,
    implemented: true
  },
  {
    key: 'topic-exam',
    phase: 'phase1',
  phaseLabel: 'โครงงานพิเศษ1',
    title: 'ติดตามผลสอบหัวข้อ',
    desc: 'ตรวจสอบกำหนดการสอบและสถานะผลหัวข้อ',
    icon: <FileSearchOutlined style={{ fontSize: 28 }} />,
    implemented: true
  },
  {
    key: 'meeting-logbook',
    phase: 'phase1',
  phaseLabel: 'โครงงานพิเศษ1',
    title: 'บันทึกการพบอาจารย์',
    desc: 'จองการพบและบันทึกการประชุมพร้อมส่งอีเมลแจ้งเตือนผู้เข้าร่วม',
    icon: <TeamOutlined style={{ fontSize: 28 }} />,
    implemented: true,
    requiresPostTopicUnlock: true
  },
  {
    key: 'exam-submit',
    phase: 'phase1',
  phaseLabel: 'โครงงานพิเศษ1',
    title: 'ส่งเอกสารสอบ',
    desc: 'เตรียมเอกสารประกอบการสอบปลายภาคโครงงานพิเศษ 1',
    icon: <UploadOutlined style={{ fontSize: 28 }} />,
    implemented: true,
    requiresPostTopicUnlock: true
  }
]);

// ฟอร์แมตวันที่ให้เป็นรูปแบบวัน/เดือน/ปี พ.ศ. เช่น 2/10/2568
const formatThaiDate = (dateInput) => {
  if (!dateInput) return null;
  const parsed = dayjs(dateInput);
  if (!parsed.isValid()) return null;
  const thaiYear = parsed.year() + 543;
  return `${parsed.format('D/M')}/${thaiYear}`;
};

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
    messages,
    academicSettings,
    requirements
  } = useStudentEligibility();

  const projectRegistrationStartDate = academicSettings?.projectRegistrationPeriod?.startDate || null;
  const currentSemester = academicSettings?.currentSemester !== undefined && academicSettings?.currentSemester !== null
    ? Number(academicSettings.currentSemester)
    : null;
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

  const postTopicLockReasons = useMemo(() => {
    if (!activeProject) return [];
    const reasons = [];
    if (!activeProject.examResult) {
      reasons.push('เจ้าหน้าที่ภาควิชายังไม่ได้บันทึกผลสอบหัวข้อในระบบ');
    } else if (activeProject.examResult !== 'passed') {
      reasons.push('ผลสอบหัวข้อยังไม่ผ่าน จึงไม่สามารถดำเนินขั้นตอนถัดไปได้');
    }
    // อนุญาตให้เข้าถึงได้ทั้งสถานะ in_progress และ completed
    // เพื่อให้นักศึกษาสามารถดูบันทึกการพบอาจารย์ย้อนหลังได้แม้โครงงานเสร็จสิ้นแล้ว
    if (!['in_progress', 'completed'].includes(activeProject.status)) {
      reasons.push('สถานะโครงงานยังไม่เป็น "กำลังดำเนินการ"');
    }
    return reasons;
  }, [activeProject]);

  const postTopicGateReasons = useMemo(() => {
    if (!activeProject) {
      return ['ยังไม่มีข้อมูลโครงงานที่เจ้าหน้าที่ภาควิชาบันทึกในระบบ'];
    }
    return postTopicLockReasons;
  }, [activeProject, postTopicLockReasons]);

  const allowedPhase2Semesters = useMemo(() => {
    const rawSemesters = requirements?.project?.allowedSemesters;
    if (!rawSemesters) return null;

    // รองรับหลายรูปแบบที่ backend อาจส่งมา (array, object, json string)
    const normalize = (value) => {
      if (value === null || value === undefined) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'object') return Object.values(value).flat();
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed)
            ? parsed
            : (typeof parsed === 'object' ? Object.values(parsed).flat() : []);
        } catch (error) {
          return [];
        }
      }
      return [];
    };

    return normalize(rawSemesters)
      .map((item) => Number(item))
      .filter((semester) => Number.isInteger(semester));
  }, [requirements?.project?.allowedSemesters]);

  const phase2GateReasons = useMemo(() => {
    // รวบรวมเหตุผลที่ยังไม่สามารถเปิด Phase 2 (โครงงานพิเศษ 2) ให้ผู้ใช้เข้าไปดำเนินการได้
    if (!activeProject) return ['ยังไม่มีข้อมูลโครงงาน'];
    const reasons = [];
    if (activeProject.examResult !== 'passed') {
      reasons.push('ผลสอบหัวข้อยังไม่ผ่าน');
    }
    if (!['in_progress', 'completed'].includes(activeProject.status || '')) {
      reasons.push('สถานะโครงงานยังไม่อยู่ในขั้น "กำลังดำเนินการ"');
    }

    if (allowedPhase2Semesters && allowedPhase2Semesters.length > 0 && Number.isInteger(currentSemester)) {
      // ตรวจสอบว่าภาคเรียนปัจจุบันอยู่ในช่วงที่หลักสูตรอนุญาตให้สอบโครงงานพิเศษ 2 หรือไม่
      if (!allowedPhase2Semesters.includes(currentSemester)) {
        reasons.push(`ภาคเรียนที่ ${currentSemester} ยังไม่เปิดยื่นสอบโครงงานพิเศษ 2`);
      }
    }

    if (projectRegistrationStartDate) {
      const startDate = dayjs(projectRegistrationStartDate);
      if (startDate.isValid() && dayjs().isBefore(startDate)) {
        const displayDate = formatThaiDate(projectRegistrationStartDate);
        reasons.push(
          displayDate
            ? `ภาคเรียนถัดไปจะเปิดให้ยื่นสอบโครงงานพิเศษ 2 ในวันที่ ${displayDate}`
            : 'ภาคเรียนถัดไปยังไม่เปิดให้ยื่นสอบโครงงานพิเศษ 2'
        );
      }
    }
    return reasons;
  }, [activeProject, currentSemester, allowedPhase2Semesters, projectRegistrationStartDate]);
  const canAccessPhase2 = activeProject && phase2GateReasons.length === 0;

  const leaderMember = useMemo(() => {
    if (!activeProject || !Array.isArray(activeProject.members)) return null;
    return activeProject.members.find(member => member.role === 'leader') || null;
  }, [activeProject]);

  const meetingProgress = useMemo(() => {
    if (!activeProject) {
      return {
        required: 0,
        approved: 0,
        totalApproved: 0,
        satisfied: true
      };
    }
    const metrics = activeProject.meetingMetrics;
    if (!metrics) {
      return {
        required: 0,
        approved: 0,
        totalApproved: 0,
        satisfied: true
      };
    }
    const required = Number(metrics.requiredApprovedLogs) || 0;
    const perStudent = Array.isArray(metrics.perStudent) ? metrics.perStudent : [];
    const leaderId = leaderMember?.studentId;
    const leaderApproved = leaderId
      ? Number(perStudent.find(item => Number(item.studentId) === Number(leaderId))?.approvedLogs || 0)
      : 0;
    const totalApproved = Number(metrics.totalApprovedLogs) || leaderApproved;
    return {
      required,
      approved: leaderApproved,
      totalApproved,
      satisfied: required === 0 || leaderApproved >= required
    };
  }, [activeProject, leaderMember]);

  const project1DefenseRequest = useMemo(() => {
    if (!Array.isArray(activeProject?.defenseRequests)) return null;
    return activeProject.defenseRequests.find(request => request.defenseType === 'PROJECT1' && request.status !== 'cancelled') || null;
  }, [activeProject?.defenseRequests]);

  const thesisDefenseRequest = useMemo(() => {
    if (!Array.isArray(activeProject?.defenseRequests)) return null;
    return activeProject.defenseRequests.find(request => request.defenseType === 'THESIS' && request.status !== 'cancelled') || null;
  }, [activeProject?.defenseRequests]);

  const stepStatusMap = useMemo(() => {
    const statuses = {};

    const setStatus = (key, label, color = 'default') => {
      statuses[key] = { label, color };
    };

    if (!activeProject) {
      ['topic-submit', 'topic-exam', 'meeting-logbook', 'exam-submit', 'phase2-overview'].forEach(key => setStatus(key, 'ยังไม่มีโครงงาน', 'default'));
      return statuses;
    }

    const members = Array.isArray(activeProject.members) ? activeProject.members : [];
    const membersCount = members.length;
    const hasTopicTitles = Boolean(activeProject.projectNameTh) && Boolean(activeProject.projectNameEn);
    const isFailedArchived = activeProject.examResult === 'failed' && Boolean(activeProject.studentAcknowledgedAt);

    if (isFailedArchived) {
      setStatus('topic-submit', 'ต้องยื่นใหม่', 'red');
    } else if (membersCount >= 2 && hasTopicTitles) {
      setStatus('topic-submit', 'เสร็จสิ้น', 'green');
    } else if (membersCount > 0 || hasTopicTitles) {
      setStatus('topic-submit', 'กำลังดำเนินการ', 'blue');
    } else {
      setStatus('topic-submit', 'ยังไม่เริ่ม', 'default');
    }

    const project1Status = project1DefenseRequest?.status;
    if (activeProject.examResult === 'passed') {
      setStatus('topic-exam', 'ผ่านการสอบหัวข้อ', 'green');
    } else if (activeProject.examResult === 'failed') {
      setStatus('topic-exam', activeProject.studentAcknowledgedAt ? 'ไม่ผ่าน (รับทราบแล้ว)' : 'ไม่ผ่าน', 'red');
    } else if (project1Status) {
      if (['advisor_rejected', 'staff_returned', 'cancelled'].includes(project1Status)) {
        setStatus('topic-exam', 'คำขอถูกส่งกลับ', 'red');
      } else if (['staff_verified', 'scheduled'].includes(project1Status)) {
        setStatus('topic-exam', 'รอวันสอบ', 'geekblue');
      } else if (project1Status === 'completed') {
        setStatus('topic-exam', 'รอประกาศผล', 'geekblue');
      } else {
        setStatus('topic-exam', 'อยู่ระหว่างพิจารณา', 'blue');
      }
    } else {
      setStatus('topic-exam', 'ยังไม่ยื่นคำขอสอบ', 'default');
    }

    if (meetingProgress.required > 0) {
      if (meetingProgress.satisfied) {
        setStatus('meeting-logbook', `ครบเกณฑ์ ${meetingProgress.approved}/${meetingProgress.required}`, 'green');
      } else if (meetingProgress.approved > 0) {
        setStatus('meeting-logbook', `อนุมัติแล้ว ${meetingProgress.approved}/${meetingProgress.required}`, 'blue');
      } else {
        setStatus('meeting-logbook', `ยังไม่บันทึก (${meetingProgress.required})`, 'default');
      }
    } else {
      if (meetingProgress.approved > 0) {
        setStatus('meeting-logbook', `บันทึกแล้ว ${meetingProgress.approved}`, 'blue');
      } else {
        setStatus('meeting-logbook', 'พร้อมบันทึก', 'default');
      }
    }

    const systemTestSummary = activeProject.systemTestRequest;
    if (!systemTestSummary) {
      setStatus('system-test', 'ยังไม่ยื่นคำขอ', 'default');
    } else {
      switch (systemTestSummary.status) {
        case 'pending_advisor':
          setStatus('system-test', 'รออาจารย์อนุมัติ', 'orange');
          break;
        case 'advisor_rejected':
          setStatus('system-test', 'อาจารย์ส่งกลับแก้ไข', 'red');
          break;
        case 'pending_staff':
          setStatus('system-test', 'รอเจ้าหน้าที่ตรวจสอบ', 'purple');
          break;
        case 'staff_rejected':
          setStatus('system-test', 'เจ้าหน้าที่ส่งกลับ', 'red');
          break;
        case 'staff_approved':
          if (systemTestSummary.evidenceSubmittedAt) {
            setStatus('system-test', 'อัปโหลดหลักฐานครบแล้ว', 'green');
          } else {
            setStatus('system-test', 'ต้องอัปโหลดหลักฐานหลังครบ 30 วัน', 'blue');
          }
          break;
        default:
          setStatus('system-test', 'รอดำเนินการ', 'default');
      }
    }

    if (!project1DefenseRequest) {
      setStatus('exam-submit', 'ยังไม่ยื่นคำขอ', 'default');
    } else {
      const defenseStatus = project1DefenseRequest.status;
      if (['advisor_rejected', 'staff_returned', 'cancelled'].includes(defenseStatus)) {
        setStatus('exam-submit', 'คำขอถูกส่งกลับ', 'red');
      } else if (['staff_verified', 'scheduled', 'completed'].includes(defenseStatus)) {
        setStatus('exam-submit', 'ส่งเรียบร้อย', 'green');
      } else if (defenseStatus === 'advisor_approved') {
        setStatus('exam-submit', 'อาจารย์อนุมัติครบ', 'purple');
      } else {
        setStatus('exam-submit', 'รอการอนุมัติ', 'blue');
      }
    }

    if (!thesisDefenseRequest) {
      setStatus('thesis-defense-request', 'ยังไม่ยื่นคำขอ', 'default');
    } else {
      const thesisStatus = thesisDefenseRequest.status;
      if (['advisor_rejected', 'staff_returned', 'cancelled'].includes(thesisStatus)) {
        setStatus('thesis-defense-request', 'คำขอถูกส่งกลับ', 'red');
      } else if (thesisStatus === 'advisor_approved') {
        setStatus('thesis-defense-request', 'อาจารย์อนุมัติครบ', 'purple');
      } else if (['staff_verified', 'scheduled'].includes(thesisStatus)) {
        setStatus('thesis-defense-request', 'ติดตามประกาศวันสอบ', 'geekblue');
      } else if (thesisStatus === 'completed') {
        setStatus('thesis-defense-request', 'บันทึกผลสอบแล้ว', 'green');
      } else {
        setStatus('thesis-defense-request', 'รอการอนุมัติ', 'blue');
      }
    }

    if (!canAccessPhase2) {
      setStatus('phase2-overview', 'รอปลดล็อก', 'gold');
    } else if (thesisDefenseRequest?.status === 'completed') {
      setStatus('phase2-overview', 'เสร็จสิ้น Phase 2', 'green');
    } else if (thesisDefenseRequest) {
      if (['advisor_rejected', 'staff_returned', 'cancelled'].includes(thesisDefenseRequest.status)) {
        setStatus('phase2-overview', 'คำขอสอบ 2 ถูกส่งกลับ', 'red');
      } else if (['staff_verified', 'scheduled'].includes(thesisDefenseRequest.status)) {
        setStatus('phase2-overview', 'รอสอบโครงงานพิเศษ 2', 'geekblue');
      } else {
        setStatus('phase2-overview', 'กำลังยื่นสอบ Phase 2', 'blue');
      }
    } else {
      setStatus('phase2-overview', 'พร้อมเริ่ม Phase 2', 'geekblue');
    }

    return statuses;
  }, [activeProject, canAccessPhase2, meetingProgress, project1DefenseRequest, thesisDefenseRequest]);

  const showAck = activeProject && activeProject.examResult === 'failed' && !activeProject.studentAcknowledgedAt;

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

  const phase1StepsMap = useMemo(() => phase1Steps.reduce((acc, s) => {
    acc[s.key] = s;
    return acc;
  }, {}), []);

  const phase2OverviewStep = useMemo(
    () => phase2CardSteps.find((step) => step.key === 'phase2-overview') || null,
    []
  );

  const phase2SecondarySteps = useMemo(
    () => phase2CardSteps.filter((step) => step.key !== 'phase2-overview'),
    []
  );

  const allSteps = useMemo(
    () => [
      ...(phase2OverviewStep ? [phase2OverviewStep] : []),
      ...phase1Steps,
      ...phase2SecondarySteps
    ],
    [phase2OverviewStep, phase2SecondarySteps]
  );

  // handleOpen: จัดการคลิกการ์ดแต่ละขั้นตอน แยกตามเฟสและตรวจสอบเงื่อนไขการปลดล็อก
  const handleOpen = (stepKey) => {
    const meta = allSteps.find((step) => step.key === stepKey);
    if (!meta) {
      return;
    }

    const lockReasons = [];
    if (meta.requiresPostTopicUnlock) {
      lockReasons.push(...postTopicGateReasons);
    }
    if (meta.requiresPhase2Unlock) {
      lockReasons.push(...phase2GateReasons);
    }

    if (!meta.implemented) {
      message.info(meta.comingSoon ? 'ฟีเจอร์กำลังพัฒนา (Coming Soon)' : 'ฟีเจอร์กำลังพัฒนา');
      return;
    }

    if (lockReasons.length > 0) {
      const summary = lockReasons.join(' • ') || 'ขั้นตอนนี้ยังไม่พร้อมใช้งาน';
      message.warning(summary);
      return;
    }

    if (meta.phase === 'phase1') {
      navigate(`/project/phase1/${stepKey}`);
      return;
    }

    if (meta.target) {
      navigate(meta.target);
      return;
    }

    message.info('กำลังเตรียมฟีเจอร์นี้ให้พร้อมใช้งาน');
  };

  const activeStepMeta = activeSub ? phase1StepsMap[activeSub] : null;

  // ถ้า URL ไม่ตรงกับ step ที่มี ให้ถือว่าไม่มี activeSub
  if (activeSub && !activeStepMeta) {
    // reset กลับ root
    navigate('/project/phase1', { replace: true });
  }

  if (activeSub && activeStepMeta?.requiresPostTopicUnlock && (!activeProject || postTopicGateReasons.length > 0)) {
    return (
      <div style={containerStyle}>
        <Card>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Title level={4} style={{ margin: 0 }}>ยังไม่สามารถเข้าถึงขั้นตอนนี้ได้</Title>
            <Text type="secondary">
              ขั้นตอน {activeStepMeta.title} จะเปิดใช้งานหลังจากเจ้าหน้าที่ภาควิชาบันทึกผลสอบหัวข้อเป็น "ผ่าน" และโครงงานอยู่ในสถานะ "in_progress"
            </Text>
            <div>
              <Text strong>เหตุผลที่ยังไม่พร้อม:</Text>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                {postTopicGateReasons.map((reason, index) => (
                  <li key={`lock-${index}`}>{reason}</li>
                ))}
              </ul>
            </div>
            <Button type="primary" onClick={() => navigate('/project/phase1')}>
              ย้อนกลับไปหน้าหลัก Phase 1
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  // Root view (ยังไม่เลือก step) -> แสดง overview การ์ดทั้งหมด
  if (!activeSub) {
    if (eligibilityLoading) {
      return (
        <div style={containerStyle}>
          <Card styles={{ body: { padding: 24  }}}>
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
          <Card styles={{ body: { padding: 24  }}} title={<Title level={3} style={{ margin: 0 }}>โครงงานพิเศษ 1 (Phase 1)</Title>}>
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
            <Card styles={{ body: { padding: 16  }}} style={{ border: '1px solid #ffa39e', background: '#fff1f0' }}>
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
          <Card title={<Title level={3} style={{ margin: 0 }}>โครงงานพิเศษและปริญญานิพนธ์</Title>}>
          </Card>
          {activeProject && postTopicLockReasons.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message="ขั้นตอนหลังสอบหัวข้อยังไม่พร้อมใช้งาน"
              description={(
                <ul style={{ margin: '12px 0 0 20px', padding: 0 }}>
                  {postTopicLockReasons.map((reason, index) => (
                    <li key={`post-topic-alert-${index}`}>{reason}</li>
                  ))}
                </ul>
              )}
              style={{ border: '1px solid #ffe58f', background: '#fffbe6' }}
            />
          )}
          <Row gutter={[16,16]}>
            {allSteps.map(s => {
              const lockReasonsForStep = [];
              if (s.requiresPostTopicUnlock) {
                lockReasonsForStep.push(...postTopicGateReasons);
              }
              if (s.requiresPhase2Unlock) {
                lockReasonsForStep.push(...phase2GateReasons);
              }
              const cardDisabled = !s.implemented || lockReasonsForStep.length > 0;
              const tooltipTitle = !s.implemented
                ? 'ฟีเจอร์กำลังพัฒนา'
                : (lockReasonsForStep.length
                  ? (
                    <div>
                      {lockReasonsForStep.map((reason, index) => (
                        <div key={`tooltip-${s.key}-${index}`}>{reason}</div>
                      ))}
                    </div>
                  )
                  : undefined);
              return (
                <Col xs={24} sm={12} md={8} key={s.key}>
                  <Tooltip title={tooltipTitle} placement="top">
                    <Card
                      hoverable={!cardDisabled}
                      onClick={() => {
                        if (cardDisabled) {
                          if (lockReasonsForStep.length) {
                            message.info(lockReasonsForStep.join(' • '));
                          }
                          return;
                        }
                        handleOpen(s.key);
                      }}
                      styles={{ body: { minHeight: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: cardDisabled ? 0.55 : 1  }}}
                      style={cardDisabled ? { cursor: 'not-allowed' } : undefined}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {s.icon}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{s.title}</div>
                          <div style={{ fontSize: 12, opacity: 0.75 }}>{s.desc}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {s.phaseLabel && (
                          <Tag color={s.phase === 'phase2' ? 'geekblue' : 'purple'} variant="borderless">
                            {s.phaseLabel}
                          </Tag>
                        )}
                        {!s.implemented ? (
                          <Tag>กำลังพัฒนา</Tag>
                        ) : lockReasonsForStep.length > 0 ? (
                          <Tag color="gold">รอปลดล็อก</Tag>
                        ) : (
                          <Tag color={stepStatusMap[s.key]?.color || 'blue'} variant="borderless">
                            {stepStatusMap[s.key]?.label || 'พร้อมใช้งาน'}
                          </Tag>
                        )}
                        {s.comingSoon && !s.implemented && <Tag color="default">Coming Soon</Tag>}
                      </div>
                    </Card>
                  </Tooltip>
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
    <div style={containerStyle}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card
          title={<Space align="center">{activeStepMeta?.icon}<span>{activeStepMeta?.title}</span></Space>}
          extra={<Button onClick={() => navigate('/project/phase1')}>ย้อนกลับ</Button>}
        >
          <Paragraph style={{ marginBottom: 0 }}>{activeStepMeta?.desc}</Paragraph>
        </Card>
        <Card styles={{ body: { padding: 16  }}}>
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
