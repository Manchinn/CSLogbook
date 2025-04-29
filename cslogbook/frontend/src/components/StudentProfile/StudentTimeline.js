import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Steps, Timeline, Row, Col, Tag, Badge, Button, 
  Divider, Space, Tooltip, message, Statistic, Alert, Progress, Empty,
  Spin
} from 'antd';
import {
  ClockCircleOutlined, CheckCircleOutlined, WarningOutlined,
  BookOutlined, ExperimentOutlined, FileTextOutlined, BellOutlined,
  LaptopOutlined, BuildOutlined, UserOutlined, ClockCircleFilled,
  LockOutlined, UnlockOutlined, CloudDownloadOutlined, FormOutlined,
  RightCircleOutlined, SearchOutlined, StarOutlined, SolutionOutlined,
  FileDoneOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { timelineService } from '../../services/timelineService';

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
  const [useMockData, setUseMockData] = useState(false); // เพิ่มสถานะสำหรับการใช้ข้อมูลตัวอย่าง
  
  // เพิ่มข้อมูลตัวอย่างสำหรับการแสดงผลเมื่อไม่มีข้อมูลจาก API
  const mockTimelineData = {
    student: {
      id: studentId || "6411111111111",
      name: "นักศึกษาตัวอย่าง",
      year: 3,
      totalCredits: 90,
      majorCredits: 45,
      status: "normal",
      internshipEligible: true,
      projectEligible: false,
      isEnrolledInternship: true,
      isEnrolledProject: false,
      nextAction: "daily_log",
      internshipStatus: "in_progress",
      projectStatus: "not_started"
    },
    progress: {
      internship: {
        currentStep: 4,
        totalSteps: 7,
        progress: 57,
        steps: [
          {
            id: 1,
            name: "ลงทะเบียนฝึกงาน",
            description: "ลงทะเบียนฝึกงานในระบบและเลือกสถานประกอบการ",
            status: "completed",
            date: "2025-02-15"
          },
          {
            id: 2,
            name: "ส่งเอกสารขอฝึกงาน",
            description: "ส่งเอกสารขอฝึกงานให้อาจารย์ตรวจสอบและอนุมัติ",
            status: "completed",
            document: "แบบคำร้องขอฝึกงาน",
            date: "2025-02-20"
          },
          {
            id: 3,
            name: "รอการตอบรับจากสถานประกอบการ",
            description: "รอการยืนยันจากสถานประกอบการหลังจากส่งเอกสารขอฝึกงาน",
            status: "completed",
            date: "2025-03-01"
          },
          {
            id: 4,
            name: "เริ่มฝึกงาน",
            description: "เริ่มการฝึกงานที่สถานประกอบการ",
            status: "in_progress",
            startDate: "2025-03-10",
            endDate: "2025-06-10"
          },
          {
            id: 5,
            name: "บันทึกการฝึกงานประจำวัน",
            description: "บันทึกการฝึกงานในแต่ละวันตลอดระยะเวลาการฝึกงาน",
            status: "waiting",
            actionText: "บันทึกการฝึกงาน",
            actionLink: "/internship/logbook"
          },
          {
            id: 6,
            name: "ส่งรายงานฝึกงาน",
            description: "ส่งรายงานฝึกงานและแบบประเมินหลังจากฝึกงานเสร็จสิ้น",
            status: "waiting",
            document: "รายงานฝึกงาน",
            deadline: "2025-06-20",
            actionText: "ส่งรายงานฝึกงาน",
            actionLink: "/internship/report/upload"
          },
          {
            id: 7,
            name: "อาจารย์ตรวจรายงานและประเมินผล",
            description: "อาจารย์ตรวจสอบรายงานและประเมินผลการฝึกงาน",
            status: "waiting",
            deadline: "2025-07-10"
          }
        ],
        blocked: false,
        blockReason: ""
      },
      project: {
        currentStep: 0,
        totalSteps: 8,
        progress: 0,
        steps: [
          {
            id: 8,
            name: "ลงทะเบียนโครงงานพิเศษ",
            description: "ลงทะเบียนโครงงานพิเศษในระบบและเลือกอาจารย์ที่ปรึกษา",
            status: "waiting",
            actionText: "ลงทะเบียนโครงงาน",
            actionLink: "/project/register"
          },
          {
            id: 9,
            name: "ส่งเอกสารหัวข้อโครงงาน",
            description: "ส่งเอกสารหัวข้อโครงงานให้อาจารย์ตรวจสอบและอนุมัติ",
            status: "waiting",
            actionText: "อัปโหลดเอกสาร",
            actionLink: "/project/documents/upload"
          },
          {
            id: 10,
            name: "สอบหัวข้อโครงงาน",
            description: "นำเสนอหัวข้อโครงงานต่อคณะกรรมการ",
            status: "waiting"
          },
          {
            id: 11,
            name: "พัฒนาโครงงาน",
            description: "ดำเนินการพัฒนาโครงงานตามแผนที่วางไว้",
            status: "waiting"
          },
          {
            id: 12,
            name: "ส่งรายงานความก้าวหน้า",
            description: "ส่งรายงานความก้าวหน้าของโครงงานเป็นระยะ",
            status: "waiting",
            actionText: "ส่งรายงานความก้าวหน้า",
            actionLink: "/project/progress/upload"
          },
          {
            id: 13,
            name: "สอบโครงงาน",
            description: "นำเสนอผลงานโครงงานต่อคณะกรรมการสอบ",
            status: "waiting"
          },
          {
            id: 14,
            name: "แก้ไขโครงงานตามข้อเสนอแนะ",
            description: "ปรับปรุงโครงงานตามข้อเสนอแนะของคณะกรรมการสอบ",
            status: "waiting"
          },
          {
            id: 15,
            name: "ส่งเล่มรายงานฉบับสมบูรณ์",
            description: "ส่งรายงานโครงงานฉบับสมบูรณ์และไฟล์ผลงาน",
            status: "waiting",
            actionText: "ส่งรายงานฉบับสมบูรณ์",
            actionLink: "/project/final/upload"
          }
        ],
        blocked: true,
        blockReason: "ต้องมีหน่วยกิตสะสมมากกว่า 95 หน่วยกิต และผ่านการฝึกงาน"
      }
    },
    notifications: [
      {
        id: 1,
        message: "กำลังจะถึงกำหนดส่งบันทึกประจำวันฝึกงาน",
        type: "warning",
        date: "2025-04-30"
      },
      {
        id: 2,
        message: "อาจารย์ได้อนุมัติเอกสารฝึกงานของคุณแล้ว",
        type: "success",
        date: "2025-02-18"
      }
    ],
    deadlines: [
      {
        id: 1,
        name: "กำหนดส่งรายงานฝึกงาน",
        date: "2025-06-20",
        daysLeft: 52,
        related: "internship"
      },
      {
        id: 2,
        name: "การประเมินผลการฝึกงาน",
        date: "2025-07-10",
        daysLeft: 72,
        related: "internship"
      },
      {
        id: 3,
        name: "วันสุดท้ายของการลงทะเบียนโครงงานพิเศษ",
        date: "2025-07-20",
        daysLeft: 82,
        related: "project"
      }
    ]
  };
  
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
          setStudent(response.data.student);
          setProgress(response.data.progress);
          setNotifications(response.data.notifications || []);
          setDeadlines(response.data.deadlines || []);
          setError(null);
        } else {
          // มีข้อผิดพลาดจาก API
          console.log("API response error, using mock data");
          setUseMockData(true); // ใช้ข้อมูลตัวอย่างเมื่อ API ไม่สำเร็จ
          setStudent(mockTimelineData.student);
          setProgress(mockTimelineData.progress);
          setNotifications(mockTimelineData.notifications);
          setDeadlines(mockTimelineData.deadlines);
          setError(null);
          
          // ลองสร้างไทม์ไลน์เริ่มต้นในกรณีที่ไม่พบข้อมูลไทม์ไลน์
          if (response.message && response.message.includes('ไม่พบข้อมูลไทม์ไลน์')) {
            try {
              const initResponse = await timelineService.initializeStudentTimeline(studentId);
              if (initResponse.success) {
                message.success('สร้างไทม์ไลน์เริ่มต้นสำเร็จ กำลังโหลดข้อมูล...');
                // โหลดข้อมูลใหม่หลังจากสร้างไทม์ไลน์
                const newResponse = await timelineService.getStudentTimeline(studentId);
                if (newResponse.success) {
                  setUseMockData(false); // ใช้ข้อมูลจริงเมื่อโหลดสำเร็จ
                  setStudent(newResponse.data.student);
                  setProgress(newResponse.data.progress);
                  setNotifications(newResponse.data.notifications || []);
                  setDeadlines(newResponse.data.deadlines || []);
                  setError(null);
                }
              } else {
                message.info('กำลังแสดงข้อมูลตัวอย่าง');
              }
            } catch (initError) {
              console.error('Error initializing timeline:', initError);
              message.info('กำลังแสดงข้อมูลตัวอย่าง');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching timeline data:', err);
        
        // ถ้าพบข้อผิดพลาด ให้ใช้ข้อมูลตัวอย่าง
        console.log("API error, using mock data");
        setUseMockData(true);
        setStudent(mockTimelineData.student);
        setProgress(mockTimelineData.progress);
        setNotifications(mockTimelineData.notifications);
        setDeadlines(mockTimelineData.deadlines);
        setError(null);
        
        message.info('กำลังแสดงข้อมูลตัวอย่าง เนื่องจากไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
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
      default: return 'ไม่ทราบสถานะ';
    }
  };
  
  // รับสีตามสถานะ
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'green';
      case 'in_progress': return 'blue';
      case 'waiting': return 'orange';
      case 'blocked': return 'red';
      default: return 'gray';
    }
  };
  
  // สร้างรายการ Timeline
  const renderTimelineItem = (item) => {
    const color = getStatusColor(item.status);
    
    return (
      <Timeline.Item 
        key={item.id}
        color={color}
        dot={item.status === 'in_progress' ? <ClockCircleFilled style={{ fontSize: '16px' }} /> : null}
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
    const { nextAction } = student;
    let actionContent = null;
    
    switch(nextAction) {
      case 'upload_internship_report':
        actionContent = (
          <Space direction="vertical">
            <Text>อัปโหลดรายงานฝึกงานและแบบประเมินหลังจากที่ฝึกงานเสร็จสิ้น</Text>
            <Button type="primary" icon={<FormOutlined />} disabled>อัปโหลดรายงาน (เปิดให้ใช้งานเมื่อสิ้นสุดการฝึกงาน)</Button>
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
            <Button type="primary" icon={<FormOutlined />} href="/internship/register">ลงทะเบียนฝึกงาน</Button>
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
      default:
        actionContent = (
          <Text>ไม่มีการดำเนินการที่ต้องทำในขณะนี้</Text>
        );
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
                <Space>
                  <Badge status={student.status === 'normal' ? 'success' : 'warning'} text={student.status === 'normal' ? 'นักศึกษาปกติ' : 'นักศึกษาตกค้าง'} />
                  <Divider type="vertical" />
                  <Text>ชั้นปีที่ {student.year}</Text>
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
                  href="/internship/register" 
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
                  title="หน่วยกิตวิชาเอก" 
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