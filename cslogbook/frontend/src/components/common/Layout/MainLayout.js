import React, { useState, useEffect, useCallback } from "react";
import { Layout, Drawer } from "antd";
import Sidebar from "./Sidebar/Sidebar";
import HeaderComponent from "./Header/HeaderComponent";
import BackgroundParticles from "./BackgroundParticles";
import { Outlet } from "react-router-dom";
import styles from "./MainLayout.module.css";

const { Content } = Layout;

// Hoisted static styles to prevent recreation on each render (rendering-hoist-jsx)
const layoutStyle = {
  background: "transparent",
  position: "relative",
};

const contentStyle = {
  paddingTop: "80px",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "transparent",
  position: "relative",
  zIndex: 1,
};

const drawerStyle = {
  zIndex: 1100,
  position: 'fixed'
};

const drawerBodyStyle = { 
  body: { padding: 0 },
  header: { display: 'none' }
};

const MainLayout = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  // Use lazy state initialization (rerender-lazy-state-init)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [userRole, setUserRole] = useState("");

  // Get user role from localStorage for theme
  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    setUserRole(role);
  }, []);

  // Add resize event listener to update isMobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Use useCallback for stable handler references (rerender-functional-setstate)
  const showDrawer = useCallback(() => {
    setDrawerVisible(true);
  }, []);

  const onClose = useCallback(() => {
    setDrawerVisible(false);
  }, []);
  const getRoleThemeClass = () => {
    if (userRole === "student") return styles.studentTheme;
    if (userRole === "teacher") return styles.teacherTheme;
    if (userRole === "admin") return styles.adminTheme;
    return "";
  };

  const layoutClassName = [styles.layout, getRoleThemeClass()]
    .filter(Boolean)
    .join(" ");

  return (
    <Layout
      className={layoutClassName}
      style={layoutStyle}
    >
      {/* Add BackgroundParticles component */}
      <div className={styles.backgroundLayer}>
        <BackgroundParticles />
      </div>

      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}
      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        onClose={onClose}
        open={drawerVisible}
        width={280}
        styles={drawerBodyStyle}
        closeIcon={null}
        style={drawerStyle}
        className={styles.mobileSidebarDrawer}
        maskClosable={true}
        destroyOnHidden={false}
      >
        <Sidebar inDrawer={true} onMenuClick={onClose} />
      </Drawer>
      <Layout>
        <HeaderComponent isMobile={isMobile} showDrawer={showDrawer} />
        {/* Main Content */}
        <Content
          className={styles.contentArea}
          style={contentStyle}
        >
          <div className={styles.contentCard}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;