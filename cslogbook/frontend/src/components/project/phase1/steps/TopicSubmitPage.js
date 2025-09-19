import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Space, Typography, Tag, Divider } from 'antd';
import useStudentProject from '../../../../hooks/useStudentProject';

// TopicSubmitPage
// ฟอร์มรวม Step "เสนอหัวข้อ" (สร้าง/แก้ไข Metadata + เพิ่มสมาชิกคนที่สอง)
// NOTE: โค้ดนี้ย่อ logic จาก ProjectDashboard ให้เป็น single-page experience

const { Title, Paragraph, Text } = Typography;

const TopicSubmitPage = () => {
  const [form] = Form.useForm();
  const [memberInput, setMemberInput] = useState('');
  const [memberError, setMemberError] = useState(null);

  const {
    activeProject,
    advisors,
    readiness: readinessChecklist,
    loading,
    advisorLoading,
    advisorError,
    creating,
    updating,
    addingMember,
    createProject,
    updateProject,
    addMember
  } = useStudentProject();

  // เมื่อ activeProject เปลี่ยนให้ sync ค่าเข้า form
  useEffect(() => {
    if (activeProject) {
      form.setFieldsValue({
        projectNameTh: activeProject.projectNameTh,
        projectNameEn: activeProject.projectNameEn,
        projectType: activeProject.projectType,
        track: activeProject.track,
        advisorId: activeProject.advisorId || undefined,
        coAdvisorId: activeProject.coAdvisorId || undefined
      });
    } else {
      form.resetFields();
    }
  }, [activeProject, form]);

  const hasProject = !!activeProject;
  const isLocked = hasProject && ['in_progress','completed','archived'].includes(activeProject.status);

  const advisorOptions = advisors.map(a => ({ value: a.teacherId, label: `${a.firstName} ${a.lastName}(${a.teacherCode || 'N/A'})` }));

  const handleCreate = async () => {
    const values = await form.validateFields();
    await createProject(values);
  };

  const handleUpdate = async () => {
    if (!activeProject) return;
    const values = await form.validateFields();
    await updateProject(values);
  };

  const handleAddMember = async () => {
    if (!activeProject) return;
    setMemberError(null);
    const code = (memberInput || '').trim();
    if (!code) { setMemberError('กรุณากรอกรหัสนักศึกษา'); return; }
    if (!/^[0-9]{5,13}$/.test(code)) { setMemberError('รูปแบบรหัสไม่ถูกต้อง'); return; }
    if (activeProject.members?.some(m => m.studentCode === code)) { setMemberError('มีนักศึกษานี้แล้ว'); return; }
    if (activeProject.members?.length >= 2) { setMemberError('ครบ 2 คนแล้ว'); return; }
    const res = await addMember(code);
    if (!res.success) setMemberError(res.message || 'เพิ่มสมาชิกไม่สำเร็จ');
    else setMemberInput('');
  };

  return (
    <Space direction="vertical" style={{ width: '100%', padding: '4px 0' }} size="large">
      <Space align="center" wrap style={{ justifyContent:'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>เสนอหัวข้อโครงงาน</Title>
        {hasProject && <Tag color={activeProject.status === 'draft' ? 'default' : 'processing'}>{activeProject.status}</Tag>}
      </Space>
      {loading && <Text type="secondary">กำลังโหลด...</Text>}
        {!hasProject && (
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            ยังไม่มีโครงงานในระบบ สร้างโครงงานใหม่พร้อม (ชื่อ / ประเภท / Track / Advisor) ได้ที่ฟอร์มด้านล่าง หากยังไม่พร้อมใส่ครบ สามารถระบุบางช่องไว้ก่อนแล้วอัปเดตภายหลัง
          </Paragraph>
        )}
        <Form form={form} layout="vertical" disabled={isLocked}>
          <Form.Item label="ชื่อโครงงาน (TH)" name="projectNameTh" rules={[{ required: false }]}> <Input placeholder="เว้นว่างได้ใน Draft" /> </Form.Item>
          <Form.Item label="ชื่อโครงงาน (EN)" name="projectNameEn" rules={[{ required: false }]}> <Input placeholder="Optional" /> </Form.Item>
          <Form.Item label="ประเภท" name="projectType"> <Select allowClear options={[{value:'govern',label:'Govern'},{value:'private',label:'Private'},{value:'research',label:'Research'}]} /> </Form.Item>
          <Form.Item label="Track" name="track"> <Input placeholder="AI / SE / Network" /> </Form.Item>
          <Form.Item label="อาจารย์ที่ปรึกษา" name="advisorId">
            <Select
              allowClear
              showSearch
              placeholder={advisorLoading ? 'กำลังโหลด...' : 'เลือกอาจารย์'}
              notFoundContent={advisorLoading ? 'กำลังโหลด...' : (advisorError ? advisorError : 'ไม่พบข้อมูล')}
              options={advisorOptions}
              loading={advisorLoading}
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
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
          <Space>
            {!hasProject && <Button type="primary" loading={creating} onClick={handleCreate}>สร้างโครงงาน</Button>}
            {hasProject && <Button type="primary" loading={updating} onClick={handleUpdate} disabled={isLocked}>บันทึกการแก้ไข</Button>}
          </Space>
        </Form>
        {hasProject && (
          <>
            <Divider />
            <Title level={5} style={{ marginTop: 0 }}>สมาชิก</Title>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Space wrap>
                {(activeProject.members || []).map(m => (
                  <Tag key={m.studentId} color={m.role === 'leader' ? 'blue' : 'default'}>{m.name || m.studentCode || m.studentId} ({m.role === 'leader' ? 'หัวหน้า' : 'สมาชิก'})</Tag>
                ))}
              </Space>
              {activeProject.members?.length < 2 && !isLocked && (
                <div style={{ maxWidth: 320 }}>
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
                  <Text type="secondary" style={{ fontSize: 11 }}>ต้องมีสมาชิก 2 คน (หัวหน้า + สมาชิก)</Text>
                </div>
              )}
            </Space>
            <Divider />
            <Title level={5} style={{ marginTop: 0 }}>ความพร้อมเบื้องต้น</Title>
            <Space wrap>
              {readinessChecklist.map(item => (
                <Tag key={item.key} color={item.pass ? 'green' : 'red'}>{item.pass ? 'ผ่าน - ' : 'ยังไม่ครบ - '}{item.label}</Tag>
              ))}
            </Space>
          </>
        )}
      
    </Space>
  );
};

export default TopicSubmitPage;
