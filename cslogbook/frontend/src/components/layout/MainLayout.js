import React, { useState } from 'react';
import { Layout, Drawer, Grid } from 'antd';
import Sidebar from './Sidebar';
import HeaderComponent from './HeaderComponent';
import { Outlet } from 'react-router-dom';
import './MainLayout.css';

const { Content } = Layout;
const { useBreakpoint } = Grid;

const MainLayout = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const showDrawer = () => {
    setDrawerVisible(true);
    console.log("เปิด main");
  };

  const onClose = () => {
    setDrawerVisible(false);
    console.log("ปิด main");
  };

  return (
    <Layout style={{ minHeight: '100vh', overflow: 'hidden' }}>
      {!isMobile && <Sidebar />}

      {isMobile && (
        <Drawer
          placement="left"
          onClose={onClose}
          open={drawerVisible}
          width={0}
          bodyStyle={{ padding: 0 }}
          closable={false}
          style={{ zIndex: 12 }} // เพิ่ม zIndex
        >
          {/* ส่ง onClose ไปยัง Sidebar */}
          <Sidebar isMobile={isMobile} drawerVisible={drawerVisible} onClose={onClose} />
        </Drawer>
      )}

      <Layout>
        <HeaderComponent isMobile={isMobile} showDrawer={showDrawer} />
        <Content
          style={{
            marginLeft: isMobile ? 0 : 230, // ในโหมดมือถือ marginLeft เป็น 0
            transition: 'margin-left 0.2s',
            // backgroundColor: '#A7A7A7A7',
            marginTop: '64px', // ปรับให้ตรงกับความสูงของส่วนหัวที่คงที่
            padding: '24px',
            overflowY: 'auto', // ทำให้เนื้อหาสามารถเลื่อนขึ้นลงได้
            height: 'calc(100vh - 64px)', // ปรับความสูงให้ตรงกับส่วนหัวที่คงที่
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;