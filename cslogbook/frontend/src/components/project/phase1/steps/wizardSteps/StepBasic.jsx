import React from 'react';
import { Form, Input, Select, Tooltip } from 'antd';
import { useCreateProjectDraft } from '../createContext';

const StepBasic = () => {
  const { state, setBasic } = useCreateProjectDraft();
  // ล็อกชื่อเมื่อสถานะโครงงานเข้าสู่ in_progress หรือหลังจากนั้น
  const locked = ['in_progress','completed','archived'].includes(state.projectStatus);
  return (
    <Form layout="vertical">
      <Form.Item label={
        <span>
          ชื่อโครงงานภาษาไทย {locked && <Tooltip title="ล็อกหลังเริ่มดำเนินโครงงาน"><span style={{color:'#aa00ff', fontSize:12}}> (ล็อก)</span></Tooltip>}
        </span>
      } required>
        <Input value={state.basic.projectNameTh} onChange={e => setBasic({ projectNameTh: e.target.value })} disabled={locked} />
      </Form.Item>
      <Form.Item label={
        <span>
          ชื่อโครงงานภาษาอังกฤษ {locked && <Tooltip title="ล็อกหลังเริ่มดำเนินโครงงาน"><span style={{color:'#aa00ff', fontSize:12}}> (ล็อก)</span></Tooltip>}
        </span>
      } required>
        <Input value={state.basic.projectNameEn} onChange={e => setBasic({ projectNameEn: e.target.value })} disabled={locked} />
      </Form.Item>
      <Form.Item label="ประเภทโครงงาน">
        <Select
          value={state.basic.projectType}
          allowClear
          placeholder="เลือกหรือใส่ภายหลัง"
          onChange={v => setBasic({ projectType: v })}
          options={[
            { value: 'govern', label: 'ทำให้องค์กรภายนอก' },
            { value: 'private', label: 'ทำให้ภาควิชา' },
            { value: 'research', label: 'งานวิจัย' }
          ]}
        />
      </Form.Item>
    </Form>
  );
};

export default StepBasic;
