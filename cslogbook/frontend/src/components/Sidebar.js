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

const { Sider } = Layout;
const { Title } = Typography;

// Theme configuration คงเดิม
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

// แก้ไขส่วน useEffect ที่ดึงข้อมูลผู้ใช้
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

  // ถ้าเป็น student และมี token ให้ดึงข้อมูลสิทธิ์ล่าสุดจาก API
  if (storedStudentID && storedRole === 'student' && token) {
    axios.get(`http://localhost:5000/api/students/${storedStudentID}`, {
      headers: {
        'Authorization': `Bearer ${token}` // เพิ่ม token ในส่วน headers
      }
    })
      .then(response => {
        const data = response.data;
        setUserData(prev => ({
          ...prev,
          isEligibleForInternship: data.isEligibleForInternship || false,
          isEligibleForProject: data.isEligibleForProject || false,
        }));
        
        // อัพเดท localStorage ด้วยข้อมูลล่าสุด
        localStorage.setItem('isEligibleForInternship', data.isEligibleForInternship);
        localStorage.setItem('isEligibleForProject', data.isEligibleForProject);
      })
      .catch(error => {
        console.error('Error fetching user permissions:', error);
        if (error.response?.status === 401) {
          message.error('กรุณาเข้าสู่ระบบใหม่');
          localStorage.clear(); // ล้าง localStorage เมื่อ token หมดอายุ
          navigate('/login');
        } else {
          message.error('ไม่สามารถดึงข้อมูลสิทธิ์ได้');
        }
      });
  }
}, [navigate]); // เพิ่ม navigate เป็น dependency

  // Mobile responsive handler คงเดิม
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

  // Custom styles คงเดิม...
  const theme = themeConfig[userData.role] || themeConfig.student;
  const siderStyle = {
    backgroundColor: '#fff',
    height: '100vh',
    position: 'fixed',
    left: isMobile ? 0 : 'auto',
    top: 0,
    zIndex: 1000,
    overflow: 'auto',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    borderRight: '1px solid #f0f0f0',
    width: '230px'
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
    if (userData.studentID) {
      navigate(`/student-profile/${userData.studentID}`);
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

      <Menu
        mode="inline"
        defaultSelectedKeys={['dashboard']}
        style={menuStyle}
      >
        <Menu.Item key="dashboard" icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>
          หน้าแรก
        </Menu.Item>

        {userData.role === 'student' && (
          <>
            {userData.isEligibleForInternship && (
              <Menu.SubMenu key="internship" icon={<FileTextOutlined />} title="ระบบฝึกงาน">
                <Menu.Item key="company-info" icon={<TeamOutlined />} onClick={() =>  navigate('/internship-terms')}>
                  ลงทะเบียนฝึกงาน
                </Menu.Item>
                <Menu.Item key="internship-documents" icon={<UploadOutlined />} onClick={() => navigate('/internship-documents')}>
                  เอกสารฝึกงาน
                </Menu.Item>
                {/* <Menu.Item key="daily-log" icon={<EditOutlined />} onClick={() => navigate('/internship/log')}>
                  บันทึกประจำวัน
                </Menu.Item>*/}
              </Menu.SubMenu>
            )}

            {userData.isEligibleForProject && (
              <Menu.SubMenu key="project" icon={<ProjectOutlined />} title="โครงงานพิเศษ">
                <Menu.Item key="project-status" icon={<TeamOutlined />} onClick={() => navigate('/project-proposal')}>
                  ฟอร์มเสนอหัวข้อ
                </Menu.Item>
                <Menu.Item key="project-logbook" icon={<FileTextOutlined />} onClick={() => navigate('/project-logbook')}>
                  บันทึก Logbook
                </Menu.Item>
              </Menu.SubMenu>
            )}
            
            <Menu.Item key="student-profile" icon={<TeamOutlined />} onClick={navigateToProfile}>
              ประวัตินักศึกษา
            </Menu.Item>
          </>
        )}

        {/* ส่วนเมนูของ teacher และ admin คงเดิม */}
        {userData.role === 'teacher' && (
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

        {userData.role === 'admin' && (
          <>
            <Menu.SubMenu key="students-submenu" icon={<TeamOutlined />} title="จัดการข้อมูลนักศึกษา">
              <Menu.Item key="student-list" onClick={() => navigate('/students')}>
                รายชื่อนักศึกษา
              </Menu.Item>
            </Menu.SubMenu>
            <Menu.SubMenu key="document-management" icon={<FileTextOutlined />} title="จัดการเอกสาร">
              <Menu.Item key="internship-documents" onClick={() => navigate('/document-management/internship')}>
                เอกสารฝึกงาน
              </Menu.Item>
              <Menu.Item key="project-documents" onClick={() => navigate('/document-management/project')}>
                เอกสารโครงงานพิเศษ
              </Menu.Item>
            </Menu.SubMenu>
            <Menu.Item key="upload-csv" icon={<UploadOutlined />} onClick={() => navigate('/admin/upload')}>
              อัปโหลดรายชื่อนักศึกษา
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