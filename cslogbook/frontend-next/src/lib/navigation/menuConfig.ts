import { featureFlags } from "@/lib/config/featureFlags";
import type { AuthUser } from "@/lib/api/authService";

type MenuBase = {
  key: string;
  label: string;
};

export type MenuLink = MenuBase & {
  kind: "link";
  href: string;
  external?: boolean;
  children?: MenuNode[];
};

export type MenuGroupNode = MenuBase & {
  kind: "group";
  children: MenuNode[];
};

export type MenuNode = MenuLink | MenuGroupNode;

export type MenuGroup = {
  key: string;
  label: string;
  items: MenuNode[];
};

type BuildOptions = {
  user: AuthUser | null;
  canAccessInternship?: boolean | null;
  canAccessProject?: boolean | null;
};

function link(path: string) {
  return { href: path, external: false } as const;
}

function buildStudentMenu(options: BuildOptions): MenuNode[] {
  const { user, canAccessInternship, canAccessProject } = options;
  const studentCode = user?.studentCode ?? "me";
  const internshipAllowed = canAccessInternship ?? true;
  const projectAllowed = canAccessProject ?? true;

  const items: MenuNode[] = [
    { key: "student-dashboard", label: "แดชบอร์ด", kind: "link", ...link("/dashboard/student", true) },
    { key: "student-profile", label: "ประวัตินักศึกษา", kind: "link", ...link(`/student-profile/${studentCode}`, featureFlags.enableStudentProfilePage) },
    { key: "student-calendar", label: "ปฏิทินกำหนดการ", kind: "link", ...link("/student-deadlines/calendar", featureFlags.enableDeadlinesPage) },
    { key: "student-deadlines", label: "กำหนดส่งทั้งหมด", kind: "link", ...link("/deadlines", featureFlags.enableDeadlinesPage) },
  ];

  const internshipMenu: MenuGroupNode = internshipAllowed
    ? {
        key: "internship",
        label: "ระบบฝึกงาน",
        kind: "group",
        children: [
          { key: "internship-companies", label: "สถานประกอบการ (สถิติ)", kind: "link", ...link("/internship-companies") },
          { key: "internship-flow", label: "ลงทะเบียนคำร้องฝึกงาน", kind: "link", ...link("/internship-registration", featureFlags.enableInternshipFlowPage) },
          { key: "internship-companyinfo", label: "ข้อมูลสถานประกอบการ", kind: "link", ...link("/internship-logbook/companyinfo") },
          { key: "internship-timesheet", label: "บันทึกประจำวัน", kind: "link", ...link("/internship/logbook", featureFlags.enableInternshipLogbookPage) },
          { key: "internship-summary", label: "สรุปผลฝึกงาน", kind: "link", ...link("/internship-summary") },
          { key: "internship-certificate", label: "หนังสือรับรองฝึกงาน", kind: "link", ...link("/internship/certificate", featureFlags.enableInternshipCertificatePage) },
        ],
      }
    : {
        key: "internship",
        label: "ระบบฝึกงาน",
        kind: "group",
        children: [
          { key: "internship-eligibility", label: "ตรวจสอบคุณสมบัติ", kind: "link", ...link("/internship-eligibility") },
          { key: "internship-requirements", label: "ข้อกำหนดฝึกงาน", kind: "link", ...link("/internship-requirements") },
        ],
      };

  items.push(internshipMenu);

  items.push(
    projectAllowed
      ? {
          key: "project-main",
          label: "โครงงานพิเศษ",
          kind: "group",
          children: [
            { key: "project-phase1", label: "ขั้นตอนโครงงานพิเศษ", kind: "link", ...link("/project/phase1", featureFlags.enableProjectPhase1Page) },
            { key: "project-phase2", label: "โครงงานพิเศษ 2", kind: "link", ...link("/project/phase2", featureFlags.enableProjectPhase2Page) },
          ],
        }
      : {
          key: "project-info",
          label: "โครงงานพิเศษ",
          kind: "group",
          children: [
            { key: "project-eligibility", label: "ตรวจสอบคุณสมบัติ", kind: "link", ...link("/project-eligibility") },
            { key: "project-requirements", label: "ข้อกำหนดโครงงาน", kind: "link", ...link("/project-requirements") },
          ],
        }
  );

  return items;
}

function buildTeacherMenu(options: BuildOptions): MenuNode[] {
  const { user } = options;
  if (!user) return [];

  const isAcademic = user.teacherType === "academic";
  const isSupport = user.teacherType === "support";
  const canSeeTopicExam = Boolean(user.canAccessTopicExam);
  const canExportProject1 = Boolean(user.canExportProject1);
  const canExportThesis = Boolean((user as { canExportThesis?: boolean }).canExportThesis ?? user.canExportProject1);
  const teacherPosition = (user as { teacherPosition?: string }).teacherPosition;
  const canApproveDocuments = isAcademic && teacherPosition === "หัวหน้าภาควิชา";

  const privilegedChildren: MenuNode[] = [];

  if (canSeeTopicExam) {
    privilegedChildren.push({
      key: "topic-overview",
      label: "รายชื่อหัวข้อโครงงาน",
      kind: "link",
      ...link("/teacher/topic-exam/overview"),
    });
  }

  if (canExportProject1) {
    privilegedChildren.push({
      key: "kp02-queue",
      label: "รายชื่อสอบโครงงานพิเศษ",
      kind: "link",
      ...link("/admin/project1/kp02-queue"),
    });
  }

  if (canExportThesis) {
    privilegedChildren.push({
      key: "thesis-queue",
      label: "รายชื่อสอบปริญญานิพนธ์",
      kind: "link",
      ...link("/admin/thesis/staff-queue"),
    });
  }

  const privileged: MenuGroupNode | null =
    privilegedChildren.length > 0
      ? {
          key: "teacher-privileged",
          label: "สำหรับอาจารย์ที่มีสิทธิ์",
          kind: "group",
          children: privilegedChildren,
        }
      : null;

  const academicItems: MenuNode[] = isAcademic
    ? [
        { key: "teacher-dashboard", label: "แดชบอร์ด", kind: "link", ...link("/dashboard/teacher", true) },
        { key: "teacher-calendar", label: "ปฏิทินกำหนดการ", kind: "link", ...link("/teacher/deadlines/calendar") },
        { key: "meetings", label: "การนัดหมาย/บันทึก", kind: "link", ...link("/meetings", featureFlags.enableMeetingsPage) },
        { key: "meeting-approvals", label: "อนุมัติบันทึกการพบ", kind: "link", ...link("/teacher/meeting-approvals") },
        { key: "advisor-queue", label: "คำขอสอบ คพ.02", kind: "link", ...link("/teacher/project1/advisor-queue") },
        { key: "thesis-advisor-queue", label: "คำขอสอบ คพ.03", kind: "link", ...link("/teacher/thesis/advisor-queue") },
        { key: "system-test-advisor", label: "คำขอทดสอบระบบ", kind: "link", ...link("/teacher/system-test/advisor-queue") },
        ...(privileged ? [privileged] : []),
        ...(canApproveDocuments
          ? [{ key: "approve-documents", label: "อนุมัติเอกสาร", kind: "link", ...link("/approve-documents") }]
          : []),
      ]
    : [];

  const supportItems: MenuNode[] = isSupport
    ? [
        { key: "teacher-dashboard", label: "แดชบอร์ด", kind: "link", ...link("/dashboard/admin", true) },
        ...(privileged ? [privileged] : []),
        {
          key: "manage",
          label: "จัดการข้อมูล",
          kind: "group",
          children: [
            { key: "students", label: "นักศึกษา", kind: "link", ...link("/admin/users/students") },
            { key: "teachers", label: "อาจารย์", kind: "link", ...link("/admin/users/teachers") },
            { key: "project-pairs", label: "นักศึกษาโครงงานพิเศษ", kind: "link", ...link("/project-pairs") },
          ],
        },
        {
          key: "documents",
          label: "จัดการเอกสาร",
          kind: "group",
          children: [
            {
              key: "internship-documents",
              label: "เอกสารฝึกงาน",
              kind: "group",
              children: [
                { key: "admin-internship", label: "คำร้องขอฝึกงาน", kind: "link", ...link("/admin/documents/internship") },
                { key: "admin-cert", label: "หนังสือรับรองฝึกงาน", kind: "link", ...link("/admin/documents/certificates") },
              ],
            },
            {
              key: "project-documents",
              label: "เอกสารโครงงานพิเศษ",
              kind: "group",
              children: [
                { key: "topic-results", label: "ผลสอบหัวข้อ", kind: "link", ...link("/admin/topic-exam/results") },
                { key: "kp02", label: "คำร้อง คพ.02", kind: "link", ...link("/admin/project1/kp02-queue") },
                { key: "project-exam", label: "ผลสอบโครงงานพิเศษ 1", kind: "link", ...link("/admin/project-exam/results") },
                { key: "system-test", label: "คำขอทดสอบระบบ", kind: "link", ...link("/admin/system-test/staff-queue") },
                { key: "thesis-queue", label: "คำร้อง คพ.03", kind: "link", ...link("/admin/thesis/staff-queue") },
                { key: "thesis-results", label: "ผลสอบปริญญานิพนธ์", kind: "link", ...link("/admin/thesis/exam-results") },
              ],
            },
          ],
        },
        {
          key: "reports",
          label: "รายงาน",
          kind: "group",
          children: [
            { key: "internship-companies", label: "สถานประกอบการ", kind: "link", ...link("/internship-companies") },
            { key: "internship-report", label: "รายงานฝึกงาน", kind: "link", ...link("/admin/reports/internship") },
            { key: "project-report", label: "รายงานโครงงาน", kind: "link", ...link("/admin/reports/project") },
            { key: "workflow-progress", label: "ความคืบหน้า Workflow", kind: "link", ...link("/admin/reports/workflow-progress") },
            { key: "deadline-compliance", label: "การปฏิบัติตามกำหนด", kind: "link", ...link("/admin/reports/deadline-compliance") },
            { key: "advisor-workload", label: "ภาระงานอาจารย์", kind: "link", ...link("/admin/reports/advisor-workload") },
            { key: "reports-new", label: "รายงาน (ใหม่)", kind: "link", ...link("/reports", featureFlags.enableReportsPage) },
          ],
        },
        { key: "upload", label: "อัปโหลดรายชื่อนักศึกษา", kind: "link", ...link("/admin/upload") },
        {
          key: "settings",
          label: "ตั้งค่าระบบ",
          kind: "group",
          children: [
            { key: "settings-overview", label: "ภาพรวมการตั้งค่า", kind: "link", ...link("/admin/settings") },
            { key: "curriculum", label: "หลักสูตร", kind: "link", ...link("/admin/settings/curriculum") },
            { key: "academic", label: "ปีการศึกษา/ภาคเรียน", kind: "link", ...link("/admin/settings/academic") },
            { key: "notification", label: "การแจ้งเตือน", kind: "link", ...link("/admin/settings/notification-settings") },
            { key: "settings-new", label: "ตั้งค่า (ใหม่)", kind: "link", ...link("/settings", featureFlags.enableSettingsPage) },
          ],
        },
      ]
    : [];

  return [...academicItems, ...supportItems];
}

function buildAdminMenu(): MenuNode[] {
  return [
    { key: "admin-dashboard", label: "แดชบอร์ด", kind: "link", ...link("/dashboard/admin", true) },
    {
      key: "manage",
      label: "จัดการข้อมูล",
      kind: "group",
      children: [
        { key: "students", label: "นักศึกษา", kind: "link", ...link("/admin/users/students") },
        { key: "teachers", label: "อาจารย์", kind: "link", ...link("/admin/users/teachers") },
        { key: "project-pairs", label: "นักศึกษาโครงงานพิเศษ", kind: "link", ...link("/project-pairs") },
      ],
    },
    {
      key: "documents",
      label: "จัดการเอกสาร",
      kind: "group",
      children: [
        {
          key: "internship-documents",
          label: "เอกสารฝึกงาน",
          kind: "group",
          children: [
            { key: "internship-requests", label: "คำร้องขอฝึกงาน", kind: "link", ...link("/admin/documents/internship") },
            { key: "internship-certificates", label: "หนังสือรับรอง", kind: "link", ...link("/admin/documents/certificates") },
          ],
        },
        {
          key: "project-documents",
          label: "เอกสารโครงงานพิเศษ",
          kind: "group",
          children: [
            { key: "topic-results", label: "ผลสอบหัวข้อ", kind: "link", ...link("/admin/topic-exam/results") },
            { key: "kp02", label: "คำร้อง คพ.02", kind: "link", ...link("/admin/project1/kp02-queue") },
            { key: "project-exam", label: "ผลสอบโครงงานพิเศษ 1", kind: "link", ...link("/admin/project-exam/results") },
            { key: "system-test", label: "คำขอทดสอบระบบ", kind: "link", ...link("/admin/system-test/staff-queue") },
            { key: "thesis-queue", label: "คำร้อง คพ.03", kind: "link", ...link("/admin/thesis/staff-queue") },
            { key: "thesis-results", label: "ผลสอบปริญญานิพนธ์", kind: "link", ...link("/admin/thesis/exam-results") },
          ],
        },
      ],
    },
    {
      key: "reports",
      label: "รายงาน",
      kind: "group",
      children: [
        { key: "internship-companies", label: "บริษัทฝึกงาน (สถิติ)", kind: "link", ...link("/internship-companies") },
        { key: "internship-report", label: "รายงานฝึกงาน", kind: "link", ...link("/admin/reports/internship") },
        { key: "project-report", label: "รายงานโครงงาน", kind: "link", ...link("/admin/reports/project") },
        { key: "workflow-progress", label: "ความคืบหน้า Workflow", kind: "link", ...link("/admin/reports/workflow-progress") },
        { key: "deadline-compliance", label: "การปฏิบัติตาม Deadline", kind: "link", ...link("/admin/reports/deadline-compliance") },
        { key: "advisor-workload", label: "ภาระงานอาจารย์", kind: "link", ...link("/admin/reports/advisor-workload") },
        { key: "reports-new", label: "รายงาน (ใหม่)", kind: "link", ...link("/reports", featureFlags.enableReportsPage) },
      ],
    },
    { key: "upload", label: "อัปโหลดรายชื่อนักศึกษา", kind: "link", ...link("/admin/upload") },
    {
      key: "settings",
      label: "ตั้งค่าระบบ",
      kind: "group",
      children: [
        { key: "settings-overview", label: "ภาพรวมการตั้งค่า", kind: "link", ...link("/admin/settings") },
        { key: "curriculum", label: "หลักสูตรการศึกษา", kind: "link", ...link("/admin/settings/curriculum") },
        { key: "academic", label: "ปีการศึกษา/ภาคเรียน", kind: "link", ...link("/admin/settings/academic") },
        { key: "status", label: "สถานะนักศึกษา", kind: "link", ...link("/admin/settings/status") },
        { key: "notification", label: "การแจ้งเตือน", kind: "link", ...link("/admin/settings/notification-settings") },
        { key: "workflow-steps", label: "ขั้นตอนการทำงาน", kind: "link", ...link("/admin/settings/workflow-steps") },
        { key: "settings-new", label: "ตั้งค่า (ใหม่)", kind: "link", ...link("/settings", featureFlags.enableSettingsPage) },
      ],
    },
  ];
}

export function getMenuGroups(options: BuildOptions): MenuGroup[] {
  const { user } = options;
  if (!user) return [];

  const groups: MenuGroup[] = [];

  if (user.role === "student") {
    groups.push({ key: "main", label: "นักศึกษา", items: buildStudentMenu(options) });
  }

  if (user.role === "teacher") {
    groups.push({ key: "teacher", label: "อาจารย์", items: buildTeacherMenu(options) });
  }

  if (user.role === "admin") {
    groups.push({ key: "admin", label: "ผู้ดูแลระบบ", items: buildAdminMenu() });
  }

  return groups;
}
