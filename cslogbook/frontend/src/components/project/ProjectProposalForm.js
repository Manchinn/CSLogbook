import React, { useState } from "react";
import { Layout, Form, Input, Button, Select, Space, Card, Typography, Upload,message } from "antd";
import { useNavigate } from "react-router-dom";
import { InboxOutlined } from "@ant-design/icons";
const { Title, Paragraph } = Typography;
const { Option } = Select;
const { Content } = Layout;

const ProjectProposalForm = () => {
  const [isAccepted, setIsAccepted] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // เมื่อยอมรับเงื่อนไขแล้ว
  const handleAcceptConditions = () => {
    setIsAccepted(true);
  };

  const handleSubmit = async (values) => {
    try {
      // ส่งข้อมูลไปยัง backend หรือส่งอีเมล
      console.log(values);
      message.success("คำขอเสนอหัวข้อโครงงานของคุณถูกส่งเรียบร้อยแล้ว!");
      form.resetFields();
      navigate("/next-step"); // เปลี่ยนเส้นทางไปหน้าอื่นหลังจากส่งฟอร์ม
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการส่งข้อมูล");
    }
  };

  // ถ้ายังไม่ยอมรับเงื่อนไข จะแสดงหน้าเงื่อนไข
  if (!isAccepted) {
    return (
      <Content
        style={{
          padding: "24px",
          margin: 0,
          minHeight: 280,
          background: "#f8f8f8",
          borderRadius: "8px",
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: "90%",
            padding: 10,
            borderRadius: 10,
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            margin: "20px auto",
          }}
        >
          <Title level={2}>เงื่อนไขการทำโครงงานพิเศษ</Title>
          <Paragraph style={{ textAlign: "left", fontSize: "16px" }}>
            - นักศึกษาจะมีสิทธิ์เสนอหัวข้อโครงงานพิเศษได้ ต้องสอบผ่านข้อสอบรวม ไม่ต่ำกว่า 95 คะแนน และต้องไม่ขาดเกณฑ์ในภาควิชาของภาคครูไม่ต่ำกว่า 57 หน่วยกิจ
            <br />
            - แต่ละหัวข้อโครงงาน ส่งเพียงครั้งเดียวเท่านั้น
          </Paragraph>

          <Button
            type="primary"
            onClick={handleAcceptConditions}
            style={{ marginTop: "10px", fontSize: "18px", padding: "20px" }}
          >
            ยอมรับเงื่อนไข
          </Button>
        </Card>
      </Content>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Content
        style={{
          padding: "24px",
          margin: 0,
          minHeight: 280,
          background: "#f8f8f8",
          borderRadius: "8px",
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: "90%",
            padding: 10,
            borderRadius: 10,
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            margin: "20px auto",
          }}
        >
          <Title level={3} style={{ textAlign: "left", marginBottom: 20 }}>
            ฟอร์มเสนอหัวข้อโครงงานพิเศษ
          </Title>

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="ชื่อโครงงานภาษาไทย"
              name="projectNameTH"
              rules={[{ required: true, message: "กรุณากรอกชื่อโครงงาน!" }]}
            >
              <Input placeholder="กรอกชื่อโครงงานภาษาไทย" />
            </Form.Item>

            <Form.Item
              label="ชื่อโครงงานภาษาอังกฤษ"
              name="projectNameEN"
              rules={[{ required: true, message: "กรุณากรอกชื่อโครงงาน!" }]}
            >
              <Input placeholder="กรอกชื่อโครงงานภาษาอังกฤษ" />
            </Form.Item>

            <Form.Item
              label="รหัสนักศึกษา คนที่ 1"
              name="studentId1"
              rules={[{ required: true, message: "กรุณากรอกรหัสนักศึกษา!" }]}
            >
              <Input placeholder="กรอกรหัสนักศึกษา คนที่ 1" />
            </Form.Item>

            <Form.Item
              label="ชื่อ-สกุล นักศึกษา คนที่ 1"
              name="studentName1"
              rules={[{ required: true, message: "กรุณากรอกชื่อ-สกุล!" }]}
            >
              <Input placeholder="กรอกชื่อ-สกุล นักศึกษา คนที่ 1" />
            </Form.Item>

            <Form.Item
              label="ประเภทนักศึกษา คนที่ 1"
              name="studentType1"
              rules={[{ required: true, message: "กรุณาเลือกประเภทนักศึกษา!" }]}
            >
              <Select>
                <Option value="regular">นักศึกษาปกติ</Option>
                <Option value="csb">นักศึกษาจากโครงการ CSB</Option>
              </Select>
            </Form.Item>

            {/* อัปโหลดเอกสาร PDF */}
            <Form.Item
                label="อัปโหลดเอกสารโครงงาน"
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
                  ส่งคำขออนุมัติ
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default ProjectProposalForm;
