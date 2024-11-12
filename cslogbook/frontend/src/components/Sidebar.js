import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Typography, message  } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  BookOutlined,
  FileTextOutlined,
  TeamOutlined,
  LogoutOutlined,
  CalendarOutlined,
  EditOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;
const { Title } = Typography;

const Sidebar = ({ loggedInStudent }) => {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const firstName = localStorage.getItem('firstName');
  const lastName = localStorage.getItem('lastName');
  const studentID = localStorage.getItem('studentID');

  // ตรวจสอบข้อมูลใน console
  console.log("Student Info from localStorage:", { firstName, lastName, studentID });

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
    console.log("Navigating to Student Profile:", studentID);
    navigate(`/student-profile/${studentID}`);
  } else {
    console.error('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
    message.error('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
    navigate('/login');
  }
};

  return (
    <Sider
      width={230}
      style={{
        backgroundColor: '#fff',
        height: '100vh',
        position: isMobile ? 'fixed' : 'relative',
        left: isMobile ? 0 : 'auto',
        top: 0,
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
      <Menu mode="inline" defaultSelectedKeys={['1']} style={{ borderRight: 0 }}>
        <Menu.Item key="dashboard" icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>
          หน้าแรก
        </Menu.Item>

        <Menu.SubMenu key="sub1" icon={<BookOutlined />} title="แผนการเรียน">
          <Menu.Item key="2" icon={<CalendarOutlined />} onClick={() => navigate('/Ptstudy')}>
            แผนการเรียนรายปี
          </Menu.Item>
          <Menu.Item key="3" icon={<EditOutlined />} onClick={() => navigate('/Ptag')}>
            แผนการเรียนแต่สาย
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu key="sub2" icon={<FileTextOutlined />} title="สมุดบันทึกฝึกงาน">
          <Menu.Item key="4" icon={<TeamOutlined />} onClick={() => navigate('/PCompanyInfo')}>
            ข้อมูลสถานประกอบการ
          </Menu.Item>
          <Menu.Item key="5" icon={<EditOutlined />}>ลงชื่อเข้างาน</Menu.Item>
        </Menu.SubMenu>

        {/* นำทางไปยังหน้าประวัตินักศึกษาพร้อม studentID */}
        <Menu.Item
          key="student-profile"
          icon={<TeamOutlined />}
          onClick={navigateToProfile}
        >
          ประวัตินักศึกษา
        </Menu.Item>

        {/* ปุ่ม Log out */}
        <Menu.Item key="7" icon={<LogoutOutlined />} onClick={() => navigate('/login')} style={{ color: 'red' }}>
          Log out
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default Sidebar;
