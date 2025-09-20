import React from 'react';
import { Form, Input, Select } from 'antd';
import { useCreateProjectDraft } from '../createContext';

const StepBasic = () => {
  const { state, setBasic } = useCreateProjectDraft();
  return (
    <Form layout="vertical">
      <Form.Item label="ชื่อโครงงานภาษาไทย" required>
        <Input value={state.basic.projectNameTh} onChange={e => setBasic({ projectNameTh: e.target.value })} />
      </Form.Item>
      <Form.Item label="ชื่อโครงงานภาษาอังกฤษ" required>
        <Input value={state.basic.projectNameEn} onChange={e => setBasic({ projectNameEn: e.target.value })} />
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
