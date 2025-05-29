// Helper functions for StudentTimeline component
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  LockOutlined,
  InfoCircleOutlined,
  ClockCircleFilled,
} from "@ant-design/icons";

// คำนวณสถานะหลักของการศึกษา
export const calculateMainProgress = (student) => {
  if (student.internshipStatus === "completed") {
    return student.projectStatus === "completed" ? 3 : 1;
  } else if (student.internshipStatus === "in_progress") {
    return 0;
  } else {
    return 0;
  }
};

// รับข้อความสถานะ
export const getStatusText = (status) => {
  switch (status) {
    case "completed":
      return "เสร็จสิ้น";
    case "in_progress":
      return "กำลังดำเนินการ";
    case "pending":
      return "รอการอนุมัติ";
    case "awaiting_action":
      return "รอการดำเนินการ";
    case "waiting":
      return "รอดำเนินการ";
    case "blocked":
      return "ไม่สามารถดำเนินการได้";
    default:
      return `ไม่ทราบสถานะ (${status})`;
  }
};

// รับสีตามสถานะ
export const getStatusColor = (status) => {
  switch (status) {
    case "completed":
      return "success";
    case "in_progress":
      return "processing";
    case "pending":
      return "warning";
    case "awaiting_action":
      return "warning";
    case "waiting":
      return "default";
    case "blocked":
      return "error";
    case "rejected":
      return "error";
    case "overdue":
      return "error";
    default:
      return "default";
  }
};

// รับไอคอนตามสถานะ
export const getStatusIcon = (status) => {
  switch (status) {
    case "completed":
      return <CheckCircleOutlined />;
    case "in_progress":
      return <ClockCircleOutlined />;
    case "pending":
      return <ClockCircleFilled />;
    case "awaiting_action":
      return <WarningOutlined />;
    case "waiting":
      return <InfoCircleOutlined />;
    case "blocked":
      return <LockOutlined />;
    case "rejected":
      return <WarningOutlined />;
    case "overdue":
      return <WarningOutlined />;
    default:
      return <InfoCircleOutlined />;
  }
};

// ฟังก์ชันสำหรับสร้างค่าเริ่มต้นที่ยืดหยุ่น
export const createDefaultStudentData = (requirements = null) => ({
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
  projectStatus: "not_started",
  requirements: requirements || {
    internship: null,
    project: null,
  },
});

// ค่าเริ่มต้นสำหรับข้อมูลนักศึกษา (ใช้ function แทน const)
export const DEFAULT_STUDENT_DATA = createDefaultStudentData();

// ค่าเริ่มต้นสำหรับข้อมูลความก้าวหน้า
export const DEFAULT_PROGRESS_DATA = {
  internship: {
    currentStep: 0,
    totalSteps: 0,
    progress: 0,
    steps: [],
    blocked: true,
    blockReason: "",
  },
  project: {
    currentStep: 0,
    totalSteps: 0,
    progress: 0,
    steps: [],
    blocked: true,
    blockReason: "",
  },
};
