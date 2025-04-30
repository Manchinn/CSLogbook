import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Badge, Space, Alert, Button, Spin, message } from 'antd';
import { useParams } from 'react-router-dom';
import { timelineService } from '../../../services/timelineService';
import { isEligibleForInternship, isEligibleForProject } from "../../../utils/studentUtils";
import { DEFAULT_STUDENT_DATA, DEFAULT_PROGRESS_DATA } from './helpers';
import NextAction from './NextAction';
import Notifications from './Notifications';
import EducationPath from './EducationPath';
import InternshipSection from './InternshipSection';
import ProjectSection from './ProjectSection';
import StudyStatistics from './StudyStatistics';
import ImportantDeadlines from './ImportantDeadlines';

const { Title, Text, Paragraph } = Typography;

const StudentTimeline = () => {
  const { id } = useParams(); // ใช้ useParams เพื่อดึง ID จาก URL
  const studentId = id || localStorage.getItem('studentId'); // ถ้าไม่มี id ใน URL ให้ใช้จาก localStorage

  const [student, setStudent] = useState(DEFAULT_STUDENT_DATA);
  const [progress, setProgress] = useState(DEFAULT_PROGRESS_DATA);
  const [notifications, setNotifications] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // เรียกข้อมูลไทม์ไลน์จาก API
    const fetchTimelineData = async () => {
      try {
        setLoading(true);
        
        // ตรวจสอบว่า studentId มีค่าหรือไม่ ถ้าไม่มีให้กำหนดค่าเริ่มต้น
        if (!studentId) {
          setError('ไม่พบรหัสนักศึกษา กรุณาเข้าสู่ระบบใหม่');
          setLoading(false);
          return;
        }
        
        const response = await timelineService.getStudentTimeline(studentId);
        
        if (response.success) {
          // ข้อมูลจาก API สำเร็จ
          const studentData = response.data.student || {};
          
          // การคำนวณสิทธิ์การฝึกงานและโครงงานใหม่
          const internshipRequirements = studentData.requirements?.internship || null;
          const projectRequirements = studentData.requirements?.project || null;

          const internshipEligible = isEligibleForInternship(
            studentData.studentYear,
            studentData.totalCredits || 0,
            studentData.majorCredits || 0,
            internshipRequirements
          );
          
          const projectEligible = isEligibleForProject(
            studentData.studentYear,
            studentData.totalCredits || 0,
            studentData.majorCredits || 0,
            projectRequirements
          );
          
          // อัพเดทข้อมูลนักศึกษาพร้อมสถานะสิทธิ์
          setStudent({
            ...studentData,
            internshipEligible: internshipEligible.eligible,
            projectEligible: projectEligible.eligible,
            internshipEligibleMessage: internshipEligible.message,
            projectEligibleMessage: projectEligible.message
          });
          
          // Debug log
          console.log('Student Timeline Data:', {
            totalCredits: studentData.totalCredits,
            majorCredits: studentData.majorCredits,
            studentYear: studentData.studentYear,
            internshipEligible,
            projectEligible
          });
          
          // ตรวจสอบและแปลงรูปแบบข้อมูล timeline เป็น progress
          if (response.data.timeline) {
            // มีการส่งข้อมูลในรูปแบบ timeline (จาก API)
            const progressData = {
              internship: {
                steps: response.data.timeline.internship || [],
                currentStep: 0,  // ค่าเริ่มต้น
                totalSteps: response.data.timeline.internship?.length || 0,
                progress: 0,  // ค่าเริ่มต้น
                blocked: !internshipEligible.eligible,
                blockReason: internshipEligible.eligible ? "" : internshipEligible.message
              },
              project: {
                steps: response.data.timeline.project || [],
                currentStep: 0,  // ค่าเริ่มต้น
                totalSteps: response.data.timeline.project?.length || 0,
                progress: 0,  // ค่าเริ่มต้น
                blocked: !projectEligible.eligible,
                blockReason: projectEligible.eligible ? "" : projectEligible.message
              }
            };
            
            // คำนวณความคืบหน้าสำหรับแต่ละประเภท
            ['internship', 'project'].forEach(type => {
              if (progressData[type].steps.length > 0) {
                const completedSteps = progressData[type].steps.filter(step => step.status === 'completed').length;
                progressData[type].progress = Math.round((completedSteps / progressData[type].totalSteps) * 100);
                progressData[type].currentStep = progressData[type].steps.findIndex(step => step.status === 'in_progress');
                if (progressData[type].currentStep === -1) {
                  progressData[type].currentStep = completedSteps;
                }
              }
            });
            
            setProgress(progressData);
          } else if (response.data.progress) {
            // มีการส่งข้อมูลในรูปแบบ progress (ถ้ามี)
            // อัปเดตข้อมูล blocked และ blockReason ตามสถานะสิทธิ์ที่คำนวณใหม่
            const updatedProgress = {
              ...response.data.progress,
              internship: {
                ...response.data.progress.internship,
                blocked: !internshipEligible.eligible,
                blockReason: internshipEligible.eligible ? "" : internshipEligible.message
              },
              project: {
                ...response.data.progress.project,
                blocked: !projectEligible.eligible,
                blockReason: projectEligible.eligible ? "" : projectEligible.message
              }
            };
            setProgress(updatedProgress);
          } else {
            // ไม่มีข้อมูลทั้งสองรูปแบบ ใช้ค่าเริ่มต้น
            setProgress({
              internship: {
                ...DEFAULT_PROGRESS_DATA.internship,
                blocked: !internshipEligible.eligible,
                blockReason: internshipEligible.eligible ? "" : internshipEligible.message
              },
              project: {
                ...DEFAULT_PROGRESS_DATA.project,
                blocked: !projectEligible.eligible,
                blockReason: projectEligible.eligible ? "" : projectEligible.message
              }
            });
          }
          
          setNotifications(response.data.notifications || []);
          setDeadlines(response.data.upcomingDeadlines || response.data.deadlines || []);
          setError(null);
        } else {
          // มีข้อผิดพลาดจาก API
          console.log("API response error");
          setError(response.message || 'ไม่สามารถดึงข้อมูลไทม์ไลน์ได้');
          
          // ลองสร้างไทม์ไลน์เริ่มต้นในกรณีที่ไม่พบข้อมูลไทม์ไลน์
          if (response.message && response.message.includes('ไม่พบข้อมูลไทม์ไลน์')) {
            try {
              const initResponse = await timelineService.initializeStudentTimeline(studentId);
              if (initResponse.success) {
                message.success('สร้างไทม์ไลน์เริ่มต้นสำเร็จ กำลังโหลดข้อมูล...');
                // โหลดข้อมูลใหม่หลังจากสร้างไทม์ไลน์
                const newResponse = await timelineService.getStudentTimeline(studentId);
                if (newResponse.success) {
                  // ทำตามขั้นตอนเดิมอีกครั้ง เมื่อมีข้อมูลใหม่
                  const studentData = newResponse.data.student || {};
                  
                  // การคำนวณสิทธิ์การฝึกงานและโครงงานใหม่
                  const internshipRequirements = studentData.requirements?.internship || null;
                  const projectRequirements = studentData.requirements?.project || null;

                  const internshipEligible = isEligibleForInternship(
                    studentData.studentYear,
                    studentData.totalCredits || 0,
                    studentData.majorCredits || 0,
                    internshipRequirements
                  );
                  
                  const projectEligible = isEligibleForProject(
                    studentData.studentYear,
                    studentData.totalCredits || 0,
                    studentData.majorCredits || 0,
                    projectRequirements
                  );
                  
                  setStudent({
                    ...studentData,
                    internshipEligible: internshipEligible.eligible,
                    projectEligible: projectEligible.eligible,
                    internshipEligibleMessage: internshipEligible.message,
                    projectEligibleMessage: projectEligible.message
                  });
                  
                  if (newResponse.data.progress) {
                    const updatedProgress = { 
                      ...newResponse.data.progress,
                      internship: {
                        ...newResponse.data.progress.internship,
                        blocked: !internshipEligible.eligible,
                        blockReason: internshipEligible.eligible ? "" : internshipEligible.message
                      },
                      project: {
                        ...newResponse.data.progress.project,
                        blocked: !projectEligible.eligible,
                        blockReason: projectEligible.eligible ? "" : projectEligible.message
                      }
                    };
                    setProgress(updatedProgress);
                  }
                  
                  setNotifications(newResponse.data.notifications || []);
                  setDeadlines(newResponse.data.deadlines || []);
                  setError(null);
                }
              } else {
                message.error('ไม่สามารถสร้างไทม์ไลน์เริ่มต้นได้');
              }
            } catch (initError) {
              console.error('Error initializing timeline:', initError);
              message.error('เกิดข้อผิดพลาดในการสร้างไทม์ไลน์เริ่มต้น');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching timeline data:', err);
        setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง');
        message.error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimelineData();
  }, [studentId]);
  
  // ถ้ากำลังโหลดข้อมูล ให้แสดง Loading
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="กำลังโหลดข้อมูล..." />
      </div>
    );
  }
  
  // ถ้ามีข้อผิดพลาด ให้แสดงข้อความแจ้งเตือน
  if (error) {
    return (
      <Alert
        message="ไม่สามารถโหลดข้อมูลไทม์ไลน์ได้"
        description={error}
        type="error"
        showIcon
        action={
          <Button type="primary" onClick={() => window.location.reload()}>
            ลองใหม่
          </Button>
        }
      />
    );
  }
  
  return (
    <div className="student-timeline">
      {/* ส่วนหัวและแสดงภาพรวม */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card className="dashboard-card">
            <Row gutter={16} align="middle">
              <Col span={16}>
                <Title level={4}>แนวทางการศึกษาของคุณ</Title>
                <Paragraph>
                  ติดตามขั้นตอนและความคืบหน้าตลอดการศึกษาในระบบฝึกงานและโครงงานพิเศษ
                </Paragraph>
              </Col>
              <Col span={8} style={{ textAlign: 'right' }}>
                <Space direction="vertical" align="end">
                  <Text strong>
                    {(() => {
                      // ใช้ข้อมูลชั้นปีจากหลายแหล่ง
                      let studentYear = null;
                      
                      // 1. พยายามใช้จาก studentYear ก่อน
                      if (student && typeof student.studentYear === 'number' && student.studentYear > 0) {
                        studentYear = student.studentYear;
                      } 
                      // 2. ถ้าไม่มี ลองดูจาก student.year
                      else if (student && typeof student.year === 'number' && student.year > 0) {
                        studentYear = student.year;
                      }
                      // 3. ถ้ายังไม่มี และมีรหัสนักศึกษา ลองคำนวณจาก studentCode
                      else if (student && student.studentCode) {
                        try {
                          const currentDate = new Date();
                          const currentYear = currentDate.getFullYear() + 543; // พ.ศ.
                          const studentCodePrefix = student.studentCode.substring(0, 2);
                          const enrollmentYear = parseInt(studentCodePrefix) + 2500; // พ.ศ. ที่เข้าเรียน
                          studentYear = currentYear - enrollmentYear + 1;

                          // ตรวจสอบว่าชั้นปีอยู่ในช่วงที่เป็นไปได้
                          if (studentYear < 1) studentYear = 1;
                          if (studentYear > 8) studentYear = 8;
                        } catch (e) {
                          console.error("Error calculating student year:", e);
                          studentYear = null;
                        }
                      }

                      if (!studentYear) {
                        return 'ชั้นปีที่ไม่ระบุ';
                      }
                      
                      // กำหนดภาคการศึกษาปัจจุบัน (ตรวจสอบตามเดือนปัจจุบัน)
                      const currentDate = new Date();
                      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
                      
                      // รูปแบบไทยของภาคการศึกษา
                      let semester = '';
                      if (currentMonth >= 1 && currentMonth <= 5) {
                        semester = 'ภาคเรียน 2';
                      } else if (currentMonth >= 6 && currentMonth <= 7) {
                        semester = 'ภาคฤดูร้อน';
                      } else {
                        semester = 'ภาคเรียน 1';
                      }
                      
                      // คำนวณปีการศึกษาไทย (พ.ศ.)
                      const thaiYear = currentDate.getFullYear() + 543;
                      const academicYear = currentMonth >= 8 || currentMonth <= 5 ? thaiYear : thaiYear - 1;
                      
                      return `ชั้นปีที่ ${studentYear} (${semester} ${academicYear})`;;
                    })()}
                  </Text>
                  <Badge status={student.status === 'normal' ? 'success' : 'warning'} 
                         text={student.status === 'normal' ? 'นักศึกษาปกติ' : 
                               student.status === 'probation' ? 'นักศึกษาวิทยทัณฑ์' :
                               student.status === 'retired' ? 'พ้นสภาพนักศึกษา' : 'นักศึกษาตกค้าง'} />
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      
      {/* ส่วนการดำเนินการถัดไป */}
      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col span={24}>
          <NextAction student={student} />
        </Col>
      </Row>
      
      {/* ส่วนแสดงการแจ้งเตือน */}
      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col span={24}>
          <Card>
            <Notifications notifications={notifications} />
          </Card>
        </Col>
      </Row>
      
      {/* ส่วนแสดงความก้าวหน้าหลัก */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <EducationPath student={student} />
        </Col>
      </Row>
      
      {/* ส่วนแสดงรายละเอียดขั้นตอน */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <InternshipSection student={student} progress={progress} />
        </Col>
        
        <Col xs={24} lg={12}>
          <ProjectSection student={student} progress={progress} />
        </Col>
      </Row>
      
      {/* ส่วนแสดงกำหนดการสำคัญ */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card>
            <ImportantDeadlines deadlines={deadlines} />
          </Card>
        </Col>
      </Row>
      
      {/* ส่วนสถิติการเรียน */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <StudyStatistics student={student} />
        </Col>
      </Row>
    </div>
  );
};

export default StudentTimeline;