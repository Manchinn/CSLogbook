import React, { useState, useEffect } from 'react';
import { Table, Button, message } from 'antd';
import { 
  fetchProjectProposals,
  fetchDocuments, 
  handleApprove, 
  handleReject, 
  fetchInternshipDocuments } from './api';
import DocumentDetails from './DocumentDetails';

const DocumentManagement = ({ type }) => {
  const [documents, setDocuments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const fetchData = async (type) => {
    try {
      const documentsData = await fetchDocuments(type);
      if (Array.isArray(documentsData)) {
        setDocuments(documentsData);
      } else {
        throw new Error('Data is not an array');
      }
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    }
  };

  useEffect(() => {
    fetchData(type);
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
      await handleApprove(documentId);
      message.success('อนุมัติหัวข้อโครงงานพิเศษเรียบร้อยแล้ว');
      setDocuments(documents.map(doc => doc.id === documentId ? { ...doc, status: 'approved' } : doc));
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการอนุมัติหัวข้อโครงงานพิเศษ');
    }
  };

  const handleRejectDocument = async (documentId) => {
    try {
      await handleReject(documentId);
      message.success('ปฏิเสธหัวข้อโครงงานพิเศษเรียบร้อยแล้ว');
      setDocuments(documents.map(doc => doc.id === documentId ? { ...doc, status: 'rejected' } : doc));
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการปฏิเสธหัวข้อโครงงานพิเศษ');
    }
  };

  const columns = [
    {
      title: 'ชื่อเอกสาร',
      dataIndex: 'document_name',
      key: 'document_name',
      render: (text, record) => (
        <button onClick={() => handleViewDetails(record)}>{text}</button> 
      ),
    },
    {
      title: 'ชื่อนักศึกษา',
      dataIndex: 'student_name',
      key: 'student_name',
    },
    {
      title: 'วันที่อัปโหลด',
      dataIndex: 'upload_date',
      key: 'upload_date',
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
      <Table columns={columns} dataSource={documents} style={{width:'100%',maxWidth:'90%', marginLeft:'70px', padding:'20px'}}/>
      <DocumentDetails document={selectedDocument} open={isModalVisible} onClose={handleCloseModal} />
    </div>
  );
};

export default DocumentManagement;
