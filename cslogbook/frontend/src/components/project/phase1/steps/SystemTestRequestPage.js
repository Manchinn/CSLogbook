import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  Modal,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
  Upload,
  message
} from 'antd';
import { CloudUploadOutlined, EyeOutlined, FilePdfOutlined, InboxOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from '../../../../utils/dayjs';
import { useNavigate } from 'react-router-dom';
import useStudentProject from '../../../../hooks/useStudentProject';
import projectService from '../../../../services/projectService';
import { PDFViewerModal } from '../../../common/PDFViewer';

const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;

const STATUS_META = {
  pending_advisor: { label: 'รออาจารย์ที่ปรึกษาอนุมัติ', color: 'orange', alert: 'info' },
  advisor_rejected: { label: 'อาจารย์ไม่อนุมัติ', color: 'red', alert: 'warning' },
  pending_staff: { label: 'รอเจ้าหน้าที่ภาควิชาตรวจสอบ', color: 'processing', alert: 'info' },
  staff_rejected: { label: 'เจ้าหน้าที่ส่งกลับ', color: 'red', alert: 'warning' },
  staff_approved: { label: 'เจ้าหน้าที่อนุมัติแล้ว', color: 'green', alert: 'success' },
  default: { label: 'ยังไม่เคยส่งคำขอ', color: 'default', alert: 'info' }
};

const normFile = (e) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList || [];
};

const SystemTestRequestPage = () => {
  const navigate = useNavigate();
  const { activeProject, loadProjects, currentStudentId } = useStudentProject({ autoLoad: true });
  const [form] = Form.useForm();
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestRecord, setRequestRecord] = useState(null);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [evidenceFileList, setEvidenceFileList] = useState([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerTitle, setViewerTitle] = useState('');
  const containerStyle = useMemo(() => ({
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24
  }), []);

  const handleBackToPhase1 = useCallback(() => {
    navigate('/project/phase1');
  }, [navigate]);

  const meetingRequirement = useMemo(() => {
    const metrics = activeProject?.meetingMetrics;
    if (!metrics) {
      return { required: 0, approved: 0, satisfied: true };
    }
    const required = Number(metrics.requiredApprovedLogs) || 0;
    const perStudent = Array.isArray(metrics.perStudent) ? metrics.perStudent : [];
    // ✅ ตรวจสอบ meeting logs ของนักศึกษาที่ login อยู่ (ไม่จำเป็นต้องเป็น leader)
    const currentStudentApproved = currentStudentId
      ? Number(perStudent.find(item => Number(item.studentId) === Number(currentStudentId))?.approvedLogs || 0)
      : 0;
    return {
      required,
      approved: currentStudentApproved,
      satisfied: required === 0 || currentStudentApproved >= required
    };
  }, [activeProject?.meetingMetrics, currentStudentId]);

  const statusMeta = STATUS_META[requestRecord?.status] || STATUS_META.default;

  const dueDate = useMemo(() => {
    if (!requestRecord?.testDueDate) return null;
    const parsed = dayjs(requestRecord.testDueDate).tz('Asia/Bangkok');
    return parsed.isValid() ? parsed : null;
  }, [requestRecord?.testDueDate]);

  const canUploadEvidence = useMemo(() => {
    if (!requestRecord || requestRecord.status !== 'staff_approved') return false;
    if (requestRecord.evidence) return false;
    return true;
  }, [requestRecord]);

  const isBeforeDueDate = useMemo(() => {
    if (!dueDate) return false;
    return dayjs().tz('Asia/Bangkok').isBefore(dueDate, 'day');
  }, [dueDate]);

  const isOnOrBeforeDueDate = useMemo(() => {
    if (!dueDate) return false;
    return !dayjs().tz('Asia/Bangkok').isAfter(dueDate, 'day');
  }, [dueDate]);

  const evidenceStatusText = useMemo(() => {
    if (requestRecord?.evidence) {
      return '';
    }
    if (requestRecord?.status !== 'staff_approved') {
      return 'ยังไม่มีหลักฐาน';
    }
    if (isBeforeDueDate) {
      return 'ระบบเปิดให้อัปโหลดได้ (ก่อนครบกำหนด)';
    }
    if (isOnOrBeforeDueDate) {
      return 'ครบกำหนดวันนี้ สามารถอัปโหลดได้';
    }
    return 'ครบกำหนด สามารถอัปโหลดได้';
  }, [isBeforeDueDate, isOnOrBeforeDueDate, requestRecord]);

  const allowNewRequest = useMemo(() => {
    if (!requestRecord) {
      return true;
    }
    // อนุญาตให้ส่งคำขอใหม่เฉพาะกรณีที่ถูกปฏิเสธแล้วเท่านั้น
    return ['advisor_rejected', 'staff_rejected'].includes(requestRecord.status);
  }, [requestRecord]);

  const loadRequest = async () => {
    if (!activeProject) return;
    setLoadingRequest(true);
    try {
      const res = await projectService.getSystemTestRequest(activeProject.projectId);
      setRequestRecord(res?.data || null);
    } catch (error) {
      message.error(error.message || 'โหลดข้อมูลคำขอทดสอบระบบไม่สำเร็จ');
    } finally {
      setLoadingRequest(false);
    }
  };

  useEffect(() => {
    loadRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.projectId]);

  useEffect(() => {
    if (!requestRecord) {
      form.resetFields();
      return;
    }
    const start = requestRecord.testStartDate ? dayjs(requestRecord.testStartDate) : null;
    const due = requestRecord.testDueDate ? dayjs(requestRecord.testDueDate) : null;
    form.setFieldsValue({
      testPeriod: start && due ? [start, due] : undefined,
      studentNote: requestRecord.studentNote || ''
    });
  }, [requestRecord, form]);

  const handleSubmit = async (values) => {
    if (!activeProject) return;
    try {
      setSaving(true);
      const fileList = values.requestFile || [];
      const file = fileList[0]?.originFileObj;
      const [rangeStart, rangeEnd] = Array.isArray(values.testPeriod) ? values.testPeriod : [];
      if (!rangeStart || !rangeEnd) {
        message.error('กรุณาเลือกช่วงเวลาทดสอบระบบให้ครบ');
        return;
      }
      const startDay = dayjs(rangeStart);
      const endDay = dayjs(rangeEnd);
      if (!startDay.isValid() || !endDay.isValid()) {
        message.error('รูปแบบวันที่ไม่ถูกต้อง');
        return;
      }
      if (endDay.diff(startDay, 'day') < 29) {
        message.error('ช่วงเวลาทดสอบระบบต้องไม่น้อยกว่า 30 วัน');
        return;
      }
      const payload = {
        testPeriodStart: startDay.format('YYYY-MM-DD'),
        testPeriodEnd: endDay.format('YYYY-MM-DD'),
        testStartDate: startDay.format('YYYY-MM-DD'),
        testDueDate: endDay.format('YYYY-MM-DD'),
        studentNote: values.studentNote?.trim() || '',
      };
      if (file) {
        payload.requestFile = file;
      }
      const res = await projectService.submitSystemTestRequest(activeProject.projectId, payload);
      if (!res.success) {
        message.error(res.message || 'ส่งคำขอไม่สำเร็จ');
        return;
      }
      message.success('ส่งคำขอทดสอบระบบสำเร็จ');
      setRequestRecord(res.data);
      form.resetFields();
      await loadProjects();
    } catch (error) {
      message.error(error.message || 'ส่งคำขอไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadEvidence = async () => {
    if (!activeProject) return;
    const file = evidenceFileList[0]?.originFileObj;
    if (!file) {
      message.error('กรุณาเลือกไฟล์หลักฐานการประเมิน');
      return;
    }
    try {
      setUploadingEvidence(true);
      const res = await projectService.uploadSystemTestEvidence(activeProject.projectId, file);
      if (!res.success) {
        message.error(res.message || 'อัปโหลดหลักฐานไม่สำเร็จ');
        return;
      }
      message.success('อัปโหลดหลักฐานการประเมินสำเร็จ');
      setRequestRecord(res.data);
      setEvidenceFileList([]);
      setEvidenceModalOpen(false);
    } catch (error) {
      message.error(error.message || 'อัปโหลดหลักฐานไม่สำเร็จ');
    } finally {
      setUploadingEvidence(false);
    }
  };

  const disabledSubmission = !allowNewRequest;

  const formatThaiDate = useCallback((value) => {
    if (!value) return '-';
    const dt = dayjs(value).tz('Asia/Bangkok');
    if (!dt.isValid()) return '-';
    return dt.locale('th').format('D MMMM BBBB');
  }, []);

  const formatThaiDateTime = useCallback((value) => {
    if (!value) return '-';
    const dt = dayjs(value).tz('Asia/Bangkok');
    if (!dt.isValid()) return '-';
    return dt.locale('th').format('D MMMM BBBB เวลา HH:mm น.');
  }, []);

  const handlePreviewFile = useCallback((file, fallbackTitle) => {
    if (!file?.url) {
      message.warning('ไม่พบไฟล์สำหรับแสดงตัวอย่าง');
      return;
    }
    setViewerUrl(file.url);
    setViewerTitle(file.name || fallbackTitle || 'เอกสาร PDF');
    setViewerVisible(true);
  }, []);

  const handlePreviewEvidence = useCallback(() => {
    handlePreviewFile(requestRecord?.evidence, 'หลักฐานการประเมิน');
  }, [handlePreviewFile, requestRecord?.evidence]);

  const handleCloseViewer = useCallback(() => {
    setViewerVisible(false);
    setViewerUrl(null);
    setViewerTitle('');
  }, []);

  const timelineItems = useMemo(() => {
    if (!requestRecord) return [];
    const entries = [];
    if (requestRecord.timeline?.submittedAt) {
      entries.push({ key: 'submitted', label: 'ส่งคำขอ', at: requestRecord.timeline.submittedAt, color: 'blue' });
    }
    if (requestRecord.timeline?.advisorDecidedAt) {
      entries.push({ 
        key: 'advisor', 
        label: requestRecord.advisorDecision?.name 
          ? `อาจารย์ที่ปรึกษาหลักพิจารณา (${requestRecord.advisorDecision.name})` 
          : 'อาจารย์ที่ปรึกษาหลักพิจารณา', 
        at: requestRecord.timeline.advisorDecidedAt, 
        color: 'cyan' 
      });
    }
    if (requestRecord.timeline?.coAdvisorDecidedAt) {
      entries.push({ 
        key: 'coAdvisor', 
        label: requestRecord.coAdvisorDecision?.name 
          ? `อาจารย์ที่ปรึกษาร่วมพิจารณา (${requestRecord.coAdvisorDecision.name})` 
          : 'อาจารย์ที่ปรึกษาร่วมพิจารณา', 
        at: requestRecord.timeline.coAdvisorDecidedAt, 
        color: 'cyan' 
      });
    }
    if (requestRecord.timeline?.staffDecidedAt) {
      entries.push({ key: 'staff', label: 'เจ้าหน้าที่อนุมัติ', at: requestRecord.timeline.staffDecidedAt, color: 'green' });
    }
    if (requestRecord.timeline?.evidenceSubmittedAt) {
      entries.push({ key: 'evidence', label: 'อัปโหลดหลักฐาน', at: requestRecord.timeline.evidenceSubmittedAt, color: 'green' });
    }
    return entries.map(item => ({
      color: item.color,
      children: (
        <Space key={item.key} direction="vertical" size={0}>
          <Text strong>{item.label}</Text>
          <Text type="secondary">{formatThaiDateTime(item.at)}</Text>
        </Space>
      )
    }));
  }, [requestRecord, formatThaiDateTime]);

  if (!activeProject) {
    return (
      <Alert type="info" showIcon message="ยังไม่มีโครงงานสำหรับผู้ใช้งานคนนี้" />
    );
  }

  return (
    <>
      <div style={containerStyle}>
        <Card
          title={<Title level={4} style={{ margin: 0 }}>คำขอทดสอบระบบและหลักฐานการประเมิน</Title>}
          extra={(
            <Button icon={<ArrowLeftOutlined />} onClick={handleBackToPhase1}>
              ย้อนกลับ
            </Button>
          )}
        >
          {requestRecord && (
            <Alert
              type={statusMeta.alert}
              showIcon
              style={{ marginBottom: 16 }}
              message="สถานะคำขอปัจจุบัน"
              description={(
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space size="small" wrap>
                    <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
                    {requestRecord.submittedLate && (
                      <Tag color="warning">ส่งช้า</Tag>
                    )}
                    <Text type="secondary">อัปเดตล่าสุด: {formatThaiDateTime(requestRecord.updatedAt || requestRecord.timeline?.staffDecidedAt || requestRecord.timeline?.submittedAt)}</Text>
                  </Space>
                  <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label="วันที่เริ่มทดสอบ">{formatThaiDate(requestRecord.testStartDate)}</Descriptions.Item>
                    <Descriptions.Item label="ครบกำหนด 30 วัน">{formatThaiDate(dueDate)}</Descriptions.Item>
                    <Descriptions.Item label="ไฟล์คำขอ">
                      {requestRecord.requestFile?.url ? (
                        <Button
                          type="link"
                          icon={<EyeOutlined />}
                          onClick={() => handlePreviewFile(
                            requestRecord.requestFile,
                            `คำขอทดสอบระบบ - ${requestRecord.requestFile.name || 'ไฟล์ PDF'}`
                          )}
                        >
                          เปิดดูไฟล์คำขอ
                        </Button>
                      ) : '-'
                      }
                    </Descriptions.Item>
                    <Descriptions.Item label="หมายเหตุที่นักศึกษาบันทึก">{requestRecord.studentNote || '-'}</Descriptions.Item>
                    <Descriptions.Item label="ผลการพิจารณาอาจารย์ที่ปรึกษาหลัก">
                      {requestRecord.advisorDecision?.name ? (
                        <Space direction="vertical" size="small">
                          <Text strong>{requestRecord.advisorDecision.name}</Text>
                          <Text type="secondary">{requestRecord.advisorDecision.note || '-'}</Text>
                          {requestRecord.advisorDecision.decidedAt && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {formatThaiDateTime(requestRecord.advisorDecision.decidedAt)}
                            </Text>
                          )}
                        </Space>
                      ) : '-'}
                    </Descriptions.Item>
                    {requestRecord.coAdvisorDecision?.teacherId && (
                      <Descriptions.Item label="ผลการพิจารณาอาจารย์ที่ปรึกษาร่วม">
                        {requestRecord.coAdvisorDecision?.name ? (
                          <Space direction="vertical" size="small">
                            <Text strong>{requestRecord.coAdvisorDecision.name}</Text>
                            <Text type="secondary">{requestRecord.coAdvisorDecision.note || '-'}</Text>
                            {requestRecord.coAdvisorDecision.decidedAt && (
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {formatThaiDateTime(requestRecord.coAdvisorDecision.decidedAt)}
                              </Text>
                            )}
                          </Space>
                        ) : 'รอการพิจารณา'}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="ผลการพิจารณาเจ้าหน้าที่">{requestRecord.staffDecision?.note || '-'}</Descriptions.Item>
                    <Descriptions.Item label="หลักฐานการประเมิน">
                      {requestRecord.evidence ? (
                        <Button
                          type="link"
                          icon={<EyeOutlined />}
                          onClick={handlePreviewEvidence}
                        >
                          เปิดดูหลักฐาน
                        </Button>
                      ) : evidenceStatusText}
                    </Descriptions.Item>
                  </Descriptions>
                  {timelineItems.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Divider orientation="left" orientationMargin={0}>ไทม์ไลน์คำขอ</Divider>
                      <Timeline items={timelineItems} style={{ marginTop: 8 }} />
                    </div>
                  )}
                  {canUploadEvidence && (
                    <Button type="primary" icon={<CloudUploadOutlined />} onClick={() => setEvidenceModalOpen(true)}>
                      อัปโหลดหลักฐานการประเมิน 30 วัน
                    </Button>
                  )}
                  {canUploadEvidence && isBeforeDueDate && (
                    <Alert
                      type="warning"
                      showIcon
                      message="อัปโหลดล่วงหน้าก่อนครบ 30 วัน"
                      description="ระบบอนุญาตให้อัปโหลดหลักฐานได้ก่อนครบกำหนด กรุณาตรวจสอบให้แน่ใจว่าการประเมินเสร็จสมบูรณ์แล้ว"
                    />
                  )}
                </Space>
              )}
            />
          )}

          {allowNewRequest && (
            <>
              <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                ขั้นตอนนี้ใช้สำหรับแจ้งความประสงค์ทดลองใช้งานระบบจริงกับสถานประกอบการเป็นเวลา 30 วัน และบันทึกหลักฐานการประเมินหลังเสร็จสิ้น
              </Paragraph>
              <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 16 }}>
                หากยังไม่มีไฟล์คำขอ (PDF) สามารถส่งคำขอได้เลยและแนบไฟล์ภายหลังได้
              </Paragraph>

              {!meetingRequirement.satisfied && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message={`บันทึกการพบอาจารย์ที่ได้รับอนุมัติ ${meetingRequirement.approved}/${meetingRequirement.required}`}
                  description="ต้องมีบันทึกการพบอาจารย์ที่ได้รับการอนุมัติครบตามเกณฑ์ก่อนจึงจะส่งคำขอได้"
                />
              )}

              <Spin spinning={loadingRequest}>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  disabled={!meetingRequirement.satisfied || disabledSubmission || loadingRequest}
                >
                  <Form.Item
                    label="ช่วงเวลาทดสอบระบบ 30 วัน"
                    name="testPeriod"
                    rules={[
                      { required: true, message: 'กรุณาเลือกช่วงเวลาทดสอบระบบ' },
                      () => ({
                        validator(_, value) {
                          if (!value || value.length !== 2) {
                            return Promise.reject(new Error('กรุณาเลือกช่วงเวลาทดสอบระบบ'));
                          }
                          const [start, end] = value;
                          const startDay = dayjs(start);
                          const endDay = dayjs(end);
                          if (!startDay.isValid() || !endDay.isValid()) {
                            return Promise.reject(new Error('รูปแบบวันที่ไม่ถูกต้อง'));
                          }
                          if (endDay.diff(startDay, 'day') < 29) {
                            return Promise.reject(new Error('ช่วงเวลาทดสอบระบบต้องไม่น้อยกว่า 30 วัน'));
                          }
                          if (startDay.isAfter(dayjs().add(30, 'day'), 'day')) {
                            return Promise.reject(new Error('วันเริ่มต้องอยู่ภายใน 30 วันนับจากวันนี้'));
                          }
                          return Promise.resolve();
                        }
                      })
                    ]}
                  >
                    <RangePicker format="DD/MM/BBBB" style={{ width: '100%' }} allowClear={false} />
                  </Form.Item>

                  <Form.Item label="รายละเอียดเพิ่มเติม" name="studentNote">
                    <Input.TextArea rows={3} placeholder="ระบุข้อมูลสรุปเพิ่มเติม (ถ้ามี)" maxLength={1000} showCount />
                  </Form.Item>

                  <Form.Item
                    label="ไฟล์คำขอทดสอบระบบ (PDF) – ไม่บังคับ"
                    name="requestFile"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                  >
                    <Upload.Dragger
                      name="requestFile"
                      accept=".pdf"
                      beforeUpload={() => false}
                      maxCount={1}
                    >
                      <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                      <p className="ant-upload-text">ลากไฟล์ PDF มาวาง หรือคลิกเพื่อเลือกไฟล์ (แนบหรือไม่ก็ได้)</p>
                      <p className="ant-upload-hint">ขนาดไฟล์ไม่เกิน 10MB</p>
                    </Upload.Dragger>
                  </Form.Item>

                  <Space>
                    <Button type="primary" htmlType="submit" loading={saving} disabled={!meetingRequirement.satisfied}>
                      ส่งคำขอทดสอบระบบ
                    </Button>
                    {disabledSubmission && (
                      <Text type="secondary">ไม่สามารถส่งคำขอใหม่ได้จนกว่าคำขอปัจจุบันจะเสร็จสิ้น</Text>
                    )}
                  </Space>
                </Form>
              </Spin>
            </>
          )}
        </Card>
      </div>

      <Modal
        title="อัปโหลดหลักฐานการประเมินการทดสอบระบบ"
        open={evidenceModalOpen}
        onCancel={() => {
          if (!uploadingEvidence) {
            setEvidenceModalOpen(false);
            setEvidenceFileList([]);
          }
        }}
        onOk={handleUploadEvidence}
        okText="อัปโหลด"
        confirmLoading={uploadingEvidence}
      >
        <Upload
          fileList={evidenceFileList}
          onRemove={() => setEvidenceFileList([])}
          beforeUpload={(file) => {
            if (file.type !== 'application/pdf') {
              message.error('รองรับเฉพาะไฟล์ PDF เท่านั้น');
              return Upload.LIST_IGNORE;
            }
            if (file.size > 10 * 1024 * 1024) {
              message.error('ขนาดไฟล์ต้องไม่เกิน 10MB');
              return Upload.LIST_IGNORE;
            }
            setEvidenceFileList([{ ...file, originFileObj: file }]);
            return false;
          }}
          accept=".pdf"
          maxCount={1}
        >
          <Button icon={<FilePdfOutlined />}>เลือกไฟล์ PDF</Button>
        </Upload>
        <Paragraph type="secondary" style={{ marginTop: 12 }}>
          กรุณาอัปโหลดไฟล์ประเมินที่ได้รับจากสถานประกอบการหลังครบ 30 วัน
        </Paragraph>
      </Modal>
      {viewerVisible && (
        <PDFViewerModal
          visible={viewerVisible}
          pdfUrl={viewerUrl}
          onClose={handleCloseViewer}
          title={viewerTitle || 'หลักฐานการประเมิน'}
        />
      )}
    </>
  );
};

export default SystemTestRequestPage;
