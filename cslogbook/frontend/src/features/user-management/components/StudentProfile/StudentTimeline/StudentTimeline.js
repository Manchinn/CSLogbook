import React, { useState } from "react";
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
import { SearchOutlined } from '@ant-design/icons';
import { InternshipStatusProvider } from 'contexts/InternshipStatusContext';
import { useStudentTimeline } from '../../../hooks/useStudentTimeline';
import EducationPath from "./EducationPath";
import InternshipSection from "./InternshipSection";
import ProjectSection from "./ProjectSection";

const { Title, Text, Paragraph } = Typography;

const StudentTimeline = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  let studentIdToUse = id || localStorage.getItem("studentId");

  if (studentIdToUse && studentIdToUse.length <= 4) {
    studentIdToUse = parseInt(studentIdToUse);
  }

  const {
    student,
    progress,
    loading,
    error,
    showStudentSearchModal,
    setShowStudentSearchModal,
    searchStudent
  } = useStudentTimeline(studentIdToUse);

  const [searchStudentId, setSearchStudentId] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchForm] = Form.useForm();

  // ฟังก์ชั่นค้นหานักศึกษาด้วยรหัสใหม่
  const handleSearchStudent = async () => {
    if (!searchStudentId || searchStudentId.trim() === "") {
      message.warning("กรุณากรอกรหัสนักศึกษา");
      return;
    }

    setSearchLoading(true);
    try {
      const result = await searchStudent(searchStudentId);
      if (result.success) {
        navigate(`/student/timeline/${searchStudentId}`);
      } else {
        message.error(result.message || "ไม่พบข้อมูลนักศึกษาในระบบ");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการค้นหา: " + error.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Modal ค้นหานักศึกษา
  const studentSearchModal = (
    <Modal
      title="ค้นหาข้อมูลนักศึกษา"
      open={showStudentSearchModal}
      onCancel={() => {
        setShowStudentSearchModal(false);
        searchForm.resetFields(); // รีเซ็ต form เมื่อปิด modal
      }}
      footer={[
        <Button
          key="search"
          type="primary"
          icon={<SearchOutlined />}
          loading={searchLoading}
          onClick={handleSearchStudent}
        >
          ค้นหา
        </Button>,
      ]}
    >
      <p>ระบบไม่พบข้อมูลนักศึกษารหัส {studentIdToUse}</p>
      <p>คุณสามารถค้นหาข้อมูลด้วยรหัสนักศึกษาอื่น</p>
        <Form
        form={searchForm} // เชื่อมต่อ form กับ useForm
        layout="vertical"
        onFinish={handleSearchStudent} // ใช้ onFinish แทน onClick
      >
        <Form.Item
          label="รหัสนักศึกษา"
          name="studentId"
          rules={[
            { required: true, message: 'กรุณากรอกรหัสนักศึกษา' },
            { pattern: /^\d+$/, message: 'รหัสนักศึกษาต้องเป็นตัวเลขเท่านั้น' }
          ]}
        >
          <Input
            placeholder="กรอกรหัสนักศึกษา"
            value={searchStudentId}
            onChange={(e) => setSearchStudentId(e.target.value)}
            onPressEnter={() => searchForm.submit()} // ใช้ form.submit()
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
        <Spin size="large" spinning={true} tip="กำลังโหลดข้อมูล...">
          <div style={{ minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>{/* Loading content */}</div>
          </div>
        </Spin>
      </div>
    );
  }

  return (
    <InternshipStatusProvider>
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
                        let studentYear = student && student.studentYear ? student.studentYear : '-';
                        if (!studentYear || studentYear === '-') {
                          return "ชั้นปีที่ไม่ระบุ";
                        }

                        // ใช้ข้อมูลภาคการศึกษาและปีการศึกษาจาก backend
                        let semester = "ภาคการศึกษาไม่ระบุ";
                        let academicYear = "-";

                        if (student && student.academicInfo && !student.academicInfo.error) {
                          semester = student.academicInfo.semesterName || "ภาคการศึกษาไม่ระบุ";
                          academicYear = student.academicInfo.academicYear || "-";
                        } else {
                          // fallback ไปใช้การคำนวณเดิมถ้าไม่มีข้อมูลจาก backend
                          const currentDate = new Date();
                          const currentMonth = currentDate.getMonth() + 1;
                          if (currentMonth >= 1 && currentMonth <= 5) {
                            semester = "ภาคเรียนที่ 2";
                          } else if (currentMonth >= 6 && currentMonth <= 7) {
                            semester = "ภาคฤดูร้อน";
                          } else {
                            semester = "ภาคเรียนที่ 1";
                          }
                          const thaiYear = currentDate.getFullYear() + 543;
                          academicYear = currentMonth >= 8 ? thaiYear : thaiYear - 1;
                        }

                        return `ชั้นปีที่ ${studentYear} (${semester} / ${academicYear})`;
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



        {error && (
          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            <Col span={24}>
              <Alert
                type="error"
                showIcon
                message="ไม่สามารถโหลดข้อมูลได้"
                description={error}
              />
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
            <InternshipSection />
          </Col>

          <Col xs={24} lg={12}>
            <ProjectSection student={student} progress={progress} />
          </Col>
        </Row>


      </div>

      {studentSearchModal}
    </InternshipStatusProvider>

  );
};

export default StudentTimeline;
