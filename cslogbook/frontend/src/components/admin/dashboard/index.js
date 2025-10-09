import React, { useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Space,
  Button,
  Badge,
  Statistic,
  Typography,
  List,
  Tag,
  Progress,
  Alert,
} from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  UploadOutlined,
  TeamOutlined,
  SettingOutlined,
  BarChartOutlined,
  FileDoneOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { getRoleTheme } from "../../../utils/roleTheme";
import { useDashboardStats } from "../../../hooks/admin/useDashboardStats";
import ActivityLog from "./ActivityLog";
import StatCards from "./StatCards";
import dayjs from "../../../utils/dayjs";
import "../../dashboards/Dashboard.css";

const { Title, Text } = Typography;

const Dashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const {
    stats,
    isStatsLoading,
    statsError,
    lastFetchedAt,
    refreshStats,
  } = useDashboardStats();
  const theme = useMemo(
    () => getRoleTheme(userData?.role, userData?.teacherType),
    [userData?.role, userData?.teacherType]
  );

  const fullName = useMemo(() => {
    const nameParts = [userData?.firstName, userData?.lastName].filter(Boolean);
    return nameParts.length ? nameParts.join(" ") : "ผู้ใช้";
  }, [userData?.firstName, userData?.lastName]);

  const roleLabel = useMemo(() => {
    if (userData?.role === "teacher") {
      return userData?.teacherType === "support" ? "เจ้าหน้าที่ภาควิชา" : "อาจารย์";
    }
    return "ผู้ดูแลระบบ";
  }, [userData?.role, userData?.teacherType]);

  const pendingDocuments = stats?.documents?.pending || 0;
  const totalDocuments = stats?.documents?.total || 0;
  const documentProgress = totalDocuments
    ? Math.round(((totalDocuments - pendingDocuments) / totalDocuments) * 100)
    : 0;

  const lastUpdatedDisplay = stats?.system?.lastUpdate
    ? dayjs(stats.system.lastUpdate).tz().format("D MMM BBBB เวลา HH:mm น.")
    : "ยังไม่พบข้อมูล";

  const lastFetchedDisplay = lastFetchedAt
    ? dayjs(lastFetchedAt).tz().format("HH:mm น.")
    : null;

  const quickActions = useMemo(() => {
    const actions = [
      {
        key: "students",
        icon: <TeamOutlined />,
        title: "จัดการรายชื่อนักศึกษา",
        description: "ตรวจสอบและอัปเดตสถานะนักศึกษาได้จากที่เดียว",
        onClick: () => navigate("/admin/users/students"),
        primary: true,
      },
      {
        key: "documents",
        icon: <FileTextOutlined />,
        title: "ติดตามเอกสารที่รอดำเนินการ",
        description: "ดูสถานะคำขอและอนุมัติไฟล์สำคัญทั้งหมด",
        badge: pendingDocuments,
        onClick: () => navigate("/admin/documents/internship"),
      },
      {
        key: "kp02",
        icon: <FileDoneOutlined />,
        title: "ตรวจสอบคำขอ คพ.02",
        description: "ดูคิวการสอบโครงงานพิเศษและไฟล์แนบ",
        onClick: () => navigate("/admin/project1/kp02-queue"),
      },
    ];

    if (userData?.role === "admin") {
      actions.push(
        {
          key: "reports",
          icon: <BarChartOutlined />,
          title: "แผงควบคุมรายงาน",
          description: "สรุปสถิติงานฝึกงานและโครงงานพิเศษ",
          onClick: () => navigate("/admin/reports/support"),
        },
        {
          key: "settings",
          icon: <SettingOutlined />,
          title: "ตั้งค่าระบบ",
          description: "ปรับปรุงหลักสูตร ปีการศึกษา และการแจ้งเตือน",
          onClick: () => navigate("/admin/settings"),
        }
      );
    } else {
      actions.push({
        key: "calendar",
        icon: <CalendarOutlined />,
        title: "กำหนดการสำคัญ",
        description: "ตรวจสอบไทม์ไลน์และวันที่ต้องติดตาม",
        onClick: () => navigate("/admin/reports/support"),
      });
    }

    return actions;
  }, [navigate, pendingDocuments, userData?.role]);

  return (
    <Space direction="vertical" size="large" className="admin-dashboard-container">
      <Card
        className="admin-hero-card"
        variant="borderless"
        style={{ background: theme.gradient, color: theme.text }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={16}>
            <Space direction="vertical" size={8} className="admin-hero-content">
              <Text className="admin-hero-greeting">ยินดีต้อนรับกลับ</Text>
              <Title level={3} style={{ color: theme.text, margin: 0 }}>
                {roleLabel} {fullName}
              </Title>
              <Text style={{ color: theme.text, opacity: 0.85 }}>
                วันนี้มีงานที่ต้องติดตาม {pendingDocuments} รายการ และนักศึกษาทั้งหมด {stats?.students?.total || 0} คน
              </Text>
              <Space size={[8, 8]} wrap className="admin-hero-tags">
                <Tag color="gold" className="admin-hero-tag">
                  เอกสารรอดำเนินการ {pendingDocuments} / {totalDocuments}
                </Tag>
                <Tag color="blue" className="admin-hero-tag">
                  นักศึกษาฝึกงานพร้อม {stats?.students?.internshipEligible || 0} คน
                </Tag>
                <Tag color="purple" className="admin-hero-tag">
                  นักศึกษาโครงงานพร้อม {stats?.students?.projectEligible || 0} คน
                </Tag>
                <Tag color="green" className="admin-hero-tag">
                  ออนไลน์ตอนนี้ {stats?.system?.onlineUsers || 0} คน
                </Tag>
              </Space>
              {lastFetchedDisplay && (
                <Text style={{ color: theme.text, opacity: 0.7 }}>
                  อัปเดตเมื่อ {lastFetchedDisplay}
                </Text>
              )}
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button
                type="primary"
                ghost
                size="large"
                icon={<UploadOutlined />}
                onClick={() => navigate("/admin/upload")}
                className="admin-hero-button"
              >
                อัปโหลดข้อมูลนักศึกษา (CSV)
              </Button>
              <Button
                type="default"
                size="large"
                icon={<FileTextOutlined />}
                onClick={() => navigate("/admin/documents/internship")}
                className="admin-hero-button"
              >
                จัดการเอกสารทั้งหมด
                {pendingDocuments > 0 && (
                  <Badge count={pendingDocuments} offset={[8, -12]} />
                )}
              </Button>
              <Button
                type="text"
                size="small"
                onClick={refreshStats}
                icon={<ReloadOutlined />}
                style={{ color: theme.text }}
              >
                โหลดข้อมูลสถิติอีกครั้ง
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {statsError ? (
        <Alert
          type="warning"
          message="ไม่สามารถโหลดข้อมูลสถิติได้"
          description={statsError?.message || "โปรดลองรีเฟรชอีกครั้ง"}
          showIcon
        />
      ) : null}

      <StatCards stats={stats} loading={isStatsLoading} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="งานด่วนที่ควรเริ่มก่อน" className="dashboard-section-card">
            <List
              itemLayout="horizontal"
              dataSource={quickActions}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      key="action"
                      type={item.primary ? "primary" : "default"}
                      icon={<ArrowRightOutlined />}
                      onClick={item.onClick}
                    >
                      เปิดดู
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div className="dashboard-quick-icon">
                        <Badge count={item.badge} size="small">
                          {item.icon}
                        </Badge>
                      </div>
                    }
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="สถานะเอกสาร"
            extra={
              <Button type="link" onClick={() => navigate("/admin/documents/internship")}>ดูทั้งหมด</Button>
            }
            className="dashboard-section-card"
          >
            {isStatsLoading ? (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Statistic title="กำลังโหลดข้อมูลเอกสาร" value={0} loading />
              </Space>
            ) : (
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <Statistic
                  title="เอกสารรอดำเนินการ"
                  value={pendingDocuments}
                  suffix={`/ ${totalDocuments}`}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: pendingDocuments > 0 ? "#faad14" : theme.primary }}
                />
                <Progress
                  percent={documentProgress}
                  status={pendingDocuments > 0 ? "active" : "success"}
                  strokeColor={theme.primary}
                />
                <Tag color={pendingDocuments > 0 ? "orange" : "green"}>
                  {pendingDocuments > 0
                    ? "มีงานที่รอการดำเนินการ โปรดตรวจสอบ"
                    : "งานเอกสารทั้งหมดดำเนินการเรียบร้อย"}
                </Tag>
                <Text type="secondary">อัปเดตล่าสุด {lastUpdatedDisplay}</Text>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card
            title="สถานะระบบ"
            className="dashboard-section-card"
            extra={
              <Button type="text" size="small" onClick={refreshStats} icon={<ReloadOutlined />}>รีเฟรช</Button>
            }
          >
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Statistic
                title="จำนวนผู้ใช้ที่ออนไลน์"
                value={stats?.system?.onlineUsers || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: theme.primary }}
                loading={isStatsLoading}
              />
              <Text type="secondary">ข้อมูลอัปเดตล่าสุด {lastUpdatedDisplay}</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <ActivityLog />
        </Col>
      </Row>
    </Space>
  );
};

export default Dashboard;