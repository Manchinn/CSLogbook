import React, { useEffect, useState } from "react";
import { Card, Button, Typography, List, Space, message } from "antd";
import { useNavigate } from "react-router-dom";
import InternshipSteps from "./InternshipSteps";
import "./InternshipStyles.css"; // Import shared CSS

const { Title, Paragraph } = Typography;

const InternshipReview = () => {
  const navigate = useNavigate();
  const [companyInfo, setCompanyInfo] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    const storedCompanyInfo = JSON.parse(localStorage.getItem("companyInfo")) || {};
    const storedFiles = JSON.parse(localStorage.getItem("uploadedFiles")) || [];
    setCompanyInfo(storedCompanyInfo);
    setUploadedFiles(storedFiles);
  }, []);

  const handleConfirm = () => {
    message.success("ส่งข้อมูลเรียบร้อย!");
    localStorage.removeItem("companyInfo");
    localStorage.removeItem("uploadedFiles");
    navigate("/internship-terms");
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
        </Card>
        <Card className="internship-subcard">
          <Title level={4}>เอกสารที่อัปโหลด</Title>
          <List
            bordered
            dataSource={uploadedFiles}
            renderItem={(file) => <List.Item>{file}</List.Item>}
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
