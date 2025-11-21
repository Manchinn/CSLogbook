import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  Row,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
  message
} from 'antd';
import dayjs from 'utils/dayjs';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useStudentProject from 'features/project/hooks/useStudentProject';
import projectService from 'features/project/services/projectService';

const { Title, Text, Paragraph } = Typography;

const DEFENSE_STATUS_META = {
  submitted: { label: 'ยื่นคำขอแล้ว (รออาจารย์อนุมัติ)', color: 'orange', alert: 'info' },
  advisor_in_review: { label: 'รอการอนุมัติจากอาจารย์ที่ปรึกษา', color: 'orange', alert: 'info' },
  advisor_approved: { label: 'อาจารย์อนุมัติครบแล้ว รอเจ้าหน้าที่ตรวจสอบ', color: 'processing', alert: 'success' },
  staff_verified: { label: 'เจ้าหน้าที่ตรวจสอบแล้ว (ติดตามประกาศวันสอบ)', color: 'green', alert: 'success' },
  scheduled: { label: 'นัดสอบแล้ว (ระบบเดิม)', color: 'blue', alert: 'success' },
  completed: { label: 'บันทึกผลสอบแล้ว', color: 'geekblue', alert: 'success' },
  cancelled: { label: 'คำขอถูกยกเลิก', color: 'red', alert: 'warning' },
  advisor_rejected: { label: 'อาจารย์ไม่อนุมัติ', color: 'red', alert: 'warning' },
  default: { label: 'ไม่พบสถานะคำขอ', color: 'default', alert: 'info' }
};

const ADVISOR_STATUS_META = {
  pending: { label: 'รอดำเนินการ', color: 'default' },
  approved: { label: 'อนุมัติ', color: 'green' },
  rejected: { label: 'ปฏิเสธ', color: 'red' }
};

const DEFAULT_REQUIRED_LOGS = 4;

const ThesisDefenseRequestPage = () => {
  const navigate = useNavigate();
  const { activeProject, loadProjects, currentStudentId, advisors, } = useStudentProject({ autoLoad: true });
  const [form] = Form.useForm();
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestRecord, setRequestRecord] = useState(null);
  const containerStyle = useMemo(() => ({
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24
  }), []);

  const leaderMember = useMemo(() => {
    if (!activeProject) return null;
    return (activeProject.members || []).find((member) => member.role === 'leader') || null;
  }, [activeProject]);

  const isLeader = useMemo(() => {
    if (!activeProject || !leaderMember) return false;
    if (currentStudentId) {
      return Number(leaderMember.studentId) === Number(currentStudentId);
    }
    return false;
  }, [activeProject, currentStudentId, leaderMember]);

  const existingPayload = useMemo(() => requestRecord?.formPayload || null, [requestRecord]);

  const handleBackToPhase1 = useCallback(() => {
    navigate('/project/phase1');
  }, [navigate]);

  const buildStudentContactList = useCallback((project, payload) => {
    const snapshot = payload?.students || [];
    return (project?.members || []).map((member) => {
      const fallback = snapshot.find((s) => Number(s.studentId) === Number(member.studentId)) || {};
      return {
        studentId: member.studentId,
        studentCode: member.studentCode,
        name: member.name || member.studentCode,
        phone: member.phone || fallback.phone || '',
        email: member.email || fallback.email || ''
      };
    });
  }, []);

  const payloadToForm = useCallback((project, payload) => {
    if (!project) return {};
    return {
      requestDate: payload?.requestDate ? dayjs(payload.requestDate) : dayjs(),
      students: buildStudentContactList(project, payload)
    };
  }, [buildStudentContactList]);

  // ฟังก์ชันสร้างชื่อแสดงของอาจารย์
  const buildTeacherDisplayName = useCallback((teacher) => {
    if (!teacher) return '';
    const nameFromField = teacher.name || [teacher.firstName, teacher.lastName].filter(Boolean).join(' ').trim();
    const code = teacher.teacherCode || teacher.code || teacher.teacher_id;
    if (nameFromField && code) {
      return `${nameFromField} (${code})`;
    }
    if (nameFromField) return nameFromField;
    if (code) return `รหัสอาจารย์ ${code}`;
    return '';
  }, []);

  // ชื่อแสดงของอาจารย์ที่ปรึกษา
  const advisorDisplayName = useMemo(() => {
    if (!activeProject) return '';
    const directName = buildTeacherDisplayName(activeProject.advisor);
    if (directName) return directName;
    const advisorId = activeProject.advisorId || activeProject.advisor?.teacherId;
    if (!advisorId) return '';
    const matched = Array.isArray(advisors)
      ? advisors.find((teacher) => Number(teacher.teacherId) === Number(advisorId))
      : null;
    return buildTeacherDisplayName(matched);
  }, [activeProject, advisors, buildTeacherDisplayName]);

  const systemTestSnapshot = useMemo(() => {
    if (existingPayload?.systemTestSnapshot) {
      return existingPayload.systemTestSnapshot;
    }
    return activeProject?.systemTestRequest || null;
  }, [activeProject?.systemTestRequest, existingPayload?.systemTestSnapshot]);

  const systemTestReady = useMemo(() => {
    if (!systemTestSnapshot) return false;
    if (systemTestSnapshot.status !== 'staff_approved') return false;
    if (!systemTestSnapshot.evidenceSubmittedAt) return false;
    if (!systemTestSnapshot.testDueDate) return false;
    const due = dayjs(systemTestSnapshot.testDueDate);
    if (!due.isValid()) return false;
    return dayjs().isAfter(due);
  }, [systemTestSnapshot]);

  const meetingRequirement = useMemo(() => {
    const metrics = requestRecord?.meetingMetrics || activeProject?.meetingMetricsPhase2 || activeProject?.meetingMetrics;
    // ใช้ข้อมูลบันทึกการพบของ Phase 2 เป็นหลัก หากยังไม่เคยส่งคำขอให้ fallback ไปที่สรุปจากโปรเจกต์
    const required = Number(metrics?.requiredApprovedLogs ?? DEFAULT_REQUIRED_LOGS);
    if (!metrics || !Array.isArray(metrics.perStudent)) {
      return { required, approved: 0, satisfied: required === 0 };
    }
    // ✅ ตรวจสอบ meeting logs ของนักศึกษาที่ login อยู่ (ไม่จำเป็นต้องเป็น leader)
    const currentStudentApproved = currentStudentId
      ? (metrics.perStudent.find((item) => Number(item.studentId) === Number(currentStudentId))?.approvedLogs || 0)
      : 0;
    return {
      required,
      approved: currentStudentApproved,
      satisfied: currentStudentApproved >= required
    };
  }, [activeProject?.meetingMetrics, activeProject?.meetingMetricsPhase2, currentStudentId, requestRecord?.meetingMetrics]);

  const statusMeta = useMemo(() => DEFENSE_STATUS_META[requestRecord?.status] || DEFENSE_STATUS_META.default, [requestRecord]);

  const loadRequest = useCallback(async () => {
    if (!activeProject) return;
    setLoadingRequest(true);
    try {
      const res = await projectService.getProject1DefenseRequest(activeProject.projectId, { defenseType: 'THESIS' });
      const record = res?.data || null;
      setRequestRecord(record);
      const defaults = payloadToForm(activeProject, record?.formPayload || null);
      form.setFieldsValue(defaults);
    } catch (error) {
      message.error(error.message || 'โหลดข้อมูลคำขอสอบไม่สำเร็จ');
    } finally {
      setLoadingRequest(false);
    }
  }, [activeProject, form, payloadToForm]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  // ✅ ทุกคนในทีมสามารถส่งคำร้องได้ (ไม่ต้องเป็น leader)
  const isSubmissionDisabled = useMemo(() => {
    return !meetingRequirement.satisfied || !systemTestReady;
  }, [meetingRequirement.satisfied, systemTestReady]);

  const formatDateTime = useCallback((value) => {
    if (!value) return '-';
    const dt = dayjs(value);
    if (!dt.isValid()) return '-';
    return dt.format('DD/MM/BBBB HH:mm น.');
  }, []);

  const formatDateOnly = useCallback((value) => {
    if (!value) return '-';
    const dt = dayjs(value);
    if (!dt.isValid()) return '-';
    return dt.format('DD/MM/BBBB');
  }, []);

  const timelineItems = useMemo(() => {
    if (!requestRecord) return [];
    const items = [];
    if (requestRecord.submittedAt) {
      items.push({ key: 'submitted', label: 'ส่งคำขอ', timestamp: requestRecord.submittedAt, color: 'blue' });
    }
    if (requestRecord.advisorApprovedAt) {
      items.push({ key: 'advisorApproved', label: 'อาจารย์อนุมัติครบ', timestamp: requestRecord.advisorApprovedAt, color: 'green' });
    }
    if (requestRecord.staffVerifiedAt) {
      items.push({ key: 'staffVerified', label: 'เจ้าหน้าที่ตรวจสอบแล้ว', timestamp: requestRecord.staffVerifiedAt, color: 'green' });
    }
    if (requestRecord.defenseScheduledAt) {
      items.push({ key: 'scheduled', label: 'กำหนดวันสอบ', timestamp: requestRecord.defenseScheduledAt, color: 'cyan', extra: requestRecord.defenseLocation || undefined });
    }
    if (requestRecord.updatedAt && !items.length) {
      items.push({ key: 'updated', label: 'อัปเดตล่าสุด', timestamp: requestRecord.updatedAt, color: 'blue' });
    }
    return items.map((item) => ({
      color: item.color,
      children: (
        <Space direction="vertical" size={0} key={item.key}>
          <Text strong>{item.label}</Text>
          <Text type="secondary">{formatDateTime(item.timestamp)}</Text>
          {item.extra && <Text type="secondary">{item.extra}</Text>}
        </Space>
      )
    }));
  }, [formatDateTime, requestRecord]);

  const advisorApprovals = useMemo(
    () => (Array.isArray(requestRecord?.advisorApprovals) ? requestRecord.advisorApprovals : []),
    [requestRecord]
  );

  const handleSubmit = async (values) => {
    if (!activeProject) return;
    try {
      setSaving(true);
      const requestDate = dayjs().format('YYYY-MM-DD');
      const payload = {
        requestDate,
        students: (values.students || []).map((student) => ({
          studentId: student.studentId,
          phone: student.phone?.trim() || '',
          email: student.email?.trim() || ''
        }))
      };

      const res = await projectService.submitProject1DefenseRequest(
        activeProject.projectId,
        payload,
        { defenseType: 'THESIS' }
      );

      if (!res.success) {
        message.error(res.message || 'บันทึกคำขอสอบไม่สำเร็จ');
        return;
      }

      message.success('บันทึกคำขอสอบโครงงานพิเศษ 2 สำเร็จ');
      setRequestRecord(res.data);
      const refreshedDefaults = payloadToForm(activeProject, res.data?.formPayload || payload);
      form.setFieldsValue(refreshedDefaults);
      await loadProjects();
    } catch (error) {
      message.error(error.message || 'บันทึกคำขอสอบไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (!activeProject) {
    return <Alert type="info" message="ยังไม่มีโครงงานสำหรับผู้ใช้งานคนนี้" showIcon />;
  }

  const statusDescription = (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Space size="small" wrap>
        <Text strong>สถานะปัจจุบัน:</Text>
        <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
        {requestRecord?.submittedLate && (
          <Tag color="warning">ส่งช้า</Tag>
        )}
      </Space>
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="ส่งคำขอเมื่อ">{formatDateTime(requestRecord?.submittedAt)}</Descriptions.Item>
        <Descriptions.Item label="อาจารย์อนุมัติครบ">{formatDateTime(requestRecord?.advisorApprovedAt)}</Descriptions.Item>
        <Descriptions.Item label="เจ้าหน้าที่ตรวจสอบ">{formatDateTime(requestRecord?.staffVerifiedAt)}</Descriptions.Item>
        <Descriptions.Item label="ผู้ตรวจสอบ">{requestRecord?.staffVerifiedBy?.fullName || '-'}</Descriptions.Item>
        <Descriptions.Item label="หมายเหตุเจ้าหน้าที่">{requestRecord?.staffVerificationNote || '-'}</Descriptions.Item>
        <Descriptions.Item label="วันสอบที่นัดหมาย">
          {requestRecord?.defenseScheduledAt
            ? formatDateTime(requestRecord.defenseScheduledAt)
            : 'ติดตามประกาศจากเจ้าหน้าที่ภายนอก'}
        </Descriptions.Item>
      </Descriptions>
      {advisorApprovals.length > 0 && (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Divider orientation="left" orientationMargin={0} style={{ margin: '12px 0 8px' }}>สถานะอาจารย์ที่ปรึกษา</Divider>
          {advisorApprovals.map((approval) => {
            const meta = ADVISOR_STATUS_META[approval.status] || ADVISOR_STATUS_META.pending;
            const teacherName = approval.teacher?.name || '-';
            return (
              <Space key={approval.approvalId || `${approval.teacherId}-${approval.status}`} size="small" wrap>
                <Tag color={meta.color}>{meta.label}</Tag>
                <Text>{teacherName}</Text>
                <Text type="secondary">{formatDateTime(approval.approvedAt)}</Text>
                {approval.note && <Text type="secondary">หมายเหตุ: {approval.note}</Text>}
              </Space>
            );
          })}
        </Space>
      )}
      {timelineItems.length > 0 && (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Divider orientation="left" orientationMargin={0} style={{ margin: '12px 0 8px' }}>เส้นทางสถานะคำขอ</Divider>
          <Timeline items={timelineItems} style={{ marginTop: 4 }} />
        </Space>
      )}
    </Space>
  );

  const hasSubmitted = !!requestRecord;

  return (
    <div style={containerStyle}>
      <Card
        title={<Title level={4} style={{ margin: 0 }}>คำขอสอบโครงงานพิเศษ 2 (คพ.03)</Title>}
        extra={(
          <Button icon={<ArrowLeftOutlined />} onClick={handleBackToPhase1}>
            ย้อนกลับ
          </Button>
        )}
      >
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          แบบฟอร์มนี้ใช้ยื่นคำขอสอบปริญญานิพนธ์ (โครงงานพิเศษ 2) หลังจากครบเงื่อนไขการทดสอบระบบและการพบอาจารย์ตามเกณฑ์
        </Paragraph>
        {hasSubmitted ? (
          <Alert
            type={statusMeta.alert || 'info'}
            showIcon
            style={{ marginBottom: 16 }}
            message="มีการส่งคำขอสอบแล้ว"
            description={statusDescription}
          />
        ) : (
          <>
            {!meetingRequirement.satisfied && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message={`ต้องมีบันทึกการพบอาจารย์ที่ได้รับอนุมัติอย่างน้อย ${meetingRequirement.required} ครั้งก่อนยื่นคำขอสอบ`}
              />
            )}

            {!systemTestReady && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="ยังไม่ครบเงื่อนไขคำขอทดสอบระบบ 30 วัน"
                description="กรุณาตรวจสอบให้คำขอทดสอบระบบได้รับการอนุมัติจากเจ้าหน้าที่ ครบกำหนดอย่างน้อย 30 วัน และอัปโหลดหลักฐานการประเมินเรียบร้อย"
              />
            )}

            <Descriptions bordered size="small" column={1} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="ชื่อโครงงานพิเศษภาษาไทย">{activeProject.projectNameTh || '-'}</Descriptions.Item>
              <Descriptions.Item label="ชื่อโครงงานพิเศษภาษาอังกฤษ">{activeProject.projectNameEn || '-'}</Descriptions.Item>
              <Descriptions.Item label="อาจารย์ที่ปรึกษา">{advisorDisplayName || '-'}</Descriptions.Item>
            </Descriptions>

            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Alert
                  type={meetingRequirement.satisfied ? 'success' : 'warning'}
                  showIcon
                  message={`บันทึกการพบอาจารย์: ${meetingRequirement.approved}/${meetingRequirement.required}`}
                />
              </Col>
              <Col span={24}>
                <Alert
                  type={systemTestReady ? 'success' : 'warning'}
                  showIcon
                  message={systemTestReady ? 'ระบบทดสอบพร้อมแล้ว' : 'ระบบทดสอบยังไม่พร้อม'}
                  description={systemTestSnapshot ? (
                    <Space direction="vertical" size={0}>
                      <Text>สถานะ: {systemTestSnapshot.status === 'staff_approved' ? 'อนุมัติแล้ว' : 
                                  systemTestSnapshot.status === 'pending' ? 'รอการอนุมัติ' : 
                                  systemTestSnapshot.status === 'rejected' ? 'ไม่อนุมัติ' : 
                                  systemTestSnapshot.status}</Text>
                      <Text>ครบกำหนด 30 วัน: {formatDateOnly(systemTestSnapshot.testDueDate)}</Text>
                      <Text>อัปโหลดหลักฐาน: {systemTestSnapshot.evidenceSubmittedAt ? formatDateTime(systemTestSnapshot.evidenceSubmittedAt) : 'ยังไม่อัปโหลด'}</Text>
                    </Space>
                  ) : 'ยังไม่ยื่นคำขอทดสอบระบบ'}
                />
              </Col>
            </Row>

            <Spin spinning={loadingRequest}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                disabled={!isLeader || loadingRequest || saving}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="วันที่ยื่นคำขอ" name="requestDate">
                      <DatePicker format="DD/MM/BBBB" style={{ width: '100%' }} allowClear={false} disabled />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider orientation="left">ข้อมูลการติดต่อสมาชิก</Divider>
                <Form.List name="students">
                  {(fields) => (
                    <Row gutter={[16, 8]}>
                      {fields.map(({ key, name, ...restField }) => {
                        const student = form.getFieldValue(['students', name]) || {};
                        return (
                          <Col xs={24} md={12} key={key}>
                            <Card size="small" bordered>
                              <Text strong>{student?.name} ({student?.studentCode})</Text>
                              <Form.Item {...restField} name={[name, 'phone']} label="เบอร์ติดต่อ" style={{ marginTop: 12 }}>
                                <Input placeholder="08x-xxx-xxxx" />
                              </Form.Item>
                              <Form.Item {...restField} name={[name, 'email']} label="อีเมล (ถ้ามี)" style={{ marginBottom: 0 }}>
                                <Input placeholder="student@example.com" />
                              </Form.Item>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  )}
                </Form.List>

                <Form.Item style={{ marginTop: 16 }}>
                  <Button type="primary" htmlType="submit" loading={saving} disabled={isSubmissionDisabled}>
                    บันทึกคำขอสอบโครงงานพิเศษ 2
                  </Button>
                </Form.Item>
              </Form>
            </Spin>
          </>
        )}
      </Card>
    </div>
  );
};

export default ThesisDefenseRequestPage;
