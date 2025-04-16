import React, { useState, useEffect, useMemo } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Typography,
  Badge,
  message,
  Tooltip,
} from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useStudentPermissions } from "../../hooks/useStudentPermissions";
import { studentService } from "../../services/studentService";
import {
  HomeOutlined,
  FileTextOutlined,
  TeamOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  ProjectOutlined,
  FormOutlined,
  BankOutlined,
  BookOutlined,
  FileDoneOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import "./Sidebar.css";

const { Sider } = Layout;
const { Title } = Typography;

const themeConfig = {
  student: "student-theme",
  teacher: "teacher-theme",
  admin: "admin-theme",
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

const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, logout } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const { canAccessInternship, canAccessProject, messages } =
    useStudentPermissions(userData);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

      if (userData?.role === "student") {
        if (path.includes("/project") && !canAccessProject) {
          message.error("คุณยังไม่มีสิทธิ์เข้าถึงระบบโครงงานพิเศษ");
          navigate("/dashboard");
          return;
        }

        if (path.includes("/internship") && !canAccessInternship) {
          message.error("คุณยังไม่มีสิทธิ์เข้าถึงระบบฝึกงาน");
          navigate("/dashboard");
          return;
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
            const newData = response.data;

            // เช็คว่าข้อมูลมีการเปลี่ยนแปลงหรือไม่
            if (JSON.stringify(studentData) !== JSON.stringify(newData)) {
              setStudentData(newData);
              setLastUpdate(new Date());
              localStorage.setItem("studentData", JSON.stringify(newData));
            }
          }
        } catch (error) {
          console.error("Error fetching student data:", error);
        }
      };

      fetchStudentData();
      const interval = setInterval(fetchStudentData, 30000);

      return () => clearInterval(interval);
    }
  }, [userData?.studentCode, userData?.role, studentData]); // เพิ่ม studentData

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

    return [
      // Dashboard - Common for all roles
      {
        key: "/admin2/dashboard",
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
              key: "internship",
              icon: <FileTextOutlined />,
              label: (
                <MenuItemWithTooltip
                  item={{ label: "ระบบฝึกงาน" }}
                  disabled={!canAccessInternship}
                  title={messages.internship}
                />
              ),
              disabled: !canAccessInternship,
              children: canAccessInternship
                ? [
                    {
                      key: "/internship-registration",
                      label: "ลงทะเบียนฝึกงาน",
                      icon: <FormOutlined />,
                      children: [
                        {
                          key: "/internship-registration/cs05",
                          label: "คพ.05 - คำร้องขอฝึกงาน",
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
                  ]
                : [],
            },
            {
              key: "project",
              icon: <ProjectOutlined />,
              label: (
                <MenuItemWithTooltip
                  item={{ label: "โครงงานพิเศษ" }}
                  disabled={!canAccessProject}
                  title={messages.project}
                />
              ),
              disabled: !canAccessProject,
              children: canAccessProject
                ? [
                    {
                      key: "/project-proposal",
                      label: "ฟอร์มเสนอหัวข้อ",
                    },
                    {
                      key: "/project-logbook",
                      label: "บันทึก Logbook",
                    },
                  ]
                : [],
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
                  disabled: !canAccessInternship,
                },
                {
                  key: "/status-check/project",
                  icon: <ProjectOutlined />,
                  label: "เอกสารโครงงาน",
                  disabled: !canAccessProject,
                },
              ],
            },
          ].filter(Boolean)
        : []),

      // Teacher Menu Items
      ...(userData?.role === "teacher"
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

      // Admin Menu Items
      ...(userData?.role === "admin"
        ? [
            {
              key: "manage",
              icon: <TeamOutlined />,
              label: "จัดการข้อมูล",
              children: [
                {
                  key: "/admin2/users/students",
                  label: "นักศึกษา",
                },
                {
                  key: "/admin2/users/teachers",
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
                  key: "/admin2/documents/internship", // /admin2/documents/internship
                  label: "เอกสารฝึกงาน",
                },
                {
                  key: "/admin2/documents/project", // /admin2/documents/project
                  label: "เอกสารโครงงานพิเศษ",
                },
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
                  key: "/admin2/settings",
                  label: "ภาพรวมการตั้งค่า",
                },
                {
                  key: "/admin2/settings/curriculum",
                  label: "หลักสูตรการศึกษา",
                },
                {
                  key: "/admin2/settings/academic",
                  label: "ปีการศึกษา/ภาคเรียน",
                },
                {
                  key: "/admin2/settings/status",
                  label: "สถานะนักศึกษา",
                }
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
  };

  const renderLastUpdate = () => {
    if (userData?.role === "student") {
      return (
        <div
          style={{
            padding: "8px",
            textAlign: "center",
            fontSize: "12px",
            color: "rgba(0,0,0,0.45)",
          }}
        >
          อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString()}
        </div>
      );
    }
    return null;
  };

  return (
    <Sider
      width={230}
      className={`sider ${userData?.role ? themeConfig[userData.role] : ""}`}
      breakpoint="lg"
      collapsedWidth={isMobile ? 0 : 80}
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
        <Title level={5} style={{ margin: "8px 0 4px" }}>
          {userData?.firstName} {userData?.lastName}
        </Title>
        <Badge
          count={
            !userData?.role
              ? ""
              : userData.role === "admin"
              ? "ผู้ดูแลระบบ"
              : userData.role === "teacher"
              ? "อาจารย์"
              : "นักศึกษา"
          }
          style={{
            backgroundColor: "var(--active-color)",
            fontSize: "12px",
          }}
        />
      </div>

      <Menu
        mode="inline"
        items={menuItems}
        selectedKeys={[location.pathname]}
        defaultSelectedKeys={[location.pathname]}
        className={`menu ${userData?.role ? themeConfig[userData.role] : ""}`}
        onClick={handleMenuClick}
      />

      {renderLastUpdate()}
    </Sider>
  );
};

export default React.memo(Sidebar);
