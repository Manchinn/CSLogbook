import React, { useState } from 'react';
import { 
  Card, Typography, Steps, Timeline, Row, Col, Select, Tag, Badge, 
  Button, Divider, Space, Collapse, Tooltip, Input, Form, message
} from 'antd';
import {
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  BookOutlined, ExperimentOutlined, SolutionOutlined, FileTextOutlined,
  FileProtectOutlined, LaptopOutlined, BuildOutlined, UserOutlined,
  SaveOutlined, ClockCircleFilled, WarningOutlined, LoadingOutlined,
  LockOutlined, UnlockOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { Panel } = Collapse;

// Sample student data
const MOCK_STUDENT = {
  id: "64xxxxxxx",
  name: "นายทดสอบ นักศึกษา",
  year: 3,
  credits: 85,
  majorCredits: 45,
  status: "normal", // normal, extended, retired
  internshipEligible: true,
  projectEligible: false,
  internshipStatus: "in_progress", // not_started, in_progress, completed
  projectStatus: "not_started" // not_started, in_progress, completed
};

// Sample milestone data
const MOCK_MILESTONES = {
  internship: {
    currentStep: 6,
    totalSteps: 8,
    steps: [
      { id: 1, name: "รอสมัครฝึกงาน", status: "completed", date: "01/06/2024" },
      { id: 2, name: "กรอกเอกสารสมัครฝึกงาน", status: "completed", date: "05/06/2024", document: "คพ.05" },
      { id: 3, name: "รออนุมัติจากภาควิชา", status: "completed", date: "10/06/2024" },
      { id: 4, name: "รับหนังสือส่งตัว", status: "completed", date: "15/06/2024" },
      { id: 5, name: "รอหนังสือตอบรับ", status: "completed", date: "20/06/2024" },
      { id: 6, name: "อยู่ระหว่างฝึกงาน", status: "in_progress", date: "01/07/2024", dueDate: "31/07/2024" },
      { id: 7, name: "ส่งสรุปผลการฝึกงาน", status: "waiting", document: "รายงานฝึกงาน" },
      { id: 8, name: "เสร็จสิ้นการฝึกงาน", status: "waiting" }
    ]
  },
  project: {
    currentStep: 0,
    totalSteps: 10,
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

// Sample upcoming deadlines
const MOCK_DEADLINES = [
  { id: 1, name: "วันสุดท้ายของยื่นสอบหัวข้อโครงงานพิเศษ", date: "19/07/2567", daysLeft: 45 },
  { id: 2, name: "วันสอบหัวข้อโครงงานพิเศษ", date: "25/07/2567", daysLeft: 51 },
  { id: 3, name: "วันสุดท้ายของการส่งเอกสารข้อเสนอ (บทที่ 1)", date: "30/08/2567", daysLeft: 87 },
  { id: 4, name: "วันสุดท้ายของการยื่นเอกสารขอทดสอบโครงงาน 30 วัน", date: "18/10/2567", daysLeft: 136 }
];

// Status Icon Component
const StatusIcon = ({ status }) => {
  switch(status) {
    case 'completed':
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'in_progress':
      return <LoadingOutlined style={{ color: '#1890ff' }} />;
    case 'waiting':
      return <ClockCircleOutlined style={{ color: '#faad14' }} />;
    case 'blocked':
      return <LockOutlined style={{ color: '#ff4d4f' }} />;
    default:
      return <WarningOutlined style={{ color: '#ff4d4f' }} />;
  }
};

// Student Status Badge Component
const StudentStatusBadge = ({ status }) => {
  let color = 'default';
  let text = 'ไม่ทราบสถานะ';
  
  switch(status) {
    case 'normal':
      color = 'success';
      text = 'กำลังศึกษา (ปกติ)';
      break;
    case 'extended':
      color = 'warning';
      text = 'นักศึกษาตกค้าง';
      break;
    case 'retired':
      color = 'error';
      text = 'พ้นสภาพการเป็นนักศึกษา';
      break;
  }
  
  return <Badge status={color} text={text} />;
};

const TimelineSettings = () => {
  const [student, setStudent] = useState(MOCK_STUDENT);
  const [milestones, setMilestones] = useState(MOCK_MILESTONES);
  const [deadlines, setDeadlines] = useState(MOCK_DEADLINES);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form] = Form.useForm();
  
  // Calculate the current main step (Internship -> Project 1 -> Project 2 -> Graduation)
  const calculateCurrentMainStep = () => {
    if (student.internshipStatus === 'completed') {
      return student.projectStatus === 'completed' ? 3 : 1;
    } else if (student.internshipStatus === 'in_progress') {
      return 0;
    } else {
      return 0;
    }
  };
  
  // Get status text for timeline item
  const getStatusText = (status) => {
    switch(status) {
      case 'completed': return 'เสร็จสิ้น';
      case 'in_progress': return 'กำลังดำเนินการ';
      case 'waiting': return 'รอดำเนินการ';
      case 'blocked': return 'ไม่สามารถดำเนินการได้';
      default: return 'ไม่ทราบสถานะ';
    }
  };
  
  // Get color for timeline item
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'green';
      case 'in_progress': return 'blue';
      case 'waiting': return 'orange';
      case 'blocked': return 'red';
      default: return 'gray';
    }
  };
  
  // Timeline item renderer
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
        {item.date && (
          <div>
            <Text type="secondary">วันที่: {item.date}</Text>
            {item.dueDate && <Text type="secondary"> - {item.dueDate}</Text>}
          </div>
        )}
        {item.deadline && <div><Text type="secondary">กำหนดการ: {item.deadline}</Text></div>}
      </Timeline.Item>
    );
  };
  
  const handleSearch = () => {
    message.info('ในตัวอย่างนี้จะใช้ข้อมูลตัวอย่างเท่านั้น');
    // ในที่นี้เราใช้ข้อมูลจำลอง แต่ในระบบจริงคุณจะใช้ API เพื่อดึงข้อมูลนักศึกษา
  };
  
  return (
    <div className="timeline-settings">
      <Card className="setting-card">
        <Title level={5}>ตัวอย่างการแสดงผล Timeline การศึกษา</Title>
        <Text type="secondary">
          ตัวอย่างการแสดงผลขั้นตอนและความก้าวหน้าของนักศึกษาในรูปแบบ Interactive Timeline
        </Text>
        
        <Form form={form} layout="inline" style={{ marginTop: 16, marginBottom: 16 }}>
          <Form.Item name="studentId" label="รหัสนักศึกษา">
            <Input placeholder="ระบุรหัสนักศึกษา" defaultValue="64xxxxxxx" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSearch}>ค้นหา</Button>
          </Form.Item>
        </Form>
        
        <Divider orientation="left">ข้อมูลนักศึกษา</Divider>
        
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Text strong>รหัสนักศึกษา:</Text> <Text>{student.id}</Text>
                </Col>
                <Col span={6}>
                  <Text strong>ชื่อ-นามสกุล:</Text> <Text>{student.name}</Text>
                </Col>
                <Col span={6}>
                  <Text strong>ชั้นปี:</Text> <Text>{student.year}</Text>
                </Col>
                <Col span={6}>
                  <StudentStatusBadge status={student.status} />
                </Col>
                <Col span={6}>
                  <Text strong>หน่วยกิตสะสม:</Text> <Text>{student.credits}</Text>
                </Col>
                <Col span={6}>
                  <Text strong>หน่วยกิตวิชาเอก:</Text> <Text>{student.majorCredits}</Text>
                </Col>
                <Col span={6}>
                  <Text strong>สิทธิ์การฝึกงาน:</Text> 
                  {student.internshipEligible ? 
                    <Tag color="success">มีสิทธิ์</Tag> : 
                    <Tag color="error">ยังไม่มีสิทธิ์</Tag>}
                </Col>
                <Col span={6}>
                  <Text strong>สิทธิ์การทำโครงงาน:</Text> 
                  {student.projectEligible ? 
                    <Tag color="success">มีสิทธิ์</Tag> : 
                    <Tag color="error">ยังไม่มีสิทธิ์</Tag>}
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
        
        <Divider orientation="left">เส้นทางการศึกษา</Divider>
        
        <Steps 
          current={calculateCurrentMainStep()}
          size="small"
          style={{ marginBottom: 24 }}
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
        
        <Divider />
        
        <Row gutter={24}>
          <Col span={12}>
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
                student.internshipEligible ? 
                <Tag color="success"><UnlockOutlined /> มีสิทธิ์ดำเนินการ</Tag> : 
                <Tooltip title="ต้องมีหน่วยกิตสะสมมากกว่า 81 หน่วยกิต">
                  <Tag color="error"><LockOutlined /> ยังไม่มีสิทธิ์</Tag>
                </Tooltip>
              }
            >
              <Timeline mode="left">
                {milestones.internship.steps.map(renderTimelineItem)}
              </Timeline>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card 
              title={
                <Space>
                  <ExperimentOutlined />
                  <span>โครงงานพิเศษ</span>
                  {milestones.project.blocked && <Tag color="error">ไม่สามารถดำเนินการได้</Tag>}
                </Space>
              }
              extra={
                student.projectEligible ? 
                <Tag color="success"><UnlockOutlined /> มีสิทธิ์ดำเนินการ</Tag> : 
                <Tooltip title={`ต้องมีหน่วยกิตสะสมมากกว่า 95 หน่วยกิต และผ่านการฝึกงาน (${milestones.project.blockReason})`}>
                  <Tag color="error"><LockOutlined /> ยังไม่มีสิทธิ์</Tag>
                </Tooltip>
              }
            >
              {milestones.project.blocked ? (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                  <LockOutlined style={{ fontSize: 32, color: '#ff4d4f', marginBottom: 16 }} />
                  <p><Text type="danger">ยังไม่สามารถเริ่มโครงงานได้</Text></p>
                  <p><Text type="secondary">{milestones.project.blockReason}</Text></p>
                </div>
              ) : (
                <Timeline mode="left">
                  {milestones.project.steps.map(renderTimelineItem)}
                </Timeline>
              )}
            </Card>
          </Col>
        </Row>
        
        <Divider orientation="left">กำหนดการสำคัญที่กำลังจะมาถึง</Divider>
        
        <Card>
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
                </Space>
                <div><Text type="secondary">วันที่: {deadline.date}</Text></div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      </Card>
    </div>
  );
};

export default TimelineSettings;