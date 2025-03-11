import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, message, Spin, Form, InputNumber, Button, Avatar, Tag, Statistic, Tooltip, Result } from 'antd';
import { UserOutlined, BookOutlined, ProjectOutlined } from '@ant-design/icons';
import axios from 'axios';
import { calculateStudentYear, isEligibleForProject, isEligibleForInternship } from '../utils/studentUtils';
import { studentService } from '../services/studentService';
import { AuthContext } from '../contexts/AuthContext';

// Memoized Sub-components
const StudentAvatar = React.memo(({ student, studentYear }) => {
  // แก้ไขการแสดงผล studentYear
  const displayYear = typeof studentYear === 'object' ? studentYear.year : studentYear;
  
  return (
    <Row gutter={[0, 24]}>
      <Col span={24}>
        <Card style={{ textAlign: 'center' }}>
          <Avatar size={120} icon={<UserOutlined />} />
          <h2 style={{ marginTop: 16 }}>{student.firstName} {student.lastName}</h2>
          <p>{student.studentCode}</p>
          <Tag color="blue">ชั้นปีที่ {displayYear}</Tag>
        </Card>
      </Col>
      <Col span={24}>
        <Card title="ข้อมูลติดต่อ">
          <p><strong>อีเมล:</strong> {student.email}</p>
        </Card>
      </Col>
    </Row>
  );
});

const StudentInfo = React.memo(({ student, onEdit, canEdit }) => {
  // แปลง message เป็น string
  const getMessageString = (message) => {
    if (!message) return '';
    if (typeof message === 'object') return message.message || '';
    return message;
  };

  return (
    <Card 
      title="ข้อมูลการศึกษา" 
      extra={canEdit && <Button type="primary" onClick={onEdit}>แก้ไขข้อมูล</Button>}
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
            <Tag color={student.isEligibleForInternship ? 'green' : 'red'}>
              {student.isEligibleForInternship ? 'มีสิทธิ์ฝึกงาน' : 'ยังไม่มีสิทธิ์ฝึกงาน'}
            </Tag>
          </Tooltip>
        </Col>
        <Col span={12}>
          <Tooltip title={getMessageString(student.projectMessage)}>
            <Tag color={student.isEligibleForProject ? 'green' : 'red'}>
              {student.isEligibleForProject ? 'มีสิทธิ์ทำโปรเจค' : 'ยังไม่มีสิทธิ์ทำโปรเจค'}
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
      initialValues={{ // เพิ่ม initialValues
        totalCredits: 0,
        majorCredits: 0
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name="totalCredits" 
            label="หน่วยกิตรวมสะสม"
            rules={[
              { required: true, message: 'กรุณากรอกหน่วยกิตรวม' },
              {
                validator: async (_, value) => {
                  const numValue = parseInt(value);
                  if (isNaN(numValue) || numValue < 0 || numValue > 142) {
                    throw new Error('หน่วยกิตไม่ถูกต้อง');
                  }
                }
              }
            ]}
          >
            <InputNumber min={0} max={142} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name="majorCredits" 
            label="หน่วยกิตภาควิชา"
            dependencies={['totalCredits']}
            rules={[
              { required: true, message: 'กรุณากรอกหน่วยกิตภาควิชา' },
              {
                validator: async (_, value) => {
                  const numValue = parseInt(value);
                  const totalCredits = form.getFieldValue('totalCredits');
                  if (isNaN(numValue) || numValue < 0 || numValue > totalCredits) {
                    throw new Error('หน่วยกิตภาควิชาไม่ถูกต้อง');
                  }
                }
              }
            ]}
          >
            <InputNumber min={0} max={form.getFieldValue('totalCredits')} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item>
        <Button type="primary" htmlType="submit">บันทึก</Button>
        <Button onClick={onCancel} style={{ marginLeft: 8 }}>ยกเลิก</Button>
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

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    try {
      const response = await studentService.getStudentInfo(id);
      
      if (response.success) {
        const totalCredits = parseInt(response.data.totalCredits) || 0;
        const majorCredits = parseInt(response.data.majorCredits) || 0;
        
        // แก้ไขการคำนวณ studentYear
        const yearResult = calculateStudentYear(response.data.studentCode);
        const studentYear = typeof yearResult === 'object' ? yearResult.year : yearResult;
        
        const projectEligibility = isEligibleForProject(studentYear, totalCredits, majorCredits);
        const internshipEligibility = isEligibleForInternship(studentYear, totalCredits);

        setStudent({
          ...response.data,
          totalCredits,
          majorCredits,
          studentYear,
          isEligibleForProject: projectEligibility.eligible,
          isEligibleForInternship: internshipEligibility.eligible,
          projectMessage: typeof projectEligibility.message === 'object' 
            ? projectEligibility.message.message 
            : projectEligibility.message || '',
          internshipMessage: typeof internshipEligibility.message === 'object'
            ? internshipEligibility.message.message
            : internshipEligibility.message || ''
        });

        form.setFieldsValue({ totalCredits, majorCredits });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        message.error('กรุณาเข้าสู่ระบบใหม่');
        navigate('/login');
        return;
      }
      message.error('ไม่สามารถโหลดข้อมูลนักศึกษา: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [id, navigate, form]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const handleEdit = useCallback(async (values) => {
    try {
      // Validate values before submission
      const totalCredits = parseInt(values.totalCredits);
      const majorCredits = parseInt(values.majorCredits);

      if (isNaN(totalCredits) || totalCredits < 0 || totalCredits > 142) {
        message.error('หน่วยกิตรวมต้องอยู่ระหว่าง 0-142');
        return;
      }

      if (isNaN(majorCredits) || majorCredits < 0 || majorCredits > totalCredits) {
        message.error('หน่วยกิตภาควิชาต้องน้อยกว่าหรือเท่ากับหน่วยกิตรวม');
        return;
      }

      const response = await studentService.updateStudent(id, {
        totalCredits,
        majorCredits
      });
      
      if (response.success) {
        message.success('แก้ไขข้อมูลสำเร็จ');
        setEditing(false);
        await fetchStudent(); // Refresh data
      }
    } catch (error) {
      message.error('ไม่สามารถแก้ไขข้อมูล: ' + error.message);
    }
  }, [id, fetchStudent]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 'calc(100vh - 64px)' 
      }}>
        <Spin>
          <div style={{ padding: '50px', textAlign: 'center' }}>
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
  const canEdit = userData?.role === 'admin' || 
               (userData?.role === 'teacher') || 
               (userData?.role === 'student' && userData?.studentCode === id);

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
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
              onEdit={() => {
                form.setFieldsValue({ // เซ็ตค่าเริ่มต้นก่อนเปิด form
                  totalCredits: student.totalCredits,
                  majorCredits: student.majorCredits
                });
                setEditing(true);
              }}
              canEdit={canEdit}
            />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default StudentProfile;