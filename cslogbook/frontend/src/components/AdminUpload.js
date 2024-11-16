import React, { useState } from 'react';
import { Upload, Button, Table, message, Alert, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const AdminUpload = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);

  const columns = [
    { 
      title: 'Student ID',
      dataIndex: 'studentID',
      key: 'studentID',
      render: (text, record) => record.studentID || record['Student ID'] || '-'
    },
    { 
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => record.firstName || record.name || '-'
    },
    { 
      title: 'Surname',
      dataIndex: 'surname',
      key: 'surname',
      render: (text, record) => record.lastName || record.surname || '-'
    },
    { 
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (text, record) => record.role || '-'
    },
    {
      title: 'Internship',
      dataIndex: 'isEligibleForInternship',
      key: 'internship',
      render: (value) => {
        if (value === undefined || value === null) return '-';
        return value ? '✅' : '❌';
      }
    },
    {
      title: 'Project',
      dataIndex: 'isEligibleForProject',
      key: 'project',
      render: (value) => {
        if (value === undefined || value === null) return '-';
        return value ? '✅' : '❌';
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Space direction="vertical" size="small">
          <span style={{ 
            color: status === 'Invalid' ? '#ff4d4f' : 
                   status === 'Updated' ? '#108ee9' : '#52c41a'
          }}>
            {status === 'Invalid' ? '❌ Invalid' :
             status === 'Updated' ? '🔄 Updated' : '✅ Added'}
          </span>
          {status === 'Invalid' && record.errors && (
            <div style={{ fontSize: '12px', color: '#ff4d4f' }}>
              {record.errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          )}
        </Space>
      )
    }
  ];

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('Please select a CSV file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', fileList[0]);

    try {
      const response = await axios.post('http://localhost:5000/upload-csv', formData);
      console.log('Upload response:', response.data);
      
      if (response.data.success) {
        setResults(response.data.results);
        setSummary(response.data.summary);
        message.success('File uploaded successfully');

        // Refresh student data after upload
        const studentsResponse = await axios.get('http://localhost:5000/api/students');
        console.log('Updated student data:', studentsResponse.data);
      } else {
        message.error('Failed to process file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Failed to upload file');
    } finally {
      setUploading(false);
      setFileList([]);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Upload Student CSV</h2>
      
      <Space direction="vertical" style={{ width: '100%', marginBottom: 20 }}>
        <Upload
          accept=".csv"
          beforeUpload={(file) => {
            const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
            if (!isCSV) {
              message.error('You can only upload CSV files!');
              return false;
            }
            setFileList([file]);
            return false;
          }}
          fileList={fileList}
          onRemove={() => setFileList([])}
        >
          <Button icon={<UploadOutlined />}>Select CSV File</Button>
        </Upload>
        
        <Button
          type="primary"
          onClick={handleUpload}
          disabled={fileList.length === 0}
          loading={uploading}
        >
          {uploading ? 'Uploading' : 'Start Upload'}
        </Button>
      </Space>

      {summary && (
        <Alert
          message="Upload Summary"
          description={
            <div>
              <p>Total processed: {summary.total}</p>
              <p>Added: {summary.added}</p>
              <p>Updated: {summary.updated}</p>
              <p>Invalid: {summary.invalid}</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      <Table
        dataSource={results}
        columns={columns}
        rowKey={(record) => record.studentID || Math.random().toString()}
        pagination={{ pageSize: 10 }}
        loading={uploading}
      />
    </div>
  );
};

export default AdminUpload;