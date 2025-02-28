import React, { useState, useEffect } from 'react';
import { Table, Button, message, Input, Segmented, Space, Typography } from 'antd';
import {
  fetchDocuments,
  handleApprove,
  handleReject,
} from './api';
import DocumentDetails from './DocumentDetails';
import moment from 'moment-timezone';

const { Text } = Typography;

const DocumentManagement = ({ type }) => {
  const [documents, setDocuments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const fetchData = async (type) => {
    try {
      const documentsData = await fetchDocuments(type);
      if (Array.isArray(documentsData)) {
        console.log('Fetched documents:', documentsData);
        // Filter out duplicate documents
        const uniqueDocuments = documentsData.filter((doc, index, self) =>
          index === self.findIndex((d) => d.id === doc.id)
        ).map((doc, index) => ({ ...doc, uniqueId: `${doc.id}-${index}` }));
        setDocuments(uniqueDocuments);
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
      fetchData(type);
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการอนุมัติหัวข้อโครงงานพิเศษ');
    }
  };

  const handleRejectDocument = async (documentId) => {
    try {
      await handleReject(documentId);
      message.success('ปฏิเสธหัวข้อโครงงานพิเศษเรียบร้อยแล้ว');
      setDocuments(documents.map(doc => doc.id === documentId ? { ...doc, status: 'rejected' } : doc));
      fetchData(type);
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการปฏิเสธหัวข้อโครงงานพิเศษ');
    }
  };

  const handleApproveSelectedDocuments = async () => {
    try {
      await Promise.all(selectedRowKeys.map(documentId => handleApprove(documentId)));
      message.success('อนุมัติหัวข้อโครงงานพิเศษเรียบร้อยแล้ว');
      setDocuments(documents.map(doc => selectedRowKeys.includes(doc.id) ? { ...doc, status: 'approved' } : doc));
      setSelectedRowKeys([]);
      fetchData(type);
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการอนุมัติหัวข้อโครงงานพิเศษ');
    }
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  const filteredDocuments = documents.filter(doc =>
    (doc.document_name && doc.document_name.toLowerCase().includes(searchText.toLowerCase())) &&
    (statusFilter ? doc.status === statusFilter : true)
  );

  const columns = [
    {
      title: 'เอกสาร',
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
      render: (text) => moment(text).tz('Asia/Bangkok').format('YYYY-MM-DD'),
    },
    ...(statusFilter === 'pending' ? [{
      title: 'การดำเนินการ',
      key: 'actions',
      render: (text, record) => (
        <div>
          <Button onClick={() => handleApproveDocument(record.id)}>อนุมัติ</Button>
          <Button onClick={() => handleRejectDocument(record.id)}>ปฏิเสธ</Button>
        </div>
      ),
    }] : []),
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div>
      <Space style={{ marginBottom: 16, marginLeft: '80px', marginTop: '20px', width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Text className="filter-text">สถานะ:</Text>
          <Segmented
            options={[
              { label: 'รอการตรวจสอบ', value: 'pending' },
              { label: 'อนุมัติ', value: 'approved' },
              { label: 'ปฏิเสธ', value: 'rejected' },
              { label: 'ทั้งหมด', value: '' }
            ]}
            value={statusFilter}
            onChange={handleStatusFilterChange}
            style={{ width: 200 }}
          />
        </div>
        <Input
          placeholder="ค้นหาเอกสาร"
          value={searchText}
          onChange={handleSearch}
          style={{ width: '300px', marginRight: '180px' }}
        />
      </Space>
      {statusFilter === 'pending' && (
        <Button
          type="primary"
          onClick={handleApproveSelectedDocuments}
          disabled={selectedRowKeys.length === 0}
          style={{ marginBottom: 16, marginLeft: '100px' }}
        >
          อนุมัติเอกสารที่เลือก
        </Button>
      )}
      <Table
        rowSelection={statusFilter === 'pending' ? rowSelection : null}
        columns={columns}
        dataSource={filteredDocuments}
        rowKey="uniqueId"
        style={{ width: '100%', maxWidth: '90%', marginLeft: '70px', padding: '20px' }}
      />
      <DocumentDetails document={selectedDocument} open={isModalVisible} onClose={handleCloseModal} />
    </div>
  );
};

export default DocumentManagement;
