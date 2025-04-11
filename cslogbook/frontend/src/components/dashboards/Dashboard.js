import React from "react";
import {
  Row,
  Col,
  Card,
  Alert,
  Statistic,
  Space,
  Button,
  message,
  Badge,
  Descriptions,
} from "antd";
import {
  UserOutlined,
  ProjectOutlined,
  BookOutlined,
  FormOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { adminService } from "../../services/adminService";
import { teacherService } from "../../services/teacherService";
import { studentService } from "../../services/studentService";
import moment from "moment";
import { useQuery } from "@tanstack/react-query";

function Dashboard() {
  const { userData } = useAuth();

  function AdminView() {
    const navigate = useNavigate();

    const { data: stats, isLoading } = useQuery({
      queryKey: ["adminStats"],
      queryFn: adminService.getStats,
      onError: (error) => {
        console.error("Error fetching stats:", error);
        message.error("ไม่สามารถโหลดข้อมูลสถิติได้");
      },
    });

    const dashboardStats = stats || {
      students: { total: 0, internshipEligible: 0, projectEligible: 0 },
      documents: { total: 0, pending: 0 },
      system: { onlineUsers: 0, lastUpdate: null },
    };

    const statsCards = [
      {
        title: "นักศึกษาทั้งหมด",
        value: dashboardStats.students.total,
        icon: <UserOutlined />,
        color: "#1890ff",
        onClick: () => navigate("/admin2/users/students"),
      },
      {
        title: "มีสิทธิ์ฝึกงาน",
        value: dashboardStats.students.internshipEligible,
        icon: <BookOutlined />,
        color: "#52c41a",
        onClick: () => navigate("/students?filter=internship"),
      },
      {
        title: "มีสิทธิ์ทำโครงงานพิเศษ",
        value: dashboardStats.students.projectEligible,
        icon: <ProjectOutlined />,
        color: "#722ed1",
        onClick: () => navigate("/students?filter=project"),
      },
    ];

    return (
      <div className="admin-dashboard">
        <Space direction="vertical" size="large" className="common-space-style">
          <Alert
            message={`สวัสดี ผู้ดูแลระบบ ${userData.firstName} ${userData.lastName}`}
            type="info"
            showIcon
            className="common-alert-style"
          />

          <Row gutter={[16, 16]}>
            {statsCards.map((card, index) => (
              <Col xs={24} sm={8} key={index}>
                <Card hoverable onClick={card.onClick} className="stats-card">
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
              <Card style={{ height: "100%" }}>
                <Statistic
                  title="เอกสารรอดำเนินการ"
                  value={dashboardStats.documents.pending}
                  suffix={`/ ${dashboardStats.documents.total}`}
                  valueStyle={{ color: "#faad14" }}
                  prefix={<FileTextOutlined />}
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
                size="large"
              >
                อัพโหลดข้อมูลรายชื่อนักศึกษา
              </Button>
            </Col>
            <Col xs={24} md={12}>
              <Button
                type="default"
                icon={<FileTextOutlined />}
                onClick={() => navigate("/document-management/internship")}
                block
                size="large"
              >
                จัดการเอกสารฝึกงาน
              </Button>
            </Col>
          </Row>
        </Space>
      </div>
    );
  }

  function TeacherView() {
    const { data: teacherStats, isLoading } = useQuery({
      queryKey: ["teacherStats"],
      queryFn: teacherService.getStats,
      onError: (error) => {
        console.error("Error fetching teacher stats:", error);
        message.error("ไม่สามารถโหลดข้อมูลสถิติได้");
      },
    });

    const stats = teacherStats || {
      totalStudents: 0,
      pendingActions: 0,
    };

    return (
      <div className="teacher-dashboard">
        <Row gutter={[16, 16]} className="stats-row">
          <Col xs={24} sm={12}>
            <Card hoverable className="stats-card">
              <Statistic
                title="นักศึกษาที่ปรึกษา"
                value={stats.totalStudents}
                prefix={<UserOutlined />}
                loading={isLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card hoverable className="stats-card">
              <Badge count={stats.pendingActions} overflowCount={99}>
                <Statistic
                  title="รายการที่ต้องดำเนินการ"
                  value="รออนุมัติ"
                  prefix={<ClockCircleOutlined />}
                  loading={isLoading}
                />
              </Badge>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  function StudentView() {
    const { userData } = useAuth();
    const navigate = useNavigate();
    
    const { data, isLoading, error } = useQuery({
      queryKey: ['studentInfo', userData?.studentCode],
      queryFn: () => userData?.studentCode ? studentService.getStudentInfo(userData.studentCode) : null,
      enabled: !!userData?.studentCode,
      onError: (error) => {
        console.error('Error fetching student info:', error);
        message.error('ไม่สามารถโหลดข้อมูลนักศึกษาได้');
      }
    });
    
    const studentData = data?.data;
    const isEligibleForInternship = studentData?.eligibility?.internship?.eligible || false;
    const isEligibleForProject = studentData?.eligibility?.project?.eligible || false;

    return (
      <div className="student-dashboard">
        <Space direction="vertical" size="large" className="common-space-style">
          <Alert
            message={`สวัสดี ${userData.firstName} ${userData.lastName}`}
            description={`รหัสนักศึกษา: ${userData.studentCode}`}
            type="info"
            showIcon
          />

          <Row gutter={[16, 16]}>
            {/* สถานะการฝึกงาน */}
            <Col xs={24} sm={12}>
              <Card hoverable className="eligibility-card" style={{ height: '100%' }}>
                <Statistic
                  title="สถานะการฝึกงาน"
                  value={isEligibleForInternship ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                  valueStyle={{ 
                    color: isEligibleForInternship ? '#52c41a' : '#ff4d4f' 
                  }}
                  prefix={isEligibleForInternship ? 
                    <CheckCircleOutlined /> : 
                    <ClockCircleOutlined />
                  }
                />
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="หน่วยกิตรวม">
                    {studentData?.totalCredits || 0} หน่วยกิต
                  </Descriptions.Item>
                  <Descriptions.Item label="สถานะ">
                    {studentData?.eligibility?.internship?.message || 'ตรวจสอบหน่วยกิตและชั้นปี'}
                  </Descriptions.Item>
                </Descriptions>
                {isEligibleForInternship && (
                  <Button 
                    type="primary" 
                    icon={<FormOutlined />}
                    onClick={() => navigate('/internship-registration/cs05')}
                    style={{ marginTop: '16px' }}
                  >
                    จัดการฝึกงาน
                  </Button>
                )}
              </Card>
            </Col>

            {/* สถานะโครงงาน */}
            <Col xs={24} sm={12}>
              <Card hoverable className="eligibility-card" style={{ height: '100%' }}>
                <Statistic
                  title="สถานะโครงงานพิเศษ"
                  value={isEligibleForProject ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                  valueStyle={{ 
                    color: isEligibleForProject ? '#52c41a' : '#ff4d4f' 
                  }}
                  prefix={isEligibleForProject ? 
                    <CheckCircleOutlined /> : 
                    <ClockCircleOutlined />
                  }
                />
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="ชั้นปี">
                    {studentData?.studentYear?.year || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="หน่วยกิตรวม">
                    {studentData?.totalCredits || 0} หน่วยกิต
                  </Descriptions.Item>
                  <Descriptions.Item label="หน่วยกิตภาควิชา">
                    {studentData?.majorCredits || 0} หน่วยกิต
                  </Descriptions.Item>
                  <Descriptions.Item label="สถานะ">
                    {studentData?.eligibility?.project?.message || 'ตรวจสอบหน่วยกิตและชั้นปี'}
                  </Descriptions.Item>
                </Descriptions>
                {isEligibleForProject && (
                  <Button 
                    type="primary" 
                    icon={<ProjectOutlined />}
                    onClick={() => navigate('/project')}
                    style={{ marginTop: '16px' }}
                  >
                    จัดการโครงงานพิเศษ
                  </Button>
                )}
              </Card>
            </Col>
          </Row>
        </Space>
      </div>
    );
  }

  function renderDashboard() {
    switch (userData?.role) {
      case "admin":
        return <AdminView />;
      case "teacher":
        return <TeacherView />;
      case "student":
        return <StudentView />;
      default:
        return (
          <Alert
            message="ไม่พบข้อมูล"
            description="ไม่พบข้อมูลสำหรับแสดงผล"
            type="warning"
            showIcon
          />
        );
    }
  }

  return <div className="dashboard-container">{renderDashboard()}</div>;
}

export default Dashboard;
