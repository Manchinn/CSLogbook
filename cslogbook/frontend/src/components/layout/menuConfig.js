// เมนูถูกรวมศูนย์มาจาก Sidebar เดิม (เวอร์ชันเต็ม) ให้ Sidebar เรียกใช้จากที่นี่ที่เดียว
import {
  HomeOutlined,
  TeamOutlined,
  FileTextOutlined,
  FormOutlined,
  BookOutlined,
  FileDoneOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  SettingOutlined,
  FileProtectOutlined,
  ProjectOutlined,
  BarChartOutlined,
  CalendarOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import React from 'react';

// ฟังก์ชันช่วย (ภายในไฟล์นี้เท่านั้น) สำหรับกรณี tooltip (ถ้าในอนาคตนำกลับมาใช้)
const wrapLabel = (label) => label; // ตอนนี้ยังไม่ต้องใช้ Tooltip จริง

// สร้างเมนูหลัก (อ้างอิงจาก Sidebar.js ปัจจุบันเป็นแหล่งจริง)
export const getMenuConfig = ({
  userData,
  canAccessInternship,
  canAccessProject,
  messages,
  navigate,
  handleLogout,
}) => {
  if (!userData?.role) {
    return [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'ออกจากระบบ',
        className: 'logout',
        onClick: handleLogout,
      },
    ];
  }

  const internshipTooltip = messages?.internship || 'คุณยังไม่มีสิทธิ์เข้าถึงระบบฝึกงาน';
  const canSeeTopicExamOverview = userData.role === 'teacher' && Boolean(userData.canAccessTopicExam);
  const isAcademicTeacher = userData.role === 'teacher' && userData.teacherType === 'academic';
  const isSupportTeacher = userData.role === 'teacher' && userData.teacherType === 'support';
  const canExportKP02 = userData.role === 'teacher' && Boolean(userData.canExportProject1) && !isSupportTeacher;
  const canApproveDocuments =
    isAcademicTeacher && userData.teacherPosition === 'หัวหน้าภาควิชา';

  const teacherPrivilegeGroup =
    userData.role === 'teacher' && (canSeeTopicExamOverview || canExportKP02)
      ? {
          key: 'teacher-privileged',
          icon: <ProjectOutlined />,
          label: 'สำหรับอาจารย์ที่มีสิทธิ์',
          children: [
            ...(canSeeTopicExamOverview
              ? [
                  {
                    key: '/teacher/topic-exam/overview',
                    icon: <ProjectOutlined />,
                    label: 'รายชื่อหัวข้อโครงงานพิเศษ',
                    onClick: () => navigate('/teacher/topic-exam/overview'),
                  },
                ]
              : []),
            ...(canExportKP02
              ? [
                  {
                    key: '/admin/project1/kp02-queue',
                    icon: <DownloadOutlined />,
                    label: 'รายชื่อสอบโครงงานพิเศษ',
                    onClick: () => navigate('/admin/project1/kp02-queue'),
                  },
                  {
                    key: '/admin/system-test/staff-queue',
                    icon: <ProjectOutlined />,
                    label: 'คำขอทดสอบระบบ',
                    onClick: () => navigate('/admin/system-test/staff-queue'),
                  },
                ]
              : []),
          ],
        }
      : null;

  const items = [
    // Dashboard
    {
      key: '/admin/dashboard', // รักษา key เดิมจาก Sidebar เพื่อไม่ให้ active state พัง
      icon: <HomeOutlined />,
      label: 'หน้าแรก',
      onClick: () => navigate('/admin/dashboard'),
    },
    // Teacher academic calendar shortcut
    ...(isAcademicTeacher
      ? [
          {
            key: '/teacher/deadlines/calendar',
            icon: <CalendarOutlined />,
            label: 'ปฏิทินกำหนดการ',
            onClick: () => navigate('/teacher/deadlines/calendar'),
          },
        ]
      : []),
    // Student menus
    ...(userData.role === 'student'
      ? [
          {
            key: `/student-profile/${userData.studentCode}`,
            icon: <TeamOutlined />,
            label: 'ประวัตินักศึกษา',
            onClick: () => navigate(`/student-profile/${userData.studentCode}`),
          },
            {
              key: '/student-deadlines/calendar',
              icon: <CalendarOutlined />,
              label: 'ปฏิทินกำหนดการ',
              onClick: () => navigate('/student-deadlines/calendar'),
            },
          {
            key: 'internship',
            icon: <FileTextOutlined />,
            label: wrapLabel('ระบบฝึกงาน', internshipTooltip),
            children: canAccessInternship
              ? [
                  { key: '/internship-companies', icon: <BarChartOutlined />, label: 'สถานประกอบการ (สถิติ)', onClick: () => navigate('/internship-companies') },
                  {
                    key: '/internship-registration',
                    label: 'ลงทะเบียนฝึกงาน',
                    icon: <FormOutlined />,
                    children: [
                      { key: '/internship-registration/flow', label: 'คำร้องขอฝึกงาน', onClick: () => navigate('/internship-registration/flow') },
                    ],
                  },
                  {
                    key: '/internship-logbook',
                    label: 'บันทึกการฝึกงาน',
                    icon: <BookOutlined />,
                    children: [
                      { key: '/internship-logbook/companyinfo', label: 'สถานประกอบการ', onClick: () => navigate('/internship-logbook/companyinfo') },
                      { key: '/internship-logbook/timesheet', label: 'ใบลงเวลาและบันทึกประจำวัน', onClick: () => navigate('/internship-logbook/timesheet') },
                    ],
                  },
                  { key: '/internship-summary', label: 'สรุปผลการฝึกงาน', icon: <FileDoneOutlined />, onClick: () => navigate('/internship-summary') },
                  { key: '/internship-certificate', label: 'ขอหนังสือรับรองการฝึกงาน', icon: <FileProtectOutlined />, onClick: () => navigate('/internship-certificate') },
                ]
              : [
                  { key: '/internship-eligibility', label: 'ตรวจสอบคุณสมบัติ', icon: <FormOutlined />, onClick: () => navigate('/internship-eligibility') },
                  { key: '/internship-requirements', label: 'ข้อกำหนดฝึกงาน', icon: <FileTextOutlined />, onClick: () => navigate('/internship-requirements') },
                ],
          },
          !canAccessProject
            ? {
                key: 'project-info',
                icon: <ProjectOutlined />,
                label: 'โครงงานพิเศษ',
                children: [
                  { key: '/project-eligibility', label: 'ตรวจสอบคุณสมบัติ', onClick: () => navigate('/project-eligibility') },
                  { key: '/project-requirements', label: 'ข้อกำหนดโครงงาน', onClick: () => navigate('/project-requirements') },
                ],
              }
            : {
                key: 'project-main',
                icon: <ProjectOutlined />,
                label: 'โครงงานพิเศษ',
                children: [
                  { key: '/project/phase1', label: 'โครงงานพิเศษ 1', onClick: () => navigate('/project/phase1') },
                  { key: '/project/phase2', label: 'โครงงานพิเศษ 2', onClick: () => navigate('/project/phase2') }
                ]
              },
        ].filter(Boolean)
      : []),
    // Teacher academic
    ...(isAcademicTeacher
      ? [
          { key: '/teacher/meeting-approvals', icon: <CalendarOutlined />, label: 'อนุมัติบันทึกการพบ', onClick: () => navigate('/teacher/meeting-approvals') },
          {
            key: '/teacher/project1/advisor-queue',
            icon: <ProjectOutlined />,
            label: 'คำขอสอบ คพ.02',
            onClick: () => navigate('/teacher/project1/advisor-queue')
          },
          {
            key: '/teacher/system-test/advisor-queue',
            icon: <ProjectOutlined />,
            label: 'คำขอทดสอบระบบ',
            onClick: () => navigate('/teacher/system-test/advisor-queue')
          },
          ...(teacherPrivilegeGroup ? [teacherPrivilegeGroup] : []),
          ...(canApproveDocuments
            ? [
                {
                  key: '/approve-documents',
                  icon: <CheckCircleOutlined />,
                  label: 'อนุมัติเอกสาร',
                  onClick: () => navigate('/approve-documents'),
                },
              ]
            : []),
        ]
      : []),
    // Teacher support
    ...(userData.role === 'teacher' && userData.teacherType === 'support'
      ? [
          ...(teacherPrivilegeGroup ? [teacherPrivilegeGroup] : []),
          {
            key: 'manage',
            icon: <TeamOutlined />,
            label: 'จัดการข้อมูล',
            children: [
              { key: '/admin/users/students', label: 'นักศึกษา', onClick: () => navigate('/admin/users/students') },
              { key: '/admin/users/teachers', label: 'อาจารย์', onClick: () => navigate('/admin/users/teachers') },
              { key: '/project-pairs', label: 'นักศึกษาโครงงานพิเศษ', onClick: () => navigate('/project-pairs') },
            ],
          },
          {
            key: 'documents',
            icon: <FileTextOutlined />,
            label: 'จัดการเอกสาร',
            children: [
              { key: '/admin/documents/internship', label: 'เอกสารฝึกงาน', onClick: () => navigate('/admin/documents/internship') },
              {
                key: '/admin/documents/project',
                label: 'เอกสารโครงงานพิเศษ',
                children: [
                  { key: '/admin/topic-exam/results', label: 'บันทึกผลสอบหัวข้อโครงงานพิเศษ', onClick: () => navigate('/admin/topic-exam/results') },
                  { key: '/admin/project1/kp02-queue', label: 'คำร้องขอสอบโครงงานพิเศษ 1 (คพ.02)', onClick: () => navigate('/admin/project1/kp02-queue') },
                  { key: '/admin/project-exam/results', label: 'บันทึกผลสอบโครงงานพิเศษ 1', onClick: () => navigate('/admin/project-exam/results') },
                  { key: '/admin/system-test/staff-queue', label: 'ตรวจสอบคำขอทดสอบระบบ (System Test)', onClick: () => navigate('/admin/system-test/staff-queue') }
                ]
              },
            ],
          },
          {
            key: 'reports',
            icon: <BarChartOutlined />,
            label: 'รายงาน',
            children: [
              { key: '/internship-companies', label: 'สถานประกอบการ', onClick: () => navigate('/internship-companies') },
              { key: '/admin/reports/support', label: 'แผงควบคุมรายงาน', onClick: () => navigate('/admin/reports/support') },
              { key: '/admin/reports/internship', label: 'รายงานระบบฝึกงาน', onClick: () => navigate('/admin/reports/internship') },
              { key: '/admin/reports/project', label: 'รายงานโครงงานพิเศษ', onClick: () => navigate('/admin/reports/project') },
            ],
          },
          { key: '/admin/upload', icon: <UploadOutlined />, label: 'อัปโหลดรายชื่อนักศึกษา', onClick: () => navigate('/admin/upload') },
          {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'ตั้งค่าระบบ',
            children: [
              { key: '/admin/settings', label: 'ภาพรวมการตั้งค่า', onClick: () => navigate('/admin/settings') },
              { key: '/admin/settings/curriculum', label: 'หลักสูตรการศึกษา', onClick: () => navigate('/admin/settings/curriculum') },
              { key: '/admin/settings/academic', label: 'ปีการศึกษา/ภาคเรียน', onClick: () => navigate('/admin/settings/academic') },
              { key: '/admin/settings/status', label: 'สถานะนักศึกษา', onClick: () => navigate('/admin/settings/status') },
              { key: '/admin/settings/notification-settings', label: 'การแจ้งเตือน', onClick: () => navigate('/admin/settings/notification-settings') },
              { key: '/admin/settings/workflow-steps', label: 'ขั้นตอนการทำงาน', onClick: () => navigate('/admin/settings/workflow-steps') },
            ],
          },
        ]
      : []),
    // Admin
    ...(userData.role === 'admin'
      ? [
          {
            key: 'manage',
            icon: <TeamOutlined />,
            label: 'จัดการข้อมูล',
            children: [
              { key: '/admin/users/students', label: 'นักศึกษา', onClick: () => navigate('/admin/users/students') },
              { key: '/admin/users/teachers', label: 'อาจารย์', onClick: () => navigate('/admin/users/teachers') },
              { key: '/project-pairs', label: 'นักศึกษาโครงงานพิเศษ', onClick: () => navigate('/project-pairs') },
            ],
          },
          {
            key: 'documents',
            icon: <FileTextOutlined />,
            label: 'จัดการเอกสาร',
            children: [
              { key: '/admin/documents/internship', label: 'เอกสารฝึกงาน', onClick: () => navigate('/admin/documents/internship') },
              {
                key: '/admin/documents/project',
                label: 'เอกสารโครงงานพิเศษ',
                children: [
                  { key: '/admin/topic-exam/results', label: 'บันทึกผลสอบหัวข้อโครงงานพิเศษ', onClick: () => navigate('/admin/topic-exam/results') },
                  { key: '/admin/project1/kp02-queue', label: 'คำร้องขอสอบโครงงานพิเศษ 1 (คพ.02)', onClick: () => navigate('/admin/project1/kp02-queue') },
                  { key: '/admin/project-exam/results', label: 'บันทึกผลสอบโครงงานพิเศษ 1', onClick: () => navigate('/admin/project-exam/results') },
                  { key: '/admin/system-test/staff-queue', label: 'ตรวจสอบคำขอทดสอบระบบ (System Test)', onClick: () => navigate('/admin/system-test/staff-queue') }
                ]
              },
            ],
          },
          {
            key: 'reports',
            icon: <BarChartOutlined />,
            label: 'รายงาน',
            children: [
              { key: '/admin/reports/support', label: 'Dashboard รวม', onClick: () => navigate('/admin/reports/support') },
              { key: '/internship-companies', label: 'บริษัทฝึกงาน (สถิติ)', onClick: () => navigate('/internship-companies') },
              { key: '/admin/reports/internship', label: 'Internship Report', onClick: () => navigate('/admin/reports/internship') },
              { key: '/admin/reports/project', label: 'Project Report', onClick: () => navigate('/admin/reports/project') },
            ],
          },
          { key: '/admin/upload', icon: <UploadOutlined />, label: 'อัปโหลดรายชื่อนักศึกษา', onClick: () => navigate('/admin/upload') },
          {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'ตั้งค่าระบบ',
            children: [
              { key: '/admin/settings', label: 'ภาพรวมการตั้งค่า', onClick: () => navigate('/admin/settings') },
              { key: '/admin/settings/curriculum', label: 'หลักสูตรการศึกษา', onClick: () => navigate('/admin/settings/curriculum') },
              { key: '/admin/settings/academic', label: 'ปีการศึกษา/ภาคเรียน', onClick: () => navigate('/admin/settings/academic') },
              { key: '/admin/settings/status', label: 'สถานะนักศึกษา', onClick: () => navigate('/admin/settings/status') },
              { key: '/admin/settings/notification-settings', label: 'การแจ้งเตือน', onClick: () => navigate('/admin/settings/notification-settings') },
              { key: '/admin/settings/workflow-steps', label: 'ขั้นตอนการทำงาน', onClick: () => navigate('/admin/settings/workflow-steps') },
            ],
          },
        ]
      : []),
    // Logout
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'ออกจากระบบ',
      className: 'logout',
      onClick: handleLogout,
    },
  ].filter(Boolean);

  return items;
};