import React from 'react';
import { Form, Select, Tag, Alert, Tooltip } from 'antd';
import { useCreateProjectDraft } from '../createContext';
import { TRACK_OPTIONS } from '../../../../../constants/projectTracks';

// 🆕 ไม่ต้องแสดงอาจารย์ที่ปรึกษาในขั้นตอนยื่นหัวข้อ
// อาจารย์ที่ปรึกษาจะถูกกำหนดโดยเจ้าหน้าที่ภาควิชาหลังจากบันทึกผลสอบหัวข้อ

const StepClassification = () => {
  const { state, setClassification } = useCreateProjectDraft();
  const tracksReadOnly = ['completed','archived'].includes(state.projectStatus);

  return (
    <Form layout="vertical">
      <Form.Item label={
        <span>
          สาย/แทร็ก (เลือกได้หลายสาย)
          {tracksReadOnly && <Tooltip title="ล็อกหลังผ่านการสอบหัวข้อ"><span style={{color:'#aa00ff', fontSize:12}}> (ล็อก)</span></Tooltip>}
        </span>
      } required>
        <Select
          mode="multiple"
          allowClear
          placeholder="เลือกแทร็ก (อย่างน้อย 1 สาย)"
          value={state.classification.tracks}
          onChange={codes => setClassification({ tracks: codes })}
          options={TRACK_OPTIONS.map(t => ({ value: t.code, label: t.label }))}
          tagRender={(props) => <Tag color="blue" closable={!tracksReadOnly} onClose={props.onClose}>{props.label}</Tag>}
          disabled={tracksReadOnly}
        />
      </Form.Item>
      <Alert
        type="info"
        showIcon
        style={{ marginTop: 16 }}
        message="อาจารย์ที่ปรึกษาจะถูกกำหนดโดยเจ้าหน้าที่ภาควิชาหลังจากบันทึกผลสอบหัวข้อ"
      />
    </Form>
  );
};

export default StepClassification;
