/**
 * Deadline Templates - Fixed preset สำหรับกำหนดการสำคัญ
 * 
 * เมื่อเจ้าหน้าที่เลือก template ระบบจะ:
 * 1. Auto-fill ชื่อกำหนดการ
 * 2. กำหนด workflow mapping อัตโนมัติ
 * 3. ตั้งค่า late tracking policy
 * 
 * ⚠️ สำหรับระบบฝึกงาน มี deadline เฉพาะ 2 ขั้นตอน:
 *    1. CS05 - คำร้องขอฝึกงาน (มี deadline enforcement)
 *    2. Report - คำขอหนังสือรับรอง (มี deadline enforcement)
 *    - Acceptance Letter ไม่มี deadline (ขึ้นอยู่กับบริษัท)
 */

export const DEADLINE_TEMPLATES = [
  // ========== การฝึกงาน (Internship) ==========
  {
    id: 'INTERNSHIP_CS05_SUBMISSION',
    name: 'วันสุดท้ายของการส่งคำร้องขอฝึกงาน (คพ.05)',
    description: 'ส่งคำร้องขอฝึกงาน (คพ.05) พร้อมแนบเอกสารและใบแสดงผลการเรียน - มีการบังคับใช้ deadline',
    category: 'internship',
    relatedTo: 'internship',
    deadlineType: 'SUBMISSION',
    documentSubtype: 'CS05',
    workflowType: 'internship',
    icon: '📄',
    defaultSettings: {
      acceptingSubmissions: true,
      allowLate: true,
      gracePeriodMinutes: 10080, // 7 วัน
      lockAfterDeadline: false
    },
    autoCreateMapping: true,
    important: true
  },
  {
    id: 'INTERNSHIP_REPORT_SUBMISSION',
    name: 'วันสุดท้ายของการส่งคำขอหนังสือรับรองการฝึกงาน',
    description: 'ส่งคำขอหนังสือรับรองผลการฝึกงาน (Certificate Request) หลังเสร็จสิ้นการฝึกงาน',
    category: 'internship',
    relatedTo: 'internship',
    deadlineType: 'SUBMISSION',
    documentSubtype: 'report',
    workflowType: 'internship',
    icon: '📋',
    defaultSettings: {
      acceptingSubmissions: true,
      allowLate: true,
      gracePeriodMinutes: 10080, // 7 วัน
      lockAfterDeadline: false
    },
    autoCreateMapping: true,
    important: true // แสดงเป็น highlighted
  },
  
  // ========== โครงงานพิเศษ 1 (Project 1) ==========
  {
    id: 'PROJECT1_PROPOSAL_SUBMISSION',
    name: 'วันสุดท้ายของการส่งหัวข้อโครงงานพิเศษ 1',
    description: 'ยื่นหัวข้อและเค้าโครงโครงงานพิเศษ (Proposal)',
    category: 'project',
    relatedTo: 'project1',
    deadlineType: 'SUBMISSION',
    documentSubtype: 'PROJECT1_PROPOSAL',
    workflowType: 'project1',
    icon: '📝',
    defaultSettings: {
      acceptingSubmissions: true,
      allowLate: true,
      gracePeriodMinutes: 4320, // 3 วัน
      lockAfterDeadline: false
    },
    autoCreateMapping: true,
    important: true
  },
  {
    id: 'PROJECT1_DEFENSE_REQUEST_SUBMISSION',
    name: 'วันสุดท้ายของการส่งคำร้องขอสอบโครงงานพิเศษ 1 (คพ.02)',
    description: 'ยื่นคำร้องขอสอบโครงงานพิเศษ 1 พร้อมเอกสารบทที่1 - บทที่3 ที่ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ',
    category: 'project',
    relatedTo: 'project1',
    deadlineType: 'SUBMISSION',
    documentSubtype: 'PROJECT1_DEFENSE_REQUEST',
    workflowType: 'project1',
    icon: '🎯',
    defaultSettings: {
      acceptingSubmissions: true,
      allowLate: true,
      gracePeriodMinutes: 2880, // 2 วัน
      lockAfterDeadline: false
    },
    autoCreateMapping: true,
    important: true
  },
  
  // ========== ปริญญานิพนธ์ (Thesis / Project 2) ==========
  {
    id: 'THESIS_DEFENSE_REQUEST_SUBMISSION',
    name: 'วันสุดท้ายของการส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)',
    description: 'ยื่นคำร้องขอสอบปริญญานิพนธ์ฉบับสมบูรณ์',
    category: 'project',
    relatedTo: 'project2',
    deadlineType: 'SUBMISSION',
    documentSubtype: 'THESIS_DEFENSE_REQUEST',
    workflowType: 'project2',
    icon: '🎓',
    defaultSettings: {
      acceptingSubmissions: true,
      allowLate: true,
      gracePeriodMinutes: 2880, // 2 วัน
      lockAfterDeadline: false
    },
    autoCreateMapping: true,
    important: true
  },
  
  {
    id: 'PROJECT_SYSTEM_TEST_REQUEST',
    name: 'วันสุดท้ายของการยื่นเอกสารขอทดสอบระบบโครงงานพิเศษ',
    description: 'ยื่นคำขอทดสอบระบบ (ต้องยื่นล่วงหน้าอย่างน้อย 30 วัน)',
    category: 'project',
    relatedTo: 'project2',
    deadlineType: 'SUBMISSION',
    documentSubtype: 'PROJECT_SYSTEM_TEST_REQUEST',
    workflowType: 'project2',
    icon: '🧪',
    defaultSettings: {
      acceptingSubmissions: true,
      allowLate: true,
      gracePeriodMinutes: 1440, // 1 วัน
      lockAfterDeadline: false
    },
    autoCreateMapping: true,
    important: true,
    note: '⚠️ ต้องยื่นล่วงหน้าอย่างน้อย 30 วัน ก่อนวันสอบ'
  },
  {
    id: 'THESIS_FINAL_SUBMISSION',
    name: 'วันสุดท้ายของการส่งปริญญานิพนธ์ฉบับสมบูรณ์',
    description: 'ส่งปริญญานิพนธ์ฉบับสมบูรณ์หลังแก้ไขตามคำแนะนำ',
    category: 'project',
    relatedTo: 'project2',
    deadlineType: 'SUBMISSION',
    documentSubtype: 'THESIS_FINAL_REPORT',
    workflowType: 'project2',
    icon: '📖',
    defaultSettings: {
      acceptingSubmissions: true,
      allowLate: true,
      gracePeriodMinutes: 14400, // 10 วัน
      lockAfterDeadline: false
    },
    autoCreateMapping: true
  },
  
  // ========== กำหนดการทั่วไป (General Events) ==========
  {
    id: 'REGISTRATION_PERIOD',
    name: 'ช่วงเวลาลงทะเบียนเรียน',
    description: 'ช่วงเวลาเปิด-ปิดลงทะเบียน',
    category: 'general',
    relatedTo: 'general',
    deadlineType: 'REGISTRATION',
    icon: '📝',
    defaultSettings: {
      acceptingSubmissions: false,
      allowLate: false,
      lockAfterDeadline: true
    },
    autoCreateMapping: false, // ไม่ต้องสร้าง mapping
    useWindowMode: true // ใช้ window mode
  },
  {
    id: 'SEMESTER_START',
    name: 'วันเปิดเรียน',
    description: 'วันเริ่มต้นภาคการศึกษา',
    category: 'general',
    relatedTo: 'general',
    deadlineType: 'MILESTONE',
    icon: '🎒',
    defaultSettings: {
      acceptingSubmissions: false,
      allowLate: false
    },
    autoCreateMapping: false
  },
  {
    id: 'SEMESTER_END',
    name: 'วันปิดเรียน',
    description: 'วันสิ้นสุดภาคการศึกษา',
    category: 'general',
    relatedTo: 'general',
    deadlineType: 'MILESTONE',
    icon: '🎉',
    defaultSettings: {
      acceptingSubmissions: false,
      allowLate: false
    },
    autoCreateMapping: false
  },
  {
    id: 'CUSTOM',
    name: 'กำหนดการอื่นๆ (กำหนดเองทั้งหมด)',
    description: 'สร้างกำหนดการที่ไม่อยู่ใน template',
    category: 'custom',
    relatedTo: 'general',
    deadlineType: 'ANNOUNCEMENT',
    icon: '➕',
    defaultSettings: {
      acceptingSubmissions: false,
      allowLate: false
    },
    autoCreateMapping: false,
    isCustom: true
  }
];

/**
 * จัดกลุ่ม templates ตามหมวดหมู่
 */
export const TEMPLATE_GROUPS = [
  {
    key: 'internship',
    label: 'การฝึกงาน',
    templates: DEADLINE_TEMPLATES.filter(t => t.category === 'internship')
  },
  {
    key: 'project1',
    label: 'โครงงานพิเศษ 1',
    templates: DEADLINE_TEMPLATES.filter(t => t.relatedTo === 'project1')
  },
  {
    key: 'project2',
    label: 'ปริญญานิพนธ์',
    templates: DEADLINE_TEMPLATES.filter(t => t.relatedTo === 'project2')
  },
  {
    key: 'general',
    label: 'กำหนดการทั่วไป',
    templates: DEADLINE_TEMPLATES.filter(t => t.category === 'general')
  },
  {
    key: 'custom',
    label: 'กำหนดเอง',
    templates: DEADLINE_TEMPLATES.filter(t => t.isCustom)
  }
];

/**
 * ค้นหา template จาก ID
 */
export const getTemplateById = (templateId) => {
  return DEADLINE_TEMPLATES.find(t => t.id === templateId);
};

/**
 * ตรวจสอบว่า template ต้องสร้าง mapping หรือไม่
 */
export const shouldCreateMapping = (template) => {
  return template && template.autoCreateMapping === true;
};

/**
 * สร้าง mapping payload สำหรับส่งไป backend
 */
export const buildMappingPayload = (template, deadlineId) => {
  if (!shouldCreateMapping(template)) {
    return null;
  }
  
  return {
    importantDeadlineId: deadlineId,
    workflowType: template.workflowType,
    documentSubtype: template.documentSubtype,
    autoAssign: 'on_submit',
    active: true
  };
};

/**
 * ดึง templates ที่เป็น important (แสดงเด่น)
 */
export const getImportantTemplates = () => {
  return DEADLINE_TEMPLATES.filter(t => t.important === true);
};

/**
 * Filter templates ตาม semester
 */
export const getTemplatesBySemester = (semester) => {
  // ส่วนใหญ่ใช้ได้ทุก semester
  // แต่อาจจะมีบาง template ที่จำกัด semester ในอนาคต
  return DEADLINE_TEMPLATES;
};

export default DEADLINE_TEMPLATES;
