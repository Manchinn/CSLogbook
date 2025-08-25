import React, { useState, useEffect, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, message, Spin, Form, Result, Button, Tabs } from "antd";
import { calculateStudentYear } from "../../utils/studentUtils"; // อาจยังใช้ในไฟล์อื่นคงไว้
import StudentDocumentsSection from './studentDocuments/StudentDocumentsSection';
import { studentService } from "../../services/studentService";
import { AuthContext } from "../../contexts/AuthContext";
import { useStudentEligibility } from "../../contexts/StudentEligibilityContext";
import StudentAvatar from "./StudentAvatar";
import StudentInfo from "./StudentInfo";
import StudentTimeline from "./StudentTimeline/index";
import StudentEditForm from "./StudentEditForm";
import PDPAModal from "./PDPAModal";
import CreditsGuideModal from "./CreditsGuideModal";
import {
  ScheduleOutlined,
  FileDoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import "./styles.css";

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const { userData } = useContext(AuthContext);
  const { refreshEligibility } = useStudentEligibility();
  const [pdpaModalVisible, setPdpaModalVisible] = useState(false);
  const [secondModalVisible, setSecondModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  // สร้าง state สำหรับเก็บเกณฑ์
  const [eligibilityCriteria, setEligibilityCriteria] = useState({
    internshipBaseCredits: 86,
    projectBaseCredits: 97,
    projectMajorBaseCredits: 59,
  });

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    try {
      const response = await studentService.getStudentInfo(id);
      if (response.success) {
        const totalCredits = parseInt(response.data.totalCredits);
        const majorCredits = parseInt(response.data.majorCredits);

        // Map ข้อมูลจาก user ถ้ามี
        const { user = {} } = response.data;

        // เพิ่มการดึงข้อกำหนดสำหรับการตรวจสอบสิทธิ์
        const requirements = response.data.requirements || {};

        // ข้อมูลสิทธิ์จาก backend (ถ้ามี)
        const eligibility = response.data.eligibility || {
          internship: { eligible: false, message: "ไม่มีข้อมูลสิทธิ์" },
          project: { eligible: false, message: "ไม่มีข้อมูลสิทธิ์" },
        };

        setStudent({
          ...response.data,
          firstName: response.data.firstName || user.firstName || "",
          lastName: response.data.lastName || user.lastName || "",
          email: response.data.email || user.email || "",
          totalCredits,
          majorCredits,
          studentYear: response.data.studentYear, // ใช้ค่าจาก backend โดยตรง

          // เพิ่มข้อมูลเกี่ยวกับสิทธิ์และข้อกำหนด
          requirements,
          isEligibleForInternship: eligibility.internship?.eligible,
          isEligibleForProject: eligibility.project?.eligible,
          internshipMessage: eligibility.internship?.message,
          projectMessage: eligibility.project?.message,
          
          // เพิ่มข้อมูลสำหรับ StudentAvatar - ใช้ข้อมูลจาก backend โดยตรง
          isEligibleInternship: response.data.isEligibleInternship,
          isEnrolledInternship: response.data.isEnrolledInternship,
          internshipStatus: response.data.internshipStatus,
        });

        // Debug log เพื่อตรวจสอบข้อมูลที่ได้รับ
        console.log('🔍 [StudentProfile] Complete API Response Analysis:', {
          fullResponse: response,
          directFromAPI: {
            isEligibleInternship: response.data.isEligibleInternship,
            isEnrolledInternship: response.data.isEnrolledInternship,
            internshipStatus: response.data.internshipStatus
          },
          eligibilityObject: eligibility,
          finalStudentData: {
            isEligibleInternship: response.data.isEligibleInternship,
            isEnrolledInternship: response.data.isEnrolledInternship,
            internshipStatus: response.data.internshipStatus
          }
        });

        form.setFieldsValue({ totalCredits, majorCredits });

        // อัพเดตค่าเกณฑ์จาก response
        setEligibilityCriteria({
          internshipBaseCredits:
            response.data.requirements?.internshipBaseCredits,
          projectBaseCredits: response.data.requirements?.projectBaseCredits,
          projectMajorBaseCredits:
            response.data.requirements?.projectMajorBaseCredits,
        });
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      message.error(
        "ไม่สามารถโหลดข้อมูลนักศึกษา: " +
          (error.message || "กรุณาลองใหม่อีกครั้ง")
      );
    } finally {
      setLoading(false);
    }
  }, [id, navigate, form]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const handleEdit = useCallback(
    async (values) => {
      try {
        // ส่งค่า isEligibleInternship และ isEligibleProject ไปยัง backend
        const response = await studentService.updateStudent(id, {
          ...values,
        });

        if (response.success) {
          message.success("แก้ไขข้อมูลสำเร็จ");
          setEditing(false);
          await fetchStudent();

          // เพิ่ม: อัพเดตข้อมูลสิทธิ์ทันทีหลังจากบันทึกข้อมูลสำเร็จ
          if (userData?.role === "student") {
            // ถ้าผู้แก้ไขเป็นนักศึกษา ให้รีเฟรชสิทธิ์
            refreshEligibility(true); // true = แสดงข้อความแจ้งเตือน
          }
        }
      } catch (error) {
        message.error("ไม่สามารถแก้ไขข้อมูล: " + error.message);
      }
    },
    [id, fetchStudent, userData, refreshEligibility]
  );

  const handleEditWithConsent = () => {
    setPdpaModalVisible(true);
  };

  const handleSecondModalOk = () => {
    setSecondModalVisible(false);
    setEditing(true);
  };

  const handleSecondModalCancel = () => {
    setSecondModalVisible(false);
    setPdpaModalVisible(true);
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <Spin size="large">
          <div style={{ padding: "50px", textAlign: "center" }}>
            กำลังโหลดข้อมูล...
          </div>
        </Spin>
      </div>
    );
  }

  if (!student) {
    return (
      <Result
        status="404"
        title="ไม่พบข้อมูลนักศึกษา"
        subTitle="ไม่พบข้อมูลนักศึกษาที่ค้นหา กรุณาตรวจสอบรหัสนักศึกษาอีกครั้ง"
        extra={
          <Button type="primary" onClick={() => navigate(-1)}>
            ย้อนกลับ
          </Button>
        }
      />
    );
  }

  const canEdit =
    userData?.role === "admin" ||
    userData?.role === "teacher" ||
    (userData?.role === "student" && userData?.studentCode === id);

  // สร้าง tabItems สำหรับใช้กับ items prop
  const tabItems = [
    {
      key: "info",
      label: (
        <span>
          <UserOutlined /> ข้อมูลนักศึกษา
        </span>
      ),
      children: editing ? (
        <StudentEditForm
          form={form}
          onFinish={handleEdit}
          onCancel={() => setEditing(false)}
          initialValues={student}
          requirements={student.requirements}
          eligibilityCriteria={eligibilityCriteria}
        />
      ) : (
        <StudentInfo
          student={student}
          onEdit={handleEditWithConsent}
          canEdit={canEdit}
        />
      ),
    },
    {
      key: "timeline",
      label: (
        <span>
          <ScheduleOutlined /> ไทม์ไลน์การศึกษา
        </span>
      ),
      children: <StudentTimeline />,
    },
    {
      key: "documents",
      label: (
        <span>
          <FileDoneOutlined /> เอกสาร
        </span>
      ),
  children: <StudentDocumentsSection studentId={student.studentId} />,
    },
  ];

  return (
    <div className="container">
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} lg={6}>
          <StudentAvatar student={student} studentYear={student.studentYear} />
        </Col>
        <Col xs={24} lg={18}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="profile-tabs"
            items={tabItems}
          />
        </Col>
      </Row>

      <PDPAModal
        visible={pdpaModalVisible}
        onOk={() => {
          setPdpaModalVisible(false);
          setSecondModalVisible(true);
        }}
        onCancel={() => setPdpaModalVisible(false)}
      />

      <CreditsGuideModal
        visible={secondModalVisible}
        onOk={handleSecondModalOk}
        onCancel={handleSecondModalCancel}
      />
    </div>
  );
};

export default StudentProfile;
