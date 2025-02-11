import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Upload, Button, Card, Typography, List, Space, message, Steps  } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import InternshipSteps from "./InternshipSteps";

const { Title, Text } = Typography;
const { Step } = Steps;

const InternshipDocuments = () => {
    const [fileList, setFileList] = useState(JSON.parse(localStorage.getItem("uploadedFiles")) || []);
    const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      setLoading(true);
      const response = await axios.post("http://localhost:5000/api/upload-internship-doc", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      if (response.status === 200) {
        message.success("อัปโหลดเอกสารสำเร็จ");
  
        // ✅ อัปเดตรายการไฟล์ที่อัปโหลดแล้ว
        const updatedFiles = [...fileList, response.data.fileName];
        setFileList(updatedFiles);
  
        // ✅ บันทึกไฟล์ใน localStorage
        localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
      }
    } catch (error) {
      message.error("อัปโหลดเอกสารล้มเหลว");
    } finally {
      setLoading(false);
    }
  };
  
  const uploadProps = {
    beforeUpload: (file) => {
      const isPDF = file.type === "application/pdf";
      if (!isPDF) {
        message.error("สามารถอัปโหลดได้เฉพาะไฟล์ PDF เท่านั้น");
      }
      return isPDF || Upload.LIST_IGNORE;
    },
    customRequest: async ({ file }) => {
      handleUpload(file);
    },
    showUploadList: false,
  };

  return (
    <div style={{ 
        width: '100%',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '85vh', 
        backgroundColor: '#f5f5f5', 
        padding: '20px' 
    }}>
        <InternshipSteps />
        <Card style={{ 
            maxWidth: '100%',
            width: '90%',  
            padding: 10, 
            borderRadius: 10, 
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            marginLeft: '30px',
            margin: '20px auto',
        }}>
        
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

        <Upload beforeUpload={(file) => handleUpload(file)} showUploadList={false}>
          <Button icon={<UploadOutlined />} loading={loading}>เลือกไฟล์ PDF</Button>
        </Upload>

        <List
            header={<div>เอกสารที่อัปโหลดแล้ว</div>}
            bordered
            dataSource={fileList}
            renderItem={file => <List.Item>{file}</List.Item>}
        />
        </Space>


        <Space style={{ display: 'flex', justifyContent: 'left' }}>
          <Button onClick={() => navigate("/internship-company") }>ย้อนกลับ</Button>
          <Button type="primary" onClick={() => navigate("/internship-review")}>ตรวจสอบข้อมูล</Button>
        </Space>
      </Card>
    </div>
  );
};

export default InternshipDocuments;
