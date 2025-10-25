import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Collapse,
  DatePicker,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Segmented,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Tooltip
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import locale from 'antd/locale/th_TH';
import { useStudentProject } from '../../../../hooks/useStudentProject';
import meetingService from '../../../../services/meetingService';
import { useAuth } from '../../../../contexts/AuthContext';

const { TextArea } = Input;

const statusColors = {
  pending: 'blue',
  approved: 'green',
  rejected: 'red'
};

const statusText = {
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ขอปรับปรุง'
};

dayjs.extend(buddhistEra);
dayjs.locale('th');

const MEETING_PHASE_LABELS = {
  phase1: 'โครงงานพิเศษ 1',
  phase2: 'โครงงานพิเศษ 2'
};

const MEETING_PHASE_COLORS = {
  phase1: 'purple',
  phase2: 'geekblue'
};

const MEETING_PHASE_KEYS = ['phase1', 'phase2'];
const MeetingLogbookPage = () => {
  const { activeProject, loading: projectLoading } = useStudentProject({ autoLoad: true });
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [listLoading, setListLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [stats, setStats] = useState(null);
  const [createMeetingOpen, setCreateMeetingOpen] = useState(false);
  const [createLogOpen, setCreateLogOpen] = useState(false);
  const [editMeetingOpen, setEditMeetingOpen] = useState(false);
  const [editLogOpen, setEditLogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [activePhase, setActivePhase] = useState('phase1');

  const [createMeetingForm] = Form.useForm();
  const [createLogForm] = Form.useForm();
  const [editMeetingForm] = Form.useForm();
  const [editLogForm] = Form.useForm();

  const canManage = useMemo(() => {
    // อนุญาตให้จัดการได้เฉพาะเมื่อโครงงานยังดำเนินการอยู่
    const hasRole = ['student', 'teacher', 'admin'].includes(userData?.role);
    const isProjectActive = activeProject?.status === 'in_progress';
    return hasRole && isProjectActive;
  }, [userData?.role, activeProject?.status]);
  
  const canApprove = useMemo(() => {
    // อาจารย์และแอดมินสามารถอนุมัติได้แม้โครงงานเสร็จแล้ว
    return ['teacher', 'admin'].includes(userData?.role);
  }, [userData?.role]);

  const postTopicLockReasons = useMemo(() => {
    if (!activeProject) return [];
    const reasons = [];
    if (!activeProject.examResult) {
      reasons.push('เจ้าหน้าที่ภาควิชายังไม่ได้บันทึกผลสอบหัวข้อ');
    } else if (activeProject.examResult !== 'passed') {
      reasons.push('ผลสอบหัวข้อยังไม่ผ่าน');
    }
    // อนุญาตให้เข้าถึงได้ทั้งโครงงานที่กำลังดำเนินการแกะบบสมคงการพบอาจารย์ได้
    if (!['in_progress', 'completed'].includes(activeProject.status || '')) {
      reasons.push('สถานะโครงงานยังไม่อยู่ในขั้น "กำลังดำเนินการ" หรือ "เสร็จสิ้น"');
    }
    return reasons;
  }, [activeProject]);

  const isPostTopicLocked = !!activeProject && postTopicLockReasons.length > 0;

  const phase2LockReasons = useMemo(() => {
    if (!activeProject) return ['ยังไม่มีโครงงาน'];
    const reasons = [];
    if (activeProject.examResult !== 'passed') {
      reasons.push('ผลสอบหัวข้อยังไม่ผ่าน');
    }
    if (!['in_progress', 'completed'].includes(activeProject.status || '')) {
      reasons.push('สถานะโครงงานยังไม่อยู่ในขั้น "กำลังดำเนินการ"');
    }
    return reasons;
  }, [activeProject]);

  const canAccessPhase2 = phase2LockReasons.length === 0;

  const segmentedOptions = useMemo(() => (
    MEETING_PHASE_KEYS.map((phase) => ({
      label: MEETING_PHASE_LABELS[phase],
      value: phase,
      disabled: phase === 'phase2' ? !canAccessPhase2 : false
    }))
  ), [canAccessPhase2]);

  const meetingsByPhase = useMemo(() => {
    return MEETING_PHASE_KEYS.reduce((acc, phase) => {
      acc[phase] = (meetings || []).filter(meeting => (meeting?.phase || 'phase1') === phase);
      return acc;
    }, { phase1: [], phase2: [] });
  }, [meetings]);

  const defaultStatsSnapshot = useMemo(() => ({
    totalMeetings: 0,
    totalLogs: 0,
    approvedLogs: 0,
    pendingLogs: 0
  }), []);

  const statsByPhase = useMemo(() => {
    const breakdown = stats?.phaseBreakdown || {};
    return MEETING_PHASE_KEYS.reduce((acc, phase) => {
      const source = breakdown?.[phase] || {};
      acc[phase] = {
        totalMeetings: source.totalMeetings ?? 0,
        totalLogs: source.totalLogs ?? 0,
        approvedLogs: source.approvedLogs ?? 0,
        pendingLogs: source.pendingLogs ?? 0
      };
      return acc;
    }, {});
  }, [stats]);

  const currentMeetings = meetingsByPhase[activePhase] || [];
  const currentPhaseStats = statsByPhase[activePhase] || defaultStatsSnapshot;
  const currentPhaseLabel = MEETING_PHASE_LABELS[activePhase] || MEETING_PHASE_LABELS.phase1;

  const fetchMeetings = useCallback(async () => {
    // อนุญาตให้ดึงข้อมูลได้แม้โครงงานจะเสร็จแล้ว เพื่อดูประวัติการพบอาจารย์
    if (!activeProject?.projectId) return;
    
    // ตรวจสอบเฉพาะเงื่อนไขพื้นฐานที่จำเป็น
    if (!activeProject.examResult || activeProject.examResult !== 'passed') {
      return; // ยังไม่ผ่านการสอบหัวข้อ ไม่ต้องดึงข้อมูล
    }
    
    try {
      setListLoading(true);
      const res = await meetingService.listMeetings(activeProject.projectId);
      if (!res?.success) {
        message.error(res?.message || 'ไม่สามารถดึงข้อมูลการพบอาจารย์ได้');
        return;
      }
      setMeetings(res.data || []);
      setStats(res.stats || null);
    } catch (error) {
      message.error(error.message);
    } finally {
      setListLoading(false);
    }
  }, [activeProject?.projectId, activeProject?.examResult]);

  useEffect(() => {
    // เรียก fetchMeetings เมื่อมี projectId แกะบบสมคงการพบอาจารย์ได้
    if (activeProject?.projectId && activeProject?.examResult === 'passed') {
      fetchMeetings();
    } else {
      setMeetings([]);
      setStats(null);
    }
  }, [activeProject?.projectId, activeProject?.examResult, fetchMeetings]);

  useEffect(() => {
    if (!canAccessPhase2 && activePhase === 'phase2') {
      setActivePhase('phase1');
    }
  }, [canAccessPhase2, activePhase]);

  useEffect(() => {
    if (createMeetingOpen) {
      createMeetingForm.setFieldsValue({
        phase: canAccessPhase2 ? activePhase : 'phase1'
      });
    }
  }, [createMeetingOpen, activePhase, canAccessPhase2, createMeetingForm]);

  const handleCreateMeeting = async () => {
    if (isPostTopicLocked) {
      const summary = postTopicLockReasons.join(' • ') || 'ขั้นตอนนี้ยังไม่พร้อมใช้งาน';
      message.warning(summary);
      return;
    }
    if (!activeProject?.projectId) return;
    try {
      const values = await createMeetingForm.validateFields();
      const payload = {
        meetingTitle: values.meetingTitle.trim(),
        meetingDate: values.meetingDate ? values.meetingDate.toISOString() : null,
        meetingMethod: values.meetingMethod,
        meetingLocation: values.meetingLocation || null,
        meetingLink: values.meetingLink || null,
        phase: values.phase || activePhase || 'phase1'
      };
      await meetingService.createMeeting(activeProject.projectId, payload);
      message.success('สร้างการประชุมสำเร็จ ระบบจะส่งอีเมลแจ้งผู้เข้าร่วมให้อัตโนมัติ');
      setCreateMeetingOpen(false);
      createMeetingForm.resetFields();
      fetchMeetings();
    } catch (error) {
      // แสดงข้อความผิดพลาดให้ผู้ใช้ทราบ (ภาษาไทย)
      message.error(error.message || 'สร้างการประชุมไม่สำเร็จ');
    }
  };

  const handleOpenLogModal = (meeting) => {
    if (isPostTopicLocked) {
      const summary = postTopicLockReasons.join(' • ') || 'ขั้นตอนนี้ยังไม่พร้อมใช้งาน';
      message.info(summary);
      return;
    }
    setSelectedMeeting(meeting);
    createLogForm.resetFields();
    setCreateLogOpen(true);
  };

  const handleCreateLog = async () => {
    if (isPostTopicLocked) {
      const summary = postTopicLockReasons.join(' • ') || 'ขั้นตอนนี้ยังไม่พร้อมใช้งาน';
      message.warning(summary);
      return;
    }
    if (!activeProject?.projectId || !selectedMeeting?.meetingId) return;
    try {
      const values = await createLogForm.validateFields();
      const payload = {
        discussionTopic: values.discussionTopic.trim(),
        currentProgress: values.currentProgress.trim(),
        problemsIssues: values.problemsIssues ? values.problemsIssues.trim() : null,
        nextActionItems: values.nextActionItems.trim(),
        advisorComment: values.advisorComment ? values.advisorComment.trim() : null
      };
      await meetingService.createMeetingLog(activeProject.projectId, selectedMeeting.meetingId, payload);
      message.success('บันทึก log การพบสำเร็จ');
      setCreateLogOpen(false);
      createLogForm.resetFields();
      fetchMeetings();
    } catch (error) {
      message.error(error.message || 'บันทึก log ไม่สำเร็จ');
    }
  };

  const handleApproval = async (meetingId, logId, status) => {
    if (isPostTopicLocked) {
      const summary = postTopicLockReasons.join(' • ') || 'ขั้นตอนนี้ยังไม่พร้อมใช้งาน';
      message.warning(summary);
      return;
    }
    if (!activeProject?.projectId) return;
    try {
      const loadingKey = `${meetingId}-${logId}-${status}`;
      setActionLoadingKey(loadingKey);
      await meetingService.updateLogApproval(activeProject.projectId, meetingId, logId, { status });
      message.success('อัปเดตสถานะสำเร็จ');
      fetchMeetings();
    } catch (error) {
      message.error(error.message || 'อัปเดตสถานะไม่สำเร็จ');
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleEditMeeting = (meeting) => {
    if (isPostTopicLocked) {
      const summary = postTopicLockReasons.join(' • ') || 'ขั้นตอนนี้ยังไม่พร้อมใช้งาน';
      message.info(summary);
      return;
    }
    setSelectedMeeting(meeting);
    editMeetingForm.setFieldsValue({
      meetingTitle: meeting.meetingTitle,
      meetingDate: meeting.meetingDate ? dayjs(meeting.meetingDate) : null,
      meetingMethod: meeting.meetingMethod,
      meetingLocation: meeting.meetingLocation,
      meetingLink: meeting.meetingLink,
      phase: meeting.phase || 'phase1'
    });
    setEditMeetingOpen(true);
  };

  const handleUpdateMeeting = async () => {
    if (isPostTopicLocked) {
      const summary = postTopicLockReasons.join(' • ') || 'ขั้นตอนนี้ยังไม่พร้อมใช้งาน';
      message.warning(summary);
      return;
    }
    if (!activeProject?.projectId || !selectedMeeting?.meetingId) return;
    try {
      const values = await editMeetingForm.validateFields();
      const payload = {
        meetingTitle: values.meetingTitle.trim(),
        meetingDate: values.meetingDate ? values.meetingDate.toISOString() : null,
        meetingMethod: values.meetingMethod,
        meetingLocation: values.meetingLocation || null,
        meetingLink: values.meetingLink || null,
        phase: values.phase || activePhase || 'phase1'
      };
      await meetingService.updateMeeting(activeProject.projectId, selectedMeeting.meetingId, payload);
      message.success('แก้ไขการประชุมสำเร็จ');
      setEditMeetingOpen(false);
      editMeetingForm.resetFields();
      fetchMeetings();
    } catch (error) {
      message.error(error.message || 'แก้ไขการประชุมไม่สำเร็จ');
    }
  };

  const handleDeleteMeeting = (meeting) => {
    if (isPostTopicLocked) {
      const summary = postTopicLockReasons.join(' • ') || 'ขั้นตอนนี้ยังไม่พร้อมใช้งาน';
      message.info(summary);
      return;
    }
    Modal.confirm({
      title: 'ยืนยันการลบการประชุม',
      content: `คุณต้องการลบการประชุม "${meeting.meetingTitle}" หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      okText: 'ลบ',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          await meetingService.deleteMeeting(activeProject.projectId, meeting.meetingId);
          message.success('ลบการประชุมสำเร็จ');
          fetchMeetings();
        } catch (error) {
          message.error(error.message || 'ลบการประชุมไม่สำเร็จ');
        }
      }
    });
  };

  const handleEditLog = (meeting, log) => {
    if (isPostTopicLocked) {
      const summary = postTopicLockReasons.join(' • ') || 'ขั้นตอนนี้ยังไม่พร้อมใช้งาน';
      message.info(summary);
      return;
    }
    setSelectedMeeting(meeting);
    setSelectedLog(log);
    editLogForm.setFieldsValue({
      discussionTopic: log.discussionTopic,
      currentProgress: log.currentProgress,
      problemsIssues: log.problemsIssues,
      nextActionItems: log.nextActionItems,
      advisorComment: log.advisorComment
    });
    setEditLogOpen(true);
  };

  const handleUpdateLog = async () => {
    if (isPostTopicLocked) {
      const summary = postTopicLockReasons.join(' • ') || 'ขั้นตอนนี้ยังไม่พร้อมใช้งาน';
      message.warning(summary);
      return;
    }
    if (!activeProject?.projectId || !selectedMeeting?.meetingId || !selectedLog?.logId) return;
    try {
      const values = await editLogForm.validateFields();
      const payload = {
        discussionTopic: values.discussionTopic.trim(),
        currentProgress: values.currentProgress.trim(),
        problemsIssues: values.problemsIssues ? values.problemsIssues.trim() : null,
        nextActionItems: values.nextActionItems.trim(),
        advisorComment: values.advisorComment ? values.advisorComment.trim() : null
      };
      await meetingService.updateMeetingLog(activeProject.projectId, selectedMeeting.meetingId, selectedLog.logId, payload);
      message.success('แก้ไข log การพบสำเร็จ');
      setEditLogOpen(false);
      editLogForm.resetFields();
      fetchMeetings();
    } catch (error) {
      message.error(error.message || 'แก้ไข log ไม่สำเร็จ');
    }
  };

  const handleDeleteLog = (meeting, log) => {
    if (isPostTopicLocked) {
      const summary = postTopicLockReasons.join(' • ') || 'ขั้นตอนนี้ยังไม่พร้อมใช้งาน';
      message.info(summary);
      return;
    }
    Modal.confirm({
      title: 'ยืนยันการลบบันทึกการพบ',
      content: `คุณต้องการลบบันทึกการพบ "${log.discussionTopic}" หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      okText: 'ลบ',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          await meetingService.deleteMeetingLog(activeProject.projectId, meeting.meetingId, log.logId);
          message.success('ลบบันทึกการพบสำเร็จ');
          fetchMeetings();
        } catch (error) {
          message.error(error.message || 'ลบบันทึกการพบไม่สำเร็จ');
        }
      }
    });
  };

  const formatDateTime = useCallback((dateValue) => {
    if (!dateValue) return '-';
    
    // ตรวจสอบว่าเป็น string หรือ Date object
    let date;
    if (typeof dateValue === 'string') {
      date = dayjs(dateValue);
    } else if (dateValue instanceof Date) {
      date = dayjs(dateValue);
    } else {
      return '-';
    }
    
    // ตรวจสอบว่า date ถูกต้องหรือไม่
    if (!date.isValid()) {
      return '-';
    }
    
    return date.locale('th').format('DD MMM BBBB HH:mm');
  }, []);

  const collapseItems = currentMeetings.map((meeting) => {
    const meetingPhase = meeting?.phase || 'phase1';
    // ปรับเงื่อนไขให้สามารถแก้ไขการประชุมได้แม้จะมี log ที่อนุมัติแล้ว
    // เฉพาะในกรณีที่โครงงานยังดำเนินการอยู่
    const canEditMeeting = canManage;
    
    return {
      key: meeting.meetingId,
      label: (
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <Space align="center" size={12} style={{ justifyContent: 'space-between', width: '100%' }}>
            <Space align="center" size={12}>
              <CalendarOutlined style={{ color: '#1d4ed8' }} />
              <span style={{ fontWeight: 600 }}>{meeting.meetingTitle}</span>
              <Tag>{formatDateTime(meeting.meetingDate)}</Tag>
              <Tag color={MEETING_PHASE_COLORS[meetingPhase] || 'purple'} variant="borderless">{MEETING_PHASE_LABELS[meetingPhase]}</Tag>
            </Space>
            {canEditMeeting && (
              <Space size={4}>
                <Tooltip title="แก้ไขการประชุม">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<EditOutlined />} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditMeeting(meeting);
                    }}
                  />
                </Tooltip>
                <Tooltip title="ลบการประชุม">
                  <Button 
                    type="text" 
                    size="small" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMeeting(meeting);
                    }}
                  />
                </Tooltip>
              </Space>
            )}
          </Space>
          <Space size={8} wrap>
            <Tag color="geekblue">{meeting.meetingMethod === 'onsite' ? 'onsite' : meeting.meetingMethod === 'online' ? 'online' : 'hybrid'}</Tag>
            {meeting.status && <Tag color="purple">{meeting.status}</Tag>}
            <Tag icon={<TeamOutlined />}>{meeting.participants?.length || 0} ผู้เข้าร่วม</Tag>
          </Space>
        </Space>
      ),
      children: (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space direction="vertical" size={4}>
            {meeting.meetingLocation && (
              <div style={{ fontSize: 13, color: '#475569' }}>สถานที่: {meeting.meetingLocation}</div>
            )}
            {meeting.meetingLink && (
              <div style={{ fontSize: 13, color: '#475569' }}>ลิงก์: <a href={meeting.meetingLink} target="_blank" rel="noreferrer">เปิดลิงก์</a></div>
            )}
          </Space>

          <Space align="center" style={{ justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              บันทึกล่าสุด: {meeting.logs?.length ? formatDateTime(meeting.logs[0].updatedAt || meeting.logs[0].createdAt) : 'ยังไม่มี'}
            </div>
            {canManage && (
              <Space>
                <Tooltip title="เพิ่ม log สำหรับการพบครั้งนี้">
                  <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleOpenLogModal(meeting)}>
                    บันทึกการพบ
                  </Button>
                </Tooltip>
              </Space>
            )}
          </Space>

          {meeting.logs?.length ? meeting.logs.map((log) => (
            <Card 
              key={log.logId} 
              size="small" 
              title={
                <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <span>{log.discussionTopic}</span>
                  {canManage && log.approvalStatus !== 'approved' && (
                    <Space size={4}>
                      <Tooltip title="แก้ไขบันทึกการพบ">
                        <Button 
                          type="text" 
                          size="small" 
                          icon={<EditOutlined />} 
                          onClick={() => handleEditLog(meeting, log)}
                        />
                      </Tooltip>
                      <Tooltip title="ลบบันทึกการพบ">
                        <Button 
                          type="text" 
                          size="small" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => handleDeleteLog(meeting, log)}
                        />
                      </Tooltip>
                    </Space>
                  )}
                </Space>
              } 
              extra={<Tag color={statusColors[log.approvalStatus] || 'default'}>{statusText[log.approvalStatus] || log.approvalStatus}</Tag>}
            >
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <div style={{ fontSize: 13, color: '#475569' }}>
                  บันทึกเมื่อ: {formatDateTime(log.createdAt)}
                  {log.updatedAt && log.updatedAt !== log.createdAt && (
                    <span style={{ marginLeft: 8, color: '#f59e0b' }}>
                      (แก้ไขล่าสุด: {formatDateTime(log.updatedAt)})
                    </span>
                  )}
                </div>
                {log.recorder?.fullName && (
                  <div style={{ fontSize: 13, color: '#475569' }}>ผู้บันทึก: {log.recorder.fullName}</div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}><strong>ความคืบหน้า:</strong> {log.currentProgress || '-'}</div>
                {log.problemsIssues && (
                  <div style={{ whiteSpace: 'pre-wrap' }}><strong>ปัญหา/อุปสรรค:</strong> {log.problemsIssues}</div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}><strong>งานถัดไป:</strong> {log.nextActionItems || '-'}</div>
                {log.advisorComment && (
                  <Alert type="info" showIcon message="หมายเหตุจากอาจารย์" description={log.advisorComment} />
                )}
                {canApprove && (
                  <Space wrap>
                    <Button
                      size="small"
                      icon={<CheckCircleOutlined />}
                      type="primary"
                      ghost
                      loading={actionLoadingKey === `${meeting.meetingId}-${log.logId}-approved`}
                      onClick={() => handleApproval(meeting.meetingId, log.logId, 'approved')}
                    >
                      อนุมัติ
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<CloseCircleOutlined />}
                      loading={actionLoadingKey === `${meeting.meetingId}-${log.logId}-rejected`}
                      onClick={() => handleApproval(meeting.meetingId, log.logId, 'rejected')}
                    >
                      ขอปรับปรุง
                    </Button>
                    <Button
                      size="small"
                      icon={<ClockCircleOutlined />}
                      loading={actionLoadingKey === `${meeting.meetingId}-${log.logId}-pending`}
                      onClick={() => handleApproval(meeting.meetingId, log.logId, 'pending')}
                    >
                      รีเซ็ตสถานะ
                    </Button>
                  </Space>
                )}
              </Space>
            </Card>
          )) : (
            <Empty description="ยังไม่มีบันทึกการพบในครั้งนี้" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Space>
      )
    };
  });

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space align="center" style={{ justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              if (isPostTopicLocked) {
                message.info(postTopicLockReasons.join(' • ') || 'ขั้นตอนนี้ยังไม่พร้อมใช้งาน');
                return;
              }
              fetchMeetings();
            }}
            disabled={listLoading}
          >
            รีเฟรช
          </Button>
          {canManage && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (isPostTopicLocked) {
                  message.info(postTopicLockReasons.join(' • ') || 'ขั้นตอนนี้ยังไม่พร้อมใช้งาน');
                  return;
                }
                setCreateMeetingOpen(true);
              }}
            >
              สร้างการประชุมใหม่
            </Button>
          )}
        </Space>
        <Segmented
          options={segmentedOptions}
          value={activePhase}
          onChange={(value) => setActivePhase(value)}
        />
      </Space>

      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space align="center" size={8} wrap>
            <Tag color={MEETING_PHASE_COLORS[activePhase] || 'purple'} variant="borderless">{currentPhaseLabel}</Tag>
            <span style={{ color: '#64748b', fontSize: 13 }}>ข้อมูลด้านล่างจะแสดงเฉพาะช่วงนี้</span>
          </Space>
          <Space size={16} wrap>
            <Statistic title="จำนวนการพบทั้งหมด" value={currentPhaseStats.totalMeetings} prefix={<CalendarOutlined />} />
            <Statistic title="บันทึกทั้งหมด" value={currentPhaseStats.totalLogs} prefix={<ClockCircleOutlined />} />
            <Statistic title="อนุมัติแล้ว" value={currentPhaseStats.approvedLogs} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#16a34a' }} />
            <Statistic title="รออนุมัติ" value={currentPhaseStats.pendingLogs} prefix={<MailOutlined />} valueStyle={{ color: '#2563eb' }} />
          </Space>
        </Space>
      </Card>

      {projectLoading || listLoading ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : !activeProject ? (
        <Empty description="ยังไม่มีโครงงานที่ต้องติดตาม" />
      ) : isPostTopicLocked ? (
        <Card>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type="warning"
              showIcon
              message="ยังไม่สามารถบันทึกการพบอาจารย์ด้"
              description={(
                <ul style={{ margin: '12px 0 0 20px', padding: 0 }}>
                  {(postTopicLockReasons.length ? postTopicLockReasons : ['ขั้นตอนนี้จะเปิดใช้งานหลังจากเจ้าหน้าที่บันทึกผลสอบหัวข้อ']).map((reason, index) => (
                    <li key={`meeting-lock-${index}`}>{reason}</li>
                  ))}
                </ul>
              )}
            />
            <Button type="primary" onClick={() => navigate('/project/phase1')}>
              ย้อนกลับไปหน้าหลัก Phase 1
            </Button>
          </Space>
        </Card>
      ) : meetings.length ? (
        <Collapse items={collapseItems} accordion variant="borderless" />
      ) : (
        <Empty description="ยังไม่มีการบันทึกการพบในโครงงานนี้" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}

      <Modal
        title="สร้างการประชุม"
        open={createMeetingOpen}
        okText="บันทึก"
        onCancel={() => setCreateMeetingOpen(false)}
        onOk={handleCreateMeeting}
        destroyOnClose
      >
        <Form layout="vertical" form={createMeetingForm}>
          <Form.Item
            name="phase"
            label="ช่วงโครงงาน"
            rules={[{ required: true, message: 'กรุณาเลือกช่วงโครงงาน' }]}
          >
            <Select>
              <Select.Option value="phase1">{MEETING_PHASE_LABELS.phase1}</Select.Option>
              <Select.Option value="phase2" disabled={!canAccessPhase2}>{MEETING_PHASE_LABELS.phase2}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="meetingTitle" label="หัวข้อการประชุม" rules={[{ required: true, message: 'กรุณาระบุหัวข้อการประชุม' }]}> 
            <Input placeholder="เช่น ติดตามความคืบหน้าหลังสอบหัวข้อ" />
          </Form.Item>
          <Form.Item name="meetingDate" label="วันและเวลา" rules={[{ required: true, message: 'กรุณาเลือกวันและเวลา' }]}> 
            <DatePicker 
              showTime 
              format="DD/MM/BBBB HH:mm" 
              style={{ width: '100%' }} 
              locale={locale}
              placeholder="เลือกวันที่และเวลา"
            />
          </Form.Item>
          <Form.Item name="meetingMethod" label="รูปแบบ" initialValue="onsite" rules={[{ required: true, message: 'กรุณาเลือกรูปแบบการประชุม' }]}> 
            <Select>
              <Select.Option value="onsite">onsite (พบกันที่สถานที่จริง)</Select.Option>
              <Select.Option value="online">online (ผ่านระบบออนไลน์)</Select.Option>
              <Select.Option value="hybrid">hybrid (ผสม onsite/online)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="meetingLocation" label="สถานที่ (ถ้ามี)">
            <Input placeholder="ห้อง/สถานที่" />
          </Form.Item>
          <Form.Item name="meetingLink" label="ลิงก์ประชุม (ถ้ามี)">
            <Input placeholder="เช่น https://teams.microsoft.com/..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={selectedMeeting ? `บันทึกการพบ: ${selectedMeeting.meetingTitle}` : 'บันทึกการพบ'}
        open={createLogOpen}
        okText="บันทึก"
        onCancel={() => setCreateLogOpen(false)}
        onOk={handleCreateLog}
        destroyOnClose
      >
        <Form layout="vertical" form={createLogForm}>
          <Form.Item name="discussionTopic" label="หัวข้อที่พูดคุย" rules={[{ required: true, message: 'กรุณาระบุหัวข้อที่พูดคุย' }]}> 
            <Input placeholder="หัวข้อหลักในการพบครั้งนี้" />
          </Form.Item>
          <Form.Item name="currentProgress" label="ความคืบหน้า" rules={[{ required: true, message: 'กรุณาระบุความคืบหน้า' }]}> 
            <TextArea rows={3} placeholder="บันทึกสิ่งที่ดำเนินการแล้ว" />
          </Form.Item>
          <Form.Item name="problemsIssues" label="ปัญหา/อุปสรรค">
            <TextArea rows={3} placeholder="ถ้ามีปัญหาใดให้บันทึกไว้" />
          </Form.Item>
          <Form.Item name="nextActionItems" label="งานหรือภารกิจถัดไป" rules={[{ required: true, message: 'กรุณาระบุงานถัดไป' }]}> 
            <TextArea rows={3} placeholder="สิ่งที่ต้องดำเนินการต่อหลังการพบครั้งนี้" />
          </Form.Item>
          <Form.Item name="advisorComment" label="หมายเหตุถึงอาจารย์ (ทางเลือก)">
            <TextArea rows={3} placeholder="ข้อความถึงอาจารย์เพิ่มเติม" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="แก้ไขการประชุม"
        open={editMeetingOpen}
        okText="บันทึก"
        onCancel={() => setEditMeetingOpen(false)}
        onOk={handleUpdateMeeting}
        destroyOnClose
      >
        <Form layout="vertical" form={editMeetingForm}>
          <Form.Item
            name="phase"
            label="ช่วงโครงงาน"
            rules={[{ required: true, message: 'กรุณาเลือกช่วงโครงงาน' }]}
          >
            <Select>
              <Select.Option value="phase1">{MEETING_PHASE_LABELS.phase1}</Select.Option>
              <Select.Option value="phase2" disabled={!canAccessPhase2}>{MEETING_PHASE_LABELS.phase2}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="meetingTitle" label="หัวข้อการประชุม" rules={[{ required: true, message: 'กรุณาระบุหัวข้อการประชุม' }]}> 
            <Input placeholder="เช่น ติดตามความคืบหน้าหลังสอบหัวข้อ" />
          </Form.Item>
          <Form.Item name="meetingDate" label="วันและเวลา" rules={[{ required: true, message: 'กรุณาเลือกวันและเวลา' }]}> 
            <DatePicker 
              showTime 
              format="DD/MM/BBBB HH:mm" 
              style={{ width: '100%' }} 
              locale={locale}
              placeholder="เลือกวันที่และเวลา"
            />
          </Form.Item>
          <Form.Item name="meetingMethod" label="รูปแบบ" initialValue="onsite" rules={[{ required: true, message: 'กรุณาเลือกรูปแบบการประชุม' }]}> 
            <Select>
              <Select.Option value="onsite">onsite (พบกันที่สถานที่จริง)</Select.Option>
              <Select.Option value="online">online (ผ่านระบบออนไลน์)</Select.Option>
              <Select.Option value="hybrid">hybrid (ผสม onsite/online)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="meetingLocation" label="สถานที่ (ถ้ามี)">
            <Input placeholder="ห้อง/สถานที่" />
          </Form.Item>
          <Form.Item name="meetingLink" label="ลิงก์ประชุม (ถ้ามี)">
            <Input placeholder="เช่น https://teams.microsoft.com/..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={selectedLog ? `แก้ไขบันทึกการพบ: ${selectedLog.discussionTopic}` : 'แก้ไขบันทึกการพบ'}
        open={editLogOpen}
        okText="บันทึก"
        onCancel={() => setEditLogOpen(false)}
        onOk={handleUpdateLog}
        destroyOnClose
      >
        <Form layout="vertical" form={editLogForm}>
          <Form.Item name="discussionTopic" label="หัวข้อที่พูดคุย" rules={[{ required: true, message: 'กรุณาระบุหัวข้อที่พูดคุย' }]}> 
            <Input placeholder="หัวข้อหลักในการพบครั้งนี้" />
          </Form.Item>
          <Form.Item name="currentProgress" label="ความคืบหน้า" rules={[{ required: true, message: 'กรุณาระบุความคืบหน้า' }]}> 
            <TextArea rows={3} placeholder="บันทึกสิ่งที่ดำเนินการแล้ว" />
          </Form.Item>
          <Form.Item name="problemsIssues" label="ปัญหา/อุปสรรค">
            <TextArea rows={3} placeholder="ถ้ามีปัญหาใดให้บันทึกไว้" />
          </Form.Item>
          <Form.Item name="nextActionItems" label="งานหรือภารกิจถัดไป" rules={[{ required: true, message: 'กรุณาระบุงานถัดไป' }]}> 
            <TextArea rows={3} placeholder="สิ่งที่ต้องดำเนินการต่อหลังการพบครั้งนี้" />
          </Form.Item>
          <Form.Item name="advisorComment" label="หมายเหตุถึงอาจารย์ (ทางเลือก)">
            <TextArea rows={3} placeholder="ข้อความถึงอาจารย์เพิ่มเติม" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default MeetingLogbookPage;
