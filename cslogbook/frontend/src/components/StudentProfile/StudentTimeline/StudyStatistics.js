import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Tooltip, Typography, Divider, Spin } from 'antd';
import { 
  BookOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, 
  InfoCircleOutlined, WarningOutlined
} from '@ant-design/icons';
import { studentService } from '../../../services/studentService';
import { 
  calculateStudentYear, 
  isEligibleForInternship, 
  isEligibleForProject 
} from '../../../utils/studentUtils';
import { useInternshipStatus } from '../../../contexts/InternshipStatusContext'; // เพิ่มบรรทัดนี้

const { Text } = Typography;

// คอมโพเนนต์สำหรับแสดงสถิติการศึกษา
const StudyStatistics = ({ student, progress }) => {
  // 1. State และ useEffect สำหรับดึงข้อมูลเสริม
  const [additionalData, setAdditionalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState({
    internship: null,
    project: null
  });

  useEffect(() => {
    const fetchAdditionalStudentInfo = async () => {
      if (!student?.studentCode && !student?.studentId) return;
      try {
        setLoading(true);
        const studentCode = student.studentCode || student.studentId;
        const response = await studentService.getStudentInfo(studentCode);
        if (response?.success && response?.data) {
          setAdditionalData(response.data);
          if (response.data.requirements) {
            setRequirements({
              internship: response.data.requirements.internship || null,
              project: response.data.requirements.project || null
            });
          }
        }
      } catch (error) {
        console.error('Error fetching additional student info:', error);
      } finally {
        setLoading(false);
      }
    };
    if (student && (!student.totalCredits || !student.majorCredits)) {
      fetchAdditionalStudentInfo();
    }
  }, [student]);

  // 2. เรียก Hook context สำหรับสถานะฝึกงาน/โครงงานพิเศษ (ต้องอยู่บนสุด)
  const {
    internshipStatus: contextInternshipStatus,
    loading: contextLoading,
    error: contextError,
    projectStatus: contextProjectStatus,
  } = useInternshipStatus();

  // 3. รวมข้อมูลจากแหล่งต่างๆ โดยให้ความสำคัญกับข้อมูลหลักก่อน
  const mergedStudentData = {
    ...student,
    ...(additionalData || {}),
    totalCredits: student.totalCredits || 0,
    majorCredits: student.majorCredits || 0,
  };

  // 4. ดึงค่าพื้นฐานจาก student object โดยตรง (ที่ backend ส่งมา)
  // const internshipBaseCredits = student?.internshipBaseCredits;
  // const projectBaseCredits = student?.projectBaseCredits;
  // const projectMajorBaseCredits = student?.projectMajorBaseCredits;

  // ตรวจสอบสิทธิ์การฝึกงานและโครงงานโดยใช้ utils
  const internshipEligibility = isEligibleForInternship(
    mergedStudentData.studentYear, 
    mergedStudentData.totalCredits, 
    mergedStudentData.majorCredits, 
    requirements.internship
  );
  
  const projectEligibility = isEligibleForProject(
    mergedStudentData.studentYear, 
    mergedStudentData.totalCredits, 
    mergedStudentData.majorCredits, 
    requirements.project
  );
  
  const isEligibleForInternshipStatus = internshipEligibility.eligible;
  const isEligibleForProjectStatus = projectEligibility.eligible;
  

  // คำนวณชั้นปีจากรหัสนักศึกษา (ต้องอยู่หลัง mergedStudentData)
  const studentCode = mergedStudentData.studentCode || mergedStudentData.studentId;
  const studentYearResult = calculateStudentYear(studentCode);

  // 3. ส่วนนี้ยังใช้ props เหมือนเดิม
  const internshipStatusFromProps = progress?.internship?.status ||
    mergedStudentData.internshipStatus ||
    (progress?.internship?.progress >= 100 ? 'completed' :
      progress?.internship?.progress > 0 ? 'in_progress' : 'not_started');

  const projectStatusFromProps = progress?.project?.status ||
    mergedStudentData.projectStatus ||
    (progress?.project?.progress >= 100 ? 'completed' :
      progress?.project?.progress > 0 ? 'in_progress' : 'not_started');

  // 4. ใช้ค่าจาก context ถ้ามี ไม่งั้น fallback เป็น props
  const internshipStatus = contextInternshipStatus || internshipStatusFromProps;
  const projectStatus = contextProjectStatus || projectStatusFromProps;

  // 5. ตรวจสอบสถานะผ่าน/ไม่ผ่าน
  const hasPassedInternship = internshipStatus === 'completed';
  const hasPassedProject = projectStatus === 'completed';
  const isProjectFailed = projectStatus === 'failed';

  // 6. ฟังก์ชันแปลสถานะเป็นข้อความไทย
  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'ผ่าน';
      case 'in_progress': return 'กำลังดำเนินการ';
      case 'not_started': return 'ยังไม่เริ่ม';
      default: return 'ไม่ผ่าน';
    }
  };

  // 7. ฟังก์ชันสำหรับสีของสถานะสิทธิ์
  const getEligibilityIcon = (isEligible) => isEligible ? <CheckCircleOutlined /> : <WarningOutlined />;

  // 8. loading เฉพาะส่วนสถานะ (context)
  const showStatusLoading = contextLoading && !contextError;


  // 10. แสดง loading เฉพาะเมื่อกำลังดึงข้อมูลเสริม
  if (loading && (!student?.totalCredits && !student?.majorCredits)) {
    return (
      <Card title={
        <div>
          <BookOutlined style={{ marginRight: 8 }} />
          สถานะการศึกษา
        </div>
      }>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" spinning={true} tip="กำลังโหลดข้อมูลสถิติ...">
        <div style={{ minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>{/* Loading content */}</div>
        </div>
      </Spin>
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
      {/* ลบ Row/Col หน่วยกิตสะสมและหน่วยกิตภาควิชาออก เหลือเฉพาะสถานะฝึกงานและโครงงาน */}
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
        </Col>
        
        <Col xs={12} md={6}>
          <Tooltip title={
            hasPassedProject ? 'นักศึกษาผ่านโครงงานพิเศษแล้ว' :
              projectStatus === 'in_progress' ? 'นักศึกษากำลังทำโครงงานพิเศษ' :
                isProjectFailed ? 'นักศึกษายังไม่ผ่านการสอบหัวข้อโครงงาน' :
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
                  projectStatus === 'in_progress' ? '#1890ff' :
                    isProjectFailed ? '#f5222d' : '#faad14'
              }}
              prefix={
                showStatusLoading
                  ? null
                  : hasPassedProject ? <CheckCircleOutlined /> :
                    projectStatus === 'in_progress' ? <InfoCircleOutlined /> :
                      isProjectFailed ? <CloseCircleOutlined /> :
                        getEligibilityIcon(isEligibleForProjectStatus)
              }
            />
          </Tooltip>
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

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