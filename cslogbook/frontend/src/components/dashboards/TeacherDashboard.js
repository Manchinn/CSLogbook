import React from 'react';
import { Card, Row, Col, Statistic, Alert, Space } from 'antd';
import { FileTextOutlined, ProjectOutlined, CheckCircleOutlined } from '@ant-design/icons';

const TeacherDashboard = ({ userData, navigate }) => {
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
        message={`สวัสดี อาจารย์${userData.firstName} ${userData.lastName}`}
        type="info"
        showIcon
        style={commonAlertStyle}
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/review-documents')} style={commonCardStyle}>
            <Statistic
              title="เอกสารรอตรวจสอบ"
              value={0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/advise-project')} style={commonCardStyle}>
            <Statistic
              title="โปรเจคที่ปรึกษา"
              value={0}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/approve-documents')} style={commonCardStyle}>
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
};

export default TeacherDashboard;
