import React, { useState } from 'react';
import { Form, Input, Button, Row, Col, Typography, Layout } from 'antd';
import { EditOutlined, SaveOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Content } = Layout;

const CompanyInfo = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: 'Chinnakrit',
    address: '1518 ถนน ประชาราษฎร์1 วงศ์สว่าง เขตบางซื่อ กรุงเทพมหานคร 10800',
    phone: '098-123-4567',
    email: 's6404062610294@email.kmutnb.ac.th',
  });

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = () => {
    // ส่งข้อมูล formData ไปยัง backend หรือทำการบันทึกอื่น ๆ ได้ที่นี่
    console.log('Data saved:', formData);
    setIsEditing(false);
  };

  return (
    <Content
      style={{
        margin: '24px 16px',
        padding: 24,
        minHeight: 280,
        background: '#ffffff',
        borderRadius: '8px',
      }}
    >
      <Title level={4} style={{ marginBottom: '20px' }}>
        ข้อมูลสถานประกอบการ
      </Title>
      <Form layout="vertical">
        <Row gutter={24}>
          <Col xs={24} sm={12}>
            <Form.Item label="ชื่อสถานประกอบการ">
              <Input
                name="companyName"
                value={formData.companyName}
                readOnly={!isEditing}
                onChange={handleInputChange}
                style={{ backgroundColor: isEditing ? '#fff' : '#e0e0e0' }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="ที่อยู่">
              <Input
                name="address"
                value={formData.address}
                readOnly={!isEditing}
                onChange={handleInputChange}
                style={{ backgroundColor: isEditing ? '#fff' : '#e0e0e0' }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col xs={24} sm={12}>
            <Form.Item label="เบอร์โทรศัพท์">
              <Input
                name="phone"
                value={formData.phone}
                readOnly={!isEditing}
                onChange={handleInputChange}
                style={{ backgroundColor: isEditing ? '#fff' : '#e0e0e0' }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="อีเมล์">
              <Input
                name="email"
                value={formData.email}
                readOnly={!isEditing}
                onChange={handleInputChange}
                style={{ backgroundColor: isEditing ? '#fff' : '#e0e0e0' }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16} justify="start">
          <Col>
            {isEditing ? (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                style={{ backgroundColor: '#4CAF50', borderColor: '#4CAF50' }}
                onClick={handleSave}
              >
                บันทึก
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<EditOutlined />}
                style={{ backgroundColor: '#FFC107', borderColor: '#FFC107' }}
                onClick={toggleEdit}
              >
                แก้ไข
              </Button>
            )}
          </Col>
        </Row>
      </Form>
    </Content>
  );
};

export default CompanyInfo;
