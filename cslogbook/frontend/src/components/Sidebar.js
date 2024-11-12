import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  BookOutlined,
  FileTextOutlined,
  TeamOutlined,
  LogoutOutlined,
  CalendarOutlined,
  EditOutlined,
  FolderOpenOutlined,
  CheckCircleOutlined,
  UploadOutlined
} from '@ant-design/icons';

const { Sider } = Layout;
const { Title } = Typography;

const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const firstName = localStorage.getItem('firstName');
  const lastName = localStorage.getItem('lastName');
  const studentID = localStorage.getItem('studentID');
  const role = localStorage.getItem('role');

  // ตรวจสอบการเปลี่ยนขนาดหน้าจอ
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ฟังก์ชันนำทางไปยังหน้าโปรไฟล์นักศึกษา
  const navigateToProfile = () => {
    if (studentID) {
      navigate(`/student-profile/${studentID}`);
    } else {
      message.error('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      navigate('/login');
    }
  };

  // ฟังก์ชัน Log out
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <Sider
      width={230}
      style={{
        backgroundColor: '#fff',
        height: '100vh',
        position: isMobile ? 'fixed' : 'relative',
        zIndex: 1000,
        overflow: 'auto',
      }}
    >
      {/* ส่วนของ Avatar และชื่อผู้ใช้ */}
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Avatar size={80} src="https://via.placeholder.com/80" />
        <Title level={4} style={{ marginTop: 10 }}>
          {firstName ? `${firstName} ${lastName}` : 'Guest'}
        </Title>
      </div>

      {/* เมนูการนำทาง */}
      <Menu mode="inline" defaultSelectedKeys={['dashboard']} style={{ borderRight: 0 }}>
        <Menu.Item key="dashboard" icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>
          หน้าแรก
        </Menu.Item>

        {/* เมนูเพิ่มเติมตาม Role */}
        {role === 'student' && (
          <>
            <Menu.Item key="internship-status" icon={<CheckCircleOutlined />} onClick={() => navigate('/internship-status')}>
              ดูสถานะฝึกงาน
            </Menu.Item>
            <Menu.Item key="project-status" icon={<CheckCircleOutlined />} onClick={() => navigate('/project-status')}>
              ดูสถานะโครงงาน
            </Menu.Item>
            <Menu.Item key="upload-documents" icon={<UploadOutlined />} onClick={() => navigate('/document-upload')}>
              อัปโหลดเอกสาร
            </Menu.Item>
          </>
        )}

        {role === 'teacher' && (
          <>
            <Menu.Item key="review-documents" icon={<FolderOpenOutlined />} onClick={() => navigate('/review-documents')}>
              ตรวจสอบเอกสารโครงงาน
            </Menu.Item>
            <Menu.Item key="advise-projects" icon={<EditOutlined />} onClick={() => navigate('/advise-projects')}>
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
            <Menu.Item key="update-courses" icon={<CalendarOutlined />} onClick={() => navigate('/update-courses')}>
              อัปเดตรายวิชา
            </Menu.Item>
            <Menu.Item key="set-permissions" icon={<EditOutlined />} onClick={() => navigate('/set-permissions')}>
              กำหนดสิทธิ์ฝึกงาน/โครงงาน
            </Menu.Item>
          </>
        )}

        <Menu.Item key="student-profile" icon={<TeamOutlined />} onClick={navigateToProfile}>
          ประวัตินักศึกษา
        </Menu.Item>

        {/* ปุ่ม Log out */}
        <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout} style={{ color: 'red' }}>
          Log out
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default Sidebar;
