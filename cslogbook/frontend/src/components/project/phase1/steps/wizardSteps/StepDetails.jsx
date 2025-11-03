import React from 'react';
import { Form, Input } from 'antd';
import { useCreateProjectDraft } from '../createContext';

const { TextArea } = Input;

const StepDetails = () => {
  const { state, setDetails } = useCreateProjectDraft();
  const readOnlyAll = ['completed','archived'].includes(state.projectStatus);
  
  const hasBackground = !!state.details.background?.trim();
  const hasObjective = !!state.details.objective?.trim();
  const hasBenefit = !!state.details.benefit?.trim();
  
  return (
    <Form layout="vertical">
      <Form.Item 
        label="ที่มา / เหตุผล" 
        required
        validateStatus={!hasBackground && state.details.background !== '' ? 'error' : ''}
        help={!hasBackground && state.details.background !== '' ? 'กรุณากรอกที่มา / เหตุผล' : ''}
      >
        <TextArea 
          rows={4} 
          value={state.details.background} 
          onChange={e => setDetails({ background: e.target.value })} 
          placeholder="ที่มาของโครงงาน / ปัญหาที่ต้องการแก้ไข / เหตุผลความสำคัญ" 
          disabled={readOnlyAll} 
        />
      </Form.Item>
      <Form.Item 
        label="เป้าหมาย" 
        required
        validateStatus={!hasObjective && state.details.objective !== '' ? 'error' : ''}
        help={!hasObjective && state.details.objective !== '' ? 'กรุณากรอกเป้าหมาย' : ''}
      >
        <TextArea 
          rows={4} 
          value={state.details.objective} 
          onChange={e => setDetails({ objective: e.target.value })} 
          placeholder="วัตถุประสงค์หลักของโครงงาน / สิ่งที่ต้องการบรรลุ" 
          disabled={readOnlyAll} 
        />
      </Form.Item>
      <Form.Item 
        label="ประโยชน์ที่จะได้รับ" 
        required
        validateStatus={!hasBenefit && state.details.benefit !== '' ? 'error' : ''}
        help={!hasBenefit && state.details.benefit !== '' ? 'กรุณากรอกประโยชน์ที่จะได้รับ' : ''}
      >
        <TextArea 
          rows={4} 
          value={state.details.benefit} 
          onChange={e => setDetails({ benefit: e.target.value })} 
          placeholder="ใครจะได้ประโยชน์ / ได้ประโยชน์อย่างไร" 
          disabled={readOnlyAll} 
        />
      </Form.Item>
    </Form>
  );
};

export default StepDetails;
