import React, { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { Upload, Button, Card, Typography, List, Space, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import InternshipSteps from "./InternshipSteps";
import "./InternshipStyles.css"; // Import shared CSS

const { Title, Text } = Typography;

const InternshipDocuments = () => {
  const [fileList, setFileList] = useState(JSON.parse(localStorage.getItem("uploadedFiles")) || []);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { state } = useLocation();

  const handleUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:5000/api/internship-documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      onSuccess(response.data);
      message.success(`${file.name} uploaded successfully`);
      const updatedFiles = [...fileList, { name: response.data.fileName }];
      setFileList(updatedFiles);
      localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
    } catch (error) {
      console.error("Error uploading file:", error);
      onError(error);
      if (error.response && error.response.status === 404) {
        message.error("ไม่พบเส้นทางการอัปโหลดไฟล์");
      } else {
        message.error(`${file.name} upload failed`);
      }
    }
  };

  const handleReview = () => {
    navigate("/internship-review", { state: { companyInfo: state.companyInfo, uploadedFiles: fileList.map(file => ({ name: file.name })) } });
  };

  const handleChange = ({ fileList }) => setFileList(fileList);

  const uploadProps = {
    beforeUpload: (file) => {
      const isPDF = file.type === "application/pdf";
      if (!isPDF) {
        message.error("สามารถอัปโหลดได้เฉพาะไฟล์ PDF เท่านั้น");
      }
      return isPDF || Upload.LIST_IGNORE;
    },
    customRequest: handleUpload,
    fileList: fileList,
    onChange: handleChange,
    showUploadList: false,
  };

  return (
    <div className="internship-container">
      <InternshipSteps />
      <Card className="internship-card">
        <Title level={3} style={{ textAlign: 'left' }}>เอกสารฝึกงาน</Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>กรุณาอัปโหลดไฟล์ PDF ต่อไปนี้:</Text>
          <ul>
            <li>คพ.05- หนังสือขอความอนุเคราะห์</li>
            <a href="http://cs.kmutnb.ac.th/student_download.jsp" target="_blank" rel="noopener noreferrer">
                คลิกที่นี่เพื่อดาวน์โหลด คพ.05
            </a>
            <li>ผลการเรียนของนักศึกษา</li>
          </ul>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />} loading={loading}>เลือกไฟล์ PDF</Button>
          </Upload>
          <List
            header={<div>เอกสารที่อัปโหลดแล้ว</div>}
            bordered
            dataSource={fileList}
            renderItem={file => <List.Item>{file.name}</List.Item>}
          />
        </Space>
        <Space style={{ display: 'flex', justifyContent: 'left' }}>
          <Button onClick={() => navigate("/internship-company")}>ย้อนกลับ</Button>
          <Button type="primary" onClick={handleReview}>ตรวจสอบข้อมูล</Button>
        </Space>
      </Card>
    </div>
  );
};

export default InternshipDocuments;
