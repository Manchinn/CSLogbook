import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, message, Spin, Form, Result, Button } from "antd";
import { calculateStudentYear } from "../../utils/studentUtils";
import { studentService } from "../../services/studentService";
import { AuthContext } from "../../contexts/AuthContext";
import StudentAvatar from './StudentAvatar';
import StudentInfo from './StudentInfo';
import StudentEditForm from './StudentEditForm';
import PDPAModal from './PDPAModal';
import CreditsGuideModal from './CreditsGuideModal';
import './styles.css';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const { userData } = useContext(AuthContext);
  const [pdpaModalVisible, setPdpaModalVisible] = useState(false);
  const [secondModalVisible, setSecondModalVisible] = useState(false);

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    try {
      const response = await studentService.getStudentInfo(id);
      if (response.success) {
        const totalCredits = parseInt(response.data.totalCredits) || 0;
        const majorCredits = parseInt(response.data.majorCredits) || 0;
        const yearResult = calculateStudentYear(response.data.studentCode);
        
        setStudent({
          ...response.data,
          totalCredits,
          majorCredits,
          studentYear: yearResult
        });
        
        form.setFieldsValue({ totalCredits, majorCredits });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        message.error("กรุณาเข้าสู่ระบบใหม่");
        navigate("/login");
        return;
      }
      message.error("ไม่สามารถโหลดข้อมูลนักศึกษา: " + (error.message || "Unknown error"));
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
      }
    } catch (error) {
      message.error("ไม่สามารถแก้ไขข้อมูล: " + error.message);
    }
  }, [id, fetchStudent]);

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
        <Col xs={24} lg={12}>
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