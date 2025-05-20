import React, { useState, useEffect } from 'react';
import { Layout, Button, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar/Sidebar'; // Updated path
import HeaderComponent from './Header/Header'; // Updated path
import BackgroundParticles from '../common/BackgroundParticles/BackgroundParticles'; // Updated path
import { Outlet } from 'react-router-dom';
import './MainLayout.css';
import './ResponsiveAdjustments.css';
import './MobileOptimizations.css';
import './GlassMorphism.css';
import './LayoutFixes.css'; 

const { Content } = Layout;

const MainLayout = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUserRole('student');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const onClose = () => {
    setDrawerVisible(false);
  };  return (    <Layout className={`min-h-screen layout ${userRole ? `${userRole}-theme` : ''}`}
      style={{
        background: 'transparent', 
        position: 'relative',
      }}>
      
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 0,
        pointerEvents: 'none', 
        overflow: 'hidden', 
        width: '100vw',
        height: '100vh'
      }}>
        <BackgroundParticles />
      </div>
      
      {!isMobile && <Sidebar />}
      <Drawer
        placement="left"
        onClose={onClose}
        open={drawerVisible}
        width={280}
        bodyStyle={{ padding: 0 }}
        closeIcon={null} 
        style={{ zIndex: 1050 }} 
      >
        <div className="drawer-handle-indicator"></div>
        <Sidebar inDrawer={true} onMenuClick={onClose} />
      </Drawer>

      <Layout>
        <HeaderComponent isMobile={isMobile} showDrawer={showDrawer} />        
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
        )}        
        <Content 
          className="p-6 responsive-content content-area" 
          style={{ 
            marginLeft: isMobile ? 0 : '200px',
            paddingTop: '80px', 
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            position: 'relative',
            zIndex: 1,
        }}
        >          <div className="rounded-lg shadow-sm p-6" 
               style={{ 
                 margin: isMobile ? "0.5rem" : "1rem 4rem",
                 transition: "all 0.3s ease",
               }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;