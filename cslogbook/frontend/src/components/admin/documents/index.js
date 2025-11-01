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
  Input as AntInput,
  Statistic,
  Spin,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  CloseCircleOutlined,
  FileProtectOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import DocumentDetails from "./DocumentDetails";
import { useDocuments } from "../../../hooks/admin/useDocuments";
import dayjs from "../../../utils/dayjs";
import { DATE_TIME_FORMAT } from "../../../utils/constants";
import CertificateManagement from "./CertificateManagement";
import { internshipApprovalService } from "../../../services/internshipApprovalService";
import { documentService } from "../../../services/admin/documentService";

const { Text, Title } = Typography;

// Container style ตาม StaffKP02Queue pattern
const containerStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: 24,
};

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
    <div style={containerStyle}>
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
    academicYear: "all",
    semester: "all",
  });

  // State สำหรับการแสดง Modal
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // Modal ปฏิเสธ
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [form] = Form.useForm();

  // ใช้ custom hook
  const {
    documents,
    isLoading,
    rejectDocument,
    refetch,
  } = useDocuments({
    type,
    status: filters.status,
    search: filters.search,
    academicYear: filters.academicYear !== "all" ? filters.academicYear : undefined,
    semester: filters.semester !== "all" ? filters.semester : undefined,
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

  // ตัวเลือกปีการศึกษา (academicYear)
  const academicYearOptions = useMemo(() => {
    const years = new Set();
    (documents || []).forEach((doc) => {
      if (doc.academicYear) {
        years.add(doc.academicYear);
      }
    });
    return Array.from(years)
      .filter(Boolean)
      .sort((a, b) => b - a) // เรียงจากมากไปน้อย
      .map((year) => ({ label: `${year}`, value: year }));
  }, [documents]);

  // ตัวเลือกภาคเรียน
  const semesterOptions = [
    { label: "ภาคเรียนที่ 1", value: 1 },
    { label: "ภาคเรียนที่ 2", value: 2 },
    { label: "ภาคฤดูร้อน", value: 3 },
  ];

  // กรองเอกสารตามสถานะ, คำค้นหา และประเภทเอกสาร (ส่วนใหญ่กรองที่ API แล้ว)
  const filteredDocuments = useMemo(() => {
    return documents.filter(
      (doc) =>
        (filters.status === "" || doc.status === filters.status) &&
        (
          doc.document_name
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          doc.student_name?.toLowerCase().includes(filters.search.toLowerCase())
        )
    );
  }, [documents, filters]);

  // สรุปสถิติตาม StaffKP02Queue pattern
  const summary = useMemo(() => {
    const total = filteredDocuments.length;
    const pending = filteredDocuments.filter(doc => doc.status === "pending" && !doc.reviewerId).length;
    const reviewing = filteredDocuments.filter(doc => doc.status === "pending" && doc.reviewerId).length;
    const approved = filteredDocuments.filter(doc => doc.status === "approved").length;
    const rejected = filteredDocuments.filter(doc => doc.status === "rejected").length;
    const cs05 = filteredDocuments.filter(doc => doc.document_name?.toUpperCase() === "CS05").length;
    const acceptanceLetter = filteredDocuments.filter(doc => doc.document_name?.toUpperCase() === "ACCEPTANCE_LETTER").length;

    return {
      total,
      pending,
      reviewing,
      approved,
      rejected,
      cs05,
      acceptanceLetter
    };
  }, [filteredDocuments]);

  // คอลัมน์ตาราง
  const columns = useMemo(
    () => [
      {
        title: "เอกสาร",
        dataIndex: "document_name",
        key: "document_name",
        render: (text, record) => {
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
        dataIndex: "created_at",
        key: "created_at",
        render: (text) => dayjs(text).format(DATE_TIME_FORMAT),
        sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        key: "status",
        render: (status, record) => {
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
      {
        title: "การจัดการ",
        key: "actions",
        width: 120,
        render: (_, record) => (
          <Space size="small">
            <Tooltip title="ดูรายละเอียด">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => showDocumentDetails(record.id)}
                size="small"
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [showDocumentDetails]
  );

  // การจัดการเหตุการณ์
  const handleApproveSelectedDocuments = useCallback(async () => {
    try {
      const idToDoc = new Map(filteredDocuments.map((d) => [d.id, d]));

      const ops = selectedRowKeys.map((documentId) => {
        const doc = idToDoc.get(documentId);
        const name = doc?.document_name?.toUpperCase() || '';

        const isCS05 = name === 'CS05';

        if (isCS05) {
          return internshipApprovalService.reviewByStaff(documentId, null);
        }
        if (name === 'ACCEPTANCE_LETTER') {
          return internshipApprovalService.reviewAcceptanceByStaff(documentId, null);
        }
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
      if (error?.errorFields) return;
      message.error("เกิดข้อผิดพลาดในการปฏิเสธเอกสาร");
    } finally {
      setRejectSubmitting(false);
    }
  }, [selectedRowKeys, rejectDocument, form]);

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: setSelectedRowKeys,
      getCheckboxProps: (record) => ({ disabled: !!record.reviewerId }),
    }),
    [selectedRowKeys]
  );


  // JSX
  return (
    <div style={containerStyle}>
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        {/* Header */}
        <div>
          <Title level={4} style={{ margin: 0 }}>
            จัดการเอกสารฝึกงาน
          </Title>
          <Text type="secondary">
            ตรวจสอบและอนุมัติเอกสารฝึกงานของนักศึกษา
          </Text>
        </div>

        {/* Summary Statistics Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="รอตรวจสอบ"
                value={summary.pending}
                suffix="รายการ"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="รอหัวหน้าภาคอนุมัติ"
                value={summary.reviewing}
                suffix="รายการ"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="อนุมัติแล้ว"
                value={summary.approved}
                suffix="รายการ"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="ทั้งหมด"
                value={summary.total}
                suffix="รายการ"
              />
            </Card>
          </Col>
        </Row>

        {/* Document Type Statistics */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="คำร้องขอฝึกงาน (คพ.05)"
                value={summary.cs05}
                suffix="รายการ"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="หนังสือตอบรับ"
                value={summary.acceptanceLetter}
                suffix="รายการ"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="ปฏิเสธแล้ว"
                value={summary.rejected}
                suffix="รายการ"
              />
            </Card>
          </Col>
        </Row>

        {/* Filters Section */}
        <Card size="small" styles={{ body: { padding: 16 } }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={5}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text strong>สถานะเอกสาร</Text>
                <Select
                  style={{ width: "100%" }}
                  placeholder="เลือกสถานะ"
                  value={filters.status}
                  onChange={setStatusFilter}
                  options={[
                    { label: "ทั้งหมด", value: "" },
                    { label: "รอตรวจสอบ", value: "pending" },
                    { label: "อนุมัติแล้ว", value: "approved" },
                    { label: "ปฏิเสธแล้ว", value: "rejected" },
                  ]}
                  allowClear
                />
              </Space>
            </Col>
            <Col xs={24} md={4}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text strong>ปีการศึกษา</Text>
                <Select
                  style={{ width: "100%" }}
                  placeholder="ทุกปีการศึกษา"
                  value={filters.academicYear}
                  onChange={(v) => setFilters((f) => ({ ...f, academicYear: v }))}
                  options={[{ label: "ทุกปีการศึกษา", value: "all" }, ...academicYearOptions]}
                  allowClear
                />
              </Space>
            </Col>
            <Col xs={24} md={4}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text strong>ภาคเรียน</Text>
                <Select
                  style={{ width: "100%" }}
                  placeholder="ทุกภาคเรียน"
                  value={filters.semester}
                  onChange={(v) => setFilters((f) => ({ ...f, semester: v }))}
                  options={[{ label: "ทุกภาคเรียน", value: "all" }, ...semesterOptions]}
                  allowClear
                />
              </Space>
            </Col>
            <Col xs={24} md={5}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text strong>ค้นหา</Text>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="ค้นหาเอกสาร หรือชื่อนักศึกษา"
                  value={filters.search}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} md={6} style={{ textAlign: 'right', paddingTop: 24 }}>
              <Space wrap>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={refetch}
                >
                  รีเฟรช
                </Button>
                {filters.status === "pending" && (
                  <>
                    <Tooltip title={`ตรวจและส่งต่อที่เลือก (${selectedRowKeys.length})`}>
                      <Button
                        type="primary"
                        onClick={handleApproveSelectedDocuments}
                        disabled={selectedRowKeys.length === 0}
                        icon={<CheckCircleOutlined />}
                      >
                        ตรวจและส่งต่อ
                      </Button>
                    </Tooltip>
                    <Tooltip title={`ปฏิเสธที่เลือก (${selectedRowKeys.length})`}>
                      <Button
                        danger
                        onClick={openRejectModal}
                        disabled={selectedRowKeys.length === 0}
                        icon={<CloseCircleOutlined />}
                      >
                        ปฏิเสธ
                      </Button>
                    </Tooltip>
                  </>
                )}
              </Space>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Button
                onClick={() => {
                  setFilters({ status: "", search: "", academicYear: "all", semester: "all" });
                  setSelectedRowKeys([]);
                }}
              >
                รีเซ็ตตัวกรอง
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Table with Expandable Rows */}
        <Spin spinning={isLoading} tip="กำลังโหลดข้อมูล">
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
        </Spin>
      </Space>

      {/* Modal แสดงรายละเอียดเอกสาร */}
      <DocumentDetails
        documentId={selectedDocumentId}
        open={isModalVisible}
        onClose={closeDocumentDetails}
      />

      {/* Modal ปฏิเสธ */}
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
