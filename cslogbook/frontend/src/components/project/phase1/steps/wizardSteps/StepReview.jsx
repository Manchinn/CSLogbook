import React, { useMemo } from 'react';
import { Alert, Descriptions, Tag, Typography, Button, Space, message, Divider, Tooltip } from 'antd';
import projectService from '../../../../../services/projectService';
import { useCreateProjectDraft } from '../createContext';

const StepReview = () => {
  const { state, computeDraftReadiness, setProjectId, setStatus, setMembersStatus, setBasic, setClassification, setMembers, setDetails, setProjectStatus, setProjectMembers } = useCreateProjectDraft();
  const { basic, classification, members, details, projectId, status, projectStatus, projectMembers } = state;
  const readinessList = computeDraftReadiness();
  const readiness = useMemo(() => {
    // แปลง array -> object เพื่อใช้เช็คสะดวก
    return readinessList.reduce((acc, r) => { acc[r.key] = r.pass; return acc; }, {});
  }, [readinessList]);

  // 🆕 ไม่ต้องแสดงอาจารย์ที่ปรึกษาเพราะจะกำหนดโดยเจ้าหน้าที่ภาควิชา

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
          tracks: Array.isArray(p.tracks) ? p.tracks : []
        });
        // details
        setDetails({
          background: p.background || '',
          objective: p.objective || '',
          benefit: p.benefit || ''
        });
        // second member (role = member)
        const second = (p.members || []).find(m => m.role === 'member');
        if (second) {
          // ถ้า code ตรงกับ local และเคย synced ปล่อยคงเดิม; ถ้า local ว่าง -> set
          if (!members.secondMemberCode || members.secondMemberCode === second.studentCode) {
            setMembers({ secondMemberCode: second.studentCode });
            setMembersStatus({ synced: true, syncing: false, validated: true, error: null });
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

  const lockedCore = ['in_progress','completed','archived'].includes(projectStatus);
  const readOnlyExamPassed = ['completed','archived'].includes(projectStatus);

  return (
    <div>
      <Alert
        type="info"
        message="ตรวจสอบข้อมูลก่อนบันทึก/สร้างโครงงาน"
        style={{ marginBottom: 16 }}
      />

      <Descriptions bordered size="small" column={1} title="สรุปข้อมูล">
  <Descriptions.Item label={<span>ชื่อโครงงานภาษาไทย{lockedCore && <Tooltip title="ล็อกหลังเริ่มดำเนินโครงงาน"><span style={{color:'#aa00ff', fontSize:12}}> (ล็อก)</span></Tooltip>}</span>}>{basic.projectNameTh || '-'} </Descriptions.Item>
  <Descriptions.Item label={<span>ชื่อโครงงานภาษาอังกฤษ{lockedCore && <Tooltip title="ล็อกหลังเริ่มดำเนินโครงงาน"><span style={{color:'#aa00ff', fontSize:12}}> (ล็อก)</span></Tooltip>}</span>}>{basic.projectNameEn || '-'} </Descriptions.Item>
        <Descriptions.Item label="ประเภทโครงงานพิเศษ">{basic.projectType || <em>ยังไม่ระบุ</em>} </Descriptions.Item>
        <Descriptions.Item label="หมวด">{classification.tracks.length ? classification.tracks.join(', ') : <em>ยังไม่เลือก</em>} </Descriptions.Item>
        <Descriptions.Item label="สมาชิกโครงงานพิเศษ (บังคับ 2 คน)">
          {members.secondMemberCode && <Tag color="blue">คนที่2: {members.secondMemberCode}</Tag>}
          {!members.secondMemberCode && <span>-</span>}
          {members.secondMemberCode && !projectId && <Tag color="gold">รอสร้าง Draft เพื่อซิงค์</Tag>}
          {members.secondMemberCode && !projectId && members.validated && <Tag color="geekblue">ตรวจสอบข้อมูลแล้ว</Tag>}
          {members.secondMemberCode && !projectId && !members.validated && !members.error && <Tag color="default">ยังไม่ตรวจสอบ</Tag>}
          {members.secondMemberCode && projectId && !members.synced && !members.syncing && !members.error && (
            <Tag color="orange">ยังไม่เพิ่มลงฐานข้อมูล</Tag>
          )}
          {members.secondMemberCode && members.syncing && <Tag color="processing">กำลังเพิ่ม...</Tag>}
          {members.secondMemberCode && members.synced && <Tag color="green">บันทึกแล้ว</Tag>}
          {members.secondMemberCode && members.error && <Tag color="red">{members.error}</Tag>}
        </Descriptions.Item>
  <Descriptions.Item label="ที่มา / เหตุผล">{details.background || <em style={{ color: '#999' }}>ยังไม่กรอก</em>} </Descriptions.Item>
  <Descriptions.Item label="เป้าหมาย">{details.objective || <em style={{ color: '#999' }}>ยังไม่กรอก</em>} </Descriptions.Item>
  <Descriptions.Item label="ประโยชน์ที่จะได้รับ">{details.benefit || <em style={{ color: '#999' }}>ยังไม่กรอก</em>} </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 24 }}>
        <Typography.Text>ความพร้อมของข้อมูล: </Typography.Text>
        <div style={{ marginTop: 8 }}>
          {readiness.name_th && readiness.name_en && <Tag color="green">ชื่อครบ</Tag>}
          {readiness.type && <Tag color="green">ประเภท</Tag>}
          {readiness.tracks && <Tag color="green">หมวด</Tag>}
          {readiness.details && <Tag color="green">รายละเอียดขั้นต่ำ</Tag>}
          {readiness.member2 && members.secondMemberCode && <Tag color="green">สมาชิกคนที่สอง OK</Tag>}
          {!readiness.member2 && <Tag color="red">ต้องมีสมาชิกคนที่สอง</Tag>}
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
            // 🆕 เกณฑ์ขั้นต่ำ: มีชื่อ TH/EN, ประเภท, หมวด และสมาชิก 2 คน (บังคับ)
            try {
              setStatus({ creating: true });
              // 🆕 ไม่ส่ง advisorId เพราะจะกำหนดโดยเจ้าหน้าที่ภาควิชา
              const payload = {
                projectNameTh: basic.projectNameTh || undefined,
                projectNameEn: basic.projectNameEn || undefined,
                projectType: basic.projectType || undefined,
                background: details.background || undefined,
                objective: details.objective || undefined,
                benefit: details.benefit || undefined,
                tracks: classification.tracks && classification.tracks.length ? classification.tracks : undefined,
                secondMemberStudentCode: members.secondMemberCode || undefined // 🆕 บังคับสมาชิกคนที่ 2
              };
              const res = await projectService.createProject(payload);
              if (res?.success && res?.data?.projectId) {
                const newId = res.data.projectId;
                setProjectId(newId);
                setProjectStatus(res.data.status || 'draft');
                if (res.data.members) setProjectMembers(res.data.members);
                message.success('สร้างโครงงานสำเร็จ! สมาชิก 2 คนได้ถูกบันทึกแล้ว');
                // 🆕 อัปเดต members status เป็น synced
                setMembersStatus({ synced: true, syncing: false, validated: true, error: null });
              } else if (res?.project?.projectId) { // fallback legacy key
                const newId = res.project.projectId;
                setProjectId(newId);
                setProjectStatus(res.project.status || 'draft');
                if (res.project.members) setProjectMembers(res.project.members);
                message.success('สร้างโครงงานสำเร็จ! สมาชิก 2 คนได้ถูกบันทึกแล้ว');
                setMembersStatus({ synced: true, syncing: false, validated: true, error: null });
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
        {projectId && (
          <Button onClick={handleRefresh} loading={status.refreshing} disabled={status.refreshing}>รีเฟรช</Button>
        )}
        {projectId && (
          <Button
            type="dashed"
            disabled={status.saving || readOnlyExamPassed}
            loading={status.saving}
            onClick={async () => {
              if (readOnlyExamPassed) {
                message.info('โครงงานผ่านการสอบหัวข้อแล้ว ไม่สามารถบันทึกแก้ไขได้');
                return;
              }
              try {
                setStatus({ saving: true });
                // 🆕 ไม่ส่ง advisorId เพราะจะกำหนดโดยเจ้าหน้าที่ภาควิชา
                const updatePayload = {
                  // ถ้า lockedCore จะไม่ส่งค่าชื่อเปลี่ยน (ป้องกันแก้ไข)
                  projectNameTh: lockedCore ? undefined : (basic.projectNameTh || ''),
                  projectNameEn: lockedCore ? undefined : (basic.projectNameEn || ''),
                  projectType: basic.projectType || null,
                  tracks: classification.tracks,
                  background: details.background || null,
                  objective: details.objective || null,
                  benefit: details.benefit || null
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
        {projectId && members.secondMemberCode && !members.synced && !members.syncing && !readOnlyExamPassed && (
          <Button
            onClick={async () => {
              try {
                setMembersStatus({ syncing: true, error: null });
                const res = await projectService.addMember(projectId, members.secondMemberCode);
                if (res?.success) {
                  setMembersStatus({ syncing: false, synced: true, validated: true });
                  message.success('ซิงค์สมาชิกคนที่ 2 สำเร็จ');
                } else {
                  setMembersStatus({ syncing: false, synced: false, validated: false, error: 'เพิ่มสมาชิกไม่สำเร็จ' });
                  message.error('เพิ่มสมาชิกไม่สำเร็จ');
                }
              } catch (e) {
                setMembersStatus({ syncing: false, synced: false, validated: false, error: e.message || 'เพิ่มสมาชิกไม่สำเร็จ' });
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
