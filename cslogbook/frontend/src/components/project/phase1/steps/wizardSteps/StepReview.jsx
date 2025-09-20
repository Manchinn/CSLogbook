import React, { useMemo } from 'react';
import { Alert, Descriptions, Tag, Typography, Button, Space, message, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import projectService from '../../../../../services/projectService';
import { useCreateProjectDraft } from '../createContext';

const StepReview = () => {
  const { state, computeDraftReadiness, setProjectId, setStatus, setMembersStatus, setBasic, setClassification, setMembers, setDetails, setProjectStatus, setProjectMembers } = useCreateProjectDraft();
  const { basic, classification, members, details, advisors, projectId, status, projectStatus, projectMembers } = state;
  const navigate = useNavigate();
  const readinessList = computeDraftReadiness();
  const readiness = useMemo(() => {
    // แปลง array -> object เพื่อใช้เช็คสะดวก
    return readinessList.reduce((acc, r) => { acc[r.key] = r.pass; return acc; }, {});
  }, [readinessList]);

  const advisorName = useMemo(() => {
    if (!classification.advisorId) return null;
    const found = advisors.find(a => a.teacherId === classification.advisorId);
    if (!found) return `#${classification.advisorId}`;
    return `${found.firstName} ${found.lastName}`;
  }, [classification.advisorId, advisors]);

  const coAdvisorName = useMemo(() => {
    if (!classification.coAdvisorId) return null;
    const found = advisors.find(a => a.teacherId === classification.coAdvisorId);
    if (!found) return `#${classification.coAdvisorId}`;
    return `${found.firstName} ${found.lastName}`;
  }, [classification.coAdvisorId, advisors]);

  const handleRefresh = async () => {
    if (!projectId) return;
    try {
      setStatus({ refreshing: true });
      const res = await projectService.getProject(projectId);
      if (res?.success && res?.data) {
        const p = res.data;
        if (p.status) setProjectStatus(p.status);
        if (Array.isArray(p.members)) setProjectMembers(p.members);
        // merge basic fields
        setBasic({
          projectNameTh: p.projectNameTh || '',
          projectNameEn: p.projectNameEn || '',
          projectType: p.projectType || undefined
        });
        setClassification({
          advisorId: p.advisorId || null,
          coAdvisorId: p.coAdvisorId || null,
          tracks: Array.isArray(p.tracks) ? p.tracks : []
        });
        // details
        setDetails({
          objective: p.objective || '',
          background: p.background || '',
          scope: p.scope || '',
          expectedOutcome: p.expectedOutcome || '',
          benefit: p.benefit || '',
          tools: p.tools || '',
          problem: details.problem // problem ไม่ได้มาจาก backend ตอนนี้ เก็บของเดิมไว้
        });
        // second member (role = member)
        const second = (p.members || []).find(m => m.role === 'member');
        if (second) {
          // ถ้า code ตรงกับ local และเคย synced ปล่อยคงเดิม; ถ้า local ว่าง -> set
          if (!members.secondMemberCode || members.secondMemberCode === second.studentCode) {
            setMembers({ secondMemberCode: second.studentCode });
            setMembersStatus({ synced: true, syncing: false, error: null });
          }
        }
        message.success('รีเฟรชข้อมูลล่าสุดแล้ว');
      } else {
        message.warning('ไม่พบข้อมูลโครงงานจากเซิร์ฟเวอร์');
      }
    } catch (e) {
      message.error(e.message || 'รีเฟรชไม่สำเร็จ');
    } finally {
      setStatus({ refreshing: false });
    }
  };

  return (
    <div>
      <Alert
        type="info"
        message="ตรวจสอบข้อมูลก่อนบันทึก/สร้างโครงงาน"
        style={{ marginBottom: 16 }}
      />

      <Descriptions bordered size="small" column={1} title="สรุปข้อมูล">
        <Descriptions.Item label="ชื่อ (TH)">{basic.projectNameTh || '-'} </Descriptions.Item>
        <Descriptions.Item label="ชื่อ (EN)">{basic.projectNameEn || '-'} </Descriptions.Item>
        <Descriptions.Item label="ประเภท">{basic.projectType || <em>ยังไม่ระบุ</em>} </Descriptions.Item>
        <Descriptions.Item label="แทร็ก">{classification.tracks.length ? classification.tracks.join(', ') : <em>ยังไม่เลือก</em>} </Descriptions.Item>
        <Descriptions.Item label="Advisor">{advisorName || <em>ยังไม่เลือก</em>} </Descriptions.Item>
        <Descriptions.Item label="Co-advisor">{coAdvisorName || <span style={{ opacity: 0.5 }}>-</span>} </Descriptions.Item>
        <Descriptions.Item label="สมาชิกเพิ่ม">
          {members.secondMemberCode && <Tag color="blue">คนที่2: {members.secondMemberCode}</Tag>}
          {!members.secondMemberCode && <span>-</span>}
          {members.secondMemberCode && !projectId && <Tag color="gold">ยังไม่สร้าง Draft</Tag>}
          {members.secondMemberCode && projectId && !members.synced && !members.syncing && !members.error && (
            <Tag color="orange">ยังไม่เพิ่มลงฐานข้อมูล</Tag>
          )}
          {members.secondMemberCode && members.syncing && <Tag color="processing">กำลังเพิ่ม...</Tag>}
          {members.secondMemberCode && members.synced && <Tag color="green">บันทึกแล้ว</Tag>}
          {members.secondMemberCode && members.error && <Tag color="red">{members.error}</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="Problem / Pain Point">{details.problem || '-'} </Descriptions.Item>
  <Descriptions.Item label="Background">{details.background || '-'} </Descriptions.Item>
  <Descriptions.Item label="Objective">{details.objective || '-'} </Descriptions.Item>
  <Descriptions.Item label="Expected Outcome">{details.expectedOutcome || '-'} </Descriptions.Item>
  <Descriptions.Item label="Benefit">{details.benefit || '-'} </Descriptions.Item>
  <Descriptions.Item label="Scope">{details.scope || '-'} </Descriptions.Item>
  <Descriptions.Item label="Tools">{details.tools || '-'} </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 24 }}>
        <Typography.Text>ความพร้อม (Draft Readiness): </Typography.Text>
        <div style={{ marginTop: 8 }}>
          {readiness.name_th && readiness.name_en && <Tag color="green">ชื่อครบ</Tag>}
          {readiness.type && <Tag color="green">ประเภท</Tag>}
          {readiness.tracks && <Tag color="green">Tracks</Tag>}
          {readiness.advisor && <Tag color="green">Advisor</Tag>}
          {readiness.details && <Tag color="green">รายละเอียดขั้นต่ำ</Tag>}
          {readiness.member2 && members.secondMemberCode && <Tag color="green">สมาชิกคนที่สอง OK</Tag>}
          {!readiness.member2 && members.secondMemberCode && <Tag color="orange">สมาชิกคนที่สองยังไม่พร้อม</Tag>}
        </div>
      </div>
      <Divider orientation="left" style={{ marginTop: 32 }}>สมาชิก</Divider>
      <Space direction="vertical" style={{ width: '100%' }}>
        {(state.fetchedMembers || []).length === 0 && (
          <Typography.Text type="secondary">(จะดึงจากเซิร์ฟเวอร์เมื่อกด Refresh)</Typography.Text>
        )}
        {/* แสดงจากข้อมูลปัจจุบันใน state (basic draft + secondMemberCode) และถ้ากด refresh ก็จะตรง backend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {projectMembers.length === 0 && (
            <Tag color="default">(ยังไม่ได้รีเฟรช)</Tag>
          )}
          {projectMembers.map(m => (
            <Tag key={m.studentId + m.role} color={m.role === 'leader' ? 'green' : 'blue'}>
              {m.role === 'leader' ? 'Leader' : 'Member'}: {m.name || m.studentCode} {m.studentCode ? `(${m.studentCode})` : ''}
            </Tag>
          ))}
          {/* fallback ถ้ายังไม่ refresh แต่ user ใส่ member2 local */}
          {projectMembers.length === 0 && members.secondMemberCode && (
            <Tag color={members.synced ? 'blue' : 'orange'}>Member (local): {members.secondMemberCode}</Tag>
          )}
        </div>
      </Space>
      <Space style={{ marginTop: 24 }}>
        <Button
          type="primary"
          disabled={!!projectId || !basic.projectNameTh || !basic.projectNameEn || status.creating}
          loading={status.creating}
          onClick={async () => {
            // เกณฑ์ขั้นต่ำ: มีชื่อ TH/EN (advisor ยัง optional) เพื่อให้สร้าง draft ได้เร็ว
            try {
              setStatus({ creating: true });
              const payload = {
                projectNameTh: basic.projectNameTh || undefined,
                projectNameEn: basic.projectNameEn || undefined,
                projectType: basic.projectType || undefined,
                advisorId: classification.advisorId || undefined,
                coAdvisorId: classification.coAdvisorId || undefined,
                objective: details.objective || undefined,
                background: details.background || details.problem || undefined,
                scope: details.scope || undefined,
                expectedOutcome: details.expectedOutcome || undefined,
                benefit: details.benefit || undefined,
                tools: details.tools || undefined,
                tracks: classification.tracks && classification.tracks.length ? classification.tracks : undefined,
              };
              const res = await projectService.createProject(payload);
              if (res?.success && res?.data?.projectId) {
                const newId = res.data.projectId;
                setProjectId(newId);
                message.success('สร้าง Draft โครงงานสำเร็จ');
                navigate(`/project/phase1/draft/${newId}`);
              } else if (res?.project?.projectId) { // fallback legacy key
                const newId = res.project.projectId;
                setProjectId(newId);
                message.success('สร้าง Draft โครงงานสำเร็จ');
                navigate(`/project/phase1/draft/${newId}`);
              } else {
                message.warning('สร้างสำเร็จ (ไม่พบ projectId ใน response)');
              }
            } catch (e) {
              message.error(e.message || 'สร้าง Draft ไม่สำเร็จ');
            } finally {
              setStatus({ creating: false });
            }
          }}
        >{projectId ? 'สร้างแล้ว' : 'สร้าง Draft โครงงาน'}</Button>
        {projectId && <Tag color="blue">Project ID: {projectId}</Tag>}
        {projectId && <Tag color="purple">{projectStatus || 'draft'}</Tag>}
        {projectId && (
          <Button onClick={handleRefresh} loading={status.refreshing} disabled={status.refreshing}>รีเฟรช</Button>
        )}
        {projectId && (
          <Button
            type="dashed"
            disabled={status.saving}
            loading={status.saving}
            onClick={async () => {
              try {
                setStatus({ saving: true });
                const updatePayload = {
                  projectNameTh: basic.projectNameTh || '',
                  projectNameEn: basic.projectNameEn || '',
                  projectType: basic.projectType || null,
                  advisorId: classification.advisorId || null,
                  coAdvisorId: classification.coAdvisorId || null,
                  tracks: classification.tracks,
                  objective: details.objective || null,
                  background: details.background || details.problem || null,
                  scope: details.scope || null,
                  expectedOutcome: details.expectedOutcome || null,
                  benefit: details.benefit || null,
                  tools: details.tools || null
                };
                await projectService.updateProject(projectId, updatePayload);
                message.success('บันทึกการแก้ไขเรียบร้อย');
                await handleRefresh();
              } catch (e) {
                message.error(e.message || 'บันทึกไม่สำเร็จ');
              } finally {
                setStatus({ saving: false });
              }
            }}
          >บันทึกการแก้ไข</Button>
        )}
        {projectId && (
          <Button onClick={() => navigate(`/project/phase1/draft/${projectId}`)}>
            ดูหน้า Draft
          </Button>
        )}
        {projectId && members.secondMemberCode && !members.synced && !members.syncing && (
          <Button
            onClick={async () => {
              try {
                setMembersStatus({ syncing: true, error: null });
                const res = await projectService.addMember(projectId, members.secondMemberCode);
                if (res?.success) {
                  setMembersStatus({ syncing: false, synced: true });
                  message.success('ซิงค์สมาชิกคนที่ 2 สำเร็จ');
                } else {
                  setMembersStatus({ syncing: false, error: 'เพิ่มสมาชิกไม่สำเร็จ' });
                  message.error('เพิ่มสมาชิกไม่สำเร็จ');
                }
              } catch (e) {
                setMembersStatus({ syncing: false, error: e.message || 'เพิ่มสมาชิกไม่สำเร็จ' });
                message.error(e.message || 'เพิ่มสมาชิกไม่สำเร็จ');
              }
            }}
          >ซิงค์สมาชิกคนที่ 2</Button>
        )}
      </Space>
    </div>
  );
};

export default StepReview;
