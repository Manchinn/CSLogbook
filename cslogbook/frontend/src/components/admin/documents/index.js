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
  Badge,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  CloseCircleOutlined,
  FileProtectOutlined,
  EyeOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import DocumentDetails from "./DocumentDetails";
import { useDocuments } from "../../../hooks/admin/useDocuments";
import dayjs from "../../../utils/dayjs";
import CertificateManagement from "features/internship/components/admin-view/CertificateManagement";
import { internshipApprovalService } from "features/internship/services";
import { documentService } from "../../../services/admin/documentService";
import { getLateSubmissions } from "features/reports/services/deadlineReportService";

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
    status: "pending", // เปลี่ยน default เป็น pending
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

  // State สำหรับ late submissions
  const [lateSubmissions, setLateSubmissions] = useState([]);
  const [lateSubmissionsLoading, setLateSubmissionsLoading] = useState(false);

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

  // Fetch late submissions เมื่อ type เป็น internship
  const fetchLateSubmissions = useCallback(async () => {
    if (type !== 'internship') return;
    
    setLateSubmissionsLoading(true);
    try {
      const params = {
        relatedTo: 'internship'
      };
      
      if (filters.academicYear !== 'all') {
        params.academicYear = filters.academicYear;
      }
      if (filters.semester !== 'all') {
        params.semester = filters.semester;
      }
      
      const response = await getLateSubmissions(params);
      setLateSubmissions(response.data || []);
    } catch (error) {
      console.error('Error fetching late submissions:', error);
      setLateSubmissions([]);
    } finally {
      setLateSubmissionsLoading(false);
    }
  }, [type, filters.academicYear, filters.semester]);

  useEffect(() => {
    fetchLateSubmissions();
  }, [fetchLateSubmissions]);

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

  // สร้าง Map สำหรับ lookup late submission ตาม documentId
  const lateSubmissionsMap = useMemo(() => {
    const map = new Map();
    lateSubmissions.forEach(late => {
      if (late.documentId) {
        map.set(late.documentId, late);
      }
    });
    return map;
  }, [lateSubmissions]);

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
    
    // นับจำนวนเอกสารที่ส่งช้า
    const late = filteredDocuments.filter(doc => {
      const lateInfo = lateSubmissionsMap.get(doc.id);
      return lateInfo && lateInfo.status === 'late';
    }).length;
    
    const veryLate = filteredDocuments.filter(doc => {
      const lateInfo = lateSubmissionsMap.get(doc.id);
      return lateInfo && lateInfo.status === 'very_late';
    }).length;
    
    const overdue = filteredDocuments.filter(doc => {
      const lateInfo = lateSubmissionsMap.get(doc.id);
      return lateInfo && lateInfo.status === 'overdue';
    }).length;
    
    const totalLate = late + veryLate + overdue;

    return {
      total,
      pending,
      reviewing,
      approved,
      rejected,
      cs05,
      acceptanceLetter,
      late,
      veryLate,
      overdue,
      totalLate
    };
  }, [filteredDocuments, lateSubmissionsMap]);

  // คอลัมน์ตาราง - เน้นความกระชับและข้อมูลสำคัญ
  const columns = useMemo(
    () => [
      {
        title: "เอกสาร / นักศึกษา",
        dataIndex: "document_name",
        key: "document_info",
        width: 300,
        render: (text, record) => {
          const upper = (text || '').toUpperCase();
          let docName = text;
          let docIcon = <FileTextOutlined />;
          
          if (upper === 'CS05') {
            docName = 'คำร้องขอฝึกงาน (คพ.05)';
            docIcon = <FileTextOutlined style={{ color: '#1890ff' }} />;
          } else if (upper === 'ACCEPTANCE_LETTER') {
            docName = 'หนังสือตอบรับการฝึกงาน';
            docIcon = <FileProtectOutlined style={{ color: '#52c41a' }} />;
          }
          
          return (
            <Space direction="vertical" size={2}>
              <Button 
                type="link" 
                onClick={() => showDocumentDetails(record.id)}
                style={{ padding: 0, height: 'auto', fontWeight: 500 }}
                icon={docIcon}
              >
                {docName}
              </Button>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {record.student_name}
              </Text>
            </Space>
          );
        },
        sorter: (a, b) => a.student_name.localeCompare(b.student_name),
      },
      {
        title: "วันที่ส่ง",
        dataIndex: "created_at",
        key: "created_at",
        width: 150,
        render: (text) => (
          <Text style={{ fontSize: 13 }}>
            {dayjs(text).format('DD/MM/BBBB HH:mm')}
          </Text>
        ),
        sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        key: "status",
        width: 200,
        filters: [
          { text: 'รอตรวจสอบ', value: 'pending_no_reviewer' },
          { text: 'รอหัวหน้าภาค', value: 'pending_with_reviewer' },
          { text: 'อนุมัติ', value: 'approved' },
          { text: 'ปฏิเสธ', value: 'rejected' },
        ],
        onFilter: (value, record) => {
          if (value === 'pending_no_reviewer') return record.status === 'pending' && !record.reviewerId;
          if (value === 'pending_with_reviewer') return record.status === 'pending' && !!record.reviewerId;
          return record.status === value;
        },
        render: (status, record) => {
          const isPending = status === "pending";
          const hasReviewer = !!record.reviewerId;
          const color = isPending ? "orange" : status === "approved" ? "green" : status === "rejected" ? "red" : "default";
          const text = isPending
            ? hasReviewer
              ? "รอหัวหน้าภาค"
              : "รอตรวจสอบ"
            : status === "approved"
            ? "อนุมัติ"
            : status === "rejected"
            ? "ปฏิเสธ"
            : status;
          
          // ตรวจสอบว่าเอกสารนี้ส่งช้าหรือไม่
          const lateInfo = lateSubmissionsMap.get(record.id);
          
          return (
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Tag color={color} style={{ margin: 0 }}>
                {text}
              </Tag>
              {lateInfo && (
                <Tooltip title={`ส่งช้า ${lateInfo.daysLate} วัน ${lateInfo.hoursLate % 24} ชั่วโมง หลังจากเลยกำหนด`}>
                  <Tag 
                    color={
                      lateInfo.status === 'overdue' ? 'volcano' : 
                      lateInfo.status === 'very_late' ? 'red' : 
                      'orange'
                    }
                    icon={<WarningOutlined />}
                    style={{ margin: 0, fontSize: 12 }}
                  >
                    {lateInfo.status === 'overdue' ? ' เลยกำหนด' : 
                     lateInfo.status === 'very_late' ? ' ส่งช้ามาก' : 
                     ' ส่งช้า'}
                    {lateInfo.daysLate > 0 && ` ${lateInfo.daysLate}วัน`}
                  </Tag>
                </Tooltip>
              )}
            </Space>
          );
        },
      },
      {
        title: "",
        key: "actions",
        width: 80,
        fixed: 'right',
        render: (_, record) => (
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showDocumentDetails(record.id)}
            />
          </Tooltip>
        ),
      },
    ],
    [showDocumentDetails, lateSubmissionsMap]
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
      await fetchLateSubmissions();
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการตรวจและส่งต่อเอกสาร");
    }
  }, [selectedRowKeys, filteredDocuments, refetch, fetchLateSubmissions]);

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
      await fetchLateSubmissions();
    } catch (error) {
      if (error?.errorFields) return;
      message.error("เกิดข้อผิดพลาดในการปฏิเสธเอกสาร");
    } finally {
      setRejectSubmitting(false);
    }
  }, [selectedRowKeys, rejectDocument, form, fetchLateSubmissions]);

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
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        {/* Compact Header with Inline Badges */}
        <Row align="middle" justify="space-between">
          <Col>
            <Space align="center" size={12}>
              <Title level={4} style={{ margin: 0 }}>
                จัดการเอกสารฝึกงาน
              </Title>
              {/* <Space size={8}>
                {summary.pending > 0 && (
                  <Tooltip title="รอตรวจสอบ">
                    <Badge 
                      count={summary.pending} 
                      style={{ backgroundColor: '#faad14' }}
                      overflowCount={99}
                    />
                  </Tooltip>
                )}
                {summary.reviewing > 0 && (
                  <Tooltip title="รอหัวหน้าภาคอนุมัติ">
                    <Badge 
                      count={summary.reviewing} 
                      style={{ backgroundColor: '#1890ff' }}
                      overflowCount={99}
                    />
                  </Tooltip>
                )}
                {type === 'internship' && summary.totalLate > 0 && (
                  <Tooltip title={`เอกสารส่งช้า: ${summary.late} | ส่งช้ามาก: ${summary.veryLate} | เลยกำหนด: ${summary.overdue}`}>
                    <Badge 
                      count={
                        <Space size={2}>
                          <WarningOutlined />
                          {summary.totalLate}
                        </Space>
                      }
                      style={{ backgroundColor: '#cf1322' }}
                    />
                  </Tooltip>
                )}
              </Space> */}
            </Space>
          </Col>
          <Col>
            <Space size={16}>
              <Text type="secondary">
                ทั้งหมด <Text strong>{summary.total}</Text> รายการ
              </Text>
              <Text type="secondary">
                อนุมัติ <Text strong style={{ color: '#52c41a' }}>{summary.approved}</Text>
              </Text>
              {summary.rejected > 0 && (
                <Text type="secondary">
                  ปฏิเสธ <Text strong style={{ color: '#cf1322' }}>{summary.rejected}</Text>
                </Text>
              )}
            </Space>
          </Col>
        </Row>

        {/* Compact Filters Bar */}
        <Row 
          gutter={[12, 12]} 
          align="middle"
          style={{ 
            padding: '12px 16px',
            background: '#fafafa',
            borderRadius: 8,
            border: '1px solid #f0f0f0'
          }}
        >
          <Col xs={24} sm={12} md={5}>
            <Select
              style={{ width: "100%" }}
              placeholder="สถานะ: ทั้งหมด"
              value={filters.status}
              onChange={setStatusFilter}
              options={[
                { label: "ทั้งหมด", value: "" },
                { label: " รอตรวจสอบ", value: "pending" },
                { label: " อนุมัติแล้ว", value: "approved" },
                { label: " ปฏิเสธแล้ว", value: "rejected" },
              ]}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              style={{ width: "100%" }}
              placeholder="ปีการศึกษา"
              value={filters.academicYear}
              onChange={(v) => setFilters((f) => ({ ...f, academicYear: v }))}
              options={[{ label: "ทุกปี", value: "all" }, ...academicYearOptions]}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              style={{ width: "100%" }}
              placeholder="ภาคเรียน"
              value={filters.semester}
              onChange={(v) => setFilters((f) => ({ ...f, semester: v }))}
              options={[{ label: "ทุกภาค", value: "all" }, ...semesterOptions]}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="ค้นหาเอกสาร หรือชื่อนักศึกษา"
              value={filters.search}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={7} style={{ textAlign: 'right' }}>
            <Space wrap size="small">
              {filters.status === "pending" && selectedRowKeys.length > 0 && (
                <>
                  <Badge count={selectedRowKeys.length} offset={[-8, 0]}>
                    <Button
                      type="primary"
                      onClick={handleApproveSelectedDocuments}
                      icon={<CheckCircleOutlined />}
                      size="small"
                    >
                      ตรวจและส่งต่อ
                    </Button>
                  </Badge>
                  <Button
                    danger
                    onClick={openRejectModal}
                    icon={<CloseCircleOutlined />}
                    size="small"
                  >
                    ปฏิเสธ
                  </Button>
                </>
              )}
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  refetch();
                  fetchLateSubmissions();
                }}
                loading={isLoading || lateSubmissionsLoading}
                size="small"
              >
                รีเฟรช
              </Button>
              {(filters.status !== "pending" || filters.search !== "" || filters.academicYear !== "all" || filters.semester !== "all") && (
                <Button
                  onClick={() => {
                    setFilters({ status: "pending", search: "", academicYear: "all", semester: "all" });
                    setSelectedRowKeys([]);
                  }}
                  size="small"
                  type="dashed"
                >
                  ล้าง
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* Main Table - Focus Area */}
        <Card 
          size="small" 
          bodyStyle={{ padding: 0 }}
          title={
            <Row align="middle" justify="space-between">
              <Col>
                <Space size={12}>
                  <Text strong>รายการเอกสาร</Text>
                  <Badge 
                    count={filteredDocuments.length} 
                    showZero 
                    style={{ backgroundColor: '#1890ff' }}
                  />
                  {filters.status === "pending" && selectedRowKeys.length > 0 && (
                    <Tag color="blue">เลือก {selectedRowKeys.length} รายการ</Tag>
                  )}
                </Space>
              </Col>
              <Col>
                <Space size={8}>
                  {summary.cs05 > 0 && (
                    <Tag icon={<FileTextOutlined />} color="default">
                      คพ.05: {summary.cs05}
                    </Tag>
                  )}
                  {summary.acceptanceLetter > 0 && (
                    <Tag icon={<FileProtectOutlined />} color="default">
                      หนังสือตอบรับ: {summary.acceptanceLetter}
                    </Tag>
                  )}
                </Space>
              </Col>
            </Row>
          }
        >
          <Table
            loading={isLoading}
            rowSelection={filters.status === "pending" ? rowSelection : null}
            columns={columns}
            dataSource={filteredDocuments}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`,
              size: "default",
            }}
            size="middle"
            locale={{
              emptyText: (
                <div style={{ padding: '40px 0' }}>
                  <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary">ไม่มีเอกสารที่ตรงกับเงื่อนไขที่เลือก</Text>
                  </div>
                </div>
              )
            }}
          />
        </Card>
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
