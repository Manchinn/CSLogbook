import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Descriptions, Divider, Form, Input, Row, Space, Spin, Tag, Timeline, Typography, message } from 'antd';
import dayjs from 'dayjs';
import useStudentProject from '../../../../hooks/useStudentProject';
import projectService from '../../../../services/projectService';

const { Title, Text, Paragraph } = Typography;

const KP02_STATUS_META = {
  submitted: { label: 'ยื่นคำขอแล้ว (รออาจารย์อนุมัติ)', color: 'orange', alert: 'info' },
  advisor_in_review: { label: 'รอการอนุมัติจากอาจารย์ที่ปรึกษา', color: 'orange', alert: 'info' },
  advisor_approved: { label: 'อาจารย์อนุมัติครบแล้ว รอเจ้าหน้าที่ตรวจสอบ', color: 'processing', alert: 'success' },
  staff_verified: { label: 'เจ้าหน้าที่ตรวจสอบแล้ว (ติดตามตารางสอบในปฏิทิน)', color: 'green', alert: 'success' },
  scheduled: { label: 'นัดสอบแล้ว (ข้อมูลระบบเดิม)', color: 'blue', alert: 'success' },
  completed: { label: 'บันทึกผลสอบเรียบร้อย', color: 'geekblue', alert: 'success' },
  cancelled: { label: 'คำขอถูกยกเลิก', color: 'red', alert: 'warning' },
  advisor_rejected: { label: 'อาจารย์ไม่อนุมัติ', color: 'red', alert: 'warning' },
  default: { label: 'ไม่พบสถานะคำขอ', color: 'default', alert: 'info' }
};

const ADVISOR_STATUS_META = {
  pending: { label: 'รอดำเนินการ', color: 'default' },
  approved: { label: 'อนุมัติ', color: 'green' },
  rejected: { label: 'ปฏิเสธ', color: 'red' }
};

const buildStudentInitial = (project, existingPayload) => {
  const snapshot = existingPayload?.students || [];
  return (project?.members || []).map(member => {
    const fallback = snapshot.find(s => Number(s.studentId) === Number(member.studentId)) || {};
    return {
      studentId: member.studentId,
      studentCode: member.studentCode,
      name: member.name || member.studentCode,
      phone: fallback.phone || '',
      email: fallback.email || ''
    };
  });
};

const payloadToForm = (project, payload) => {
  if (!payload) {
    return {
      requestDate: dayjs(),
      advisorName: '',
      coAdvisorName: '',
      additionalNotes: '',
      students: buildStudentInitial(project, null)
    };
  }
  return {
    requestDate: payload.requestDate ? dayjs(payload.requestDate) : dayjs(),
    advisorName: payload.advisorName || '',
    coAdvisorName: payload.coAdvisorName || '',
    additionalNotes: payload.additionalNotes || '',
    students: buildStudentInitial(project, payload)
  };
};

const formToPayload = (project, values) => {
  const students = (values.students || []).map(student => ({
    studentId: student.studentId,
    studentCode: student.studentCode,
    name: student.name,
    phone: student.phone?.trim() || '',
    email: student.email?.trim() || ''
  }));

  return {
    requestDate: dayjs().format('YYYY-MM-DD'),
    advisorName: values.advisorName?.trim() || '',
    coAdvisorName: values.coAdvisorName?.trim() || '',
    additionalNotes: values.additionalNotes?.trim() || '',
    students,
    projectSnapshotOverride: {
      projectCode: project?.projectCode || null,
      projectNameTh: project?.projectNameTh || null,
      projectNameEn: project?.projectNameEn || null
    }
  };
};

const ExamSubmitPage = () => {
  const { activeProject, advisors, advisorLoading, loadProjects, currentStudentId } = useStudentProject({ autoLoad: true });
  const [form] = Form.useForm();
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestRecord, setRequestRecord] = useState(null);
  const formLocked = ['staff_verified', 'scheduled', 'completed'].includes(requestRecord?.status);
  const statusMeta = KP02_STATUS_META[requestRecord?.status] || KP02_STATUS_META.default;

  const currentStudentCode = useMemo(() => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem('studentCode') : null;
    } catch (error) {
      return null;
    }
  }, []);

  const leaderMember = useMemo(() => {
    if (!activeProject) return null;
    return (activeProject.members || []).find(member => member.role === 'leader') || null;
  }, [activeProject]);

  const isLeader = useMemo(() => {
    if (!activeProject || !leaderMember) return false;
    if (currentStudentId) {
      return Number(leaderMember.studentId) === Number(currentStudentId);
    }
    if (currentStudentCode && leaderMember.studentCode) {
      return String(leaderMember.studentCode).trim() === String(currentStudentCode).trim();
    }
    return false;
  }, [activeProject, leaderMember, currentStudentId, currentStudentCode]);

  const meetingRequirement = useMemo(() => {
    const metrics = activeProject?.meetingMetrics;
    if (!metrics) {
      return {
        approved: 0,
        required: 0,
        totalApproved: 0,
        satisfied: true
      };
    }
    const required = Number(metrics.requiredApprovedLogs) || 0;
    const perStudent = Array.isArray(metrics.perStudent) ? metrics.perStudent : [];
    const leaderApproved = leaderMember
      ? (perStudent.find(item => Number(item.studentId) === Number(leaderMember.studentId))?.approvedLogs || 0)
      : 0;
    const totalApproved = Number(metrics.totalApprovedLogs) || leaderApproved;
    return {
      approved: leaderApproved,
      required,
      totalApproved,
      satisfied: required === 0 || leaderApproved >= required
    };
  }, [activeProject, leaderMember]);

  const advisorNameFromList = useMemo(() => {
    if (!activeProject?.advisorId || !Array.isArray(advisors)) return '';
    const found = advisors.find(item => Number(item.teacherId) === Number(activeProject.advisorId));
    if (!found) return '';
    return `${found.firstName || ''} ${found.lastName || ''}`.trim();
  }, [activeProject, advisors]);

  const formatDateTime = useCallback((value) => {
    if (!value) return '-';
    const dt = dayjs(value);
    if (!dt.isValid()) return '-';
    return dt.format('DD/MM/YYYY HH:mm น.');
  }, []);

  useEffect(() => {
    const loadRequest = async () => {
      if (!activeProject) return;
      setLoadingRequest(true);
      try {
        const res = await projectService.getProject1DefenseRequest(activeProject.projectId);
        const payload = res?.data?.formPayload || null;
        setRequestRecord(res?.data || null);
        const defaults = payloadToForm(activeProject, payload);
        if (!payload?.advisorName && advisorNameFromList) {
          defaults.advisorName = advisorNameFromList;
        }
        form.setFieldsValue(defaults);
      } catch (error) {
        message.error(error.message || 'โหลดข้อมูลคำขอสอบไม่สำเร็จ');
      } finally {
        setLoadingRequest(false);
      }
    };
    loadRequest();
  }, [activeProject, form, advisorNameFromList]);

  const handleSubmit = async (values) => {
    if (!activeProject) return;
    try {
      setSaving(true);
      const payload = formToPayload(activeProject, values);
      const res = await projectService.submitProject1DefenseRequest(activeProject.projectId, payload);
      if (!res.success) {
        message.error(res.message || 'บันทึกคำขอสอบไม่สำเร็จ');
        return;
      }
      message.success('บันทึกคำขอสอบโครงงานพิเศษ 1 สำเร็จ');
      setRequestRecord(res.data);
      await loadProjects();
    } catch (error) {
      message.error(error.message || 'บันทึกคำขอสอบไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const advisorApprovals = useMemo(() => Array.isArray(requestRecord?.advisorApprovals) ? requestRecord.advisorApprovals : [], [requestRecord]);

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

  const lastUpdatedAt = useMemo(() => {
    if (!requestRecord) return null;
    return requestRecord.updatedAt || requestRecord.defenseScheduledAt || requestRecord.staffVerifiedAt || requestRecord.advisorApprovedAt || requestRecord.submittedAt || null;
  }, [requestRecord]);

  if (!activeProject) {
    return <Alert type="info" message="ยังไม่มีโครงงานสำหรับผู้ใช้งานคนนี้" showIcon />;
  }

  const disabledSubmission = !isLeader || ['completed', 'archived', 'failed'].includes(activeProject.status) || !meetingRequirement.satisfied;
  const hasSubmitted = !!requestRecord;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', paddingBottom: 32 }}>
      <Card title={<Title level={4} style={{ margin: 0 }}>คำขอสอบโครงงานพิเศษ 1 (คพ.02)</Title>}>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          ฟอร์มนี้บันทึกข้อมูลจากแบบฟอร์มคพ.02 เพื่อแจ้งความพร้อมสอบโครงงานพิเศษ 1 — ข้อมูลที่กรอกจะถูกเก็บในระบบและใช้ติดตามสถานะขั้นตอนถัดไป
        </Paragraph>

        {hasSubmitted ? (
          <Alert
            type={statusMeta.alert || 'info'}
            showIcon
            style={{ marginBottom: 16 }}
            message="มีการส่งคำขอสอบแล้ว"
            description={
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space size="small" wrap>
                  <Text strong>สถานะปัจจุบัน:</Text>
                  <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
                  <Text type="secondary">อัปเดตล่าสุด: {formatDateTime(lastUpdatedAt)}</Text>
                </Space>

                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="ส่งคำขอเมื่อ">{formatDateTime(requestRecord.submittedAt)}</Descriptions.Item>
                  <Descriptions.Item label="อาจารย์อนุมัติครบ">{formatDateTime(requestRecord.advisorApprovedAt)}</Descriptions.Item>
                  <Descriptions.Item label="เจ้าหน้าที่ตรวจสอบ">{formatDateTime(requestRecord.staffVerifiedAt)}</Descriptions.Item>
                  <Descriptions.Item label="ผู้ตรวจสอบ">{requestRecord.staffVerifiedBy?.fullName || '-'}</Descriptions.Item>
                  <Descriptions.Item label="หมายเหตุเจ้าหน้าที่">{requestRecord.staffVerificationNote || '-'}</Descriptions.Item>
                  <Descriptions.Item label="วันสอบที่นัดหมาย">
                    {requestRecord.defenseScheduledAt
                      ? formatDateTime(requestRecord.defenseScheduledAt)
                      : 'ตรวจสอบกำหนดการสอบจากปฏิทินภาควิชา'}
                  </Descriptions.Item>
                  <Descriptions.Item label="สถานที่สอบ">
                    {requestRecord.defenseLocation || 'ประกาศสถานที่สอบจะแสดงผ่านช่องทางภายนอก'}
                  </Descriptions.Item>
                  <Descriptions.Item label="หมายเหตุจากเจ้าหน้าที่">{requestRecord.defenseNote || '-'}</Descriptions.Item>
                </Descriptions>

                <Alert
                  type="info"
                  showIcon
                  message="การนัดสอบแสดงบนปฏิทินภาควิชา"
                  description="หลังเจ้าหน้าที่ตรวจสอบแล้ว กรุณาติดตามวันเวลาและสถานที่สอบจากปฏิทินหรือประกาศที่ภาควิชาส่งให้"
                  style={{ marginTop: 12 }}
                />

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

                {formLocked && (
                  <Text type="secondary" style={{ marginTop: 4 }}>
                    แบบฟอร์มถูกล็อกหลังเจ้าหน้าที่ตรวจสอบคำขอแล้ว หากต้องแก้ไขโปรดติดต่อเจ้าหน้าที่ภาควิชา
                  </Text>
                )}
              </Space>
            }
          />
        ) : (
          <>
            {disabledSubmission && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="เฉพาะหัวหน้าโครงงานที่อยู่ในสถานะ in_progress เท่านั้นที่สามารถยื่นคำขอนี้ได้"
              />
            )}

            <Descriptions bordered size="small" column={1} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="รหัสโครงงาน">{activeProject.projectCode || '-'}</Descriptions.Item>
              <Descriptions.Item label="ชื่อโครงงาน (TH)">{activeProject.projectNameTh || '-'}</Descriptions.Item>
              <Descriptions.Item label="ชื่อโครงงาน (EN)">{activeProject.projectNameEn || '-'}</Descriptions.Item>
              <Descriptions.Item label="สถานะ">{activeProject.status}</Descriptions.Item>
              <Descriptions.Item label="สมาชิก">
                {(activeProject.members || []).map(member => (
                  <div key={member.studentId}>{member.name || member.studentCode} ({member.role})</div>
                ))}
              </Descriptions.Item>
            </Descriptions>

            <Alert
              type={meetingRequirement.satisfied ? 'info' : 'warning'}
              showIcon
              style={{ marginBottom: 16 }}
              message={meetingRequirement.satisfied ? 'ผ่านเกณฑ์การพบอาจารย์แล้ว' : 'ยังไม่ครบเกณฑ์การพบอาจารย์'}
              description={
                <div>
                  <div>บันทึกการพบที่อาจารย์อนุมัติ (หัวหน้าโครงงาน): {meetingRequirement.approved} / {meetingRequirement.required}</div>
                  {meetingRequirement.totalApproved !== meetingRequirement.approved && (
                    <div>รวมทั้งทีม: {meetingRequirement.totalApproved}</div>
                  )}
                  {!meetingRequirement.satisfied && (
                    <div style={{ marginTop: 4 }}>ต้องมีการพบอาจารย์และได้รับอนุมัติอย่างน้อย {meetingRequirement.required} ครั้งก่อนยื่นคำขอสอบ</div>
                  )}
                </div>
              }
            />

            <Spin spinning={loadingRequest}>
              <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={disabledSubmission || loadingRequest || formLocked}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="วันที่ยื่นคำขอ" name="requestDate">
                      <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} allowClear={false} disabled />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider orientation="left">ข้อมูลที่ปรึกษา</Divider>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="อาจารย์ที่ปรึกษา" name="advisorName">
                      <Input placeholder="ชื่อ-นามสกุล" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="อาจารย์ที่ปรึกษาร่วม" name="coAdvisorName">
                      <Input placeholder="(ถ้ามี)" />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider orientation="left">ข้อมูลสมาชิก (ช่องติดต่อ)
                  {advisorLoading && <Text style={{ marginLeft: 8 }} type="secondary">(กำลังโหลดรายชื่ออาจารย์)</Text>}
                </Divider>
                <Form.List name="students">
                  {(fields) => (
                    <Row gutter={[16, 8]}>
                      {fields.map(field => {
                        const { key, name, ...restField } = field;
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
                <Form.Item label="หมายเหตุเพิ่มเติม" name="additionalNotes">
                  <Input.TextArea rows={4} placeholder="หากมีข้อมูลอื่น ๆ จากฟอร์มคพ.02 ให้บันทึกในส่วนนี้" />
                </Form.Item>

                <Space>
                  <Button type="primary" htmlType="submit" loading={saving} disabled={disabledSubmission || formLocked}>
                    บันทึกคำขอสอบ
                  </Button>
                  <Text type="secondary">ระบบจะบันทึกข้อมูลไว้ในสถานะ "submitted" และสามารถแก้ไขได้จนกว่าจะเข้าสู่กระบวนการสอบ</Text>
                </Space>
              </Form>
            </Spin>
          </>
        )}
      </Card>
    </Space>
  );
};

export default ExamSubmitPage;
