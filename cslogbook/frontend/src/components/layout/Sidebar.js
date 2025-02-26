import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Typography, Badge, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    studentID: '',
    role: '',
    isEligibleForInternship: false,
    isEligibleForProject: false
  });
  
  const [projectPairs, setProjectPairs] = useState([]);

  useEffect(() => {
    const storedStudentID = localStorage.getItem('studentID');
    const storedRole = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    
    setUserData({
      firstName: localStorage.getItem('firstName') || '',
      lastName: localStorage.getItem('lastName') || '',
      studentID: storedStudentID || '',
      role: storedRole || '',
      isEligibleForInternship: localStorage.getItem('isEligibleForInternship') === 'true',
      isEligibleForProject: localStorage.getItem('isEligibleForProject') === 'true'
    });

    if (storedStudentID && storedRole === 'student' && token) {
      axios.get(`http://localhost:5000/api/students/${storedStudentID}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => {
          const data = response.data;
          setUserData(prev => ({
            ...prev,
            isEligibleForInternship: data.isEligibleForInternship || false,
            isEligibleForProject: data.isEligibleForProject || false,
          }));
          
          localStorage.setItem('isEligibleForInternship', data.isEligibleForInternship);
          localStorage.setItem('isEligibleForProject', data.isEligibleForProject);
        })
        .catch(error => {
          console.error('Error fetching user permissions:', error);
          if (error.response?.status === 401) {
            message.error('กรุณาเข้าสู่ระบบใหม่');
            localStorage.clear();
            navigate('/login');
          } else {
            message.error('ไม่สามารถดึงข้อมูลสิทธิ์ได้');
          }
        });
    }
  }, [navigate]);

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

  const theme = themeConfig[userData.role] || themeConfig.student;
  document.documentElement.style.setProperty('--menu-hover', theme.menuHover);
  document.documentElement.style.setProperty('--active-color', theme.activeColor);

  const navigateToProfile = () => {
    if (userData.studentID) {
      navigate(`/student-profile/${userData.studentID}`);
    } else {
      message.error('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      navigate('/login');
    }
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: 'หน้าแรก',
      onClick: () => navigate('/dashboard'),
    },
    userData.role === 'student' && userData.isEligibleForInternship && {
      key: 'internship',
      icon: <FileTextOutlined />,
      label: 'ระบบฝึกงาน',
      children: [
        {
          key: 'company-info',
          icon: <TeamOutlined />,
          label: 'ลงทะเบียนฝึกงาน',
          onClick: () => navigate('/internship-terms'),
        }
      ],
    },
    userData.role === 'student' && userData.isEligibleForProject && {
      key: 'project',
      icon: <ProjectOutlined />,
      label: 'โครงงานพิเศษ',
      children: [
        {
          key: 'project-status',
          icon: <TeamOutlined />,
          label: 'ฟอร์มเสนอหัวข้อ',
          onClick: () => navigate('/project-proposal'),
        },
        {
          key: 'project-logbook',
          icon: <FileTextOutlined />,
          label: 'บันทึก Logbook',
          onClick: () => navigate('/project-logbook'),
        },
      ],
    },
    userData.role === 'student' && {
      key: 'student-profile',
      icon: <TeamOutlined />,
      label: 'ประวัตินักศึกษา',
      onClick: navigateToProfile,
    },
    userData.role === 'teacher' && {
      key: 'review-documents',
      icon: <FileTextOutlined />,
      label: 'ตรวจสอบเอกสารโครงงาน',
      onClick: () => navigate('/review-documents'),
    },
    userData.role === 'teacher' && {
      key: 'advise-project',
      icon: <ProjectOutlined />,
      label: 'ให้คำแนะนำโครงงาน',
      onClick: () => navigate('/advise-project'),
    },
    userData.role === 'teacher' && {
      key: 'approve-documents',
      icon: <CheckCircleOutlined />,
      label: 'อนุมัติเอกสาร',
      onClick: () => navigate('/approve-documents'),
    },
    userData.role === 'admin' && {
      key: 'students-submenu',
      icon: <TeamOutlined />,
      label: 'จัดการข้อมูล',
      children: [
        {
          key: 'student-list',
          label: 'นักศึกษา',
          onClick: () => navigate('/students'),
        },
        {
          key: 'teacher-list',
          label: 'อาจารย์',
          onClick: () => navigate('/teachers'),
        },
        {
          key: 'project-pairs',
          label: 'คู่โปรเจค',
          /* children: projectPairs.map(pair => ({
            key: pair.id,
            label: `${pair.student1Name} & ${pair.student2Name}`,
            onClick: () => navigate(`/project-pairs/${pair.id}`),
          })), */
          onClick: () => navigate('/project-pairs'),
        },
      ],
    },
    userData.role === 'admin' && {
      key: 'document-management',
      icon: <FileTextOutlined />,
      label: 'จัดการเอกสาร',
      children: [
        {
          key: 'internship-documents',
          label: 'เอกสารฝึกงาน',
          onClick: () => navigate('/document-management/internship'),
        },
        {
          key: 'project-documents',
          label: 'เอกสารโครงงานพิเศษ',
          onClick: () => navigate('/document-management/project'),
        },
      ],
    },
    userData.role === 'admin' && {
      key: 'upload-csv',
      icon: <UploadOutlined />,
      label: 'อัปโหลดรายชื่อนักศึกษา',
      onClick: () => navigate('/admin/upload'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'ออกจากระบบ',
      onClick: handleLogout,
      className: 'logout',
    },
  ].filter(Boolean);

  return (
    <Sider width={230} className="sider">
      <div className="profile">
        <Avatar
          size={64}
          style={{
            backgroundColor: theme.primary,
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
          count={userData.role === 'admin' ? 'ผู้ดูแลระบบ' : userData.role === 'teacher' ? 'อาจารย์' : userData.role === 'student' ? 'นักศึกษา' : 'ผู้ใช้งาน'}
          style={{
            backgroundColor: theme.primary,
            fontSize: '12px',
          }}
        />
      </div>

      <Menu mode="inline" items={menuItems} defaultSelectedKeys={['dashboard']} className="menu" />
    </Sider>
  );
};

export default Sidebar;