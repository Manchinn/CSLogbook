import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Space, Typography, Button, Spin, message, Divider } from 'antd';
import projectService from '../../../services/projectService';
import { teacherService } from '../../../services/teacherService';

// หน้าแสดงรายละเอียด Draft โครงงาน (หลังสร้างแล้ว)
// เน้น read-only + ปุ่ม Refresh + ปุ่มกลับไปแก้ไข (Wizard เดิม)

const STATUS_COLOR_MAP = {
  draft: 'default',
  advisor_assigned: 'blue',
  in_progress: 'green',
  completed: 'success',
  archived: 'red'
};

const STATUS_LABEL_MAP = {
  draft: 'ร่าง',
  advisor_assigned: 'รอเริ่มต้น',
  in_progress: 'กำลังดำเนินการ',
  completed: 'เสร็จสมบูรณ์',
  archived: 'เก็บถาวร'
};

const EXAM_RESULT_META = {
  passed: { color: 'green', text: 'หัวข้อผ่าน' },
  failed: { color: 'red', text: 'หัวข้อไม่ผ่าน' }
};

// Mapping ประเภทโครงงาน -> ป้ายภาษาไทย
const PROJECT_TYPE_LABELS = {
  govern: 'ความร่วมมือกับหน่วยงานรัฐ',
  private: 'ความร่วมมือกับภาคเอกชน',
  research: 'โครงงานวิจัย'
};

const ProjectDraftDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [advisors, setAdvisors] = useState([]); // รายชื่ออาจารย์ทั้งหมด (สำหรับ map id -> name)

  const load = useCallback(async (silent=false) => {
    try {
      if (!silent) setLoading(true); else setRefreshing(true);
      const res = await projectService.getProject(id);
      if (res?.success && res?.data) {
        setData(res.data);
        if (!silent) message.success('โหลดข้อมูล Draft แล้ว');
      } else {
        message.warning('ไม่พบข้อมูลโครงงาน');
      }
    } catch (e) {
      message.error(e.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      if (!silent) setLoading(false); else setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { load(false); }, [load]);

  // โหลดรายชื่ออาจารย์ (service คืน array โดยตรง ไม่ต้องเช็ค success อีก)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await teacherService.getAdvisors();
        if (mounted && Array.isArray(list)) setAdvisors(list);
      } catch (e) {
        console.warn('โหลดรายชื่ออาจารย์ไม่สำเร็จ', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const findTeacherName = (id) => {
    if (!id) return '-';
    const t = advisors.find(a => a.teacherId === id || a.id === id);
    if (!t) return `อาจารย์ #${id}`; // fallback แสดง id เมื่อหาไม่เจอจริง ๆ
    // ประกอบชื่อ: position / title (ถ้ามี) + firstName + lastName
    const parts = [];
    if (t.position) parts.push(t.position); // เช่น "อ." หรือ "รศ." ฯลฯ
    if (t.title && !t.position) parts.push(t.title); // เผื่อมี title แยก
    if (t.firstName) parts.push(t.firstName);
    if (t.lastName) parts.push(t.lastName);
    const full = parts.join(' ').trim();
    return full || `อาจารย์ #${id}`;
  };

  if (loading) {
    return <div style={{ padding: 32, textAlign: 'center' }}><Spin /> <div style={{ marginTop: 8 }}>กำลังดึงข้อมูล...</div></div>;
  }
  if (!data) {
    return <div style={{ padding: 32 }}>
      <Typography.Text type="danger">ไม่พบข้อมูลโครงงาน</Typography.Text>
      <div style={{ marginTop: 16 }}><Button onClick={() => load(false)}>ลองใหม่</Button></div>
    </div>;
  }

  const advisorTag = data.advisorId ? <Tag color="blue">{findTeacherName(data.advisorId)}</Tag> : <Tag>ยังไม่เลือก</Tag>;
  const coAdvisorTag = data.coAdvisorId ? <Tag color="purple">{findTeacherName(data.coAdvisorId)}</Tag> : <Tag color="default">-</Tag>;
  const tracks = (data.tracks || []).length ? data.tracks.join(', ') : '-';
  const statusTag = (
    <Tag color={STATUS_COLOR_MAP[data.status] || 'default'}>
      {STATUS_LABEL_MAP[data.status] || data.status || '-'}
    </Tag>
  );
  const examMeta = data.examResult ? EXAM_RESULT_META[data.examResult] : null;
  const examTag = examMeta ? <Tag color={examMeta.color}>{examMeta.text}</Tag> : null;

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
    <Button onClick={() => navigate(-1)}>ย้อนกลับ</Button>
    <Button type="primary" onClick={() => navigate(`/project/phase1/topic-submit?pid=${data.projectId}`)}>แก้ไข</Button>
        <Button onClick={() => load(true)} loading={refreshing}>รีเฟรช</Button>
      </Space>
      <Card
        title={
          <Space size={8} wrap>
            <span>รายละเอียดโครงงาน</span>
            {statusTag}
            {examTag}
          </Space>
        }
      >
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="ชื่อโครงงานพิเศษ(ภาษาไทย)">{data.projectNameTh || '-'}</Descriptions.Item>
          <Descriptions.Item label="ชื่อโครงงานพิเศษ(ภาษาอังกฤษ)">{data.projectNameEn || '-'}</Descriptions.Item>
          <Descriptions.Item label="ประเภทของโครงงานพิเศษ">{PROJECT_TYPE_LABELS[data.projectType] || '-'}</Descriptions.Item>
          <Descriptions.Item label="หมวดหมู่ของโครงงาน (Tracks)">{tracks}</Descriptions.Item>
          <Descriptions.Item label="อาจารย์ที่ปรึกษา / อาจารย์ที่ปรึกษาร่วม">{advisorTag} {coAdvisorTag}</Descriptions.Item>
          <Descriptions.Item label="เป้าหมายของโครงงานพิเศษ">{data.objective || '-'}</Descriptions.Item>
          <Descriptions.Item label="ที่มาและความหมายของโครงงานพิเศษ">{data.background || '-'}</Descriptions.Item>
          <Descriptions.Item label="ขอบเขตของโครงงานพิเศษ">{data.scope || '-'}</Descriptions.Item>
          <Descriptions.Item label="ผลลัพธ์ที่คาดหวัง">{data.expectedOutcome || '-'}</Descriptions.Item>
          <Descriptions.Item label="ประโยชน์">{data.benefit || '-'}</Descriptions.Item>
          <Descriptions.Item label="เครื่องมือ">{data.tools || '-'}</Descriptions.Item>
        </Descriptions>
        <Divider orientation="left" style={{ marginTop: 32 }}>สมาชิก</Divider>
        <Space wrap>
          {(data.members || []).map(m => {
            const showCredits = m.totalCredits != null || m.majorCredits != null;
            const total = m.totalCredits != null ? m.totalCredits : '-';
            const major = m.majorCredits != null ? m.majorCredits : '-';
            return (
              <Tag key={m.studentId + (m.role || '')} color="blue" style={{ padding: '4px 8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                  <span>{m.name || '-'} {m.studentCode ? `(${m.studentCode})` : ''}</span>
                  {showCredits && (
                    <span style={{ fontSize: 11, opacity: 0.85 }}>
                      หน่วยกิตรวม {total} | ภาค {major}
                    </span>
                  )}
                </div>
              </Tag>
            );
          })}
          {(data.members || []).length === 1 && <Tag color="orange">ยังไม่มีสมาชิกคนที่สอง</Tag>}
        </Space>
      </Card>
    </div>
  );
};

export default ProjectDraftDetail;
