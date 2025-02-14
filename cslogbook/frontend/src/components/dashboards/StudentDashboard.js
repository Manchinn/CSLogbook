import React from 'react';
import { Card, Row, Col, Statistic, Alert, Space, Button } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const StudentDashboard = ({ userData, navigate }) => {
  const commonCardStyle = {
    width: "100%",
    maxWidth: "90%",
    padding: 10,
    borderRadius: 10,
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    margin: "20px auto",
  };

  const commonAlertStyle = {
    width: "100%",
    maxWidth: "50%",
    marginLeft: "30px",
    borderRadius: '10px',
  };

  const commonSpaceStyle = {
    width: "100%",
    maxWidth: "90%",
    marginLeft: "30px",
  };

  return (
    <Space direction="vertical" size="large" style={commonSpaceStyle}>
      <Alert
        message={`สวัสดี คุณ${userData.firstName} ${userData.lastName}`}
        description={`รหัสนักศึกษา: ${userData.studentID}`}
        type="info"
        showIcon
        style={commonAlertStyle}
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card style={commonCardStyle}>
            <Statistic
              title="สถานะการฝึกงาน"
              value={userData.isEligibleForInternship ? "มีสิทธิ์" : "ยังไม่มีสิทธิ์"}
              valueStyle={{ color: userData.isEligibleForInternship ? '#3f8600' : '#cf1322' }}
              prefix={userData.isEligibleForInternship ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            />
            {userData.isEligibleForInternship && (
              <Button type="primary" onClick={() => navigate('/internship-terms')} 
                      style={{ marginTop: 16 }}>
                จัดการฝึกงาน
              </Button>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card style={commonCardStyle}>
            <Statistic
              title="สถานะโปรเจค"
              value={userData.isEligibleForProject ? "มีสิทธิ์" : "ยังไม่มีสิทธิ์"}
              valueStyle={{ color: userData.isEligibleForProject ? '#3f8600' : '#cf1322' }}
              prefix={userData.isEligibleForProject ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            />
            {userData.isEligibleForProject && (
              <Button type="primary" onClick={() => navigate('/project-proposal')} 
                      style={{ marginTop: 16 }}>
                จัดการโปรเจค
              </Button>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default StudentDashboard;
