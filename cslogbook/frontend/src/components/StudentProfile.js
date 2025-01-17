import React, { useState, useEffect } from 'react';
import { Card, Typography, Descriptions, Spin, Alert, Tag,Avatar,Row,Col } from 'antd';
import {
  UserOutlined
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;

const StudentProfile = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams(); // รับ id จาก URL parameter

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        console.log('Fetching student data for ID:', id); // Debug log
        setLoading(true);
        // ใช้ API endpoint ที่มีอยู่แล้วจาก mockStudentData
        const response = await axios.get(`http://localhost:5000/api/students/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });        console.log('Response:', response.data); // Debug log
        setStudent(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('ไม่พบข้อมูลนักศึกษา');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStudentData();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="ไม่พบข้อมูล"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  const headerStyle = {
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    padding: '24px',
    borderRadius: '8px 8px 0 0',
    position: 'relative',
    height: '200px',
    display: 'flex',
    alignItems: 'flex-end',
    marginBottom: '60px'
  };

  const avatarContainerStyle = {
    position: 'absolute',
    left: '24px',
    bottom: '-40px',
    background: '#fff',
    padding: '4px',
    borderRadius: '50%',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
  };

  return (
    <Card bordered={false} style={{ margin: '24px' }}>
      {/* Header Section */}
      <div style={headerStyle}>
        <div style={avatarContainerStyle}>
          <Avatar 
            size={96} 
            icon={<UserOutlined />} 
            style={{ background: '#1890ff' }}
          />
        </div>
      </div>

      {/* Profile Content */}
      <div style={{ padding: '0 24px 24px' }}>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Title level={3}>
              {student.firstName} {student.lastName}
            </Title>
            <Tag color="blue">{student.role?.toUpperCase()}</Tag>
          </Col>
        </Row>

        <Descriptions 
          layout="vertical" 
          column={{ xs: 1, sm: 2, md: 2 }}
          style={{ marginTop: '24px' }}
        >
          <Descriptions.Item label="Student ID">
            <span style={{ fontSize: '16px' }}>{student.studentID}</span>
          </Descriptions.Item>
          
          <Descriptions.Item label="Email">
            <span style={{ fontSize: '16px' }}>{student.email}</span>
          </Descriptions.Item>
          
          <Descriptions.Item label="Internship Status">
            <Tag color={student.isEligibleForInternship ? 'success' : 'error'}>
              {student.isEligibleForInternship ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Project Status">
            <Tag color={student.isEligibleForProject ? 'success' : 'error'}>
              {student.isEligibleForProject ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Card>
  );
};

export default StudentProfile;