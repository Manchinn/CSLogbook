import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Layout, Menu, Avatar, Typography, message } from "antd";
import RoleTag from '../common/RoleTag';
import { getMenuConfig } from './menuConfig';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useStudentEligibility } from "../../contexts/StudentEligibilityContext";
import { studentService } from "../../services/studentService";
import "./Sidebar.css";

const { Sider } = Layout;
const { Title } = Typography;

// mapping role -> base theme class (teacher แตกย่อยด้านล่าง)
const themeConfig = {
  student: "student-theme",
  admin: "admin-theme",
  teacher: "teacher-theme", // fallback หากยังไม่รู้ teacherType
};

// ฟังก์ชันคืนชื่อคลาสธีมตาม role + teacherType
const resolveThemeClass = (role, teacherType) => {
  if (role === 'teacher') {
    if (teacherType === 'support') return 'teacher-support-theme';
    if (teacherType === 'academic') return 'teacher-academic-theme';
    return 'teacher-theme';
  }
  return themeConfig[role] || '';
};

// Tooltip logic ถูกย้าย/ตัดทิ้ง (รวมศูนย์ที่ menuConfig แล้วถ้าจำเป็น)

// เพิ่ม prop inDrawer เพื่อบอกว่า Sidebar นี้อยู่ใน Drawer หรือไม่
// เพิ่ม prop onMenuClick สำหรับปิด drawer เมื่อคลิกเมนู
const Sidebar = ({ inDrawer, onMenuClick }) => {
  // In drawer mode, we don't need collapsed state
  const [collapsed] = useState(inDrawer ? false : false);
  const [lastUpdate] = useState(new Date()); // setLastUpdate removed (not used)
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, logout } = useAuth();
  // const [studentData, setStudentData] = useState(null); // removed unused state

  // ใช้ StudentEligibilityContext แทน useStudentPermissions
  const {
    canAccessInternship,
    canAccessProject,
    messages,
    lastUpdated,
    refreshEligibility,
  } = useStudentEligibility();

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      message.error("เกิดข้อผิดพลาดในการออกจากระบบ");
    }
  }, [logout, navigate]);

  useEffect(() => {
    // ตรวจสอบเมื่อ path เปลี่ยน
    const checkRouteAccess = () => {
      const path = location.pathname;
      const showNotificationKey = "access_notification";
      // ตรวจสอบว่าเคยแสดง notification แล้วหรือไม่ในวันนี้
      const todayDate = new Date().toDateString();
      const lastShown = localStorage.getItem("lastNotificationShown");
      const alreadyShownToday = lastShown === todayDate;

      // ถ้ายังไม่เคยแสดงในวันนี้ ให้แสดงและบันทึกวันที่
      if (!alreadyShownToday) {
        // แสดงเพียงข้อความแนะนำและแสดงเพียงครั้งเดียวต่อวัน
        if (userData?.role === "student") {
          if (path.includes("/project-proposal") && !canAccessProject) {
            // ใช้ message.info ที่มีค่า key เพื่อไม่ให้แสดงซ้ำ
            message.info({
              content:
                "คุณสามารถดูข้อมูลหน้าเสนอหัวข้อโครงงานได้ ระบบจะตรวจสอบสิทธิ์เมื่อทำการบันทึกข้อมูล",
              key: showNotificationKey,
              duration: 5,
            });
            localStorage.setItem("lastNotificationShown", todayDate);
          }

          if (
            path.includes("/internship-registration/cs05") &&
            !canAccessInternship
          ) {
            // ใช้ message.info ที่มีค่า key เพื่อไม่ให้แสดงซ้ำ
            message.info({
              content:
                "คุณสามารถดูข้อมูลหน้าลงทะเบียนฝึกงานได้ ระบบจะตรวจสอบสิทธิ์เมื่อทำการบันทึกข้อมูล",
              key: showNotificationKey,
              duration: 5,
            });
            localStorage.setItem("lastNotificationShown", todayDate);

            // ทำการรีเฟรชข้อมูลสิทธิ์เมื่อเข้าถึงหน้าลงทะเบียนฝึกงาน
            if (typeof refreshEligibility === "function") {
              refreshEligibility();
            }
          }
        }
      }
    };

    checkRouteAccess();
  }, [
    location.pathname,
    userData,
    canAccessProject,
    canAccessInternship,
    navigate,
    refreshEligibility,
  ]);

  // เพิ่ม Effect เพื่อติดตามการเปลี่ยนแปลงข้อมูลนักศึกษา
  useEffect(() => {
    if (userData?.role === "student" && userData?.studentCode) {
      const fetchStudentData = async () => {
        try {
          const response = await studentService.getStudentInfo(
            userData.studentCode
          );
          if (response.success) {
            // setStudentData(response.student); // no longer stored locally
            // setLastUpdate(new Date()); // อาจจะไม่จำเป็นแล้วถ้าใช้ lastUpdated จาก context
          }
        } catch (error) {
          console.error("Error fetching student data:", error);
        }
      };

      fetchStudentData(); // เรียกข้อมูลครั้งแรกเมื่อ component โหลด หรือเมื่อ studentCode/role เปลี่ยน
      // เพิ่ม interval ที่นานขึ้น และพิจารณาเงื่อนไขอื่นๆ ในการเรียก
      // const interval = setInterval(fetchStudentData, 300000); // เปลี่ยนจาก 30 วินาที เป็น 5 นาที (300000 ms)

      // return () => clearInterval(interval); // เอา interval ออกก่อน เพื่อพิจารณา event-driven หรือ context-based updates
    }
    // studentData ไม่ควรอยู่ใน dependency array นี้ เพราะจะทำให้เกิด loop
    // ถ้า lastUpdated จาก StudentEligibilityContext เพียงพอ ก็ไม่จำเป็นต้องมี interval ที่นี่
    // การเปลี่ยนแปลงของ lastUpdated จะ trigger useEffect นี้ให้ทำงาน (ถ้า userData.studentCode และ role ยังคงเดิม)
  }, [userData?.studentCode, userData?.role, lastUpdated]); // ใช้ lastUpdated จาก context เป็นตัวกระตุ้นหลัก

  const menuItems = useMemo(() => getMenuConfig({
    userData,
    canAccessInternship,
    canAccessProject,
    messages,
    navigate,
    handleLogout,
  }), [userData, canAccessInternship, canAccessProject, messages, navigate, handleLogout]);
  const handleMenuClick = ({ key }) => {
    if (key === "logout") {
      handleLogout();
    } else {
      navigate(key);
    }

    // If in drawer mode and onMenuClick prop exists, call it to close the drawer
    if (inDrawer && typeof onMenuClick === "function") {
      onMenuClick();
    }
  };

  const renderLastUpdate = () => {
    if (userData?.role === "student") {
      return (
        <div
          className="last-update"
          style={{
            textAlign: "center", // Corrected to 'center' to align inline content (like the <small> tag)
            padding: "8px 16px", // Added padding for better spacing
          }}
        >
          <small style={{ fontSize: "10px", opacity: 0.7 }}>
            อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString()}
          </small>
          <button
            onClick={() => {
              if (typeof refreshEligibility === "function") {
                refreshEligibility();
              }
            }}
            style={{
              fontSize: "10px",
              display: "block", // Makes the button a block-level element
              margin: "4px auto 0 auto", // Centers the block-level button horizontally (top, right/left, bottom)
              background: "none",
              border: "none",
              padding: 0,
              color: "var(--link-color, #1890ff)", // Use a CSS variable or a default link color
              cursor: "pointer", // Add cursor pointer for better UX
              textAlign: "center", // Corrected to 'center' to align text inside the button
            }}
          >
            รีเฟรชข้อมูลสิทธิ์
          </button>
        </div>
      );
    }
    return null;
  };

  // ใน Drawer mode ไม่จำเป็นต้องมี controls สำหรับ collapse
  return (
    <Sider
      width={230}
      className={`sider ${resolveThemeClass(userData?.role, userData?.teacherType)} ${inDrawer ? "in-drawer" : ""}`}
      collapsed={collapsed}
      // Add CSS for proper display when in mobile drawer
      style={
        inDrawer
          ? {
              position: "static",
              height: "auto",
              boxShadow: "none",
              border: "none",
            }
          : undefined
      }
    >
      <div className="profile">
        <Avatar
          size={64}
          style={{
            backgroundColor: "var(--active-color)",
            marginBottom: 12,
            fontSize: "24px",
          }}
        >
          {userData?.firstName?.charAt(0)?.toUpperCase() || "?"}
        </Avatar>
        {!collapsed && (
          <>
            <Title level={5} style={{ margin: "8px 0 4px" }}>
              {userData?.firstName} {userData?.lastName}
            </Title>
                <RoleTag role={userData?.role} teacherType={userData?.teacherType} />
          </>
        )}
      </div>

      {/**
        ปรับ selectedKey ให้เมนูโครงงานพิเศษถูก highlight เสมอเมื่ออยู่ภายใต้ /project/phase1/*
        เพื่อไม่ให้เมนูหาย focus เมื่อไปยัง sub step ภายใน Phase1
      */}
      {(() => {
        const derivedSelected = location.pathname.startsWith('/project/phase')
          ? (location.pathname.startsWith('/project/phase2') ? '/project/phase2' : '/project/phase1')
          : location.pathname;
        return (
          <Menu
            mode="inline"
            items={menuItems}
            selectedKeys={[derivedSelected]}
            defaultSelectedKeys={[derivedSelected]}
            defaultOpenKeys={location.pathname.startsWith('/project/phase') ? ['project-main'] : undefined}
            className={`menu ${resolveThemeClass(userData?.role, userData?.teacherType)}`}
            onClick={handleMenuClick}
          />
        );
      })()}

      {!collapsed && renderLastUpdate()}
    </Sider>
  );
};

export default React.memo(Sidebar);
