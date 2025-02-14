import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, message, Spin } from 'antd';
import axios from 'axios';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error('Error fetching student data:', error);
        message.error('เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id, navigate]);

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
      </Card>
    </div>
  );
};

export default StudentProfile;