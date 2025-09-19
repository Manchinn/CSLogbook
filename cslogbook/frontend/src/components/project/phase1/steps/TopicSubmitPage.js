import React, { useEffect, useState, useRef } from 'react';
import { Form, Input, Select, Button, Space, Typography, Tag, Divider, Checkbox } from 'antd';
import { TRACK_OPTIONS, CODE_TO_LABEL, LABEL_TO_CODE } from '../../../../constants/projectTracks';
import useStudentProject from '../../../../hooks/useStudentProject';

// TopicSubmitPage
// ฟอร์มรวม Step "เสนอหัวข้อ" (สร้าง/แก้ไข Metadata + เพิ่มสมาชิกคนที่สอง)
// NOTE: โค้ดนี้ย่อ logic จาก ProjectDashboard ให้เป็น single-page experience

const { Title, Paragraph, Text } = Typography;

const TopicSubmitPage = () => {
  const [form] = Form.useForm();
  const [memberInput, setMemberInput] = useState('');
  const [memberError, setMemberError] = useState(null);
  // readiness preview สำหรับกรณียังไม่สร้างโครงงาน
  const [readinessPreview, setReadinessPreview] = useState([]);

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
      // รองรับทั้งโครงงานรุ่นใหม่ (tracks: [code]) และ legacy (track: comma labels หรือ code เดี่ยว)
      let codes = [];
      if (Array.isArray(activeProject.tracks) && activeProject.tracks.length) {
        codes = activeProject.tracks; // already codes
      } else if (activeProject.track) {
        const parts = activeProject.track.split(',').map(s => s.trim()).filter(Boolean);
        codes = parts.map(p => LABEL_TO_CODE[p] || p); // แปลง label -> code; ถ้า p เป็น code อยู่แล้วก็ใช้ได้
      }
      form.setFieldsValue({
        projectNameTh: activeProject.projectNameTh,
        projectNameEn: activeProject.projectNameEn,
        projectType: activeProject.projectType,
        tracks: codes,
        advisorId: activeProject.advisorId || undefined,
        coAdvisorId: activeProject.coAdvisorId || undefined,
        objective: activeProject.objective || undefined,
        background: activeProject.background || undefined,
        scope: activeProject.scope || undefined,
        expectedOutcome: activeProject.expectedOutcome || undefined,
        benefit: activeProject.benefit || undefined,
        tools: activeProject.tools || undefined
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
    // ส่ง tracks array ตรง (backend รุ่นใหม่รองรับ) + ตัด logic รวม string
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

  // ---------------- Auto-Save Debounce Logic ----------------
  const debounceTimerRef = useRef(null);
  const lastSavedHashRef = useRef('');
  const AUTO_SAVE_DELAY = 1200; // ms

  // ฟังก์ชันสร้าง payload สำหรับ compare
  const buildPayloadSnapshot = (vals) => {
    const pick = (({ projectNameTh, projectNameEn, projectType, tracks, advisorId, coAdvisorId, objective, background, scope, expectedOutcome, benefit, tools }) => ({ projectNameTh, projectNameEn, projectType, tracks, advisorId, coAdvisorId, objective, background, scope, expectedOutcome, benefit, tools }))(vals);
    return JSON.stringify(pick);
  };

  // Handler สำหรับ onValuesChange (Antd v5) ใช้แทน hack เดิม
  const handleValuesChange = (_, allValues) => {
    // ถ้ายังไม่มี project: อัปเดต readiness preview อย่างเดียว
    if (!hasProject) {
      const tags = [
        { key: 'members', label: 'สมาชิกครบ 2 คน', pass: false }, // ยังไม่มี member ตอนยังไม่สร้าง
        { key: 'advisor', label: 'เลือกอาจารย์ที่ปรึกษา', pass: !!allValues.advisorId },
        { key: 'name_th', label: 'ชื่อ TH', pass: !!allValues.projectNameTh },
        { key: 'name_en', label: 'ชื่อ EN', pass: !!allValues.projectNameEn },
        { key: 'type', label: 'ประเภทโครงงาน', pass: !!allValues.projectType },
        { key: 'track', label: 'Track', pass: Array.isArray(allValues.tracks) && allValues.tracks.length > 0 }
      ];
      setReadinessPreview(tags);
      return; // ยังไม่ autosave เพราะยังไม่มี project
    }
  if (isLocked) return;
  const snapshot = buildPayloadSnapshot(allValues);
  if (snapshot === lastSavedHashRef.current) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        lastSavedHashRef.current = snapshot;
        // สร้าง diff เฉพาะ field ที่เปลี่ยน (ลด noise) และกัน undefined overwrite
        const payload = {
          projectNameTh: allValues.projectNameTh ?? '',
          projectNameEn: allValues.projectNameEn ?? '',
          projectType: allValues.projectType ?? '',
          tracks: allValues.tracks || [],
          advisorId: allValues.advisorId ?? null,
          coAdvisorId: allValues.coAdvisorId ?? null,
          objective: allValues.objective ?? '',
          background: allValues.background ?? '',
          scope: allValues.scope ?? '',
          expectedOutcome: allValues.expectedOutcome ?? '',
          benefit: allValues.benefit ?? '',
          tools: allValues.tools ?? ''
        };
        await updateProject(payload);
      } catch (e) {
        // TODO: อาจเพิ่ม notification แจ้ง error
      }
    }, AUTO_SAVE_DELAY);
  };

  // ตั้งค่า hash เริ่มต้นหลัง sync ฟอร์มกับ activeProject
  useEffect(() => {
    if (hasProject) {
      const vals = form.getFieldsValue();
      lastSavedHashRef.current = buildPayloadSnapshot(vals);
    } else {
      lastSavedHashRef.current = '';
      // คำนวณ readiness เริ่มต้น (ทั้งหมดไม่ผ่าน)
      setReadinessPreview([
        { key: 'members', label: 'สมาชิกครบ 2 คน', pass: false },
        { key: 'advisor', label: 'เลือกอาจารย์ที่ปรึกษา', pass: false },
        { key: 'name_th', label: 'ชื่อ TH', pass: false },
        { key: 'name_en', label: 'ชื่อ EN', pass: false },
        { key: 'type', label: 'ประเภทโครงงาน', pass: false },
        { key: 'track', label: 'Track', pass: false }
      ]);
    }
  }, [hasProject, form]);

  return (
    <Space direction="vertical" style={{ width: '100%', padding: '4px 0' }} size="large">
      <Space align="start" style={{ justifyContent:'space-between', width:'100%' }} wrap>
        <Space direction="vertical" size={4} style={{ flex: 1, minWidth: 260 }}>
          <Title level={4} style={{ margin: 0 }}>เสนอหัวข้อโครงงาน</Title>
          {hasProject && (
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <Space size={[4,4]} wrap>
                {(activeProject.tracks || []).map(code => (
                  <Tag key={code} color="geekblue">{CODE_TO_LABEL[code] || code}</Tag>
                ))}
                {activeProject.projectType && <Tag color="purple">ประเภท: {activeProject.projectType}</Tag>}
              </Space>
              {(activeProject.projectNameTh || activeProject.projectNameEn) && (
                <div style={{ fontSize: 13 }}>
                  {activeProject.projectNameTh && <span><b>TH:</b> {activeProject.projectNameTh} </span>}
                  {activeProject.projectNameEn && <span style={{ marginLeft: 8 }}><b>EN:</b> {activeProject.projectNameEn}</span>}
                </div>
              )}
            </Space>
          )}
        </Space>
        {hasProject && <Tag color={activeProject.status === 'draft' ? 'default' : 'processing'}>{activeProject.status}</Tag>}
      </Space>
      {loading && <Text type="secondary">กำลังโหลด...</Text>}
        {!hasProject && (
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            ยังไม่มีโครงงานในระบบ สร้างโครงงานใหม่พร้อม (ชื่อ / ประเภท / Track / Advisor) ได้ที่ฟอร์มด้านล่าง หากยังไม่พร้อมใส่ครบ สามารถระบุบางช่องไว้ก่อนแล้วอัปเดตภายหลัง
          </Paragraph>
        )}
  <Form form={form} layout="vertical" disabled={isLocked} onValuesChange={handleValuesChange}>
          <Form.Item label="ชื่อโครงงานภาษาไทย" name="projectNameTh" rules={[{ required: false }]}> <Input placeholder="กรอกชื่อโครงงานภาษาไทย" /> </Form.Item>
          <Form.Item label="ชื่อโครงงานภาษาอังกฤษ" name="projectNameEn" rules={[{ required: false }]}> <Input placeholder="กรอกชื่อโครงงานภาษาอังกฤษ" /> </Form.Item>
          <Form.Item label="ประเภทของโครงงาน" name="projectType"> <Select allowClear options={[{value:'govern',label:'ทำให้กับหน่วยงานหรือองค์กรภายนอก เช่น บริษัทเอกชน และ หน่วยงานของภาครัฐ'},{value:'private',label:'ทำให้กับภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ'},{value:'research',label:'คิดค้นขึ้นเอง หรือเป็นงานวิจัย'}]} /> </Form.Item>
          {/* หมวดของโครงงาน (เลือกได้หลายหมวด) */}
          <Form.Item label={
            <Space size={4}>
              <span>หมวดของโครงงาน</span>
              <Tag color="blue" style={{ marginLeft: 4 }}>เลือกได้หลายหมวด</Tag>
            </Space>
          } name="tracks">
            <Checkbox.Group style={{ width: '100%' }}>
              <Space direction="vertical">
                {TRACK_OPTIONS.map(opt => (
                  <Checkbox key={opt.code} value={opt.code}>{opt.label}</Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
          <Form.Item label="อาจารย์ที่ปรึกษา" name="advisorId">
            <Select
              allowClear
              showSearch
              placeholder={advisorLoading ? 'กำลังโหลด...' : 'เลือกอาจารย์ หากยังไม่แน่ใจเว้นว่างไว้ก่อน'}
              notFoundContent={advisorLoading ? 'กำลังโหลด...' : (advisorError ? advisorError : 'ไม่พบข้อมูล')}
              options={advisorOptions}
              loading={advisorLoading}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
          <Form.Item label="อาจารย์ที่ปรึกษาร่วม" name="coAdvisorId">
            <Select
              allowClear
              showSearch
              placeholder="(ไม่บังคับ)"
              options={advisorOptions}
              loading={advisorLoading}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>

          {/* ---------------- Section: รายละเอียดแบบฟอร์มเสนอหัวข้อ (คพ.01) ---------------- */}
          <Divider orientation="left" style={{ marginTop: 8 }}>รายละเอียดข้อเสนอ (คพ.01)</Divider>
          <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
            ส่วนนี้ใช้บันทึกรายละเอียดจากแบบฟอร์มเสนอหัวข้อโครงงานพิเศษ (คพ.01) สามารถกรอกบางส่วนแล้วกลับมาแก้ไขได้ก่อนเปิดสถานะดำเนินโครงงาน (in_progress)
          </Typography.Paragraph>
          <Form.Item name="objective" label="วัตถุประสงค์ (Objective)">
            <Input.TextArea rows={3} placeholder="อธิบายเป้าหมายหลักของโครงงาน" />
          </Form.Item>
          <Form.Item name="background" label="ที่มา / ปัญหา / เหตุผล (Background)">
            <Input.TextArea rows={3} placeholder="สภาพปัญหา หรือเหตุผลที่เลือกทำ" />
          </Form.Item>
            <Form.Item name="scope" label="ขอบเขตงาน (Scope)">
              <Input.TextArea rows={3} placeholder="สิ่งที่จะทำและไม่ทำ" />
            </Form.Item>
            <Form.Item name="expectedOutcome" label="ผลลัพธ์ที่คาดหวัง (Expected Outcome)">
              <Input.TextArea rows={3} placeholder="สิ่งที่จะส่งมอบ / คุณลักษณะสำคัญ" />
            </Form.Item>
            <Form.Item name="benefit" label="ประโยชน์ที่จะได้รับ (Benefits)">
              <Input.TextArea rows={3} placeholder="ผู้ใช้หรือระบบได้อะไร" />
            </Form.Item>
            {/* ลบ Methodology, Timeline, Risks, Constraints ตามคำขอ เหลือ tools ไว้? -> ผู้ใช้ขอลบเฉพาะ 4 ฟิลด์นี้, tools ยังอยู่หรือไม่? ระบุว่าขอลบ Methodology/Timeline/Risks/Constraints */}
            <Form.Item name="tools" label="เครื่องมือ / เทคโนโลยี (Tools & Tech)">
              <Input.TextArea rows={3} placeholder="ภาษา Framework DB เครื่องมือรองรับ" />
            </Form.Item>
          <Space>
            {!hasProject && <Button type="primary" loading={creating} onClick={handleCreate}>สร้างโครงงาน</Button>}
            {hasProject && <Button type="primary" loading={updating} onClick={handleUpdate} disabled={isLocked}>บันทึกการแก้ไข</Button>}
          </Space>
        </Form>
        {/* ส่วนสมาชิก + readiness */}
        <Divider />
        <Title level={5} style={{ marginTop: 0 }}>สมาชิก</Title>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {hasProject ? (
            <>
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
            </>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>ยังไม่สร้างโครงงาน จะแสดงสมาชิกหลังสร้าง (ระบบจะถือว่าขาดสมาชิกสำหรับ readiness)</Text>
          )}
        </Space>
        <Divider />
        <Title level={5} style={{ marginTop: 0 }}>ความพร้อมเบื้องต้น</Title>
        <Space wrap>
          {(hasProject ? readinessChecklist : readinessPreview).map(item => (
            <Tag key={item.key} color={item.pass ? 'green' : 'red'}>{item.pass ? 'ผ่าน - ' : 'ยังไม่ครบ - '}{item.label}</Tag>
          ))}
        </Space>
      
    </Space>
  );
};

export default TopicSubmitPage;
