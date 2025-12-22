import React, { useState, useEffect } from "react";
import { Layout, Drawer } from "antd";
import Sidebar from "./Sidebar/Sidebar";
import HeaderComponent from "./Header/HeaderComponent";
import BackgroundParticles from "./BackgroundParticles";
import { Outlet } from "react-router-dom";
import styles from "./MainLayout.module.css";

const { Content } = Layout;

const MainLayout = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
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

  const showDrawer = () => {
    setDrawerVisible(true);
    console.log("เปิด main");
  };

  const onClose = () => {
    setDrawerVisible(false);
    console.log("ปิด main");
  };
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
      style={{
        background: "transparent", // เปลี่ยนเป็น transparent เพื่อให้เห็น BackgroundParticles
        position: "relative",
      }}
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
        styles={{ 
          body: { padding: 0 },
          header: { display: 'none' }
        }}
        closeIcon={null}
        style={{ 
          zIndex: 1100,
          position: 'fixed'
        }}
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
          style={{
            paddingTop: "80px",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "transparent",
            position: "relative",
            zIndex: 1,
          }}
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