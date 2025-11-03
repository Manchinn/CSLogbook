import React from 'react';
import { Form, Input, Select, Tooltip } from 'antd';
import { useCreateProjectDraft } from '../createContext';

const StepBasic = () => {
  const { state, setBasic } = useCreateProjectDraft();
  // ล็อกชื่อเมื่อสถานะโครงงานเข้าสู่ in_progress หรือหลังจากนั้น
  const locked = ['in_progress','completed','archived'].includes(state.projectStatus);
  const typeReadOnly = ['completed','archived'].includes(state.projectStatus);
  
  const hasNameTh = !!state.basic.projectNameTh?.trim();
  const hasNameEn = !!state.basic.projectNameEn?.trim();
  const hasType = !!state.basic.projectType;
  
  return (
    <Form layout="vertical">
      <Form.Item 
        label={
          <span>
            ชื่อโครงงานภาษาไทย {locked && <Tooltip title="ล็อกหลังเริ่มดำเนินโครงงาน"><span style={{color:'#aa00ff', fontSize:12}}> (ล็อก)</span></Tooltip>}
          </span>
        } 
        required
        validateStatus={!hasNameTh && state.basic.projectNameTh !== '' ? 'error' : ''}
        help={!hasNameTh && state.basic.projectNameTh !== '' ? 'กรุณากรอกชื่อโครงงานภาษาไทย' : ''}
      >
        <Input 
          value={state.basic.projectNameTh} 
          onChange={e => setBasic({ projectNameTh: e.target.value })} 
          disabled={locked}
          placeholder="กรอกชื่อโครงงานภาษาไทย"
        />
      </Form.Item>
      <Form.Item 
        label={
          <span>
            ชื่อโครงงานภาษาอังกฤษ {locked && <Tooltip title="ล็อกหลังเริ่มดำเนินโครงงาน"><span style={{color:'#aa00ff', fontSize:12}}> (ล็อก)</span></Tooltip>}
          </span>
        } 
        required
        validateStatus={!hasNameEn && state.basic.projectNameEn !== '' ? 'error' : ''}
        help={!hasNameEn && state.basic.projectNameEn !== '' ? 'กรุณากรอกชื่อโครงงานภาษาอังกฤษ' : ''}
      >
        <Input 
          value={state.basic.projectNameEn} 
          onChange={e => setBasic({ projectNameEn: e.target.value })} 
          disabled={locked}
          placeholder="Enter project name in English"
        />
      </Form.Item>
      <Form.Item 
        label="ประเภทโครงงาน" 
        required
        validateStatus={!hasType && state.basic.projectType !== undefined ? 'error' : ''}
        help={!hasType && state.basic.projectType !== undefined ? 'กรุณาเลือกประเภทโครงงาน' : ''}
      >
        <Select
          value={state.basic.projectType}
          placeholder="เลือกประเภทโครงงาน"
          onChange={v => setBasic({ projectType: v })}
          options={[
            { value: 'govern', label: 'องค์กรภายนอก' },
            { value: 'private', label: 'ภาควิชา' },
            { value: 'research', label: 'งานวิจัย' }
          ]}
          disabled={typeReadOnly}
        />
      </Form.Item>
    </Form>
  );
};

export default StepBasic;
