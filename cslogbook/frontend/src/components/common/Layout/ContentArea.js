import React from "react";
import { Row, Col, Card } from "antd";

const ContentArea = () => {
  console.log("ContentArea is rendered"); // ตรวจสอบว่า log นี้แสดงหรือไม่
  return (
    <div style={{ padding: "20px" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card title="ข้อมูล 1">รายละเอียด 1</Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="ข้อมูล 2">รายละเอียด 2</Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="ข้อมูล 3">รายละเอียด 3</Card>
        </Col>
      </Row>
    </div>
  );
};

export default ContentArea;