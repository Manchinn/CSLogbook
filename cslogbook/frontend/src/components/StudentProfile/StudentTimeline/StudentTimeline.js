import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Row,
  Col,
  Badge,
  Space,
  Alert,
  Button,
  Spin,
  message,
  Input,
  Form,
  Modal,
} from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { timelineService } from "../../../services/timelineService";
import { studentService } from "../../../services/studentService";
import {
  isEligibleForInternship,
  isEligibleForProject,
} from "../../../utils/studentUtils";
import { DEFAULT_STUDENT_DATA, DEFAULT_PROGRESS_DATA } from "./helpers";
import NextAction from "./NextAction";
import Notifications from "./Notifications";
import EducationPath from "./EducationPath";
import InternshipSection from "./InternshipSection";
import ProjectSection from "./ProjectSection";
import StudyStatistics from "./StudyStatistics";
import ImportantDeadlines from "./ImportantDeadlines";
import { SearchOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const StudentTimeline = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  let studentIdToUse = id || localStorage.getItem("studentId");

  if (studentIdToUse && studentIdToUse.length <= 4) {
    studentIdToUse = parseInt(studentIdToUse);
  }

  const [student, setStudent] = useState(DEFAULT_STUDENT_DATA);
  const [progress, setProgress] = useState(DEFAULT_PROGRESS_DATA);
  const [notifications, setNotifications] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStudentSearchModal, setShowStudentSearchModal] = useState(false);
  const [searchStudentId, setSearchStudentId] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // ฟังก์ชั่นค้นหานักศึกษาด้วยรหัสใหม่
  const searchStudent = async () => {
    if (!searchStudentId || searchStudentId.trim() === "") {
      message.warning("กรุณากรอกรหัสนักศึกษา");
      return;
    }

    setSearchLoading(true);
    try {
      // อาจเรียกใช้ API สำหรับตรวจสอบนักศึกษาก่อน
      const studentExists = await timelineService.checkStudentExists(searchStudentId);
      
      if (studentExists && studentExists.success) {
        // ถ้าพบนักศึกษา บันทึกรหัสลงใน localStorage และเปลี่ยนหน้า
        localStorage.setItem("studentId", searchStudentId);
        navigate(`/student/timeline/${searchStudentId}`);
        window.location.reload(); // รีโหลดเพื่อใช้รหัสนักศึกษาใหม่
      } else {
        message.error("ไม่พบข้อมูลนักศึกษาในระบบ");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการค้นหา: " + error.message);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("=== TIMELINE DATA ===");
        console.log("Fetching timeline for student:", studentIdToUse);

        const response = await timelineService.getStudentTimeline(studentIdToUse);
        console.log("API Response:", response);

        if (response && response.success) {
          if (response.data && response.data.student) {
            // บันทึก studentId จริงลงใน localStorage เพื่อใช้ต่อไป
            if (response.data.student.studentId) {
              localStorage.setItem("studentId", response.data.student.studentId);
            } else if (response.data.student.id) {
              localStorage.setItem("studentId", response.data.student.id);
            }
            
            setStudent((prev) => ({
              ...prev,
              ...response.data.student,
            }));
          }

          if (response.data && response.data.progress) {
            setProgress(response.data.progress);
          }

          if (response.data && response.data.upcomingDeadlines) {
            setDeadlines(response.data.upcomingDeadlines);
          }

          if (response.data && response.data.notifications) {
            setNotifications(response.data.notifications);
          }
        } else {
          setError(response?.message || "ไม่สามารถโหลดข้อมูล timeline ได้");
          console.log("API response error:", response?.message);
          
          // เมื่อไม่พบข้อมูลนักศึกษา แสดง modal ค้นหา
          if (response?.message?.includes("ไม่พบนักศึกษา") || 
              response?.message?.includes("Student not found")) {
            setShowStudentSearchModal(true);
          }
        }
      } catch (error) {
        console.error("Error fetching timeline data:", error);
        setError(error.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    if (studentIdToUse) {
      fetchTimelineData();
    } else {
      setError("ไม่พบรหัสนักศึกษา");
      setLoading(false);
      setShowStudentSearchModal(true);
    }
  }, [studentIdToUse, navigate]);

  // Modal ค้นหานักศึกษา
  const studentSearchModal = (
    <Modal
      title="ค้นหาข้อมูลนักศึกษา"
      open={showStudentSearchModal}
      onCancel={() => setShowStudentSearchModal(false)}
      footer={[
        <Button 
          key="search" 
          type="primary" 
          icon={<SearchOutlined />}
          loading={searchLoading}
          onClick={searchStudent}
        >
          ค้นหา
        </Button>,
      ]}
    >
      <p>ระบบไม่พบข้อมูลนักศึกษารหัส {studentIdToUse}</p>
      <p>คุณสามารถค้นหาข้อมูลด้วยรหัสนักศึกษาอื่น</p>
      <Form layout="vertical">
        <Form.Item label="รหัสนักศึกษา">
          <Input 
            placeholder="กรอกรหัสนักศึกษา" 
            value={searchStudentId} 
            onChange={(e) => setSearchStudentId(e.target.value)}
            onPressEnter={searchStudent}
          />
        </Form.Item>
      </Form>
    </Modal>
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spin size="large" tip="กำลังโหลดข้อมูล..." />
      </div>
    );
  }
  
  return (
    <>
      <div className="student-timeline">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card className="dashboard-card" variant="outlined">
              <Row gutter={16} align="middle">
                <Col span={16}>
                  <Title level={4}>แนวทางการศึกษาของคุณ</Title>
                  <Paragraph>
                    ติดตามขั้นตอนและความคืบหน้าตลอดการศึกษาในระบบฝึกงานและโครงงานพิเศษ
                  </Paragraph>
                </Col>
                <Col span={8} style={{ textAlign: "right" }}>
                  <Space direction="vertical" align="end">
                    <Text strong>
                      {(() => {
                        let studentYear = null;

                        if (
                          student &&
                          student.studentYear &&
                          typeof student.studentYear === "object" &&
                          student.studentYear.year
                        ) {
                          studentYear = student.studentYear.year;
                        } else if (
                          student &&
                          typeof student.studentYear === "number" &&
                          student.studentYear > 0
                        ) {
                          studentYear = student.studentYear;
                        } else if (
                          student &&
                          typeof student.year === "number" &&
                          student.year > 0
                        ) {
                          studentYear = student.year;
                        } else if (student && student.studentCode) {
                          try {
                            const currentDate = new Date();
                            const currentYear = currentDate.getFullYear() + 543;
                            const studentCodePrefix =
                              student.studentCode.substring(0, 2);
                            const enrollmentYear =
                              parseInt(studentCodePrefix) + 2500;
                            studentYear = currentYear - enrollmentYear + 1;

                            if (studentYear < 1) studentYear = 1;
                            if (studentYear > 8) studentYear = 8;
                          } catch (e) {
                            console.error("Error calculating student year:", e);
                            studentYear = null;
                          }
                        }

                        if (!studentYear) {
                          return "ชั้นปีที่ไม่ระบุ";
                        }

                        const currentDate = new Date();
                        const currentMonth = currentDate.getMonth() + 1;

                        let semester = "";
                        if (currentMonth >= 1 && currentMonth <= 5) {
                          semester = "ภาคเรียนที่ 2";
                        } else if (currentMonth >= 6 && currentMonth <= 7) {
                          semester = "ภาคฤดูร้อน";
                        } else {
                          semester = "ภาคเรียนที่ 1";
                        }

                        const thaiYear = currentDate.getFullYear() + 543;
                        const academicYear =
                          currentMonth >= 8 ? thaiYear : thaiYear - 1;

                        return `ชั้นปีที่ ${studentYear} (${semester} ปีการศึกษา ${academicYear})`;
                      })()}
                    </Text>
                    <Badge
                      status={
                        student.status === "normal"
                          ? "success"
                          : student.status === "EXTENDED" ||
                            student.status === "extended"
                          ? "warning"
                          : student.status === "probation"
                          ? "warning"
                          : student.status === "retired"
                          ? "error"
                          : "warning"
                      }
                      text={
                        student.status === "normal"
                          ? "นักศึกษาปกติ"
                          : student.status === "EXTENDED" ||
                            student.status === "extended"
                          ? "นักศึกษาตกค้าง"
                          : student.status === "probation"
                          ? "นักศึกษาวิทยทัณฑ์"
                          : student.status === "retired"
                          ? "พ้นสภาพนักศึกษา"
                          : "นักศึกษาตกค้าง"
                      }
                    />
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
          <Col span={24}>
            <NextAction student={student} progress={progress} />
          </Col>
        </Row>

        {notifications && notifications.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            <Col span={24}>
              <Card>
                <Notifications notifications={notifications} />
              </Card>
            </Col>
          </Row>
        )}

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <EducationPath student={student} progress={progress} />
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <InternshipSection student={student} progress={progress} />
          </Col>

          <Col xs={24} lg={12}>
            <ProjectSection student={student} progress={progress} />
          </Col>
        </Row>

        {deadlines && deadlines.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card>
                <ImportantDeadlines deadlines={deadlines} />
              </Card>
            </Col>
          </Row>
        )}

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <StudyStatistics student={student} />
          </Col>
        </Row>
      </div>
      {studentSearchModal}
    </>
  );
};

export default StudentTimeline;
