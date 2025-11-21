import React, { useEffect, useState } from 'react';
import { Card, Space, Button, List, Tag, Modal, Form, Input, DatePicker, message, Typography, Empty } from 'antd';
import projectService from 'features/project/services/projectService';

const { Text } = Typography;

// ✅ ยกเลิกการใช้ isLeader - สมาชิกโครงงานทุกคนสามารถเพิ่ม milestone ได้
const MilestoneSummary = ({ project }) => {
  const projectId = project?.projectId;
  const [loading, setLoading] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (projectId) load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await projectService.listMilestones(projectId);
      if (res.success) setMilestones(res.data); else message.error(res.message || 'โหลด Milestones ล้มเหลว');
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    form.resetFields();
    setVisible(true);
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const payload = { title: values.title, dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined };
      setCreating(true);
      const res = await projectService.createMilestone(projectId, payload);
      if (res.success) {
        message.success('สร้าง Milestone สำเร็จ');
        setVisible(false);
        load();
      } else {
        message.error(res.message || 'สร้างไม่สำเร็จ');
      }
    } catch (e) {
      if (!e.errorFields) message.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card title={<Space>Milestones <Tag color="blue">{milestones.length}</Tag></Space>} size="small" extra={<Button size="small" type="primary" onClick={openCreate}>เพิ่ม</Button>}> 
      {milestones.length === 0 && !loading && (
        <Empty description="ยังไม่มี Milestone" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
      <List
        size="small"
        loading={loading}
        dataSource={milestones}
        renderItem={m => (
          <List.Item>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Text strong>{m.title}</Text>
                <Tag color="default">{m.status}</Tag>
                {m.dueDate && <Tag color="purple">กำหนด: {m.dueDate}</Tag>}
                <Tag color={m.progress === 100 ? 'green':'processing'}>{m.progress}%</Tag>
              </Space>
            </Space>
          </List.Item>
        )}
      />

      <Modal
        title="สร้าง Milestone"
        open={visible}
        onCancel={() => setVisible(false)}
        onOk={handleCreate}
        okButtonProps={{ loading: creating }}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <Form layout="vertical" form={form}>
          <Form.Item label="ชื่อ Milestone" name="title" rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}>
            <Input placeholder="เช่น ส่ง Proposal" />
          </Form.Item>
          <Form.Item label="Due Date" name="dueDate">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default MilestoneSummary;
