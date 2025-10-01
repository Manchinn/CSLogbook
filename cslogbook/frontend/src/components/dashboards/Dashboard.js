import React, { useState, useEffect, useMemo } from "react";
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
  Skeleton,
  List,
  Tag,
  Typography,
  Tooltip,
  Empty,
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
  TeamOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { adminService } from "../../services/adminService";
import { teacherService } from "../../services/teacherService";
import { studentService } from "../../services/studentService";
import { getRoleTheme } from "../../utils/roleTheme";
import useUpcomingDeadlines from "../../hooks/useUpcomingDeadlines";
import dayjs from "../../utils/dayjs";

const { Title, Text } = Typography;

const DEADLINE_STATUS_LABELS = {
  submitted: "ส่งแล้ว",
  submitted_late: "ส่งแล้ว (ล่าช้า)",
  overdue: "เลยกำหนด",
  locked: "ปิดรับ",
  upcoming: "กำลังจะถึง",
  in_window: "เปิดส่ง",
  announcement: "ประกาศ",
};

const DEADLINE_STATUS_COLORS = {
  submitted: "green",
  submitted_late: "orange",
  overdue: "red",
  locked: "magenta",
  upcoming: "blue",
  in_window: "gold",
  announcement: "cyan",
};
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
      adminService
        .getStats()
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
      return () => {
        isMounted = false;
      };
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
                  valueStyle={{
                    color:
                      dashboardStats.documents.pending > 0
                        ? "#faad14"
                        : theme.primary,
                  }}
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
    const navigate = useNavigate();
    const [overview, setOverview] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);

    useEffect(() => {
      let isMounted = true;

      // ดึงข้อมูลสรุปแดชบอร์ดเมื่อผู้ใช้เปิดหน้า เพื่อให้เห็นสถานะล่าสุดของนักศึกษาและงานที่ต้องทำ
      const fetchDashboardOverview = async () => {
        try {
          setIsLoading(true);
          const data = await teacherService.getStats();
          if (!isMounted) return;
          setOverview(data);
          setErrorMessage(null);
        } catch (error) {
          if (!isMounted) return;
          console.error("Error fetching teacher dashboard:", error);
          const fallbackMessage =
            error?.message || "ไม่สามารถโหลดข้อมูลแดชบอร์ดอาจารย์ได้";
          setErrorMessage(fallbackMessage);
          message.error(fallbackMessage);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };

      fetchDashboardOverview();

      return () => {
        isMounted = false;
      };
    }, []);

    const adviseeStats = overview?.advisees || {
      total: 0,
      internshipInProgress: 0,
      projectInProgress: 0,
      internshipEligible: 0,
      projectEligible: 0,
    };
    const projectStats = overview?.projects || { active: 0, completed: 0 };
    const meetingQueue = overview?.queues?.meetingLogs || {
      pending: 0,
      items: [],
    };
    const documentQueue = overview?.queues?.documents || { pending: 0 };
    const deadlines = overview?.deadlines || [];
    const upcomingMeetings = overview?.upcomingMeetings || [];
    const teacherMeta = overview?.teacher || {};
    const fallbackName = [userData?.firstName, userData?.lastName]
      .filter(Boolean)
      .join(" ");

    const resolveRelatedLabel = (related) => {
      switch (related) {
        case "internship":
          return "ฝึกงาน";
        case "project":
        case "project1":
        case "project2":
          return "โครงงาน";
        default:
          return "ทั่วไป";
      }
    };

    const quickActions = useMemo(() => {
      const fallbackActions = [
        {
          key: "meetingApprovals",
          label: "บันทึกการพบ",
          description: "ตรวจสอบบันทึกการพบจากนักศึกษา",
          path: "/teacher/meeting-approvals",
        },
        {
          key: "documentApprovals",
          label: "เอกสารที่รออนุมัติ",
          description: "ติดตามคำขอและไฟล์ที่รออนุมัติ",
          path: "/approve-documents",
        },
        {
          key: "deadlines",
          label: "กำหนดส่งสำคัญ",
          description: "ดูปฏิทินเส้นตายที่เกี่ยวข้อง",
          path: "/teacher/deadlines/calendar",
        },
      ];
      const source = overview?.quickActions || fallbackActions;

      // ผูกจำนวนงานที่ค้างกับปุ่มทางลัด เพื่อให้ UI สื่อสารข้อมูลจริงแบบเรียลไทม์
      return source.map((action) => {
        let pendingCount = action.pendingCount;
        if (pendingCount === undefined || pendingCount === null) {
          if (action.key === "meetingApprovals") {
            pendingCount = meetingQueue.pending || 0;
          } else if (action.key === "documentApprovals") {
            pendingCount = documentQueue.pending || 0;
          } else if (action.key === "deadlines") {
            pendingCount = deadlines.length;
          } else {
            pendingCount = 0;
          }
        }
        return { ...action, pendingCount };
      });
    }, [
      overview,
      meetingQueue.pending,
      documentQueue.pending,
      deadlines.length,
    ]);

    const actionIcons = {
      meetingApprovals: <ClockCircleOutlined />,
      documentApprovals: <FileTextOutlined />,
      deadlines: <CalendarOutlined />,
    };

    const formatDateTime = (value) => {
      if (!value) return "-";
      const parsed = dayjs(value).tz();
      if (!parsed.isValid()) return "-";
      return parsed.format("D MMM BBBB เวลา HH:mm น.");
    };

    const pendingTagColor = (days) => {
      if (days >= 7) return "red";
      if (days >= 3) return "volcano";
      if (days >= 1) return "orange";
      return "gold";
    };

    const displayName = teacherMeta.name || fallbackName || "อาจารย์";
    const teacherEmail = teacherMeta.email || "";

    return (
      <div className="teacher-dashboard">
        <Space direction="vertical" size="large" className="common-space-style">
          <Card
            className="teacher-hero-card"
            bordered={false}
            style={{ background: theme.gradient, color: theme.text }}
          >
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 2 }} title />
            ) : (
              <div className="teacher-hero-content">
                <Space direction="vertical" size={8}>
                  <Text className="teacher-hero-greeting">
                    ยินดีต้อนรับกลับ
                  </Text>
                  <Title
                    level={3}
                    style={{ color: theme.text, marginBottom: 0 }}
                  >
                    {displayName}
                  </Title>
                  {teacherEmail ? (
                    <Tooltip title={teacherEmail}>
                      <Text type="secondary" className="teacher-hero-email">
                        {teacherEmail}
                      </Text>
                    </Tooltip>
                  ) : null}
                  <Space size={[8, 8]} wrap>
                    <Tag color={theme.badge} className="teacher-hero-tag">
                      นักศึกษาทั้งหมด {adviseeStats.total} คน
                    </Tag>
                    <Tag color="gold" className="teacher-hero-tag">
                      ฝึกงานกำลังดำเนิน {adviseeStats.internshipInProgress} คน
                    </Tag>
                    <Tag color="purple" className="teacher-hero-tag">
                      โครงงานที่ดูแล {projectStats.active} โครงการ
                    </Tag>
                    <Tag color="green" className="teacher-hero-tag">
                      โครงงานเสร็จสิ้น {projectStats.completed} โครงการ
                    </Tag>
                  </Space>
                </Space>
                <Button
                  type="primary"
                  ghost
                  icon={<TeamOutlined />}
                  className="teacher-hero-button"
                  onClick={() => navigate("/teacher/meeting-approvals")}
                >
                  เปิดงานที่ต้องตรวจ
                </Button>
              </div>
            )}
          </Card>

          {errorMessage ? (
            <Alert
              className="dashboard-alert"
              type="warning"
              showIcon
              message="ไม่สามารถโหลดข้อมูลบางส่วน"
              description={errorMessage}
            />
          ) : null}

          <Row gutter={[16, 16]} className="stats-row">
            <Col xs={24} sm={12} md={6}>
              <Card hoverable className="stats-card" bordered={false}>
                <Statistic
                  title="นักศึกษาที่ปรึกษา"
                  value={adviseeStats.total}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: theme.primary }}
                  loading={isLoading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable className="stats-card" bordered={false}>
                <Statistic
                  title="ฝึกงานระหว่างดำเนินการ"
                  value={adviseeStats.internshipInProgress}
                  prefix={<BookOutlined />}
                  valueStyle={{ color: "#faad14" }}
                  loading={isLoading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable className="stats-card" bordered={false}>
                <Statistic
                  title="โครงงานระหว่างดำเนินการ"
                  value={projectStats.active}
                  prefix={<ProjectOutlined />}
                  valueStyle={{ color: "#722ed1" }}
                  loading={isLoading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable className="stats-card" bordered={false}>
                <Statistic
                  title="งานที่รออนุมัติ"
                  value={meetingQueue.pending + (documentQueue.pending || 0)}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: "#cf1322" }}
                  loading={isLoading}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title="งานที่ต้องดำเนินการ"
            className="teacher-quick-actions"
            bordered={false}
          >
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : (
              <List
                dataSource={quickActions}
                locale={{
                  emptyText: (
                    <Empty description="ไม่มีกิจกรรมที่ต้องดำเนินการ" />
                  ),
                }}
                renderItem={(action) => (
                  <List.Item
                    key={action.key}
                    className="teacher-quick-action-item"
                    extra={
                      <Space size="small">
                        <Tag
                          color={action.pendingCount ? theme.badge : "default"}
                          bordered={false}
                        >
                          {action.pendingCount} รายการ
                        </Tag>
                        <Button
                          type="primary"
                          ghost
                          className="teacher-hero-button"
                          onClick={() => navigate(action.path)}
                        >
                          เปิด
                        </Button>
                      </Space>
                    }
                  >
                    <List.Item.Meta
                      avatar={
                        <div className="teacher-quick-action-icon">
                          {actionIcons[action.key] || <ClockCircleOutlined />}
                        </div>
                      }
                      title={<Text strong>{action.label}</Text>}
                      description={
                        <span className="teacher-quick-action-desc">
                          {action.description}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title={`บันทึกการพบที่รออนุมัติ (${meetingQueue.pending || 0})`}
                bordered={false}
              >
                {isLoading ? (
                  <Skeleton active paragraph={{ rows: 4 }} />
                ) : meetingQueue.items.length ? (
                  <List
                    dataSource={meetingQueue.items}
                    renderItem={(item) => (
                      <List.Item
                        key={item.logId}
                        className="teacher-queue-item"
                        actions={[
                          <Button
                            key="open"
                            type="link"
                            onClick={() =>
                              navigate("/teacher/meeting-approvals")
                            }
                          >
                            ดูรายละเอียด
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space size="small" wrap>
                              <Text strong>
                                {item.projectTitleTh ||
                                  item.projectTitleEn ||
                                  "โครงงานไม่ระบุ"}
                              </Text>
                              {item.projectCode ? (
                                <Tag color="blue" bordered={false}>
                                  {item.projectCode}
                                </Tag>
                              ) : null}
                            </Space>
                          }
                          description={
                            <Space
                              direction="vertical"
                              size={0}
                              className="teacher-queue-description"
                            >
                              <span>{item.meetingTitle || "บันทึกการพบ"}</span>
                              <span className="teacher-queue-meta">
                                ส่งเมื่อ {formatDateTime(item.submittedAt)}
                              </span>
                              <span className="teacher-queue-meta">
                                สถานะ:{" "}
                                <Tag
                                  color={pendingTagColor(item.pendingDays)}
                                  bordered={false}
                                >
                                  {item.pendingDays
                                    ? `ค้าง ${item.pendingDays} วัน`
                                    : "รอตรวจ"}
                                </Tag>
                              </span>
                              {item.students?.length ? (
                                <span className="teacher-queue-meta">
                                  นักศึกษา:{" "}
                                  {item.students
                                    .map(
                                      (student) =>
                                        student.name || student.studentCode
                                    )
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              ) : null}
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="ไม่มีบันทึกที่รออนุมัติ" />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="กำหนดส่งใกล้ถึง" bordered={false}>
                {isLoading ? (
                  <Skeleton active paragraph={{ rows: 4 }} />
                ) : deadlines.length ? (
                  <List
                    dataSource={deadlines}
                    renderItem={(deadline) => (
                      <List.Item
                        key={deadline.id}
                        className="teacher-deadline-item"
                      >
                        <List.Item.Meta
                          title={
                            <Space size="small" wrap>
                              <Text strong>{deadline.name}</Text>
                              <Tag
                                color={deadline.isCritical ? "red" : "blue"}
                                bordered={false}
                              >
                                {resolveRelatedLabel(deadline.relatedTo)}
                              </Tag>
                              <Tag
                                color={
                                  DEADLINE_STATUS_COLORS[deadline.status] ||
                                  "default"
                                }
                                bordered={false}
                              >
                                {DEADLINE_STATUS_LABELS[deadline.status] ||
                                  deadline.status}
                              </Tag>
                            </Space>
                          }
                          description={
                            <Space
                              direction="vertical"
                              size={0}
                              className="teacher-deadline-meta"
                            >
                              <span>
                                ครบกำหนด {formatDateTime(deadline.dueAt)}
                              </span>
                              <span>
                                {deadline.daysLeft > 0
                                  ? `เหลือ ${deadline.daysLeft} วัน (${deadline.hoursLeft} ชั่วโมง)`
                                  : "ครบกำหนดแล้ว"}
                              </span>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="ไม่มีเส้นตายที่ใกล้ถึง" />
                )}
              </Card>
            </Col>
          </Row>

          <Card title="การประชุมที่กำลังจะมาถึง" bordered={false}>
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : upcomingMeetings.length ? (
              <List
                dataSource={upcomingMeetings}
                renderItem={(meeting) => (
                  <List.Item
                    key={meeting.meetingId}
                    className="teacher-meeting-item"
                    actions={[
                      <Button
                        key="detail"
                        type="link"
                        onClick={() => navigate("/teacher/meeting-approvals")}
                      >
                        รายละเอียด
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space size="small" wrap>
                          <Text strong>
                            {meeting.meetingTitle || "การประชุม"}
                          </Text>
                          <Tag color="blue" bordered={false}>
                            {formatDateTime(meeting.meetingDate)}
                          </Tag>
                          <Tag
                            color={meeting.daysLeft > 0 ? "green" : "gold"}
                            bordered={false}
                          >
                            {meeting.daysLeft > 0
                              ? `อีก ${meeting.daysLeft} วัน`
                              : "วันนี้"}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space
                          direction="vertical"
                          size={0}
                          className="teacher-meeting-meta"
                        >
                          <span>
                            โครงงาน:{" "}
                            {meeting.projectTitleTh ||
                              meeting.projectTitleEn ||
                              "ไม่ระบุ"}
                          </span>
                          {meeting.projectCode ? (
                            <span>รหัสโครงงาน: {meeting.projectCode}</span>
                          ) : null}
                          {meeting.students?.length ? (
                            <span>
                              นักศึกษา:{" "}
                              {meeting.students
                                .map(
                                  (student) =>
                                    student.name || student.studentCode
                                )
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          ) : null}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="ยังไม่มีการประชุมที่วางแผนไว้" />
            )}
          </Card>
        </Space>
      </div>
    );
  }

  function StudentView() {
    const navigate = useNavigate();
    const [studentData, setStudentData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { deadlines: upcomingDeadlines, loading: loadingDeadlines } =
      useUpcomingDeadlines({ days: 7 });

    const studentCode = userData?.studentCode; // แยก primitive ให้ hook dependency ชัดเจน
    useEffect(() => {
      let isMounted = true;
      if (studentCode) {
        studentService
          .getStudentInfo(studentCode)
          .then((response) => {
            if (isMounted) {
              setStudentData(response.data);
              setIsLoading(false);
            }
          })
          .catch((error) => {
            console.error("Error fetching student info:", error);
            message.error("ไม่สามารถโหลดข้อมูลนักศึกษาได้");
            setIsLoading(false);
          });
      }
      return () => {
        isMounted = false;
      };
    }, [studentCode]);

    const isEligibleForInternship =
      studentData?.eligibility?.internship?.eligible || false;
    const isEligibleForProject =
      studentData?.eligibility?.project?.eligible || false;

    return (
      <div className="student-dashboard">
        <Space direction="vertical" size="large" className="common-space-style">
          <Row gutter={[16, 16]}>
            {/* สถานะการฝึกงาน */}
            <Col xs={24} sm={12}>
              <Card
                hoverable
                className="eligibility-card"
                style={{ height: "100%" }}
              >
                <Statistic
                  title="สถานะการฝึกงาน"
                  value={isEligibleForInternship ? "มีสิทธิ์" : "ไม่มีสิทธิ์"}
                  valueStyle={{
                    color: isEligibleForInternship ? "#52c41a" : "#ff4d4f",
                  }}
                  prefix={
                    isEligibleForInternship ? (
                      <CheckCircleOutlined />
                    ) : (
                      <ClockCircleOutlined />
                    )
                  }
                  loading={isLoading}
                />
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="ชั้นปี">
                    {studentData?.studentYear || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="หน่วยกิตรวม">
                    {studentData?.totalCredits || 0} หน่วยกิต
                  </Descriptions.Item>
                  <Descriptions.Item label="สถานะ">
                    {studentData?.eligibility?.internship?.message ||
                      "ตรวจสอบหน่วยกิตและชั้นปี"}
                  </Descriptions.Item>
                </Descriptions>
                {isEligibleForInternship && (
                  <Button
                    type="primary"
                    icon={<FormOutlined />}
                    onClick={() => navigate("/internship-registration/flow")}
                    style={{ marginTop: "16px" }}
                  >
                    จัดการฝึกงาน
                  </Button>
                )}
              </Card>
            </Col>

            {/* สถานะโครงงาน */}
            <Col xs={24} sm={12}>
              <Card
                hoverable
                className="eligibility-card"
                style={{ height: "100%" }}
              >
                <Statistic
                  title="สถานะโครงงานพิเศษ"
                  value={isEligibleForProject ? "มีสิทธิ์" : "ไม่มีสิทธิ์"}
                  valueStyle={{
                    color: isEligibleForProject ? "#52c41a" : "#ff4d4f",
                  }}
                  prefix={
                    isEligibleForProject ? (
                      <CheckCircleOutlined />
                    ) : (
                      <ClockCircleOutlined />
                    )
                  }
                  loading={isLoading}
                />
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="ชั้นปี">
                    {studentData?.studentYear || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="หน่วยกิตรวม">
                    {studentData?.totalCredits || 0} หน่วยกิต
                  </Descriptions.Item>
                  <Descriptions.Item label="หน่วยกิตภาควิชา">
                    {studentData?.majorCredits || 0} หน่วยกิต
                  </Descriptions.Item>
                  <Descriptions.Item label="สถานะ">
                    {studentData?.eligibility?.project?.message ||
                      "ตรวจสอบหน่วยกิตและชั้นปี"}
                  </Descriptions.Item>
                </Descriptions>
                {isEligibleForProject && (
                  <Button
                    type="primary"
                    icon={<ProjectOutlined />}
                    onClick={() => navigate("/project/phase1")}
                    style={{ marginTop: "16px" }}
                  >
                    จัดการโครงงานพิเศษ
                  </Button>
                )}
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card
                hoverable
                className="upcoming-deadlines-card"
                style={{ height: "100%" }}
                title={
                  <Space>
                    <ClockCircleOutlined /> กำหนดส่งใกล้ถึง
                  </Space>
                }
              >
                {loadingDeadlines ? (
                  "กำลังโหลด..."
                ) : upcomingDeadlines.length ? (
                  upcomingDeadlines.slice(0, 5).map((d) => (
                    <div key={d.id} style={{ marginBottom: 8 }}>
                      <Space
                        direction="vertical"
                        size={0}
                        style={{ width: "100%" }}
                      >
                        <span style={{ fontWeight: 600 }}>
                          {d.name}{" "}
                          {d.isCritical ? (
                            <Badge status="error" text="สำคัญ" />
                          ) : null}
                        </span>
                        <span style={{ fontSize: 12, color: "#555" }}>
                          {d.formatted}
                        </span>
                        <span style={{ fontSize: 12 }}>
                          <Badge
                            color={d.diffDays <= 0 ? "red" : "blue"}
                            text={
                              d.diffDays > 0
                                ? `เหลือ ${d.diffDays} วัน`
                                : d.diffHours > 0
                                ? `เหลือ ${d.diffHours} ชั่วโมง`
                                : "ใกล้ครบกำหนด"
                            }
                          />
                        </span>
                      </Space>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: 12 }}>
                    ไม่มีกำหนดการที่ต้องส่งภายใน 7 วันนี้
                  </span>
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
