import { featureFlags } from "@/lib/config/featureFlags";
import type { AuthUser } from "@/lib/api/authService";

type MenuBase = {
  key: string;
  label: string;
};

export type MenuLink = MenuBase & {
  kind: "link";
  href: string;
  enabled?: boolean;
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

function menuLink(key: string, label: string, href: string, enabled = true): MenuLink {
  return { key, label, kind: "link", href, enabled };
}

function filterMenuNodes(items: MenuNode[]): MenuNode[] {
  return items
    .flatMap((item): MenuNode[] => {
      if (item.kind === "link") {
        return item.enabled === false ? [] : [{ ...item, children: item.children ? filterMenuNodes(item.children) : undefined }];
      }

      const children = filterMenuNodes(item.children);
      if (children.length === 0) {
        return [];
      }

      return [{ ...item, children }];
    });
}

function buildStudentMenu(options: BuildOptions): MenuNode[] {
  const { user, canAccessInternship, canAccessProject } = options;
  const studentCode = user?.studentCode ?? "me";
  const internshipAllowed = canAccessInternship ?? true;
  const projectAllowed = canAccessProject ?? true;

  const items: MenuNode[] = [
    menuLink("student-dashboard", "หน้าหลัก", "/dashboard/student", true),
    menuLink("student-profile", "ประวัตินักศึกษา", `/student-profile/${studentCode}`, featureFlags.enableStudentProfilePage),
    menuLink("student-calendar", "ปฏิทินกำหนดการ", "/student-deadlines/calendar", featureFlags.enableDeadlinesPage),
  ];

  const internshipMenu: MenuGroupNode = internshipAllowed
    ? {
        key: "internship",
        label: "ระบบฝึกงาน",
        kind: "group",
        children: [
          menuLink("internship-companies", "สถานประกอบการ (สถิติ)", "/internship-companies"),
          menuLink("internship-flow", "ลงทะเบียนคำร้องฝึกงาน", "/internship-registration", featureFlags.enableInternshipFlowPage),
          menuLink("internship-companyinfo", "ข้อมูลสถานประกอบการ", "/internship-logbook/companyinfo"),
          menuLink("internship-timesheet", "บันทึกประจำวัน", "/internship/logbook", featureFlags.enableInternshipLogbookPage),
          menuLink("internship-summary", "สรุปผลฝึกงาน", "/internship-summary"),
          menuLink("internship-certificate", "หนังสือรับรองฝึกงาน", "/internship/certificate", featureFlags.enableInternshipCertificatePage),
        ],
      }
    : {
        key: "internship",
        label: "ระบบฝึกงาน",
        kind: "group",
        children: [
          menuLink("internship-eligibility", "ตรวจสอบคุณสมบัติ", "/internship-eligibility"),
          menuLink("internship-requirements", "ข้อกำหนดฝึกงาน", "/internship-requirements"),
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
            menuLink("project-phase1", "ขั้นตอนโครงงานพิเศษ", "/project/phase1", featureFlags.enableProjectPhase1Page),
          ],
        }
      : {
          key: "project-info",
          label: "โครงงานพิเศษ",
          kind: "group",
          children: [
            menuLink("project-eligibility", "ตรวจสอบคุณสมบัติ", "/project-eligibility"),
            menuLink("project-requirements", "ข้อกำหนดโครงงาน", "/project-requirements"),
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
  // teacherPosition มีอยู่ใน AuthUser โดยตรง ไม่ต้อง cast
  const teacherPosition = user.teacherPosition;
  const canApproveDocuments = isAcademic && (teacherPosition === "หัวหน้าภาควิชา" || teacherPosition === "หัวหน้าภาค");

  const privilegedChildren: MenuNode[] = [];

  if (canSeeTopicExam) {
    privilegedChildren.push(
      menuLink("topic-overview", "รายชื่อหัวข้อโครงงาน", "/teacher/topic-exam/overview")
    );
  }

  if (canExportProject1) {
    privilegedChildren.push(
      menuLink("kp02-queue", "รายชื่อสอบโครงงานพิเศษ", "/admin/project1/kp02-queue")
    );
  }

  if (canExportThesis) {
    privilegedChildren.push(
      menuLink("thesis-queue", "รายชื่อสอบปริญญานิพนธ์", "/admin/thesis/staff-queue")
    );
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
        menuLink("teacher-dashboard", "หน้าหลัก", "/dashboard/teacher", true),
        menuLink("teacher-calendar", "ปฏิทินกำหนดการ", "/teacher/deadlines/calendar"),
        menuLink("meeting-approvals", "อนุมัติบันทึกการพบ", "/teacher/meeting-approvals"),
        menuLink("advisor-queue", "คำขอสอบ คพ.02", "/teacher/project1/advisor-queue"),
        menuLink("thesis-advisor-queue", "คำขอสอบ คพ.03", "/teacher/thesis/advisor-queue"),
        menuLink("system-test-advisor", "คำขอทดสอบระบบ", "/teacher/system-test/advisor-queue"),
        ...(privileged ? [privileged] : []),
        // แสดงกลุ่ม "อนุมัติเอกสาร" พร้อม sub-items เฉพาะหัวหน้าภาควิชา/หัวหน้าภาค
        ...(canApproveDocuments
          ? [
              {
                key: "approve-documents",
                label: "อนุมัติเอกสารฝึกงาน",
                kind: "group" as const,
                children: [
                  menuLink("approve-cs05", "หนังสือขอความอนุเคราะห์", "/approve-documents?tab=cs05"),
                  menuLink("approve-acceptance", "หนังสือส่งตัวนักศึกษา", "/approve-documents?tab=acceptance-letter"),
                ],
              } satisfies MenuGroupNode,
            ]
          : []),
      ]
    : [];

  const supportItems: MenuNode[] = isSupport
    ? [
        menuLink("teacher-dashboard", "หน้าหลัก", "/dashboard/admin", true),
        ...(privileged ? [privileged] : []),
        {
          key: "manage",
          label: "จัดการข้อมูล",
          kind: "group",
          children: [
            menuLink("students", "นักศึกษา", "/admin/users/students"),
            menuLink("teachers", "อาจารย์", "/admin/users/teachers"),
            menuLink("project-pairs", "นักศึกษาโครงงานพิเศษ", "/project-pairs"),
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
                menuLink("admin-internship", "คำร้องขอฝึกงาน", "/admin/documents/internship"),
                menuLink("admin-cert", "หนังสือรับรองฝึกงาน", "/admin/documents/certificates"),
              ],
            },
            {
              key: "project-documents",
              label: "เอกสารโครงงานพิเศษ",
              kind: "group",
              children: [
                menuLink("topic-results", "ผลสอบหัวข้อ", "/admin/topic-exam/results"),
                menuLink("kp02", "คำร้อง คพ.02", "/admin/project1/kp02-queue"),
                menuLink("project-exam", "ผลสอบโครงงานพิเศษ", "/admin/project-exam/results"),
                menuLink("system-test", "คำขอทดสอบระบบ", "/admin/system-test/staff-queue"),
                menuLink("thesis-queue", "คำร้อง คพ.03", "/admin/thesis/staff-queue"),
                menuLink("thesis-results", "ผลสอบปริญญานิพนธ์", "/admin/thesis/exam-results"),
              ],
            },
          ],
        },
        {
          key: "reports",
          label: "รายงาน",
          kind: "group",
          children: [
            menuLink("internship-companies", "สถานประกอบการ", "/internship-companies"),
            menuLink("internship-report", "รายงานฝึกงาน", "/admin/reports/internship"),
            menuLink("project-report", "รายงานโครงงาน", "/admin/reports/project"),
          ],
        },
        menuLink("upload", "อัปโหลดรายชื่อนักศึกษา", "/admin/upload"),
        {
          key: "settings",
          label: "ตั้งค่าระบบ",
          kind: "group",
          children: [
            menuLink("curriculum", "หลักสูตร", "/admin/settings/curriculum"),
            menuLink("academic", "ปีการศึกษา/ภาคเรียน", "/admin/settings/academic"),
            menuLink("notification", "การแจ้งเตือน", "/admin/settings/notification-settings"),
            menuLink("compatibility", "API เชื่อมต่อ", "/admin/settings/compatibility"),
          ],
        },
      ]
    : [];

  return [...academicItems, ...supportItems];
}

function buildAdminMenu(): MenuNode[] {
  return [
    menuLink("admin-dashboard", "หน้าหลัก", "/dashboard/admin", true),
    {
      key: "manage",
      label: "จัดการข้อมูล",
      kind: "group",
      children: [
        menuLink("students", "นักศึกษา", "/admin/users/students"),
        menuLink("teachers", "อาจารย์", "/admin/users/teachers"),
        menuLink("project-pairs", "นักศึกษาโครงงานพิเศษ", "/project-pairs"),
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
            menuLink("internship-requests", "คำร้องขอฝึกงาน", "/admin/documents/internship"),
            menuLink("internship-certificates", "หนังสือรับรอง", "/admin/documents/certificates"),
          ],
        },
        {
          key: "project-documents",
          label: "เอกสารโครงงานพิเศษ",
          kind: "group",
          children: [
            menuLink("topic-results", "ผลสอบหัวข้อ", "/admin/topic-exam/results"),
            menuLink("kp02", "คำร้อง คพ.02", "/admin/project1/kp02-queue"),
            menuLink("project-exam", "ผลสอบโครงงานพิเศษ", "/admin/project-exam/results"),
            menuLink("system-test", "คำขอทดสอบระบบ", "/admin/system-test/staff-queue"),
            menuLink("thesis-queue", "คำร้อง คพ.03", "/admin/thesis/staff-queue"),
            menuLink("thesis-results", "ผลสอบปริญญานิพนธ์", "/admin/thesis/exam-results"),
          ],
        },
      ],
    },
    {
      key: "reports",
      label: "รายงาน",
      kind: "group",
      children: [
        menuLink("internship-companies", "สถานประกอบการ (สถิติ)", "/internship-companies"),
        menuLink("internship-report", "รายงานฝึกงาน", "/admin/reports/internship"),
        menuLink("project-report", "รายงานโครงงาน", "/admin/reports/project"),
      ],
    },
    menuLink("upload", "อัปโหลดรายชื่อนักศึกษา", "/admin/upload"),
    {
      key: "settings",
      label: "ตั้งค่าระบบ",
      kind: "group",
      children: [
        menuLink("curriculum", "หลักสูตรการศึกษา", "/admin/settings/curriculum"),
        menuLink("academic", "ปีการศึกษา/ภาคเรียน", "/admin/settings/academic"),
        menuLink("status", "สถานะนักศึกษา", "/admin/settings/status"),
        menuLink("notification", "การแจ้งเตือน", "/admin/settings/notification-settings"),
            menuLink("compatibility", "API เชื่อมต่อ", "/admin/settings/compatibility"),
            menuLink("workflow-steps", "ขั้นตอนการทำงาน", "/admin/settings/workflow-steps"),
            menuLink("settings-new", "ตั้งค่า", "/settings", featureFlags.enableSettingsPage),
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

  return groups.map((group) => ({ ...group, items: filterMenuNodes(group.items) }));
}
