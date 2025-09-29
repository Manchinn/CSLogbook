import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Space, message, Drawer, Descriptions, Divider, Typography, Popconfirm, Tooltip, List, Row, Col } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import projectService from '../../services/projectService';
import { teacherService } from '../../services/teacherService';
import MilestoneSummary from './MilestoneSummary';
import { TRACK_OPTIONS, CODE_TO_LABEL, normalizeIncomingTracks } from '../../constants/projectTracks';

// รายชื่ออาจารย์ที่โหลดมาจาก backend (advisors)
// เก็บเป็น state เพื่อรีเฟรชเมื่อเปิด modal / drawer


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
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState(null);
  const [advisors, setAdvisors] = useState([]); // raw list
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [activeProject, setActiveProject] = useState(null);
  const [memberInput, setMemberInput] = useState('');
  const [activating, setActivating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState(null); // เก็บ error แสดงใต้ input

  const getTrackCodes = useCallback((project) => {
    if (!project) return [];
    if (Array.isArray(project.tracks) && project.tracks.length) return project.tracks;
    if (project.track) return [project.track];
    return [];
  }, []);

  const fillEditForm = useCallback((project) => {
    if (!project) {
      editForm.resetFields();
      return;
    }
    editForm.setFieldsValue({
      projectNameTh: project.projectNameTh || undefined,
      projectNameEn: project.projectNameEn || undefined,
      projectType: project.projectType || undefined,
      tracks: getTrackCodes(project),
      advisorId: project.advisorId || undefined,
      coAdvisorId: project.coAdvisorId || undefined
    });
  }, [editForm, getTrackCodes]);

  const applyActiveProject = useCallback((project) => {
    const normalized = normalizeIncomingTracks(project);
    setActiveProject(normalized);
    fillEditForm(normalized);
  }, [fillEditForm]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await projectService.getMyProjects();
      if (res.success) {
        const list = (res.data || []).map(normalizeIncomingTracks);
        setProjects(list);
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

  // ฟังก์ชันโหลดรายชื่ออาจารย์ที่ปรึกษา (เรียกเมื่อเปิด modal/create หรือ drawer/edit เพื่อให้ fresh)
  const loadAdvisors = useCallback(async () => {
    try {
      setAdvisorLoading(true);
      setAdvisorError(null);
      const list = await teacherService.getAdvisors();
      setAdvisors(list || []);
    } catch (e) {
      setAdvisorError(e.message || 'โหลดรายชื่ออาจารย์ล้มเหลว');
    } finally {
      setAdvisorLoading(false);
    }
  }, []);

  // เปิด modal create -> โหลด advisors ถ้ายังไม่โหลด
  const openCreateModal = () => {
    setCreateVisible(true);
    if (advisors.length === 0) loadAdvisors();
  };

  const openDetail = useCallback(async (record) => {
    try {
      const res = await projectService.getProjectWithSummary(record.projectId);
      if (res.success) {
        applyActiveProject(res.data);
        setDetailVisible(true);
        if (advisors.length === 0) loadAdvisors();
      } else {
        message.error(res.message || 'ไม่สามารถเปิดรายละเอียดได้');
      }
    } catch (e) {
      message.error(e.message);
    }
  }, [applyActiveProject, advisors.length, loadAdvisors]);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const payload = {
        ...values,
        tracks: Array.isArray(values.tracks) ? values.tracks.filter(Boolean) : []
      };
      if (!payload.tracks.length) {
        delete payload.tracks;
      }
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
      const payload = {
        ...values,
        tracks: Array.isArray(values.tracks) ? values.tracks.filter(Boolean) : []
      };
      const res = await projectService.updateProject(activeProject.projectId, payload);
      if (res.success) {
        message.success('อัปเดตโครงงานสำเร็จ');
        const refreshed = await projectService.getProjectWithSummary(activeProject.projectId);
        applyActiveProject(refreshed.data);
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
        const refreshed = await projectService.getProjectWithSummary(activeProject.projectId);
        applyActiveProject(refreshed.data);
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
        const refreshed = await projectService.getProjectWithSummary(activeProject.projectId);
        applyActiveProject(refreshed.data);
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
    { title: 'ชื่อโครงงานพิเศษ', dataIndex: 'projectNameTh', key: 'projectNameTh', ellipsis: true },
    { title: 'หมวด', key: 'tracks', width: 220, render: (_, r) => {
      const codes = getTrackCodes(r);
      return codes.length ? codes.map(code => <Tag key={code}>{CODE_TO_LABEL[code] || code}</Tag>) : '-';
    } },
    { title: 'สถานะ', dataIndex: 'status', key: 'status', width: 130, render: s => <Tag color={statusColorMap[s] || 'default'}>{s}</Tag> },
    { title: 'สมาชิก', key: 'members', width: 160, render: (_, r) => (r.members || []).map(m => <Tag key={m.studentId}>{m.role === 'leader' ? 'หัวหน้า' : 'สมาชิก'}</Tag>) },
    { title: 'ดำเนินการ', key: 'action', width: 110, render: (_, r) => <Button size="small" onClick={() => openDetail(r)}>รายละเอียด</Button> }
  ], [getTrackCodes, openDetail]);

  const canActivate = useMemo(() => {
    if (!activeProject) return false;
    const p = activeProject;
    const hasTracks = getTrackCodes(p).length > 0;
    return p.status !== 'in_progress' && p.status !== 'completed' && p.status !== 'archived'
      && p.members?.length === 2
      && p.advisorId
      && p.projectNameTh && p.projectNameEn
      && p.projectType && hasTracks;
  }, [activeProject, getTrackCodes]);

  // สร้าง checklist รายการเงื่อนไข พร้อมสถานะผ่าน/ไม่ผ่าน
  const readinessChecklist = useMemo(() => {
    if (!activeProject) return [];
    const p = activeProject;
    const hasTracks = getTrackCodes(p).length > 0;
    return [
      { key: 'members', label: 'มีสมาชิกครบ 2 คน', pass: (p.members?.length === 2) },
      { key: 'advisor', label: 'เลือกอาจารย์ที่ปรึกษา', pass: !!p.advisorId },
      { key: 'name_th', label: 'ชื่อโครงงานพิเศษภาษาไทย', pass: !!p.projectNameTh },
      { key: 'name_en', label: 'ชื่อโครงงานพิเศษภาษาอังกฤษ', pass: !!p.projectNameEn },
      { key: 'type', label: 'ระบุประเภทโครงงานพิเศษ', pass: !!p.projectType },
      { key: 'track', label: 'ระบุหมวด', pass: hasTracks }
    ];
  }, [activeProject, getTrackCodes]);

  const missingReasons = useMemo(() => readinessChecklist.filter(i => !i.pass).map(i => i.label), [readinessChecklist]);

  const activeTrackCodes = useMemo(() => getTrackCodes(activeProject), [activeProject, getTrackCodes]);

  // แปลง advisors -> options ของ Select
  const trackSelectOptions = useMemo(() => TRACK_OPTIONS.map(({ code, label }) => ({ value: code, label })), []);

  const advisorOptions = useMemo(() => {
    return advisors.map(a => ({
      value: a.teacherId,
      // แสดงรูปแบบ: ชื่อ นามสกุล(รหัสอาจารย์) ตามคำขอ
      label: `${a.firstName} ${a.lastName}(${a.teacherCode || 'N/A'})`
    }));
  }, [advisors]);

  return (
  <Card title={<Space><Title level={4} style={{ margin: 0 }}>โครงงานของฉัน</Title><Button icon={<ReloadOutlined />} onClick={fetchProjects} /></Space>} extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>สร้างโครงงาน</Button>}>
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
          <Form.Item label="ชื่อโครงงานภาษาไทย" name="projectNameTh" rules={[{ required: false }]}> <Input placeholder="เว้นว่างได้ใน Draft" /> </Form.Item>
          <Form.Item label="ชื่อโครงงานภาษาอังกฤษ" name="projectNameEn" rules={[{ required: false }]}> <Input placeholder="Optional ใน Draft" /> </Form.Item>
          <Form.Item label="ประเภท" name="projectType"> <Select allowClear options={[{value:'govern',label:'Govern'},{value:'private',label:'Private'},{value:'research',label:'Research'}]} /> </Form.Item>
          <Form.Item label="หมวด" name="tracks">
            <Select
              mode="multiple"
              allowClear
              options={trackSelectOptions}
              placeholder="เลือกหมวดโครงงาน (เลือกได้หลายหมวด)"
              maxTagCount="responsive"
            />
          </Form.Item>
          <Form.Item label="อาจารย์ที่ปรึกษา" name="advisorId"> 
            <Select 
              allowClear 
              showSearch 
              placeholder={advisorLoading ? 'กำลังโหลด...' : 'เลือกอาจารย์'} 
              notFoundContent={advisorLoading ? 'กำลังโหลด...' : (advisorError ? advisorError : 'ไม่พบข้อมูล')} 
              options={advisorOptions} 
              loading={advisorLoading} 
              onDropdownVisibleChange={(open) => { if (open && advisors.length === 0 && !advisorLoading) loadAdvisors(); }}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            /> 
          </Form.Item>
          <Form.Item label="Co-Advisor" name="coAdvisorId"> 
            <Select 
              allowClear 
              showSearch 
              placeholder="(ไม่บังคับ)" 
              options={advisorOptions} 
              loading={advisorLoading} 
              onDropdownVisibleChange={(open) => { if (open && advisors.length === 0 && !advisorLoading) loadAdvisors(); }}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            /> 
          </Form.Item>
        </Form>
      </Modal>

      {/* Drawer รายละเอียด */}
      <Drawer
        title={activeProject ? `รายละเอียดโครงงาน: ${activeProject.projectNameTh || ''}` : 'รายละเอียดโครงงาน'}
        open={detailVisible}
        width={640}
  onClose={() => { setDetailVisible(false); setActiveProject(null); editForm.resetFields(); }}
        extra={activeProject && <Tag color={statusColorMap[activeProject.status]}>{activeProject.status}</Tag>}
      >
        {activeProject && (
          <>
            <Descriptions column={1} size="small" bordered>
            <Row gutter={[16,16]}>
              <Col span={24}>
                <MilestoneSummary project={activeProject} isLeader={activeProject.members?.some(m => m.role==='leader' && m.studentId === (window.__CURRENT_STUDENT_ID || activeProject.createdByStudentId))} />
              </Col>
            </Row>
            <Divider />
              <Descriptions.Item label="รหัส">{activeProject.projectCode || '-'}</Descriptions.Item>
              <Descriptions.Item label="ปีการศึกษา">{activeProject.academicYear || '-'}</Descriptions.Item>
              <Descriptions.Item label="ภาคเรียน">{activeProject.semester || '-'}</Descriptions.Item>
              <Descriptions.Item label="ประเภทโครงงาน">{activeProject.projectType || '-'}</Descriptions.Item>
              <Descriptions.Item label="หมวด">
                {activeTrackCodes.length
                  ? activeTrackCodes.map(code => (
                    <Tag key={code} color="blue">{CODE_TO_LABEL[code] || code}</Tag>
                  ))
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
            <Divider />
            <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
              <Form.Item label="ชื่อโครงงานภาษาไทย" name="projectNameTh"><Input disabled={['in_progress','completed','archived'].includes(activeProject.status)} /></Form.Item>
              <Form.Item label="ชื่อโครงงานภาษาอังกฤษ" name="projectNameEn"><Input disabled={['in_progress','completed','archived'].includes(activeProject.status)} /></Form.Item>
              <Form.Item label="ประเภท" name="projectType"><Select disabled={['in_progress','completed','archived'].includes(activeProject.status)} allowClear options={[{value:'govern',label:'Govern'},{value:'private',label:'Private'},{value:'research',label:'Research'}]} /></Form.Item>
              <Form.Item label="หมวด" name="tracks">
                <Select
                  mode="multiple"
                  disabled={['in_progress','completed','archived'].includes(activeProject.status)}
                  allowClear
                  options={trackSelectOptions}
                  placeholder="เลือกหมวดโครงงาน"
                  maxTagCount="responsive"
                />
              </Form.Item>
              <Form.Item label="อาจารย์ที่ปรึกษา" name="advisorId">
                <Select 
                  disabled={['in_progress','completed','archived'].includes(activeProject.status)} 
                  allowClear 
                  options={advisorOptions} 
                  loading={advisorLoading}
                  placeholder={advisorLoading ? 'กำลังโหลด...' : 'เลือกอาจารย์'}
                  notFoundContent={advisorLoading ? 'กำลังโหลด...' : (advisorError ? advisorError : 'ไม่พบข้อมูล')} 
                  onOpenChange={(open) => { if (open && advisors.length === 0 && !advisorLoading) loadAdvisors(); }}
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                />
              </Form.Item>
              <Form.Item label="Co-Advisor" name="coAdvisorId">
                <Select 
                  disabled={['in_progress','completed','archived'].includes(activeProject.status)} 
                  allowClear 
                  options={advisorOptions} 
                  loading={advisorLoading}
                  placeholder="(ไม่บังคับ)" 
                  onDropdownVisibleChange={(open) => { if (open && advisors.length === 0 && !advisorLoading) loadAdvisors(); }}
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                />
              </Form.Item>
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
