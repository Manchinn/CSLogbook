import React from 'react';
import { Form, Input } from 'antd';
import { useCreateProjectDraft } from '../createContext';

const { TextArea } = Input;

const StepDetails = () => {
  const { state, setDetails } = useCreateProjectDraft();
  return (
    <Form layout="vertical">
      <Form.Item label="ปัญหา / Pain Point (Problem)">
        <TextArea rows={3} value={state.details.problem} onChange={e => setDetails({ problem: e.target.value })} placeholder="อธิบายปัญหาหรือ Pain Point" />
      </Form.Item>
      <Form.Item label="ที่มา / เหตุผล (Background)">
        <TextArea rows={3} value={state.details.background} onChange={e => setDetails({ background: e.target.value })} placeholder="ที่มาของโครงงาน / เหตุผลความสำคัญ" />
      </Form.Item>
      <Form.Item label="เป้าหมาย / Objectives">
        <TextArea rows={3} value={state.details.objective} onChange={e => setDetails({ objective: e.target.value })} placeholder="วัตถุประสงค์หลัก" />
      </Form.Item>
      <Form.Item label="ผลลัพธ์ที่คาดหวัง (Expected Outcome)">
        <TextArea rows={3} value={state.details.expectedOutcome} onChange={e => setDetails({ expectedOutcome: e.target.value })} placeholder="ระบบ/ผลลัพธ์ที่จะได้เมื่อเสร็จ" />
      </Form.Item>
      <Form.Item label="ประโยชน์ที่จะได้รับ (Benefit)">
        <TextArea rows={3} value={state.details.benefit} onChange={e => setDetails({ benefit: e.target.value })} placeholder="ใครจะได้ประโยชน์ / อย่างไร" />
      </Form.Item>
      <Form.Item label="ขอบเขต / Scope">
        <TextArea rows={3} value={state.details.scope} onChange={e => setDetails({ scope: e.target.value })} placeholder="สิ่งที่จะทำ/ไม่ทำ" />
      </Form.Item>
      <Form.Item label="เครื่องมือ / เทคโนโลยี (Tools)">
        <TextArea rows={2} value={state.details.tools} onChange={e => setDetails({ tools: e.target.value })} placeholder="เช่น React, Node.js, MySQL" />
      </Form.Item>
    </Form>
  );
};

export default StepDetails;
