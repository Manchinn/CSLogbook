import React, { useState, useEffect } from "react";
import { Layout, Form, Input, Button, Upload, message, Card, Typography, Space } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from 'axios';
import moment from 'moment-timezone';
import { useNavigate, useLocation } from "react-router-dom"; // นำเข้า useLocation
import InternshipSteps from "./InternshipSteps"; // Import InternshipSteps
import PDFViewer from '../PDFViewer';
import "./InternshipStyles.css";

const { Title, Paragraph } = Typography;
const { Content } = Layout;

const InternshipDocumentForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation(); // ใช้ useLocation เพื่อดึง state
  const [pdfFile, setPdfFile] = useState(null);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    // Load default file list from localStorage if available
    const storedDocumentData = JSON.parse(localStorage.getItem("documentData"));
    if (storedDocumentData && storedDocumentData.file) {
      setFileList([{
        uid: '-1',
        name: storedDocumentData.file.name,
        status: 'done',
        originFileObj: storedDocumentData.file,
      }]);
      setPdfFile(storedDocumentData.file);
    }
  }, []);

  const handleSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append('file', values.file[0].originFileObj);
      formData.append('documentName', values.documentName);
      formData.append('studentName', values.studentName);

      // ตรวจสอบว่ามี companyInfo ใน state หรือไม่
      const companyInfo = location.state?.companyInfo;
      if (!companyInfo) {
        message.error("ข้อมูลสถานประกอบการไม่ครบถ้วน");
        return;
      }

      // ส่งข้อมูลไปยัง backend
      await axios.post('http://localhost:5000/api/internship-documents', {
        companyInfo: companyInfo,
        uploadedFiles: [{ name: values.file[0].name }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // ส่งโทเค็นการตรวจสอบสิทธิ์
        },
      });

      message.success("เอกสารฝึกงานของคุณถูกส่งเรียบร้อยแล้ว!");
      form.resetFields();

      // เก็บข้อมูลใน localStorage
      localStorage.setItem("documentData", JSON.stringify({ ...values, file: values.file[0].originFileObj }));
      
      // Navigate to InternshipReview page with state
      navigate("/status-check");
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการส่งข้อมูล");
    }
  };

  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
    const file = fileList[0]?.originFileObj;
    if (file) {
      setPdfFile(file);
    }
  };

  const formatDate = (date) => {
    return moment(date).tz('Asia/Bangkok').format('YYYY-MM-DD');
  };

  return (
    <Layout className="layout">
      <Content className="content">
        <InternshipSteps /> {/* Add InternshipSteps here */}
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
              getValueFromEvent={(e) => Array.isArray(e) ? e : e && e.fileList}
              rules={[{ required: true, message: "กรุณาอัปโหลดเอกสาร!" }]}
            >
              <Upload
                name="file"
                beforeUpload={(file) => {
                  const isPDF = file.type === 'application/pdf';
                  if (!isPDF) {
                    message.error('สามารถอัปโหลดได้เฉพาะไฟล์ PDF เท่านั้น');
                  }
                  const isLt10M = file.size / 1024 / 1024 < 10;
                  if (!isLt10M) {
                    message.error('ไฟล์ต้องมีขนาดไม่เกิน 10MB');
                  }
                  return isPDF && isLt10M;
                }}
                onChange={handleFileChange}
                defaultFileList={fileList}
                showUploadList={{ showRemoveIcon: true }}
                itemRender={(originNode, file) => (
                  <div key={file.uid}>
                    {originNode}
                  </div>
                )}
              >
                <Button icon={<UploadOutlined />}>Upload</Button>
              </Upload>
            </Form.Item>
          </Form>

          {pdfFile && (
            <Card title="แสดงผลเอกสาร PDF">
              <PDFViewer pdfFile={pdfFile} />
            </Card>
          )}

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item>
              <Space style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
                <Button type="primary" htmlType="submit" size="large">
                  ส่งเอกสาร
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