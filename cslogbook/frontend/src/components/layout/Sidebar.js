import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout, Menu, Avatar, Typography, Badge, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { calculateStudentYear, isEligibleForProject, isEligibleForInternship } from '../utils/studentUtils';


const { Sider } = Layout;
const { Title } = Typography;

// Theme configuration
const themeConfig = {
  student: 'student-theme',
  teacher: 'teacher-theme',
  admin: 'admin-theme',
};

const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(() => ({
    firstName: localStorage.getItem('firstName') || '',
    lastName: localStorage.getItem('lastName') || '',
    studentID: localStorage.getItem('studentID') || '',
    role: localStorage.getItem('role') || '',
    isEligibleForInternship: localStorage.getItem('isEligibleForInternship') === 'true',
    isEligibleForProject: localStorage.getItem('isEligibleForProject') === 'true'
  }));

  // Effect สำหรับ fetch permissions ครั้งเดียวตอน mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (userData.studentID && userData.role === 'student') {
      const controller = new AbortController();

      const fetchPermissions = async () => {
        try {
          const response = await axios.get(
            `http://localhost:5000/api/students/${userData.studentID}`,
            {
              headers: { 'Authorization': `Bearer ${token}` },
              signal: controller.signal
            }
          );

          const data = response.data;
          const studentYear = calculateStudentYear(data.studentID);
          const projectEligibility = isEligibleForProject(
            studentYear, 
            data.totalCredits, 
            data.majorCredits
          );
          const internshipEligibility = isEligibleForInternship(
            studentYear, 
            data.totalCredits
          );

          // Update state และ localStorage พร้อมกัน
          const newPermissions = {
            isEligibleForInternship: internshipEligibility.eligible,
            isEligibleForProject: projectEligibility.eligible
          };

          setUserData(prev => ({
            ...prev,
            ...newPermissions
          }));

          // Update localStorage
          Object.entries(newPermissions).forEach(([key, value]) => {
            localStorage.setItem(key, String(value));
          });

        } catch (error) {
          if (!axios.isCancel(error) && error.response?.status === 401) {
            message.error('กรุณาเข้าสู่ระบบใหม่');
            localStorage.clear();
            navigate('/login');
          }
        }
      };

      fetchPermissions();
      return () => controller.abort();
    }
  }, []); // Run only once on mount

  // Effect สำหรับ window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    navigate('/login');
  }, [navigate]);

  const themeClass = themeConfig[userData.role] || themeConfig.student;

  const navigateToProfile = useCallback(() => {
    if (userData.studentID) {
      navigate(`/student-profile/${userData.studentID}`);
    } else {
      message.error('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      navigate('/login');
    }
  }, [navigate, userData.studentID]);

  const menuItems = useMemo(() => [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: 'หน้าแรก',
      onClick: () => navigate('/dashboard'),
    },
    userData.role === 'student' && userData.isEligibleForInternship && {
      key: '/internship',
      icon: <FileTextOutlined />,
      label: 'ระบบฝึกงาน',
      children: [
        {
          key: '/internship-terms',
          icon: <TeamOutlined />,
          label: 'ลงทะเบียนฝึกงาน',
          onClick: () => navigate('/internship-terms'),
        }
      ],
    },
    userData.role === 'student' && userData.isEligibleForProject && {
      key: '/project',
      icon: <ProjectOutlined />,
      label: 'โครงงานพิเศษ',
      children: [
        {
          key: '/project-proposal',
          icon: <TeamOutlined />,
          label: 'ฟอร์มเสนอหัวข้อ',
          onClick: () => navigate('/project-proposal'),
        },
        {
          key: '/project-logbook',
          icon: <FileTextOutlined />,
          label: 'บันทึก Logbook',
          onClick: () => navigate('/project-logbook'),
        },
      ],
    },
    userData.role === 'student' && {
      key: '/status-check',
      icon: <FileTextOutlined />,
      label: 'ตรวจสอบสถานะ',
      onClick: () => navigate('/status-check'),
    },
    userData.role === 'student' && {
      key: `/student-profile/${userData.studentID}`,
      icon: <TeamOutlined />,
      label: 'ประวัตินักศึกษา',
      onClick: navigateToProfile,
    },
    userData.role === 'teacher' && {
      key: '/review-documents',
      icon: <FileTextOutlined />,
      label: 'ตรวจสอบเอกสารโครงงาน',
      onClick: () => navigate('/review-documents'),
    },
    userData.role === 'teacher' && {
      key: '/advise-project',
      icon: <ProjectOutlined />,
      label: 'ให้คำแนะนำโครงงาน',
      onClick: () => navigate('/advise-project'),
    },
    userData.role === 'teacher' && {
      key: '/approve-documents',
      icon: <CheckCircleOutlined />,
      label: 'อนุมัติเอกสาร',
      onClick: () => navigate('/approve-documents'),
    },
    userData.role === 'admin' && {
      key: '/students-submenu',
      icon: <TeamOutlined />,
      label: 'จัดการข้อมูล',
      children: [
        {
          key: '/students',
          label: 'นักศึกษา',
          onClick: () => navigate('/students'),
        },
        {
          key: '/teachers',
          label: 'อาจารย์',
          onClick: () => navigate('/teachers'),
        },
        {
          key: '/project-pairs',
          label: 'คู่โปรเจค',
          onClick: () => navigate('/project-pairs'),
        },
      ],
    },
    userData.role === 'admin' && {
      key: '/document-management',
      icon: <FileTextOutlined />,
      label: 'จัดการเอกสาร',
      children: [
        {
          key: '/document-management/internship',
          label: 'เอกสารฝึกงาน',
          onClick: () => navigate('/document-management/internship'),
        },
        {
          key: '/document-management/project',
          label: 'เอกสารโครงงานพิเศษ',
          onClick: () => navigate('/document-management/project'),
        },
      ],
    },
    userData.role === 'admin' && {
      key: '/admin/upload',
      icon: <UploadOutlined />,
      label: 'อัปโหลดรายชื่อนักศึกษา',
      onClick: () => navigate('/admin/upload'),
    },
    {
      key: '/logout',
      icon: <LogoutOutlined />,
      label: 'ออกจากระบบ',
      onClick: handleLogout,
      className: 'logout',
    },
  ], [
    navigate,
    userData.role,
    userData.isEligibleForInternship,
    userData.isEligibleForProject,
    userData.studentID,
    handleLogout,
    navigateToProfile
  ]); // ระบุ dependencies ที่จำเป็นจริงๆ เท่านั้น

  return (
    <Sider width={230} className={`sider ${themeClass}`}>
      <div className="profile">
        <Avatar
          size={64}
          style={{
            backgroundColor: `var(--active-color)`,
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
            backgroundColor: `var(--active-color)`,
            fontSize: '12px',
          }}
        />
      </div>

      <Menu 
        mode="inline" 
        items={menuItems} 
        selectedKeys={[location.pathname]}
        defaultSelectedKeys={[location.pathname]}
        className="menu" 
      />
    </Sider>
  );
};

export default React.memo(Sidebar);