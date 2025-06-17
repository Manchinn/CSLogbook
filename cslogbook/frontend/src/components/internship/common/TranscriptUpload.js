import React from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const TranscriptUpload = ({ value, onChange, disabled }) => {
  const props = {
    name: 'file',
    accept: '.pdf',
    maxCount: 1,
    showUploadList: true,
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
      
      // เก็บไฟล์ใน state แทนที่จะอัปโหลดทันที
      onChange?.(file);
      return false; // จะไม่อัปโหลดอัตโนมัติ
    },
    onRemove: () => {
      onChange?.(null);
    },
    fileList: value ? [{ uid: '-1', name: value.name || 'transcript.pdf', status: 'done' }] : []
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