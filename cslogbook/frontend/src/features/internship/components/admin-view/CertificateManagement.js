import React, { useState, useEffect, useCallback, useMemo } from "react";
import OfficialDocumentService from "services/PDFServices/OfficialDocumentService";
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Row,
  Col,
  Card,
  Typography,
  Tooltip,
  Drawer,
  Select,
  Statistic,
  Spin,
  Descriptions,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  FilterOutlined,
  UserOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { certificateService } from "features/internship/services"; // ✅ ใช้ service ใหม่
import CertificateRequestReview from "./CertificateRequestReview";
import dayjs from "utils/dayjs";

const { Text, Title } = Typography;

const CertificateManagement = () => {
  const [certificateRequests, setCertificateRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState("");
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    academicYear: "all",
    semester: "all",
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // Container style for consistent layout
  const containerStyle = {
    padding: "24px",
    background: "#f5f5f5",
    minHeight: "100vh",
  };

  // ดึงรายการคำขอหนังสือรับรอง
  const fetchCertificateRequests = useCallback(async () => {
    try {
      setLoading(true);
      
      // สร้าง params สำหรับ API
      const params = {};
      if (filters.status !== "all") params.status = filters.status;
      if (filters.academicYear !== "all") params.academicYear = filters.academicYear;
      if (filters.semester !== "all") params.semester = filters.semester;
      
      const response = await certificateService.getCertificateRequests(params);

      if (response.success) {
        setCertificateRequests(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching certificate requests:", error);
      message.error("ไม่สามารถดึงข้อมูลคำขอหนังสือรับรองได้");
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.academicYear, filters.semester]);

  // โหลดข้อมูลเมื่อ component mount หรือเมื่อ filters เปลี่ยน
  useEffect(() => {
    fetchCertificateRequests();
  }, [fetchCertificateRequests]);

  // อนุมัติคำขอหนังสือรับรอง
  const handleApproveRequest = async (requestId) => {
    try {
      setProcessLoading(true);

      const certificateNumber = generateCertificateNumber();

      await certificateService.approveCertificateRequest(
        requestId,
        certificateNumber
      );

      message.success("อนุมัติคำขอหนังสือรับรองเรียบร้อยแล้ว");
      await fetchCertificateRequests();
      setModalVisible(false);
    } catch (error) {
      console.error("Error approving request:", error);
      message.error("ไม่สามารถอนุมัติคำขอได้");
    } finally {
      setProcessLoading(false);
    }
  };

  // ปฏิเสธคำขอหนังสือรับรอง
  const handleRejectRequest = async (requestId, remarks) => {
    try {
      setProcessLoading(true);

      await certificateService.rejectCertificateRequest(requestId, remarks);

      message.success("ปฏิเสธคำขอเรียบร้อยแล้ว");
      await fetchCertificateRequests();
      setModalVisible(false);
    } catch (error) {
      console.error("Error rejecting request:", error);
      message.error("ไม่สามารถปฏิเสธคำขอได้");
    } finally {
      setProcessLoading(false);
    }
  };

  // สร้างหมายเลขหนังสือรับรอง
  const generateCertificateNumber = () => {
    const now = dayjs();
    const year = now.year() + 543; // แปลงเป็นพุทธศักราช
    const month = now.format("MM"); // ใช้ dayjs format แทน padStart
    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0");
    return `ว ${year}/${month}/${random}`;
  };

  // คำนวณสถิติ
  const summary = useMemo(() => {
    return {
      pending: certificateRequests.filter((req) => req.status === "pending")
        .length,
      approved: certificateRequests.filter((req) => req.status === "approved")
        .length,
      rejected: certificateRequests.filter((req) => req.status === "rejected")
        .length,
      total: certificateRequests.length,
    };
  }, [certificateRequests]);

  // ตัวเลือกปีการศึกษา (academicYear)
  const academicYearOptions = useMemo(() => {
    const years = new Set();
    (certificateRequests || []).forEach((r) => {
      if (r.internship?.academicYear) {
        years.add(r.internship.academicYear);
      }
    });
    return Array.from(years)
      .filter(Boolean)
      .sort((a, b) => b - a) // เรียงจากมากไปน้อย
      .map((year) => ({ label: `${year}`, value: year }));
  }, [certificateRequests]);

  // ตัวเลือกภาคเรียน
  const semesterOptions = [
    { label: "ภาคเรียนที่ 1", value: 1 },
    { label: "ภาคเรียนที่ 2", value: 2 },
    { label: "ภาคฤดูร้อน", value: 3 },
  ];

  // กรองข้อมูลฝั่ง client (สำหรับค้นหาชื่อ/รหัสเท่านั้น เพราะ filter อื่นทำที่ API แล้ว)
  const filteredRequests = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return (certificateRequests || []).filter((r) => {
      const name = (r.student?.fullName || "").toLowerCase();
      const code = (r.student?.studentCode || "").toLowerCase();
      const company = (r.internship?.companyName || "").toLowerCase();
      const matchQ =
        !q || name.includes(q) || code.includes(q) || company.includes(q);

      return matchQ;
    });
  }, [certificateRequests, filters.q]);

  // โหลดรายละเอียดคำขอ
  const openDetailDrawer = async (requestId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await certificateService.getCertificateRequestDetail(
        requestId
      );
      if (res.success) setDetailData(res.data);
    } catch (e) {
      message.error("ไม่สามารถดึงรายละเอียดคำขอ");
    } finally {
      setDetailLoading(false);
    }
  };

  // สร้าง PDF Logbook ฝั่ง frontend
  const handleOpenLogbookPDF = async () => {
    const internshipId = detailData?.internship?.internshipId;
    if (!internshipId) {
      message.info("ไม่พบ Internship ID");
      return;
    }
    try {
      message.loading({
        content: "กำลังเตรียมข้อมูล Logbook...",
        key: "logpdf",
      });
      const res = await certificateService.getAdminLogbookFullSummary(
        internshipId
      );
      if (!res?.success) throw new Error(res?.message || "ดึงข้อมูลไม่สำเร็จ");
      const summary = res.data;
      await OfficialDocumentService.previewInternshipLogbookPDF(summary);
      message.success({
        content: "แสดงตัวอย่าง PDF แล้ว",
        key: "logpdf",
        duration: 2,
      });
    } catch (err) {
      console.error("Generate logbook PDF error:", err);
      message.error({
        content: "ไม่สามารถสร้าง PDF Logbook ได้",
        key: "logpdf",
      });
    }
  };

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setFilters({ q: "", status: "all", academicYear: "all", semester: "all" });
  }, []);

  // คอลัมน์ตาราง
  const columns = [
    {
      title: "รหัสนักศึกษา",
      dataIndex: ["student", "studentCode"],
      key: "studentCode",
      width: 120,
      sorter: (a, b) =>
        (a.student?.studentCode || "").localeCompare(
          b.student?.studentCode || ""
        ),
    },
    {
      title: "ชื่อ-นามสกุล",
      dataIndex: ["student", "fullName"],
      key: "fullName",
      width: 120,
      sorter: (a, b) =>
        (a.student?.fullName || "").localeCompare(b.student?.fullName || ""),
    },
    {
      title: "วันที่ขอ",
      dataIndex: "requestDate",
      key: "requestDate",
      width: 120,
      render: (date) => (date ? dayjs(date).format("DD/MM/BBBB") : "-"), // ใช้ BBBB สำหรับพุทธศักราช
      sorter: (a, b) =>
        dayjs(a.requestDate).unix() - dayjs(b.requestDate).unix(),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const statusConfig = {
          pending: { color: "orange", text: "รอดำเนินการ" },
          approved: { color: "green", text: "อนุมัติแล้ว" },
          rejected: { color: "red", text: "ปฏิเสธ" },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: [
        { text: "รอดำเนินการ", value: "pending" },
        { text: "อนุมัติแล้ว", value: "approved" },
        { text: "ปฏิเสธ", value: "rejected" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "การดำเนินการ",
      key: "actions",
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="ดูรายละเอียด">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedRequest(record);
                openDetailDrawer(record.id);
              }}
            />
          </Tooltip>
          {record.status === "pending" && (
            <>
              <Tooltip title="อนุมัติ">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    setSelectedRequest(record);
                    setActionType("approve");
                    setModalVisible(true);
                  }}
                />
              </Tooltip>
              <Tooltip title="ปฏิเสธ">
                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={() => {
                    setSelectedRequest(record);
                    setActionType("reject");
                    setModalVisible(true);
                  }}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    
    <div style={containerStyle}>
      <div style={{ marginBottom: 16 }}>
        <Title
          level={4}
          style={{ margin: 0, display: "flex", alignItems: "center" }}
        >
          จัดการคำขอหนังสือรับรอง
        </Title>
      </div>
      {/* Summary Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="คำขอทั้งหมด"
              value={summary.total}
              suffix="รายการ"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="รอดำเนินการ"
              value={summary.pending}
              suffix="รายการ"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="อนุมัติแล้ว"
              value={summary.approved}
              suffix="รายการ"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="ปฏิเสธแล้ว"
              value={summary.rejected}
              suffix="รายการ"
            />
          </Card>
        </Col>
      </Row>

      {/* Filters Section */}
      <Card
        size="small"
        style={{ marginBottom: 16, background: "#fafafa" }}
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
              placeholder="ค้นหา ชื่อ/รหัส/บริษัท"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              allowClear
              prefix={<UserOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              style={{ width: "100%" }}
              placeholder="สถานะ"
              value={filters.status}
              onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              options={[
                { label: "ทั้งหมด", value: "all" },
                { label: "รอดำเนินการ", value: "pending" },
                { label: "อนุมัติแล้ว", value: "approved" },
                { label: "ปฏิเสธ", value: "rejected" },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              style={{ width: "100%" }}
              placeholder="ปีการศึกษา"
              options={[{ label: "ทุกปีการศึกษา", value: "all" }, ...academicYearOptions]}
              value={filters.academicYear}
              onChange={(v) => setFilters((f) => ({ ...f, academicYear: v }))}
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
              onChange={(v) => setFilters((f) => ({ ...f, semester: v }))}
              allowClear
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={7}>
            <Space wrap>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={fetchCertificateRequests}
                loading={loading}
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
        dataSource={filteredRequests}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `แสดง ${range[0]}-${range[1]} จาก ${total} รายการ`,
        }}
        scroll={{ x: 1200 }}
        title={() => (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text strong>
              รายการคำขอหนังสือรับรอง ({filteredRequests.length} รายการ)
            </Text>
            {loading && <Spin size="small" />}
          </div>
        )}
      />

      {/* Action Modal */}
      <Modal
        title={
          actionType === "approve"
            ? "อนุมัติคำขอหนังสือรับรอง"
            : "ปฏิเสธคำขอหนังสือรับรอง"
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            ยกเลิก
          </Button>,
          <Button
            key="submit"
            type={actionType === "approve" ? "primary" : "danger"}
            loading={processLoading}
            onClick={() => {
              if (actionType === "approve") {
                handleApproveRequest(selectedRequest?.id);
              } else {
                form.validateFields().then((values) => {
                  handleRejectRequest(selectedRequest?.id, values.remarks);
                });
              }
            }}
          >
            {actionType === "approve" ? "อนุมัติ" : "ปฏิเสธ"}
          </Button>,
        ]}
      >
        {selectedRequest && (
          <div>
            <Descriptions bordered size="small" column={3}>
              <Descriptions.Item label="นักศึกษา" span={3}>
                {selectedRequest.student?.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="รหัส" span={3}>
                {selectedRequest.student?.studentCode}
              </Descriptions.Item>
              <Descriptions.Item label="ชั่วโมงฝึกงาน" span={3}>
                {selectedRequest.totalHours} ชั่วโมง
              </Descriptions.Item>
            </Descriptions>

            {actionType === "reject" && (
              <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                <Form.Item
                  name="remarks"
                  label="เหตุผลการปฏิเสธ"
                  rules={[{ required: true, message: "กรุณาระบุเหตุผล" }]}
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="ระบุเหตุผลการปฏิเสธ..."
                    showCount
                    maxLength={500}
                  />
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title={
          selectedRequest
            ? `รายละเอียดคำขอ`
            : "รายละเอียดคำขอ"
        }
        width={760}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        destroyOnClose
      >
        <CertificateRequestReview
          data={detailData}
          loading={detailLoading}
          onOpenLogbookPDF={handleOpenLogbookPDF}
          onApprove={() => {
            if (!selectedRequest) return;
            setSelectedRequest(selectedRequest);
            setActionType("approve");
            setModalVisible(true);
          }}
          onReject={() => {
            if (!selectedRequest) return;
            setSelectedRequest(selectedRequest);
            setActionType("reject");
            setModalVisible(true);
          }}
        />
      </Drawer>
    </div>
  );
};

export default CertificateManagement;
