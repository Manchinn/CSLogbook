import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Tooltip, Typography, Divider, Spin, Tag, Progress } from 'antd';
import { 
  BookOutlined, TrophyOutlined, BarChartOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, 
  InfoCircleOutlined, WarningOutlined
} from '@ant-design/icons';
import { studentService } from '../../../services/studentService';
import { 
  calculateStudentYear, 
  isEligibleForInternship, 
  isEligibleForProject, 
  getInternshipRequirements, 
  getProjectRequirements 
} from '../../../utils/studentUtils';
import { useInternshipStatus } from '../../../contexts/InternshipStatusContext'; // เพิ่มบรรทัดนี้

const { Text } = Typography;

// คอมโพเนนต์สำหรับแสดงสถิติการศึกษา
const StudyStatistics = ({ student, progress }) => {
  const [additionalData, setAdditionalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState({
    internship: null,
    project: null
  });

  // ดึงข้อมูลเพิ่มเติมจาก studentService ถ้าจำเป็น
  useEffect(() => {
    const fetchAdditionalStudentInfo = async () => {
      if (!student?.studentCode && !student?.studentId) return;
      
      try {
        setLoading(true);
        const studentCode = student.studentCode || student.studentId;
        const response = await studentService.getStudentInfo(studentCode);
        
        if (response?.success && response?.data) {
          setAdditionalData(response.data);
          
          // ดึงข้อกำหนดจาก API response ถ้ามี
          if (response.data.requirements) {
            setRequirements({
              internship: response.data.requirements.internship || null,
              project: response.data.requirements.project || null
            });
          }
        }
      } catch (error) {
        console.error('Error fetching additional student info:', error);
        // ไม่แสดง error เพราะเป็นข้อมูลเสริม
      } finally {
        setLoading(false);
      }
    };

    // ดึงข้อมูลเพิ่มเติมเฉพาะเมื่อข้อมูลหลักไม่ครบถ้วน
    if (student && (!student.totalCredits || !student.majorCredits)) {
      fetchAdditionalStudentInfo();
    }
  }, [student?.studentCode, student?.studentId]);

  // รวมข้อมูลจากแหล่งต่างๆ โดยให้ความสำคัญกับข้อมูลหลักก่อน
  const mergedStudentData = {
    ...student,
    ...(additionalData || {}),
    // ให้ความสำคัญกับข้อมูลจาก props หลัก
    totalCredits: student.totalCredits || additionalData?.totalCredits || 0,
    majorCredits: student.majorCredits || additionalData?.majorCredits || 0,
    gpa: student.gpa || student.cumulativeGPA || additionalData?.gpa || 0,
  };

  // คำนวณชั้นปีจากรหัสนักศึกษา
  const studentCode = mergedStudentData.studentCode || mergedStudentData.studentId;
  const studentYearResult = calculateStudentYear(studentCode);
  const studentYear = studentYearResult.error ? 0 : studentYearResult.year;

  // ดึงข้อกำหนดจาก utils (ใช้ค่าจาก database หรือ default)
  const internshipRequirements = getInternshipRequirements(requirements.internship);
  const projectRequirements = getProjectRequirements(requirements.project);

  
  // จำนวนหน่วยกิตตามหลักสูตร (ใช้ค่าจาก database หรือ default)
  const totalCreditsRequired = mergedStudentData.totalCreditsRequired || 127;
  const majorCreditsRequired = mergedStudentData.majorCreditsRequired || 57;
  
  // ใช้ข้อกำหนดจาก utils แทนการ hardcode
  const INTERNSHIP_CREDIT_REQUIREMENT = internshipRequirements.MIN_TOTAL_CREDITS;
  const PROJECT_MAJOR_CREDIT_REQUIREMENT = projectRequirements.MIN_MAJOR_CREDITS;
  
  // ตรวจสอบสิทธิ์การฝึกงานและโครงงานโดยใช้ utils
  const internshipEligibility = isEligibleForInternship(
    studentYear, 
    mergedStudentData.totalCredits, 
    mergedStudentData.majorCredits, 
    requirements.internship
  );
  
  const projectEligibility = isEligibleForProject(
    studentYear, 
    mergedStudentData.totalCredits, 
    mergedStudentData.majorCredits, 
    requirements.project
  );
  
  const isEligibleForInternshipStatus = internshipEligibility.eligible;
  const isEligibleForProjectStatus = projectEligibility.eligible;
  
  // คำนวณร้อยละความคืบหน้า
  const totalCreditsProgress = Math.min(
    Math.round((mergedStudentData.totalCredits / totalCreditsRequired) * 100), 
    100
  );
  const majorCreditsProgress = Math.min(
    Math.round((mergedStudentData.majorCredits / majorCreditsRequired) * 100), 
    100
  );

  // คำนวณความคืบหน้าสู่เกณฑ์การฝึกงานและโครงงาน
  const internshipEligibilityProgress = Math.min(
    Math.round((mergedStudentData.totalCredits / INTERNSHIP_CREDIT_REQUIREMENT) * 100),
    100
  );
  const projectEligibilityProgress = Math.min(
    Math.round((mergedStudentData.majorCredits / PROJECT_MAJOR_CREDIT_REQUIREMENT) * 100),
    100
  );

  // ดึงข้อมูลเกรดและรายวิชาจากข้อมูลที่รวมแล้ว
  const currentSemester = mergedStudentData.currentSemester || {};
  const recentSubjects = mergedStudentData.recentSubjects || 
                        mergedStudentData.recentCourses || 
                        [];
  
  // ใช้ context สำหรับสถานะฝึกงาน/โครงงานพิเศษ
  const {
    internshipStatus: contextInternshipStatus,
    loading: contextLoading,
    error: contextError,
    // ถ้ามี projectStatus ใน context ให้ดึงมาด้วย (ถ้ายังไม่มีจะ fallback)
    projectStatus: contextProjectStatus,
  } = useInternshipStatus();

  // ส่วนนี้ยังใช้ props เหมือนเดิม
  const internshipStatusFromProps = progress?.internship?.status ||
    mergedStudentData.internshipStatus ||
    (progress?.internship?.progress >= 100 ? 'completed' :
      progress?.internship?.progress > 0 ? 'in_progress' : 'not_started');

  const projectStatusFromProps = progress?.project?.status ||
    mergedStudentData.projectStatus ||
    (progress?.project?.progress >= 100 ? 'completed' :
      progress?.project?.progress > 0 ? 'in_progress' : 'not_started');

  // ใช้ค่าจาก context ถ้ามี ไม่งั้น fallback เป็น props
  const internshipStatus = contextInternshipStatus || internshipStatusFromProps;
  const projectStatus = contextProjectStatus || projectStatusFromProps;

  // ตรวจสอบสถานะผ่าน/ไม่ผ่าน
  const hasPassedInternship = internshipStatus === 'completed';
  const hasPassedProject = projectStatus === 'completed';

  // ฟังก์ชันแปลสถานะเป็นข้อความไทย
  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'ผ่าน';
      case 'in_progress': return 'กำลังดำเนินการ';
      case 'not_started': return 'ยังไม่เริ่ม';
      default: return 'ไม่ผ่าน';
    }
  };

  // ฟังก์ชันสำหรับสีของสถานะสิทธิ์
  const getEligibilityColor = (isEligible) => isEligible ? '#52c41a' : '#faad14';
  const getEligibilityIcon = (isEligible) => isEligible ? <CheckCircleOutlined /> : <WarningOutlined />;

  // loading เฉพาะส่วนสถานะ (context)
  const showStatusLoading = contextLoading && !contextError;

  // ตรวจสอบความพร้อมในการจบการศึกษา
  const isReadyToGraduate = 
    mergedStudentData.totalCredits >= totalCreditsRequired && 
    mergedStudentData.majorCredits >= majorCreditsRequired && 
    internshipStatus === 'completed' && 
    projectStatus === 'completed';

  // แสดง loading เฉพาะเมื่อกำลังดึงข้อมูลเสริม
  if (loading && (!student?.totalCredits && !student?.majorCredits)) {
    return (
      <Card title={
        <div>
          <BookOutlined style={{ marginRight: 8 }} />
          สถานะการศึกษา
        </div>
      }>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" tip="กำลังโหลดข้อมูลสถิติ..." />
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div>
          <BookOutlined style={{ marginRight: 8 }} />
          สถานะการศึกษา
        </div>
      }
    >
      <Row gutter={[16, 16]}>
        {/* หน่วยกิตสะสม - ใช้ props เหมือนเดิม */}
        <Col xs={24} md={12}>
          <Tooltip title={
            `หน่วยกิตสะสมทั้งหมด ${mergedStudentData.totalCredits} จากที่ต้องการ ${totalCreditsRequired}\n` +
            `${internshipEligibility.message}`
          }>
            <Statistic 
              title={
                <div>
                  หน่วยกิตสะสม 
                  <Tag 
                    color={getEligibilityColor(isEligibleForInternshipStatus)} 
                    style={{ marginLeft: 8, fontSize: '10px' }}
                  >
                    {isEligibleForInternshipStatus ? 'พร้อมฝึกงาน' : 'ยังไม่พร้อมฝึกงาน'}
                  </Tag>
                </div>
              }
              value={mergedStudentData.totalCredits} 
              suffix={`/ ${totalCreditsRequired}`} 
              valueStyle={{ 
                color: mergedStudentData.totalCredits >= totalCreditsRequired ? '#52c41a' : '#1890ff' 
              }}
              prefix={<BarChartOutlined />}
            />
          </Tooltip>
        </Col>
        
        {/* หน่วยกิตภาควิชา - เกี่ยวข้องกับโครงงาน */}
        <Col xs={24} md={12}>
          <Tooltip title={
            `หน่วยกิตวิชาเอก ${mergedStudentData.majorCredits} จากที่ต้องการ ${majorCreditsRequired}\n` +
            `${projectEligibility.message}`
          }>
            <Statistic 
              title={
                <div>
                  หน่วยกิตภาควิชา
                  <Tag 
                    color={getEligibilityColor(isEligibleForProjectStatus)} 
                    style={{ marginLeft: 8, fontSize: '10px' }}
                  >
                    {isEligibleForProjectStatus ? 'พร้อมโครงงาน' : 'ยังไม่พร้อมโครงงาน'}
                  </Tag>
                </div>
              }
              value={mergedStudentData.majorCredits} 
              suffix={`/ ${majorCreditsRequired}`} 
              valueStyle={{ 
                color: mergedStudentData.majorCredits >= majorCreditsRequired ? '#52c41a' : '#faad14' 
              }}
              prefix={<BookOutlined />}
            />
          </Tooltip>
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Tooltip title={
            hasPassedInternship ? 'นักศึกษาผ่านการฝึกงานแล้ว' :
              internshipStatus === 'in_progress' ? 'นักศึกษากำลังฝึกงาน' :
                internshipEligibility.message
          }>
            <Statistic
              title="การฝึกงาน"
              value={
                showStatusLoading
                  ? <Spin size="small" />
                  : getStatusText(internshipStatus)
              }
              valueStyle={{
                color: hasPassedInternship ? '#52c41a' :
                  internshipStatus === 'in_progress' ? '#1890ff' : '#faad14'
              }}
              prefix={
                showStatusLoading
                  ? null
                  : hasPassedInternship ? <CheckCircleOutlined /> :
                    internshipStatus === 'in_progress' ? <InfoCircleOutlined /> :
                      getEligibilityIcon(isEligibleForInternshipStatus)
              }
            />
          </Tooltip>
          {!isEligibleForInternshipStatus && !showStatusLoading && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {internshipEligibility.message}
            </Text>
          )}
        </Col>
        
        <Col xs={12} md={6}>
          <Tooltip title={
            hasPassedProject ? 'นักศึกษาผ่านโครงงานพิเศษแล้ว' :
              projectStatus === 'in_progress' ? 'นักศึกษากำลังทำโครงงานพิเศษ' :
                projectEligibility.message
          }>
            <Statistic
              title="โครงงานพิเศษ"
              value={
                showStatusLoading
                  ? <Spin size="small" />
                  : getStatusText(projectStatus)
              }
              valueStyle={{
                color: hasPassedProject ? '#52c41a' :
                  projectStatus === 'in_progress' ? '#1890ff' : '#faad14'
              }}
              prefix={
                showStatusLoading
                  ? null
                  : hasPassedProject ? <CheckCircleOutlined /> :
                    projectStatus === 'in_progress' ? <InfoCircleOutlined /> :
                      getEligibilityIcon(isEligibleForProjectStatus)
              }
            />
          </Tooltip>
          {!isEligibleForProjectStatus && !showStatusLoading && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {projectEligibility.message}
            </Text>
          )}
        </Col>
      </Row>

      {/* แสดงข้อมูลการคำนวณชั้นปีถ้ามี error */}
      {studentYearResult.error && (
        <div style={{ marginTop: 16 }}>
          <Text type="warning" style={{ fontSize: '12px' }}>
            <WarningOutlined style={{ marginRight: 4 }} />
            {studentYearResult.message}
          </Text>
        </div>
      )}

      {/* แสดง loading indicator เมื่อกำลังดึงข้อมูลเสริม */}
      {loading && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Spin size="small" /> 
          <Text type="secondary" style={{ marginLeft: 8 }}>กำลังอัพเดทข้อมูล...</Text>
        </div>
      )}
    </Card>
  );
};

export default StudyStatistics;