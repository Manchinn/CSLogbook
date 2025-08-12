import React, { useState, useEffect } from "react";
import { Layout, Button, Typography, Space, Avatar, Badge, Tag, Tooltip } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import academicService from "../../services/academicService";
import "./HeaderComponent.css";

const { Header } = Layout;
const { Title, Text } = Typography;

const themeConfig = {
  student: {
    gradient: "linear-gradient(135deg, #e6f7ff 0%, #91d5ff 100%)",
    primary: "#1890ff",
    text: "#000000d9",
    badge: "#1890ff",
    buttonHover: "#bae7ff",
  },
  teacher: {
    gradient: "linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)",
    primary: "#faad14",
    text: "#000000d9",
    badge: "#d48806",
    buttonHover: "#ffe7ba",
  },
  admin: {
    gradient: "linear-gradient(135deg, #fff1f0 0%, #ffa39e 100%)",
    primary: "#f5222d",
    text: "#000000d9",
    badge: "#cf1322",
    buttonHover: "#ffccc7",
  },
};

const HeaderComponent = ({ isMobile, showDrawer }) => {
  const role = localStorage.getItem("role");
  const firstName = localStorage.getItem("firstName");
  const lastName = localStorage.getItem("lastName");
  const theme = themeConfig[role] || themeConfig.student;
  
  // State สำหรับข้อมูลปีการศึกษา
  const [academicInfo, setAcademicInfo] = useState(null);
  const [academicLoading, setAcademicLoading] = useState(false);

  // ดึงข้อมูลปีการศึกษาปัจจุบัน
  useEffect(() => {
    const fetchAcademicInfo = async () => {
      try {
        setAcademicLoading(true);
        const info = await academicService.getCurrentAcademicInfo();
        setAcademicInfo(info);
      } catch (error) {
        console.error('Failed to fetch academic info:', error);
        // ตั้งค่า fallback ในกรณีที่ดึงข้อมูลไม่ได้
        setAcademicInfo({
          academicYear: new Date().getFullYear() + 543, // ปี พ.ศ. ปัจจุบัน
          semester: Math.ceil((new Date().getMonth() + 1) / 6), // คำนวณภาคการศึกษา
          displayText: `${new Date().getFullYear() + 543}/${Math.ceil((new Date().getMonth() + 1) / 6)}*`
        });
      } finally {
        setAcademicLoading(false);
      }
    };

    fetchAcademicInfo();
  }, []);

  const getRoleTitle = (role) => {
    switch (role) {
      case "admin":
        return "ผู้ดูแลระบบ";
      case "teacher":
        return "อาจารย์";
      case "student":
        return "นักศึกษา";
      default:
        return "ผู้ใช้งาน";
    }
  };
  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
  };
  const headerStyles = {    mainHeader: {
      marginTop: isMobile ? "0" : "20px",
      paddingTop: isMobile ? "0" : "20px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.08)",
      background: "rgba(255, 255, 255, 0.7)", // เพิ่มความโปร่งใสให้มากขึ้น
      backdropFilter: "blur(5px)", // ลดความเบลอลงเพื่อให้เห็น particles ชัดขึ้น
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: "auto",
      minHeight: "72px",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 1000, // Increased z-index to ensure it's on top
      borderRadius: isMobile ? "0" : "16px", // No border radius on mobile
      marginLeft: isMobile ? 0 : "290px",
      width: isMobile ? "100%" : "calc(100% - 330px)", // Adjusted width
      borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
    },
    titleContainer: {
      maxWidth: isMobile ? "200px" : "600px",
    },
    mainTitle: {
      margin: 0,
      fontSize: isMobile ? "20px" : "24px",
      color: theme.text,
      lineHeight: 1.4,
      fontWeight: 600,
    },
    subtitle: {
      fontSize: "14px",
      color: "rgba(0, 0, 0, 0.65)",
      lineHeight: 1.5,
      margin: 0,
      display: isMobile ? "none" : "block",
    },
    userAvatar: {
      display: isMobile ? "none" : "block",
      backgroundColor: theme.badge,
      color: "#fff",
      fontWeight: "bold",
    },
    userName: {
      fontSize: "14px",
      color: theme.text,
    },
    roleBadge: {
      backgroundColor: theme.badge,
      fontSize: "12px",
      padding: "0 8px",
      borderRadius: "6px",
      top: "-12px",
    },
    secondaryHeader: {
      backgroundColor: "#f5f5f5",
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "115px",
      zIndex: 10,
    },
    secondaryTitle: {
      textAlign: "center",
      color: "white",
      paddingTop: "15px",
      fontSize: "18px",
      fontWeight: "bold",
    },
  };
  return (
    <>
      <Header className="header-container" style={headerStyles.mainHeader}>
        {/* Left side */}
        <div className="header-left" style={{ flex: 1 }}>
          <Space
            size={24}
            align="start"
            style={{ paddingTop: "12px", paddingBottom: "36px" }}
          >
            {isMobile && (
              <Button
                className="header-menu-button"
                type="text"
                icon={
                  <MenuOutlined
                    style={{ fontSize: "20px", color: theme.primary }}
                  />
                }
                onClick={showDrawer}
                style={buttonStyle}
              />
            )}{" "}
            <Space
              direction="vertical"
              size={4}
              style={headerStyles.titleContainer}
              className="header-title-container"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', flexWrap: 'wrap' }}>
                <Title
                  level={4}
                  style={headerStyles.mainTitle}
                  className="header-title"
                >
                  CS Logbook
                </Title>
                {academicInfo && (
                  <Tooltip 
                    title={`ปีการศึกษา ${academicInfo.academicYear}${academicInfo.semester ? ` ภาคการศึกษาที่ ${academicInfo.semester}` : ''}${academicInfo.displayText?.includes('*') ? ' (คำนวณอัตโนมัติ)' : ''}`}
                    placement="bottom"
                  >
                    <Tag 
                      color={theme.primary === '#1890ff' ? 'blue' : theme.primary === '#faad14' ? 'orange' : 'red'}
                      style={{ 
                        fontSize: isMobile ? '10px' : '11px', 
                        padding: isMobile ? '1px 6px' : '2px 8px',
                        borderRadius: '8px',
                        fontWeight: '500',
                        marginTop: '-2px',
                        lineHeight: '1.2',
                        cursor: 'help'
                      }}
                    >
                      {academicInfo.displayText}
                    </Tag>
                  </Tooltip>
                )}
                {academicLoading && (
                  <Tag 
                    color="default"
                    style={{ 
                      fontSize: isMobile ? '10px' : '11px', 
                      padding: isMobile ? '1px 6px' : '2px 8px',
                      borderRadius: '8px',
                      marginTop: '-2px'
                    }}
                  >
                    โหลด...
                  </Tag>
                )}
              </div>
              <Text style={headerStyles.subtitle} className="header-subtitle">
                ระบบสมุดบันทึกการฝึกงานและติดตามความคืบหน้าโครงงานพิเศษ
              </Text>
            </Space>
          </Space>
        </div>{" "}
        {/* Right side */}
        <div className="header-actions" style={{ padding: "12px" }}>
          <Space size={16} align="center">
            <Avatar style={headerStyles.userAvatar} className="header-avatar">
              {firstName?.charAt(0)?.toUpperCase()}
            </Avatar>

            <Space direction="vertical" size={0}>
              <Text
                strong
                style={headerStyles.userName}
                className="header-username"
              >
                {firstName} {lastName}
              </Text>
              <Badge
                count={getRoleTitle(role)}
                style={headerStyles.roleBadge}
                className="header-role-badge"
              />
            </Space>
          </Space>
        </div>
      </Header>{" "}
      <div style={headerStyles.secondaryHeader}></div>
    </>
  );
};

export default HeaderComponent;
