import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, Statistic, Alert, Space, Button } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import './Dashboard.css';

const StudentDashboard = React.memo(({ userData, navigate }) => {
  // Memoize การคำนวณสถานะ
  const { internshipStatus, projectStatus } = useMemo(() => ({
    internshipStatus: {
      value: userData.isEligibleForInternship ? "มีสิทธิ์" : "ยังไม่มีสิทธิ์",
      color: userData.isEligibleForInternship ? '#3f8600' : '#cf1322'
    },
    projectStatus: {
      value: userData.isEligibleForProject ? "มีสิทธิ์" : "ยังไม่มีสิทธิ์",
      color: userData.isEligibleForProject ? '#3f8600' : '#cf1322'
    }
  }), [userData.isEligibleForInternship, userData.isEligibleForProject]);

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
              value={internshipStatus.value}
              valueStyle={{ color: internshipStatus.color }}
              prefix={userData.isEligibleForInternship ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            />
            {userData.isEligibleForInternship && (
              <Button type="primary" onClick={() => navigate('/internship-terms')} 
                      >
                จัดการฝึกงาน
              </Button>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card className="common-card-style">
            <Statistic
              title="สถานะโปรเจค"
              value={projectStatus.value}
              valueStyle={{ color: projectStatus.color }}
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
});

StudentDashboard.propTypes = {
  userData: PropTypes.shape({
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    studentID: PropTypes.string.isRequired,
    isEligibleForInternship: PropTypes.bool.isRequired,
    isEligibleForProject: PropTypes.bool.isRequired
  }).isRequired,
  navigate: PropTypes.func.isRequired
};

export default StudentDashboard;
