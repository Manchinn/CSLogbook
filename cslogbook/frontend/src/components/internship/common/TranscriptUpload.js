import React from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import internshipService from '../../../services/internshipService';

const TranscriptUpload = ({ value, onChange, disabled }) => {
  const customRequest = async ({ file, onSuccess, onError }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'INTERNSHIP');
      formData.append('category', 'transcript');
      formData.append('documentName', 'transcript');

      // ส่ง file object โดยตรง ไม่ใช่ formData
      const response = await internshipService.uploadTranscript(file);
      if (response.success) {
        onSuccess(response);
        onChange?.(response.fileUrl);
      } else {
        onError(new Error(response.message));
      }
    } catch (error) {
      console.error('Upload Error:', error);
      onError(error);
      message.error('อัพโหลดไฟล์ไม่สำเร็จ');
    }
  };

  const props = {
    name: 'file',
    accept: '.pdf',
    maxCount: 1,
    showUploadList: true,
    customRequest,
    beforeUpload: (file) => {
      const isPDF = file.type === 'application/pdf';
      if (!isPDF) {
        message.error('กรุณาอัพโหลดไฟล์ PDF เท่านั้น');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('ไฟล์ต้องมีขนาดไม่เกิน 2MB');
        return false;
      }
      return true;
    }
  };

  return (
    <Upload {...props} disabled={disabled}>
      <Button icon={<UploadOutlined />} disabled={disabled}>
        อัพโหลดใบแสดงผลการเรียน (PDF)
      </Button>
    </Upload>
  );
};

export default TranscriptUpload;