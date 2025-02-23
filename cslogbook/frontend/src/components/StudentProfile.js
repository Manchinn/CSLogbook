import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, message, Spin, Form, Input, Button } from 'antd';
import axios from 'axios';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          message.error('กรุณาเข้าสู่ระบบ');
          navigate('/login');
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/students/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setStudent(response.data);
        form.setFieldsValue(response.data);
      } catch (error) {
        console.error('Error fetching student data:', error);
        message.error('เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id, navigate, form]);

  const handleEdit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/students/${id}`, {
        totalCredits: values.totalCredits !== undefined ? values.totalCredits : null,
        majorCredits: values.majorCredits !== undefined ? values.majorCredits : null
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      message.success('แก้ไขข้อมูลนักศึกษาเรียบร้อย');
      setStudent({ ...student, ...values });
    } catch (error) {
      console.error('Error updating student data:', error);
      message.error('เกิดข้อผิดพลาดในการแก้ไขข้อมูลนักศึกษา');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!student) {
    return <div>ไม่พบนักศึกษา</div>;
  }

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', borderRadius: '8px', maxWidth: 800, margin: '0 auto' }}>
      <Card title="ข้อมูลนักศึกษา" style={{ borderRadius: '8px' }}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="ชื่อ">{student.firstName}</Descriptions.Item>
          <Descriptions.Item label="นามสกุล">{student.lastName}</Descriptions.Item>
          <Descriptions.Item label="รหัสนักศึกษา">{student.studentID}</Descriptions.Item>
          <Descriptions.Item label="อีเมล">{student.email}</Descriptions.Item>
          <Descriptions.Item label="สถานะการฝึกงาน">
            {student.isEligibleForInternship ? 'มีสิทธิ์' : 'ยังไม่มีสิทธิ์'}
          </Descriptions.Item>
          <Descriptions.Item label="สถานะโปรเจค">
            {student.isEligibleForProject ? 'มีสิทธิ์' : 'ยังไม่มีสิทธิ์'}
          </Descriptions.Item>
        </Descriptions>
        <Button type="primary" onClick={() => setEditing(true)} style={{ marginTop: '16px' }}>
          แก้ไขข้อมูล
        </Button>
      </Card>

      {editing && (
        <Card title="แก้ไขข้อมูลนักศึกษา" style={{ borderRadius: '8px', marginTop: '24px' }}>
          <Form form={form} onFinish={handleEdit} layout="vertical">
            <Form.Item name="totalCredits" label="หน่วยกิตรวมสะสม" rules={[{ required: true, message: 'กรุณากรอกหน่วยกิตรวมสะสม' }]}>
              <Input type="number" />
            </Form.Item>
            <Form.Item name="majorCredits" label="หน่วยกิตภาควิชา" rules={[{ required: true, message: 'กรุณากรอกหน่วยกิตภาควิชา' }]}>
              <Input type="number" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                บันทึก
              </Button>
              <Button type="default" onClick={() => setEditing(false)} style={{ marginLeft: '8px' }}>
                ยกเลิก
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
};

export default StudentProfile;