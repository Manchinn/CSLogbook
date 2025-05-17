import React, { useState, useEffect } from 'react';
import { Layout, Button, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar';
import HeaderComponent from './HeaderComponent';
import BackgroundParticles from './BackgroundParticles';
import { Outlet } from 'react-router-dom';
import './MainLayout.css';
import './ResponsiveAdjustments.css';
import './MobileOptimizations.css';
import './GlassMorphism.css';
import './LayoutFixes.css'; // Import the new layout fixes

const { Content } = Layout;

const MainLayout = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [userRole, setUserRole] = useState('');

  // Get user role from localStorage for theme
  useEffect(() => {
    const role = localStorage.getItem('role') || '';
    setUserRole(role);
  }, []);

  // Add resize event listener to update isMobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const onClose = () => {
    setDrawerVisible(false);
  };  return (    <Layout className={`min-h-screen layout ${userRole ? `${userRole}-theme` : ''}`}
      style={{
        background: 'transparent', // เปลี่ยนเป็น transparent เพื่อให้เห็น BackgroundParticles
        position: 'relative',
      }}>
      
      {/* Add BackgroundParticles component */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 0,
        pointerEvents: 'none', // ให้คลิกผ่านทะลุไปยังองค์ประกอบด้านหลังได้
        overflow: 'hidden', 
        width: '100vw',
        height: '100vh'
      }}>
        <BackgroundParticles />
      </div>
      
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}{/* Mobile Drawer */}
      <Drawer
        placement="left"
        onClose={onClose}
        open={drawerVisible}
        width={280}
        bodyStyle={{ padding: 0 }}
        closeIcon={null} // Hide the default close icon for a cleaner look
        style={{ zIndex: 1050 }} // Higher z-index to ensure it's above other content
      >
        <div className="drawer-handle-indicator"></div>
        <Sidebar inDrawer={true} onMenuClick={onClose} />
      </Drawer>

      <Layout>
        {/* Header */}
        <HeaderComponent isMobile={isMobile} showDrawer={showDrawer} />        {/* Mobile Menu Button */}
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={showDrawer}
            className="fixed top-4 left-4 z-50 mobile-menu-button"
            size="large"
            style={{
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          />
        )}        {/* Main Content */}        <Content 
          className="p-6 responsive-content content-area" 
          style={{ 
            marginLeft: isMobile ? 0 : '200px',
            paddingTop: '80px', 
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            position: 'relative',
            zIndex: 1,
            // height: '100vh',
            // overflow: 'hidden',
            // backdropFilter: 'blur(10px)',
        }}
        >          <div className="rounded-lg shadow-sm p-6" 
               style={{ 
                 margin: isMobile ? "0.5rem" : "1rem 4rem",
                 transition: "all 0.3s ease",
/*                  backgroundColor: "rgba(255, 255, 255, 0.98)", // เพิ่มความทึบให้เหมือนใน #usages มากขึ้น
                 backdropFilter: "blur(10px)",
                 border: "1px solid rgba(0, 0, 0, 0.05)" */ // เส้นขอบบางๆ เทาอ่อนตามภาพ #usages
               }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
