import React, { useState } from 'react';
import { Upload, Button, Table, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const AdminUpload = () => {
  const [fileList, setFileList] = useState([]);
  const [students, setStudents] = useState([]);

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error("Please upload a CSV file");
      return;
    }

    const formData = new FormData();
    formData.append('file', fileList[0]);

    try {
      const response = await axios.post('http://localhost:5000/upload-csv', formData);
      setStudents(response.data);
      message.success("CSV uploaded successfully");
    } catch (error) {
      console.error('Error uploading CSV:', error);
      message.error("Failed to upload CSV");
    }
  };

  const columns = [
    { title: 'Student ID', dataIndex: 'studentID', key: 'studentID' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Surname', dataIndex: 'surname', key: 'surname' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    { 
        title: 'Internship', 
        dataIndex: 'isEligibleForInternship', 
        key: 'internship', 
        render: (isEligible) => isEligible ? '✅' : '❌' 
      },
      { 
        title: 'Project', 
        dataIndex: 'isEligibleForProject', 
        key: 'project', 
        render: (isEligible) => isEligible ? '✅' : '❌' 
      },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Upload Student CSV</h2>
      <Upload
        beforeUpload={(file) => {
          setFileList([file]);
          return false;
        }}
        fileList={fileList}
      >
        <Button icon={<UploadOutlined />}>Select CSV File</Button>
      </Upload>
      <Button type="primary" onClick={handleUpload} style={{ marginTop: '10px' }}>
        Upload
      </Button>
      <Table dataSource={students} columns={columns} rowKey="studentID" style={{ marginTop: '20px' }} />
    </div>
  );
};

export default AdminUpload;
