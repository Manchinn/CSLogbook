import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Typography, Badge, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  BookOutlined,
  FileTextOutlined,
  TeamOutlined,
  LogoutOutlined,
  EditOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  ProjectOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;
const { Title } = Typography;

// Theme configuration
const themeConfig = {
  student: {
    primary: '#1890ff',
    menuHover: '#e6f7ff',
    activeColor: '#1890ff',
  },
  teacher: {
    primary: '#faad14',
    menuHover: '#fff7e6',
    activeColor: '#faad14',
  },
  admin: {
    primary: '#f5222d',
    menuHover: '#fff1f0',
    activeColor: '#f5222d',
  },
};

const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  // Get user info and permissions
  const firstName = localStorage.getItem('firstName');
  const lastName = localStorage.getItem('lastName');
  const studentID = localStorage.getItem('studentID');
  const role = localStorage.getItem('role');
  const isEligibleForInternship = localStorage.getItem('isEligibleForInternship') === 'true';
  const isEligibleForProject = localStorage.getItem('isEligibleForProject') === 'true';

  const theme = themeConfig[role] || themeConfig.student;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Custom styles
  const siderStyle = {
    backgroundColor: '#fff',
    height: '100vh',
    position: isMobile ? 'fixed' : 'relative',
    left: isMobile ? 0 : 'auto',
    top: 0,
    zIndex: 1000,
    overflow: 'auto',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    borderRight: '1px solid #f0f0f0',
  };

  const profileStyle = {
    padding: '24px',
    textAlign: 'center',
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: '#fff',
  };

  const menuStyle = {
    '.ant-menu-item': {
      margin: '4px 8px !important',
      borderRadius: '6px',
      '&:hover': {
        backgroundColor: `${theme.menuHover} !important`,
        color: `${theme.activeColor} !important`,
      },
    },
    '.ant-menu-item-selected': {
      backgroundColor: `${theme.menuHover} !important`,
      color: `${theme.activeColor} !important`,
      borderRadius: '6px',
      '&::after': {
        display: 'none',
      },
    },
    '.ant-menu-submenu-title': {
      margin: '4px 8px !important',
      borderRadius: '6px',
      '&:hover': {
        backgroundColor: `${theme.menuHover} !important`,
        color: `${theme.activeColor} !important`,
      },
    },
    '.ant-menu-sub': {
      backgroundColor: 'transparent !important',
    },
  };

  const navigateToProfile = () => {
    if (studentID) {
      navigate(`/student-profile/${studentID}`);
    } else {
      message.error('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      navigate('/login');
    }
  };

  return (
    <Sider width={230} style={siderStyle}>
      <div style={profileStyle}>
        <Avatar
          size={64}
          style={{
            backgroundColor: theme.primary,
            marginBottom: 12,
            fontSize: '24px',
          }}
        >
          {firstName?.charAt(0)?.toUpperCase()}
        </Avatar>
        <Title level={5} style={{ margin: '8px 0 4px' }}>
          {firstName} {lastName}
        </Title>
        <Badge
          count={role === 'admin' ? 'ผู้ดูแลระบบ' : role === 'teacher' ? 'อาจารย์' : role === 'student' ? 'นักศึกษา' : 'ผู้ใช้งาน'}
          style={{
            backgroundColor: theme.primary,
            fontSize: '12px',
          }}
        />
      </div>

      <Menu
        mode="inline"
        defaultSelectedKeys={['dashboard']}
        style={menuStyle}
      >
        <Menu.Item key="dashboard" icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>
          หน้าแรก
        </Menu.Item>

        {role === 'student' && (
          <>
            {isEligibleForInternship && (
              <Menu.SubMenu key="internship" icon={<FileTextOutlined />} title="สมุดบันทึกฝึกงาน">
                <Menu.Item key="internship-status" icon={<CheckCircleOutlined />} onClick={() => navigate('/internship-status')}>
                  ดูสถานะฝึกงาน
                </Menu.Item>
                <Menu.Item key="company-info" icon={<TeamOutlined />} onClick={() => navigate('/PCompanyInfo')}>
                  ข้อมูลสถานประกอบการ
                </Menu.Item>
                <Menu.Item key="attendance" icon={<EditOutlined />}>
                  ลงชื่อเข้างาน
                </Menu.Item>
              </Menu.SubMenu>
            )}

            {isEligibleForProject && (
              <Menu.SubMenu key="project" icon={<ProjectOutlined />} title="โปรเจค">
                <Menu.Item key="project-status" icon={<CheckCircleOutlined />} onClick={() => navigate('/project-status')}>
                  ดูสถานะโครงงาน
                </Menu.Item>
                <Menu.Item key="upload-documents" icon={<UploadOutlined />} onClick={() => navigate('/document-upload')}>
                  อัปโหลดเอกสาร
                </Menu.Item>
              </Menu.SubMenu>
            )}

            <Menu.Item key="student-profile" icon={<TeamOutlined />} onClick={navigateToProfile}>
              ประวัตินักศึกษา
            </Menu.Item>
          </>
        )}

        {role === 'teacher' && (
          <>
            <Menu.Item key="review-documents" icon={<FileTextOutlined />} onClick={() => navigate('/review-documents')}>
              ตรวจสอบเอกสารโครงงาน
            </Menu.Item>
            <Menu.Item key="advise-project" icon={<ProjectOutlined />} onClick={() => navigate('/advise-project')}>
              ให้คำแนะนำโครงงาน
            </Menu.Item>
            <Menu.Item key="approve-documents" icon={<CheckCircleOutlined />} onClick={() => navigate('/approve-documents')}>
              อนุมัติเอกสาร
            </Menu.Item>
          </>
        )}

        {role === 'admin' && (
          <>
            <Menu.Item key="manage-students" icon={<TeamOutlined />} onClick={() => navigate('/manage-students')}>
              จัดการข้อมูลนักศึกษา
            </Menu.Item>
            <Menu.Item key="update-courses" icon={<BookOutlined />} onClick={() => navigate('/update-courses')}>
              อัปเดตรายวิชา
            </Menu.Item>
            <Menu.Item key="assign-rights" icon={<CheckCircleOutlined />} onClick={() => navigate('/assign-rights')}>
              กำหนดสิทธิ์ฝึกงาน/โครงงาน
            </Menu.Item>
            <Menu.Item key="upload-csv" icon={<UploadOutlined />} onClick={() => navigate('/admin/upload')}>
              Upload Student CSV
            </Menu.Item>
            <Menu.Item key="student-list" icon={<TeamOutlined />} onClick={() => navigate('/students')}>
              รายชื่อนักศึกษา
            </Menu.Item>
          </>
        )}

        <Menu.Item 
          key="logout" 
          icon={<LogoutOutlined />} 
          onClick={handleLogout}
          style={{ 
            marginTop: 20,
            color: '#ff4d4f',
            '&:hover': {
              color: '#ff7875',
              backgroundColor: '#fff1f0',
            },
          }}
        >
          ออกจากระบบ
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default Sidebar;