import React, { useState } from 'react';
import { 
  Modal, 
  Upload, 
  Button, 
  message, 
  Space, 
  Typography, 
  Alert, 
  Steps, 
  Divider, 
  Spin 
} from 'antd';
import { 
  UploadOutlined, 
  FileExcelOutlined, 
  CheckCircleOutlined
} from '@ant-design/icons';
import { adminService } from '../../../../services/adminService';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const BulkUpload = ({ visible, onCancel, onSuccess }) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('กรุณาเลือกไฟล์ CSV ก่อนอัปโหลด');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileList[0]);
    
    setUploading(true);
    try {
      const result = await adminService.uploadStudentCSV(formData);
      message.success('อัปโหลดข้อมูลสำเร็จ');
      setUploadResult(result);
      setCurrentStep(2);
      onSuccess();
    } catch (error) {
      console.error('อัปโหลดล้มเหลว:', error);
      message.error('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (info) => {
    let fileList = [...info.fileList];
    
    // จำกัดให้เลือกได้แค่ 1 ไฟล์
    fileList = fileList.slice(-1);
    
    // ตรวจสอบนามสกุลไฟล์
    fileList = fileList.filter(file => {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        message.error('รองรับเฉพาะไฟล์ CSV เท่านั้น');
        return false;
      }
      return true;
    });
    
    setFileList(fileList);
    
    if (fileList.length > 0) {
      setCurrentStep(1);
    } else {
      setCurrentStep(0);
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        message.error('รองรับเฉพาะไฟล์ CSV เท่านั้น');
        return false;
      }
      return false;
    },
    fileList,
    onChange: handleFileChange,
  };

  const steps = [
    {
      title: 'เลือกไฟล์',
      content: (
        <Space direction="vertical" style={{ width: '100%', marginTop: 20 }}>
          <Alert
            message="คำแนะนำการอัปโหลดไฟล์ CSV"
            description={
              <ul>
                <li>ไฟล์ CSV ต้องมีหัวคอลัมน์: studentCode, firstName, lastName, totalCredits, majorCredits</li>
                <li>ตรวจสอบให้แน่ใจว่าข้อมูลทั้งหมดถูกต้องก่อนอัปโหลด</li>
                <li>หากมีรหัสนักศึกษาที่ซ้ำกับในระบบ ข้อมูลจะถูกอัปเดต</li>
              </ul>
            }
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />
          
          <Upload {...uploadProps} maxCount={1}>
            <Button icon={<UploadOutlined />}>เลือกไฟล์ CSV</Button>
          </Upload>
        </Space>
      ),
    },
    {
      title: 'ตรวจสอบ',
      content: (
        <Space direction="vertical" style={{ width: '100%', marginTop: 20 }}>
          <Alert
            message="ตรวจสอบไฟล์"
            description={
              <div>
                <p>ไฟล์ที่เลือก: {fileList[0]?.name}</p>
                <p>ขนาดไฟล์: {(fileList[0]?.size / 1024).toFixed(2)} KB</p>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 20 }}
          />
          <Text>โปรดตรวจสอบไฟล์ให้แน่ใจก่อนทำการอัปโหลด</Text>
        </Space>
      ),
    },
    {
      title: 'เสร็จสิ้น',
      content: (
        <Space direction="vertical" style={{ width: '100%', marginTop: 20, textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
          <Title level={4}>อัปโหลดสำเร็จ</Title>
          {uploadResult && (
            <div>
              <Text>เพิ่มข้อมูลใหม่: {uploadResult.added || 0} รายการ</Text>
              <br />
              <Text>อัปเดตข้อมูลเดิม: {uploadResult.updated || 0} รายการ</Text>
              <br />
              <Text type="danger">ข้อผิดพลาด: {uploadResult.errors || 0} รายการ</Text>
            </div>
          )}
        </Space>
      ),
    },
  ];

  const renderContent = () => {
    return steps[currentStep].content;
  };

  return (
    <Modal
      title="อัปโหลดข้อมูลนักศึกษา (CSV)"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          ปิด
        </Button>,
        currentStep === 1 && (
          <Button
            key="submit"
            type="primary"
            loading={uploading}
            onClick={handleUpload}
          >
            อัปโหลด
          </Button>
        ),
      ]}
      width={700}
      centered
    >
      <Steps current={currentStep} style={{ marginBottom: 20 }}>
        {steps.map(item => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>
      
      <Divider />
      
      {uploading ? (
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 15 }}>กำลังอัปโหลดและประมวลผลข้อมูล...</div>
        </div>
      ) : (
        renderContent()
      )}
    </Modal>
  );
};

export default BulkUpload;