import React, { useState, useEffect } from 'react';
import { Upload, Button, Table, message, Space, Typography, Card } from 'antd';
import { UploadOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const AdminUpload = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const columns = [
    { 
      title: 'รหัสนักศึกษา',
      dataIndex: 'studentID',
      key: 'studentID',
      width: 140,
      fixed: 'left',
      sorter: (a, b) => (a.studentID || '').localeCompare(b.studentID || ''),
      render: (text) => <Text strong>{text || '-'}</Text>
    },
    { 
      title: 'ชื่อ',
      dataIndex: 'firstName',
      key: 'firstName',
      width: 150,
      sorter: (a, b) => (a.firstName || '').localeCompare(b.firstName || '')
    },
    { 
      title: 'นามสกุล',
      dataIndex: 'lastName',
      key: 'lastName',
      width: 150,
      sorter: (a, b) => (a.lastName || '').localeCompare(b.lastName || '')
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 200,
      fixed: 'right',
      sorter: (a, b) => (a.status || '').localeCompare(b.status || ''),
      render: (status, record) => (
        <Space direction="vertical" size="small">
          <Text style={{ 
            color: status === 'Invalid' ? '#ff4d4f' : 
                   status === 'Updated' ? '#1890ff' : '#52c41a'
          }}>
            {status === 'Invalid' ? '❌ ไม่ถูกต้อง' :
             status === 'Updated' ? '🔄 อัปเดตแล้ว' : '✅ เพิ่มแล้ว'}
          </Text>
          {status === 'Invalid' && record.errors && (
            <Text type="danger" style={{ fontSize: '12px' }}>
              {record.errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </Text>
          )}
        </Space>
      )
    }
  ];

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      message.error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
    } else {
      setIsAuthenticated(true);
    }
  };

  const handleUpload = async () => {
    if (!isAuthenticated) {
      message.error('กรุณาเข้าสู่ระบบก่อนอัพโหลดไฟล์');
      return;
    }

    if (fileList.length === 0) {
      message.error('กรุณาเลือกไฟล์ CSV ก่อนอัปโหลด');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', fileList[0]);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('กรุณาเข้าสู่ระบบก่อนอัพโหลดไฟล์');
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/upload-csv', 
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setResults(response.data.results);
        setSummary(response.data.summary);
        message.success('อัปโหลดไฟล์สำเร็จ');
      } else {
        throw new Error(response.data.message || 'ไม่สามารถประมวลผลไฟล์ได้');
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (error.response?.status === 401) {
        message.error('ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่');
      } else if (error.response?.status === 413) {
        message.error('ไฟล์มีขนาดใหญ่เกินไป');
      } else if (error.response?.status === 415) {
        message.error('รูปแบบไฟล์ไม่ถูกต้อง');
      } else {
        message.error(error.message || 'เกิดข้อผิดพลาดในการอัปโหลด');
      }
    } finally {
      setUploading(false);
      setFileList([]);
    }
  };

  const beforeUpload = (file) => {
    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
    if (!isCSV) {
      message.error('สามารถอัปโหลดได้เฉพาะไฟล์ CSV เท่านั้น');
      return false;
    }

    const isLessThan5MB = file.size / 1024 / 1024 < 5;
    if (!isLessThan5MB) {
      message.error('ไฟล์ต้องมีขนาดไม่เกิน 5MB');
      return false;
    }

    setFileList([file]);
    return false;
  };

  const handleDownloadTemplate = () => {
    window.location.href = 'http://localhost:5000/template/download-template';
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '90%',
      height: 'calc(100vh - 184px)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      gap: '24px',
      marginLeft: '75px',
    }}>
      <Card bodyStyle={{ padding: '16px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        <Space style={{ width: '100%' }} direction="horizontal" align="center">
          <Upload
            accept=".csv"
            beforeUpload={beforeUpload}
            fileList={fileList}
            onRemove={() => setFileList([])}
          >
            <Button 
              icon={<UploadOutlined />}
              style={{ borderRadius: '6px', height: '40px' }}
            >
              เลือกไฟล์ CSV
            </Button>
          </Upload>

          <Button
            type="primary"
            onClick={handleUpload}
            disabled={fileList.length === 0}
            loading={uploading}
            icon={<ReloadOutlined />}
            style={{ borderRadius: '6px', height: '40px' }}
          > 
            {uploading ? 'กำลังอัปโหลด...' : 'เริ่มอัปโหลด'}
          </Button>

          <Button
            type="default"
            onClick={handleDownloadTemplate}
            icon={<DownloadOutlined />}
            style={{ borderRadius: '6px', height: '40px' }}
          >
            ดาวน์โหลดเทมเพลต CSV
          </Button>

          {summary && (
            <Space size="large" style={{ marginLeft: 'auto' }}>
              <Text>ทั้งหมด: <Text strong>{summary.total}</Text></Text>
              <Text>เพิ่มใหม่: <Text strong type="success">{summary.added}</Text></Text>
              <Text>อัปเดต: <Text strong type="warning">{summary.updated}</Text></Text>
              <Text>ไม่ถูกต้อง: <Text strong type="danger">{summary.invalid}</Text></Text>
            </Space>
          )}
        </Space>
      </Card>

      <Table
        dataSource={results}
        columns={columns}
        rowKey={(record) => record.studentID || Math.random().toString()}
        loading={uploading}
        scroll={{ 
          x: 880,
          y: 'calc(100vh - 380px)'
        }}
        style={{
          flex: 1,
        }}
        sticky
        bordered
      />
    </div>
  );
};

export default AdminUpload;
