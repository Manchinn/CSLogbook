// Helper functions for StudentTimeline component
import { 
  ClockCircleOutlined, CheckCircleOutlined, WarningOutlined,
  LockOutlined, InfoCircleOutlined, ClockCircleFilled
} from '@ant-design/icons';

// คำนวณสถานะหลักของการศึกษา
export const calculateMainProgress = (student) => {
  if (student.internshipStatus === 'completed') {
    return student.projectStatus === 'completed' ? 3 : 1;
  } else if (student.internshipStatus === 'in_progress') {
    return 0;
  } else {
    return 0;
  }
};

// รับข้อความสถานะ
export const getStatusText = (status) => {
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
export const getStatusColor = (status) => {
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
export const getStatusIcon = (status) => {
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

// ค่าเริ่มต้นสำหรับข้อมูลนักศึกษา
export const DEFAULT_STUDENT_DATA = {
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

// ค่าเริ่มต้นสำหรับข้อมูลความก้าวหน้า
export const DEFAULT_PROGRESS_DATA = {
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