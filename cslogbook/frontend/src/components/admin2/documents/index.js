import React, { useCallback, useMemo } from 'react';
import { Table, Button, message, Input, Segmented, Space, Typography, Tag } from 'antd';
import DocumentDetails from './DocumentDetails';
import DocumentFilters from './DocumentFilters';
import moment from 'moment-timezone';
import { useDocumentContext } from '../../../contexts/adminContext/DocumentContext';

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
};

const DocumentManagement = () => {
  // ใช้ context แทนการใช้ state เฉพาะที่
  const {
    documents,
    loading,
    filters,
    isModalVisible,
    selectedDocumentId,
    loadDocuments,
    approveDocument,
    rejectDocument,
    setSearchText,
    setStatusFilter,
    showDocumentDetails,
    closeDocumentDetails
  } = useDocumentContext();

  // ฟิลเตอร์ข้อมูลตามตัวกรอง
  const filteredDocuments = useMemo(() => 
    documents.filter(doc =>
        (doc.document_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
         doc.student_name?.toLowerCase().includes(filters.search.toLowerCase())) &&
        (filters.status ? doc.status === filters.status : true)
    ),
    [documents, filters.search, filters.status]
  );

  // จัดการการเลือกแถวในตาราง
  const [selectedRowKeys, setSelectedRowKeys] = React.useState([]);

  // การจัดการเหตุการณ์ต่างๆ
  const handleViewDetails = useCallback((document) => {
    showDocumentDetails(document.id);
  }, [showDocumentDetails]);

  const handleCloseModal = useCallback(() => {
    closeDocumentDetails();
  }, [closeDocumentDetails]);

  const handleApproveDocument = useCallback(async (documentId) => {
    try {
      const success = await approveDocument(documentId);
      if (success) {
        message.success('อนุมัติเอกสารเรียบร้อยแล้ว');
      }
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการอนุมัติเอกสาร');
    }
  }, [approveDocument]);

  const handleRejectDocument = useCallback(async (documentId) => {
    try {
      const success = await rejectDocument(documentId);
      if (success) {
        message.success('ปฏิเสธเอกสารเรียบร้อยแล้ว');
      }
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการปฏิเสธเอกสาร');
    }
  }, [rejectDocument]);

  const handleApproveSelectedDocuments = useCallback(async () => {
    try {
      const promises = selectedRowKeys.map(documentId => approveDocument(documentId));
      await Promise.all(promises);
      message.success('อนุมัติเอกสารที่เลือกเรียบร้อยแล้ว');
      setSelectedRowKeys([]);
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการอนุมัติเอกสาร');
    }
  }, [selectedRowKeys, approveDocument]);

  // รีเซ็ตตัวกรอง
  const handleResetFilters = useCallback(() => {
    setSearchText('');
    setStatusFilter('');
  }, [setSearchText, setStatusFilter]);

  // คอลัมน์ตาราง
  const columns = useMemo(() => [
    {
        title: 'เอกสาร',
        dataIndex: 'document_name',
        key: 'document_name',
        render: (text, record) => (
            <Button type="link" onClick={() => handleViewDetails(record)}>
                {text}
            </Button>
        ),
    },
    {
        title: 'ชื่อนักศึกษา',
        dataIndex: 'student_name',
        key: 'student_name',
        sorter: (a, b) => a.student_name.localeCompare(b.student_name),
    },
    {
        title: 'ประเภทเอกสาร',
        dataIndex: 'type',
        key: 'type',
        render: (type) => type === 'internship' ? 'เอกสารฝึกงาน' : 'เอกสารโครงงาน',
        onFilter: (value, record) => record.type === value,
    },
    {
        title: 'วันที่อัปโหลด',
        dataIndex: 'upload_date',
        key: 'upload_date',
        render: (text) => moment(text).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm'),
        sorter: (a, b) => new Date(a.upload_date) - new Date(b.upload_date),
    },
    {
        title: 'สถานะ',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
            const statusColors = {
                pending: 'orange',
                approved: 'green',
                rejected: 'red'
            };
            return <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>;
        },
    },
    ...(filters.status === 'pending' ? [{
        title: 'การดำเนินการ',
        key: 'actions',
        render: (_, record) => (
            <Space>
                <Button type="primary" onClick={() => handleApproveDocument(record.id)}>
                    อนุมัติ
                </Button>
                <Button danger onClick={() => handleRejectDocument(record.id)}>
                    ปฏิเสธ
                </Button>
            </Space>
        ),
    }] : []),
  ], [filters.status, handleViewDetails, handleApproveDocument, handleRejectDocument]);

  const rowSelection = useMemo(() => ({
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  }), [selectedRowKeys]);

  // Render
  return (
    <div>
      {/* ใช้ DocumentFilters component แทนการใช้ Space โดยตรง */}
      <DocumentFilters 
        searchText={filters.search}
        statusFilter={filters.status}
        onSearchChange={setSearchText}
        onStatusChange={setStatusFilter}
        onReset={handleResetFilters}
      />

      {filters.status === 'pending' && (
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
        loading={loading}
        rowSelection={filters.status === 'pending' ? rowSelection : null}
        columns={columns}
        dataSource={filteredDocuments}
        rowKey="id"
        style={TABLE_STYLE}
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `ทั้งหมด ${total} รายการ`
        }}
      />

      <DocumentDetails 
        documentId={selectedDocumentId} 
        open={isModalVisible} 
        onClose={handleCloseModal} 
      />
    </div>
  );
};

export default DocumentManagement;