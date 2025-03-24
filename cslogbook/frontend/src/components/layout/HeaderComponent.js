import React from "react";
import { Layout, Button, Typography, Space, Avatar, Badge } from "antd";
import { MenuOutlined } from "@ant-design/icons";
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
    gradient: "linear-gradient(135deg,rgb(126, 113, 86) 0%, #ffd591 100%)",
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

  return (
    <Header
      className={`main-header ${isMobile ? "mobile" : ""}`}
      style={{ background: theme.gradient }}
    >
      {/* Left side */}
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
        <Space
          size={24}
          align="start"
          style={{ paddingTop: "12px", paddingBottom: "12px" }}
        >
          {/* เพิ่มปุ่มเปิด Drawer สำหรับหน้าจอเล็ก */}
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={showDrawer}
              style={{
                padding: "0",
                fontSize: 24,
                margin: 0,
                position: "fixed",
                zIndex: 1001,
                top: "50%", // จัดตำแหน่งจากด้านบน 50%
                transform: "translate(-50%, -50%)", // ย้ายกลับไปทางซ้ายและขึ้นบน 50% ของขนาดปุ่ม
              }}
            />
          )}
          <Space
            direction="vertical"
            size={4}
            className={`title-container ${isMobile ? "mobile" : ""}`}
          >
            <Title level={4} className={`main-title ${isMobile ? "mobile" : ""}`} style={{ color: theme.text }}>
              CS Logbook
            </Title>
            <Text className={`subtitle ${isMobile ? "mobile" : ""}`}>
              ระบบสมุดบันทึกการฝึกงานและติดตามความคืบหน้าโครงงานพิเศษ
            </Text>
          </Space>
        </Space>
      </div>

      {/* Right side */}
      <div style={{ marginRight: "auto", padding: "12px" }}>
        <Space size={16} align="center">
          <Avatar className={`user-avatar ${isMobile ? "mobile" : ""}`} style={{ backgroundColor: theme.badge }}>
            {firstName?.charAt(0)?.toUpperCase()}
          </Avatar>

          <Space direction="vertical" size={0}>
            <Text strong className="user-name" style={{ color: theme.text }}>
              {firstName} {lastName}
            </Text>
            <Badge count={getRoleTitle(role)} className="role-badge" style={{ backgroundColor: theme.badge }} />
          </Space>
        </Space>
      </div>
    </Header>
  );
};

export default HeaderComponent;