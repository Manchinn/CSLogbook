import React, { useEffect, useState } from 'react';
import { Form, Select, Tag, Spin, Alert, Tooltip } from 'antd';
import { useCreateProjectDraft } from '../createContext';
import { TRACK_OPTIONS } from '../../../../../constants/projectTracks';
import { teacherService } from '../../../../../services/teacherService';

// NOTE: ใช้ endpoint /api/teachers/advisors (ต้องมี token ผ่าน interceptor อยู่แล้ว) 
// Response shape: { success: true, data: [ { teacherId, firstName, lastName, ... } ] }

const buildAdvisorLabel = (t) => `${t.firstName} ${t.lastName}`;

const StepClassification = () => {
  const { state, setClassification, setAdvisors } = useCreateProjectDraft();
  const [advisorOptions, setAdvisorOptions] = useState([]);
  const [advisorList, setAdvisorList] = useState([]); // เก็บ raw data พร้อม userId เพื่อ map -> payload
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchAdvisors = async () => {
      setLoading(true); setError(null);
      try {
          const list = await teacherService.getAdvisors();
          if (!mounted) return;
          const sanitized = Array.isArray(list) ? list.filter(item => item && item.teacherId) : [];
          const mapped = sanitized.map(t => ({
            value: Number(t.teacherId),
            label: buildAdvisorLabel(t),
            teacherId: Number(t.teacherId),
            userId: t.userId
          }));
          setAdvisorList(sanitized);
          setAdvisorOptions(mapped);
          setAdvisors(sanitized); // เก็บลง context สำหรับ StepReview ใช้ชื่อ + userId
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

  const { advisorId, advisorUserId, coAdvisorId, coAdvisorUserId } = state.classification;

  useEffect(() => {
    if (!advisorList.length) return;

    if (advisorId && advisorUserId === undefined) {
      const matched = advisorList.find(item => Number(item.teacherId) === Number(advisorId));
      if (matched && matched.userId !== undefined && matched.userId !== advisorUserId) {
        setClassification({ advisorUserId: matched.userId });
      }
    }

    if (coAdvisorId && coAdvisorUserId === undefined) {
      const matched = advisorList.find(item => Number(item.teacherId) === Number(coAdvisorId));
      if (matched && matched.userId !== undefined && matched.userId !== coAdvisorUserId) {
        setClassification({ coAdvisorUserId: matched.userId });
      }
    }
  }, [advisorList, advisorId, advisorUserId, coAdvisorId, coAdvisorUserId, setClassification]);

  const handleAdvisorChange = (value) => {
    if (!value) {
      setClassification({ advisorId: null, advisorUserId: null });
      return;
    }
    const matched = advisorList.find(item => Number(item.teacherId) === Number(value));
    const userId = matched?.userId;
    setClassification({
      advisorId: Number(value),
      advisorUserId: userId !== undefined ? userId : undefined
    });
  };

  const handleCoAdvisorChange = (value) => {
    if (!value) {
      setClassification({ coAdvisorId: null, coAdvisorUserId: null });
      return;
    }
    const matched = advisorList.find(item => Number(item.teacherId) === Number(value));
    const userId = matched?.userId;
    setClassification({
      coAdvisorId: Number(value),
      coAdvisorUserId: userId !== undefined ? userId : undefined
    });
  };

  const advisorLocked = ['in_progress','completed','archived'].includes(state.projectStatus);
  const tracksReadOnly = ['completed','archived'].includes(state.projectStatus);

  return (
    <Form layout="vertical">
      <Form.Item label={<span>ที่ปรึกษา (Advisor) {advisorLocked && <Tooltip title="ล็อกหลังเริ่มดำเนินโครงงาน"><span style={{color:'#aa00ff', fontSize:12}}> (ล็อก)</span></Tooltip>}</span>}>
        {error && <Alert type="error" showIcon style={{ marginBottom: 8 }} message={error} />}
        <Select
          showSearch
          allowClear
          loading={loading}
          placeholder={loading ? 'กำลังโหลด...' : 'เลือกอาจารย์ที่ปรึกษา หรือเว้นไว้'}
          value={state.classification.advisorId}
          onChange={handleAdvisorChange}
          options={advisorOptions}
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          notFoundContent={loading ? <Spin size="small" /> : 'ไม่พบอาจารย์'}
          disabled={advisorLocked}
        />
      </Form.Item>
      <Form.Item label={<span>ที่ปรึกษาร่วม (Co-advisor) {advisorLocked && <Tooltip title="ล็อกหลังเริ่มดำเนินโครงงาน"><span style={{color:'#aa00ff', fontSize:12}}> (ล็อก)</span></Tooltip>}</span>} extra="ถ้ามี">
        <Select
          allowClear
          placeholder="เลือก Co-advisor (ถ้ามี)"
          value={state.classification.coAdvisorId}
          onChange={handleCoAdvisorChange}
          options={advisorOptions.filter(o => o.teacherId !== Number(state.classification.advisorId))}
          disabled={advisorOptions.length === 0 || advisorLocked}
        />
      </Form.Item>
      <Form.Item label={
        <span>
          สาย/แทร็ก (เลือกได้หลายสาย)
          {tracksReadOnly && <Tooltip title="ล็อกหลังผ่านการสอบหัวข้อ"><span style={{color:'#aa00ff', fontSize:12}}> (ล็อก)</span></Tooltip>}
        </span>
      }>
        <Select
          mode="multiple"
          allowClear
          placeholder="เลือกแทร็ก (ถ้ามี)"
          value={state.classification.tracks}
          onChange={codes => setClassification({ tracks: codes })}
          options={TRACK_OPTIONS.map(t => ({ value: t.code, label: t.label }))}
          tagRender={(props) => <Tag color="blue" closable={!tracksReadOnly} onClose={props.onClose}>{props.label}</Tag>}
          disabled={tracksReadOnly}
        />
      </Form.Item>
    </Form>
  );
};

export default StepClassification;
