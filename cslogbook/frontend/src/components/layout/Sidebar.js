import React, { useState, useEffect, useMemo } from "react";
import { Layout, Menu, Avatar, Typography, Tooltip, message } from "antd";
import RoleTag from '../common/RoleTag';
import {
  HomeOutlined,
  TeamOutlined,
  FileTextOutlined,
  FormOutlined,
  BookOutlined,
  FileDoneOutlined,
  BankOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  SettingOutlined,
  FileProtectOutlined,
  ProjectOutlined,
  BarChartOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
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

const MenuItemWithTooltip = ({ item, disabled, title }) => {
  // เพิ่มการตรวจสอบว่ามี title และ disabled หรือไม่
  if (disabled && title) {
    return (
      <Tooltip
        title={title}
        placement="right"
        color={disabled ? "#ff4d4f" : "#52c41a"}
      >
        <span
          style={{
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {item.label}
        </span>
      </Tooltip>
    );
  }
  return item.label;
};

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
  const handleLogout = async () => {
    try {
      // Set userData to null ก่อน navigate
      await logout();
      // Navigate หลังจาก clear userData แล้ว
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      message.error("เกิดข้อผิดพลาดในการออกจากระบบ");
    }
  };

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

  const menuItems = useMemo(() => {
    // ถ้าไม่มี userData return เฉพาะ logout
    if (!userData?.role) {
      return [
        {
          key: "logout",
          icon: <LogoutOutlined />,
          label: "ออกจากระบบ",
          className: "logout",
        },
      ];
    }

    // สร้างข้อความ tooltip สำหรับแสดงเหตุผลที่ไม่สามารถเข้าถึงได้
    const internshipTooltip =
      messages?.internship || "คุณยังไม่มีสิทธิ์เข้าถึงระบบฝึกงาน";
    // projectTooltip no longer needed (portal centralizes access)

    return [
      // Dashboard - Common for all roles
      {
        key: "/admin/dashboard",
        icon: <HomeOutlined />,
        label: "หน้าแรก",
      },

      // Student Menu Items
      ...(userData?.role === "student"
        ? [
            {
              key: `/student-profile/${userData.studentCode}`,
              icon: <TeamOutlined />,
              label: "ประวัตินักศึกษา",
            },
            {
              key: "/student-deadlines/calendar",
              icon: <CalendarOutlined />,
              label: "ปฏิทินกำหนดส่ง",
              disabled: false,
            },
            {
              key: "internship",
              icon: <FileTextOutlined />,
              label: (
                <MenuItemWithTooltip
                  item={{ label: "ระบบฝึกงาน" }}
                  disabled={false}
                  title={!canAccessInternship ? internshipTooltip : ""}
                />
              ),
              disabled: false,
              children: canAccessInternship
                ? [
                    {
                      key: '/internship-companies',
                      icon: <BarChartOutlined />,
                      label: 'สถานประกอบการ (สถิติ)'
                    },
                    {
                      key: "/internship-registration",
                      label: "ลงทะเบียนฝึกงาน",
                      icon: <FormOutlined />,
                      children: [
                        /* {
                          key: "/internship-registration/cs05",
                          label: "คพ.05 - คำร้องขอฝึกงาน",
                        }, */
                        {
                          key: "/internship-registration/flow", // ใช้ InternshipRegistrationFlow ใหม่
                          label: "คำร้องขอฝึกงาน",
                        },
                      ],
                    },
                    {
                      key: "/internship-logbook",
                      label: "บันทึกการฝึกงาน",
                      icon: <BookOutlined />,
                      children: [
                        {
                          key: "/internship-logbook/companyinfo",
                          label: "สถานประกอบการ",
                        },
                        {
                          key: "/internship-logbook/timesheet",
                          label: "ใบลงเวลาและบันทึกประจำวัน",
                        },
                      ],
                    },
                    {
                      key: "/internship-summary",
                      label: "สรุปผลการฝึกงาน",
                      icon: <FileDoneOutlined />,
                    },
                    {
                      key: "/internship-certificate",
                      label: "ขอหนังสือรับรองการฝึกงาน",
                      icon: <FileProtectOutlined />,
                      disabled: !canAccessInternship, // ตรวจสอบสิทธิ์เข้าถึง
                    },
                  ]
                : [
                    {
                      key: "/internship-eligibility",
                      label: "ตรวจสอบคุณสมบัติ",
                      icon: <FormOutlined />,
                    },
                    {
                      key: "/internship-requirements",
                      label: "ข้อกำหนดฝึกงาน",
                      icon: <FileTextOutlined />,
                    },
                  ],
            },
            // โครงงานพิเศษ: ถ้ายังไม่มีสิทธิ์ แยกเมนูย่อยเหมือนฝึกงาน (ตรวจสอบ + ข้อกำหนด)
            !canAccessProject
              ? {
                  key: 'project-info',
                  icon: <ProjectOutlined />,
                  label: 'โครงงานพิเศษ',
                  children: [
                    {
                      key: '/project-eligibility',
                      label: 'ตรวจสอบคุณสมบัติ'
                    },
                    {
                      key: '/project-requirements',
                      label: 'ข้อกำหนดโครงงาน'
                    }
                  ]
                }
              : {
                  key: '/project',
                  icon: <ProjectOutlined />,
                  label: 'โครงงานพิเศษ'
                },
            {
              key: "/status-check",
              icon: <FileTextOutlined />,
              label: "ตรวจสอบสถานะ",
              children: [
                {
                  key: "/status-check/internship",
                  icon: <BankOutlined />,
                  label: "เอกสารฝึกงาน",
                  disabled: false,
                },
                {
                  key: "/status-check/project",
                  icon: <ProjectOutlined />,
                  label: "เอกสารโครงงาน",
                  disabled: false,
                },
              ],
            },
          ].filter(Boolean)
        : []),

      // Teacher Menu Items - Academic (อาจารย์สายวิชาการ)
      ...(userData?.role === "teacher" && userData?.teacherType === "academic"
        ? [
            {
              key: "/review-documents",
              icon: <FileTextOutlined />,
              label: "ตรวจสอบเอกสารโครงงาน",
            },
            {
              key: "/advise-project",
              icon: <ProjectOutlined />,
              label: "ให้คำแนะนำโครงงาน",
            },
            {
              key: "/approve-documents",
              icon: <CheckCircleOutlined />,
              label: "อนุมัติเอกสาร",
            },
          ]
        : []),

      // Teacher Menu Items - Support (เจ้าหน้าที่ภาควิชา)
      ...(userData?.role === "teacher" && userData?.teacherType === "support"
        ? [
            {
              key: "manage",
              icon: <TeamOutlined />,
              label: "จัดการข้อมูล",
              children: [
                {
                  key: "/admin/users/students",
                  label: "นักศึกษา",
                },
                {
                  key: "/admin/users/teachers",
                  label: "อาจารย์",
                },
                {
                  key: "/project-pairs",
                  label: "คู่โปรเจค",
                },
              ],
            },
            {
              key: "documents",
              icon: <FileTextOutlined />,
              label: "จัดการเอกสาร",
              children: [
                {
                  key: "/admin/documents/internship",
                  label: "เอกสารฝึกงาน",
                },
                {
                  key: "/admin/documents/project",
                  label: "เอกสารโครงงานพิเศษ",
                },
              ],
            },
            {
              key: "reports",
              icon: <BarChartOutlined />,
              label: "รายงาน",
              children: [
                { key: "/internship-companies", label: "สถานประกอบการ" },
                { key: "/admin/reports/support", label: "แผงควบคุมรายงาน" },
                { key: "/admin/reports/internship", label: "รายงานระบบฝึกงาน" },
                { key: "/admin/reports/project", label: "รายงานโครงงานพิเศษ" },
              ],
            },
            {
              key: "/admin/upload",
              icon: <UploadOutlined />,
              label: "อัปโหลดรายชื่อนักศึกษา",
            },
            {
              key: "settings",
              icon: <SettingOutlined />,
              label: "ตั้งค่าระบบ",
              children: [
                {
                  key: "/admin/settings",
                  label: "ภาพรวมการตั้งค่า",
                },
                {
                  key: "/admin/settings/curriculum",
                  label: "หลักสูตรการศึกษา",
                },
                {
                  key: "/admin/settings/academic",
                  label: "ปีการศึกษา/ภาคเรียน",
                },
                {
                  key: "/admin/settings/status",
                  label: "สถานะนักศึกษา",
                },
                {
                  key: "/admin/settings/notification-settings",
                  label: "การแจ้งเตือน",
                },
                {
                  key: "/admin/settings/workflow-steps",
                  label: "ขั้นตอนการทำงาน",
                },
              ],
            },
          ]
        : []),

      // Admin Menu Items
      ...(userData?.role === "admin"
        ? [
            {
              key: "manage",
              icon: <TeamOutlined />,
              label: "จัดการข้อมูล",
              children: [
                {
                  key: "/admin/users/students",
                  label: "นักศึกษา",
                },
                {
                  key: "/admin/users/teachers",
                  label: "อาจารย์",
                },
                {
                  key: "/project-pairs",
                  label: "คู่โปรเจค",
                },
              ],
            },
            {
              key: "documents",
              icon: <FileTextOutlined />,
              label: "จัดการเอกสาร",
              children: [
                {
                  key: "/admin/documents/internship",
                  label: "เอกสารฝึกงาน",
                },
                {
                  key: "/admin/documents/project",
                  label: "เอกสารโครงงานพิเศษ",
                },
              ],
            },
            {
              key: "reports",
              icon: <BarChartOutlined />,
              label: "รายงาน",
              children: [
                { key: "/admin/reports/support", label: "Dashboard รวม" },
                { key: "/internship-companies", label: "บริษัทฝึกงาน (สถิติ)" },
                { key: "/admin/reports/internship", label: "Internship Report" },
                { key: "/admin/reports/project", label: "Project Report" },
              ],
            },
            {
              key: "/admin/upload",
              icon: <UploadOutlined />,
              label: "อัปโหลดรายชื่อนักศึกษา",
            },
            {
              key: "settings",
              icon: <SettingOutlined />,
              label: "ตั้งค่าระบบ",
              children: [
                {
                  key: "/admin/settings",
                  label: "ภาพรวมการตั้งค่า",
                },
                {
                  key: "/admin/settings/curriculum",
                  label: "หลักสูตรการศึกษา",
                },
                {
                  key: "/admin/settings/academic",
                  label: "ปีการศึกษา/ภาคเรียน",
                },
                {
                  key: "/admin/settings/status",
                  label: "สถานะนักศึกษา",
                },
                {
                  key: "/admin/settings/notification-settings",
                  label: "การแจ้งเตือน",
                },
                {
                  key: "/admin/settings/workflow-steps",
                  label: "ขั้นตอนการทำงาน",
                },
              ],
            },
          ]
        : []),

      // Logout - Common for all roles
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "ออกจากระบบ",
        className: "logout",
      },
    ].filter(Boolean);
  }, [userData, canAccessInternship, canAccessProject, messages]);
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

      <Menu
        mode="inline"
        items={menuItems}
        selectedKeys={[location.pathname]}
        defaultSelectedKeys={[location.pathname]}
        className={`menu ${resolveThemeClass(userData?.role, userData?.teacherType)}`}
        onClick={handleMenuClick}
      />

      {!collapsed && renderLastUpdate()}
    </Sider>
  );
};

export default React.memo(Sidebar);
