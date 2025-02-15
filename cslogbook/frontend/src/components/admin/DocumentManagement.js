import React, { useState, useEffect } from 'react';
import { Table, Button } from 'antd';
import { handleApprove, handleReject, fetchDocuments } from './api';
import DocumentDetails from './DocumentDetails';

const DocumentManagement = ({type}) => {
  const [documents, setDocuments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    fetchDocuments(type).then(data => setDocuments(data));
  }, [type]);

  const handleViewDetails = (document) => {
    setSelectedDocument(document);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: 'ชื่อเอกสาร',
      dataIndex: 'documentName',
      key: 'documentName',
      render: (text, record) => (
        <button onClick={() => handleViewDetails(record)}>{text}</button> 
      ),
    },
    {
      title: 'ชื่อนักศึกษา',
      dataIndex: 'studentName',
      key: 'studentName',
    },
    {
      title: 'วันที่อัปโหลด',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
    },
    {
      title: 'สถานะเอกสาร',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'การดำเนินการ',
      key: 'actions',
      render: (text, record) => (
        <div>
          <Button onClick={() => handleApprove(record.id)}>อนุมัติ</Button>
          <Button onClick={() => handleReject(record.id)}>ปฏิเสธ</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Table columns={columns} dataSource={documents} />
      <DocumentDetails document={selectedDocument} open={isModalVisible} onClose={handleCloseModal} />
    </div>
  );
};

export default DocumentManagement;
