import React, { useCallback, useMemo, useState } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Card,
  Segmented,
  message,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  FileExclamationOutlined,
  FileDoneOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import DocumentDetails from "./DocumentDetails";
import { useDocuments } from "../../../hooks/admin/useDocuments";
import moment from "moment-timezone";

const { Text, Title } = Typography;

const DocumentManagement = () => {
  // State สำหรับการกรอง
  const [filters, setFilters] = useState({
    type: "all",
    status: "",
    search: "",
  });

  // State สำหรับการแสดง Modal
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // ใช้ custom hook
  const {
    documents,
    statistics,
    isLoading,
    approveDocument,
    rejectDocument,
    refetch,
  } = useDocuments({
    type: filters.type,
    status: filters.status,
    search: filters.search,
  });

  // ฟังก์ชัน set filters
  const setSearchText = useCallback((text) => {
    setFilters((prev) => ({ ...prev, search: text }));
  }, []);

  const setStatusFilter = useCallback((status) => {
    setFilters((prev) => ({ ...prev, status: status }));
    setSelectedRowKeys([]);
  }, []);

  const setTypeFilter = useCallback((type) => {
    setFilters((prev) => ({ ...prev, type: type }));
  }, []);

  // ฟังก์ชันจัดการ Modal
  const showDocumentDetails = useCallback((documentId) => {
    setSelectedDocumentId(documentId);
    setIsModalVisible(true);
  }, []);

  const closeDocumentDetails = useCallback(() => {
    setIsModalVisible(false);
    setSelectedDocumentId(null);
  }, []);

  // กรองเอกสารตามเงื่อนไข
  const filteredDocuments = useMemo(() => {
    return documents.filter(
      (doc) =>
        doc.document_name
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        doc.student_name?.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [documents, filters.search]);

  // คอลัมน์ตาราง
  const columns = useMemo(
    () => [
      {
        title: "เอกสาร",
        dataIndex: "document_name",
        key: "document_name",
        render: (text, record) => (
          <Button type="link" onClick={() => showDocumentDetails(record.id)}>
            {text}
          </Button>
        ),
      },
      {
        title: "ชื่อนักศึกษา",
        dataIndex: "student_name",
        key: "student_name",
        sorter: (a, b) => a.student_name.localeCompare(b.student_name),
      },
      {
        title: "ประเภทเอกสาร",
        dataIndex: "type",
        key: "type",
        render: (type) =>
          type === "internship" ? "เอกสารฝึกงาน" : "เอกสารโครงงาน",
      },
      {
        title: "วันที่อัปโหลด",
        dataIndex: "upload_date",
        key: "upload_date",
        render: (text) =>
          moment(text).tz("Asia/Bangkok").format("YYYY-MM-DD HH:mm"),
        sorter: (a, b) => new Date(a.upload_date) - new Date(b.upload_date),
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const statusColors = {
            pending: "orange",
            approved: "green",
            rejected: "red",
          };
          const statusText = {
            pending: "รอตรวจสอบ",
            approved: "อนุมัติ",
            rejected: "ปฏิเสธ",
          };
          return <Tag color={statusColors[status]}>{statusText[status]}</Tag>;
        },
      },
    ],
    [showDocumentDetails]
  );

  // การจัดการเหตุการณ์
  const handleApproveSelectedDocuments = useCallback(async () => {
    try {
      const promises = selectedRowKeys.map((documentId) =>
        approveDocument(documentId)
      );
      await Promise.all(promises);
      message.success("อนุมัติเอกสารที่เลือกเรียบร้อยแล้ว");
      setSelectedRowKeys([]);
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการอนุมัติเอกสาร");
    }
  }, [selectedRowKeys, approveDocument]);

  const handleResetFilters = useCallback(() => {
    setFilters({ type: "all", status: "", search: "" });
    setSelectedRowKeys([]);
  }, []);

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: setSelectedRowKeys,
    }),
    [selectedRowKeys]
  );

  // JSX
  return (
    <div className="admin-document-container" style={{ padding: "24px" }}>
      <Card>
        {/* ส่วนแสดงสถิติ */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col>
            <Space size="large">
              <Space>
                <FileTextOutlined
                  style={{ fontSize: "24px", color: "#1890ff" }}
                />
                <Text>เอกสารทั้งหมด: {statistics.total}</Text>
              </Space>
              <Space>
                <FileExclamationOutlined
                  style={{ fontSize: "24px", color: "#fa8c16" }}
                />
                <Text>รอตรวจสอบ: {statistics.pending}</Text>
              </Space>
              <Space>
                <FileDoneOutlined
                  style={{ fontSize: "24px", color: "#52c41a" }}
                />
                <Text>อนุมัติแล้ว: {statistics.approved}</Text>
              </Space>
              <Space>
                <CloseCircleOutlined
                  style={{ fontSize: "24px", color: "#f5222d" }}
                />
                <Text>ปฏิเสธแล้ว: {statistics.rejected}</Text>
              </Space>
            </Space>
          </Col>
        </Row>

        {/* ส่วนตัวกรอง */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="ค้นหาเอกสาร หรือชื่อนักศึกษา"
              value={filters.search}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            {/* เพิ่ม Segmented Control สำหรับประเภทเอกสาร */}
            <Segmented
              options={[
                { label: "ทั้งหมด", value: "all" },
                { label: "เอกสารฝึกงาน", value: "internship" },
                { label: "เอกสารโครงงานพิเศษ", value: "project" },
              ]}
              value={filters.type}
              onChange={setTypeFilter}
              style={{ marginBottom: '8px', width: '100%' }}
            />
            
            {/* Status filter ที่มีอยู่แล้ว */}
            <Segmented
              options={[
                { label: "ทั้งหมด", value: "" },
                { label: "รอตรวจสอบ", value: "pending" },
                { label: "อนุมัติแล้ว", value: "approved" },
                { label: "ปฏิเสธแล้ว", value: "rejected" },
              ]}
              value={filters.status}
              onChange={setStatusFilter}
            />
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={refetch} size="small">
                รีเฟรช
              </Button>
              <Button onClick={handleResetFilters} size="small">
                รีเซ็ตตัวกรอง
              </Button>
              {filters.status === "pending" && (
                <Button
                  type="primary"
                  onClick={handleApproveSelectedDocuments}
                  disabled={selectedRowKeys.length === 0}
                  icon={<CheckCircleOutlined />}
                  size="small"
                >
                  อนุมัติที่เลือก ({selectedRowKeys.length})
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* ส่วนตาราง */}
        <Table
          loading={isLoading}
          rowSelection={filters.status === "pending" ? rowSelection : null}
          columns={columns}
          dataSource={filteredDocuments}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
          }}
          bordered
          title={() => `รายการเอกสาร (${filteredDocuments.length} รายการ)`}
        />
      </Card>

      {/* Modal แสดงรายละเอียดเอกสาร */}
      <DocumentDetails
        documentId={selectedDocumentId}
        open={isModalVisible}
        onClose={closeDocumentDetails}
      />
    </div>
  );
};

export default DocumentManagement;
