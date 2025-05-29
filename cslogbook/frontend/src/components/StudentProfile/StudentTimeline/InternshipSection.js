import React, { useState, useEffect } from 'react';
import { Card, Space, Tag, Progress, Tooltip, Empty, Button, Typography, Alert, Spin } from 'antd';
import { 
  LaptopOutlined, UnlockOutlined, LockOutlined, 
  FileDoneOutlined, InfoCircleOutlined, ReloadOutlined 
} from '@ant-design/icons';
import TimelineItems from './TimelineItems';
import { workflowService } from '../../../services/workflowService';
import { calculateStudentYear, isEligibleForInternship } from '../../../utils/studentUtils';

const { Text, Paragraph } = Typography;

// คอมโพเนนต์สำหรับแสดงส่วนการฝึกงาน
const InternshipSection = ({ student, progress }) => {
  const [requirements, setRequirements] = useState({ internship: null });
  const [workflowData, setWorkflowData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ดึงข้อมูล workflow timeline จาก API
  useEffect(() => {
    const fetchWorkflowTimeline = async () => {
      if (!student?.studentId && !student?.studentCode) return;

      try {
        setLoading(true);
        const studentId = student.studentId || student.studentCode;
        
        console.log('🔄 เรียก API workflow timeline สำหรับนักศึกษา:', studentId);
        
        // ดึง timeline จาก backend ผ่าน workflowService ใหม่
        const timelineResponse = await workflowService.getInternshipTimeline(studentId);
        
        console.log('📡 ผลตอบกลับจาก workflow API:', timelineResponse);
        
        if (timelineResponse.success) {
          setWorkflowData(timelineResponse.data);
          console.log('✅ ตั้งค่า workflowData สำเร็จ:', timelineResponse.data);
        } else {
          console.warn('⚠️ API ไม่สำเร็จ, ใช้ข้อมูลจาก progress:', timelineResponse.error);
          // ใช้ข้อมูลจาก progress object เป็น fallback
          if (progress?.internship) {
            setWorkflowData({
              steps: progress.internship.steps || [],
              progress: progress.internship.progress || 0,
              status: progress.internship.status || 'not_started',
              currentStepDisplay: progress.internship.currentStepDisplay || 1,
              totalStepsDisplay: progress.internship.totalStepsDisplay || 0,
              blocked: progress.internship.blocked || false,
              blockReason: progress.internship.blockReason || null
            });
          }
        }

        // ดึงข้อกำหนดจาก student object
        if (student?.requirements) {
          setRequirements(student.requirements);
        }
      } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูล workflow:', error);
        
        // ใช้ข้อมูลจาก progress เป็น fallback
        if (progress?.internship) {
          console.log('🔄 ใช้ข้อมูลจาก progress เป็น fallback');
          setWorkflowData({
            steps: progress.internship.steps || [],
            progress: progress.internship.progress || 0,
            status: progress.internship.status || 'not_started',
            currentStepDisplay: progress.internship.currentStepDisplay || 1,
            totalStepsDisplay: progress.internship.totalStepsDisplay || 0,
            blocked: progress.internship.blocked || false,
            blockReason: progress.internship.blockReason || null
          });
        } else {
          setWorkflowData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflowTimeline();
  }, [student?.studentId, student?.studentCode, refreshKey]);

  // ตรวจสอบการลงทะเบียนฝึกงาน โดยใช้หลายวิธี
  const isRegistered = React.useMemo(() => {
    return Boolean(
      student?.isEnrolledInternship === true ||
      student?.isEnrolledInternship === 1 ||
      student?.internshipStatus === 'in_progress' ||
      student?.internshipStatus === 'completed' ||
      progress?.internship?.currentStep > 0 ||
      workflowData?.steps?.length > 0
    );
  }, [student, progress, workflowData]);

  // ตรวจสอบสิทธิ์การฝึกงานด้วย utils function
  const checkEligibilityWithUtils = () => {
    const studentCode = student.studentCode || student.studentId;
    const studentYearResult = calculateStudentYear(studentCode);
    const studentYear = studentYearResult.error ? 0 : studentYearResult.year;

    return isEligibleForInternship(
      studentYear, 
      student.totalCredits, 
      student.majorCredits, 
      requirements.internship
    );
  };

  // ตรวจสอบสิทธิ์การฝึกงานจากหลายแหล่งข้อมูล
  const hasInternshipEligibility = () => {
    // กรณีมีข้อมูลจาก eligibility object ซึ่งเป็นรูปแบบใหม่
    if (student.eligibility && student.eligibility.internship) {
      return student.eligibility.internship.eligible;
    }
    
    // กรณีมีข้อมูลจาก workflowData
    if (workflowData && typeof workflowData.blocked === 'boolean') {
      return !workflowData.blocked;
    }
    
    // กรณีมีข้อมูลจาก progress object
    if (progress && progress.internship && typeof progress.internship.blocked === 'boolean') {
      return !progress.internship.blocked;
    }
    
    // กรณีมีข้อมูลจาก student object (รูปแบบเดิม)
    if (typeof student.internshipEligible === 'boolean') {
      return student.internshipEligible;
    }
    
    // ใช้ utils function เป็น fallback
    const eligibilityCheck = checkEligibilityWithUtils();
    return eligibilityCheck.eligible;
  };
  
  // ดึงข้อความเหตุผลที่ไม่มีสิทธิ์ (ถ้ามี)
  const getEligibilityMessage = () => {
    if (student.eligibility && student.eligibility.internship && 
        student.eligibility.internship.message) {
      return student.eligibility.internship.message;
    }
    
    if (workflowData && workflowData.blockReason) {
      return workflowData.blockReason;
    }
    
    if (progress && progress.internship && progress.internship.blockReason) {
      return progress.internship.blockReason;
    }
    
    if (student.internshipEligibleMessage) {
      return student.internshipEligibleMessage;
    }
    
    // ใช้ utils function เพื่อดึงข้อความ
    const eligibilityCheck = checkEligibilityWithUtils();
    return eligibilityCheck.message;
  };

  const isEligible = hasInternshipEligibility();
  const eligibilityMessage = getEligibilityMessage();

  // รวมข้อมูลขั้นตอนจาก workflowData และ progress (ให้ความสำคัญกับ workflowData)
  const timelineSteps = workflowData?.steps || progress?.internship?.steps || [];
  const currentStepDisplay = workflowData?.currentStepDisplay || (progress?.internship?.currentStep + 1) || 1;
  const totalStepsDisplay = workflowData?.totalStepsDisplay || progress?.internship?.totalSteps || timelineSteps.length;
  const overallProgress = workflowData?.progress || progress?.internship?.progress || 0;
  
  // ตรวจสอบการแสดง blocked status
  const isBlocked = workflowData?.blocked || progress?.internship?.blocked || !isEligible;

  // Handler สำหรับการคลิกปุ่มดำเนินการ
  const handleAction = async (item) => {
    // จัดการการดำเนินการตาม step_key หรือ action
    if (item.step_key) {
      switch (item.step_key) {
        case 'INTERNSHIP_CS05_SUBMITTED':
          window.location.href = '/internship-registration';
          break;
        case 'INTERNSHIP_COMPANY_RESPONSE_PENDING':
          window.location.href = '/internship/upload-response';
          break;
        case 'INTERNSHIP_IN_PROGRESS':
          window.location.href = '/internship/daily-log';
          break;
        case 'INTERNSHIP_SUMMARY_PENDING':
          window.location.href = '/internship/summary';
          break;
        default:
          if (item.actionLink) {
            window.location.href = item.actionLink;
          }
      }
    } else if (item.actionLink) {
      // สำหรับรูปแบบเดิม
      window.location.href = item.actionLink;
    }
  };

  // ฟังก์ชันรีเฟรชข้อมูล
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Card 
      title={
        <Space>
          <LaptopOutlined />
          <span>การฝึกงาน</span>
          {isBlocked ? (
            <Tag color="error">ไม่มีสิทธิ์</Tag>
          ) : (
            <Tag color={overallProgress === 100 ? "success" : "processing"}>
              {overallProgress === 100 ? "เสร็จสิ้น" : "กำลังดำเนินการ"}
            </Tag>
          )}
        </Space>
      }
      extra={
        <Space>
          <Progress 
            type="circle" 
            percent={overallProgress} 
            size={40} 
            format={percent => `${percent}%`}
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
          <Button 
            icon={<ReloadOutlined />} 
            size="small" 
            onClick={handleRefresh}
            loading={loading}
            title="รีเฟรชข้อมูล"
          />
        </Space>
      }
      loading={loading}
    >
      
      {/* แสดงผลตามเงื่อนไข */}
      {isRegistered || student.isEnrolledInternship ? (
        timelineSteps.length > 0 ? (
          <TimelineItems items={timelineSteps} onAction={handleAction} />
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin tip="กำลังโหลดข้อมูลขั้นตอนการฝึกงาน..." />
          </div>
        ) : (
          <Empty 
            description="ยังไม่มีข้อมูลขั้นตอนการฝึกงาน" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )
      ) : (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <FileDoneOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
          <Paragraph>คุณยังไม่ได้ลงทะเบียนฝึกงาน</Paragraph>
          <Button 
            type="primary" 
            href="/internship-registration" 
            disabled={!isEligible}
          >
            ลงทะเบียนฝึกงาน
          </Button>
          {!isEligible && (
            <div style={{ marginTop: 16 }}>
              <Alert
                message="ยังไม่มีสิทธิ์ลงทะเบียนฝึกงาน"
                description={eligibilityMessage}
                type="warning"
                showIcon
                icon={<InfoCircleOutlined />}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default InternshipSection;