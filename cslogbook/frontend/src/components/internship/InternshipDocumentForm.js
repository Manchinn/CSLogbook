import React, { useState } from "react";
import { Layout, Form, Input, Button, Upload, message, Card, Typography, Space } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import axios from 'axios';
import "./InternshipStyles.css";

const { Title, Paragraph } = Typography;
const { Content } = Layout;

const InternshipDocumentForm = () => {
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append('file', values.file[0].originFileObj);
      formData.append('documentName', values.documentName);
      formData.append('studentName', values.studentName);

      // ส่งข้อมูลไปยัง backend
      await axios.post('http://localhost:5000/api/upload-internship-doc', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // ส่งโทเค็นการตรวจสอบสิทธิ์
        },
      });

      message.success("เอกสารฝึกงานของคุณถูกส่งเรียบร้อยแล้ว!");
      form.resetFields();
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการส่งข้อมูล");
    }
  };

  return (
    <Layout className="layout">
      <Content className="content">
        <Card className="card">
          <Title level={3} className="title">
            ฟอร์มส่งเอกสารฝึกงาน
          </Title>

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="ชื่อเอกสาร"
              name="documentName"
              rules={[{ required: true, message: "กรุณากรอกชื่อเอกสาร!" }]}
            >
              <Input placeholder="กรอกชื่อเอกสาร" />
            </Form.Item>

            <Form.Item
              label="ชื่อ-สกุล นักศึกษา"
              name="studentName"
              rules={[{ required: true, message: "กรุณากรอกชื่อ-สกุล!" }]}
            >
              <Input placeholder="กรอกชื่อ-สกุล นักศึกษา" />
            </Form.Item>

            {/* อัปโหลดเอกสาร PDF */}
            <Form.Item
              label="อัปโหลดเอกสารฝึกงาน"
              name="file"
              valuePropName="fileList"
              getValueFromEvent={(e) => e && e.fileList}
              rules={[{ required: true, message: "กรุณาอัปโหลดเอกสาร!" }]}
            >
              <Upload.Dragger
                name="file"
                beforeUpload={(file) => file.size / 1024 / 1024 <= 10}
                action="/upload.do"
                showUploadList={false}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">คลิกหรือลากไฟล์ PDF เพื่ออัปโหลด</p>
              </Upload.Dragger>
            </Form.Item>

            <Form.Item>
              <Space style={{ display: "flex", justifyContent: "center" }}>
                <Button type="primary" htmlType="submit" size="large">
                  ส่งเอกสารฝึกงาน
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default InternshipDocumentForm;
