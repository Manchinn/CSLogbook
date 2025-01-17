import React, { useState, useEffect } from 'react';
import { Upload, Button, Table, message, Space, Typography, Row, Col, Card } from 'antd';
import { UploadOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const AdminUpload = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  // เพิ่ม state สำหรับเช็คสถานะ login
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Custom styles
  const tableHeaderStyle = {
    background: '#f7f7f7',
    fontWeight: 500,
    borderBottom: '2px solid #f0f0f0',
    padding: '12px 16px',
    whiteSpace: 'nowrap'
  };

  const tableCellStyle = {
    padding: '12px 16px',
    fontSize: '14px'
  };

  const columns = [
    { 
      title: 'รหัสนักศึกษา',
      dataIndex: 'studentID',
      key: 'studentID',
      width: 140,
      fixed: 'left',
      onHeaderCell: () => ({ style: tableHeaderStyle }),
      onCell: () => ({ style: tableCellStyle }),
      sorter: (a, b) => (a.studentID || '').localeCompare(b.studentID || ''),
      render: (text) => <Text strong>{text || '-'}</Text>
    },
    { 
      title: 'ชื่อ',
      dataIndex: 'firstName',
      key: 'firstName',
      width: 150,
      onHeaderCell: () => ({ style: tableHeaderStyle }),
      onCell: () => ({ style: tableCellStyle }),
      sorter: (a, b) => (a.firstName || '').localeCompare(b.firstName || '')
    },
    { 
      title: 'นามสกุล',
      dataIndex: 'lastName',
      key: 'lastName',
      width: 150,
      onHeaderCell: () => ({ style: tableHeaderStyle }),
      onCell: () => ({ style: tableCellStyle }),
      sorter: (a, b) => (a.lastName || '').localeCompare(b.lastName || '')
    },
    {
      title: 'สิทธิ์ฝึกงาน',
      dataIndex: 'isEligibleForInternship',
      key: 'internship',
      width: 120,
      align: 'center',
      onHeaderCell: () => ({ style: tableHeaderStyle }),
      onCell: () => ({ style: tableCellStyle }),
      sorter: (a, b) => Number(a.isEligibleForInternship) - Number(b.isEligibleForInternship),
      render: (value) => (
        <Text style={{ color: value ? '#52c41a' : '#ff4d4f' }}>
          {value ? '✅' : '❌'}
        </Text>
      )
    },
    {
      title: 'สิทธิ์โปรเจค',
      dataIndex: 'isEligibleForProject',
      key: 'project',
      width: 120,
      align: 'center',
      onHeaderCell: () => ({ style: tableHeaderStyle }),
      onCell: () => ({ style: tableCellStyle }),
      sorter: (a, b) => Number(a.isEligibleForProject) - Number(b.isEligibleForProject),
      render: (value) => (
        <Text style={{ color: value ? '#52c41a' : '#ff4d4f' }}>
          {value ? '✅' : '❌'}
        </Text>
      )
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 200,
      fixed: 'right',
      onHeaderCell: () => ({ style: tableHeaderStyle }),
      onCell: () => ({ style: tableCellStyle }),
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

  // เพิ่ม useEffect เพื่อตรวจสอบ token เมื่อ component โหลด
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // ฟังก์ชันตรวจสอบสถานะ authentication
  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      message.error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
      // อาจจะ redirect ไปหน้า login ถ้าต้องการ
      // window.location.href = '/login';
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
        // อาจจะ redirect ไปหน้า login
        // window.location.href = '/login';
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
        console.log('Upload success:', response.data); // Debug log
        setResults(response.data.results);
        setSummary(response.data.summary);
        message.success('อัปโหลดไฟล์สำเร็จ');
      } else {
        throw new Error(response.data.message || 'ไม่สามารถประมวลผลไฟล์ได้');
      }
    } catch (error) {
      console.error('Upload error:', error);
      // จัดการ error ตามประเภท
      if (error.response?.status === 401) {
        message.error('ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่');
        // อาจจะ redirect ไปหน้า login
        // window.location.href = '/login';
      } else if (error.response?.status === 413) {
        message.error('ไฟล์มีขนาดใหญ่เกินไป');
      } else if (error.response?.status === 415) {
        message.error('รูปแบบไฟล์ไม่ถูกต้อง');
      } else {
        message.error(error.message || 'เกิดข้อผิดพลาดในการอัปโหลด');
      }
    }finally {
      setUploading(false);
      setFileList([]);
    }
  };

    // เพิ่มฟังก์ชันตรวจสอบไฟล์ก่อนอัพโหลด
    const beforeUpload = (file) => {
      const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
      if (!isCSV) {
        message.error('สามารถอัปโหลดได้เฉพาะไฟล์ CSV เท่านั้น');
        return false;
      }
  
      // ตรวจสอบขนาดไฟล์ (ตัวอย่าง: จำกัดที่ 5MB)
      const isLessThan5MB = file.size / 1024 / 1024 < 5;
      if (!isLessThan5MB) {
        message.error('ไฟล์ต้องมีขนาดไม่เกิน 5MB');
        return false;
      }
  
      setFileList([file]);
      return false;
    };

  return (
    <div style={{ height: 'calc(100vh - 184px)', display: 'flex', flexDirection: 'column', padding: '24px', gap: '24px' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2} style={{ margin: 0, fontSize: '24px' }}>อัปโหลดข้อมูลนักศึกษา</Title>
        </Col>
      </Row>

      <Card bodyStyle={{ padding: '16px' }}>
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
