import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Space, Tag, Progress, Tooltip, Empty, Button, Typography, Alert } from 'antd';
import {
  ExperimentOutlined, UnlockOutlined, LockOutlined,
  SolutionOutlined, InfoCircleOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined,
  ClockCircleOutlined, WarningOutlined
} from '@ant-design/icons';
import TimelineItems from './TimelineItems';
import { getProjectStateWithDeadlines } from 'features/project/services/projectWorkflowStateService';

const { Text, Paragraph } = Typography;

// คอมโพเนนต์สำหรับแสดงส่วนโครงงานพิเศษ (Enhanced Version with Workflow State)
const ProjectSection = ({ student, progress }) => {
  const navigate = useNavigate();
  // State สำหรับข้อมูล workflow state
  const [workflowState, setWorkflowState] = useState(null);
  const [loadingWorkflowState, setLoadingWorkflowState] = useState(false);
  const [workflowError, setWorkflowError] = useState(null);

  // ตรวจสอบสิทธิ์การทำโครงงานจากหลายแหล่งข้อมูล
  const hasProjectEligibility = () => {
    if (student.eligibility?.project?.eligible !== undefined) {
      return student.eligibility.project.eligible;
    }
    if (typeof student.projectEligible === 'boolean') {
      return student.projectEligible;
    }
    if (student.totalCredits && student.majorCredits) {
      return student.totalCredits >= 95 && student.majorCredits >= 47;
    }
    return false;
  };

  const getEligibilityMessage = () => {
    if (student.eligibility?.project?.message) {
      return student.eligibility.project.message;
    }
    if (progress?.project?.blockReason) {
      return progress.project.blockReason;
    }
    if (student.projectEligibleMessage) {
      return student.projectEligibleMessage;
    }
    return "ต้องมีหน่วยกิตสะสมมากกว่า 95 หน่วยกิต และหน่วยกิตวิชาเอกมากกว่า 47 หน่วยกิต";
  };

  const isEligible = hasProjectEligibility();
  const eligibilityMessage = getEligibilityMessage();

  // ข้อมูลจากระบบเดิม
  const projectSteps = progress?.project?.steps || [];
  const currentStepDisplay = progress?.project?.currentStepDisplay || 0;
  const totalStepsDisplay = progress?.project?.totalStepsDisplay || 0;
  const overallProgress = progress?.project?.progress || 0;
  const overallStatus = progress?.project?.status || 'not_started';
  const hasProjectHistory = projectSteps.length > 0;

  // ดึง project ID จากข้อมูลนักศึกษา
  const projectId = student?.projectId || progress?.project?.projectId;

  // ดึงข้อมูล workflow state เมื่อมี projectId
  useEffect(() => {
    const fetchWorkflowState = async () => {
      if (!projectId) return;

      setLoadingWorkflowState(true);
      setWorkflowError(null);

      try {
        const response = await getProjectStateWithDeadlines(projectId);
        if (response.success && response.data) {
          setWorkflowState(response.data);
        }
      } catch (error) {
        console.error('Error fetching workflow state:', error);
        setWorkflowError('ไม่สามารถดึงข้อมูล workflow state ได้');
      } finally {
        setLoadingWorkflowState(false);
      }
    };

    fetchWorkflowState();
  }, [projectId]);

  // Config สำหรับ status tag
  const statusTagConfig = (() => {
    switch (overallStatus) {
      case 'completed':
        return { color: 'success', label: 'เสร็จสิ้น', icon: <CheckCircleOutlined /> };
      case 'failed':
        return { color: 'error', label: 'สอบหัวข้อไม่ผ่าน', icon: <ExclamationCircleOutlined /> };
      case 'archived':
        return { color: 'default', label: 'เก็บถาวร', icon: <InfoCircleOutlined /> };
      case 'not_started':
        return { color: 'default', label: 'ยังไม่เริ่ม', icon: <InfoCircleOutlined /> };
      default:
        return { color: 'processing', label: 'กำลังดำเนินการ', icon: <ClockCircleOutlined /> };
    }
  })();

  const showEligibilityWarning = !isEligible && !hasProjectHistory;

  // ข้อมูลจากระบบใหม่
  const isOverdue = workflowState?.isOverdue || false;
  const isBlocked = workflowState?.isBlocked || false;
  const currentPhase = workflowState?.currentPhase || null;

  // Handler สำหรับการคลิกปุ่มดำเนินการ
  const handleAction = (item) => {
    if (item.actionLink) {
      navigate(item.actionLink);
    }
  };

  // แสดง overall status พร้อม overdue/blocked warning
  const renderStatusTag = () => {
    if (showEligibilityWarning) {
      return <Tag color="error" icon={<LockOutlined />}>ยังไม่มีสิทธิ์</Tag>;
    }

    return (
      <Space>
        <Tag color={statusTagConfig.color} icon={statusTagConfig.icon}>
          {statusTagConfig.label}
        </Tag>
        {isOverdue && (
          <Tag color="error" icon={<WarningOutlined />}>
            เลยกำหนด
          </Tag>
        )}
        {isBlocked && !isOverdue && (
          <Tag color="warning" icon={<LockOutlined />}>
            Blocked
          </Tag>
        )}
      </Space>
    );
  };

  // แปลง phase เป็นภาษาไทย
  const getPhaseLabel = (phase) => {
    const phaseMap = {
      'DRAFT': 'ร่าง',
      'ADVISOR_ASSIGNED': 'มอบหมายอาจารย์แล้ว',
      'TOPIC_SUBMISSION': 'ยื่นหัวข้อ',
      'TOPIC_EXAM_PENDING': 'รอสอบหัวข้อ',
      'TOPIC_EXAM_SCHEDULED': 'กำหนดสอบหัวข้อแล้ว',
      'TOPIC_EXAM_FAILED': 'สอบหัวข้อไม่ผ่าน',
      'IN_PROGRESS': 'ดำเนินการ',
      'THESIS_SUBMISSION': 'ยื่นรายงาน',
      'THESIS_EXAM_PENDING': 'รอสอบป้องกัน',
      'THESIS_EXAM_SCHEDULED': 'กำหนดสอบป้องกันแล้ว',
      'THESIS_EXAM_PASSED': 'สอบป้องกันผ่าน',
      'COMPLETED': 'เสร็จสิ้น',
      'ARCHIVED': 'เก็บถาวร'
    };
    return phaseMap[phase] || phase;
  };

  return (
    <Card
      title={
        <Space>
          <ExperimentOutlined />
          <span>โครงงานพิเศษ</span>
          {workflowState?.workflowType === 'project2' && (
            <Tag color="purple">ปริญญานิพนธ์ (Thesis)</Tag>
          )}
          {renderStatusTag()}
        </Space>
      }
      extra={
        <Space>
          <Progress
            type="circle"
            percent={overallProgress}
            size={40}
            format={percent => `${percent}%`}
            status={isOverdue ? 'exception' : undefined}
          />
          {totalStepsDisplay > 0 && (
            <Text type="secondary">
              ขั้นตอนที่ {currentStepDisplay}/{totalStepsDisplay}
            </Text>
          )}
          {isEligible ? (
            <Tag color="success"><UnlockOutlined /> มีสิทธิ์</Tag>
          ) : (
            <Tooltip title={eligibilityMessage}>
              <Tag color="error"><LockOutlined /> ยังไม่มีสิทธิ์</Tag>
            </Tooltip>
          )}
        </Space>
      }
      loading={loadingWorkflowState}
    >
      {/* แสดง Workflow Error (ถ้ามี) */}
      {workflowError && (
        <Alert
          type="warning"
          message="หมายเหตุ"
          description={workflowError}
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      {/* แสดงเนื้อหาหลัก */}
      {student.isEnrolledProject || hasProjectHistory ? (
        <>
          {projectSteps.length > 0 ? (
            <TimelineItems items={projectSteps} onAction={handleAction} />
          ) : (
            <Empty description="ยังไม่มีข้อมูลขั้นตอนโครงงาน" />
          )}

          {/* แสดงข้อมูล Phase ปัจจุบัน (จากระบบใหม่) */}
          {currentPhase && (
            <div style={{
              marginTop: 16,
              padding: 12,
              background: isBlocked ? '#fff2e8' : '#f0f5ff',
              border: `1px solid ${isBlocked ? '#ffbb96' : '#adc6ff'}`,
              borderRadius: 4
            }}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Space>
                  <Text strong>Phase ปัจจุบัน:</Text>
                  <Tag color="blue">{getPhaseLabel(currentPhase)}</Tag>
                </Space>
                {isBlocked && (
                  <Text type="warning">
                    <LockOutlined /> โครงงานถูกระงับ กรุณาติดต่ออาจารย์ที่ปรึกษา
                  </Text>
                )}
                {isOverdue && !isBlocked && (
                  <Text type="danger">
                    <WarningOutlined /> เลยกำหนดส่งเอกสาร
                  </Text>
                )}
              </Space>
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <SolutionOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
          <Paragraph>คุณยังไม่ได้ลงทะเบียนโครงงานพิเศษ</Paragraph>
          <Button
            type="primary"
            href="/project-registration"
            disabled={!isEligible}
          >
            ลงทะเบียนโครงงาน
          </Button>
          {!isEligible && (
            <Paragraph style={{ marginTop: 16 }} type="danger">
              <InfoCircleOutlined /> {eligibilityMessage}
            </Paragraph>
          )}
        </div>
      )}
    </Card>
  );
};

export default ProjectSection;