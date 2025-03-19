import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Menu, Avatar, Typography, Badge } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentPermissions } from '../../hooks/useStudentPermissions';
import {
  HomeOutlined,
  FileTextOutlined,
  TeamOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import './Sidebar.css';

const { Sider } = Layout;
const { Title } = Typography;

const themeConfig = {
  student: 'student-theme',
  teacher: 'teacher-theme',
  admin: 'admin-theme',
};

const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, logout } = useAuth();
  const { canAccessInternship, canAccessProject, messages } = useStudentPermissions(userData);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = useMemo(() => [
    // Dashboard - Common for all roles
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: 'หน้าแรก',
    },

    // Student Menu Items
    ...(userData.role === 'student' ? [
      {
        key: `/student-profile/${userData.studentCode}`,
        icon: <TeamOutlined />,
        label: 'ประวัตินักศึกษา',
      },
      {
        key: 'internship',
        icon: <FileTextOutlined />,
        label: 'ระบบฝึกงาน',
        disabled: !canAccessInternship,
        title: messages.internship,
        children: canAccessInternship ? [
          {
            key: '/internship-terms',
            label: 'ลงทะเบียนฝึกงาน',
          },
          {
            key: '/internship-company',
            label: 'ข้อมูลบริษัท',
          },
          {
            key: '/internship-documents',
            label: 'เอกสาร',
          }
        ] : []
      },
      {
        key: 'project',
        icon: <ProjectOutlined />,
        label: 'โครงงานพิเศษ',
        disabled: !canAccessProject,
        title: messages.project,
        children: canAccessProject ? [
          {
            key: '/project-proposal',
            label: 'ฟอร์มเสนอหัวข้อ',
          },
          {
            key: '/project-logbook',
            label: 'บันทึก Logbook',
          }
        ] : []
      },
      {
        key: '/status-check',
        icon: <FileTextOutlined />,
        label: 'ตรวจสอบสถานะ',
      }
    ].filter(Boolean) : []),

    // Teacher Menu Items
    ...(userData.role === 'teacher' ? [
      {
        key: '/review-documents',
        icon: <FileTextOutlined />,
        label: 'ตรวจสอบเอกสารโครงงาน',
      },
      {
        key: '/advise-project',
        icon: <ProjectOutlined />,
        label: 'ให้คำแนะนำโครงงาน',
      },
      {
        key: '/approve-documents',
        icon: <CheckCircleOutlined />,
        label: 'อนุมัติเอกสาร',
      }
    ] : []),

    // Admin Menu Items
    ...(userData.role === 'admin' ? [
      {
        key: 'manage',
        icon: <TeamOutlined />,
        label: 'จัดการข้อมูล',
        children: [
          {
            key: '/students',
            label: 'นักศึกษา',
          },
          {
            key: '/teachers',
            label: 'อาจารย์',
          },
          {
            key: '/project-pairs',
            label: 'คู่โปรเจค',
          }
        ]
      },
      {
        key: 'documents',
        icon: <FileTextOutlined />,
        label: 'จัดการเอกสาร',
        children: [
          {
            key: '/document-management/internship',
            label: 'เอกสารฝึกงาน',
          },
          {
            key: '/document-management/project',
            label: 'เอกสารโครงงานพิเศษ',
          }
        ]
      },
      {
        key: '/admin/upload',
        icon: <UploadOutlined />,
        label: 'อัปโหลดรายชื่อนักศึกษา',
      }
    ] : []),

    // Logout - Common for all roles
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'ออกจากระบบ',
      className: 'logout',
    }
  ].filter(Boolean), [userData, canAccessInternship, canAccessProject, messages]);

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout();
    } else {
      navigate(key);
    }
  };

  return (
    <Sider 
      width={230} 
      className={`sider ${themeConfig[userData.role]}`}
      breakpoint="lg"
      collapsedWidth={isMobile ? 0 : 80}
    >
      <div className="profile">
        <Avatar
          size={64}
          style={{
            backgroundColor: 'var(--active-color)',
            marginBottom: 12,
            fontSize: '24px',
          }}
        >
          {userData.firstName?.charAt(0)?.toUpperCase()}
        </Avatar>
        <Title level={5} style={{ margin: '8px 0 4px' }}>
          {userData.firstName} {userData.lastName}
        </Title>
        <Badge
          count={
            userData.role === 'admin' ? 'ผู้ดูแลระบบ' : 
            userData.role === 'teacher' ? 'อาจารย์' : 
            'นักศึกษา'
          }
          style={{
            backgroundColor: 'var(--active-color)',
            fontSize: '12px',
          }}
        />
      </div>

      <Menu 
        mode="inline" 
        items={menuItems} 
        selectedKeys={[location.pathname]}
        defaultSelectedKeys={[location.pathname]}
        className={`menu ${themeConfig[userData.role]}`}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default React.memo(Sidebar);