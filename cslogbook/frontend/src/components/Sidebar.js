import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Typography } from 'antd';
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

const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();  // ใช้งาน useNavigate

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); 
    };

    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ฟังก์ชันนำทาง
  const navigateTo = (path) => {
    navigate(path);
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
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Avatar size={80} src="https://via.placeholder.com/80" />
        <Title level={4} style={{ marginTop: 10 }}>Chinnakrit Sripan</Title>
      </div>
      <Menu mode="inline" defaultSelectedKeys={['1']} style={{ borderRight: 0 }}>
        <Menu.Item icon={<HomeOutlined />} onClick={() => navigateTo('/Home')}>
          หน้าแรก
        </Menu.Item>
        
        <Menu.SubMenu key="sub1" icon={<BookOutlined />} title="แผนการเรียน">
          <Menu.Item key="2" icon={<CalendarOutlined />} onClick={() => navigateTo('/Ptstudy')}>
            แผนการเรียนรายปี
          </Menu.Item>
          <Menu.Item key="3" icon={<EditOutlined />} onClick={() => navigateTo('/Ptag')}>
            แผนการเรียนแต่สาย
          </Menu.Item>
        </Menu.SubMenu>
        
        <Menu.SubMenu key="sub2" icon={<FileTextOutlined />} title="สมุดบันทึกฝึกงาน">
          <Menu.Item key="4" icon={<TeamOutlined />} onClick={() => navigateTo('/PCompanyInfo')}>
            ข้อมูลสถานประกอบการ
          </Menu.Item>
          <Menu.Item key="5" icon={<EditOutlined />}>ลงชื่อเข้างาน</Menu.Item>
        </Menu.SubMenu>
        
        <Menu.Item key="6" icon={<TeamOutlined />}>
          ประวัตินักศึกษา
        </Menu.Item>
        
        <Menu.Item key="7" icon={<LogoutOutlined />} style={{ color: 'red' }}>
          Log out
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default Sidebar;
