import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Alert, Space, Button } from 'antd';
import { UserOutlined, ProjectOutlined, TeamOutlined, 
         FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const Dashboard = () => {
  const [role, setRole] = useState('');
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    studentID: '',
    isEligibleForInternship: false,
    isEligibleForProject: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    // ดึงข้อมูลจาก localStorage
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
    setUserData({
      firstName: localStorage.getItem('firstName') || '',
      lastName: localStorage.getItem('lastName') || '',
      studentID: localStorage.getItem('studentID') || '',
      isEligibleForInternship: localStorage.getItem('isEligibleForInternship') === 'true',
      isEligibleForProject: localStorage.getItem('isEligibleForProject') === 'true'
    });
  }, []);

  const StudentDashboard = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        message={`สวัสดี คุณ${userData.firstName} ${userData.lastName}`}
        description={`รหัสนักศึกษา: ${userData.studentID}`}
        type="info"
        showIcon
      />
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="สถานะการฝึกงาน"
              value={userData.isEligibleForInternship ? "มีสิทธิ์" : "ยังไม่มีสิทธิ์"}
              valueStyle={{ color: userData.isEligibleForInternship ? '#3f8600' : '#cf1322' }}
              prefix={userData.isEligibleForInternship ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            />
            {userData.isEligibleForInternship && (
              <Button type="primary" onClick={() => navigate('/internship-status')} 
                      style={{ marginTop: 16 }}>
                จัดการฝึกงาน
              </Button>
            )}
          </Card>
        </Col>
        
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="สถานะโปรเจค"
              value={userData.isEligibleForProject ? "มีสิทธิ์" : "ยังไม่มีสิทธิ์"}
              valueStyle={{ color: userData.isEligibleForProject ? '#3f8600' : '#cf1322' }}
              prefix={userData.isEligibleForProject ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            />
            {userData.isEligibleForProject && (
              <Button type="primary" onClick={() => navigate('/project-status')} 
                      style={{ marginTop: 16 }}>
                จัดการโปรเจค
              </Button>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );

  const TeacherDashboard = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        message={`สวัสดี อาจารย์${userData.firstName} ${userData.lastName}`}
        type="info"
        showIcon
      />
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/review-documents')}>
            <Statistic
              title="เอกสารรอตรวจสอบ"
              value={0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/advise-project')}>
            <Statistic
              title="โปรเจคที่ปรึกษา"
              value={0}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/approve-documents')}>
            <Statistic
              title="รออนุมัติ"
              value={0}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );

  const AdminDashboard = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        message={`สวัสดี ผู้ดูแลระบบ ${userData.firstName} ${userData.lastName}`}
        type="info"
        showIcon
      />
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/students')}>
            <Statistic
              title="จำนวนนักศึกษา"
              value={0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/manage-students')}>
            <Statistic
              title="รอการอนุมัติสิทธิ์"
              value={0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/update-courses')}>
            <Statistic
              title="รายวิชาที่เปิดสอน"
              value={0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Button type="primary" icon={<TeamOutlined />} 
                  onClick={() => navigate('/admin/upload')} block>
            อัปโหลดข้อมูลนักศึกษา (CSV)
          </Button>
        </Col>
      </Row>
    </Space>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>แผงควบคุม</Title>
      {role === 'student' && <StudentDashboard />}
      {role === 'teacher' && <TeacherDashboard />}
      {role === 'admin' && <AdminDashboard />}
    </div>
  );
};

export default Dashboard;