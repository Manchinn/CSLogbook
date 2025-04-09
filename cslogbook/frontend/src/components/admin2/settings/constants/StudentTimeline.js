import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Steps, Timeline, Row, Col, Tag, Badge, Button, 
  Divider, Space, Tooltip, message, Statistic, Alert, Progress, Empty
} from 'antd';
import {
  ClockCircleOutlined, CheckCircleOutlined, WarningOutlined,
  BookOutlined, ExperimentOutlined, FileTextOutlined, BellOutlined,
  LaptopOutlined, BuildOutlined, UserOutlined, ClockCircleFilled,
  LockOutlined, UnlockOutlined, CloudDownloadOutlined, FormOutlined,
  RightCircleOutlined, SearchOutlined, StarOutlined, SolutionOutlined,
  FileDoneOutlined, InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

// ข้อมูลตัวอย่างสำหรับการแสดงผล (ในงานจริงจะดึงจาก API)
const STUDENT_DATA = {
  id: "64xxxxxxx",
  name: "นายทดสอบ นักศึกษา",
  year: 3,
  totalCredits: 85,
  majorCredits: 45,
  status: "normal", // normal, extended, retired
  internshipEligible: true,
  projectEligible: false,
  isEnrolledInternship: true, // ลงทะเบียนฝึกงานแล้วหรือไม่
  isEnrolledProject: false,   // ลงทะเบียนโครงงานแล้วหรือไม่
  nextAction: "upload_internship_report", // การกระทำถัดไปที่ต้องทำ
  internshipStatus: "in_progress", // not_started, in_progress, completed
  projectStatus: "not_started" // not_started, in_progress, completed
};

// ข้อมูลขั้นตอนและสถานะปัจจุบัน
const PROGRESS_DATA = {
  internship: {
    currentStep: 6,
    totalSteps: 8,
    progress: 75, // เปอร์เซ็นต์ความคืบหน้า
    steps: [
      { id: 1, name: "ตรวจสอบสิทธิ์ฝึกงาน", status: "completed", date: "01/06/2024", 
        desc: "คุณมีสิทธิ์ทำการฝึกงาน เนื่องจากมีหน่วยกิตสะสมมากกว่า 81 หน่วยกิต" },
      { id: 2, name: "กรอกแบบฟอร์มขอฝึกงาน", status: "completed", date: "05/06/2024", 
        document: "คพ.05", actionText: "ดูเอกสาร", actionLink: "/documents/internship/5" },
      { id: 3, name: "การอนุมัติจากภาควิชา", status: "completed", date: "10/06/2024",
        desc: "เจ้าหน้าที่ภาควิชาได้อนุมัติการขอฝึกงานของคุณแล้ว" },
      { id: 4, name: "รับหนังสือส่งตัว", status: "completed", date: "15/06/2024",
        actionText: "ดาวน์โหลดหนังสือ", actionLink: "/documents/internship/letter/3" },
      { id: 5, name: "ส่งหนังสือตอบรับจากบริษัท", status: "completed", date: "20/06/2024",
        desc: "บริษัท ABC จำกัด ได้ตอบรับการฝึกงานของคุณเรียบร้อยแล้ว" },
      { id: 6, name: "อยู่ระหว่างการฝึกงาน", status: "in_progress", startDate: "01/07/2024", endDate: "31/07/2024",
        desc: "คุณอยู่ระหว่างการฝึกงานที่บริษัท ABC จำกัด",
        actionText: "บันทึกการฝึกงาน", actionLink: "/internship/log" },
      { id: 7, name: "ส่งรายงานและแบบประเมิน", status: "waiting",
        desc: "ต้องส่งภายใน 7 วันหลังจากฝึกงานเสร็จสิ้น",
        actionText: "อัปโหลดรายงาน", actionLink: "/internship/report/upload" },
      { id: 8, name: "เสร็จสิ้นการฝึกงาน", status: "waiting" }
    ]
  },
  project: {
    currentStep: 0,
    totalSteps: 10,
    progress: 0,
    blocked: true,
    blockReason: "ยังไม่ผ่านการฝึกงาน",
    steps: [
      { id: 1, name: "เตรียมหัวข้อโครงงาน", status: "waiting" },
      { id: 2, name: "ยื่นเสนอหัวข้อโครงงาน", status: "waiting", document: "คพ.01", deadline: "19/07/2567" },
      { id: 3, name: "สอบหัวข้อโครงงาน", status: "waiting", deadline: "25/07/2567" },
      { id: 4, name: "จัดทำเอกสารบทที่ 1", status: "waiting", deadline: "30/08/2567" },
      { id: 5, name: "พัฒนาโครงงาน", status: "waiting" },
      { id: 6, name: "ขอทดสอบโครงงาน", status: "waiting", document: "คพ.04", deadline: "18/10/2567" },
      { id: 7, name: "ยื่นขอสอบโครงงาน", status: "waiting", document: "คพ.02", deadline: "15/11/2567" },
      { id: 8, name: "สอบโครงงาน", status: "waiting", deadline: "18/11/2567 - 20/11/2567" },
      { id: 9, name: "แก้ไขเอกสาร", status: "waiting", deadline: "27/11/2567" },
      { id: 10, name: "ส่งรูปเล่มสมบูรณ์", status: "waiting", deadline: "13/12/2567" }
    ]
  }
};

// การแจ้งเตือนและกำหนดการ
const NOTIFICATIONS = [
  { id: 1, type: "warning", message: "คุณต้องบันทึกการฝึกงานทุกวันเพื่อให้การฝึกงานถูกนับชั่วโมงอย่างถูกต้อง", date: "03/07/2567" },
  { id: 2, type: "info", message: "กำหนดส่งรายงานฝึกงานคือ 7 วันหลังจากฝึกงานเสร็จสิ้น (7 สิงหาคม 2567)", date: "01/07/2567" },
  { id: 3, type: "success", message: "การฝึกงานของคุณได้รับการอนุมัติแล้ว สามารถดาวน์โหลดหนังสือส่งตัวได้", date: "15/06/2567" }
];

const UPCOMING_DEADLINES = [
  { id: 1, name: "สิ้นสุดการฝึกงาน", date: "31/07/2567", daysLeft: 28, related: "internship" },
  { id: 2, name: "วันสุดท้ายของการส่งรายงานฝึกงาน", date: "07/08/2567", daysLeft: 35, related: "internship" },
  { id: 3, name: "วันสุดท้ายของยื่นสอบหัวข้อโครงงานพิเศษ", date: "19/07/2567", daysLeft: 16, related: "project" }
];

const StudentTimeline = () => {
  const [student, setStudent] = useState(STUDENT_DATA);
  const [progress, setProgress] = useState(PROGRESS_DATA);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [deadlines, setDeadlines] = useState(UPCOMING_DEADLINES);
  const [showWarning, setShowWarning] = useState(true);
  
  useEffect(() => {
    // ในระบบจริงจะเรียกข้อมูลจาก API ที่นี่
    // fetchStudentTimelineData(studentId)
  }, []);
  
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
                {progress.internship.steps.map(renderTimelineItem)}
              </Timeline>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <FileDoneOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
                <Paragraph>คุณยังไม่ได้ลงทะเบียนฝึกงาน</Paragraph>
                <Button type="primary" href="/internship/register">ลงทะเบียนฝึกงาน</Button>
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
                  <Tooltip title={`ต้องมีหน่วยกิตสะสมมากกว่า 95 หน่วยกิต และผ่านการฝึกงาน`}>
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
                <Paragraph type="secondary">
                  <InfoCircleOutlined /> คุณต้องผ่านการฝึกงานและมีหน่วยกิตสะสมมากกว่า 95 หน่วยกิต
                </Paragraph>
              </div>
            ) : (
              student.isEnrolledProject ? (
                <Timeline mode="left">
                  {progress.project.steps.map(renderTimelineItem)}
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