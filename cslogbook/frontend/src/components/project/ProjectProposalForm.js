import React, { useState } from "react";
import { Layout, Form, Input, Button, Select, Space, Card, Typography, Upload, message } from "antd";
import { useNavigate } from "react-router-dom";
import { InboxOutlined } from "@ant-design/icons";
import "./ProjectProposalForm.css"; // Import the new CSS file

const { Title, Paragraph, Link } = Typography;
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
      <Content className="content">
        <Card className="card">
          <Title level={2}>เงื่อนไขการทำโครงงานพิเศษ</Title>
          <Paragraph className="paragraph">
            - นักศึกษาจะมีสิทธิ์เสนอหัวข้อโครงงานพิเศษได้ ต้องสอบผ่านข้อสอบรวม ไม่ต่ำกว่า 95 คะแนน และต้องไม่ขาดเกณฑ์ในภาควิชาของภาคครูไม่ต่ำกว่า 57 หน่วยกิจ
            <br />
            - แต่ละหัวข้อโครงงาน ส่งเพียงครั้งเดียวเท่านั้น
          </Paragraph>

          <Button type="primary" onClick={handleAcceptConditions} className="accept-button">
            ยอมรับเงื่อนไข
          </Button>
        </Card>
      </Content>
    );
  }

  return (
    <Layout className="layout">
      <Content className="content">
        <Card className="card">
          <Title level={3} className="title">
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
            {/* นักศึกษา คนที่ 2 
            เมื่อใส่รหัสนักศึกษาคนที่2แล้ว จะเช็คว่ามีรหัสนศ, ชื่อ-นามสกุล อยู่ในระบบหรือไม่ 
            และ เช็คเงื่อนไขว่าหากมีการอัปเดตไปที่เจ้าหน้าที่ภาคแล้ว จะไม่ขึ้นฟีเจอร์นี้ให้นศ.อีกคน*/}
            <Form.Item
                label="รหัสนักศึกษา คนที่ 2"
                name="studentId2"
                rules={[{ required: true, message: "กรุณากรอกรหัสนักศึกษา!" }]}
            >
                <Input placeholder="กรอกรหัสนักศึกษา คนที่ 2" />
            </Form.Item>

            <Form.Item
                label="ชื่อ-สกุล นักศึกษา คนที่ 2"
                name="studentName2"
                rules={[{ required: true, message: "กรุณากรอกชื่อ-สกุล!" }]}
            >
                <Input placeholder="กรอกชื่อ-สกุล นักศึกษา คนที่ 2" />
            </Form.Item>

            <Form.Item
                label="ประเภทนักศึกษา คนที่ 2"
                name="studentType2"
                rules={[{ required: true, message: "กรุณาเลือกประเภทนักศึกษา!" }]}
            >
                <Select>
                <Option value="regular">นักศึกษาปกติ</Option>
                <Option value="csb">นักศึกษาจากโครงการ CSB</Option>
                </Select>
            </Form.Item>
            {/* หมวดของโครงงาน */}
            <Form.Item
                label="ระบบหมวด (track) ของโครงงาน"
                name="track"
                rules={[{ required: true, message: "กรุณาเลือกระบบหมวด!" }]}
            >
                <Select>
                <Option value="network_security">Network & Cyber Security</Option>
                <Option value="mobile_web">Mobile and Web Technology</Option>
                <Option value="smart_technology">Smart Technology</Option>
                <Option value="ai">Artificial Intelligence</Option>
                <Option value="games">Games & Multimedia</Option>
                </Select>
            </Form.Item>
            {/* ประเภทของโครงงาน */}
            <Form.Item
                label="ประเภทของโครงงาน"
                name="projectCategory"
                rules={[{ required: true, message: "กรุณาเลือกประเภทของโครงงาน!" }]}
            >
                <Select>
                <Option value="government">ทำให้กับหน่วยงานของรัฐ</Option>
                <Option value="private">ทำให้กับองค์กรภาคเอกชน</Option>
                <Option value="research">คิดค้นขึ้นมาเอง หรือเป็นผลงานวิจัย</Option>
                </Select>
            </Form.Item>

            {/* อัปโหลดเอกสาร PDF */}
            <Form.Item
                label="อัปโหลดเอกสารโครงงาน"
                name="file"
                valuePropName="fileList"
                getValueFromEvent={(e) => e && e.fileList}
                //rules={[{ required: true, message: "กรุณาอัปโหลดเอกสาร!" }]}
            >
                <Form.Item>
                  <Link
                    href="http://cs.kmutnb.ac.th/pdf/student/%E0%B9%82%E0%B8%84%E0%B8%A3%E0%B8%87%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%9E%E0%B8%B4%E0%B9%80%E0%B8%A8%E0%B8%A9,%E0%B8%9B%E0%B8%A3%E0%B8%B4%E0%B8%8D%E0%B8%8D%E0%B8%B2%E0%B8%99%E0%B8%B4%E0%B8%9E%E0%B8%99%E0%B8%98%E0%B9%8C/%E0%B8%84%E0%B8%9E.01_%E0%B9%81%E0%B8%9A%E0%B8%9A%E0%B8%9F%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B8%A1%E0%B9%80%E0%B8%AA%E0%B8%99%E0%B8%AD%E0%B8%AB%E0%B8%B1%E0%B8%A7%E0%B8%82%E0%B9%89%E0%B8%AD%E0%B9%82%E0%B8%84%E0%B8%A3%E0%B8%87%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%9E%E0%B8%B4%E0%B9%80%E0%B8%A8%E0%B8%A9_update.pdf"
                    target="_blank"
                  >
                    ดาวน์โหลด คพ.01
                  </Link>
                  <li>เอกสารแสดงผลการเรียนทุกภาคเรียน (Transcript)</li>
                </Form.Item>
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
