import React, { useEffect, useState } from "react";
import { Card, Button, Typography, List, Space, message } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';
import InternshipSteps from "./InternshipSteps";
import "./InternshipStyles.css"; // Import shared CSS

const { Title, Paragraph } = Typography;

const InternshipReview = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [companyInfo, setCompanyInfo] = useState(state?.companyInfo || {});
  const [uploadedFiles, setUploadedFiles] = useState(state?.uploadedFiles || []);

  useEffect(() => {
    if (!state) {
      const storedCompanyInfo = JSON.parse(localStorage.getItem("companyInfo")) || {};
      const storedFiles = JSON.parse(localStorage.getItem("uploadedFiles")) || [];
      setCompanyInfo(storedCompanyInfo);
      setUploadedFiles(storedFiles);
    } else {
      setCompanyInfo(state.companyInfo || {});
      setUploadedFiles(state.uploadedFiles || []);
    }
  }, [state]);

  const handleConfirm = async () => {
    if (!companyInfo.company_name || !companyInfo.contact_name || !companyInfo.contact_phone || !companyInfo.contact_email) {
      message.error("กรุณากรอกข้อมูลสถานประกอบการให้ครบถ้วน");
      return;
    }

    if (uploadedFiles.length === 0) {
      message.error("กรุณาอัปโหลดเอกสาร");
      return;
    }

    console.log("Sending data to backend:", { companyInfo, uploadedFiles });

    try {
      await axios.post('http://localhost:5000/api/internship-documents', {
        companyInfo,
        uploadedFiles
      });
      message.success("ส่งข้อมูลเรียบร้อย!");
      localStorage.removeItem("companyInfo");
      localStorage.removeItem("uploadedFiles");
      navigate("/internship-terms", { state: { companyInfo, uploadedFiles: uploadedFiles.map(file => ({ name: file.name })) } });
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
          <Title level={4}>ข้อมูลสถานประกอบการ</Title>
          <Paragraph><strong>ชื่อบริษัท:</strong> {companyInfo.company_name || "N/A"}</Paragraph>
          <Paragraph><strong>ชื่อผู้ควบคุมงาน:</strong> {companyInfo.contact_name || "N/A"}</Paragraph>
          <Paragraph><strong>เบอร์โทรศัพท์:</strong> {companyInfo.contact_phone || "N/A"}</Paragraph>
          <Paragraph><strong>อีเมล:</strong> {companyInfo.contact_email || "N/A"}</Paragraph>
        </Card>
        <Card className="internship-subcard">
          <Title level={4}>เอกสารที่อัปโหลด</Title>
          <List
            bordered
            dataSource={uploadedFiles}
            renderItem={(file) => <List.Item>{file.name}</List.Item>}
          />
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
