import React, { useState, useEffect } from 'react';
import { Layout, Button, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar';
import HeaderComponent from './HeaderComponent';
import { Outlet } from 'react-router-dom';
import './MainLayout.css';
import './ResponsiveAdjustments.css';
import './MobileOptimizations.css';

const { Content } = Layout;

const MainLayout = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}      {/* Mobile Drawer */}
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
        )}        {/* Main Content */}
        <Content 
          className="p-6 bg-gray-50 responsive-content" 
          style={{ 
            marginLeft: isMobile ? 0 : '200px',
            paddingTop: '80px', 
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'margin-left 0.3s ease',
            // height: '100vh',
            // overflow: 'hidden',
            // backdropFilter: 'blur(10px)',
            // zIndex: 0,
        }}
        > 
          <div className="bg-white rounded-lg shadow-sm p-6" 
               style={{ 
                 margin: isMobile ? "0.5rem" : "1rem 4rem",
                 transition: "all 0.3s ease"
               }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
