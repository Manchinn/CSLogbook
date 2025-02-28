import React, { useEffect, useState } from "react";
import { Card, Button, Typography, List, Space, message } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';
import InternshipSteps from "./InternshipSteps";
import PDFViewer from '../PDFViewer';
import "./InternshipStyles.css";

const { Title, Paragraph } = Typography;

const InternshipReview = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [documentData, setDocumentData] = useState(state?.documentData || {});
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (!state) {
      const storedDocumentData = JSON.parse(localStorage.getItem("documentData")) || {};
      setDocumentData(storedDocumentData);
    } else {
      setDocumentData(state.documentData || {});
    }
  }, [state]);

  useEffect(() => {
    if (documentData.fileUrl) {
      setPdfUrl(documentData.fileUrl);
    }
  }, [documentData]);

  const handleConfirm = async () => {
    if (!documentData.documentName || !documentData.studentName || !documentData.file) {
      message.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/internship-documents', documentData);
      message.success("ส่งข้อมูลเรียบร้อย!");
      localStorage.removeItem("documentData");
      navigate("/internship-terms", { state: { documentData } });
    } catch (error) {
      console.error("Error submitting data:", error);
      message.error("เกิดข้อผิดพลาดในการส่งข้อมูล");
    }
  };

  return (
    <div className="internship-container">
      <InternshipSteps />
      <Card className="internship-card">
        <Title level={3}>ตรวจสอบข้อมูลก่อนส่ง</Title>
        <Card className="internship-subcard">
          <Title level={4}>ข้อมูลเอกสาร</Title>
          <Paragraph><strong>ชื่อเอกสาร:</strong> {documentData.documentName || "N/A"}</Paragraph>
          <Paragraph><strong>ชื่อ-สกุล นักศึกษา:</strong> {documentData.studentName || "N/A"}</Paragraph>
        </Card>
        <Card className="internship-subcard">
          <Title level={4}>เอกสารที่อัปโหลด</Title>
          <List
            bordered
            dataSource={documentData.file ? [documentData.file.name] : []}
            renderItem={(file) => <List.Item key={file}>{file}</List.Item>}
          />
          {pdfUrl && (
            <Card title="แสดงผลเอกสาร PDF">
              <PDFViewer pdfUrl={pdfUrl} />
            </Card>
          )}
        </Card>
        <Space>
          <Button onClick={() => navigate("/internship-documents")}>ย้อนกลับ</Button>
          <Button type="primary" onClick={handleConfirm}>ยืนยันและส่งข้อมูล</Button>
        </Space>
      </Card>
    </div>
  );
};

export default InternshipReview;
