import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, message, Spin, Form, InputNumber, Button, Avatar, Tag, Statistic, Tooltip } from 'antd';
import { UserOutlined, BookOutlined, ProjectOutlined } from '@ant-design/icons';
import axios from 'axios';
import { calculateStudentYear, isEligibleForProject, isEligibleForInternship } from './utils/studentUtils';

// Memoized Sub-components
const StudentAvatar = React.memo(({ student, studentYear }) => (
  <Row gutter={[0, 24]}>
    <Col span={24}>
      <Card style={{ textAlign: 'center' }}>
        <Avatar size={120} icon={<UserOutlined />} />
        <h2 style={{ marginTop: 16 }}>{student.firstName} {student.lastName}</h2>
        <p>{student.studentID}</p>
        <Tag color="blue">ชั้นปีที่ {studentYear}</Tag>
      </Card>
    </Col>
    <Col span={24}>
      <Card title="ข้อมูลติดต่อ">
        <p><strong>อีเมล:</strong> {student.email}</p>
      </Card>
    </Col>
  </Row>
));

const StudentInfo = React.memo(({ student, onEdit }) => (
  <Card 
    title="ข้อมูลการศึกษา" 
    extra={<Button type="primary" onClick={onEdit}>แก้ไขข้อมูล</Button>}
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
        <Tooltip title={student.internshipMessage}>
          <Tag color={student.isEligibleForInternship ? 'green' : 'red'}>
            {student.isEligibleForInternship ? 'มีสิทธิ์ฝึกงาน' : 'ยังไม่มีสิทธิ์ฝึกงาน'}
          </Tag>
        </Tooltip>
      </Col>
      <Col span={12}>
        <Tooltip title={student.projectMessage}>
          <Tag color={student.isEligibleForProject ? 'green' : 'red'}>
            {student.isEligibleForProject ? 'มีสิทธิ์ทำโปรเจค' : 'ยังไม่มีสิทธิ์ทำโปรเจค'}
          </Tag>
        </Tooltip>
      </Col>
    </Row>
  </Card>
));

const StudentEditForm = React.memo(({ form, onFinish, onCancel }) => (
  <Card style={{ marginTop: 24 }}>
    <Form form={form} onFinish={onFinish} layout="vertical">
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

  const fetchStudent = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('กรุณาเข้าสู่ระบบ');
        navigate('/login');
        return;
      }

      const { data } = await axios.get(`http://localhost:5000/api/students/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (data) {
        const totalCredits = parseInt(data.totalCredits) || 0;
        const majorCredits = parseInt(data.majorCredits) || 0;
        const studentYear = calculateStudentYear(data.studentID);
        
        const projectEligibility = isEligibleForProject(studentYear, totalCredits, majorCredits);
        const internshipEligibility = isEligibleForInternship(studentYear, totalCredits);

        setStudent({
          ...data,
          totalCredits,
          majorCredits,
          isEligibleForProject: projectEligibility.eligible,
          isEligibleForInternship: internshipEligibility.eligible,
          projectMessage: projectEligibility.message,
          internshipMessage: internshipEligibility.message
        });

        form.setFieldsValue({ totalCredits, majorCredits });
      }
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, form]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const handleEdit = useCallback(async (values) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/students/${id}`,
        values,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.status === 200) {
        message.success('แก้ไขข้อมูลนักศึกษาเรียบร้อย');
        setEditing(false);
        await fetchStudent();
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการแก้ไขข้อมูลนักศึกษา');
      console.error('Error:', error);
    }
  }, [id, fetchStudent]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><Spin size="large" /></div>;
  if (!student) return <div>ไม่พบนักศึกษา</div>;

  const studentYear = calculateStudentYear(student.studentID);

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
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
              onEdit={() => setEditing(true)}
            />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default StudentProfile;