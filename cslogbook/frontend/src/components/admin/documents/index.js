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
  Select,
  Modal,
  Form,
  Input as AntInput,
  Badge,
  Spin,
} from "antd";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  CloseCircleOutlined,
  FileProtectOutlined,
  EyeOutlined,
  WarningOutlined,
  FilterOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import DocumentDetails from "./DocumentDetails";
import { useDocuments } from "../../../hooks/admin/useDocuments";
import dayjs from "../../../utils/dayjs";
import { internshipApprovalService } from "features/internship/services";
import { documentService } from "../../../services/admin/documentService";
import { getLateSubmissions } from "features/reports/services/deadlineReportService";
import { getInternshipAcademicYears, getProjectAcademicYears } from "features/reports/services/reportService";
import styles from "./DocumentManagement.module.css";

const { Text, Title } = Typography;

// DocumentManagement component - แสดงเฉพาะเอกสารฝึกงาน (ไม่มี tabs แล้ว)
const DocumentManagement = ({ type }) => {
  return <OriginalDocumentManagement type={type} />;
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

  // State สำหรับปีการศึกษา
  const [academicYearOptions, setAcademicYearOptions] = useState([]);
  const [academicYearLoading, setAcademicYearLoading] = useState(false);

  // State สำหรับ pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ใช้ custom hook
  const {
    documents,
    isLoading,
    rejectDocument,
    refetch,
    total: totalDocuments,
  } = useDocuments({
    type,
    status: filters.status,
    search: filters.search,
    academicYear: filters.academicYear !== "all" ? filters.academicYear : undefined,
    semester: filters.semester !== "all" ? filters.semester : undefined,
    limit: pagination.pageSize,
    offset: (pagination.current - 1) * pagination.pageSize,
  });

  useEffect(() => {
    console.log("Documents fetched:", documents);
    // อัปเดต total ใน pagination state
    if (totalDocuments !== undefined) {
      setPagination(prev => ({ ...prev, total: totalDocuments }));
    }
  }, [documents, totalDocuments]);

  // ดึงปีการศึกษาจาก API
  useEffect(() => {
    const fetchAcademicYears = async () => {
      setAcademicYearLoading(true);
      try {
        let years = [];
        if (type === 'internship') {
          years = await getInternshipAcademicYears();
        } else if (type === 'project') {
          years = await getProjectAcademicYears();
        }
        
        // แปลงเป็น options format
        const options = Array.isArray(years) 
          ? years
              .filter(Boolean)
              .sort((a, b) => b - a) // เรียงจากมากไปน้อย
              .map((year) => ({ label: `${year}`, value: year }))
          : [];
        
        setAcademicYearOptions(options);
      } catch (error) {
        console.error('Error fetching academic years:', error);
        setAcademicYearOptions([]);
      } finally {
        setAcademicYearLoading(false);
      }
    };

    fetchAcademicYears();
  }, [type]);

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
    setPagination(prev => ({ ...prev, current: 1 })); // Reset ไปหน้าแรกเมื่อเปลี่ยน filter
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

  // ตัวเลือกปีการศึกษา - ใช้จาก API แล้ว (ไม่ต้อง extract จาก documents)

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
    const cancelled = filteredDocuments.filter(doc => doc.status === "cancelled").length;
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
      cancelled,
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
        width: 150,
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
        width: 150,
        render: (status, record) => {
          const isPending = status === "pending";
          const hasReviewer = !!record.reviewerId;
          const color = isPending 
            ? "orange" 
            : status === "approved" 
            ? "green" 
            : status === "rejected" 
            ? "red"
            : status === "cancelled"
            ? "default"
            : "default";
          const text = isPending
            ? hasReviewer
              ? "รอหัวหน้าภาค"
              : "รอตรวจสอบ"
            : status === "approved"
            ? "อนุมัติ"
            : status === "rejected"
            ? "ปฏิเสธ"
            : status === "cancelled"
            ? "ยกเลิกการฝึกงาน"
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
        width: 40,
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

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setFilters({ status: "pending", search: "", academicYear: "all", semester: "all" });
    setSelectedRowKeys([]);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset ไปหน้าแรก
  }, []);

  // JSX
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={4} className={styles.title}>
          จัดการเอกสารคำร้องขอฝึกงาน
        </Title>
      </div>
      
      {/* Summary Statistics Chips */}
      <div className={styles.statisticsChips}>
        <div className={styles.statisticItem}>
          <FileTextOutlined />
          <Text>เอกสารทั้งหมด: {summary.total} รายการ</Text>
        </div>
        <div className={styles.statisticItem}>
          <ClockCircleOutlined />
          <Text>รอตรวจสอบ: {summary.pending} รายการ</Text>
        </div>
        <div className={styles.statisticItem}>
          <CheckCircleOutlined />
          <Text>อนุมัติแล้ว: {summary.approved} รายการ</Text>
        </div>
        {summary.rejected > 0 && (
          <div className={styles.statisticItem}>
            <CloseCircleOutlined />
            <Text>ปฏิเสธแล้ว: {summary.rejected} รายการ</Text>
          </div>
        )}
        {summary.cancelled > 0 && (
          <div className={styles.statisticItem}>
            <CloseCircleOutlined />
            <Text>ยกเลิกการฝึกงาน: {summary.cancelled} รายการ</Text>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <Card
        size="small"
        className={styles.filterCard}
        title={
          <Space>
            <FilterOutlined />
            <Text strong>ตัวกรอง</Text>
          </Space>
        }
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="ค้นหาเอกสาร หรือชื่อนักศึกษา"
              value={filters.search}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              prefix={<UserOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              style={{ width: "100%" }}
              placeholder="สถานะ"
              value={filters.status}
              onChange={setStatusFilter}
              options={[
                { label: "ทั้งหมด", value: "" },
                { label: "รอตรวจสอบ", value: "pending" },
                { label: "อนุมัติแล้ว", value: "approved" },
                { label: "ปฏิเสธแล้ว", value: "rejected" },
                { label: "ยกเลิกการฝึกงาน", value: "cancelled" },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              style={{ width: "100%" }}
              placeholder="ปีการศึกษา"
              options={[{ label: "ทุกปีการศึกษา", value: "all" }, ...academicYearOptions]}
              value={filters.academicYear}
              onChange={(v) => {
                setFilters((f) => ({ ...f, academicYear: v }));
                setPagination(prev => ({ ...prev, current: 1 })); // Reset ไปหน้าแรกเมื่อเปลี่ยน filter
              }}
              loading={academicYearLoading}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4} lg={3}>
            <Select
              style={{ width: "100%" }}
              placeholder="ภาคเรียน"
              options={[
                { label: "ทุกภาคเรียน", value: "all" },
                ...semesterOptions,
              ]}
              value={filters.semester}
              onChange={(v) => {
                setFilters((f) => ({ ...f, semester: v }));
                setPagination(prev => ({ ...prev, current: 1 })); // Reset ไปหน้าแรกเมื่อเปลี่ยน filter
              }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={7}>
            <Space wrap>
              {filters.status === "pending" && selectedRowKeys.length > 0 && (
                <>
                  <Badge count={selectedRowKeys.length} offset={[-8, 0]}>
                    <Button
                      type="primary"
                      onClick={handleApproveSelectedDocuments}
                      icon={<CheckCircleOutlined />}
                    >
                      ตรวจและส่งต่อ
                    </Button>
                  </Badge>
                  <Button
                    danger
                    onClick={openRejectModal}
                    icon={<CloseCircleOutlined />}
                  >
                    ปฏิเสธ
                  </Button>
                </>
              )}
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => {
                  refetch();
                  fetchLateSubmissions();
                }}
                loading={isLoading || lateSubmissionsLoading}
              >
                รีเฟรช
              </Button>
              <Button onClick={handleResetFilters}>รีเซ็ตตัวกรอง</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredDocuments}
        loading={isLoading}
        rowKey="id"
        rowSelection={filters.status === "pending" ? rowSelection : null}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `แสดง ${range[0]}-${range[1]} จาก ${total} รายการ`,
          pageSizeOptions: ["10", "20", "50", "100"],
          onChange: (page, pageSize) => {
            setPagination(prev => ({ ...prev, current: page, pageSize }));
          },
          onShowSizeChange: (current, size) => {
            setPagination(prev => ({ ...prev, current: 1, pageSize: size }));
          },
        }}
        scroll={{ x: 1200 }}
        title={() => (
          <div className={styles.tableTitle}>
            <Text strong>
              รายการเอกสาร ({pagination.total} รายการ)
            </Text>
            {isLoading && <Spin size="small" />}
          </div>
        )}
        locale={{
          emptyText: (
            <div className={styles.emptyState}>
              <FileTextOutlined className={styles.emptyIcon} />
              <div className={styles.emptyText}>
                <Text type="secondary">ไม่มีเอกสารที่ตรงกับเงื่อนไขที่เลือก</Text>
              </div>
            </div>
          )
        }}
      />

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
          <div className={styles.modalFooter}>
            จะปฏิเสธทั้งหมด {selectedRowKeys.length} เอกสาร
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentManagement;

