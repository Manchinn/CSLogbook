import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Typography, Spin, Alert, Button } from 'antd';
import { useLocation } from 'react-router-dom';
import { CreateProvider } from './createContext';
import CreateWizard from './CreateWizard';
import { useCreateProjectDraft } from './createContext';
import projectService from '../../../../services/projectService';

const { Title, Paragraph } = Typography;

// หน้าใหม่: ใช้ Wizard + Context (ยังไม่เชื่อมต่อ API จริง)
// รอบถัดไป: เพิ่มปุ่ม "สร้างโครงงาน" ที่ท้าย Review เมื่อผ่านขั้นต่ำ (name_th + name_en อย่างน้อย)
// และ logic autosave (debounce) เรียก backend หลัง StepBasic เสร็จ

// แยก inner component เพื่อให้เข้าถึง context หลัง Provider ได้
const TopicSubmitInner = () => {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState(null);
  const hasCheckedRef = useRef(false); // ป้องกันการรัน checkExisting() ซ้ำหลังจากโหลดครั้งแรก
  const { state, setBasic, setClassification, setDetails, setProjectId, setProjectStatus, setProjectMembers, setMembers, setMembersStatus } = useCreateProjectDraft();

  const search = new URLSearchParams(location.search);
  const editPid = search.get('pid');

  const preloadProject = useCallback(async (pid) => {
    try {
      setChecking(true);
      const res = await projectService.getProject(pid);
      if (res?.success && res?.data) {
        const p = res.data;
        setProjectId(p.projectId);
        if (p.status) setProjectStatus(p.status);
        if (Array.isArray(p.members)) setProjectMembers(p.members);
        setBasic({
          projectNameTh: p.projectNameTh || '',
            projectNameEn: p.projectNameEn || '',
            projectType: p.projectType || undefined
        });
        const findAdvisorUserId = (teacherId) => {
          if (!teacherId || !Array.isArray(state.advisors)) return undefined;
          const matched = state.advisors.find(item => Number(item.teacherId) === Number(teacherId));
          return matched?.userId;
        };
        setClassification({
          advisorId: p.advisorId || null,
            advisorUserId: p.advisorId ? findAdvisorUserId(p.advisorId) : null,
            coAdvisorId: p.coAdvisorId || null,
            coAdvisorUserId: p.coAdvisorId ? findAdvisorUserId(p.coAdvisorId) : null,
            tracks: Array.isArray(p.tracks) ? p.tracks : []
        });
        setDetails({
          objective: p.objective || '',
          background: p.background || '',
          scope: p.scope || '',
          expectedOutcome: p.expectedOutcome || '',
          benefit: p.benefit || '',
          tools: p.tools || '',
          methodology: p.methodology || '',
          timelineNote: p.timelineNote || '',
          risk: p.risk || '',
          constraints: p.constraints || ''
          // problem: คงไว้ของเดิม (ยังไม่มีใน backend)
        });
        // Hydrate second member (role === 'member') -> เก็บลง state.members.secondMemberCode
        const secondMember = (p.members || []).find(m => m.role === 'member');
        if (secondMember && secondMember.studentCode) {
          setMembers({ secondMemberCode: secondMember.studentCode });
          // ถือว่า synced แล้วเพราะ backend มีอยู่จริง
          setMembersStatus({ synced: true, syncing: false, validated: true, error: null });
        }
      } else {
        setError('ไม่พบโครงงานสำหรับแก้ไข');
      }
    } catch (e) {
      setError(e.message || 'โหลดโครงงานไม่สำเร็จ');
    } finally {
      setChecking(false);
    }
  }, [setBasic, setClassification, setDetails, setProjectId, setProjectMembers, setProjectStatus, setMembers, setMembersStatus, state.advisors]);

  const checkExisting = useCallback(async () => {
    setChecking(true); setError(null);
    try {
      // ถ้ามี pid (โหมดแก้ไข) ให้ preload แล้วจบ
      if (editPid) {
        await preloadProject(editPid);
        return;
      }
      // 🆕 โหลดโครงงานที่มีอยู่แล้วมาแสดงในหน้าเดียวกัน (ไม่ redirect)
      const res = await projectService.getMyProjects();
      const list = res?.data || res?.projects || [];
      // เลือกโครงงานที่ยังไม่ archived
      const preferredOrder = ['draft','advisor_assigned','in_progress','completed'];
      let chosen = null;
      for (const status of preferredOrder) {
        const found = list.find(p => p.status === status);
        if (found) { chosen = found; break; }
      }
      if (chosen) {
        // 🆕 โหลดข้อมูลเข้า context แทนการ redirect
        await preloadProject(chosen.projectId);
      }
      setChecking(false);
    } catch (e) {
      setError(e.message || 'ตรวจสอบโครงงานก่อนหน้าล้มเหลว');
      setChecking(false);
    }
  }, [editPid, preloadProject]);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    checkExisting();
  }, [checkExisting]);

  const readOnlyExamPassed = ['completed', 'archived'].includes(state.projectStatus);

  return (
    <div style={{ padding: 16 }}>
      <Title level={4} style={{ marginTop: 0 }}>เสนอหัวข้อโครงงานพิเศษ</Title>
      {checking && (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <Spin />
          <div style={{ marginTop: 12 }}>กำลังโหลดข้อมูล...</div>
        </div>
      )}
      {!checking && error && (
        <div style={{ marginBottom: 16 }}>
          <Alert type="error" showIcon message={error} action={<Button size="small" onClick={checkExisting}>ลองใหม่</Button>} />
        </div>
      )}
      {!checking && !error && (
        <>
          <Paragraph type="secondary" style={{ marginTop: -4 }}>
            {editPid ? 'โหมดแก้ไข Draft ที่มีอยู่' : 'กรอกข้อมูลทีละขั้น สามารถเว้นบางส่วนไว้ก่อนแล้วกลับมาเติมทีหลังได้'}
          </Paragraph>
          {readOnlyExamPassed && (
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
              message="โครงงานนี้ผ่านการสอบหัวข้อแล้ว"
              description="ข้อมูลทุกส่วนถูกล็อกเพื่อเก็บเป็นหลักฐาน ไม่สามารถแก้ไขเพิ่มเติมได้"
            />
          )}
          <CreateWizard />
        </>
      )}
    </div>
  );
};

const TopicSubmitPage = () => (
  <CreateProvider>
    <TopicSubmitInner />
  </CreateProvider>
);

export default TopicSubmitPage;
