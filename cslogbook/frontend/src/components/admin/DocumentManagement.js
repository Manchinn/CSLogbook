import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, message, Input, Segmented, Space, Typography } from 'antd';
import { fetchDocuments, handleApprove, handleReject } from './api';
import DocumentDetails from './DocumentDetails';
import moment from 'moment-timezone';

const { Text } = Typography;

// Constants
const FILTER_OPTIONS = [
  { label: 'รอการตรวจสอบ', value: 'pending' },
  { label: 'อนุมัติ', value: 'approved' },
  { label: 'ปฏิเสธ', value: 'rejected' },
  { label: 'ทั้งหมด', value: '' }
];

const TABLE_STYLE = {
  width: '100%',
  maxWidth: '90%',
  marginLeft: '70px',
  padding: '20px'
};

const FILTER_SECTION_STYLE = {
  marginBottom: 16,
  marginLeft: '80px',
  marginTop: '20px',
  width: '100%',
  justifyContent: 'space-between'
};

const DocumentManagement = ({ type }) => {
  const [documents, setDocuments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Fetch data with useCallback
  const fetchData = useCallback(async () => {
    try {
      const documentsData = await fetchDocuments(type);
      if (Array.isArray(documentsData)) {
        const uniqueDocuments = documentsData
          .filter((doc, index, self) => 
            index === self.findIndex((d) => d.id === doc.id))
          .map((doc, index) => ({ 
            ...doc, 
            uniqueId: `${doc.id}-${index}`,
            key: `${doc.id}-${index}`
          }));
        setDocuments(uniqueDocuments);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + error.message);
      setDocuments([]);
    }
  }, [type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Document handlers
  const handleViewDetails = useCallback((document) => {
    setSelectedDocument(document);
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleApproveDocument = useCallback(async (documentId) => {
    try {
      await handleApprove(documentId);
      message.success('อนุมัติหัวข้อโครงงานพิเศษเรียบร้อยแล้ว');
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, status: 'approved' } : doc
      ));
      fetchData();
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการอนุมัติหัวข้อโครงงานพิเศษ');
    }
  }, [fetchData]);

  const handleRejectDocument = useCallback(async (documentId) => {
    try {
      await handleReject(documentId);
      message.success('ปฏิเสธหัวข้อโครงงานพิเศษเรียบร้อยแล้ว');
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, status: 'rejected' } : doc
      ));
      fetchData();
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการปฏิเสธหัวข้อโครงงานพิเศษ');
    }
  }, [fetchData]);

  const handleApproveSelectedDocuments = useCallback(async () => {
    try {
      await Promise.all(selectedRowKeys.map(documentId => handleApprove(documentId)));
      message.success('อนุมัติหัวข้อโครงงานพิเศษเรียบร้อยแล้ว');
      setSelectedRowKeys([]);
      fetchData();
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการอนุมัติหัวข้อโครงงานพิเศษ');
    }
  }, [selectedRowKeys, fetchData]);

  // Filter handlers
  const handleSearch = useCallback((e) => {
    setSearchText(e.target.value);
  }, []);

  const handleStatusFilterChange = useCallback((value) => {
    setStatusFilter(value);
  }, []);

  // Memoized values
  const filteredDocuments = useMemo(() => 
    documents.filter(doc =>
      (doc.document_name && doc.document_name.toLowerCase().includes(searchText.toLowerCase())) &&
      (statusFilter ? doc.status === statusFilter : true)
    ),
    [documents, searchText, statusFilter]
  );

  const columns = useMemo(() => [
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
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleApproveDocument(record.id)}>อนุมัติ</Button>
          <Button onClick={() => handleRejectDocument(record.id)}>ปฏิเสธ</Button>
        </Space>
      ),
    }] : []),
  ], [statusFilter, handleViewDetails, handleApproveDocument, handleRejectDocument]);

  const rowSelection = useMemo(() => ({
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  }), [selectedRowKeys]);

  // Render
  return (
    <div>
      <Space style={FILTER_SECTION_STYLE}>
        <div>
          <Text className="filter-text">สถานะ:</Text>
          <Segmented
            options={FILTER_OPTIONS}
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
        style={TABLE_STYLE}
      />

      <DocumentDetails 
        document={selectedDocument} 
        open={isModalVisible} 
        onClose={handleCloseModal} 
      />
    </div>
  );
};

export default DocumentManagement;
