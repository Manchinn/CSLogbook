import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, Typography, Tag, message, Tooltip, Alert } from 'antd';
import { useCreateProjectDraft } from '../createContext';
import projectService from 'features/project/services/projectService';
import { studentService } from 'features/user-management/services/studentService';

const studentCodeRegex = /^[0-9]{5,13}$/;

const StepMembers = () => {
  const { state, setMembers, setMembersStatus } = useCreateProjectDraft();
  const [member2, setMember2] = useState(state.members.secondMemberCode || '');
  // ล็อกการแก้ไขสมาชิกเมื่อโครงงานเข้าสู่ in_progress หรือหลังจากนั้น
  const memberLocked = ['in_progress','completed','archived'].includes(state.projectStatus);

  useEffect(() => {
    setMember2(state.members.secondMemberCode || '');
  }, [state.members.secondMemberCode]);

  const errs = [];
  if (member2 && !studentCodeRegex.test(member2)) errs.push('รหัสนักศึกษาคนที่ 2 ไม่ถูกต้อง');
  // เวอร์ชันนี้ยังรองรับแค่ member2 (ออกแบบเผื่อขยาย member3 ในรอบหน้า)

  // ฟังก์ชันพยายาม sync สมาชิกคนที่ 2 ไป backend
  const syncSecondMember = async (code) => {
    if (!state.projectId) return; // ยังไม่มี draft id
    if (!code || !studentCodeRegex.test(code)) return; // โค้ดไม่ valid
    if (state.members.syncing || state.members.synced) return; // กำลัง sync หรือเคยสำเร็จแล้ว

    try {
      setMembersStatus({ syncing: true, error: null });
      const res = await projectService.addMember(state.projectId, code);
      if (res?.success) {
  setMembersStatus({ syncing: false, synced: true, validated: true });
        message.success('เพิ่มสมาชิกคนที่ 2 เรียบร้อย');
      } else {
  setMembersStatus({ syncing: false, synced: false, validated: false, error: 'เพิ่มสมาชิกไม่สำเร็จ' });
        message.error('เพิ่มสมาชิกไม่สำเร็จ');
      }
    } catch (e) {
  setMembersStatus({ syncing: false, synced: false, validated: false, error: e.message || 'เพิ่มสมาชิกไม่สำเร็จ' });
      message.error(e.message || 'เพิ่มสมาชิกไม่สำเร็จ');
    }
  };

  const handleApply = async () => {
  const trimmedCode = (member2 || '').trim();
  const changed = trimmedCode !== (state.members.secondMemberCode || '');
  setMember2(trimmedCode);
  setMembers({ secondMemberCode: trimmedCode });
    if (changed) {
      // reset สถานะเพื่อให้ sync ใหม่ได้
      setMembersStatus({ synced: false, syncing: false, validated: false, error: null });
    }
    if (!trimmedCode) {
      if (changed) {
        message.success('ลบข้อมูลสมาชิกคนที่ 2 แล้ว');
      }
      return;
    }

    if (!studentCodeRegex.test(trimmedCode)) {
      message.warning('กรุณากรอกรหัสนักศึกษาคนที่ 2 ให้ถูกต้อง');
      return;
    }

    if (!state.projectId) {
      try {
        const res = await studentService.getStudentInfo(trimmedCode);
        if (!res?.success || !res?.data) {
          throw new Error(res?.message || 'ไม่พบข้อมูลนักศึกษา');
        }
        setMembersStatus({ synced: false, validated: true, error: null });
        message.success('ตรวจสอบรหัสนักศึกษาคนที่ 2 สำเร็จ ระบบจะซิงค์หลังสร้าง Draft');
      } catch (err) {
        setMembersStatus({ synced: false, validated: false, error: err.message || 'ไม่พบข้อมูลนักศึกษา' });
        message.error(err.message || 'ไม่พบข้อมูลนักศึกษา');
      }
      return;
    }

    // ถ้ามี projectId แล้วลอง sync ทันที
    if (state.projectId) {
      await syncSecondMember(trimmedCode);
    }
  };

  // กรณี user สร้าง draft project ทีหลัง (กดปุ่มสร้าง Draft ใน Review) แล้วกลับมาหน้านี้อยากให้ auto sync ถ้ามี code
  useEffect(() => {
    if (state.projectId && state.members.secondMemberCode && !state.members.synced && !state.members.syncing) {
      syncSecondMember(state.members.secondMemberCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.projectId]);

  return (
    <div>
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="โครงงานพิเศษต้องมีสมาชิก 2 คน"
        description="กรุณาระบุรหัสนักศึกษาคนที่ 2 เพื่อให้สามารถสร้างโครงงานได้"
      />
      <Typography.Paragraph>สมาชิกโครงงาน {memberLocked && <Tooltip title="ล็อกหลังเริ่มดำเนินโครงงาน"><span style={{color:'#aa00ff', fontSize:12}}> (ล็อก)</span></Tooltip>}</Typography.Paragraph>
      <Form layout="vertical">
        <Form.Item label="รหัสนักศึกษาคนที่ 2 (บังคับ)" required>
          <Input value={member2} onChange={e => setMember2(e.target.value)} placeholder="กรอกรหัสนักศึกษา 13 หลัก" disabled={memberLocked} />
        </Form.Item>
        {/* Step สำหรับ member3 จะเพิ่มภายหลัง */}
        {errs.length > 0 && <Space direction="vertical" style={{ marginBottom: 16 }}>{errs.map(er => <Tag color="red" key={er}>{er}</Tag>)}</Space>}
        {!memberLocked && (
          <Button
            type="primary"
            onClick={handleApply}
            disabled={errs.length > 0 || state.members.syncing}
            loading={state.members.syncing}
          >
            {state.projectId ? 'บันทึก & Sync' : 'บันทึกในดราฟท์'}
          </Button>
        )}
      </Form>
      <div style={{ marginTop: 16 }}>
        <Typography.Text>สถานะสมาชิกปัจจุบัน:</Typography.Text>
        <div>
          <Tag color="green">คนที่ 1 (คุณ)</Tag>
          {state.members.secondMemberCode && <Tag color="blue">คนที่ 2: {state.members.secondMemberCode}</Tag>}
          {!state.members.secondMemberCode && <Typography.Text type="secondary"> ยังไม่มีสมาชิกเพิ่ม </Typography.Text>}
        </div>
        <div style={{ marginTop: 8 }}>
          {!memberLocked && !state.projectId && state.members.secondMemberCode && <Tag color="gold">ยังไม่สร้าง Draft</Tag>}
          {!memberLocked && !state.projectId && state.members.secondMemberCode && state.members.validated && !state.members.error && <Tag color="geekblue">ตรวจสอบแล้ว</Tag>}
          {!memberLocked && state.projectId && state.members.secondMemberCode && !state.members.synced && !state.members.syncing && !state.members.error && (
            <Tag color="orange">ยังไม่เพิ่มลงฐานข้อมูล</Tag>
          )}
          {!memberLocked && state.members.syncing && <Tag color="processing">กำลังเพิ่ม...</Tag>}
          {state.members.synced && <Tag color="green">บันทึกแล้ว</Tag>}
          {state.members.error && <Tag color="red">{state.members.error}</Tag>}
          {memberLocked && <Tag color="purple">ล็อก (สถานะโครงงาน: {state.projectStatus})</Tag>}
        </div>
      </div>
    </div>
  );
};

export default StepMembers;
