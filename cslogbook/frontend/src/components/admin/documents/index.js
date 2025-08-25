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
  Modal,
  Form,
  Input as AntInput
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
import { internshipApprovalService } from "../../../services/internshipApprovalService"; // ใช้สำหรับ "ตรวจและส่งต่อ" เอกสารฝึกงาน
import { documentService } from "../../../services/admin/documentService"; // ใช้สำหรับอัปเดตสถานะเอกสารทั่วไป

const { Text } = Typography;

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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Space>
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
  // Modal ปฏิเสธ
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [form] = Form.useForm();
  //const [documentType, setDocumentType] = useState("");

  // ใช้ custom hook
  const {
    documents,
    statistics,
    isLoading,
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
        render: (text, record) => {
          // แปลชื่อเอกสารเป็นภาษาไทยตามที่ร้องขอ
          const upper = (text || '').toUpperCase();
          let display = text;
          if (upper === 'CS05') display = 'คำร้องขอฝึกงาน (คพ.05)';
          else if (upper === 'ACCEPTANCE_LETTER') display = 'หนังสือตอบรับการฝึกงาน';
          return (
            <Button type="link" onClick={() => showDocumentDetails(record.id)}>
              {display}
            </Button>
          );
        },
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
    // ปรับตาม workflow ใหม่: เจ้าหน้าที่ภาค "ตรวจและส่งต่อ"
    // - ถ้าเป็น CS05 เรียก endpoint เฉพาะ: reviewByStaff (status = pending + reviewerId)
    // - ถ้าเป็นเอกสารอื่น (เช่น Acceptance Letter) ใช้ admin /documents/:id/status ให้เป็น pending เพื่อบันทึก reviewerId
    try {
      // หาเอกสารจากตารางตาม selectedRowKeys เพื่อรู้ชนิดเอกสาร
      const idToDoc = new Map(filteredDocuments.map((d) => [d.id, d]));

      const ops = selectedRowKeys.map((documentId) => {
        const doc = idToDoc.get(documentId);
  const name = doc?.document_name?.toUpperCase() || '';

        // เงื่อนไขถือเป็น CS05 เมื่อชื่อเอกสารคือ CS05
        const isCS05 = name === 'CS05';

        if (isCS05) {
          return internshipApprovalService.reviewByStaff(documentId, null);
        }
        // สำหรับ Acceptance Letter: ตรวจและส่งต่อเหมือน CS05 (pending + reviewerId)
        if (name === 'ACCEPTANCE_LETTER') {
          return internshipApprovalService.reviewAcceptanceByStaff(documentId, null);
        }
        // เอกสารอื่นคงเดิม: อนุมัติผ่าน admin route
        return documentService.approveDocument(documentId);
      });

      await Promise.all(ops);
      message.success("ดำเนินการกับเอกสารที่เลือกเรียบร้อยแล้ว");
      setSelectedRowKeys([]);
      await refetch();
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการตรวจและส่งต่อเอกสาร");
    }
  }, [selectedRowKeys, filteredDocuments, refetch]);

  const openRejectModal = useCallback(() => {
    if (selectedRowKeys.length === 0) return;
    form.resetFields();
    setRejectModalOpen(true);
  }, [selectedRowKeys, form]);

  const handleRejectSelectedDocuments = useCallback(async () => {
    try {
      const { reason } = await form.validateFields();
      setRejectSubmitting(true);
      await Promise.all(selectedRowKeys.map((id) => rejectDocument(id, reason.trim())));
      message.success("ปฏิเสธเอกสารที่เลือกเรียบร้อยแล้ว");
      setSelectedRowKeys([]);
      setRejectModalOpen(false);
    } catch (error) {
      if (error?.errorFields) return; // validation error
      message.error("เกิดข้อผิดพลาดในการปฏิเสธเอกสาร");
    } finally {
      setRejectSubmitting(false);
    }
  }, [selectedRowKeys, rejectDocument, form]);

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: setSelectedRowKeys,
      // ป้องกันการเลือกเอกสารที่ถูกส่งต่อแล้ว (มี reviewerId แล้ว)
      getCheckboxProps: (record) => ({ disabled: !!record.reviewerId }),
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
                <Button icon={<ReloadOutlined />} onClick={refetch}>รีเฟรช</Button>
                {filters.status === "pending" && (
                  <>
                    <Tooltip title={`ตรวจและส่งต่อที่เลือก (${selectedRowKeys.length})`}>
                      <Button
                        type="primary"
                        onClick={handleApproveSelectedDocuments}
                        disabled={selectedRowKeys.length === 0}
                        icon={<CheckCircleOutlined />}
                        size="small"
                      >
                        ตรวจและส่งต่อที่เลือก
                      </Button>
                    </Tooltip>
                    <Tooltip title={`ปฏิเสธที่เลือก (${selectedRowKeys.length})`}>
                      <Button
                        danger
                        onClick={openRejectModal}
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

          {/* ตารางเอกสาร */}
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
      </Space>

      {/* Modal แสดงรายละเอียดเอกสาร */}
      <DocumentDetails
        documentId={selectedDocumentId}
        open={isModalVisible}
        onClose={closeDocumentDetails}
      />

      <Modal
        title="ระบุเหตุผลการปฏิเสธ"
        open={rejectModalOpen}
        onCancel={() => { if (!rejectSubmitting) setRejectModalOpen(false); }}
        onOk={handleRejectSelectedDocuments}
        okText="ปฏิเสธ"
        confirmLoading={rejectSubmitting}
        okButtonProps={{ danger: true }}
        cancelText="ยกเลิก"
      >
        <Form form={form} layout="vertical" name="adminRejectReasonForm">
          <Form.Item
            label="เหตุผล (อย่างน้อย 10 ตัวอักษร)"
            name="reason"
            rules={[
              { required: true, message: 'กรุณากรอกเหตุผล' },
              { min: 10, message: 'กรุณาระบุอย่างน้อย 10 ตัวอักษร' }
            ]}
          >
            <AntInput.TextArea
              placeholder="เช่น ข้อมูลบริษัทไม่ครบ, ไฟล์ไม่ถูกต้อง, วันที่ฝึกงานไม่ถูกต้อง ฯลฯ"
              rows={5}
              maxLength={500}
              showCount
            />
          </Form.Item>
          <div style={{ fontSize: 12, color: '#888' }}>
            จะปฏิเสธทั้งหมด {selectedRowKeys.length} เอกสาร
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentManagement;
