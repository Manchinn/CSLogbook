import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Alert, Space, Button } from 'antd';
import { UserOutlined, ProjectOutlined, TeamOutlined, 
         FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  const [studentStats, setStudentStats] = useState({
    total: 0,
    internshipEligible: 0,
    projectEligible: 0
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // ดึงข้อมูลจาก localStorage
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
    const storedStudentID = localStorage.getItem('studentID');
    
    if (storedStudentID) {
      // ดึงข้อมูลล่าสุดจาก API
      axios.get(`http://localhost:5000/api/students/${storedStudentID}`)
        .then(response => {
          const userData = response.data;
          setUserData({
            firstName: userData.firstName,
            lastName: userData.lastName,
            studentID: userData.studentID,
            isEligibleForInternship: userData.isEligibleForInternship || false,
            isEligibleForProject: userData.isEligibleForProject || false
          });
          
          // อัพเดท localStorage ด้วยข้อมูลล่าสุด
          localStorage.setItem('firstName', userData.firstName);
          localStorage.setItem('lastName', userData.lastName);
          localStorage.setItem('isEligibleForInternship', userData.isEligibleForInternship);
          localStorage.setItem('isEligibleForProject', userData.isEligibleForProject);
        })
        .catch(error => {
          console.error('Error fetching user data:', error);
        });
    }

    // ดึงสถิตินักศึกษาถ้าเป็น admin
    if (storedRole === 'admin') {
      fetchStudentStats();
    }
  }, []);

  const fetchStudentStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/students');
      const students = response.data;
      
      // กรองเฉพาะ role 'student' เท่านั้น
      const onlyStudents = students.filter(user => user.role === 'student');
      
      setStudentStats({
        total: onlyStudents.length,
        internshipEligible: onlyStudents.filter(student => student.isEligibleForInternship).length,
        projectEligible: onlyStudents.filter(student => student.isEligibleForProject).length
      });
    } catch (error) {
      console.error('Error fetching student stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
              value={studentStats.total}
              loading={loading}
              prefix={<TeamOutlined />}
              suffix="คน"
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/students')}>
            <Statistic
              title="มีสิทธิ์ฝึกงาน"
              value={studentStats.internshipEligible}
              loading={loading}
              prefix={<UserOutlined />}
              suffix={`/${studentStats.total} คน`}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/students')}>
            <Statistic
              title="มีสิทธิ์ทำโปรเจค"
              value={studentStats.projectEligible}
              loading={loading}
              prefix={<ProjectOutlined />}
              suffix={`/${studentStats.total} คน`}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Button 
            type="primary" 
            icon={<TeamOutlined />} 
            onClick={() => navigate('/admin/upload')} 
            block
            style={{ height: '40px', fontSize: '16px' }}
          >
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