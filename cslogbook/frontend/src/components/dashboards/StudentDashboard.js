import React from 'react';
import { Card, Row, Col, Statistic, Alert, Space, Button } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import './Dashboard.css';

const StudentDashboard = ({ userData, navigate }) => {
  return (
    <Space direction="vertical" size="large" className="common-space-style">
      <Alert
        message={`สวัสดี คุณ${userData.firstName} ${userData.lastName}`}
        description={`รหัสนักศึกษา: ${userData.studentID}`}
        type="info"
        showIcon
        className="common-alert-style"
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card className="common-card-style">
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
          <Card className="common-card-style">
            <Statistic
              title="สถานะโปรเจค"
              value={userData.isEligibleForProject ? "มีสิทธิ์" : "ยังไม่มีสิทธิ์"}
              valueStyle={{ color: userData.isEligibleForProject ? '#3f8600' : '#cf1322' }}
              prefix={userData.isEligibleForProject ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            />
            {userData.isEligibleForProject && (
              <Button type="primary" onClick={() => navigate('/project-proposal')} 
                      className="ant-btn-primary">
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
