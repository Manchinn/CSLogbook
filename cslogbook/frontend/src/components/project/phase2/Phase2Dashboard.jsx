import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Empty, List, Row, Space, Spin, Tag, Timeline, Tooltip, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, WarningOutlined, CloseCircleOutlined, FilePdfOutlined, FileDoneOutlined, LinkOutlined, TeamOutlined, ReloadOutlined } from '@ant-design/icons';
import { useStudentProject } from '../../../hooks/useStudentProject';
import { useStudentEligibility } from '../../../contexts/StudentEligibilityContext';
import useProjectDeadlines from '../../../hooks/useProjectDeadlines';
import projectService from '../../../services/projectService';
import dayjs from '../../../utils/dayjs';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { phase2CardSteps } from './phase2CardSteps';

const { Title, Paragraph, Text } = Typography;

const DEFENSE_STATUS_META = {
  not_submitted: { color: 'default', text: 'ยังไม่ยื่นคำขอ' },
  submitted: { color: 'orange', text: 'ยื่นคำขอแล้ว (รออาจารย์)' },
  advisor_in_review: { color: 'orange', text: 'รออาจารย์อนุมัติครบ' },
  advisor_approved: { color: 'processing', text: 'อาจารย์อนุมัติครบ (รอเจ้าหน้าที่)' },
  staff_verified: { color: 'green', text: 'เจ้าหน้าที่ตรวจสอบแล้ว' },
  scheduled: { color: 'blue', text: 'นัดสอบแล้ว' },
  completed: { color: 'geekblue', text: 'บันทึกผลสอบแล้ว' },
  cancelled: { color: 'red', text: 'คำขอถูกยกเลิก' },
  advisor_rejected: { color: 'red', text: 'อาจารย์ไม่อนุมัติ' },
  staff_returned: { color: 'red', text: 'เจ้าหน้าที่ส่งกลับ' },
  default: { color: 'default', text: 'ไม่พบสถานะคำขอ' }
};

const SYSTEM_TEST_STATUS_META = {
  pending_advisor: { color: 'orange', text: 'รออาจารย์อนุมัติ' },
  advisor_rejected: { color: 'red', text: 'อาจารย์ส่งกลับ' },
  pending_staff: { color: 'purple', text: 'รอเจ้าหน้าที่ตรวจสอบ' },
  staff_rejected: { color: 'red', text: 'เจ้าหน้าที่ส่งกลับ' },
  staff_approved: { color: 'green', text: 'อนุมัติครบ (รอหลักฐาน)' },
  default: { color: 'default', text: 'ยังไม่ยื่นคำขอ' }
};

const FINAL_DOCUMENT_STATUS_META = {
  draft: { color: 'default', text: 'ร่าง' },
  pending: { color: 'orange', text: 'รอตรวจสอบ' },
  approved: { color: 'green', text: 'อนุมัติ' },
  rejected: { color: 'red', text: 'ส่งกลับ' },
  completed: { color: 'green', text: 'เรียบร้อย' },
  supervisor_evaluated: { color: 'purple', text: 'หัวหน้าภาคตรวจแล้ว' },
  acceptance_approved: { color: 'geekblue', text: 'อนุมัติรับเล่ม' },
  referral_ready: { color: 'blue', text: 'พร้อมส่งต่อ' },
  referral_downloaded: { color: 'cyan', text: 'ดาวน์โหลดแล้ว' }
};

const FINAL_DOCUMENT_ACCEPTED_STATUSES = new Set([
  'approved',
  'completed',
  'acceptance_approved',
  'referral_ready',
  'referral_downloaded'
]);

const normalizeExamResultEntry = (entry) => {
  if (!entry) return null;
  const examType = (entry.examType || entry.exam_type || '').toUpperCase();
  if (!examType) return null;

  return {
    examResultId: entry.examResultId ?? entry.exam_result_id ?? null,
    examType,
    result: entry.result || null,
    score: entry.score ?? null,
    notes: entry.notes ?? null,
    requireScopeRevision: Boolean(entry.requireScopeRevision ?? entry.require_scope_revision),
    recordedAt: entry.recordedAt || entry.recorded_at || null,
    recordedBy: entry.recordedBy
      ? {
          userId: entry.recordedBy.userId ?? entry.recordedBy.user_id ?? null,
          firstName: entry.recordedBy.firstName || null,
          lastName: entry.recordedBy.lastName || null,
          role: entry.recordedBy.role || null
        }
      : null
  };
};

const phase2StepsLookup = phase2CardSteps.reduce((acc, step) => {
  acc[step.key] = step;
  return acc;
}, {});

const overviewStepMeta = phase2StepsLookup['phase2-overview'] || null;

const buildTeacherDisplayName = (teacher) => {
  if (!teacher) return '';
  const nameFromField = teacher.name || [teacher.firstName, teacher.lastName].filter(Boolean).join(' ').trim();
  const code = teacher.teacherCode || teacher.code || teacher.teacher_id;
  if (nameFromField && code) {
    return `${nameFromField} (${code})`;
  }
  if (nameFromField) return nameFromField;
  if (code) return `รหัสอาจารย์ ${code}`;
  return '';
};

const Phase2Dashboard = () => {
  const navigate = useNavigate();
  const {
    activeProject,
    advisors,
    advisorLoading,
    advisorError,
    loadAdvisors,
    loading: projectLoading
  } = useStudentProject({ autoLoad: true });
  const { academicSettings } = useStudentEligibility();
  const [examDetail, setExamDetail] = useState(null);
  const [examLoading, setExamLoading] = useState(false);
  const [examError, setExamError] = useState(null);

  // 🆕 ดึง project deadlines เพื่อใช้เช็คว่า card/button แต่ละใบเกิน deadline หรือไม่
  const projectAcademicYear = useMemo(() => {
    if (!activeProject?.academicYear) return undefined;
    const yearNum = Number(activeProject.academicYear);
    if (Number.isNaN(yearNum)) return undefined;
    return yearNum > 2500 ? yearNum - 543 : yearNum;
  }, [activeProject?.academicYear]);

  const { deadlines: projectDeadlines } = useProjectDeadlines({ 
    academicYear: projectAcademicYear 
  });

  const handleBackToPhase1Overview = useCallback(() => {
    navigate('/project/phase1');
  }, [navigate]);

  // 🆕 Utility function: เช็คว่า step แต่ละใบเกิน deadline หรือไม่ (Soft Lock)
  const getStepDeadlineStatus = useCallback((step) => {
    // ถ้าไม่มีการกำหนด deadline สำหรับ step นี้ → ไม่ lock
    if (!step || !step.deadlineName || !step.relatedTo) {
      return { isOverdue: false, reason: null, deadline: null };
    }

    // หา deadline ที่ตรงกับ step (รองรับทั้ง exact match และ keyword match)
    const matchingDeadline = projectDeadlines?.find(d => {
      const deadlineName = String(d.name || '').trim();
      const stepDeadlineName = String(step.deadlineName || '').trim();
      const relatedToMatch = String(d.relatedTo || '').toLowerCase() === step.relatedTo.toLowerCase();
      
      if (!relatedToMatch) return false;
      
      // 1. Exact match (ชื่อตรงกันทุกตัวอักษร)
      if (deadlineName === stepDeadlineName) {
        return true;
      }
      
      // 2. Keyword match - แยกคำสำคัญออกมาเช็ค
      // เช่น: "วันสุดท้ายของการยื่นเอกสารขอทดสอบระบบโครงงานพิเศษ" ตรงกับ "ยื่นคำขอทดสอบระบบ"
      // โดยเช็คว่ามีคำสำคัญร่วมกัน: "ยื่น", "ทดสอบ", "ระบบ"
      const extractKeywords = (text) => {
        // ลบคำที่ไม่สำคัญออก (เช่น "วันสุดท้าย", "ของ", "การ", "เอกสาร", "คำ", "ขอ")
        return text
          .replace(/วันสุดท้าย|ของ|การ|เอกสาร|คำ|ขอ|โครงงานพิเศษ|คพ\.|\(|\)/g, ' ')
          .split(/\s+/)
          .filter(w => w.length > 1)
          .map(w => w.toLowerCase());
      };
      
      const deadlineKeywords = extractKeywords(deadlineName);
      const stepKeywords = extractKeywords(stepDeadlineName);
      
      // เช็คว่ามี keyword ร่วมกันอย่างน้อย 2 คำ
      const commonKeywords = deadlineKeywords.filter(k => stepKeywords.includes(k));
      if (commonKeywords.length >= 2) {
        return true;
      }
      
      // 3. Fallback: Partial match (ถ้ายังไม่เจอ)
      if (deadlineName.includes(stepDeadlineName) || stepDeadlineName.includes(deadlineName)) {
        return true;
      }
      
      return false;
    });

    if (!matchingDeadline) {
      // 🔍 Debug: log เพื่อตรวจสอบว่าทำไมไม่เจอ
      console.log('[getStepDeadlineStatus] ไม่พบ deadline ที่ตรงกับ:', {
        stepDeadlineName: step.deadlineName,
        stepRelatedTo: step.relatedTo,
        availableDeadlines: projectDeadlines?.map(d => ({
          name: d.name,
          relatedTo: d.relatedTo
        })) || []
      });
      return { isOverdue: false, reason: null, deadline: null };
    }

    const now = dayjs();
    const deadlineTime = matchingDeadline.effective_deadline_local || matchingDeadline.deadline_at_local;
    
    if (!deadlineTime) {
      return { isOverdue: false, reason: null, deadline: matchingDeadline };
    }

    // 🔹 Soft Lock: เช็คว่าเกิน deadline แต่ยังให้เข้าได้ (แสดง warning)
    if (now.isAfter(deadlineTime)) {
      const diffDays = now.diff(deadlineTime, 'day');
      const allowLate = matchingDeadline.allow_late ?? false;
      
      return {
        isOverdue: true,
        allowLate,
        reason: allowLate 
          ? `เกินกำหนด ${diffDays} วัน (ยังส่งได้แต่จะถูกบันทึกว่าส่งช้า)`
          : `เกินกำหนด ${diffDays} วัน (ปิดรับแล้ว)`,
        deadline: matchingDeadline,
        diffDays
      };
    }

    return { isOverdue: false, reason: null, deadline: matchingDeadline };
  }, [projectDeadlines]);

  const openInNewTab = useCallback((url) => {
    if (!url) return;
    if (typeof window === 'undefined') return;
    window.open(url, '_blank', 'noopener');
  }, []);

  useEffect(() => {
    // ถ้าโครงงานยังไม่ผ่านการสอบหัวข้อ จะไม่ต้องยิง API เพื่อดึงรายละเอียดผลสอบเพิ่มเติม
    let ignore = false;
    const loadExamDetail = async () => {
      if (!activeProject || activeProject.examResult !== 'passed') {
        setExamDetail(null);
        setExamError(null);
        return;
      }
      setExamLoading(true);
      try {
        const res = await projectService.getProjectExamResult(activeProject.projectId, { examType: 'PROJECT1' });
        if (!ignore) {
          if (res?.success) {
            setExamDetail(res?.data || null);
            setExamError(null);
          } else {
            setExamDetail(null);
            setExamError(res?.message || 'ไม่สามารถโหลดผลสอบได้');
          }
        }
      } catch (error) {
        if (!ignore) {
          setExamDetail(null);
          setExamError(error.message || 'โหลดผลสอบไม่สำเร็จ');
        }
      } finally {
        if (!ignore) {
          setExamLoading(false);
        }
      }
    };

    loadExamDetail();
    return () => { ignore = true; };
  }, [activeProject]);

  const phase2GateReasons = useMemo(() => {
    // คำนวณรายการเหตุผลที่ยังไม่สามารถเข้า Phase 2 ได้ (เช่น หัวข้อยังไม่ผ่าน หรือสถานะโครงงานยังไม่ in_progress)
    if (!activeProject) {
      return ['ยังไม่พบโครงงานในระบบ'];
    }
    const reasons = [];
    if (activeProject.examResult !== 'passed') {
      reasons.push('ผลสอบหัวข้อยังไม่ผ่าน');
    }
    if (!['in_progress', 'completed'].includes(activeProject.status || '')) {
      reasons.push('สถานะโครงงานยังไม่เป็น "กำลังดำเนินการ"');
    }
    return reasons;
  }, [activeProject]);

  const phase2Unlocked = useMemo(() => phase2GateReasons.length === 0, [phase2GateReasons]);

  const containerStyle = useMemo(() => ({
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24
  }), []);

  const location = useLocation();

  const activeSub = useMemo(() => {
    const match = location.pathname.match(/\/project\/phase2\/([^/]+)/);
    if (!match) return null;
    return match[1];
  }, [location.pathname]);

  const activeStepMeta = activeSub ? phase2StepsLookup[activeSub] : null;

  const thesisRequest = useMemo(() => {
    if (!Array.isArray(activeProject?.defenseRequests)) return null;
    return activeProject.defenseRequests.find((request) => request.defenseType === 'THESIS' && request.status !== 'cancelled') || null;
  }, [activeProject?.defenseRequests]);

  const advisorDisplayName = useMemo(() => {
    if (!activeProject) return '';
    const directName = buildTeacherDisplayName(activeProject.advisor);
    if (directName) return directName;
    const advisorId = activeProject.advisorId || activeProject.advisor?.teacherId;
    if (!advisorId) return '';
    const matched = Array.isArray(advisors)
      ? advisors.find((teacher) => Number(teacher.teacherId) === Number(advisorId))
      : null;
    return buildTeacherDisplayName(matched);
  }, [activeProject, advisors]);

  const leaderMember = useMemo(() => {
    if (!Array.isArray(activeProject?.members)) return null;
    return activeProject.members.find((member) => member.role === 'leader') || null;
  }, [activeProject?.members]);

  // 🆕 คำนวณสถานะ deadline สำหรับแต่ละ step
  const systemTestStep = phase2StepsLookup['system-test'];
  const thesisDefenseStep = phase2StepsLookup['thesis-defense-request'];
  
  const systemTestDeadlineStatus = useMemo(
    () => getStepDeadlineStatus(systemTestStep),
    [getStepDeadlineStatus, systemTestStep]
  );
  
  const thesisDefenseDeadlineStatus = useMemo(
    () => getStepDeadlineStatus(thesisDefenseStep),
    [getStepDeadlineStatus, thesisDefenseStep]
  );

  const meetingBreakdown = useMemo(() => {
    const members = Array.isArray(activeProject?.members) ? activeProject.members : [];
    const metrics = activeProject?.meetingMetricsPhase2 || activeProject?.meetingMetrics;
    // ให้คำนวณจากบันทึก Phase 2 เป็นค่าเริ่มต้น เพื่อสะท้อนความพร้อมยื่น คพ.03
    const perStudentMap = new Map();

    if (Array.isArray(metrics?.perStudent)) {
      metrics.perStudent.forEach((entry) => {
        if (!entry || entry.studentId === undefined || entry.studentId === null) return;
        perStudentMap.set(Number(entry.studentId), {
          approvedLogs: Number(entry.approvedLogs) || 0,
          attendedMeetings: Number(entry.attendedMeetings) || 0
        });
      });
    }

    return members.map((member) => {
      const counts = perStudentMap.get(Number(member.studentId)) || { approvedLogs: 0, attendedMeetings: 0 };
      return {
        studentId: member.studentId,
        name: member.name || member.studentCode || 'สมาชิก',
        studentCode: member.studentCode || '-',
        role: member.role || 'member',
        approvedLogs: counts.approvedLogs,
        attendedMeetings: counts.attendedMeetings
      };
    });
  }, [activeProject?.members, activeProject?.meetingMetrics, activeProject?.meetingMetricsPhase2]);

  const thesisStatusKey = thesisRequest?.status || 'not_submitted';
  const thesisStatusMeta = DEFENSE_STATUS_META[thesisStatusKey] || DEFENSE_STATUS_META.default;

  const systemTestSummary = useMemo(() => activeProject?.systemTestRequest || null, [activeProject?.systemTestRequest]);
  const systemTestRequestFile = systemTestSummary?.requestFile || null;
  const systemTestEvidenceFile = systemTestSummary?.evidence || null;
  const systemTestRequestFileUrl = systemTestRequestFile?.url || null;
  const systemTestEvidenceFileUrl = systemTestEvidenceFile?.url || null;
  const systemTestStatusMeta = useMemo(() => {
    if (!systemTestSummary) return SYSTEM_TEST_STATUS_META.default;
    if (systemTestSummary.status === 'staff_approved' && systemTestSummary.evidenceSubmittedAt) {
      return { color: 'green', text: 'อนุมัติครบและอัปโหลดหลักฐานครบแล้ว' };
    }
    return SYSTEM_TEST_STATUS_META[systemTestSummary.status] || SYSTEM_TEST_STATUS_META.default;
  }, [systemTestSummary]);
  const systemTestDueDay = useMemo(() => {
    if (!systemTestSummary?.testDueDate) return null;
    const due = dayjs(systemTestSummary.testDueDate);
    return due.isValid() ? due : null;
  }, [systemTestSummary?.testDueDate]);
  const systemTestCanUpload = useMemo(() => {
    if (!systemTestSummary || systemTestSummary.status !== 'staff_approved') return false;
    if (systemTestSummary.evidenceSubmittedAt) return false;
    if (!systemTestDueDay) return false;
    return dayjs().isAfter(systemTestDueDay);
  }, [systemTestSummary, systemTestDueDay]);

  const requireScopeRevision = Boolean(examDetail?.requireScopeRevision);

  const meetingRequirement = useMemo(() => {
    const metrics = activeProject?.meetingMetricsPhase2 || activeProject?.meetingMetrics;
    // หากยังไม่มีข้อมูล Phase 2 (กรณีเพิ่งเริ่ม), จะถอยไปใช้ summary เดิมเพื่อหลีกเลี่ยงค่า null
    if (!metrics) {
      return { required: 0, totalApproved: 0, satisfied: true };
    }
    const required = Number(metrics.requiredApprovedLogs) || 0;
    const totalApproved = Number(metrics.totalApprovedLogs) || 0;
    return {
      required,
      totalApproved,
      satisfied: required === 0 || totalApproved >= required
    };
  }, [activeProject?.meetingMetrics, activeProject?.meetingMetricsPhase2]);

  const examResultsByType = useMemo(() => {
    if (!Array.isArray(activeProject?.examResults)) {
      return {};
    }

    const map = {};
    activeProject.examResults.forEach((entry) => {
      const normalized = normalizeExamResultEntry(entry);
      if (!normalized || !normalized.examType) {
        return;
      }

      const existing = map[normalized.examType];
      if (!existing) {
        map[normalized.examType] = normalized;
        return;
      }

      const existingTime = existing.recordedAt ? dayjs(existing.recordedAt) : null;
      const currentTime = normalized.recordedAt ? dayjs(normalized.recordedAt) : null;
      if (!existingTime || (currentTime && currentTime.isAfter(existingTime))) {
        map[normalized.examType] = normalized;
      }
    });

    return map;
  }, [activeProject?.examResults]);

  const thesisExamResult = useMemo(() => examResultsByType.THESIS || null, [examResultsByType]);

  const finalDocument = useMemo(
    () => activeProject?.finalDocument || activeProject?.document || null,
    [activeProject?.finalDocument, activeProject?.document]
  );

  const finalDocumentStatusMeta = useMemo(() => {
    if (!finalDocument?.status) return null;
    const key = String(finalDocument.status).toLowerCase();
    return FINAL_DOCUMENT_STATUS_META[key] || { color: 'default', text: finalDocument.status };
  }, [finalDocument?.status]);

  const thesisBlockingReasons = useMemo(() => {
    const reasons = [];
    if (!meetingRequirement.satisfied) {
      reasons.push(`บันทึกการพบอาจารย์ได้รับอนุมัติ ${meetingRequirement.totalApproved}/${meetingRequirement.required} ครั้ง`);
    }
    if (!systemTestSummary) {
      reasons.push('ยังไม่ส่งคำขอทดสอบระบบ 30 วัน');
    } else {
      if (systemTestSummary.status !== 'staff_approved') {
        reasons.push('คำขอทดสอบระบบยังไม่ผ่านการอนุมัติจากเจ้าหน้าที่');
      }
      if (!systemTestSummary.evidenceSubmittedAt) {
        reasons.push('ยังไม่ได้อัปโหลดหลักฐานผลการทดสอบระบบ');
      }
      if (!systemTestDueDay || !dayjs().isAfter(systemTestDueDay)) {
        reasons.push('ยังไม่ครบกำหนด 30 วันหลังการทดสอบระบบ');
      }
    }
    return reasons;
  }, [meetingRequirement, systemTestSummary, systemTestDueDay]);

  const handleOpenMeetingLogbook = useCallback(() => {
    navigate('/project/phase1/meeting-logbook?phase=phase2');
  }, [navigate]);

  const lastApprovedMeeting = useMemo(() => {
    const value = (activeProject?.meetingMetricsPhase2 || activeProject?.meetingMetrics)?.lastApprovedLogAt;
    if (!value) return null;
    const dt = dayjs(value);
    if (!dt.isValid()) return null;
    return dt.format('DD MMM BBBB เวลา HH:mm น.');
  }, [activeProject?.meetingMetrics, activeProject?.meetingMetricsPhase2]);

  const resourceLinks = useMemo(() => ([
    {
      key: 'meeting-logbook',
      title: 'บันทึกการพบอาจารย์ (โครงงานพิเศษ1/โครงงานพิเศษ2)',
      description: 'ติดตามการพบอาจารย์ตลอดทั้งสองช่วงใช้ตรวจสอบเกณฑ์ก่อนยื่นสอบโครงงานพิเศษ1 และปริญญานิพนธ์',
      actions: [
        {
          key: 'open-logbook',
          label: 'เปิด บันทึกการพบอาจารย์',
          icon: <TeamOutlined />,
          onClick: handleOpenMeetingLogbook
        }
      ]
    },
    {
      key: 'system-test',
      title: 'คำขอทดสอบระบบ 30 วัน',
      description: systemTestSummary
        ? 'ติดตามสถานะคำขอและไฟล์หลักฐานที่อัปโหลดในระบบ'
        : 'เตรียมแบบฟอร์มและยื่นคำขอทดสอบระบบล่วงหน้าอย่างน้อย 30 วัน',
      actions: [
        ...(systemTestRequestFileUrl ? [{
          key: 'view-request',
          label: 'ดูไฟล์คำขอ',
          icon: <FilePdfOutlined />,
          onClick: () => openInNewTab(systemTestRequestFileUrl)
        }] : []),
        ...(systemTestEvidenceFileUrl ? [{
          key: 'view-evidence',
          label: 'ดูหลักฐานประเมิน',
          icon: <FilePdfOutlined />,
          onClick: () => openInNewTab(systemTestEvidenceFileUrl)
        }] : []),
        {
          key: 'open-system-test',
          label: 'เปิดหน้าคำขอทดสอบ',
          icon: <LinkOutlined />,
          onClick: () => navigate('/project/phase2/system-test')
        }
      ]
    },
    {
      key: 'thesis-defense',
      title: 'คำขอสอบ คพ.03',
      description: thesisRequest
        ? 'ตรวจสอบสถานะคำขอและแก้ไขข้อมูลเพิ่มเติมได้ทันที'
        : 'ตรวจสอบรายการเอกสารและยื่นคำขอสอบปริญญานิพนธ์เมื่อพร้อม',
      actions: [
        {
          key: 'open-thesis',
          label: 'เปิดหน้าคำขอ คพ.03',
          icon: <LinkOutlined />,
          onClick: () => navigate('/project/phase2/thesis-defense'),
          primary: true
        }
      ]
    }
  ]), [
    handleOpenMeetingLogbook,
    navigate,
    openInNewTab,
    systemTestEvidenceFileUrl,
    systemTestRequestFileUrl,
    systemTestSummary,
    thesisRequest
  ]);

  const formatDate = (value) => {
    if (!value) return null;
    const dt = dayjs(value);
    if (!dt.isValid()) return null;
    return dt.format('DD MMM BBBB เวลา HH:mm น.');
  };

  const formatDateOnly = (value) => {
    if (!value) return null;
    const dt = dayjs(value);
    if (!dt.isValid()) return null;
    return dt.format('DD/MM/BBBB');
  };

  const timelineItems = useMemo(() => {
    if (!phase2Unlocked) return [];

    const topicSubmitted = formatDate(
      activeProject?.topicSubmittedAt
      || activeProject?.document?.submittedAt
      || activeProject?.createdAt
      || activeProject?.created_at
    );
    const examRecorded = formatDate(examDetail?.recordedAt || activeProject?.examResultAt);
    const thesisScheduled = thesisRequest?.defenseScheduledAt ? formatDate(thesisRequest.defenseScheduledAt) : null;
    const thesisCompleted = thesisStatusKey === 'completed';
    const thesisExamRecorded = thesisExamResult?.recordedAt ? formatDate(thesisExamResult.recordedAt) : null;
    const thesisExamPassed = thesisExamResult?.result === 'PASS';
    const thesisExamRequireRevision = Boolean(thesisExamResult?.requireScopeRevision);
    // จัดรูปแบบสีและไอคอนสำหรับผลสอบปริญญานิพนธ์ เพื่อให้ผู้ใช้เห็นผลล่าสุดได้ทันที
    const thesisExamTimelineColor = thesisExamResult
      ? (thesisExamPassed ? 'green' : 'red')
      : thesisScheduled
        ? 'blue'
        : 'gray';
    const thesisExamTimelineDot = thesisExamResult
      ? (thesisExamPassed ? <CheckCircleOutlined /> : <CloseCircleOutlined />)
      : <ClockCircleOutlined />;

    const finalDocumentStatusKey = finalDocument?.status ? String(finalDocument.status).toLowerCase() : null;
    const finalDocumentSubmitted = finalDocument?.submittedAt ? formatDate(finalDocument.submittedAt) : null;
    const finalDocumentReviewed = finalDocument?.reviewDate ? formatDate(finalDocument.reviewDate) : null;
    let finalDocumentReviewerName = null;
    if (finalDocument?.reviewer) {
      const reviewerNames = [
        finalDocument.reviewer.firstName || '',
        finalDocument.reviewer.lastName || ''
      ].filter(Boolean);
      finalDocumentReviewerName = reviewerNames.length ? reviewerNames.join(' ') : null;
    }
    // กำหนดสีและไอคอนของสถานะเล่ม เพื่อสะท้อนความคืบหน้าและปัญหา (ถ้ามี) ในเส้นเวลาเดียวกัน
    const finalDocumentTimelineColor = finalDocumentStatusKey
      ? FINAL_DOCUMENT_ACCEPTED_STATUSES.has(finalDocumentStatusKey)
        ? 'green'
        : finalDocumentStatusKey === 'rejected'
          ? 'red'
          : 'blue'
      : 'gray';
    const finalDocumentTimelineDot = finalDocumentStatusKey
      ? FINAL_DOCUMENT_ACCEPTED_STATUSES.has(finalDocumentStatusKey)
        ? <CheckCircleOutlined />
        : finalDocumentStatusKey === 'rejected'
          ? <CloseCircleOutlined />
          : <FileDoneOutlined />
      : <ClockCircleOutlined />;

    let thesisExamRecorderName = null;
    if (thesisExamResult?.recordedBy) {
      const recorderNames = [
        thesisExamResult.recordedBy.firstName || '',
        thesisExamResult.recordedBy.lastName || ''
      ].filter(Boolean);
      thesisExamRecorderName = recorderNames.length ? recorderNames.join(' ') : 'เจ้าหน้าที่ภาควิชา';
    }

    const items = [
      {
        key: 'topic-submit',
        color: topicSubmitted ? 'green' : 'gray',
        dot: topicSubmitted ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
        children: (
          <Space direction="vertical" size={2}>
            <Text strong>เสนอหัวข้อโครงงานพิเศษ</Text>
            <Text type="secondary">
              {topicSubmitted
                ? `ส่งหัวข้อแล้วเมื่อ ${topicSubmitted}`
                : 'ระบบกำลังรอการบันทึกวันที่เสนอหัวข้อจากเจ้าหน้าที่ภาควิชา'}
            </Text>
          </Space>
        )
      },
      {
        key: 'phase1-result',
        color: 'green',
        dot: <CheckCircleOutlined />,
        children: (
          <Space direction="vertical" size={2}>
            <Text strong>ผลสอบโครงงานพิเศษ 1</Text>
            <Text type="secondary">ผ่านเมื่อ {examRecorded || '—'}</Text>
          </Space>
        )
      },
      {
        key: 'scope-revision',
        color: requireScopeRevision ? 'orange' : 'green',
        dot: requireScopeRevision ? <WarningOutlined /> : <CheckCircleOutlined />,
        children: (
          <Space direction="vertical" size={2}>
            <Text strong>ปรับปรุง Scope ตามข้อเสนอแนะ</Text>
            <Text type="secondary">
              {requireScopeRevision ? 'หัวข้อสอบผ่านแบบมีเงื่อนไข กรุณาปรับ Scope ให้เรียบร้อยก่อนยื่นคำขอสอบ คพ.03' : 'หัวข้อสอบผ่านโดยไม่ต้องปรับ Scope'}
            </Text>
          </Space>
        )
      },
      {
        key: 'meeting-log',
        color: meetingRequirement.satisfied ? 'green' : 'blue',
        dot: meetingRequirement.satisfied ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
        children: (
          <Space direction="vertical" size={2}>
            <Text strong>บันทึกการพบอาจารย์ (Meeting Logbook)</Text>
            <Text type="secondary">
              {meetingRequirement.satisfied
                ? 'จำนวนบันทึกการพบที่ได้รับอนุมัติครบตามเกณฑ์'
                : `อนุมัติแล้ว ${meetingRequirement.totalApproved}/${meetingRequirement.required} รายการ`}
            </Text>
          </Space>
        )
      },
      {
        key: 'thesis-request',
        color: thesisStatusKey === 'completed' ? 'green' : thesisStatusMeta.color,
        dot: thesisStatusKey === 'completed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
        children: (
          <Space direction="vertical" size={2}>
            <Text strong>ยื่นคำขอสอบโครงงานพิเศษ 2 (แบบ คพ.03)</Text>
            <Tag color={thesisStatusMeta.color}>{thesisStatusMeta.text}</Tag>
            {thesisRequest?.submittedAt && (
              <Text type="secondary">ยื่นเมื่อ {formatDate(thesisRequest.submittedAt)}</Text>
            )}
          </Space>
        )
      },
      {
        key: 'thesis-schedule',
        color: thesisCompleted ? 'green' : thesisScheduled ? 'blue' : 'gray',
        dot: thesisCompleted ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
        children: (
          <Space direction="vertical" size={2}>
            <Text strong>ตารางสอบโครงงานพิเศษ 2</Text>
            <Text type="secondary">
              {thesisCompleted
                ? 'บันทึกผลสอบเรียบร้อย'
                : thesisScheduled
                  ? `นัดสอบเมื่อ ${thesisScheduled}`
                  : 'เจ้าหน้าที่จะประกาศวันสอบหลังคำขอได้รับการตรวจสอบและอนุมัติครบ'}
            </Text>
          </Space>
        )
      },
      {
        key: 'thesis-exam-result',
        color: thesisExamTimelineColor,
        dot: thesisExamTimelineDot,
        children: (
          <Space direction="vertical" size={2}>
            <Text strong>ผลสอบปริญญานิพนธ์</Text>
            {thesisExamResult ? (
              <>
                <Space size={6} wrap>
                  <Tag color={thesisExamPassed ? 'green' : 'red'}>
                    {thesisExamPassed ? 'ผ่าน' : 'ไม่ผ่าน'}
                  </Tag>
                  {thesisExamPassed && thesisExamRequireRevision && (
                    <Tag color="orange">มีเงื่อนไข</Tag>
                  )}
                </Space>
                {thesisExamRecorded && (
                  <Text type="secondary">บันทึกเมื่อ {thesisExamRecorded}</Text>
                )}
                {thesisExamRecorderName && (
                  <Text type="secondary">โดย {thesisExamRecorderName}</Text>
                )}
                {thesisExamResult.notes && (
                  <Text type="secondary">หมายเหตุ: {thesisExamResult.notes}</Text>
                )}
              </>
            ) : (
              <Text type="secondary">ยังไม่ประกาศผลสอบ</Text>
            )}
          </Space>
        )
      },
      {
        key: 'final-document-status',
        color: finalDocumentTimelineColor,
        dot: finalDocumentTimelineDot,
        children: (
          <Space direction="vertical" size={2}>
            <Text strong>สถานะเล่มปริญญานิพนธ์</Text>
            {finalDocument ? (
              <>
                <Tag color={finalDocumentStatusMeta?.color || 'default'}>
                  {finalDocumentStatusMeta?.text || finalDocument.status || 'ไม่ทราบสถานะ'}
                </Tag>
                {finalDocumentSubmitted && (
                  <Text type="secondary">ส่งเมื่อ {finalDocumentSubmitted}</Text>
                )}
                {finalDocumentReviewerName && finalDocumentReviewed && (
                  <Text type="secondary">
                    ตรวจโดย {finalDocumentReviewerName} เมื่อ {finalDocumentReviewed}
                  </Text>
                )}
                {typeof finalDocument.downloadCount === 'number' && finalDocument.downloadCount > 0 && (
                  <Text type="secondary">ดาวน์โหลดแล้ว {finalDocument.downloadCount} ครั้ง</Text>
                )}
              </>
            ) : (
              <Text type="secondary">ระบบยังไม่พบเล่มในระบบ เจ้าหน้าที่จะเพิ่มให้เมื่อได้รับเล่มจากคุณ</Text>
            )}
          </Space>
        )
      }
    ];

    return items;
  }, [
    phase2Unlocked,
    examDetail,
  activeProject?.examResultAt,
  activeProject?.document?.submittedAt,
  activeProject?.createdAt,
  activeProject?.created_at,
  activeProject?.topicSubmittedAt,
    requireScopeRevision,
    meetingRequirement,
    thesisRequest,
    thesisStatusKey,
    thesisStatusMeta,
    thesisExamResult,
    finalDocument,
    finalDocumentStatusMeta
  ]);

  const renderHeader = () => (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Space align="center" size={8}>
        {overviewStepMeta?.icon}
        <Title level={4} style={{ margin: 0 }}>
          {overviewStepMeta?.title || 'โครงงานพิเศษ & ปริญญานิพนธ์ – ภาพรวม'}
        </Title>
      </Space>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {overviewStepMeta?.desc || 'ติดตามเส้นทางตั้งแต่ผลสอบโครงงานพิเศษ 1 จนถึงการยื่นสอบปริญญานิพนธ์ พร้อมมองเห็นเงื่อนไขที่ต้องทำให้ครบ'}
      </Paragraph>
      {academicSettings && (
        <Text type="secondary">
          ภาคการศึกษาปัจจุบัน: ปีการศึกษา {academicSettings.currentAcademicYear || '—'} ภาคเรียนที่ {academicSettings.currentSemester || '—'}
        </Text>
      )}
    </Space>
  );

  if (projectLoading) {
    return (
      <div style={containerStyle}>
        <Card styles={{ body: { padding: 32  }}}>
          <Space align="center" style={{ width: '100%', justifyContent: 'center' }}>
            <Spin />
            <Text>กำลังโหลดข้อมูลโครงงาน...</Text>
          </Space>
        </Card>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div style={containerStyle}>
        <Card title={renderHeader()}>
          <Empty description="ยังไม่มีข้อมูลโครงงานสำหรับเข้า Phase 2" />
        </Card>
      </div>
    );
  }

  if (!phase2Unlocked) {
    return (
      <div style={containerStyle}>
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <Card title={renderHeader()}>
            <Alert
              type="warning"
              showIcon
              message="ยังไม่พร้อมแสดงภาพรวมโครงงานพิเศษ & ปริญญานิพนธ์"
              description={(
                <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                  {phase2GateReasons.map((reason, index) => (
                    <li key={`phase2-lock-${index}`}>{reason}</li>
                  ))}
                </ul>
              )}
            />
          </Card>
          <Card>
            <Paragraph style={{ marginBottom: 0 }}>
              กรุณาดำเนินขั้นตอนในโครงงานพิเศษ 1 ให้ครบถ้วน ระบบจะเปิดให้ติดตามเส้นทางโครงงานจนถึงปริญญานิพนธ์ให้อัตโนมัติเมื่อเงื่อนไขพร้อม
            </Paragraph>
          </Card>
        </Space>
      </div>
    );
  }

  if (activeSub) {
    const headerTitle = (
      <Space align="center">
        {activeStepMeta?.icon}
        <span>{activeStepMeta?.title || 'รายละเอียดขั้นตอนโครงงานพิเศษ 2'}</span>
      </Space>
    );

    return (
      <div style={containerStyle}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card
            title={headerTitle}
            extra={<Button onClick={handleBackToPhase1Overview}>ย้อนกลับ</Button>}
          >
            <Paragraph style={{ marginBottom: 0 }}>
              {activeStepMeta?.desc || 'หน้ารายละเอียดขั้นตอนโครงงานพิเศษ 2'}
            </Paragraph>
          </Card>
          <Card styles={{ body: { padding: 16  }}}>
            <Outlet />
          </Card>
        </Space>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Space direction="vertical" style={{ width: '100%' }} size={24}>
        <Card title={renderHeader()}>
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Text><strong>ชื่อโครงงาน:</strong> {activeProject.projectNameTh || '-'}</Text>
                <Text type="secondary">ผลสอบหัวข้อ: ผ่าน</Text>
                {examLoading && <Spin size="small" />}
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Space size={8} align="center" wrap>
                  <Text><strong>อาจารย์ที่ปรึกษา:</strong> {advisorDisplayName || '—'}</Text>
                  {advisorLoading && <Spin size="small" />}
                  {!advisorLoading && advisorError && (
                    <Tooltip title={advisorError}>
                      <Tag color="red">โหลดรายชื่อไม่สำเร็จ</Tag>
                    </Tooltip>
                  )}
                  {!advisorLoading && !advisorDisplayName && activeProject?.advisorId && (
                    <Button size="small" icon={<ReloadOutlined />} onClick={loadAdvisors}>
                      รีโหลดรายชื่อ
                    </Button>
                  )}
                </Space>
                {requireScopeRevision && (
                  <Alert
                    type="warning"
                    showIcon
                    message="ผลสอบผ่านแบบมีเงื่อนไข"
                    description="โปรดปรับปรุง Scope ตามคำแนะนำของกรรมการก่อนยื่นคำขอสอบโครงงานพิเศษ 2"
                  />
                )}
              </Space>
            </Col>
          </Row>
        </Card>

        <Card title="ลำดับขั้นตอนสำคัญ">
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            ผังนี้แสดงสถานะตั้งแต่ผลสอบโครงงานพิเศษ 1 การปรับ Scope การเก็บ Meeting Logbook ไปจนถึงการยื่นสอบ ผลสอบปริญญานิพนธ์ และความคืบหน้าเล่มปริญญานิพนธ์
          </Paragraph>
          <Timeline mode="left" items={timelineItems} />
        </Card>

  <Card title="บันทึกการพบอาจารย์เพื่อสอบโครงงานพิเศษ 2 และปริญญานิพนธ์">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type={meetingRequirement.satisfied ? 'success' : 'warning'}
              showIcon
              message={meetingRequirement.satisfied ? 'บันทึกการพบครบตามเกณฑ์แล้ว' : 'ยังไม่ครบเกณฑ์บันทึกการพบ'}
              description={(
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>
                    ได้รับอนุมัติ {meetingRequirement.totalApproved}/{meetingRequirement.required} ครั้ง
                  </Text>
                  {lastApprovedMeeting && (
                    <Text type="secondary">ครั้งล่าสุดเมื่อ {lastApprovedMeeting}</Text>
                  )}
                </Space>
              )}
            />
            {meetingBreakdown.length > 0 ? (
              <List
                size="small"
                dataSource={meetingBreakdown}
                renderItem={(item) => (
                  <List.Item key={item.studentId || item.studentCode}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Space size={8} wrap>
                        <Text strong>{item.name}</Text>
                        {item.studentCode && <Tag color="geekblue">{item.studentCode}</Tag>}
                        {leaderMember && Number(item.studentId) === Number(leaderMember.studentId) && (
                          <Tag color="blue">หัวหน้าโครงงาน</Tag>
                        )}
                      </Space>
                      <Space size={8} wrap>
                        <Tag color="green">อนุมัติแล้ว {item.approvedLogs}</Tag>
                        <Tag color="cyan">เข้าร่วม {item.attendedMeetings}</Tag>
                      </Space>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Alert type="info" showIcon message="ยังไม่มีการบันทึกการพบที่ได้รับอนุมัติ" />
            )}
            <Space wrap>
              <Button icon={<TeamOutlined />} onClick={handleOpenMeetingLogbook}>
                เปิด บันทึกการพบอาจารย์
              </Button>
            </Space>
          </Space>
        </Card>

        <Card title="สถานะคำขอทดสอบระบบ 30 วัน">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {/* 🆕 แสดง warning ถ้าเกิน deadline */}
            {systemTestDeadlineStatus.isOverdue && (
              <Alert
                type={systemTestDeadlineStatus.allowLate ? 'warning' : 'error'}
                showIcon
                message={systemTestDeadlineStatus.allowLate ? 'เกินกำหนดส่ง' : 'ปิดรับคำขอแล้ว'}
                description={systemTestDeadlineStatus.reason}
              />
            )}
            {!systemTestSummary ? (
              <>
                <Alert
                  type="info"
                  showIcon
                  message="ยังไม่ยื่นคำขอทดสอบระบบ"
                  description="เมื่อพร้อมทดลองใช้งานจริง สามารถยื่นคำขอผ่านปุ่มด้านล่าง"
                />
                <Tooltip title={systemTestDeadlineStatus.isOverdue && !systemTestDeadlineStatus.allowLate ? 'ปิดรับคำขอแล้ว' : undefined}>
                  <Button 
                    type="primary" 
                    icon={<LinkOutlined />} 
                    onClick={() => navigate('/project/phase2/system-test')}
                    disabled={systemTestDeadlineStatus.isOverdue && !systemTestDeadlineStatus.allowLate}
                  >
                    เปิดหน้าคำขอทดสอบระบบ
                    {systemTestDeadlineStatus.isOverdue && systemTestDeadlineStatus.allowLate && ' (ส่งช้า)'}
                  </Button>
                </Tooltip>
              </>
            ) : (
              <>
                <Space size={8} align="center" wrap>
                  <Tag color={systemTestStatusMeta.color}>{systemTestStatusMeta.text}</Tag>
                  <Text type="secondary">
                    {systemTestSummary.timeline?.staffDecidedAt
                      ? `อนุมัติล่าสุด ${formatDate(systemTestSummary.timeline.staffDecidedAt) || '—'}`
                      : `ส่งคำขอเมื่อ ${formatDate(systemTestSummary.submittedAt) || '—'}`}
                  </Text>
                </Space>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="วันเริ่มทดสอบ">
                    {formatDateOnly(systemTestSummary.testStartDate) || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="ครบกำหนด 30 วัน">
                    {formatDateOnly(systemTestSummary.testDueDate) || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="วันอนุมัติล่าสุด">
                    {systemTestSummary.timeline?.staffDecidedAt
                      ? formatDate(systemTestSummary.timeline.staffDecidedAt) || '—'
                      : 'ยังไม่ถูกเจ้าหน้าที่ตรวจสอบ'}
                  </Descriptions.Item>
                  <Descriptions.Item label="หลักฐานการประเมิน">
                    {systemTestSummary.evidenceSubmittedAt
                      ? `อัปโหลดเมื่อ ${formatDate(systemTestSummary.evidenceSubmittedAt)}`
                      : systemTestCanUpload
                        ? 'ครบกำหนด สามารถอัปโหลดหลักฐานได้แล้ว'
                        : 'ยังไม่ถึงกำหนดหรือยังไม่ได้อัปโหลด'}
                  </Descriptions.Item>
                  {systemTestRequestFile && (
                    <Descriptions.Item label="ไฟล์คำขอที่แนบ">
                      {systemTestRequestFile.name || systemTestRequestFile.url}
                    </Descriptions.Item>
                  )}
                  {systemTestEvidenceFile && (
                    <Descriptions.Item label="ไฟล์หลักฐานล่าสุด">
                      {systemTestEvidenceFile.name || systemTestEvidenceFile.url}
                    </Descriptions.Item>
                  )}
                </Descriptions>
                {systemTestCanUpload && (
                  <Alert
                    type="warning"
                    showIcon
                    message="ครบกำหนด 30 วัน"
                    description="กรุณาอัปโหลดไฟล์หลักฐานการประเมินบนหน้าคำขอทดสอบระบบ"
                  />
                )}
                <Space wrap>
                  <Button type="primary" icon={<LinkOutlined />} onClick={() => navigate('/project/phase2/system-test')}>
                    เปิดหน้าคำขอ / อัปโหลดหลักฐาน
                  </Button>
                  {systemTestRequestFileUrl && (
                    <Button icon={<FilePdfOutlined />} onClick={() => openInNewTab(systemTestRequestFileUrl)}>
                      ดูไฟล์คำขอ
                    </Button>
                  )}
                  {systemTestEvidenceFileUrl && (
                    <Button icon={<FilePdfOutlined />} onClick={() => openInNewTab(systemTestEvidenceFileUrl)}>
                      ดูหลักฐานประเมิน
                    </Button>
                  )}
                </Space>
              </>
            )}
          </Space>
        </Card>

        <Card title="คำขอสอบโครงงานพิเศษ 2 (คพ.03)">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Space size={8} align="center" wrap>
              <Tag color={thesisStatusMeta.color}>{thesisStatusMeta.text}</Tag>
              {thesisRequest?.submittedAt && (
                <Text type="secondary">ยื่นล่าสุด {formatDate(thesisRequest.submittedAt) || '—'}</Text>
              )}
            </Space>

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="บันทึกการพบอาจารย์ที่ได้รับอนุมัติ">
                {`${meetingRequirement.totalApproved}/${meetingRequirement.required}`} ครั้ง
              </Descriptions.Item>
              <Descriptions.Item label="สถานะคำขอทดสอบระบบ">
                {systemTestSummary
                  ? `${systemTestStatusMeta.text}${systemTestSummary.evidenceSubmittedAt ? ' (อัปโหลดหลักฐานแล้ว)' : ''}`
                  : 'ยังไม่ยื่นคำขอ'}
              </Descriptions.Item>
              <Descriptions.Item label="ครบกำหนด 30 วัน">
                {systemTestDueDay ? formatDateOnly(systemTestDueDay) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="สถานะล่าสุด">
                {thesisRequest
                  ? formatDate(thesisRequest.updatedAt) || '—'
                  : 'ยังไม่ยื่นคำขอ'}
              </Descriptions.Item>
            </Descriptions>

            {/* 🆕 แสดง warning ถ้าเกิน deadline */}
            {thesisDefenseDeadlineStatus.isOverdue && (
              <Alert
                type={thesisDefenseDeadlineStatus.allowLate ? 'warning' : 'error'}
                showIcon
                message={thesisDefenseDeadlineStatus.allowLate ? 'เกินกำหนดส่ง' : 'ปิดรับคำขอแล้ว'}
                description={thesisDefenseDeadlineStatus.reason}
              />
            )}

            {thesisBlockingReasons.length > 0 ? (
              <Alert
                type="warning"
                showIcon
                message="ยังไม่พร้อมยื่นคำขอสอบ"
                description={(
                  <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                    {thesisBlockingReasons.map((reason, index) => (
                      <li key={`thesis-block-${index}`}>{reason}</li>
                    ))}
                  </ul>
                )}
              />
            ) : (
              <Alert
                type="success"
                showIcon
                message="พร้อมยื่นคำขอสอบ คพ.03 แล้ว"
                description="ตรวจสอบข้อมูลให้ครบถ้วนก่อนกดปุ่มเพื่อไปยังหน้าคำขอ"
              />
            )}

            <Tooltip title={thesisDefenseDeadlineStatus.isOverdue && !thesisDefenseDeadlineStatus.allowLate ? 'ปิดรับคำขอแล้ว' : undefined}>
              <Button 
                type="primary" 
                onClick={() => navigate('/project/phase2/thesis-defense')}
                disabled={thesisDefenseDeadlineStatus.isOverdue && !thesisDefenseDeadlineStatus.allowLate}
              >
                เปิดหน้าคำขอสอบ คพ.03
                {thesisDefenseDeadlineStatus.isOverdue && thesisDefenseDeadlineStatus.allowLate && ' (ส่งช้า)'}
              </Button>
            </Tooltip>
          </Space>
        </Card>

        <Card title="ทรัพยากรแนะนำ">
          <List
            dataSource={resourceLinks}
            renderItem={(item) => (
              <List.Item key={item.key}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text strong>{item.title}</Text>
                  <Text type="secondary">{item.description}</Text>
                  <Space wrap>
                    {item.actions.map((action) => (
                      <Button
                        key={action.key}
                        type={action.primary ? 'primary' : 'default'}
                        icon={action.icon}
                        onClick={action.onClick}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Space>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      </Space>
    </div>
  );
};

export default Phase2Dashboard;
