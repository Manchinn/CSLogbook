import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Tag, Button, Form, Input, Select, Space, message, Drawer, Descriptions, Divider, Typography, Popconfirm, List, Row, Col, Alert, Modal } from 'antd';
import projectService from '../../services/projectService';
import { teacherService } from '../../services/teacherService';
import MilestoneSummary from './MilestoneSummary';
import { TRACK_OPTIONS, CODE_TO_LABEL, normalizeIncomingTracks } from '../../constants/projectTracks';
import { evaluateProjectReadiness, extractProjectTrackCodes } from '../../utils/projectReadiness';
import dayjs from '../../utils/dayjs';
import { useNavigate } from 'react-router-dom';

// รายชื่ออาจารย์ที่โหลดมาจาก backend (advisors)
// เก็บเป็น state เพื่อรีเฟรชเมื่อเปิด modal / drawer


const statusColorMap = {
  draft: 'default',
  advisor_assigned: 'processing',
  in_progress: 'blue',
  completed: 'success',
  archived: 'error'
};

const examResultMeta = {
  passed: { color: 'green', text: 'หัวข้อผ่าน' },
  failed: { color: 'red', text: 'หัวข้อไม่ผ่าน' }
};

const PROJECT_TYPE_LABELS = {
  govern: 'ความร่วมมือกับหน่วยงานรัฐ',
  private: 'ความร่วมมือกับภาคเอกชน',
  research: 'โครงงานวิจัย'
};

const { Title, Text } = Typography; // ใช้ Text สำหรับ error/help

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16
};

const ProjectDashboard = () => {
  const navigate = useNavigate();
  const [detailVisible, setDetailVisible] = useState(false);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState(null);
  const [advisors, setAdvisors] = useState([]); // raw list
  const [editForm] = Form.useForm();
  const [activeProject, setActiveProject] = useState(null);
  const [memberInput, setMemberInput] = useState('');
  const [updating, setUpdating] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState(null); // เก็บ error แสดงใต้ input
  const [ackModalOpen, setAckModalOpen] = useState(false);
  const [ackLoading, setAckLoading] = useState(false);

  const fillEditForm = useCallback((project) => {
    if (!project) {
      editForm.resetFields();
      return;
    }
    editForm.setFieldsValue({
      projectNameTh: project.projectNameTh || undefined,
      projectNameEn: project.projectNameEn || undefined,
      projectType: project.projectType || undefined,
      tracks: extractProjectTrackCodes(project),
      advisorId: project.advisorId || undefined,
      coAdvisorId: project.coAdvisorId || undefined
    });
  }, [editForm]);

  const applyActiveProject = useCallback((project) => {
    const normalized = normalizeIncomingTracks(project);
    setActiveProject(normalized);
    fillEditForm(normalized);
  }, [fillEditForm]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await projectService.getMyProjects();
      if (res.success) {
        const list = (res.data || []).map(normalizeIncomingTracks);
        if (list.length > 0) {
          applyActiveProject(list[0]);
          setDetailVisible(true);
        } else {
          setDetailVisible(false);
          setActiveProject(null);
          fillEditForm(null);
        }
      } else {
        message.error(res.message || 'ดึงรายการโครงงานล้มเหลว');
      }
    } catch (e) {
      message.error(e.message);
    }
  }, [applyActiveProject, fillEditForm]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // ฟังก์ชันโหลดรายชื่ออาจารย์ที่ปรึกษา (เรียกเมื่อเปิด drawer เพื่อให้ fresh)
  const loadAdvisors = useCallback(async () => {
    try {
      setAdvisorLoading(true);
      setAdvisorError(null);
      const list = await teacherService.getAdvisors();
      setAdvisors(list || []);
    } catch (e) {
      setAdvisorError(e.message || 'โหลดรายชื่ออาจารย์ล้มเหลว');
    } finally {
      setAdvisorLoading(false);
    }
  }, []);

  const handleUpdate = async () => {
    if (!activeProject) return;
    try {
      setUpdating(true);
      const values = await editForm.validateFields();
      const payload = {
        ...values,
        tracks: Array.isArray(values.tracks) ? values.tracks.filter(Boolean) : []
      };
      const res = await projectService.updateProject(activeProject.projectId, payload);
      if (res.success) {
        message.success('อัปเดตโครงงานสำเร็จ');
        const refreshed = await projectService.getProjectWithSummary(activeProject.projectId);
        applyActiveProject(refreshed.data);
      } else {
        message.error(res.message || 'อัปเดตไม่สำเร็จ');
      }
    } catch (e) {
      if (!e.errorFields) message.error(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddMember = async () => {
    if (!activeProject) return;
    setMemberError(null);
    const code = (memberInput || '').trim();
    // Validation ฝั่ง client เบื้องต้น
    if (!code) {
      setMemberError('กรุณากรอกรหัสนักศึกษา');
      return;
    }
    if (!/^\d{5,13}$/.test(code)) {
      setMemberError('รูปแบบรหัสนักศึกษาไม่ถูกต้อง (ควรเป็นตัวเลข 5-13 หลัก)');
      return;
    }
    if (activeProject.members?.some(m => m.studentCode === code)) {
      setMemberError('นักศึกษานี้อยู่ในโครงงานแล้ว');
      return;
    }
    if (activeProject.members?.length >= 2) {
      setMemberError('โครงงานมีสมาชิกครบแล้ว');
      return;
    }
    try {
      setAddingMember(true);
      const res = await projectService.addMember(activeProject.projectId, code);
      if (res.success) {
        message.success('เพิ่มสมาชิกสำเร็จ');
        setMemberInput('');
        setMemberError(null);
        const refreshed = await projectService.getProjectWithSummary(activeProject.projectId);
        applyActiveProject(refreshed.data);
      } else {
        // map backend error (message field)
        setMemberError(res.message || 'เพิ่มสมาชิกไม่สำเร็จ');
      }
    } catch (e) {
      setMemberError(e.message || 'เกิดข้อผิดพลาดระหว่างเพิ่มสมาชิก');
    } finally {
      setAddingMember(false);
    }
  };

  const handleAcknowledgeExamResult = useCallback(async () => {
    if (!activeProject) return;
    try {
      setAckLoading(true);
      const res = await projectService.acknowledgeExamResult(activeProject.projectId);
      if (res.success) {
        message.success('รับทราบผลแล้ว หัวข้อจะถูกเก็บถาวร');
        if (detailVisible) {
          const refreshed = await projectService.getProjectWithSummary(activeProject.projectId);
          if (refreshed?.success) {
            applyActiveProject(refreshed.data);
          }
        }
      } else {
        message.error(res.message || 'รับทราบผลไม่สำเร็จ');
      }
    } catch (e) {
      message.error(e.message || 'รับทราบผลไม่สำเร็จ');
    } finally {
      setAckLoading(false);
      setAckModalOpen(false);
    }
  }, [activeProject, applyActiveProject, detailVisible]);

  const activeReadiness = useMemo(() => evaluateProjectReadiness(activeProject), [activeProject]);

  const readinessChecklist = activeReadiness.checklist;

  const activeTrackCodes = useMemo(() => extractProjectTrackCodes(activeProject), [activeProject]);

  const activeExamMeta = useMemo(() => {
    if (!activeProject?.examResult) return null;
    return examResultMeta[activeProject.examResult] || null;
  }, [activeProject?.examResult]);

  const formatDateTime = useCallback((value) => {
    if (!value) return null;
    return dayjs(value).format('DD MMM YYYY HH:mm');
  }, []);

  const examRecordedAt = activeProject?.examResultAt ? formatDateTime(activeProject.examResultAt) : null;
  const examAcknowledgedAt = activeProject?.studentAcknowledgedAt ? formatDateTime(activeProject.studentAcknowledgedAt) : null;
  const shouldAckExam = Boolean(activeProject && activeProject.examResult === 'failed' && !activeProject.studentAcknowledgedAt);

  // แปลง advisors -> options ของ Select
  const trackSelectOptions = useMemo(() => TRACK_OPTIONS.map(({ code, label }) => ({ value: code, label })), []);

  const advisorOptions = useMemo(() => {
    return advisors.map(a => ({
      value: a.teacherId,
      // แสดงรูปแบบ: ชื่อ นามสกุล(รหัสอาจารย์) ตามคำขอ
      label: `${a.firstName} ${a.lastName}(${a.teacherCode || 'N/A'})`
    }));
  }, [advisors]);

  return (
    <div style={containerStyle}>
      {!activeProject && (
        <Alert type="info" showIcon message="ยังไม่มีข้อมูลโครงงานที่จะแสดง" style={{ maxWidth: 480 }} />
      )}
      {activeProject && !detailVisible && (
        <Button type="primary" onClick={() => setDetailVisible(true)} style={{ alignSelf: 'flex-start' }}>
          เปิดรายละเอียดโครงงาน
        </Button>
      )}

      <Modal
        open={ackModalOpen}
        title="ยืนยันการรับทราบผลสอบไม่ผ่าน"
        okText="ยืนยันรับทราบ"
        okButtonProps={{ danger: true, loading: ackLoading }}
        cancelText="ยกเลิก"
        onOk={handleAcknowledgeExamResult}
        onCancel={() => !ackLoading && setAckModalOpen(false)}
      >
        <Typography.Paragraph>
          เมื่อรับทราบผล หัวข้อจะถูกเก็บถาวร (Archived) และคุณจะสามารถยื่นหัวข้อใหม่ในรอบถัดไป การกระทำนี้ไม่สามารถย้อนกลับได้
        </Typography.Paragraph>
        {activeProject?.examFailReason && (
          <Typography.Paragraph type="secondary" style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
            เหตุผล: {activeProject.examFailReason}
          </Typography.Paragraph>
        )}
      </Modal>
    </div>
  );
};

export default ProjectDashboard;
