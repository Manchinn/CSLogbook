import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Divider, Empty, List, Row, Space, Spin, Tag, Timeline, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useStudentProject } from '../../../hooks/useStudentProject';
import { useStudentEligibility } from '../../../contexts/StudentEligibilityContext';
import projectService from '../../../services/projectService';
import dayjs from '../../../utils/dayjs';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

const DEFENSE_STATUS_META = {
  not_submitted: { color: 'default', text: 'ยังไม่ยื่นคำขอ' },
  submitted: { color: 'orange', text: 'ยื่นคำขอแล้ว (รออาจารย์)' },
  advisor_in_review: { color: 'orange', text: 'รออาจารย์อนุมัติครบ' },
  advisor_approved: { color: 'processing', text: 'อาจารย์อนุมัติครบ (รอเจ้าหน้าที่)' },
  staff_verified: { color: 'green', text: 'เจ้าหน้าที่ตรวจสอบแล้ว' },
  scheduled: { color: 'blue', text: 'นัดสอบแล้ว' },
  completed: { color: 'geekblue', text: 'บันทึกผลสอบแล้ว' },
  cancelled: { color: 'red', text: 'คำขอถูกยกเลิก' },
  advisor_rejected: { color: 'red', text: 'อาจารย์ไม่อนุมัติ' },
  staff_returned: { color: 'red', text: 'เจ้าหน้าที่ส่งกลับ' },
  default: { color: 'default', text: 'ไม่พบสถานะคำขอ' }
};

const SYSTEM_TEST_STATUS_META = {
  pending_advisor: { color: 'orange', text: 'รออาจารย์อนุมัติ' },
  advisor_rejected: { color: 'red', text: 'อาจารย์ส่งกลับ' },
  pending_staff: { color: 'purple', text: 'รอเจ้าหน้าที่ตรวจสอบ' },
  staff_rejected: { color: 'red', text: 'เจ้าหน้าที่ส่งกลับ' },
  staff_approved: { color: 'green', text: 'อนุมัติครบ (รอหลักฐาน)' },
  default: { color: 'default', text: 'ยังไม่ยื่นคำขอ' }
};

const Phase2Dashboard = () => {
  const navigate = useNavigate();
  const { activeProject, loading: projectLoading } = useStudentProject({ autoLoad: true });
  const { academicSettings } = useStudentEligibility();
  const [examDetail, setExamDetail] = useState(null);
  const [examLoading, setExamLoading] = useState(false);
  const [examError, setExamError] = useState(null);

  useEffect(() => {
    // ถ้าโครงงานยังไม่ผ่านการสอบหัวข้อ จะไม่ต้องยิง API เพื่อดึงรายละเอียดผลสอบเพิ่มเติม
    let ignore = false;
    const loadExamDetail = async () => {
      if (!activeProject || activeProject.examResult !== 'passed') {
        setExamDetail(null);
        setExamError(null);
        return;
      }
      setExamLoading(true);
      try {
        const res = await projectService.getProjectExamResult(activeProject.projectId, { examType: 'PROJECT1' });
        if (!ignore) {
          if (res?.success) {
            setExamDetail(res?.data || null);
            setExamError(null);
          } else {
            setExamDetail(null);
            setExamError(res?.message || 'ไม่สามารถโหลดผลสอบได้');
          }
        }
      } catch (error) {
        if (!ignore) {
          setExamDetail(null);
          setExamError(error.message || 'โหลดผลสอบไม่สำเร็จ');
        }
      } finally {
        if (!ignore) {
          setExamLoading(false);
        }
      }
    };

    loadExamDetail();
    return () => { ignore = true; };
  }, [activeProject]);

  const phase2GateReasons = useMemo(() => {
    // คำนวณรายการเหตุผลที่ยังไม่สามารถเข้า Phase 2 ได้ (เช่น หัวข้อยังไม่ผ่าน หรือสถานะโครงงานยังไม่ in_progress)
    if (!activeProject) {
      return ['ยังไม่พบโครงงานในระบบ'];
    }
    const reasons = [];
    if (activeProject.examResult !== 'passed') {
      reasons.push('ผลสอบหัวข้อยังไม่ผ่าน');
    }
    if (!['in_progress', 'completed'].includes(activeProject.status || '')) {
      reasons.push('สถานะโครงงานยังไม่เป็น "กำลังดำเนินการ"');
    }
    return reasons;
  }, [activeProject]);

  const phase2Unlocked = useMemo(() => phase2GateReasons.length === 0, [phase2GateReasons]);

  const thesisRequest = useMemo(() => {
    if (!Array.isArray(activeProject?.defenseRequests)) return null;
    return activeProject.defenseRequests.find((request) => request.defenseType === 'THESIS' && request.status !== 'cancelled') || null;
  }, [activeProject?.defenseRequests]);

  const thesisStatusKey = thesisRequest?.status || 'not_submitted';
  const thesisStatusMeta = DEFENSE_STATUS_META[thesisStatusKey] || DEFENSE_STATUS_META.default;

  const systemTestSummary = useMemo(() => activeProject?.systemTestRequest || null, [activeProject?.systemTestRequest]);
  const systemTestStatusMeta = useMemo(() => {
    if (!systemTestSummary) return SYSTEM_TEST_STATUS_META.default;
    if (systemTestSummary.status === 'staff_approved' && systemTestSummary.evidenceSubmittedAt) {
      return { color: 'green', text: 'อนุมัติครบและอัปโหลดหลักฐานครบแล้ว' };
    }
    return SYSTEM_TEST_STATUS_META[systemTestSummary.status] || SYSTEM_TEST_STATUS_META.default;
  }, [systemTestSummary]);
  const systemTestDueDay = useMemo(() => {
    if (!systemTestSummary?.testDueDate) return null;
    const due = dayjs(systemTestSummary.testDueDate);
    return due.isValid() ? due : null;
  }, [systemTestSummary?.testDueDate]);
  const systemTestCanUpload = useMemo(() => {
    if (!systemTestSummary || systemTestSummary.status !== 'staff_approved') return false;
    if (systemTestSummary.evidenceSubmittedAt) return false;
    if (!systemTestDueDay) return false;
    return dayjs().isAfter(systemTestDueDay);
  }, [systemTestSummary, systemTestDueDay]);

  const requireScopeRevision = Boolean(examDetail?.requireScopeRevision);

  const meetingRequirement = useMemo(() => {
    const metrics = activeProject?.meetingMetrics;
    if (!metrics) {
      return { required: 0, totalApproved: 0, satisfied: true };
    }
    const required = Number(metrics.requiredApprovedLogs) || 0;
    const totalApproved = Number(metrics.totalApprovedLogs) || 0;
    return {
      required,
      totalApproved,
      satisfied: required === 0 || totalApproved >= required
    };
  }, [activeProject?.meetingMetrics]);

  const thesisBlockingReasons = useMemo(() => {
    const reasons = [];
    if (!meetingRequirement.satisfied) {
      reasons.push(`บันทึกการพบอาจารย์ได้รับอนุมัติ ${meetingRequirement.totalApproved}/${meetingRequirement.required} ครั้ง`);
    }
    if (!systemTestSummary) {
      reasons.push('ยังไม่ส่งคำขอทดสอบระบบ 30 วัน');
    } else {
      if (systemTestSummary.status !== 'staff_approved') {
        reasons.push('คำขอทดสอบระบบยังไม่ผ่านการอนุมัติจากเจ้าหน้าที่');
      }
      if (!systemTestSummary.evidenceSubmittedAt) {
        reasons.push('ยังไม่ได้อัปโหลดหลักฐานผลการทดสอบระบบ');
      }
      if (!systemTestDueDay || !dayjs().isAfter(systemTestDueDay)) {
        reasons.push('ยังไม่ครบกำหนด 30 วันหลังการทดสอบระบบ');
      }
    }
    return reasons;
  }, [meetingRequirement, systemTestSummary, systemTestDueDay]);

  const formatDate = (value) => {
    if (!value) return null;
    const dt = dayjs(value);
    if (!dt.isValid()) return null;
    return dt.format('DD MMM YYYY เวลา HH:mm น.');
  };

  const formatDateOnly = (value) => {
    if (!value) return null;
    const dt = dayjs(value);
    if (!dt.isValid()) return null;
    return dt.format('DD/MM/YYYY');
  };

  const timelineItems = useMemo(() => {
    if (!phase2Unlocked) return [];
    const examRecorded = formatDate(examDetail?.recordedAt || activeProject?.examResultAt);
    const thesisScheduled = thesisRequest?.defenseScheduledAt ? formatDate(thesisRequest.defenseScheduledAt) : null;
    const thesisCompleted = thesisStatusKey === 'completed';

    const items = [
      {
        key: 'phase1-result',
        color: 'green',
        dot: <CheckCircleOutlined />,
        children: (
          <Space direction="vertical" size={2}>
            <Text strong>ผลสอบโครงงานพิเศษ 1</Text>
            <Text type="secondary">ผ่านเมื่อ {examRecorded || '—'}</Text>
          </Space>
        )
      },
      {
        key: 'scope-revision',
        color: requireScopeRevision ? 'orange' : 'green',
        dot: requireScopeRevision ? <WarningOutlined /> : <CheckCircleOutlined />,
        children: (
          <Space direction="vertical" size={2}>
            <Text strong>ปรับปรุง Scope ตามข้อเสนอแนะ</Text>
            <Text type="secondary">
              {requireScopeRevision ? 'หัวข้อสอบผ่านแบบมีเงื่อนไข กรุณาปรับ Scope ให้เรียบร้อยก่อนยื่นคำขอสอบ คพ.03' : 'หัวข้อสอบผ่านโดยไม่ต้องปรับ Scope'}
            </Text>
          </Space>
        )
      },
      {
        key: 'meeting-log',
        color: meetingRequirement.satisfied ? 'green' : 'blue',
        dot: meetingRequirement.satisfied ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
        children: (
          <Space direction="vertical" size={2}>
            <Text strong>บันทึกการพบอาจารย์ (Meeting Logbook)</Text>
            <Text type="secondary">
              {meetingRequirement.satisfied
                ? 'จำนวนบันทึกการพบที่ได้รับอนุมัติครบตามเกณฑ์'
                : `อนุมัติแล้ว ${meetingRequirement.totalApproved}/${meetingRequirement.required} รายการ`}
            </Text>
          </Space>
        )
      },
      {
        key: 'progress-report',
        color: 'blue',
        dot: <ClockCircleOutlined />,
        children: (
          <Space direction="vertical" size={2}>
            <Text strong>รายงานความก้าวหน้า (Progress Report)</Text>
            <Text type="secondary">เตรียมแบบฟอร์มและหลักฐานประกอบการยื่นสอบ คพ.03 (จะเปิดส่งในระบบเร็ว ๆ นี้)</Text>
          </Space>
        )
      },
      {
        key: 'thesis-request',
        color: thesisStatusKey === 'completed' ? 'green' : thesisStatusMeta.color,
        dot: thesisStatusKey === 'completed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
        children: (
          <Space direction="vertical" size={2}>
            <Text strong>ยื่นคำขอสอบโครงงานพิเศษ 2 (แบบ คพ.03)</Text>
            <Tag color={thesisStatusMeta.color}>{thesisStatusMeta.text}</Tag>
            {thesisRequest?.submittedAt && (
              <Text type="secondary">ยื่นเมื่อ {formatDate(thesisRequest.submittedAt)}</Text>
            )}
          </Space>
        )
      },
      {
        key: 'thesis-schedule',
        color: thesisCompleted ? 'green' : thesisScheduled ? 'blue' : 'gray',
        dot: thesisCompleted ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
        children: (
          <Space direction="vertical" size={2}>
            <Text strong>ตารางสอบโครงงานพิเศษ 2</Text>
            <Text type="secondary">
              {thesisCompleted
                ? 'บันทึกผลสอบเรียบร้อย'
                : thesisScheduled
                  ? `นัดสอบเมื่อ ${thesisScheduled}`
                  : 'เจ้าหน้าที่จะประกาศวันสอบหลังคำขอได้รับการตรวจสอบและอนุมัติครบ'}
            </Text>
          </Space>
        )
      }
    ];

    return items;
  }, [phase2Unlocked, examDetail, activeProject?.examResultAt, requireScopeRevision, meetingRequirement, thesisRequest, thesisStatusKey, thesisStatusMeta]);

  const renderHeader = () => (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Title level={4} style={{ margin: 0 }}>โครงงานพิเศษ 2 (Phase 2)</Title>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        เมื่อผ่านผลสอบหัวข้อแล้ว ระบบจะเปิดขั้นตอนสำหรับโครงงานพิเศษ 2 ให้ตรวจสอบและเตรียมเอกสารได้ทันที
      </Paragraph>
      {academicSettings && (
        <Text type="secondary">
          ภาคการศึกษาปัจจุบัน: ปีการศึกษา {academicSettings.currentAcademicYear || '—'} ภาคเรียนที่ {academicSettings.currentSemester || '—'}
        </Text>
      )}
    </Space>
  );

  if (projectLoading) {
    return (
      <Card bodyStyle={{ padding: 32 }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'center' }}>
          <Spin />
          <Text>กำลังโหลดข้อมูลโครงงาน...</Text>
        </Space>
      </Card>
    );
  }

  if (!activeProject) {
    return (
      <Card title={renderHeader()}>
        <Empty description="ยังไม่มีข้อมูลโครงงานสำหรับเข้า Phase 2" />
      </Card>
    );
  }

  if (!phase2Unlocked) {
    return (
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <Card title={renderHeader()}>
          <Alert
            type="warning"
            showIcon
            message="ยังไม่สามารถเข้าถึงขั้นตอนโครงงานพิเศษ 2"
            description={(
              <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                {phase2GateReasons.map((reason, index) => (
                  <li key={`phase2-lock-${index}`}>{reason}</li>
                ))}
              </ul>
            )}
          />
        </Card>
        <Card>
          <Paragraph style={{ marginBottom: 0 }}>
            กรุณาตรวจสอบขั้นตอนในโครงงานพิเศษ 1 ให้ครบถ้วนก่อน ระบบจะเปิด Phase 2 อัตโนมัติเมื่อเงื่อนไขครบ
          </Paragraph>
        </Card>
      </Space>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={24}>
      <Card title={renderHeader()}>
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Text><strong>รหัสโครงงาน:</strong> {activeProject.projectCode || '-'}</Text>
              <Text><strong>ชื่อโครงงาน:</strong> {activeProject.projectNameTh || '-'}</Text>
              <Text type="secondary">ผลสอบหัวข้อ: ผ่าน</Text>
              {examLoading && <Spin size="small" />}
              {examError && (
                <Alert
                  type="error"
                  showIcon
                  message="ไม่สามารถโหลดรายละเอียดผลสอบได้"
                  description={examError}
                />
              )}
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Text><strong>อาจารย์ที่ปรึกษา:</strong> {activeProject.advisor?.name || '-'}</Text>
              {requireScopeRevision && (
                <Alert
                  type="warning"
                  showIcon
                  message="ผลสอบผ่านแบบมีเงื่อนไข"
                  description="โปรดปรับปรุง Scope ตามคำแนะนำของกรรมการก่อนยื่นคำขอสอบโครงงานพิเศษ 2"
                />
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title="ลำดับขั้นตอนสำคัญ">
        <Timeline mode="left" items={timelineItems} />
      </Card>

      <Card title="สถานะคำขอทดสอบระบบ 30 วัน">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {!systemTestSummary ? (
            <>
              <Alert
                type="info"
                showIcon
                message="ยังไม่ยื่นคำขอทดสอบระบบ"
                description="เมื่อพร้อมทดลองใช้งานจริง สามารถยื่นคำขอผ่านปุ่มด้านล่าง"
              />
              <Button type="primary" onClick={() => navigate('/project/phase2/system-test')}>
                เปิดหน้าคำขอทดสอบระบบ
              </Button>
            </>
          ) : (
            <>
              <Space size={8} align="center" wrap>
                <Tag color={systemTestStatusMeta.color}>{systemTestStatusMeta.text}</Tag>
                <Text type="secondary">
                  {systemTestSummary.timeline?.staffDecidedAt
                    ? `อนุมัติล่าสุด ${formatDate(systemTestSummary.timeline.staffDecidedAt) || '—'}`
                    : `ส่งคำขอเมื่อ ${formatDate(systemTestSummary.submittedAt) || '—'}`}
                </Text>
              </Space>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="วันเริ่มทดสอบ">
                  {formatDateOnly(systemTestSummary.testStartDate) || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="ครบกำหนด 30 วัน">
                  {formatDateOnly(systemTestSummary.testDueDate) || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="หลักฐานการประเมิน">
                  {systemTestSummary.evidenceSubmittedAt
                    ? `อัปโหลดเมื่อ ${formatDate(systemTestSummary.evidenceSubmittedAt)}`
                    : systemTestCanUpload
                      ? 'ครบกำหนด สามารถอัปโหลดหลักฐานได้แล้ว'
                      : 'ยังไม่ถึงกำหนดหรือยังไม่ได้อัปโหลด'}
                </Descriptions.Item>
              </Descriptions>
              {systemTestCanUpload && (
                <Alert
                  type="warning"
                  showIcon
                  message="ครบกำหนด 30 วัน"
                  description="กรุณาอัปโหลดไฟล์หลักฐานการประเมินบนหน้าคำขอทดสอบระบบ"
                />
              )}
              <Button type="primary" onClick={() => navigate('/project/phase2/system-test')}>
                เปิดหน้าคำขอ / อัปโหลดหลักฐาน
              </Button>
            </>
          )}
        </Space>
      </Card>

      <Card title="คำขอสอบโครงงานพิเศษ 2 (คพ.03)">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space size={8} align="center" wrap>
            <Tag color={thesisStatusMeta.color}>{thesisStatusMeta.text}</Tag>
            {thesisRequest?.submittedAt && (
              <Text type="secondary">ยื่นล่าสุด {formatDate(thesisRequest.submittedAt) || '—'}</Text>
            )}
          </Space>

          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="บันทึกการพบอาจารย์ที่ได้รับอนุมัติ">
              {`${meetingRequirement.totalApproved}/${meetingRequirement.required}`} ครั้ง
            </Descriptions.Item>
            <Descriptions.Item label="สถานะคำขอทดสอบระบบ">
              {systemTestSummary
                ? `${systemTestStatusMeta.text}${systemTestSummary.evidenceSubmittedAt ? ' (อัปโหลดหลักฐานแล้ว)' : ''}`
                : 'ยังไม่ยื่นคำขอ'}
            </Descriptions.Item>
            <Descriptions.Item label="ครบกำหนด 30 วัน">
              {systemTestDueDay ? formatDateOnly(systemTestDueDay) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="สถานะล่าสุด">
              {thesisRequest
                ? formatDate(thesisRequest.updatedAt) || '—'
                : 'ยังไม่ยื่นคำขอ'}
            </Descriptions.Item>
          </Descriptions>

          {thesisBlockingReasons.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              message="ยังไม่พร้อมยื่นคำขอสอบ"
              description={(
                <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                  {thesisBlockingReasons.map((reason, index) => (
                    <li key={`thesis-block-${index}`}>{reason}</li>
                  ))}
                </ul>
              )}
            />
          ) : (
            <Alert
              type="success"
              showIcon
              message="พร้อมยื่นคำขอสอบ คพ.03 แล้ว"
              description="ตรวจสอบข้อมูลให้ครบถ้วนก่อนกดปุ่มเพื่อไปยังหน้าคำขอ"
            />
          )}

          <Button type="primary" onClick={() => navigate('/project/phase2/thesis-defense')}>
            เปิดหน้าคำขอสอบ คพ.03
          </Button>
        </Space>
      </Card>

      <Card title="ทรัพยากรแนะนำ">
        <List
          dataSource={[
            'แบบคำขอสอบโครงงานพิเศษ 2 (คพ.03) และรายการแนบ',
            'ตัวอย่าง Progress Report สำหรับใช้นำเสนอความคืบหน้า',
            'ปฏิทินภาควิชาสำหรับติดตามวันสอบล่าสุด'
          ]}
          renderItem={(item) => (
            <List.Item>
              <Text>{item}</Text>
            </List.Item>
          )}
        />
      </Card>

      {thesisRequest && (
        <Card title="สรุปสถานะคำขอสอบโครงงานพิเศษ 2 (คพ.03)">
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Tag color={thesisStatusMeta.color}>{thesisStatusMeta.text}</Tag>
            {thesisRequest.defenseLocation && (
              <Text type="secondary">สถานที่สอบ: {thesisRequest.defenseLocation}</Text>
            )}
            {thesisRequest.defenseNote && (
              <Text type="secondary" style={{ whiteSpace: 'pre-wrap' }}>หมายเหตุ: {thesisRequest.defenseNote}</Text>
            )}
          </Space>
          <Divider />
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            ระบบจะอัปเดตสถานะคำขอและวันสอบโดยอัตโนมัติเมื่อเจ้าหน้าที่บันทึกข้อมูล
          </Paragraph>
        </Card>
      )}
    </Space>
  );
};

export default Phase2Dashboard;
