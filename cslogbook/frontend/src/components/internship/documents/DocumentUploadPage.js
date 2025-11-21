import React, { useState } from 'react';
import { 
  Card, Upload, Button, message, Typography, Space, Alert
} from 'antd';
import { 
  InboxOutlined, UploadOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { internshipService } from 'features/internship/services';

const { Title } = Typography;
const { Dragger } = Upload;

const DocumentUploadPage = () => {
  const { documentType } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const { docTitle, cs05Data } = location.state || {};

  const uploadProps = {
    name: 'document',
    multiple: false,
    fileList,
    accept: '.pdf,.jpg,.jpeg,.png',
    beforeUpload: (file) => {
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      
      if (!isPdf && !isImage) {
        message.error('กรุณาอัปโหลดไฟล์ PDF หรือรูปภาพเท่านั้น');
        return false;
      }
      
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('ขนาดไฟล์ต้องไม่เกิน 10MB');
        return false;
      }
      
      setFileList([file]);
      return false; // ป้องกันการอัปโหลดอัตโนมัติ
    },
    onRemove: () => {
      setFileList([]);
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('กรุณาเลือกไฟล์ที่ต้องการอัปโหลด');
      return;
    }

    try {
      setUploading(true);
      const response = await internshipService.uploadDocument(
        cs05Data.id,
        documentType,
        fileList[0]
      );

      if (response.success) {
        message.success('อัปโหลดเอกสารเรียบร้อยแล้ว');
        navigate('/internship/documents');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error(error.message || 'ไม่สามารถอัปโหลดเอกสารได้');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        📤 อัปโหลด{docTitle}
      </Title>

      <Card>
        <Alert
          message="คำแนะนำการอัปโหลด"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>รองรับไฟล์ PDF, JPG, JPEG, PNG</li>
              <li>ขนาดไฟล์ไม่เกิน 10 MB</li>
              <li>กรุณาตรวจสอบความชัดเจนของเอกสารก่อนอัปโหลด</li>
              <li>เอกสารจะถูกส่งให้เจ้าหน้าที่ตรวจสอบ</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Dragger {...uploadProps} style={{ marginBottom: 24 }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">คลิกหรือลากไฟล์มาวางที่นี่เพื่ออัปโหลด</p>
          <p className="ant-upload-hint">
            รองรับไฟล์ PDF และรูปภาพ (JPG, PNG) ขนาดไม่เกิน 10MB
          </p>
        </Dragger>

        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/internship/documents')}
            >
              ย้อนกลับ
            </Button>
            
            <Button 
              type="primary"
              icon={<UploadOutlined />}
              loading={uploading}
              onClick={handleUpload}
              disabled={fileList.length === 0}
            >
              อัปโหลดเอกสาร
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default DocumentUploadPage;