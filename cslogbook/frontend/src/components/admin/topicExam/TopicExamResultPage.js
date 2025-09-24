// admin/topicExam/TopicExamResultPage.js
// หน้านี้สำหรับเจ้าหน้าที่ภาควิชาในการบันทึกผลสอบหัวข้อ (ผ่าน / ไม่ผ่าน)
// เวอร์ชันแรก: ยังไม่มี endpoint บันทึกผลจริง ใช้ mock action + TODO comment
// อ้างอิงโครงตารางจาก TopicExamOverview ของอาจารย์ แต่เพิ่มปุ่ม "ผ่าน" / "ไม่ผ่าน"

import React, { useState, useCallback } from 'react';
import { Table, Tag, Space, Button, Typography, Modal, Form, Input, message, Tooltip, Alert } from 'antd';
import { useTopicExamOverview } from '../../../hooks/useTopicExamOverview';
import { downloadTopicExamExport } from '../../../services/topicExamService';
import { recordTopicExamResult } from '../../../services/topicExamResultService';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function TopicExamResultPage() {
  const { records, filters, loading, error, reload } = useTopicExamOverview();
  const [failModalOpen, setFailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // ฟังก์ชันกดผ่าน (เรียก API จริง)
  const handlePass = useCallback(async (project) => {
    try {
      await recordTopicExamResult(project.projectId, { result: 'passed' });
      message.success(`บันทึกผล: ผ่าน – ${project.titleTh || project.titleEn || 'หัวข้อไม่มีชื่อ'}`);
      reload();
    } catch (e) {
      message.error(e.response?.data?.message || 'บันทึกผลไม่สำเร็จ');
    }
  }, [reload]);

  // เปิด modal กรอกเหตุผลไม่ผ่าน
  const openFailModal = (project) => {
    setSelectedProject(project);
    form.resetFields();
    setFailModalOpen(true);
  };

  const submitFail = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await recordTopicExamResult(selectedProject.projectId, { result: 'failed', reason: values.reason });
      message.success(`บันทึกผล: ไม่ผ่าน – ${selectedProject?.titleTh || selectedProject?.titleEn}`);
      setFailModalOpen(false);
      setSelectedProject(null);
      reload();
    } catch (err) {
      if (err?.errorFields) return; // validation
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
      width: 160,
      render: (adv) => adv?.name || <Text type="secondary">(ยัง)</Text>
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
    <div>
      <Title level={3}>บันทึกผลสอบหัวข้อ (เจ้าหน้าที่ภาควิชา)</Title>
      <Alert type="info" showIcon style={{ marginBottom: 16 }} message="เจ้าหน้าที่สามารถบันทึกผลสอบหัวข้อได้ครั้งเดียว หากบันทึกผิดให้ติดต่อผู้ดูแลระบบ" />
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={reload} loading={loading}>รีเฟรช</Button>
        <Button onClick={handleExport}>Export XLSX</Button>
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
        onCancel={() => setFailModalOpen(false)}
        onOk={submitFail}
        okText="ยืนยันผลไม่ผ่าน"
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical">
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
