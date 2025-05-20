// filepath: c:\Users\chinn\CSLog\cslogbook\frontend\src.new\components\internship\common\TranscriptUpload.js
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
      
      // Store the file in state instead of uploading immediately
      onChange?.(file);
      return false; // Prevents automatic upload
    },
    onRemove: () => {
      onChange?.(null);
    },
    // Ensure fileList is correctly managed based on the presence of `value`
    fileList: value && value.name ? [{ uid: '-1', name: value.name, status: 'done' }] : 
              (value && typeof value === 'string' ? [{ uid: '-1', name: value, status: 'done'}] : [])
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