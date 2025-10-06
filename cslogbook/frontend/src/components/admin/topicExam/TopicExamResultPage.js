// admin/topicExam/TopicExamResultPage.js
// หน้านี้สำหรับเจ้าหน้าที่ภาควิชาในการบันทึกผลสอบหัวข้อ (ผ่าน / ไม่ผ่าน)
// เวอร์ชันแรก: ยังไม่มี endpoint บันทึกผลจริง ใช้ mock action + TODO comment
// อ้างอิงโครงตารางจาก TopicExamOverview ของอาจารย์ แต่เพิ่มปุ่ม "ผ่าน" / "ไม่ผ่าน"

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Table, Tag, Space, Button, Typography, Modal, Form, Input, message, Tooltip, Alert, Select } from 'antd';
import { useTopicExamOverview } from '../../../hooks/useTopicExamOverview';
import { downloadTopicExamExport } from '../../../services/topicExamService';
import { recordTopicExamResult } from '../../../services/topicExamResultService';
import { teacherService } from '../../../services/teacherService';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24
};

const { Title, Text } = Typography;

export default function TopicExamResultPage() {
  const { records, filters, loading, error, reload, updateFilters, meta } = useTopicExamOverview();
  const [failModalOpen, setFailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [advisorOptions, setAdvisorOptions] = useState([]);
  const [advisorSelections, setAdvisorSelections] = useState({});
  const [advisorLoading, setAdvisorLoading] = useState(false);

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

  useEffect(() => {
    if (!Array.isArray(records)) {
      setAdvisorSelections((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }
    setAdvisorSelections((prev) => {
      const next = {};
      records.forEach((project) => {
        if (!project?.projectId) return;
        if (Object.prototype.hasOwnProperty.call(prev, project.projectId)) {
          next[project.projectId] = prev[project.projectId];
        } else if (project?.advisor?.teacherId) {
          next[project.projectId] = Number(project.advisor.teacherId);
        } else {
          next[project.projectId] = null;
        }
      });
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      const unchanged =
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[key] === next[key]);
      return unchanged ? prev : next;
    });
  }, [records]);

  const advisorOptionMap = useMemo(() => {
    const map = new Map();
    advisorOptions.forEach((opt) => {
      map.set(opt.value, opt.label);
    });
    return map;
  }, [advisorOptions]);

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

  const handleAdvisorChange = useCallback((projectId, value) => {
    const normalized = typeof value === 'number' ? value : (value ? Number(value) : null);
    setAdvisorSelections((prev) => ({ ...prev, [projectId]: normalized }));
  }, []);

  const handleAcademicYearChange = useCallback((value) => {
    updateFilters({ academicYear: value ?? null, semester: null, projectId: null });
  }, [updateFilters]);

  const handleSemesterChange = useCallback((value) => {
    updateFilters({ semester: value ?? null });
  }, [updateFilters]);

  // ฟังก์ชันกดผ่าน (เรียก API จริง)
  const handlePass = useCallback(async (project) => {
    const advisorId = advisorSelections[project.projectId];
    if (!advisorId) {
      message.warning('กรุณาเลือกอาจารย์ที่ปรึกษาก่อนบันทึกผล');
      return;
    }
    try {
      await recordTopicExamResult(project.projectId, { result: 'passed', advisorId });
      message.success(`บันทึกผล: ผ่าน – ${project.titleTh || project.titleEn || 'หัวข้อไม่มีชื่อ'}`);
      reload();
    } catch (e) {
      message.error(e.response?.data?.message || 'บันทึกผลไม่สำเร็จ');
    }
  }, [advisorSelections, reload]);

  // เปิด modal กรอกเหตุผลไม่ผ่าน
  const openFailModal = (project) => {
    setSelectedProject(project);
    form.resetFields();
    const defaultAdvisor = advisorSelections[project.projectId] ?? project?.advisor?.teacherId ?? null;
    form.setFieldsValue({
      advisorId: defaultAdvisor || undefined,
      reason: undefined
    });
    setFailModalOpen(true);
  };

  const submitFail = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const advisorId = values.advisorId || advisorSelections[selectedProject.projectId];
      if (!advisorId) {
        message.warning('กรุณาเลือกอาจารย์ที่ปรึกษาก่อนบันทึกผล');
        setSubmitting(false);
        return;
      }
      await recordTopicExamResult(selectedProject.projectId, {
        result: 'failed',
        reason: values.reason,
        advisorId
      });
      setAdvisorSelections((prev) => ({ ...prev, [selectedProject.projectId]: advisorId }));
      message.success(`บันทึกผล: ไม่ผ่าน – ${selectedProject?.titleTh || selectedProject?.titleEn}`);
      setFailModalOpen(false);
      setSelectedProject(null);
      form.resetFields();
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
      const res = await downloadTopicExamExport({ ...filters, format: 'xlsx' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'topic-exam-overview.xlsx';
      link.click();
    } catch (e) {
      message.error('Export ล้มเหลว');
    }
  };

  const columns = [
    {
      title: 'ลำดับ',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, idx) => idx + 1
    },
    {
      title: 'ชื่อหัวข้อ (TH / EN)',
      dataIndex: 'titleTh',
      width: 360,
      render: (_, r) => (
        <div>
          <div>{r.titleTh || <Text type="secondary">(ยังไม่ตั้งชื่อ TH)</Text>}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{r.titleEn || <Text type="secondary">(ยังไม่ตั้งชื่อ EN)</Text>}</div>
        </div>
      )
    },
    {
      title: 'สมาชิก',
      dataIndex: 'members',
      width: 260,
      render: (members) => (
        <div style={{ lineHeight: 1.3 }}>
          {members.map(m => (
            <div key={m.studentId}>{m.studentCode} – {m.name || <Text type="secondary">(ไม่มีชื่อ)</Text>}</div>
          ))}
        </div>
      )
    },
    {
      title: 'อ. ที่ปรึกษา',
      dataIndex: 'advisor',
      width: 220,
      render: (_, record) => {
        const projectId = record.projectId;
        const currentValue = advisorSelections[projectId] ?? null;
        if (record.examResult) {
          const label = advisorOptionMap.get(currentValue) || record.advisor?.name;
          return label ? <Text>{label}</Text> : <Text type="secondary">(ยังไม่ระบุ)</Text>;
        }
        return (
          <Select
            placeholder="เลือกอาจารย์ที่ปรึกษา"
            value={currentValue ?? undefined}
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: '100%' }}
            options={advisorOptions}
            loading={advisorLoading}
            onChange={(value) => handleAdvisorChange(projectId, value)}
            notFoundContent={advisorLoading ? 'กำลังโหลด...' : 'ไม่พบข้อมูล'}
          />
        );
      }
    },
    {
      title: 'ผลสอบ',
      dataIndex: 'examResult',
      width: 100,
      render: (_, r) => {
        if (!r.examResult) return <Tag color="default">—</Tag>;
        if (r.examResult === 'passed') return <Tag color="green">ผ่าน</Tag>;
        return <Tag color="red">ไม่ผ่าน</Tag>;
      }
    },
    {
      title: 'เหตุผล',
      dataIndex: 'examFailReason',
      width: 320,
      render: (_, r) => {
        if (r.examResult !== 'failed') return <Text type="secondary">—</Text>;
        const ts = r.examResultAt ? new Date(r.examResultAt) : null;
        return (
          <div style={{ maxWidth: 300 }}>
              {r.examFailReason || ''}
            {ts && (
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                บันทึกเมื่อ: {ts.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_, record) => {
        if (!record.examResult) {
          return (
            <Space>
              <Tooltip title="บันทึกผล: ผ่าน">
                <Button type="primary" size="small" onClick={() => handlePass(record)}>ผ่าน</Button>
              </Tooltip>
              <Tooltip title="บันทึกผล: ไม่ผ่าน (กรอกเหตุผล)">
                <Button danger size="small" onClick={() => openFailModal(record)}>ไม่ผ่าน</Button>
              </Tooltip>
            </Space>
          );
        }
      }
    }
  ];

  return (
    <div style={containerStyle}>
      <Title level={3}>บันทึกผลสอบหัวข้อโครงงานพิเศษ</Title>
      <Space style={{ marginBottom: 16 }} wrap>
        <Button onClick={reload} loading={loading}>รีเฟรช</Button>
        <Button onClick={handleExport}>Export XLSX</Button>
        <Select
          placeholder="เลือกปีการศึกษา"
          allowClear
          style={{ width: 160 }}
          value={filters.academicYear}
          options={academicYearOptions}
          onChange={handleAcademicYearChange}
        />
        <Select
          placeholder="เลือกภาคเรียน"
          allowClear
          style={{ width: 150 }}
          value={filters.semester}
          disabled={!filters.academicYear || !semesterOptions.length}
          options={semesterOptions}
          onChange={handleSemesterChange}
        />
      </Space>
      {error && <Alert type="error" message={error} style={{ marginBottom: 12 }} />}
      <Table
        dataSource={records}
        columns={columns}
        size="small"
        rowKey={(r) => r.projectId + '-' + r.memberRowKey}
        bordered
        scroll={{ x: 1100 }}
        loading={loading}
        pagination={false}
      />

      <Modal
        title={<span><ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />บันทึกผล: ไม่ผ่าน</span>}
        open={failModalOpen}
        onCancel={() => {
          setFailModalOpen(false);
          setSelectedProject(null);
          form.resetFields();
        }}
        onOk={submitFail}
        okText="ยืนยันผลไม่ผ่าน"
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical">
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
              onChange={(value) => {
                const normalized = typeof value === 'number' ? value : (value ? Number(value) : null);
                if (selectedProject?.projectId) {
                  setAdvisorSelections((prev) => ({ ...prev, [selectedProject.projectId]: normalized }));
                }
              }}
              notFoundContent={advisorLoading ? 'กำลังโหลด...' : 'ไม่พบข้อมูล'}
            />
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
