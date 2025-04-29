import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, message, Spin, Form, Result, Button, Tabs } from "antd";
import { calculateStudentYear } from "../../utils/studentUtils";
import { studentService } from "../../services/studentService";
import { AuthContext } from "../../contexts/AuthContext";
import { useStudentEligibility } from "../../contexts/StudentEligibilityContext";
import StudentAvatar from './StudentAvatar';
import StudentInfo from './StudentInfo';
import StudentTimeline from './StudentTimeline';
import StudentEditForm from './StudentEditForm';
import PDPAModal from './PDPAModal';
import CreditsGuideModal from './CreditsGuideModal';
import { BookOutlined, ScheduleOutlined, FileDoneOutlined } from '@ant-design/icons';
import './styles.css';

const { TabPane } = Tabs;

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
  const [activeTab, setActiveTab] = useState('info');

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    try {
      const response = await studentService.getStudentInfo(id);
      if (response.success) {
        const totalCredits = parseInt(response.data.totalCredits) || 0;
        const majorCredits = parseInt(response.data.majorCredits) || 0;
        const yearResult = calculateStudentYear(response.data.studentCode);
  
        // Map ข้อมูลจาก user ถ้ามี
        const { user = {} } = response.data;
  
        // เพิ่มการดึงข้อกำหนดสำหรับการตรวจสอบสิทธิ์
        const requirements = response.data.requirements || {};
        
        // ข้อมูลสิทธิ์จาก backend (ถ้ามี)
        const eligibility = response.data.eligibility || {
          internship: { eligible: false, message: "ไม่มีข้อมูลสิทธิ์" },
          project: { eligible: false, message: "ไม่มีข้อมูลสิทธิ์" }
        };
        
        setStudent({
          ...response.data,
          firstName: response.data.firstName || user.firstName || "",
          lastName: response.data.lastName || user.lastName || "",
          email: response.data.email || user.email || "",
          totalCredits,
          majorCredits,
          studentYear: yearResult,
          
          // เพิ่มข้อมูลเกี่ยวกับสิทธิ์และข้อกำหนด
          requirements,
          isEligibleForInternship: eligibility.internship?.eligible || false,
          isEligibleForProject: eligibility.project?.eligible || false,
          internshipMessage: eligibility.internship?.message,
          projectMessage: eligibility.project?.message,
        });
  
        form.setFieldsValue({ totalCredits, majorCredits });
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      message.error("ไม่สามารถโหลดข้อมูลนักศึกษา: " + (error.message || "กรุณาลองใหม่อีกครั้ง"));
    } finally {
      setLoading(false);
    }
  }, [id, navigate, form]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const handleEdit = useCallback(async (values) => {
    try {
      const response = await studentService.updateStudent(id, values);
      if (response.success) {
        message.success("แก้ไขข้อมูลสำเร็จ");
        setEditing(false);
        await fetchStudent();
        
        // เพิ่ม: อัพเดตข้อมูลสิทธิ์ทันทีหลังจากบันทึกข้อมูลสำเร็จ
        if (userData?.role === 'student') {
          // ถ้าผู้แก้ไขเป็นนักศึกษา ให้รีเฟรชสิทธิ์
          refreshEligibility(true);  // true = แสดงข้อความแจ้งเตือน
        }
      }
    } catch (error) {
      message.error("ไม่สามารถแก้ไขข้อมูล: " + error.message);
    }
  }, [id, fetchStudent, userData, refreshEligibility]);

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
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 64px)",
      }}>
        <Spin>
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

  return (
    <div className="container">
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} lg={6}>
          <StudentAvatar 
            student={student} 
            studentYear={student.studentYear} 
          />
        </Col>
        <Col xs={24} lg={18}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} className="profile-tabs">
            <TabPane 
              tab={<span><BookOutlined /> ข้อมูลการศึกษา</span>}
              key="info"
            >
              {editing ? (
                <StudentEditForm
                  form={form}
                  onFinish={handleEdit}
                  onCancel={() => setEditing(false)}
                  initialValues={student}
                />
              ) : (
                <StudentInfo
                  student={student}
                  onEdit={handleEditWithConsent}
                  canEdit={canEdit}
                />
              )}
            </TabPane>
            <TabPane 
              tab={<span><ScheduleOutlined /> ไทม์ไลน์การศึกษา</span>}
              key="timeline"
            >
              <StudentTimeline />
            </TabPane>
            <TabPane 
              tab={<span><FileDoneOutlined /> เอกสาร</span>}
              key="documents"
            >
              <div className="documents-section">
                <p>เอกสารของนักศึกษาจะแสดงในส่วนนี้</p>
              </div>
            </TabPane>
          </Tabs>
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