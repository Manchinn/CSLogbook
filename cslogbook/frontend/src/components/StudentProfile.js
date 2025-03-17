import React, { useState, useEffect, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  message,
  Spin,
  Form,
  InputNumber,
  Button,
  Avatar,
  Tag,
  Statistic,
  Tooltip,
  Result,
  Modal,
  Space,
  Alert,
} from "antd";
import { UserOutlined, BookOutlined, ProjectOutlined } from "@ant-design/icons";
import axios from "axios";
import {
  calculateStudentYear,
  isEligibleForProject,
  isEligibleForInternship,
} from "../utils/studentUtils";
import { studentService } from "../services/studentService";
import { AuthContext } from "../contexts/AuthContext";
import CreditsImage from "../image/Credits.png";
import CreditsImage2 from "../image/Credits2.png";
import { ClockCircleOutlined } from '@ant-design/icons';
import { Typography, Checkbox } from 'antd';
const { Text } = Typography;
// Memoized Sub-components
const StudentAvatar = React.memo(({ student, studentYear }) => {
  // แก้ไขการแสดงผล studentYear
  const displayYear =
    typeof studentYear === "object" ? studentYear.year : studentYear;

  return (
    <Row gutter={[0, 24]}>
      <Col span={24}>
        <Card style={{ textAlign: "center" }}>
          <Avatar size={120} icon={<UserOutlined />} />
          <h2 style={{ marginTop: 16 }}>
            {student.firstName && student.lastName
              ? `${student.firstName} ${student.lastName}`
              : "ไม่ระบุชื่อ-นามสกุล"}
          </h2>
          <p>{student.studentCode}</p>
          <Tag color="blue">ชั้นปีที่ {displayYear}</Tag>
        </Card>
      </Col>
      <Col span={24}>
        <Card title="ข้อมูลติดต่อ">
          <p>
            <strong>อีเมล:</strong> {student.email || "ไม่ระบุอีเมล"}
          </p>
        </Card>
      </Col>
    </Row>
  );
});

const StudentInfo = React.memo(({ student, onEdit, canEdit }) => {
  // แปลง message เป็น string
  const getMessageString = (message) => {
    if (!message) return "";
    if (typeof message === "object") return message.message || "";
    return message;
  };

  return (
    <Card
      title="ข้อมูลการศึกษา"
      extra={
        canEdit && (
          <Button type="primary" onClick={onEdit}>
            แก้ไขข้อมูล
          </Button>
        )
      }
    >
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Statistic
            title="หน่วยกิตรวมสะสม"
            value={student.totalCredits || 0}
            suffix="หน่วยกิต"
            prefix={<BookOutlined />}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="หน่วยกิตภาควิชา"
            value={student.majorCredits || 0}
            suffix="หน่วยกิต"
            prefix={<ProjectOutlined />}
          />
        </Col>
      </Row>
      <Row style={{ marginTop: 24 }}>
        <Col span={12}>
          <Tooltip title={getMessageString(student.internshipMessage)}>
            <Tag color={student.isEligibleForInternship ? "green" : "red"}>
              {student.isEligibleForInternship
                ? "มีสิทธิ์ฝึกงาน"
                : "ยังไม่มีสิทธิ์ฝึกงาน"}
            </Tag>
          </Tooltip>
        </Col>
        <Col span={12}>
          <Tooltip title={getMessageString(student.projectMessage)}>
            <Tag color={student.isEligibleForProject ? "green" : "red"}>
              {student.isEligibleForProject
                ? "มีสิทธิ์ทำโครงงานพิเศษ"
                : "ยังไม่มีสิทธิ์ทำโครงงานพิเศษ"}
            </Tag>
          </Tooltip>
        </Col>
      </Row>
    </Card>
  );
});

const StudentEditForm = React.memo(({ form, onFinish, onCancel }) => (
  <Card style={{ marginTop: 24 }}>
    <Form
       form={form} // ต้องแน่ใจว่า form prop ถูกส่งมาและใช้งานที่นี่
      onFinish={onFinish}
      layout="vertical"
      initialValues={{
        // เพิ่ม initialValues
        totalCredits: 0,
        majorCredits: 0,
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="totalCredits"
            label="หน่วยกิตรวมสะสม"
            rules={[
              { required: true, message: "กรุณากรอกหน่วยกิตรวม" },
              {
                validator: async (_, value) => {
                  const numValue = parseInt(value);
                  if (isNaN(numValue) || numValue < 0 || numValue > 142) {
                    throw new Error("หน่วยกิตไม่ถูกต้อง");
                  }
                },
              },
            ]}
          >
            <InputNumber min={0} max={142} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="majorCredits"
            label="หน่วยกิตภาควิชา"
            dependencies={["totalCredits"]}
            rules={[
              { required: true, message: "กรุณากรอกหน่วยกิตภาควิชา" },
              {
                validator: async (_, value) => {
                  const numValue = parseInt(value);
                  const totalCredits = form.getFieldValue("totalCredits");
                  if (
                    isNaN(numValue) ||
                    numValue < 0 ||
                    numValue > totalCredits
                  ) {
                    throw new Error("หน่วยกิตภาควิชาไม่ถูกต้อง");
                  }
                },
              },
            ]}
          >
            <InputNumber
              min={0}
              max={form.getFieldValue("totalCredits")}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          บันทึก
        </Button>
        <Button onClick={onCancel} style={{ marginLeft: 8 }}>
          ยกเลิก
        </Button>
      </Form.Item>
    </Form>
  </Card>
));

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

  // เพิ่ม state เพื่อเก็บข้อมูลการยินยอม
  const [consentData, setConsentData] = useState(null);

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    try {
      const response = await studentService.getStudentInfo(id);

      
      if (response.success) {
        const totalCredits = parseInt(response.data.totalCredits) || 0;
        const majorCredits = parseInt(response.data.majorCredits) || 0;

        // แก้ไขการคำนวณ studentYear
        const yearResult = calculateStudentYear(response.data.studentCode);
        const studentYear =
          typeof yearResult === "object" ? yearResult.year : yearResult;

        const projectEligibility = isEligibleForProject(
          studentYear,
          totalCredits,
          majorCredits
        );
        const internshipEligibility = isEligibleForInternship(
          studentYear,
          totalCredits
        );

        setStudent({
          ...response.data,
          totalCredits,
          majorCredits,
          studentYear,
          isEligibleForProject: projectEligibility.eligible,
          isEligibleForInternship: internshipEligibility.eligible,
          projectMessage:
            typeof projectEligibility.message === "object"
              ? projectEligibility.message.message
              : projectEligibility.message || "",
          internshipMessage:
            typeof internshipEligibility.message === "object"
              ? internshipEligibility.message.message
              : internshipEligibility.message || "",
        });

        form.setFieldsValue({ totalCredits, majorCredits });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        message.error("กรุณาเข้าสู่ระบบใหม่");
        navigate("/login");
        return;
      }
      message.error(
        "ไม่สามารถโหลดข้อมูลนักศึกษา: " + (error.message || "Unknown error")
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
        const totalCredits = parseInt(values.totalCredits);
        const majorCredits = parseInt(values.majorCredits);

        // ตรวจสอบความถูกต้องของข้อมูล
        if (isNaN(totalCredits) || totalCredits < 0 || totalCredits > 142) {
          message.error("หน่วยกิตรวมต้องอยู่ระหว่าง 0-142");
          return;
        }

        if (isNaN(majorCredits) || majorCredits < 0 || majorCredits > totalCredits) {
          message.error("หน่วยกิตภาควิชาต้องน้อยกว่าหรือเท่ากับหน่วยกิตรวม");
          return;
        }

        // แสดง Modal ยืนยันก่อนบันทึก
        Modal.confirm({
          title: (
            <div style={{ textAlign: 'center', borderBottom: '2px solid #1890ff', paddingBottom: '10px' }}>
              <Text strong style={{ fontSize: '20px' }}>
                การยืนยันความถูกต้องของข้อมูลหน่วยกิต
              </Text>
            </div>
          ),
          width: 700,
          className: 'confirmation-modal',
          icon: null,
          content: (
            <Space direction="vertical" style={{ width: '100%', padding: '20px 0' }}>
              {/* ส่วนแสดงข้อมูล */}
              <Card
                style={{ 
                  marginBottom: 20,
                  backgroundColor: '#fafafa',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: 20,
                  backgroundColor: '#e6f7ff',
                  padding: '12px',
                  borderRadius: '4px'
                }}>
                  <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                    ข้อมูลที่ต้องการบันทึก
                  </Text>
                </div>
                <Row gutter={[24, 24]} justify="space-around">
                  <Col span={11}>
                    <Statistic
                      title={<Text strong>หน่วยกิตรวมสะสม</Text>}
                      value={totalCredits}
                      suffix="หน่วยกิต"
                      valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                      prefix={<BookOutlined style={{ fontSize: '24px' }}/>}
                    />
                  </Col>
                  <Col span={11}>
                    <Statistic
                      title={<Text strong>หน่วยกิตภาควิชา</Text>}
                      value={majorCredits}
                      suffix="หน่วยกิต"
                      valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                      prefix={<ProjectOutlined style={{ fontSize: '24px' }}/>}
                    />
                  </Col>
                </Row>
              </Card>

              {/* ส่วนการยืนยัน */}
              <div style={{ 
                padding: '20px',
                backgroundColor: '#f0f5ff',
                border: '1px solid #1890ff',
                borderRadius: '8px',
                marginBottom: 20
              }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Checkbox>
                    <Text>
                      ข้าพเจ้าได้ตรวจสอบข้อมูลจากระบบ Reg KMUTNB แล้ว และขอรับรองว่าข้อมูลถูกต้องตรงตามความเป็นจริง 
                      หากข้อมูลไม่ถูกต้องจะส่งผลต่อการประเมินสิทธิ์การฝึกงานและโครงงานพิเศษ
                    </Text>
                  </Checkbox>
                </Space>
              </div>

              {/* ส่วนคำเตือน */}
              <Alert
                message={<Text strong style={{ color: '#d4380d' }}>ข้อควรระวัง</Text>}
                description={
                  <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                    <li>การให้ข้อมูลอันเป็นเท็จอาจมีผลต่อสิทธิ์การลงทะเบียนของท่าน</li>
                    <li>กรุณาตรวจสอบความถูกต้องของข้อมูลก่อนการยืนยัน</li>
                  </ul>
                }
                type="error"
                showIcon
                style={{ 
                  marginBottom: 20,
                  border: '1px solid #ff4d4f',
                  borderRadius: '8px'
                }}
              />

              {/* ส่วนแสดงเวลา */}
              <div style={{
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #d9d9d9'
              }}>
                <Space>
                  <ClockCircleOutlined style={{ color: '#1890ff' }} />
                  <Text type="secondary">
                    บันทึกการยืนยัน: {new Date().toLocaleString('th-TH', {
                      timeZone: 'Asia/Bangkok',
                      dateStyle: 'full',
                      timeStyle: 'medium'
                    })}
                  </Text>
                </Space>
              </div>
            </Space>
          ),
          okText: 'ยืนยันการบันทึก',
          cancelText: 'ยกเลิก',
          onOk: async () => {
            // ส่งต่อค่าไปยัง updateStudent ที่มีอยู่เดิม
            const response = await studentService.updateStudent(id, {
              totalCredits,
              majorCredits,
            });

            if (response.success) {
              message.success("แก้ไขข้อมูลสำเร็จ");
              setEditing(false);
              await fetchStudent();
            }
          },
          centered: true,
          maskClosable: false
        });

      } catch (error) {
        message.error("ไม่สามารถแก้ไขข้อมูล: " + error.message);
      }
    },
    [id, fetchStudent]
  );

  const handleEditWithConsent = () => {
    setPdpaModalVisible(true);
  };

  const handleSecondModalCancel = () => {
    setSecondModalVisible(false);
    setPdpaModalVisible(true);
  };

  // ฟังก์ชันเมื่อผู้ใช้กด "ตกลง" ใน Modal ที่ 2
  const handleSecondModalOk = () => {
    // เก็บข้อมูลการยินยอม
    const consentData = {
      studentId: id,
      studentName: `${student.firstName} ${student.lastName}`, // เพิ่มชื่อนักศึกษา
      consentDate: new Date().toISOString(),
    };
  
    // แสดงข้อมูลการยินยอมใน console
    console.log("ข้อมูลการยินยอม:", consentData);
  
    // ปิด Modal ที่ 2 และเปิดโหมดแก้ไข
    setSecondModalVisible(false);
    setEditing(true);
    form.setFieldsValue({
      totalCredits: student.totalCredits,
      majorCredits: student.majorCredits,
    });
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

  const studentYear = calculateStudentYear(student.studentCode);

  // เพิ่มการตรวจสอบสิทธิ์ในการแก้ไข
  const canEdit =
    userData?.role === "admin" ||
    userData?.role === "teacher" ||
    (userData?.role === "student" && userData?.studentCode === id);

  return (
    <div
      style={{
        padding: "24px",
        background: "#f0f2f5",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} lg={6}>
          <StudentAvatar student={student} studentYear={studentYear} />
        </Col>
        <Col xs={24} lg={12}>
          {editing ? (
            <StudentEditForm
              form={form}
              onFinish={handleEdit}
              onCancel={() => setEditing(false)}
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
      <Modal
        title="ข้อตกลงการใช้ข้อมูลส่วนบุคคล"
        open={pdpaModalVisible}
        onOk={() => {
          setPdpaModalVisible(false);
          setSecondModalVisible(true);
        }}
        onCancel={() => setPdpaModalVisible(false)}
        okText="ยอมรับและดำเนินการต่อ"
        cancelText="ยกเลิก"
      >
        <div style={{ marginBottom: 16 }}>
          <h4>การแก้ไขข้อมูลการศึกษา</h4>
          <p>ข้อมูลที่ท่านกำลังแก้ไขเป็นข้อมูลสำคัญที่ใช้ในการประเมินสิทธิ์:</p>
          <ul>
            <li>การลงทะเบียนฝึกงาน</li>
            <li>การลงทะเบียนโครงงานพิเศษ</li>
          </ul>
          <p>ข้อมูลดังกล่าวจะถูกนำไปใช้เพื่อ:</p>
          <ul>
            <li>ตรวจสอบคุณสมบัติการลงทะเบียน</li>
            <li>ประเมินความพร้อมในการฝึกงานและทำโครงงานพิเศษ</li>
            <li>วิเคราะห์ข้อมูลทางการศึกษา</li>
          </ul>
          <p style={{ marginTop: 16, fontWeight: "bold" }}>
            กรุณาตรวจสอบความถูกต้องของข้อมูลก่อนทำการแก้ไข
            เนื่องจากจะมีผลต่อการประเมินสิทธิ์ของท่าน
          </p>
        </div>
      </Modal>

      <Modal
        title="วิธีการตรวจสอบหน่วยกิตใน Reg KMUTNB"
        open={secondModalVisible}
        onOk={handleSecondModalOk}
        onCancel={handleSecondModalCancel}
        okText="ตกลง"
        cancelText="ย้อนกลับ"
        width={600}
      >
        <p>ขั้นตอนการตรวจสอบหน่วยกิตของท่าน</p>

        <Row gutter={16}>
          <Col span={12}>
            <p>
              <strong>1. หน่วยกิตที่สะสม</strong>
            </p>
            <ul>
              <li>
                <strong>เข้าสู่ระบบ</strong> Reg KMUTNB
              </li>
              <li>
                ไปที่เมนู <strong>ข้อมูลผลการศึกษา</strong>
              </li>
              <li>
                เลือก <strong>ตรวจสอบจบ</strong>
              </li>
              <li>
                <strong>ดูหน่วยกิตที่ผ่าน</strong>
              </li>
            </ul>
          </Col>

          <Col span={12}>
            <strong>วิธีการตรวจสอบ : หน่วยกิตที่สะสม</strong>
            <img
              src={CreditsImage}
              alt="รูปภาพประกอบ"
              style={{
                width: "100%",
                borderRadius: "8px",
                display: "block",
                margin: "auto",
              }}
            />
          </Col>
        </Row>
        <br />
        <Row gutter={16}>
          <Col span={12}>
            <p>
              <strong>2.หน่วยกิตรวมวิชาภาค (รายวิชา 0406xxxxx)</strong>
            </p>
            <ul>
              <li>
                <strong>เข้าสู่ระบบ</strong> Reg KMUTNB
              </li>
              <li>
                ไปที่เมนู <strong>ข้อมูลผลการศึกษา</strong>
              </li>
              <li>
                เลือก <strong>ตรวจสอบจบ</strong>
              </li>
              <li>
                <strong>แสดงรายวิชาทั้งหลักสูตร </strong>
              </li>
              <li>
                <strong>นำ </strong>หน่วยกิตวิชาบังคับและหน่วยกิตวิชาเลือกมารวมกัน
              </li>
              
                
              
            </ul>
          </Col>

          <Col span={12}>
            <strong>วิธีการตรวจสอบ : หน่วยกิตรวมวิชาภาค</strong>
            <img
              src={CreditsImage2}
              alt="รูปภาพประกอบ"
              style={{
                width: "100%",
                borderRadius: "8px",
                display: "block",
                margin: "auto",
              }}
            />
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default StudentProfile;