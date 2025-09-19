import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Space, message, Drawer, Descriptions, Divider, Typography, Popconfirm, Tooltip, List } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import projectService from '../../services/projectService';

// TODO: ภายหลังอาจดึงรายชื่ออาจารย์จาก teacherService
// ตอนนี้ mock ไว้ (ผู้ใช้สามารถแก้ภายหลัง)
const advisorOptions = [];

const statusColorMap = {
  draft: 'default',
  advisor_assigned: 'processing',
  in_progress: 'blue',
  completed: 'success',
  archived: 'error'
};

const { Title, Text } = Typography; // ใช้ Text สำหรับ error/help

const ProjectDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [createVisible, setCreateVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [activeProject, setActiveProject] = useState(null);
  const [memberInput, setMemberInput] = useState('');
  const [activating, setActivating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState(null); // เก็บ error แสดงใต้ input

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await projectService.getMyProjects();
      if (res.success) {
        setProjects(res.data || []);
      } else {
        message.error(res.message || 'ดึงรายการโครงงานล้มเหลว');
      }
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const openDetail = useCallback(async (record) => {
    try {
      const res = await projectService.getProject(record.projectId);
      if (res.success) {
        setActiveProject(res.data);
        editForm.setFieldsValue({
          projectNameTh: res.data.projectNameTh,
          projectNameEn: res.data.projectNameEn,
          projectType: res.data.projectType,
          track: res.data.track,
          advisorId: res.data.advisorId || undefined,
          coAdvisorId: res.data.coAdvisorId || undefined
        });
        setDetailVisible(true);
      } else {
        message.error(res.message || 'ไม่สามารถเปิดรายละเอียดได้');
      }
    } catch (e) {
      message.error(e.message);
    }
  }, [editForm]);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const payload = { ...values };
      const res = await projectService.createProject(payload);
      if (res.success) {
        message.success('สร้างโครงงานสำเร็จ');
        setCreateVisible(false);
        createForm.resetFields();
        fetchProjects();
      } else {
        message.error(res.message || 'สร้างโครงงานไม่สำเร็จ');
      }
    } catch (e) {
      if (e.errorFields) return; // validation error
      message.error(e.message);
    }
  };

  const handleUpdate = async () => {
    if (!activeProject) return;
    try {
      setUpdating(true);
      const values = await editForm.validateFields();
      const res = await projectService.updateProject(activeProject.projectId, values);
      if (res.success) {
        message.success('อัปเดตโครงงานสำเร็จ');
        // refresh detail
        const refreshed = await projectService.getProject(activeProject.projectId);
        setActiveProject(refreshed.data);
        fetchProjects();
      } else {
        message.error(res.message || 'อัปเดตไม่สำเร็จ');
      }
    } catch (e) {
      if (!e.errorFields) message.error(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddMember = async () => {
    if (!activeProject) return;
    setMemberError(null);
    const code = (memberInput || '').trim();
    // Validation ฝั่ง client เบื้องต้น
    if (!code) {
      setMemberError('กรุณากรอกรหัสนักศึกษา');
      return;
    }
    if (!/^\d{5,13}$/.test(code)) {
      setMemberError('รูปแบบรหัสนักศึกษาไม่ถูกต้อง (ควรเป็นตัวเลข 5-13 หลัก)');
      return;
    }
    if (activeProject.members?.some(m => m.studentCode === code)) {
      setMemberError('นักศึกษานี้อยู่ในโครงงานแล้ว');
      return;
    }
    if (activeProject.members?.length >= 2) {
      setMemberError('โครงงานมีสมาชิกครบแล้ว');
      return;
    }
    try {
      setAddingMember(true);
      const res = await projectService.addMember(activeProject.projectId, code);
      if (res.success) {
        message.success('เพิ่มสมาชิกสำเร็จ');
        setMemberInput('');
        setMemberError(null);
        const refreshed = await projectService.getProject(activeProject.projectId);
        setActiveProject(refreshed.data);
        fetchProjects();
      } else {
        // map backend error (message field)
        setMemberError(res.message || 'เพิ่มสมาชิกไม่สำเร็จ');
      }
    } catch (e) {
      setMemberError(e.message || 'เกิดข้อผิดพลาดระหว่างเพิ่มสมาชิก');
    } finally {
      setAddingMember(false);
    }
  };

  const handleActivate = async () => {
    if (!activeProject) return;
    try {
      setActivating(true);
      const res = await projectService.activateProject(activeProject.projectId);
      if (res.success) {
        message.success('โครงงานเริ่มดำเนินการแล้ว');
        const refreshed = await projectService.getProject(activeProject.projectId);
        setActiveProject(refreshed.data);
        fetchProjects();
      } else {
        message.error(res.message || 'ไม่สามารถเริ่มได้');
      }
    } catch (e) {
      message.error(e.message);
    } finally {
      setActivating(false);
    }
  };

  const columns = useMemo(() => [
    { title: 'รหัส', dataIndex: 'projectCode', key: 'projectCode', width: 140 },
    { title: 'ชื่อโครงงาน (TH)', dataIndex: 'projectNameTh', key: 'projectNameTh', ellipsis: true },
    { title: 'สถานะ', dataIndex: 'status', key: 'status', width: 130, render: s => <Tag color={statusColorMap[s] || 'default'}>{s}</Tag> },
    { title: 'สมาชิก', key: 'members', width: 160, render: (_, r) => (r.members || []).map(m => <Tag key={m.studentId}>{m.role === 'leader' ? 'หัวหน้า' : 'สมาชิก'}</Tag>) },
    { title: 'ดำเนินการ', key: 'action', width: 110, render: (_, r) => <Button size="small" onClick={() => openDetail(r)}>รายละเอียด</Button> }
  ], [openDetail]);

  const canActivate = useMemo(() => {
    if (!activeProject) return false;
    const p = activeProject;
    return p.status !== 'in_progress' && p.status !== 'completed' && p.status !== 'archived'
      && p.members?.length === 2
      && p.advisorId
      && p.projectNameTh && p.projectNameEn
      && p.projectType && p.track;
  }, [activeProject]);

  // สร้าง checklist รายการเงื่อนไข พร้อมสถานะผ่าน/ไม่ผ่าน
  const readinessChecklist = useMemo(() => {
    if (!activeProject) return [];
    const p = activeProject;
    return [
      { key: 'members', label: 'มีสมาชิกครบ 2 คน', pass: (p.members?.length === 2) },
      { key: 'advisor', label: 'เลือกอาจารย์ที่ปรึกษา', pass: !!p.advisorId },
      { key: 'name_th', label: 'ชื่อโครงงาน (TH)', pass: !!p.projectNameTh },
      { key: 'name_en', label: 'ชื่อโครงงาน (EN)', pass: !!p.projectNameEn },
      { key: 'type', label: 'ระบุประเภทโครงงาน', pass: !!p.projectType },
      { key: 'track', label: 'ระบุ Track', pass: !!p.track }
    ];
  }, [activeProject]);

  const missingReasons = useMemo(() => readinessChecklist.filter(i => !i.pass).map(i => i.label), [readinessChecklist]);

  return (
    <Card title={<Space><Title level={4} style={{ margin: 0 }}>โครงงานของฉัน</Title><Button icon={<ReloadOutlined />} onClick={fetchProjects} /></Space>} extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>สร้างโครงงาน</Button>}>
      <Table
        dataSource={projects}
        columns={columns}
        loading={loading}
        rowKey={r => r.projectId}
        pagination={false}
        size="small"
      />

      {/* Modal สร้างโครงงาน */}
      <Modal
        title="สร้างโครงงานใหม่"
        open={createVisible}
        onCancel={() => setCreateVisible(false)}
        onOk={handleCreate}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item label="ชื่อโครงงาน (TH)" name="projectNameTh" rules={[{ required: false }]}> <Input placeholder="เว้นว่างได้ใน Draft" /> </Form.Item>
          <Form.Item label="ชื่อโครงงาน (EN)" name="projectNameEn" rules={[{ required: false }]}> <Input placeholder="Optional ใน Draft" /> </Form.Item>
          <Form.Item label="ประเภท" name="projectType"> <Select allowClear options={[{value:'govern',label:'Govern'},{value:'private',label:'Private'},{value:'research',label:'Research'}]} /> </Form.Item>
          <Form.Item label="Track" name="track"> <Input placeholder="เช่น AI / SE / Network" /> </Form.Item>
          <Form.Item label="อาจารย์ที่ปรึกษา" name="advisorId"> <Select allowClear showSearch placeholder="เลือกอาจารย์" options={advisorOptions} /> </Form.Item>
          <Form.Item label="Co-Advisor" name="coAdvisorId"> <Select allowClear showSearch placeholder="(ไม่บังคับ)" options={advisorOptions} /> </Form.Item>
        </Form>
      </Modal>

      {/* Drawer รายละเอียด */}
      <Drawer
        title={activeProject ? `รายละเอียดโครงงาน: ${activeProject.projectCode || ''}` : 'รายละเอียดโครงงาน'}
        open={detailVisible}
        width={640}
        onClose={() => { setDetailVisible(false); setActiveProject(null); }}
        extra={activeProject && <Tag color={statusColorMap[activeProject.status]}>{activeProject.status}</Tag>}
      >
        {activeProject && (
          <>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="รหัส">{activeProject.projectCode || '-'}</Descriptions.Item>
              <Descriptions.Item label="ปีการศึกษา">{activeProject.academicYear || '-'}</Descriptions.Item>
              <Descriptions.Item label="ภาคเรียน">{activeProject.semester || '-'}</Descriptions.Item>
            </Descriptions>
            <Divider />
            <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
              <Form.Item label="ชื่อโครงงาน (TH)" name="projectNameTh"><Input disabled={['in_progress','completed','archived'].includes(activeProject.status)} /></Form.Item>
              <Form.Item label="ชื่อโครงงาน (EN)" name="projectNameEn"><Input disabled={['in_progress','completed','archived'].includes(activeProject.status)} /></Form.Item>
              <Form.Item label="ประเภท" name="projectType"><Select disabled={['in_progress','completed','archived'].includes(activeProject.status)} allowClear options={[{value:'govern',label:'Govern'},{value:'private',label:'Private'},{value:'research',label:'Research'}]} /></Form.Item>
              <Form.Item label="Track" name="track"><Input disabled={['in_progress','completed','archived'].includes(activeProject.status)} /></Form.Item>
              <Form.Item label="อาจารย์ที่ปรึกษา" name="advisorId"><Select disabled={['in_progress','completed','archived'].includes(activeProject.status)} allowClear options={advisorOptions} /></Form.Item>
              <Form.Item label="Co-Advisor" name="coAdvisorId"><Select disabled={['in_progress','completed','archived'].includes(activeProject.status)} allowClear options={advisorOptions} /></Form.Item>
              <Space>
                <Button type="primary" loading={updating} onClick={handleUpdate}>บันทึก</Button>
              </Space>
            </Form>
            <Divider />
            <Title level={5}>สมาชิก</Title>
            <Space direction="vertical" style={{ width:'100%' }}>
              <Space wrap>
                {(activeProject.members || []).map(m => (
                  <Tag key={m.studentId} color={m.role === 'leader' ? 'blue' : 'default'}>{m.name || m.studentCode || m.studentId} ({m.role === 'leader' ? 'หัวหน้า' : 'สมาชิก'})</Tag>
                ))}
              </Space>
              {activeProject.members?.length < 2 && !['in_progress','completed','archived'].includes(activeProject.status) && (
                <div style={{ width: 340 }}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input 
                      placeholder="รหัสนักศึกษา" 
                      value={memberInput} 
                      status={memberError ? 'error' : undefined}
                      onChange={e => { setMemberInput(e.target.value); if (memberError) setMemberError(null); }} 
                      onPressEnter={handleAddMember} 
                      disabled={addingMember}
                    />
                    <Button type="primary" loading={addingMember} onClick={handleAddMember}>เพิ่ม</Button>
                  </Space.Compact>
                  {memberError && <div style={{ marginTop: 6 }}><Text type="danger" style={{ fontSize: 12 }}>{memberError}</Text></div>}
                  <Text type="secondary" style={{ fontSize: 11 }}>โครงงานต้องมีสมาชิก 2 คน (หัวหน้า + สมาชิก) | ระบบจะตรวจสิทธิ์นักศึกษาฝั่งเซิร์ฟเวอร์อีกครั้ง</Text>
                </div>
              )}
            </Space>

            <Divider />
            <Title level={5}>การดำเนินการ</Title>
            <div style={{ marginBottom: 12 }}>
              <Text strong>เงื่อนไขก่อนเริ่มโครงงาน</Text>
              <List
                size="small"
                dataSource={readinessChecklist}
                renderItem={item => (
                  <List.Item style={{ padding: '2px 0' }}>
                    <Tag color={item.pass ? 'green' : 'red'} style={{ width: 110, textAlign: 'center' }}>{item.pass ? 'ผ่าน' : 'ยังไม่ครบ'}</Tag>
                    <span style={{ marginLeft: 4 }}>{item.label}</span>
                  </List.Item>
                )}
              />
            </div>
            <Space wrap>
              <Tooltip title={canActivate ? 'พร้อมเริ่มโครงงาน' : `ยังขาด: ${missingReasons.join(', ')}`}> 
                <Button type="primary" disabled={!canActivate} loading={activating} onClick={handleActivate}>เริ่มดำเนินโครงงาน</Button>
              </Tooltip>
              <Popconfirm title="ยืนยันเก็บถาวร?" okText="ใช่" cancelText="ไม่" disabled>
                <Button danger disabled>เก็บถาวร (เฉพาะ Admin)</Button>
              </Popconfirm>
            </Space>
          </>
        )}
      </Drawer>
    </Card>
  );
};

export default ProjectDashboard;
