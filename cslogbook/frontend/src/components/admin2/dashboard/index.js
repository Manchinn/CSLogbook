import React from "react";
import {
  Row,
  Col,
  Card,
  Alert,
  Statistic,
  Space,
  Button,
  Badge,
} from "antd";
import {
  UserOutlined,
  ProjectOutlined,
  BookOutlined,
  FileTextOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useDashboardStats } from "../../../hooks/admin/useDashboardStats";
import ActivityLog from "./ActivityLog";
import moment from "moment";

const Dashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { stats, isLoading } = useDashboardStats();

  const statsCards = [
    {
      title: "นักศึกษาทั้งหมด",
      value: stats.students.total,
      icon: <UserOutlined />,
      color: "#1890ff",
      onClick: () => navigate("/admin2/users/students"),
    },
    {
      title: "มีสิทธิ์ฝึกงาน",
      value: stats.students.internshipEligible,
      icon: <BookOutlined />,
      color: "#52c41a",
      onClick: () => navigate("/admin2/users/students?filter=internship"),
    },
    {
      title: "มีสิทธิ์ทำโครงงานพิเศษ",
      value: stats.students.projectEligible,
      icon: <ProjectOutlined />,
      color: "#722ed1",
      onClick: () => navigate("/admin2/users/students?filter=project"),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '24px' }}>
      <Alert
        message={`สวัสดี ผู้ดูแลระบบ ${userData.firstName} ${userData.lastName}`}
        type="info"
        showIcon
      />

      <Row gutter={[16, 16]}>
        {statsCards.map((card, index) => (
          <Col xs={24} sm={8} key={index}>
            <Card hoverable onClick={card.onClick}>
              <Statistic
                title={card.title}
                value={card.value}
                prefix={card.icon}
                valueStyle={{ color: card.color }}
                loading={isLoading}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title="เอกสารรอดำเนินการ"
              value={stats.documents.pending}
              suffix={`/ ${stats.documents.total}`}
              valueStyle={{ color: "#faad14" }}
              prefix={<FileTextOutlined />}
              loading={isLoading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => navigate("/admin/upload")}
            block
          >
            อัปโหลดข้อมูลนักศึกษา (CSV)
          </Button>
        </Col>
        <Col xs={24} md={12}>
          <Button
            type="default"
            icon={<FileTextOutlined />}
            onClick={() => navigate("/admin2/documents/internship")}
            block
          >
            จัดการเอกสาร
            {stats.documents.pending > 0 && (
              <Badge count={stats.documents.pending} style={{ marginLeft: 8 }} />
            )}
          </Button>
        </Col>
      </Row>

      <ActivityLog />
    </Space>
  );
};

export default Dashboard;