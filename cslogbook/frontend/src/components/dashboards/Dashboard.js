import React, { useState, useEffect } from "react";
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
import { getRoleTheme } from '../../utils/roleTheme';
import useUpcomingDeadlines from '../../hooks/useUpcomingDeadlines';
// moment removed (not used)

function Dashboard() {
  const { userData } = useAuth();

  const theme = getRoleTheme(userData?.role, userData?.teacherType);

  function AdminView() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      let isMounted = true;
      adminService.getStats()
        .then((data) => {
          if (isMounted) {
            setStats(data);
            setIsLoading(false);
          }
        })
        .catch((error) => {
          console.error("Error fetching stats:", error);
          message.error("ไม่สามารถโหลดข้อมูลสถิติได้");
          setIsLoading(false);
        });
      return () => { isMounted = false; };
    }, []);

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
        onClick: () => navigate("/admin/users/students"),
      },
      {
        title: "มีสิทธิ์ฝึกงาน",
        value: dashboardStats.students.internshipEligible,
        icon: <BookOutlined />,
        color: "#52c41a",
        onClick: () => navigate("/admin/users/students?filter=internship"),
      },
      {
        title: "มีสิทธิ์ทำโครงงานพิเศษ",
        value: dashboardStats.students.projectEligible,
        icon: <ProjectOutlined />,
        color: "#722ed1",
        onClick: () => navigate("/admin/users/students?filter=project"),
      },
    ];

    return (
      <div className="admin-dashboard">
        <Space direction="vertical" size="large" className="common-space-style">
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
                  valueStyle={{ color: dashboardStats.documents.pending > 0 ? '#faad14' : theme.primary }}
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
    const [teacherStats, setTeacherStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      let isMounted = true;
      teacherService.getStats()
        .then((data) => {
          if (isMounted) {
            setTeacherStats(data);
            setIsLoading(false);
          }
        })
        .catch((error) => {
          console.error("Error fetching teacher stats:", error);
          message.error("ไม่สามารถโหลดข้อมูลสถิติได้");
          setIsLoading(false);
        });
      return () => { isMounted = false; };
    }, []);

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
    const navigate = useNavigate();
    const [studentData, setStudentData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
  const { deadlines: upcomingDeadlines, loading: loadingDeadlines } = useUpcomingDeadlines({ days:7 });

    const studentCode = userData?.studentCode; // แยก primitive ให้ hook dependency ชัดเจน
    useEffect(() => {
      let isMounted = true;
      if (studentCode) {
        studentService.getStudentInfo(studentCode)
          .then((response) => {
            if (isMounted) {
              setStudentData(response.data);
              setIsLoading(false);
            }
          })
          .catch((error) => {
            console.error('Error fetching student info:', error);
            message.error('ไม่สามารถโหลดข้อมูลนักศึกษาได้');
            setIsLoading(false);
          });
      }
      return () => { isMounted = false; };
    }, [studentCode]);

    const isEligibleForInternship = studentData?.eligibility?.internship?.eligible || false;
    const isEligibleForProject = studentData?.eligibility?.project?.eligible || false;

    return (
      <div className="student-dashboard">
        <Space direction="vertical" size="large" className="common-space-style">
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
                  loading={isLoading}
                />
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="ชั้นปี">
                    {studentData?.studentYear || '-'}
                  </Descriptions.Item>
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
                    onClick={() => navigate('/internship-registration/flow')}
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
                  loading={isLoading}
                />
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="ชั้นปี">
                    {studentData?.studentYear || '-'}
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
                    onClick={() => navigate('/project/phase1')}
                    style={{ marginTop: '16px' }}
                  >
                    จัดการโครงงานพิเศษ
                  </Button>
                )}
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card hoverable className="upcoming-deadlines-card" style={{ height: '100%' }} title={<Space><ClockCircleOutlined /> กำหนดส่งใกล้ถึง</Space>}>
                {loadingDeadlines ? 'กำลังโหลด...' : (
                  upcomingDeadlines.length ? upcomingDeadlines.slice(0,5).map(d => (
                    <div key={d.id} style={{ marginBottom:8 }}>
                      <Space direction="vertical" size={0} style={{ width:'100%' }}>
                        <span style={{ fontWeight:600 }}>{d.name} {d.isCritical ? <Badge status="error" text="สำคัญ" />: null}</span>
                        <span style={{ fontSize:12, color:'#555' }}>{d.formatted}</span>
                        <span style={{ fontSize:12 }}>
                          <Badge color={d.diffDays <=0 ? 'red':'blue'} text={d.diffDays>0 ? `เหลือ ${d.diffDays} วัน` : (d.diffHours>0 ? `เหลือ ${d.diffHours} ชั่วโมง` : 'ใกล้ครบกำหนด')} />
                        </span>
                      </Space>
                    </div>
                  )) : <span style={{ fontSize:12 }}>ไม่มีกำหนดการที่ต้องส่งภายใน 7 วันนี้</span>
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
