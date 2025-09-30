import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Descriptions, Divider, Form, Input, Row, Space, Spin, Typography, message } from 'antd';
import dayjs from 'dayjs';
import useStudentProject from '../../../../hooks/useStudentProject';
import projectService from '../../../../services/projectService';

const { Title, Text, Paragraph } = Typography;

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
    requestDate: values.requestDate ? dayjs(values.requestDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
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
  const formLocked = requestRecord?.status === 'scheduled' || requestRecord?.status === 'completed';
  const scheduledMoment = requestRecord?.defenseScheduledAt ? dayjs(requestRecord.defenseScheduledAt) : null;

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

  if (!activeProject) {
    return <Alert type="info" message="ยังไม่มีโครงงานสำหรับผู้ใช้งานคนนี้" showIcon />;
  }

  const disabledSubmission = !isLeader || ['completed', 'archived', 'failed'].includes(activeProject.status) || !meetingRequirement.satisfied;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', paddingBottom: 32 }}>
      <Card title={<Title level={4} style={{ margin: 0 }}>คำขอสอบโครงงานพิเศษ 1 (คพ.02)</Title>}>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          ฟอร์มนี้บันทึกข้อมูลจากแบบฟอร์มคพ.02 เพื่อแจ้งความพร้อมสอบโครงงานพิเศษ 1 — ข้อมูลที่กรอกจะถูกเก็บในระบบและใช้ติดตามสถานะขั้นตอนถัดไป
        </Paragraph>

        {disabledSubmission && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="เฉพาะหัวหน้าโครงงานที่อยู่ในสถานะ in_progress เท่านั้นที่สามารถยื่นคำขอนี้ได้"
          />
        )}

        {requestRecord && (
          <Alert
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
            message="มีการส่งคำขอสอบแล้ว"
            description={
              <div>
                <div>บันทึกล่าสุด: {dayjs(requestRecord.submittedAt).format('DD/MM/YYYY HH:mm')}</div>
                <div>สถานะ: {requestRecord.status}</div>
                {scheduledMoment && (
                  <div style={{ marginTop: 8 }}>
                    <div>วันสอบที่นัดหมาย: {scheduledMoment.format('DD/MM/YYYY HH:mm')}</div>
                    <div>สถานที่สอบ: {requestRecord.defenseLocation || '-'}</div>
                    {requestRecord.defenseNote && (
                      <div>หมายเหตุจากเจ้าหน้าที่: {requestRecord.defenseNote}</div>
                    )}
                  </div>
                )}
                {formLocked && (
                  <div style={{ marginTop: 8 }}>แบบฟอร์มถูกล็อกเนื่องจากนัดสอบแล้ว หากต้องแก้ไข โปรดติดต่อเจ้าหน้าที่ภาควิชา</div>
                )}
              </div>
            }
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
                  <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
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
      </Card>
    </Space>
  );
};

export default ExamSubmitPage;
