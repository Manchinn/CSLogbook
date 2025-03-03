import React from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, Statistic, Alert, Space } from 'antd';
import { FileTextOutlined, ProjectOutlined, CheckCircleOutlined } from '@ant-design/icons';
import './Dashboard.css';

const TeacherDashboard = React.memo(({ userData, navigate }) => {
  const handleCardClick = React.useCallback((route) => {
    navigate(route);
  }, [navigate]);

  return (
    <Space direction="vertical" size="large" className="common-space-style">
      <Alert
        message={`สวัสดี อาจารย์${userData.firstName} ${userData.lastName}`}
        type="info"
        showIcon
        className="common-alert-style"
      />
      <Row gutter={[16, 16]}>
        {[
          {
            title: "เอกสารรอตรวจสอบ",
            route: "/review-documents",
            icon: <FileTextOutlined />
          },
          {
            title: "โปรเจคที่ปรึกษา",
            route: "/advise-project",
            icon: <ProjectOutlined />
          },
          {
            title: "รออนุมัติ",
            route: "/approve-documents",
            icon: <CheckCircleOutlined />
          }
        ].map(item => (
          <Col xs={24} sm={8} key={item.route}>
            <Card 
              hoverable 
              onClick={() => handleCardClick(item.route)} 
              className="common-card-style"
            >
              <Statistic title={item.title} value={0} prefix={item.icon} />
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
});

TeacherDashboard.propTypes = {
  userData: PropTypes.shape({
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired
  }).isRequired,
  navigate: PropTypes.func.isRequired
};

export default TeacherDashboard;
