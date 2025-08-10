import React, { useCallback, useMemo, useState, useEffect } from "react";
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
  message,
  Tooltip,
  Tabs,
  Select,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  FileExclamationOutlined,
  FileDoneOutlined,
  CloseCircleOutlined,
  FileProtectOutlined,
} from "@ant-design/icons";
import DocumentDetails from "./DocumentDetails";
import { useDocuments } from "../../../hooks/admin/useDocuments";
import dayjs from "../../../utils/dayjs";
import { DATE_TIME_FORMAT } from "../../../utils/constants";
import CertificateManagement from "./CertificateManagement";

const { Text, Title } = Typography;

const DocumentManagement = ({ type }) => {
  const [activeTab, setActiveTab] = useState("documents");

  // หาก type ไม่ใช่ internship ให้แสดงแค่เอกสารปกติ
  if (type !== "internship") {
    return <OriginalDocumentManagement type={type} />;
  }

  const tabItems = [
    {
      key: "documents",
      label: (
        <span>
          <FileTextOutlined />
          เอกสารฝึกงาน
        </span>
      ),
      children: <OriginalDocumentManagement type={type} />,
    },
    {
      key: "certificates",
      label: (
        <span>
          <FileProtectOutlined />
          หนังสือรับรอง
        </span>
      ),
      children: <CertificateManagement />,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
};

// แยก component เดิมออกมา
const OriginalDocumentManagement = ({ type }) => {
  // State สำหรับการกรอง
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });

  // State สำหรับการแสดง Modal
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  //const [documentType, setDocumentType] = useState("");

  // ใช้ custom hook
  const {
    documents,
    statistics,
    isLoading,
    approveDocument,
    rejectDocument,
    refetch,
  } = useDocuments({
    type, // ใช้ type จาก props
    status: filters.status,
    search: filters.search,
  });

  useEffect(() => {
    console.log("Documents fetched:", documents);
  }, [documents]);

  // ฟังก์ชัน set filters
  const setSearchText = useCallback((text) => {
    setFilters((prev) => ({ ...prev, search: text }));
  }, []);

  const setStatusFilter = useCallback((status) => {
    setFilters((prev) => ({ ...prev, status }));
    setSelectedRowKeys([]);
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
        (filters.status === "" || doc.status === filters.status) &&
        (
          doc.document_name
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          doc.student_name?.toLowerCase().includes(filters.search.toLowerCase())
        ) /* &&
        (
          documentType === "" ||
          doc.document_type
            ?.toLowerCase()
            .includes(documentType.toLowerCase())
        ) */
    );
  }, [documents, filters]);

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
        title: "วันที่อัปโหลด",
        dataIndex: "created_at", // หรือ updated_at หากต้องการใช้ updated_at
        key: "created_at",
        render: (text) => dayjs(text).format(DATE_TIME_FORMAT),
        sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        key: "status",
        render: (status, record) => {
          // กำหนดข้อความตามเงื่อนไข:
          // - pending + ไม่มี reviewerId => "รอตรวจสอบ"
          // - pending + มี reviewerId => "รอหัวหน้าภาคอนุมัติ"
          // - approved => "อนุมัติ"
          // - rejected => "ปฏิเสธ"
          const isPending = status === "pending";
          const hasReviewer = !!record.reviewerId;
          const color = isPending ? "orange" : status === "approved" ? "green" : status === "rejected" ? "red" : "default";
          const text = isPending
            ? hasReviewer
              ? "รอหัวหน้าภาคอนุมัติ"
              : "รอตรวจสอบ"
            : status === "approved"
            ? "อนุมัติ"
            : status === "rejected"
            ? "ปฏิเสธ"
            : status;
          return <Tag color={color}>{text}</Tag>;
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

  const handleRejectSelectedDocuments = useCallback(async () => {
    try {
      const promises = selectedRowKeys.map((documentId) =>
        rejectDocument(documentId)
      );
      await Promise.all(promises);
      message.success("ปฏิเสธเอกสารที่เลือกเรียบร้อยแล้ว");
      setSelectedRowKeys([]);
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการปฏิเสธเอกสาร");
    }
  }, [selectedRowKeys, rejectDocument]);

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

        {/* ส่วนตัวกรอง (สไตล์เดียวกับหนังสือรับรอง) */}
        <Row gutter={[16, 16]} style={{ marginBottom: "16px" }} align="middle">
          <Col xs={24} md={12}>
            <Input
              placeholder="ค้นหาเอกสาร หรือชื่อนักศึกษา"
              value={filters.search}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} md={12} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space size="small" wrap>
              <Select
                size="small"
                style={{ width: 160 }}
                placeholder="สถานะ"
                options={[
                  { label: "ทั้งหมด", value: "" },
                  { label: "รอตรวจสอบ", value: "pending" },
                  { label: "อนุมัติแล้ว", value: "approved" },
                  { label: "ปฏิเสธแล้ว", value: "rejected" },
                ]}
                value={filters.status}
                onChange={setStatusFilter}
                allowClear
              />
              <Button icon={<ReloadOutlined />} onClick={refetch}>
                รีเฟรช
              </Button>
              {filters.status === "pending" && (
                <>
                  <Tooltip title={`อนุมัติที่เลือก (${selectedRowKeys.length})`}>
                    <Button
                      type="primary"
                      onClick={handleApproveSelectedDocuments}
                      disabled={selectedRowKeys.length === 0}
                      icon={<CheckCircleOutlined />}
                      size="small"
                    >
                      อนุมัติที่เลือก
                    </Button>
                  </Tooltip>
                  <Tooltip title={`ปฏิเสธที่เลือก (${selectedRowKeys.length})`}>
                    <Button
                      danger
                      onClick={handleRejectSelectedDocuments}
                      disabled={selectedRowKeys.length === 0}
                      icon={<CloseCircleOutlined />}
                      size="small"
                    >
                      ปฏิเสธที่เลือก
                    </Button>
                  </Tooltip>
                </>
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
