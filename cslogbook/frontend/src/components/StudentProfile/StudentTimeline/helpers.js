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
      return "รอการอนุมัติ"; // เช่น รออนุมัติ คพ.05
    case "awaiting_action":
      return "รอการดำเนินการ"; // เช่น รอนักศึกษาอัปโหลดเอกสาร
    case "waiting":
      return "รอดำเนินการ"; // ขั้นตอนที่ยังไม่ถึงคิว
    case "blocked":
      return "ไม่สามารถดำเนินการได้";
    default:
      return `ไม่ทราบสถานะ (${status})`; // แสดง status ที่ไม่รู้จักเพื่อช่วย debug
  }
};

// รับสีตามสถานะ
export const getStatusColor = (status) => {
  switch (status) {
    case "completed":
      return "success"; // เขียว: เสร็จสิ้น
    case "in_progress":
      return "processing"; // ฟ้า: กำลังดำเนินการ
    case "pending":
      return "warning"; // ส้ม/เหลือง: รอการอนุมัติ
    case "awaiting_action":
      return "processing"; // ฟ้า: รอนักศึกษาดำเนินการ (อาจจะใช้สีเดียวกับ in_progress หรือสีอื่นที่สื่อว่าต้องทำอะไรบางอย่าง)
    // หรือ 'warning' ถ้าต้องการให้เด่นชัดว่ามี action ค้างอยู่
    case "waiting":
      return "default"; // เทา/default: รอดำเนินการ/ยังไม่ถึง
    case "blocked":
      return "error"; // แดง: ไม่สามารถดำเนินการได้
    case "rejected":
      return "error"; // แดง: ถูกปฏิเสธ
    case "overdue":
      return "error"; // แดง: เลยกำหนด
    // เพิ่ม case อื่นๆ ตามที่ backend อาจจะส่งมา หรือตามต้องการ
    default:
      return "default"; // สีเริ่มต้นสำหรับสถานะที่ไม่รู้จัก
  }
};

// รับไอคอนตามสถานะ
export const getStatusIcon = (status) => {
  switch (status) {
    case "completed":
      return <CheckCircleOutlined />; // ไอคอนถูก: เสร็จสิ้น
    case "in_progress":
      return <ClockCircleFilled />; // ไอคอนนาฬิกา (เต็ม): กำลังดำเนินการ
    case "pending":
      return <WarningOutlined />; // ไอคอนเตือน: รอการอนุมัติ
    case "awaiting_action":
      return <ClockCircleOutlined />; // ไอคอนนาฬิกา (ว่าง): รอนักศึกษาดำเนินการ
    // หรือ <EditOutlined /> ถ้าเป็นการรอแก้ไข/กรอกข้อมูล
    case "waiting":
      return <ClockCircleOutlined />; // ไอคอนนาฬิกา (ว่าง): รอดำเนินการ/ยังไม่ถึง
    case "blocked":
      return <LockOutlined />; // ไอคอนล็อค: ไม่สามารถดำเนินการได้
    case "rejected":
      return <WarningOutlined />; // ไอคอนเตือน: ถูกปฏิเสธ (อาจจะใช้ CloseCircleOutlined)
    case "overdue":
      return <WarningOutlined />; // ไอคอนเตือน: เลยกำหนด
    // เพิ่ม case อื่นๆ ตามที่ backend อาจจะส่งมา หรือตามต้องการ
    default:
      return <InfoCircleOutlined />; // ไอคอนข้อมูล: สถานะที่ไม่รู้จัก
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
  projectStatus: "not_started",
};

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
