import React, { useState } from 'react';
import { Steps, Button, Space, Tag, message } from 'antd';
import { useCreateProjectDraft } from './createContext';
import StepBasic from './wizardSteps/StepBasic';
import StepClassification from './wizardSteps/StepClassification';
import StepMembers from './wizardSteps/StepMembers';
import StepDetails from './wizardSteps/StepDetails';
import StepReview from './wizardSteps/StepReview';

const CreateWizard = () => {
  const [current, setCurrent] = useState(0);
  const { state, computeDraftReadiness } = useCreateProjectDraft();

  const steps = [
    { title: 'ข้อมูลพื้นฐาน', node: <StepBasic /> },
    { title: 'หมวด & ที่ปรึกษา', node: <StepClassification /> },
    { title: 'สมาชิก', node: <StepMembers /> },
    { title: 'รายละเอียด', node: <StepDetails /> },
    { title: 'ตรวจสอบ', node: <StepReview /> }
  ];

  // Validation สำหรับแต่ละ step
  const validateStep = (stepIndex) => {
    const { basic, classification, members, details } = state;
    
    switch(stepIndex) {
      case 0: // StepBasic
        if (!basic.projectNameTh?.trim()) {
          message.warning('กรุณากรอกชื่อโครงงานภาษาไทย');
          return false;
        }
        if (!basic.projectNameEn?.trim()) {
          message.warning('กรุณากรอกชื่อโครงงานภาษาอังกฤษ');
          return false;
        }
        if (!basic.projectType) {
          message.warning('กรุณาเลือกประเภทโครงงาน');
          return false;
        }
        return true;
        
      case 1: // StepClassification
        if (!classification.tracks || classification.tracks.length === 0) {
          message.warning('กรุณาเลือกหมวดหมู่อย่างน้อย 1 อัน');
          return false;
        }
        return true;
        
      case 2: // StepMembers
        if (!members.secondMemberCode?.trim()) {
          message.warning('กรุณากรอกรหัสนักศึกษาคนที่ 2');
          return false;
        }
        if (!/^[0-9]{5,13}$/.test(members.secondMemberCode.trim())) {
          message.warning('รหัสนักศึกษาไม่ถูกต้อง (ต้องเป็นตัวเลข 5-13 หลัก)');
          return false;
        }
        return true;
        
      case 3: // StepDetails
        if (!details.background?.trim()) {
          message.warning('กรุณากรอกที่มา / เหตุผล');
          return false;
        }
        if (!details.objective?.trim()) {
          message.warning('กรุณากรอกเป้าหมาย');
          return false;
        }
        if (!details.benefit?.trim()) {
          message.warning('กรุณากรอกประโยชน์ที่จะได้รับ');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };

  const next = () => {
    if (validateStep(current)) {
      setCurrent(c => Math.min(c+1, steps.length-1));
    }
  };
  
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
