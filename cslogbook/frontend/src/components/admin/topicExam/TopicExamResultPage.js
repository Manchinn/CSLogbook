// admin/topicExam/TopicExamResultPage.js
// หน้านี้สำหรับเจ้าหน้าที่ภาควิชาในการบันทึกผลสอบหัวข้อ (ผ่าน / ไม่ผ่าน)
// ปรับปรุง UI ให้เหมือนกับหน้า StaffKP02Queue

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Table, 
  Tag, 
  Space, 
  Button, 
  Typography, 
  Modal, 
  Form, 
  Input, 
  message, 
  Tooltip, 
  Alert, 
  Select,
  Card,
  Col,
  Row,
  Statistic,
  Spin,
  Descriptions
} from 'antd';
import { 
  ReloadOutlined,
  DownloadOutlined,
  EyeOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useTopicExamOverview } from '../../../hooks/useTopicExamOverview';
import { downloadTopicExamExport } from '../../../services/topicExamService';
import { recordTopicExamResult } from '../../../services/topicExamResultService';
import { teacherService } from '../../../services/teacherService';

const { Title, Text } = Typography;

// UI Meta สำหรับหน้าบันทึกผลสอบหัวข้อ
const UI_META = {
  title: "บันทึกผลสอบหัวข้อโครงงานพิเศษ",
  description: "เจ้าหน้าที่สามารถบันทึกผลสอบหัวข้อโครงงานพิเศษ (ผ่าน/ไม่ผ่าน) และเลือกอาจารย์ที่ปรึกษาสำหรับโครงงานที่ผ่านการสอบ"
};

// สถานะของผลสอบ
const EXAM_STATUS_MAP = {
  pending: { color: "orange", text: "รอบันทึกผล" },
  passed: { color: "green", text: "ผ่าน" },
  failed: { color: "red", text: "ไม่ผ่าน" }
};

const containerStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: 24,
};

export default function TopicExamResultPage() {
  const { records, filters, loading, error, reload, updateFilters, meta } = useTopicExamOverview();
  const [failModalOpen, setFailModalOpen] = useState(false);
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [failForm] = Form.useForm();
  const [passForm] = Form.useForm();
  const [advisorOptions, setAdvisorOptions] = useState([]);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [expandedRowKey, setExpandedRowKey] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchAdvisors = async () => {
      setAdvisorLoading(true);
      try {
        const list = await teacherService.getAdvisors();
        if (!active) return;
        const options = (list || []).map((item) => ({
          value: Number(item.teacherId),
          label: [item.teacherCode, `${item.firstName || ''} ${item.lastName || ''}`.trim()]
            .filter(Boolean)
            .join(' – ')
        }));
        setAdvisorOptions(options);
      } catch (err) {
        if (active) {
          message.error(err?.message || 'ไม่สามารถดึงรายชื่ออาจารย์ที่ปรึกษาได้');
        }
      } finally {
        if (active) {
          setAdvisorLoading(false);
        }
      }
    };
    fetchAdvisors();
    return () => {
      active = false;
    };
  }, []);

  // สรุปสถิติ
  const summary = useMemo(() => {
    return records.reduce(
      (acc, record) => {
        acc.total += 1;
        if (!record.examResult) {
          acc.pending += 1;
        } else if (record.examResult === 'passed') {
          acc.passed += 1;
        } else if (record.examResult === 'failed') {
          acc.failed += 1;
        }
        return acc;
      },
      { pending: 0, passed: 0, failed: 0, total: 0 }
    );
  }, [records]);

  const academicYearOptions = useMemo(() => {
    const years = meta?.availableAcademicYears || [];
    return years.map((year) => ({ value: year, label: `${year}` }));
  }, [meta?.availableAcademicYears]);

  const semesterOptions = useMemo(() => {
    if (!filters.academicYear) return [];
    const mapping = meta?.availableSemestersByYear || {};
    const semesters = mapping[filters.academicYear] || [];
    return semesters.map((sem) => ({ value: sem, label: `ภาคเรียนที่ ${sem}` }));
  }, [filters.academicYear, meta?.availableSemestersByYear]);

  const handleAcademicYearChange = useCallback((value) => {
    updateFilters({ academicYear: value ?? null, semester: null, projectId: null });
  }, [updateFilters]);

  const handleSemesterChange = useCallback((value) => {
    updateFilters({ semester: value ?? null });
  }, [updateFilters]);

  // เปิด modal เลือกอาจารย์เมื่อกด "ผ่าน"
  const openPassModal = useCallback((project) => {
    setSelectedProject(project);
    passForm.resetFields();
    const defaultAdvisor = project?.advisor?.teacherId ? Number(project.advisor.teacherId) : undefined;
    passForm.setFieldsValue({ advisorId: defaultAdvisor });
    setPassModalOpen(true);
  }, [passForm]);

  const submitPass = async () => {
    try {
      const values = await passForm.validateFields();
      setSubmitting(true);
      const advisorId = values.advisorId;
      if (!advisorId) {
        message.warning('กรุณาเลือกอาจารย์ที่ปรึกษาก่อนบันทึกผล');
        setSubmitting(false);
        return;
      }
      await recordTopicExamResult(selectedProject.projectId, { result: 'passed', advisorId });
      message.success(`บันทึกผล: ผ่าน – ${selectedProject?.titleTh || selectedProject?.titleEn || 'หัวข้อไม่มีชื่อ'}`);
      setPassModalOpen(false);
      setSelectedProject(null);
      passForm.resetFields();
      reload();
    } catch (err) {
      if (err?.errorFields) return; // validation จาก antd form
      message.error(err.response?.data?.message || 'บันทึกผลไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  // เปิด modal กรอกเหตุผลไม่ผ่าน
  const openFailModal = useCallback((project) => {
    setSelectedProject(project);
    failForm.resetFields();
    failForm.setFieldsValue({ reason: undefined });
    setFailModalOpen(true);
  }, [failForm]);

  const submitFail = async () => {
    try {
      const values = await failForm.validateFields();
      setSubmitting(true);
      await recordTopicExamResult(selectedProject.projectId, {
        result: 'failed',
        reason: values.reason
      });
      message.success(`บันทึกผล: ไม่ผ่าน – ${selectedProject?.titleTh || selectedProject?.titleEn}`);
      setFailModalOpen(false);
      setSelectedProject(null);
      failForm.resetFields();
      reload();
    } catch (err) {
      if (err?.errorFields) return; // validation จาก antd form
      message.error(err.response?.data?.message || 'บันทึกผลไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await downloadTopicExamExport({ ...filters, format: 'xlsx' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'topic-exam-results.xlsx';
      link.click();
      message.success('ส่งออกไฟล์เรียบร้อย');
    } catch (e) {
      message.error('Export ล้มเหลว');
    } finally {
      setExporting(false);
    }
  };

  // Expandable row render สำหรับแสดงรายละเอียดเพิ่มเติม
  const expandedRowRender = useCallback((record) => {
    return (
      <Row gutter={[24, 16]}>
        <Col xs={24} md={14}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card size="small" title="รายละเอียดโครงงาน">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="ชื่อโครงงาน (ไทย)">
                  {record.titleTh || <Text type="secondary">ยังไม่ระบุ</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="ชื่อโครงงาน (อังกฤษ)">
                  {record.titleEn || <Text type="secondary">ยังไม่ระบุ</Text>}
                </Descriptions.Item>
                {record.examResult && (
                  <>
                    <Descriptions.Item label="ผลสอบ">
                      <Tag color={EXAM_STATUS_MAP[record.examResult]?.color}>
                        {EXAM_STATUS_MAP[record.examResult]?.text}
                      </Tag>
                    </Descriptions.Item>
                    {record.examResult === 'passed' && record.advisor && (
                      <Descriptions.Item label="อาจารย์ที่ปรึกษา">
                        {record.advisor.name}
                      </Descriptions.Item>
                    )}
                    {record.examResult === 'failed' && record.examFailReason && (
                      <Descriptions.Item label="เหตุผลที่ไม่ผ่าน">
                        <Text type="secondary" style={{ whiteSpace: 'pre-wrap' }}>
                          {record.examFailReason}
                        </Text>
                      </Descriptions.Item>
                    )}
                    {record.examResultAt && (
                      <Descriptions.Item label="วันที่บันทึกผล">
                        {new Date(record.examResultAt).toLocaleString('th-TH', { 
                          dateStyle: 'medium', 
                          timeStyle: 'short' 
                        })}
                      </Descriptions.Item>
                    )}
                  </>
                )}
              </Descriptions>
            </Card>
          </Space>
        </Col>
        <Col xs={24} md={10}>
          <Card size="small" title="สมาชิกในโครงงาน">
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              {record.members.map((member, index) => (
                <div key={member.studentId || index}>
                  <Text strong>{member.studentCode || 'ไม่มีรหัส'}</Text>
                  <br />
                  <Text>{member.name || 'ไม่มีชื่อ'}</Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    );
  }, []);

  const baseColumns = useMemo(() => [
    {
      title: 'ลำดับ',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, idx) => idx + 1
    },
    {
      title: 'ชื่อหัวข้อโครงงานพิเศษ',
      dataIndex: 'titleTh',
      width: 300,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Space size={6} wrap>
            <Text strong>
              {record.titleTh || record.titleEn || <Text type="secondary">ยังไม่ตั้งชื่อ</Text>}
            </Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.titleEn && record.titleTh !== record.titleEn ? record.titleEn : ''}
          </Text>
        </Space>
      )
    },
    {
      title: 'สมาชิก',
      dataIndex: 'members',
      width: 200,
      render: (members) => (
        <Space direction="vertical" size={2}>
          {members.slice(0, 2).map(m => (
            <Text key={m.studentId} style={{ fontSize: 12 }}>
              {m.studentCode} – {m.name || <Text type="secondary">ไม่มีชื่อ</Text>}
            </Text>
          ))}
          {members.length > 2 && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              และอีก {members.length - 2} คน
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'อาจารย์ที่ปรึกษา',
      dataIndex: 'advisor',
      width: 180,
      render: (_, record) => {
        if (!record.examResult) return <Text type="secondary">—</Text>;
        const label = record.advisor?.name;
        return label ? <Text>{label}</Text> : <Text type="secondary">ยังไม่ระบุ</Text>;
      }
    },
    {
      title: 'ผลสอบ',
      dataIndex: 'examResult',
      width: 100,
      render: (_, record) => {
        if (!record.examResult) {
          const meta = EXAM_STATUS_MAP.pending;
          return <Tag color={meta.color}>{meta.text}</Tag>;
        }
        const meta = EXAM_STATUS_MAP[record.examResult];
        return <Tag color={meta.color}>{meta.text}</Tag>;
      }
    }
  ], []);

  const columns = useMemo(() => {
    const list = [...baseColumns];
    list.push({
      title: 'การดำเนินการ',
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_, record) => {
        if (!record.examResult) {
          return (
            <Space>
              <Tooltip title="บันทึกผล: ผ่าน">
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<CheckCircleOutlined />}
                  onClick={() => openPassModal(record)}
                >
                  ผ่าน
                </Button>
              </Tooltip>
              <Tooltip title="บันทึกผล: ไม่ผ่าน">
                <Button 
                  danger 
                  size="small" 
                  icon={<CloseCircleOutlined />}
                  onClick={() => openFailModal(record)}
                >
                  ไม่ผ่าน
                </Button>
              </Tooltip>
            </Space>
          );
        }
        return <Text type="secondary">บันทึกแล้ว</Text>;
      }
    });
    return list;
  }, [baseColumns, openPassModal, openFailModal]);

  const previewColumns = useMemo(() => baseColumns, [baseColumns]);

  return (
    <div style={containerStyle}>
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        {/* Header */}
        <Space direction="vertical" size={8}>
          <Title level={3}>{UI_META.title}</Title>
          <Text type="secondary">{UI_META.description}</Text>
        </Space>

        {/* Summary Statistics */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic
                title="รอบันทึกผล"
                value={summary.pending}
                suffix="รายการ"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic
                title="ผ่าน"
                value={summary.passed}
                suffix="รายการ"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic
                title="ไม่ผ่าน"
                value={summary.failed}
                suffix="รายการ"
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic
                title="ทั้งหมด"
                value={summary.total}
                suffix="รายการ"
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card size="small" styles={{ body: { padding: 16 } }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={6}>
              <Space direction="vertical" size={4}>
                <Text strong>ปีการศึกษา</Text>
                <Select
                  placeholder="เลือกปีการศึกษา"
                  allowClear
                  style={{ width: '100%' }}
                  value={filters.academicYear}
                  options={academicYearOptions}
                  onChange={handleAcademicYearChange}
                />
              </Space>
            </Col>
            <Col xs={24} md={6}>
              <Space direction="vertical" size={4}>
                <Text strong>ภาคเรียน</Text>
                <Select
                  placeholder="เลือกภาคเรียน"
                  allowClear
                  style={{ width: '100%' }}
                  value={filters.semester}
                  disabled={!filters.academicYear || !semesterOptions.length}
                  options={semesterOptions}
                  onChange={handleSemesterChange}
                />
              </Space>
            </Col>
            <Col xs={24} md={6}>
              <Space direction="vertical" size={4}>
                <Text strong>ค้นหา</Text>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="ค้นหาชื่อโครงงาน / รหัสนักศึกษา"
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                />
              </Space>
            </Col>
            <Col xs={24} md={6} style={{ textAlign: 'right' }}>
              <Space wrap>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={reload}
                  loading={loading}
                >
                  รีเฟรช
                </Button>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => setPreviewVisible(true)}
                >
                  ดูตัวอย่าง
                </Button>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  loading={exporting}
                  onClick={handleExport}
                >
                  ส่งออก Excel
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Error Alert */}
        {error && <Alert type="error" message={error} style={{ marginBottom: 12 }} />}

        {/* Main Table */}
        <Spin spinning={loading} tip="กำลังโหลดข้อมูล">
          <Table
            dataSource={records}
            columns={columns}
            size="small"
            rowKey={(r) => r.projectId + '-' + r.memberRowKey}
            bordered
            scroll={{ x: 1100 }}
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`,
            }}
            expandable={{
              expandedRowKeys: expandedRowKey ? [expandedRowKey] : [],
              onExpand: (expanded, record) =>
                setExpandedRowKey(expanded ? record.projectId + '-' + record.memberRowKey : null),
              expandedRowRender,
            }}
          />
        </Spin>
      </Space>

      {/* Preview Modal */}
      <Modal
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        title="ตัวอย่างรายชื่อก่อนส่งออก"
        width={960}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            ปิด
          </Button>,
          <Button
            key="export"
            type="primary"
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={async () => {
              await handleExport();
              setPreviewVisible(false);
            }}
          >
            ส่งออก Excel
          </Button>
        ]}
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Alert
            type="info"
            showIcon
            message="ตรวจสอบรายชื่อโครงงานทั้งหมดก่อนสร้างไฟล์"
            description="รายการนี้จะใช้ตัวกรองเดียวกับหน้าหลัก หากข้อมูลผิดพลาดโปรดกลับไปปรับตัวกรองก่อนส่งออก"
          />
          <Table
            rowKey={(record) => record.projectId + '-' + record.memberRowKey}
            dataSource={records}
            columns={previewColumns}
            pagination={false}
            scroll={{ y: 400 }}
            size="small"
          />
        </Space>
      </Modal>

      {/* Pass Modal */}
      <Modal
        title={<span><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />บันทึกผล: ผ่าน</span>}
        open={passModalOpen}
        onCancel={() => {
          setPassModalOpen(false);
          setSelectedProject(null);
          passForm.resetFields();
        }}
        onOk={submitPass}
        okText="ยืนยันผลผ่าน"
        confirmLoading={submitting}
      >
        <Form form={passForm} layout="vertical">
          <Form.Item label="หัวข้อ" style={{ marginBottom: 4 }}>
            <Text strong>{selectedProject?.titleTh || selectedProject?.titleEn || '—'}</Text>
          </Form.Item>
          <Form.Item
            label="อาจารย์ที่ปรึกษา"
            name="advisorId"
            rules={[{ required: true, message: 'เลือกอาจารย์ที่ปรึกษา' }]}
          >
            <Select
              placeholder="เลือกอาจารย์ที่ปรึกษา"
              allowClear
              showSearch
              optionFilterProp="label"
              options={advisorOptions}
              loading={advisorLoading}
              notFoundContent={advisorLoading ? 'กำลังโหลด...' : 'ไม่พบข้อมูล'}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Fail Modal */}
      <Modal
        title={<span><CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />บันทึกผล: ไม่ผ่าน</span>}
        open={failModalOpen}
        onCancel={() => {
          setFailModalOpen(false);
          setSelectedProject(null);
          failForm.resetFields();
        }}
        onOk={submitFail}
        okText="ยืนยันผลไม่ผ่าน"
        confirmLoading={submitting}
      >
        <Form form={failForm} layout="vertical">
          <Form.Item label="หัวข้อ" style={{ marginBottom: 4 }}>
            <Text strong>{selectedProject?.titleTh || selectedProject?.titleEn || '—'}</Text>
          </Form.Item>
          <Form.Item
            label="เหตุผลที่ไม่ผ่าน"
            name="reason"
            rules={[{ required: true, message: 'กรอกเหตุผล' }, { min: 5, message: 'ควรอย่างน้อย 5 ตัวอักษร' }]}
          >
            <Input.TextArea rows={4} placeholder="เช่น ขอบเขตกว้างไป / วัตถุประสงค์ยังไม่ชัด / ยังไม่มีข้อมูลอ้างอิง" />
          </Form.Item>
          <Alert type="warning" showIcon message="ระบบจะบันทึกเหตุผลและเวลา (timestamp) ทันทีหลังยืนยัน" />
        </Form>
      </Modal>
    </div>
  );
}
