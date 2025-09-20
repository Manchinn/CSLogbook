import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, Typography, Tag, message } from 'antd';
import { useCreateProjectDraft } from '../createContext';
import projectService from '../../../../../services/projectService';

const studentCodeRegex = /^[0-9]{5,13}$/;

const StepMembers = () => {
  const { state, setMembers, setMembersStatus } = useCreateProjectDraft();
  const [member2, setMember2] = useState(state.members.secondMemberCode || '');

  const errs = [];
  if (member2 && !studentCodeRegex.test(member2)) errs.push('รหัสนิสิตคนที่ 2 ไม่ถูกต้อง');
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
        setMembersStatus({ syncing: false, synced: true });
        message.success('เพิ่มสมาชิกคนที่ 2 เรียบร้อย');
      } else {
        setMembersStatus({ syncing: false, error: 'เพิ่มสมาชิกไม่สำเร็จ' });
        message.error('เพิ่มสมาชิกไม่สำเร็จ');
      }
    } catch (e) {
      setMembersStatus({ syncing: false, error: e.message || 'เพิ่มสมาชิกไม่สำเร็จ' });
      message.error(e.message || 'เพิ่มสมาชิกไม่สำเร็จ');
    }
  };

  const handleApply = async () => {
    const changed = member2 !== state.members.secondMemberCode;
    setMembers({ secondMemberCode: member2 || '' });
    if (changed) {
      // reset สถานะเพื่อให้ sync ใหม่ได้
      setMembersStatus({ synced: false, error: null });
    }
    // ถ้ามี projectId แล้วลอง sync ทันที
    if (state.projectId) {
      await syncSecondMember(member2);
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
      <Typography.Paragraph>เพิ่มสมาชิก (ไม่บังคับครบตอนนี้)</Typography.Paragraph>
      <Form layout="vertical">
        <Form.Item label="รหัสนิสิตคนที่ 2">
          <Input value={member2} onChange={e => setMember2(e.target.value)} placeholder="ถ้ามี" />
        </Form.Item>
        {/* Step สำหรับ member3 จะเพิ่มภายหลัง */}
        {errs.length > 0 && <Space direction="vertical" style={{ marginBottom: 16 }}>{errs.map(er => <Tag color="red" key={er}>{er}</Tag>)}</Space>}
        <Button
          type="primary"
          onClick={handleApply}
          disabled={errs.length > 0 || state.members.syncing}
          loading={state.members.syncing}
        >
          {state.projectId ? 'บันทึก & Sync' : 'บันทึกในดราฟท์'}
        </Button>
      </Form>
      <div style={{ marginTop: 16 }}>
        <Typography.Text>สถานะสมาชิกปัจจุบัน:</Typography.Text>
        <div>
          <Tag color="green">คนที่ 1 (คุณ)</Tag>
          {state.members.secondMemberCode && <Tag color="blue">คนที่ 2: {state.members.secondMemberCode}</Tag>}
          {!state.members.secondMemberCode && <Typography.Text type="secondary"> ยังไม่มีสมาชิกเพิ่ม </Typography.Text>}
        </div>
        <div style={{ marginTop: 8 }}>
          {!state.projectId && state.members.secondMemberCode && <Tag color="gold">ยังไม่สร้าง Draft</Tag>}
          {state.projectId && state.members.secondMemberCode && !state.members.synced && !state.members.syncing && !state.members.error && (
            <Tag color="orange">ยังไม่เพิ่มลงฐานข้อมูล</Tag>
          )}
            {state.members.syncing && <Tag color="processing">กำลังเพิ่ม...</Tag>}
            {state.members.synced && <Tag color="green">บันทึกแล้ว</Tag>}
            {state.members.error && <Tag color="red">{state.members.error}</Tag>}
        </div>
      </div>
    </div>
  );
};

export default StepMembers;
