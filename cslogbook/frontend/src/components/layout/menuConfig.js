import {
  HomeOutlined,
  FileTextOutlined,
  TeamOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  ProjectOutlined,
  SettingOutlined,
  BookOutlined,
  UserOutlined,
  DashboardOutlined
} from '@ant-design/icons';

export const getMenuConfig = (userData, navigate, handleLogout) => [
  // Base Menu - All Roles
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'หน้าแรก',
    onClick: () => navigate('/dashboard'),
  },

  // Student Menu Items
  userData.role === 'student' && userData.isEligibleForInternship && {
    key: '/internship',
    icon: <BookOutlined />,
    label: 'ระบบฝึกงาน',
    children: [
      {
        key: '/internship/register',
        label: 'ลงทะเบียนฝึกงาน',
        onClick: () => navigate('/internship/register'),
      },
      {
        key: '/internship/documents',
        label: 'เอกสารฝึกงาน',
        onClick: () => navigate('/internship/documents'),
      },
      {
        key: '/internship/status',
        label: 'สถานะการฝึกงาน',
        onClick: () => navigate('/internship/status'),
      }
    ],
  },

  userData.role === 'student' && userData.isEligibleForProject && {
    key: '/project',
    icon: <ProjectOutlined />,
    label: 'โครงงานพิเศษ',
    children: [
      {
        key: '/project/proposal',
        label: 'เสนอหัวข้อโครงงาน',
        onClick: () => navigate('/project/proposal'),
      },
      {
        key: '/project/logbook',
        label: 'บันทึก Logbook',
        onClick: () => navigate('/project/logbook'),
      },
      {
        key: '/project/documents',
        label: 'เอกสารโครงงาน',
        onClick: () => navigate('/project/documents'),
      }
    ],
  },

  // Teacher Menu Items - Academic
  userData.role === 'teacher' && userData.teacherType === 'academic' && {
    key: '/teacher',
    icon: <TeamOutlined />,
    label: 'อาจารย์สายวิชาการ',
    children: [
      {
        key: '/teacher/review-documents',
        icon: <FileTextOutlined />,
        label: 'ตรวจสอบเอกสาร',
        onClick: () => navigate('/teacher/review-documents'),
      },
      {
        key: '/teacher/advising',
        icon: <TeamOutlined />,
        label: 'นักศึกษาในที่ปรึกษา',
        onClick: () => navigate('/teacher/advising'),
      },
      {
        key: '/teacher/project-approval',
        icon: <CheckCircleOutlined />,
        label: 'อนุมัติหัวข้อโครงงาน',
        onClick: () => navigate('/teacher/project-approval'),
      },
      {
        key: '/teacher/evaluation',
        icon: <CheckCircleOutlined />,
        label: 'ประเมินผลการฝึกงาน',
        onClick: () => navigate('/teacher/evaluation'),
      }
    ]
  },

  // Teacher Menu Items - Support (เจ้าหน้าที่ภาควิชา)
  userData.role === 'teacher' && userData.teacherType === 'support' && {
    key: '/admin',
    icon: <SettingOutlined />,
    label: 'ผู้ดูแลระบบ',
    children: [
      {
        key: '/admin/users',
        icon: <TeamOutlined />,
        label: 'จัดการผู้ใช้',
        children: [
          {
            key: '/admin/users/students',
            label: 'นักศึกษา',
            onClick: () => navigate('/admin/users/students'),
          },
          {
            key: '/admin/users/teachers',
            label: 'อาจารย์',
            onClick: () => navigate('/admin/users/teachers'),
          }
        ]
      },
      {
        key: '/admin/documents',
        icon: <FileTextOutlined />,
        label: 'จัดการเอกสาร',
        onClick: () => navigate('/admin/documents'),
      },
      {
        key: '/admin/settings',
        icon: <SettingOutlined />,
        label: 'ตั้งค่าระบบ',
        onClick: () => navigate('/admin/settings'),
      },
      {
        key: '/admin/reports',
        icon: <FileTextOutlined />,
        label: 'รายงานสถิติ',
        onClick: () => navigate('/admin/reports'),
      },
      {
        key: '/admin/announcements',
        icon: <FileTextOutlined />,
        label: 'ประกาศและแจ้งเตือน',
        onClick: () => navigate('/admin/announcements'),
      }
    ]
  },

  // Admin Menu Items
  userData.role === 'admin' && {
    key: '/admin',
    icon: <SettingOutlined />,
    label: 'ผู้ดูแลระบบ',
    children: [
      {
        key: '/admin/users',
        icon: <TeamOutlined />,
        label: 'จัดการผู้ใช้',
        children: [
          {
            key: '/admin/users/students',
            label: 'นักศึกษา',
            onClick: () => navigate('/admin/users/students'),
          },
          {
            key: '/admin/users/teachers',
            label: 'อาจารย์',
            onClick: () => navigate('/admin/users/teachers'),
          }
        ]
      },
      {
        key: '/admin/documents',
        icon: <FileTextOutlined />,
        label: 'จัดการเอกสาร',
        onClick: () => navigate('/admin/documents'),
      },
      {
        key: '/admin/settings',
        icon: <SettingOutlined />,
        label: 'ตั้งค่าระบบ',
        onClick: () => navigate('/admin/settings'),
      }
    ]
  },

  // Logout - All Roles
  {
    key: '/logout',
    icon: <LogoutOutlined />,
    label: 'ออกจากระบบ',
    onClick: handleLogout,
    className: 'logout'
  }
].filter(Boolean);