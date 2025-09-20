import React, { useEffect, useState } from 'react';
import { Form, Select, Tag, Spin, Alert } from 'antd';
import { useCreateProjectDraft } from '../createContext';
import { TRACK_OPTIONS } from '../../../../../constants/projectTracks';
import { teacherService } from '../../../../../services/teacherService';

// NOTE: ใช้ endpoint /api/teachers/advisors (ต้องมี token ผ่าน interceptor อยู่แล้ว) 
// Response shape: { success: true, data: [ { teacherId, firstName, lastName, ... } ] }

const buildAdvisorLabel = (t) => `${t.firstName} ${t.lastName}`;

const StepClassification = () => {
  const { state, setClassification, setAdvisors } = useCreateProjectDraft();
  const [advisorOptions, setAdvisorOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchAdvisors = async () => {
      setLoading(true); setError(null);
      try {
  const list = await teacherService.getAdvisors();
        if (!mounted) return;
  const mapped = list.map(t => ({ value: t.teacherId, label: buildAdvisorLabel(t) }));
  setAdvisorOptions(mapped);
  setAdvisors(list); // เก็บลง context สำหรับ StepReview ใช้ชื่อ
      } catch (e) {
        if (!mounted) return;
        // ตรวจ 401 แบบระบุชัด (กรณี interceptor เคลียร์ token แล้ว redirect อาจยังไม่ทัน)
        if (e?.response?.status === 401) {
          setError('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        } else {
          setError(e.message || 'ดึงรายชื่ออาจารย์ล้มเหลว');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAdvisors();
    return () => { mounted = false; };
  }, [setAdvisors]);

  return (
    <Form layout="vertical">
      <Form.Item label="ที่ปรึกษา (Advisor)">
        {error && <Alert type="error" showIcon style={{ marginBottom: 8 }} message={error} />}
        <Select
          showSearch
          allowClear
          loading={loading}
          placeholder={loading ? 'กำลังโหลด...' : 'เลือกอาจารย์ที่ปรึกษา หรือเว้นไว้'}
          value={state.classification.advisorId}
          onChange={v => setClassification({ advisorId: v })}
          options={advisorOptions}
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          notFoundContent={loading ? <Spin size="small" /> : 'ไม่พบอาจารย์'}
        />
      </Form.Item>
      <Form.Item label="ที่ปรึกษาร่วม (Co-advisor)" extra="ถ้ามี">
        <Select
          allowClear
          placeholder="เลือก Co-advisor (ถ้ามี)"
          value={state.classification.coAdvisorId}
          onChange={v => setClassification({ coAdvisorId: v || null })}
          options={advisorOptions.filter(o => o.value !== state.classification.advisorId)}
          disabled={advisorOptions.length === 0}
        />
      </Form.Item>
      <Form.Item label="สาย/แทร็ก (เลือกได้หลายสาย)">
        <Select
          mode="multiple"
          allowClear
          placeholder="เลือกแทร็ก (ถ้ามี)"
          value={state.classification.tracks}
          onChange={codes => setClassification({ tracks: codes })}
          options={TRACK_OPTIONS.map(t => ({ value: t.code, label: t.label }))}
          tagRender={(props) => <Tag color="blue" closable onClose={props.onClose}>{props.label}</Tag>}
        />
      </Form.Item>
    </Form>
  );
};

export default StepClassification;
