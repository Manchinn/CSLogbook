import React, { useState } from 'react';
import { Steps, Button, Space, Tag } from 'antd';
import { useCreateProjectDraft } from './createContext';
import StepBasic from './wizardSteps/StepBasic';
import StepClassification from './wizardSteps/StepClassification';
import StepMembers from './wizardSteps/StepMembers';
import StepDetails from './wizardSteps/StepDetails';
import StepReview from './wizardSteps/StepReview';

const CreateWizard = () => {
  const [current, setCurrent] = useState(0);
  const { computeDraftReadiness } = useCreateProjectDraft();

  const steps = [
    { title: 'ข้อมูลพื้นฐาน', node: <StepBasic /> },
    { title: 'หมวด & ที่ปรึกษา', node: <StepClassification /> },
    { title: 'สมาชิก', node: <StepMembers /> },
    { title: 'รายละเอียด', node: <StepDetails /> },
    { title: 'ตรวจสอบ', node: <StepReview /> }
  ];

  const next = () => setCurrent(c => Math.min(c+1, steps.length-1));
  const prev = () => setCurrent(c => Math.max(c-1, 0));

  const readiness = computeDraftReadiness();

  return (
    <div>
      <Steps size="small" current={current} items={steps.map(s => ({ title: s.title }))} style={{ marginBottom: 16 }} />
      <div style={{ minHeight: 260 }}>{steps[current].node}</div>
      <Space style={{ marginTop: 16 }}>
        {current > 0 && <Button onClick={prev}>ย้อนกลับ</Button>}
        {current < steps.length - 1 && <Button type="primary" onClick={next}>ถัดไป</Button>}
      </Space>
      {current === steps.length - 1 && (
        <Space wrap style={{ marginTop: 20 }}>
          {readiness.map(r => <Tag key={r.key} color={r.pass ? 'green':'red'}>{r.pass ? 'ผ่าน - ':'ยังไม่ครบ - '}{r.label}</Tag>)}
        </Space>
      )}
    </div>
  );
};

export default CreateWizard;
