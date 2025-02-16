import React, { useState, useEffect } from 'react';
import { Table, Button, message } from 'antd';
import { fetchProjectProposals, handleApproveProjectProposal, handleRejectProjectProposal, fetchDocuments, handleApprove, handleReject } from './api';
import DocumentDetails from './DocumentDetails';

const DocumentManagement = ({ type }) => {
  const [documents, setDocuments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let data;
        if (type === 'project') {
          data = await fetchProjectProposals();
        } else {
          data = await fetchDocuments(type);
        }
        if (Array.isArray(data)) {
          setDocuments(data);
        } else {
          throw new Error('Data is not an array');
        }
      } catch (error) {
        message.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
      }
    };

    fetchData();
  }, [type]);

  const handleViewDetails = (document) => {
    setSelectedDocument(document);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleApproveDocument = async (documentId) => {
    try {
      if (type === 'project') {
        await handleApproveProjectProposal(documentId);
      } else {
        await handleApprove(documentId);
      }
      message.success('อนุมัติโครงงานเรียบร้อยแล้ว');
      setDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการอนุมัติโครงงาน');
    }
  };

  const handleRejectDocument = async (documentId) => {
    try {
      if (type === 'project') {
        await handleRejectProjectProposal(documentId);
      } else {
        await handleReject(documentId);
      }
      message.success('ปฏิเสธโครงงานเรียบร้อยแล้ว');
      setDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการปฏิเสธโครงงาน');
    }
  };

  const columns = [
    {
      title: 'ชื่อเอกสาร',
      dataIndex: 'project_name_th',
      key: 'project_name_th',
      render: (text, record) => (
        <button onClick={() => handleViewDetails(record)}>{text}</button> 
      ),
    },
    {
      title: 'ชื่อนักศึกษา',
      dataIndex: 'studentName1',
      key: 'studentName1',
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
          <Button onClick={() => handleApproveDocument(record.id)}>อนุมัติ</Button>
          <Button onClick={() => handleRejectDocument(record.id)}>ปฏิเสธ</Button>
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
