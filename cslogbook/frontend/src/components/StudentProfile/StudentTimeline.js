import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Steps, Timeline, Row, Col, Tag, Badge, Button, 
  Space, Tooltip, message, Statistic, Alert, Progress, Empty,
  Spin
} from 'antd';
import {
  ClockCircleOutlined, CheckCircleOutlined, WarningOutlined,
  BookOutlined, ExperimentOutlined, BellOutlined,
  LaptopOutlined, UserOutlined, ClockCircleFilled,
  LockOutlined, UnlockOutlined, CloudDownloadOutlined, FormOutlined,
  RightCircleOutlined, SearchOutlined, StarOutlined, SolutionOutlined,
  FileDoneOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { timelineService } from '../../services/timelineService';
import { isEligibleForInternship, isEligibleForProject } from "../../utils/studentUtils";

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

// ข้อมูลตัวอย่างเริ่มต้น (จะถูกแทนที่ด้วยข้อมูลจริงจาก API)
const DEFAULT_STUDENT_DATA = {
  id: "",
  name: "",
  year: 0,
  totalCredits: 0,
  majorCredits: 0,
  status: "normal",
  internshipEligible: false,
  projectEligible: false,
  isEnrolledInternship: false,
  isEnrolledProject: false,
  nextAction: "none",
  internshipStatus: "not_started",
  projectStatus: "not_started"
};

const DEFAULT_PROGRESS_DATA = {
  internship: {
    currentStep: 0,
    totalSteps: 0,
    progress: 0,
    steps: [],
    blocked: true,
    blockReason: ""
  },
  project: {
    currentStep: 0,
    totalSteps: 0,
    progress: 0,
    steps: [],
    blocked: true,
    blockReason: ""
  }
};

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
  
  // คำนวณสถานะหลักของการศึกษา
  const calculateMainProgress = () => {
    if (student.internshipStatus === 'completed') {
      return student.projectStatus === 'completed' ? 3 : 1;
    } else if (student.internshipStatus === 'in_progress') {
      return 0;
    } else {
      return 0;
    }
  };
  
  // รับข้อความสถานะ
  const getStatusText = (status) => {
    switch(status) {
      case 'completed': return 'เสร็จสิ้น';
      case 'in_progress': return 'กำลังดำเนินการ';
      case 'waiting': return 'รอดำเนินการ';
      case 'blocked': return 'ไม่สามารถดำเนินการได้';
      case 'pending': return 'รออนุมัติ';
      case 'approved': return 'อนุมัติแล้ว';
      case 'rejected': return 'ไม่อนุมัติ';
      case 'overdue': return 'เลยกำหนด';
      default: return 'ไม่ทราบสถานะ';
    }
  };
  
  // รับสีตามสถานะ
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'success';
      case 'in_progress': return 'processing';
      case 'waiting': return 'warning';
      case 'blocked': return 'error';
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };
  
  // รับไอคอนตามสถานะ
  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircleOutlined />;
      case 'in_progress': return <ClockCircleFilled />;
      case 'waiting': return <ClockCircleOutlined />;
      case 'blocked': return <LockOutlined />;
      case 'pending': return <WarningOutlined />;
      case 'approved': return <CheckCircleOutlined />;
      case 'rejected': return <WarningOutlined />;
      case 'overdue': return <WarningOutlined />;
      default: return <InfoCircleOutlined />;
    }
  };
  
  // สร้างรายการ Timeline
  const renderTimelineItem = (item) => {
    const color = getStatusColor(item.status);
    
    return (
      <Timeline.Item 
        key={item.id}
        color={color}
        dot={item.status === 'in_progress' ? <ClockCircleFilled style={{ fontSize: '16px' }} /> : getStatusIcon(item.status)}
      >
        <div style={{ marginBottom: 8 }}>
          <Space align="start">
            <Text strong>{item.name}</Text>
            <Tag color={color}>{getStatusText(item.status)}</Tag>
            {item.document && <Tag color="purple">{item.document}</Tag>}
          </Space>
        </div>
        
        {item.desc && <div><Text>{item.desc}</Text></div>}
        
        {item.date && (
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">วันที่: {item.date}</Text>
          </div>
        )}
        
        {item.startDate && (
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">เริ่ม: {item.startDate} {item.endDate && `- สิ้นสุด: ${item.endDate}`}</Text>
          </div>
        )}
        
        {item.deadline && (
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">กำหนดการ: {item.deadline}</Text>
          </div>
        )}
        
        {item.actionText && item.actionLink && (
          <div style={{ marginTop: 8 }}>
            <Button 
              type={item.status === 'in_progress' ? 'primary' : 'default'} 
              size="small" 
              icon={
                item.actionText.includes('ดาวน์โหลด') ? <CloudDownloadOutlined /> :
                item.actionText.includes('อัปโหลด') ? <FormOutlined /> :
                item.actionText.includes('บันทึก') ? <FormOutlined /> :
                <RightCircleOutlined />
              }
              href={item.actionLink}
            >
              {item.actionText}
            </Button>
          </div>
        )}
      </Timeline.Item>
    );
  };
  
  // สร้างรายการแจ้งเตือน
  const renderNotificationItem = (item) => {
    const icon = item.type === 'success' ? <CheckCircleOutlined /> : 
                item.type === 'warning' ? <WarningOutlined /> : 
                <InfoCircleOutlined />;
                
    return (
      <Alert
        key={item.id}
        message={item.message}
        type={item.type}
        showIcon
        icon={icon}
        style={{ marginBottom: 8 }}
        action={
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {item.date}
          </Text>
        }
      />
    );
  };
  
  // สร้างคอมโพเนนต์แสดงคำแนะนำการดำเนินการถัดไป
  const renderNextAction = () => {
    const { nextAction, internshipEligible, projectEligible, 
            internshipStatus, projectStatus, isEnrolledInternship, 
            isEnrolledProject, totalCredits } = student;
    let actionContent = null;
    
    // ตัวแปรเพื่อคำนวณว่าควรแนะนำให้ทำอะไรต่อไป
    let recommendedAction = nextAction; // เริ่มต้นจากค่าจาก API
    
    // หากค่า nextAction เป็น none หรือไม่ระบุ ให้พิจารณาจากสถานะอื่นๆ
    if (!nextAction || nextAction === 'none') {
      // ถ้ามีสิทธิ์ฝึกงานแต่ยังไม่ได้ลงทะเบียน
      if (internshipEligible && !isEnrolledInternship && internshipStatus !== 'completed') {
        recommendedAction = 'register_internship';
      }
      // ถ้าฝึกงานอยู่ ให้บันทึก logbook
      else if (isEnrolledInternship && internshipStatus === 'in_progress') {
        recommendedAction = 'daily_log';
      }
      // ถ้าผ่านฝึกงานแล้ว และมีสิทธิ์ทำโครงงาน แต่ยังไม่ได้ลงทะเบียน
      else if (internshipStatus === 'completed' && projectEligible && !isEnrolledProject) {
        recommendedAction = 'register_project';
      }
      // ถ้าทำโครงงานอยู่
      else if (isEnrolledProject && projectStatus === 'in_progress') {
        recommendedAction = 'continue_project';
      }
      // ถ้ายังไม่มีสิทธิ์ฝึกงาน แต่หน่วยกิตมากกว่า 75 แล้ว
      else if (!internshipEligible && totalCredits > 75) {
        recommendedAction = 'prepare_internship';
      }
    }
    
    switch(recommendedAction) {
      case 'upload_internship_report':
        actionContent = (
          <Space direction="vertical">
            <Text>อัปโหลดรายงานฝึกงานและแบบประเมินหลังจากที่ฝึกงานเสร็จสิ้น</Text>
            <Button type="primary" icon={<FormOutlined />} disabled={internshipStatus !== 'completed'} href="/internship/report/upload">
              อัปโหลดรายงานฝึกงาน
            </Button>
          </Space>
        );
        break;
      case 'daily_log':
        actionContent = (
          <Space direction="vertical">
            <Text>บันทึกการฝึกงานประจำวัน</Text>
            <Button type="primary" icon={<FormOutlined />} href="/internship/log">บันทึกการฝึกงาน</Button>
          </Space>
        );
        break;
      case 'register_internship':
        actionContent = (
          <Space direction="vertical">
            <Text>ลงทะเบียนฝึกงาน</Text>
            <Button type="primary" icon={<FormOutlined />} href="/internship-registration/cs05">ลงทะเบียนฝึกงาน</Button>
          </Space>
        );
        break;
      case 'register_project':
        actionContent = (
          <Space direction="vertical">
            <Text>ลงทะเบียนโครงงานพิเศษ</Text>
            <Button type="primary" icon={<ExperimentOutlined />} href="/project/register">ลงทะเบียนโครงงานพิเศษ</Button>
          </Space>
        );
        break;
      case 'continue_project':
        actionContent = (
          <Space direction="vertical">
            <Text>ดำเนินการโครงงานพิเศษต่อ</Text>
            <Button type="primary" icon={<ExperimentOutlined />} href="/project/dashboard">ดำเนินการต่อ</Button>
          </Space>
        );
        break;
      case 'prepare_internship':
        actionContent = (
          <Space direction="vertical">
            <Text>เตรียมตัวสำหรับการฝึกงาน</Text>
            <Text type="secondary">คุณมีหน่วยกิตสะสม {totalCredits} หน่วยกิต ใกล้ถึงเกณฑ์การฝึกงาน (81 หน่วยกิต) แล้ว</Text>
            <Button type="primary" icon={<SearchOutlined />} href="/internship/info">ดูข้อมูลการฝึกงาน</Button>
          </Space>
        );
        break;
      default:
        // ตรวจสอบสถานะเพิ่มเติม เพื่อแสดงข้อความที่เหมาะสม
        if (totalCredits >= 127 && projectStatus === 'completed' && internshipStatus === 'completed') {
          actionContent = (
            <Space direction="vertical">
              <Text>ยินดีด้วย! คุณน่าจะพร้อมสำหรับการจบการศึกษาแล้ว</Text>
              <Text type="secondary">กรุณาตรวจสอบเงื่อนไขการจบการศึกษาอื่นๆ เพิ่มเติม</Text>
              <Button type="primary" icon={<UserOutlined />} href="/graduate/check">ตรวจสอบการจบการศึกษา</Button>
            </Space>
          );
        } else if (!internshipEligible && !projectEligible) {
          actionContent = (
            <Space direction="vertical">
              <Text>ยังไม่มีสิทธิ์ในการฝึกงานหรือทำโครงงาน</Text>
              <Text type="secondary">ต้องมีหน่วยกิตอย่างน้อย 81 หน่วยกิตสำหรับฝึกงาน และ 95 หน่วยกิตสำหรับโครงงาน</Text>
              <Text type="secondary">ปัจจุบันคุณมี {totalCredits} หน่วยกิต</Text>
            </Space>
          );
        } else {
          actionContent = (
            <Text>ไม่มีการดำเนินการที่ต้องทำในขณะนี้</Text>
          );
        }
    }
    
    return (
      <Card size="small" bordered style={{ backgroundColor: '#f9f0ff', marginBottom: 16 }}>
        <Space align="start">
          <StarOutlined style={{ fontSize: '20px', color: '#722ed1' }} />
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>คำแนะนำการดำเนินการถัดไป</Text>
            {actionContent}
          </div>
        </Space>
      </Card>
    );
  };
  
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
                      
                      return `ชั้นปีที่ ${studentYear} (${semester} ${academicYear})`;
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
          {renderNextAction()}
        </Col>
      </Row>
      
      {/* ส่วนแสดงการแจ้งเตือน */}
      {notifications.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
          <Col span={24}>
            <Card 
              title={<Space><BellOutlined /> การแจ้งเตือนของคุณ</Space>} 
              extra={<Button type="link" size="small">ดูทั้งหมด</Button>}
              bodyStyle={{ padding: '12px 24px' }}
            >
              {notifications.map(renderNotificationItem)}
            </Card>
          </Col>
        </Row>
      )}
      
      {/* ส่วนแสดงความก้าวหน้าหลัก */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card 
            title="เส้นทางการศึกษาของคุณ" 
            bordered={false}
            bodyStyle={{ padding: '24px' }}
          >
            <Steps 
              current={calculateMainProgress()}
              size="default"
            >
              <Step 
                title="ฝึกงาน" 
                description={student.internshipStatus === 'completed' ? 'เสร็จสิ้น' : 'กำลังดำเนินการ'} 
                icon={<LaptopOutlined />}
              />
              <Step 
                title="โครงงานพิเศษ 1" 
                description={student.projectEligible ? 'พร้อมดำเนินการ' : 'รอคุณสมบัติ'}
                disabled={!student.projectEligible}
                icon={<ExperimentOutlined />}
              />
              <Step 
                title="โครงงานพิเศษ 2" 
                description="รอดำเนินการ"
                disabled={!student.projectEligible} 
                icon={<BookOutlined />}
              />
              <Step 
                title="สำเร็จการศึกษา" 
                description="รอดำเนินการ" 
                icon={<UserOutlined />}
              />
            </Steps>
          </Card>
        </Col>
      </Row>
      
      {/* ส่วนแสดงรายละเอียดขั้นตอน */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <LaptopOutlined />
                <span>การฝึกงาน</span>
                {student.internshipStatus === 'completed' && <Tag color="success">เสร็จสิ้น</Tag>}
                {student.internshipStatus === 'in_progress' && <Tag color="processing">กำลังดำเนินการ</Tag>}
              </Space>
            }
            extra={
              <Space>
                <Progress 
                  type="circle" 
                  percent={progress.internship.progress} 
                  width={40} 
                  format={percent => `${percent}%`}
                />
                {student.internshipEligible ? (
                  <Tag color="success"><UnlockOutlined /> มีสิทธิ์</Tag>
                ) : (
                  <Tooltip title="ต้องมีหน่วยกิตสะสมมากกว่า 81 หน่วยกิต">
                    <Tag color="error"><LockOutlined /> ยังไม่มีสิทธิ์</Tag>
                  </Tooltip>
                )}
              </Space>
            }
          >
            {student.isEnrolledInternship ? (
              <Timeline mode="left">
                {progress.internship.steps.length > 0 ? (
                  progress.internship.steps.map(renderTimelineItem)
                ) : (
                  <Empty description="ยังไม่มีข้อมูลขั้นตอนการฝึกงาน" />
                )}
              </Timeline>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <FileDoneOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
                <Paragraph>คุณยังไม่ได้ลงทะเบียนฝึกงาน</Paragraph>
                <Button 
                  type="primary" 
                  href="/internship-registration/cs05" 
                  disabled={!student.internshipEligible}
                >
                  ลงทะเบียนฝึกงาน
                </Button>
                {!student.internshipEligible && (
                  <Paragraph style={{ marginTop: 16 }} type="danger">
                    <InfoCircleOutlined /> {progress.internship.blockReason}
                  </Paragraph>
                )}
              </div>
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <ExperimentOutlined />
                <span>โครงงานพิเศษ</span>
                {progress.project.blocked && <Tag color="error">ไม่สามารถดำเนินการได้</Tag>}
                {student.projectStatus === 'in_progress' && <Tag color="processing">กำลังดำเนินการ</Tag>}
                {student.projectStatus === 'completed' && <Tag color="success">เสร็จสิ้น</Tag>}
              </Space>
            }
            extra={
              <Space>
                <Progress 
                  type="circle" 
                  percent={progress.project.progress} 
                  width={40} 
                  status={progress.project.blocked ? 'exception' : 'normal'}
                />
                {student.projectEligible ? (
                  <Tag color="success"><UnlockOutlined /> มีสิทธิ์</Tag>
                ) : (
                  <Tooltip title="ต้องมีหน่วยกิตสะสมมากกว่า 95 หน่วยกิต และผ่านการฝึกงาน">
                    <Tag color="error"><LockOutlined /> ยังไม่มีสิทธิ์</Tag>
                  </Tooltip>
                )}
              </Space>
            }
          >
            {progress.project.blocked ? (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <LockOutlined style={{ fontSize: 32, color: '#ff4d4f', marginBottom: 16 }} />
                <Paragraph>
                  <Text type="danger">ยังไม่สามารถเริ่มโครงงานได้</Text>
                </Paragraph>
                <Paragraph type="secondary">{progress.project.blockReason}</Paragraph>
              </div>
            ) : (
              student.isEnrolledProject ? (
                <Timeline mode="left">
                  {progress.project.steps.length > 0 ? (
                    progress.project.steps.map(renderTimelineItem)
                  ) : (
                    <Empty description="ยังไม่มีข้อมูลขั้นตอนโครงงาน" />
                  )}
                </Timeline>
              ) : (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <SolutionOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
                  <Paragraph>คุณยังไม่ได้ลงทะเบียนโครงงานพิเศษ</Paragraph>
                  <Button type="primary" href="/project/register">ลงทะเบียนโครงงาน</Button>
                </div>
              )
            )}
          </Card>
        </Col>
      </Row>
      
      {/* ส่วนแสดงกำหนดการสำคัญ */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card 
            title={<Space><ClockCircleOutlined /> กำหนดการสำคัญที่กำลังจะมาถึง</Space>}
            extra={<Button type="link" size="small" icon={<SearchOutlined />}>ดูปฏิทินทั้งหมด</Button>}
          >
            {deadlines.length > 0 ? (
              <Timeline>
                {deadlines.map(deadline => (
                  <Timeline.Item 
                    key={deadline.id}
                    color={deadline.daysLeft <= 7 ? 'red' : (deadline.daysLeft <= 14 ? 'orange' : 'blue')}
                  >
                    <Space>
                      <Text strong>{deadline.name}</Text>
                      <Tag color={deadline.daysLeft <= 7 ? 'error' : (deadline.daysLeft <= 14 ? 'warning' : 'blue')}>
                        {deadline.daysLeft} วัน
                      </Tag>
                      {deadline.related === 'internship' && <Tag color="cyan">ฝึกงาน</Tag>}
                      {deadline.related === 'project' && <Tag color="purple">โครงงาน</Tag>}
                    </Space>
                    <div><Text type="secondary">วันที่: {deadline.date}</Text></div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="ไม่มีกำหนดการสำคัญในช่วงเวลานี้" />
            )}
          </Card>
        </Col>
      </Row>
      
      {/* ส่วนสถิติการเรียน */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="สถานะการศึกษา">
            <Row gutter={16}>
              <Col xs={12} md={6}>
                <Statistic 
                  title="หน่วยกิตสะสม" 
                  value={student.totalCredits} 
                  suffix="/ 127" 
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic 
                  title="หน่วยกิตภาควิชา" 
                  value={student.majorCredits} 
                  suffix="/ 57" 
                  valueStyle={{ color: student.majorCredits >= 57 ? '#52c41a' : '#faad14' }}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic 
                  title="การฝึกงาน" 
                  value={student.internshipStatus === 'completed' ? 'ผ่าน' : 'ไม่ผ่าน'} 
                  valueStyle={{ color: student.internshipStatus === 'completed' ? '#52c41a' : '#faad14' }}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic 
                  title="โครงงานพิเศษ" 
                  value={student.projectStatus === 'completed' ? 'ผ่าน' : 'ไม่ผ่าน'} 
                  valueStyle={{ color: student.projectStatus === 'completed' ? '#52c41a' : '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentTimeline;