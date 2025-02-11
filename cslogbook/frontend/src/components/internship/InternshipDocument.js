import React, { useState } from 'react';
import { Upload, Button, Card, Typography, List, Space, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const InternshipDocuments = () => {
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Handle file upload
  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/upload-internship-doc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      message.success('อัปโหลดเอกสารสำเร็จ');
      setFileList([...fileList, response.data.fileName]);
    } catch (error) {
      message.error('อัปโหลดเอกสารล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      const isPDF = file.type === 'application/pdf';
      if (!isPDF) {
        message.error('สามารถอัปโหลดได้เฉพาะไฟล์ PDF เท่านั้น');
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
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '85vh', 
        backgroundColor: '#f5f5f5', 
        padding: '20px' 
    }}>
      <Card style={{ 
        width: '100%', 
        maxWidth: 600, 
        padding: 20, 
        borderRadius: 10, 
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)' 
      }}>
        <Title level={3} style={{ textAlign: 'center' }}>เอกสารฝึกงาน</Title>
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
            <Button icon={<UploadOutlined />}>เลือกไฟล์ PDF</Button>
          </Upload>

          <List
            header={<div>เอกสารที่อัปโหลดแล้ว</div>}
            bordered
            dataSource={fileList}
            renderItem={file => <List.Item>{file}</List.Item>}
          />
        </Space>
      </Card>
    </div>
  );
};

export default InternshipDocuments;
