import React, { useState, useEffect } from "react";
import { Layout, Form, Input, Button, Upload, message, Card, Typography, Space } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from 'axios';
import moment from 'moment-timezone';
import { useNavigate, useLocation } from "react-router-dom"; // นำเข้า useLocation
import InternshipSteps from "./InternshipSteps"; // Import InternshipSteps
import PDFViewer from '../PDFViewer';
import "./InternshipStyles.css";

const { Title, Paragraph, Text } = Typography;
const { Content } = Layout;

const InternshipDocumentForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation(); // ใช้ useLocation เพื่อดึง state
  const [pdfFiles, setPdfFiles] = useState([]);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    // Load default file list from localStorage if available
    const storedDocumentData = JSON.parse(localStorage.getItem("documentData"));
    if (storedDocumentData && storedDocumentData.files) {
      const files = storedDocumentData.files.map((file, index) => ({
        uid: `-${index}`,
        name: file.name,
        status: 'done',
        originFileObj: file,
      }));
      setFileList(files);
      setPdfFiles(files.map(file => file.originFileObj));
    }
  }, []);

  const handleSubmit = async (values) => {
    try {
      const formData = new FormData();
      values.file.forEach(file => {
        formData.append('file', file.originFileObj);
      });
      formData.append('documentName', values.documentName);
      formData.append('studentName', values.studentName);

      // ตรวจสอบว่ามี companyInfo ใน state หรือไม่
      const companyInfo = location.state?.companyInfo;
      if (!companyInfo) {
        message.error("ข้อมูลสถานประกอบการไม่ครบถ้วน");
        return;
      }

      // เพิ่มข้อมูล companyInfo ลงใน formData
      formData.append('companyInfo', JSON.stringify(companyInfo));

      // ตรวจสอบ URL ที่ใช้ในการเรียกใช้งาน API
      console.log("Sending data to backend:", formData);

      // ส่งข้อมูลไปยัง backend
      const response = await axios.post('http://localhost:5000/api/internship-documents/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // ส่งโทเค็นการตรวจสอบสิทธิ์
        },
      });

      message.success("เอกสารฝึกงานของคุณถูกส่งเรียบร้อยแล้ว!");
      form.resetFields();

      // เก็บข้อมูลใน localStorage
      localStorage.setItem("documentData", JSON.stringify({ ...values, files: values.file.map(file => file.originFileObj) }));
      
      // Navigate to InternshipReview page with state
      navigate("/status-check");

      // แสดง URL ของไฟล์ที่อัปโหลด
      console.log(response.data.fileUrl);
    } catch (error) {
      console.error("Error submitting internship documents:", error);
      message.error("เกิดข้อผิดพลาดในการส่งข้อมูล");
    }
  };

  const handleFileChange = ({ fileList }) => {
    // กรองไฟล์ที่ไม่ใช่ PDF ออก
    const validFiles = fileList.filter(file => {
      const isPDF = file.type === 'application/pdf' || 
                    file.name?.toLowerCase().endsWith('.pdf');
      if (!isPDF) {
        message.error(`${file.name} ไม่ใช่ไฟล์ PDF`);
      }
      return isPDF;
    });

    setFileList(validFiles);
    
    // อัปเดต pdfFiles เฉพาะไฟล์ที่มี originFileObj
    const files = validFiles
      .map(file => file.originFileObj)
      .filter(Boolean);
    setPdfFiles(files);
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
            เอกสารฝึกงาน
          </Title>

          <Text>กรุณาอัปโหลดไฟล์ PDF ต่อไปนี้:</Text>
          <ul>
            <li>คพ.05- หนังสือขอความอนุเคราะห์</li>
            <a href="http://cs.kmutnb.ac.th/student_download.jsp" target="_blank" rel="noopener noreferrer">
                คลิกที่นี่เพื่อดาวน์โหลด คพ.05
            </a>
            <li>ผลการเรียนของนักศึกษา</li>
          </ul>

          <Form form={form} layout="vertical" onFinish={handleSubmit}>

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
                multiple
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

          {/* เปลี่ยนเงื่อนไขการแสดง PDF Viewer */}
          {pdfFiles.length > 0 && (
            <Card title="แสดงผลเอกสาร PDF">
              {pdfFiles.map((file, index) => (
                file && (
                  <div key={index}>
                    <Typography.Text strong>
                      {file.name}
                    </Typography.Text>
                    <PDFViewer 
                      key={index} 
                      pdfFile={file}
                      onError={(error) => {
                        message.error(`ไม่สามารถโหลดไฟล์ ${file.name}: ${error.message}`);
                      }}
                      style={{ marginBottom: '20px' }}
                    />
                  </div>
                )
              ))}
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