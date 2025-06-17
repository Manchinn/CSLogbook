import React from 'react';
import { Row, Col, Card, Avatar, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import './styles.css';

const StudentAvatar = React.memo(({ student, studentYear }) => {
  const displayYear =
    typeof studentYear === "object" ? studentYear.year : studentYear;

  return (
    <Row gutter={[16, 24]}>
      <Col span={24}>
        <Card className="avatarCard">
          <Avatar size={120} icon={<UserOutlined />} />
          <h2 style={{ marginTop: 16 }}>
            {(student.firstName || student.lastName)
              ? `${student.firstName || ""} ${student.lastName || ""}`.trim()
              : "ไม่ระบุชื่อ-นามสกุล"}
          </h2>
          <p>{student.studentCode}</p>
          <Tag color="blue">ชั้นปีที่ {displayYear}</Tag>
        </Card>
      </Col>
      <Col span={24}>
        <Card title="ข้อมูลติดต่อ">
          <p>
            <strong>อีเมล:</strong> {(student.email && student.email.trim()) ? student.email : "ไม่ระบุอีเมล"}
          </p>
        </Card>
      </Col>
    </Row>
  );
});

export default StudentAvatar;