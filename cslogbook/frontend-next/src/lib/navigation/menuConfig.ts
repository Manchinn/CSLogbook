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

const legacyBase = process.env.NEXT_PUBLIC_LEGACY_FRONTEND_URL;

function withLegacy(path: string) {
  if (featureFlags.useLegacyFrontend && legacyBase) {
    try {
      return { href: new URL(path, legacyBase).toString(), external: true };
    } catch (_error) {
      return { href: path, external: false };
    }
  }
  return { href: path, external: false };
}

function buildStudentMenu(options: BuildOptions): MenuNode[] {
  const { user, canAccessInternship, canAccessProject } = options;
  const studentCode = user?.studentCode ?? "me";
  const internshipAllowed = canAccessInternship ?? true;
  const projectAllowed = canAccessProject ?? true;

  const items: MenuNode[] = [
    { key: "student-dashboard", label: "แดชบอร์ด", kind: "link", ...withLegacy("/dashboard/student") },
    { key: "student-profile", label: "ประวัตินักศึกษา", kind: "link", ...withLegacy(`/student-profile/${studentCode}`) },
    { key: "student-calendar", label: "ปฏิทินกำหนดการ", kind: "link", ...withLegacy("/student-deadlines/calendar") },
  ];

  const internshipMenu: MenuGroupNode = internshipAllowed
    ? {
        key: "internship",
        label: "ระบบฝึกงาน",
        kind: "group",
        children: [
          { key: "internship-companies", label: "สถานประกอบการ (สถิติ)", kind: "link", ...withLegacy("/internship-companies") },
          { key: "internship-flow", label: "ลงทะเบียนคำร้องฝึกงาน", kind: "link", ...withLegacy("/internship-registration/flow") },
          { key: "internship-companyinfo", label: "ข้อมูลสถานประกอบการ", kind: "link", ...withLegacy("/internship-logbook/companyinfo") },
          { key: "internship-timesheet", label: "บันทึกประจำวัน", kind: "link", ...withLegacy("/internship-logbook/timesheet") },
          { key: "internship-summary", label: "สรุปผลฝึกงาน", kind: "link", ...withLegacy("/internship-summary") },
          { key: "internship-certificate", label: "หนังสือรับรองฝึกงาน", kind: "link", ...withLegacy("/internship-certificate") },
        ],
      }
    : {
        key: "internship",
        label: "ระบบฝึกงาน",
        kind: "group",
        children: [
          { key: "internship-eligibility", label: "ตรวจสอบคุณสมบัติ", kind: "link", ...withLegacy("/internship-eligibility") },
          { key: "internship-requirements", label: "ข้อกำหนดฝึกงาน", kind: "link", ...withLegacy("/internship-requirements") },
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
            { key: "project-phase1", label: "ขั้นตอนโครงงานพิเศษ", kind: "link", ...withLegacy("/project/phase1") },
          ],
        }
      : {
          key: "project-info",
          label: "โครงงานพิเศษ",
          kind: "group",
          children: [
            { key: "project-eligibility", label: "ตรวจสอบคุณสมบัติ", kind: "link", ...withLegacy("/project-eligibility") },
            { key: "project-requirements", label: "ข้อกำหนดโครงงาน", kind: "link", ...withLegacy("/project-requirements") },
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
  const canExportThesis = Boolean((user as any).canExportThesis ?? user.canExportProject1);
  const canApproveDocuments = isAcademic && (user as any).teacherPosition === "หัวหน้าภาควิชา";

  const privileged: MenuGroupNode | null =
    canSeeTopicExam || canExportProject1 || canExportThesis
      ? {
          key: "teacher-privileged",
          label: "สำหรับอาจารย์ที่มีสิทธิ์",
          kind: "group",
          children: [
            ...(canSeeTopicExam
              ? [{ key: "topic-overview", label: "รายชื่อหัวข้อโครงงาน", kind: "link", ...withLegacy("/teacher/topic-exam/overview") }]
              : []),
            ...(canExportProject1
              ? [{ key: "kp02-queue", label: "รายชื่อสอบโครงงานพิเศษ", kind: "link", ...withLegacy("/admin/project1/kp02-queue") }]
              : []),
            ...(canExportThesis
              ? [{ key: "thesis-queue", label: "รายชื่อสอบปริญญานิพนธ์", kind: "link", ...withLegacy("/admin/thesis/staff-queue") }]
              : []),
          ],
        }
      : null;

  const academicItems: MenuNode[] = isAcademic
    ? [
        { key: "teacher-dashboard", label: "แดชบอร์ด", kind: "link", ...withLegacy("/dashboard/teacher") },
        { key: "teacher-calendar", label: "ปฏิทินกำหนดการ", kind: "link", ...withLegacy("/teacher/deadlines/calendar") },
        { key: "meeting-approvals", label: "อนุมัติบันทึกการพบ", kind: "link", ...withLegacy("/teacher/meeting-approvals") },
        { key: "advisor-queue", label: "คำขอสอบ คพ.02", kind: "link", ...withLegacy("/teacher/project1/advisor-queue") },
        { key: "thesis-advisor-queue", label: "คำขอสอบ คพ.03", kind: "link", ...withLegacy("/teacher/thesis/advisor-queue") },
        { key: "system-test-advisor", label: "คำขอทดสอบระบบ", kind: "link", ...withLegacy("/teacher/system-test/advisor-queue") },
        ...(privileged ? [privileged] : []),
        ...(canApproveDocuments
          ? [{ key: "approve-documents", label: "อนุมัติเอกสาร", kind: "link", ...withLegacy("/approve-documents") }]
          : []),
      ]
    : [];

  const supportItems: MenuNode[] = isSupport
    ? [
        { key: "teacher-dashboard", label: "แดชบอร์ด", kind: "link", ...withLegacy("/dashboard/teacher") },
        ...(privileged ? [privileged] : []),
        {
          key: "manage",
          label: "จัดการข้อมูล",
          kind: "group",
          children: [
            { key: "students", label: "นักศึกษา", kind: "link", ...withLegacy("/admin/users/students") },
            { key: "teachers", label: "อาจารย์", kind: "link", ...withLegacy("/admin/users/teachers") },
            { key: "project-pairs", label: "นักศึกษาโครงงานพิเศษ", kind: "link", ...withLegacy("/project-pairs") },
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
                { key: "admin-internship", label: "คำร้องขอฝึกงาน", kind: "link", ...withLegacy("/admin/documents/internship") },
                { key: "admin-cert", label: "หนังสือรับรองฝึกงาน", kind: "link", ...withLegacy("/admin/documents/certificates") },
              ],
            },
            {
              key: "project-documents",
              label: "เอกสารโครงงานพิเศษ",
              kind: "group",
              children: [
                { key: "topic-results", label: "ผลสอบหัวข้อ", kind: "link", ...withLegacy("/admin/topic-exam/results") },
                { key: "kp02", label: "คำร้อง คพ.02", kind: "link", ...withLegacy("/admin/project1/kp02-queue") },
                { key: "project-exam", label: "ผลสอบโครงงานพิเศษ 1", kind: "link", ...withLegacy("/admin/project-exam/results") },
                { key: "system-test", label: "คำขอทดสอบระบบ", kind: "link", ...withLegacy("/admin/system-test/staff-queue") },
                { key: "thesis-queue", label: "คำร้อง คพ.03", kind: "link", ...withLegacy("/admin/thesis/staff-queue") },
                { key: "thesis-results", label: "ผลสอบปริญญานิพนธ์", kind: "link", ...withLegacy("/admin/thesis/exam-results") },
              ],
            },
          ],
        },
        {
          key: "reports",
          label: "รายงาน",
          kind: "group",
          children: [
            { key: "internship-companies", label: "สถานประกอบการ", kind: "link", ...withLegacy("/internship-companies") },
            { key: "internship-report", label: "รายงานฝึกงาน", kind: "link", ...withLegacy("/admin/reports/internship") },
            { key: "project-report", label: "รายงานโครงงาน", kind: "link", ...withLegacy("/admin/reports/project") },
            { key: "workflow-progress", label: "ความคืบหน้า Workflow", kind: "link", ...withLegacy("/admin/reports/workflow-progress") },
            { key: "deadline-compliance", label: "การปฏิบัติตามกำหนด", kind: "link", ...withLegacy("/admin/reports/deadline-compliance") },
            { key: "advisor-workload", label: "ภาระงานอาจารย์", kind: "link", ...withLegacy("/admin/reports/advisor-workload") },
          ],
        },
        { key: "upload", label: "อัปโหลดรายชื่อนักศึกษา", kind: "link", ...withLegacy("/admin/upload") },
        {
          key: "settings",
          label: "ตั้งค่าระบบ",
          kind: "group",
          children: [
            { key: "settings-overview", label: "ภาพรวมการตั้งค่า", kind: "link", ...withLegacy("/admin/settings") },
            { key: "curriculum", label: "หลักสูตร", kind: "link", ...withLegacy("/admin/settings/curriculum") },
            { key: "academic", label: "ปีการศึกษา/ภาคเรียน", kind: "link", ...withLegacy("/admin/settings/academic") },
            { key: "notification", label: "การแจ้งเตือน", kind: "link", ...withLegacy("/admin/settings/notification-settings") },
          ],
        },
      ]
    : [];

  return [...academicItems, ...supportItems];
}

function buildAdminMenu(): MenuNode[] {
  return [
    { key: "admin-dashboard", label: "แดชบอร์ด", kind: "link", ...withLegacy("/dashboard/admin") },
    {
      key: "manage",
      label: "จัดการข้อมูล",
      kind: "group",
      children: [
        { key: "students", label: "นักศึกษา", kind: "link", ...withLegacy("/admin/users/students") },
        { key: "teachers", label: "อาจารย์", kind: "link", ...withLegacy("/admin/users/teachers") },
        { key: "project-pairs", label: "นักศึกษาโครงงานพิเศษ", kind: "link", ...withLegacy("/project-pairs") },
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
            { key: "internship-requests", label: "คำร้องขอฝึกงาน", kind: "link", ...withLegacy("/admin/documents/internship") },
            { key: "internship-certificates", label: "หนังสือรับรอง", kind: "link", ...withLegacy("/admin/documents/certificates") },
          ],
        },
        {
          key: "project-documents",
          label: "เอกสารโครงงานพิเศษ",
          kind: "group",
          children: [
            { key: "topic-results", label: "ผลสอบหัวข้อ", kind: "link", ...withLegacy("/admin/topic-exam/results") },
            { key: "kp02", label: "คำร้อง คพ.02", kind: "link", ...withLegacy("/admin/project1/kp02-queue") },
            { key: "project-exam", label: "ผลสอบโครงงานพิเศษ 1", kind: "link", ...withLegacy("/admin/project-exam/results") },
            { key: "system-test", label: "คำขอทดสอบระบบ", kind: "link", ...withLegacy("/admin/system-test/staff-queue") },
            { key: "thesis-queue", label: "คำร้อง คพ.03", kind: "link", ...withLegacy("/admin/thesis/staff-queue") },
            { key: "thesis-results", label: "ผลสอบปริญญานิพนธ์", kind: "link", ...withLegacy("/admin/thesis/exam-results") },
          ],
        },
      ],
    },
    {
      key: "reports",
      label: "รายงาน",
      kind: "group",
      children: [
        { key: "internship-companies", label: "บริษัทฝึกงาน (สถิติ)", kind: "link", ...withLegacy("/internship-companies") },
        { key: "internship-report", label: "รายงานฝึกงาน", kind: "link", ...withLegacy("/admin/reports/internship") },
        { key: "project-report", label: "รายงานโครงงาน", kind: "link", ...withLegacy("/admin/reports/project") },
        { key: "workflow-progress", label: "ความคืบหน้า Workflow", kind: "link", ...withLegacy("/admin/reports/workflow-progress") },
        { key: "deadline-compliance", label: "การปฏิบัติตาม Deadline", kind: "link", ...withLegacy("/admin/reports/deadline-compliance") },
        { key: "advisor-workload", label: "ภาระงานอาจารย์", kind: "link", ...withLegacy("/admin/reports/advisor-workload") },
      ],
    },
    { key: "upload", label: "อัปโหลดรายชื่อนักศึกษา", kind: "link", ...withLegacy("/admin/upload") },
    {
      key: "settings",
      label: "ตั้งค่าระบบ",
      kind: "group",
      children: [
        { key: "settings-overview", label: "ภาพรวมการตั้งค่า", kind: "link", ...withLegacy("/admin/settings") },
        { key: "curriculum", label: "หลักสูตรการศึกษา", kind: "link", ...withLegacy("/admin/settings/curriculum") },
        { key: "academic", label: "ปีการศึกษา/ภาคเรียน", kind: "link", ...withLegacy("/admin/settings/academic") },
        { key: "status", label: "สถานะนักศึกษา", kind: "link", ...withLegacy("/admin/settings/status") },
        { key: "notification", label: "การแจ้งเตือน", kind: "link", ...withLegacy("/admin/settings/notification-settings") },
        { key: "workflow-steps", label: "ขั้นตอนการทำงาน", kind: "link", ...withLegacy("/admin/settings/workflow-steps") },
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
