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
  Segmented,
  message,
  Tooltip,
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
  FileAddOutlined,
} from "@ant-design/icons";
import DocumentDetails from "./DocumentDetails";
import { useDocuments } from "../../../hooks/admin/useDocuments";
import dayjs from "../../../utils/dayjs";
import { DATE_TIME_FORMAT } from "../../../utils/constants";

const { Text } = Typography;

const DocumentManagement = ({ type }) => {
  // State สำหรับการกรอง
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });
  const [documentType, setDocumentType] = useState(""); // เพิ่ม state สำหรับประเภทเอกสาร

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

  // กรองเอกสารตามสถานะ, คำค้นหา และประเภทเอกสาร
  const filteredDocuments = useMemo(() => {
    return documents.filter(
      (doc) =>
        // เงื่อนไขกรองตามสถานะ (ถ้าเลือก "ทั้งหมด" จะผ่านทุกสถานะ)
        (filters.status === "" || doc.status === filters.status) &&
        // เงื่อนไขกรองตามคำค้นหา (ค้นหาทั้งชื่อเอกสารและชื่อนักศึกษา)
        (filters.search === "" ||
          doc.document_name
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          doc.student_name
            ?.toLowerCase()
            .includes(filters.search.toLowerCase())) &&
        (documentType === "" || doc.document_name?.toLowerCase().includes(documentType.toLowerCase()))
    );
  }, [documents, filters, documentType]);

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
              {/* เอกสารทั้งหมด */}
              <Space>
                <FileTextOutlined
                  style={{ fontSize: "24px", color: "#1890ff" }}
                />
                <Text>เอกสารทั้งหมด: {statistics.total}</Text>
              </Space>
              {/* เพิ่มประเภทเอกสาร CS05 */}
              <Space>
                <FileTextOutlined
                  style={{ fontSize: "24px", color: "#722ed1" }}
                />
                <Text>CS05 {statistics.cs05}</Text>
              </Space>
              {/* เพิ่มประเภทเอกสาร ACCEPTANCE_LETTER */}
              <Space>
                <FileTextOutlined
                  style={{ fontSize: "24px", color: "#13c2c2" }}
                />
                <Text>Acceptance Letter: {statistics.acceptanceLetter}</Text>
              </Space>
              {/* เอกสารรอตรวจสอบ */}
              <Space>
                <FileExclamationOutlined
                  style={{ fontSize: "24px", color: "#fa8c16" }}
                />
                <Text>รอตรวจสอบ: {statistics.pending}</Text>
              </Space>
              {/* เอกสารอนุมัติแล้ว */}
              <Space>
                <FileDoneOutlined
                  style={{ fontSize: "24px", color: "#52c41a" }}
                />
                <Text>อนุมัติแล้ว: {statistics.approved}</Text>
              </Space>
              {/* เอกสารปฏิเสธแล้ว */}
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
          <Col>
            {/* Status filter */}
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
            <Segmented
              options={[
                { label: "CS05", value: "cs05" },
                { label: "Acceptance Letter", value: "ACCEPTANCE_LETTER" },
              ]}
              value={documentType}
              onChange={setDocumentType}
            />
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Space wrap>
              <Tooltip title="รีเฟรช">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={refetch}
                  size="large"
                  shape="square"
                />
              </Tooltip>
              {filters.status === "pending" && (
                <>
                  <Tooltip
                    title={`อนุมัติที่เลือก (${selectedRowKeys.length})`}
                  >
                    <Button
                      type="primary"
                      onClick={handleApproveSelectedDocuments}
                      disabled={selectedRowKeys.length === 0}
                      icon={<CheckCircleOutlined />}
                      size="large"
                      shape="square"
                    />
                  </Tooltip>
                  <Tooltip title={`ปฏิเสธที่เลือก (${selectedRowKeys.length})`}>
                    <Button
                      type="danger"
                      onClick={handleRejectSelectedDocuments}
                      disabled={selectedRowKeys.length === 0}
                      icon={<CloseCircleOutlined />}
                      size="large"
                      shape="square"
                    />
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
