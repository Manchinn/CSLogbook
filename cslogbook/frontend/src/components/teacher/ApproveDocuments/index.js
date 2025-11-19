import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Row,
  Col,
  Input,
  Modal,
  Tabs,
  Select,
  Typography,
  Form,
  Input as AntInput,
  Spin
} from "antd";
import { FilePdfOutlined, FileTextOutlined } from "@ant-design/icons";
import { internshipApprovalService } from "../../../services/internshipApprovalService";
import dayjs from "../../../utils/dayjs"; // ใช้ dayjs เวอร์ชันที่ตั้งค่า locale/th
import { DATE_TIME_FORMAT, DATE_FORMAT_MEDIUM } from "../../../utils/constants";
import { PDFViewerModal } from "../../common/PDFViewer";
import CS05Preview from "../../admin/documents/CS05Preview";

// สีสำหรับสถานะต่าง ๆ (ครอบคลุมทุกสถานะที่เป็นไปได้)
const statusColor = {
  draft: "default",
  pending: "gold",
  approved: "green",
  rejected: "red",
  acceptance_approved: "blue",
  referral_ready: "cyan",
  referral_downloaded: "purple",
  supervisor_evaluated: "magenta",
  completed: "green",
};

// ป้ายภาษาไทยสำหรับสถานะ (ตรงกับ Document.status enum ในฐานข้อมูล)
const statusLabelTh = {
  draft: "ร่าง",
  pending: "รอดำเนินการ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
  acceptance_approved: "ยืนยันหนังสือตอบรับแล้ว", // สำหรับ CS05 หลังจาก Acceptance ถูกอนุมัติ
  referral_ready: "พร้อมออกหนังสือส่งตัว", // สำหรับ CS05 เมื่อพร้อมสร้างหนังสือส่งตัว
  referral_downloaded: "ดาวน์โหลดหนังสือส่งตัวแล้ว", // สำหรับ CS05 เมื่อดาวน์โหลดหนังสือส่งตัวแล้ว
  supervisor_evaluated: "ประเมินโดยผู้ควบคุมงานแล้ว", // สำหรับ CS05 หลังจากผู้ควบคุมงานประเมิน
  completed: "เสร็จสิ้น",
};

const { Text } = Typography;

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

export default function ApproveDocuments() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  // แท็บการทำงาน: request = อนุมัติ คพ.05 (หนังสือขอความอนุเคราะห์), referral = หนังสือส่งตัวนักศึกษา
  const [activeTab, setActiveTab] = useState("request");
  // ตัวกรอง: รวมปีการศึกษา+ภาคเรียนเป็นตัวเดียว (term) รูปแบบ "{semester}/{yearBE}" เช่น "1/2567"
  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    term: "all",
    classYear: "all",
  });

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'request') {
        // คิวหัวหน้าภาคสำหรับอนุมัติ CS05 (หนังสือขอความอนุเคราะห์)
        // ดึงทุกสถานะเพื่อให้กรองได้ในฝั่ง client
        const res = await internshipApprovalService.getHeadQueue({ status: 'pending,approved,rejected' });
        if (res.success) setItems(res.data || []); else message.error(res.message || 'ไม่สามารถดึงรายการได้');
      } else {
        // คิวหัวหน้าภาคสำหรับอนุมัติ Acceptance Letter (เพื่อไปสู่หนังสือส่งตัว)
        // ดึงทุกสถานะที่เกี่ยวข้อง
        const res = await internshipApprovalService.getAcceptanceHeadQueue({ status: 'pending,approved,rejected' });
        if (res.success) setItems(res.data || []); else message.error(res.message || 'ไม่สามารถดึงรายการได้');
      }
    } catch (e) {
      message.error(e.message || "เกิดข้อผิดพลาดในการดึงรายการ");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchQueue();
    // รีเฟรชทุกครั้งที่เปลี่ยนแท็บ
  }, [fetchQueue]);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null); // เก็บ record ที่จะปฏิเสธ
  const [form] = Form.useForm();
  
  // สำหรับแสดงรายละเอียดแบบฟอร์ม
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [documentDetails, setDocumentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // สำหรับแสดง PDF
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerTitle, setViewerTitle] = useState("");
  const [viewingDocId, setViewingDocId] = useState(null);

  // ดูรายละเอียดแบบฟอร์ม (แนะนำ)
  const handleViewDetails = useCallback(async (record) => {
    setLoadingDetails(true);
    setDetailsModalVisible(true);
    try {
      const response = activeTab === "request"
        ? await internshipApprovalService.getCS05Details(record.documentId)
        : await internshipApprovalService.getAcceptanceDetails(record.documentId);
      
      setDocumentDetails(response.data);
      message.success("โหลดรายละเอียดสำเร็จ", 1);
    } catch (e) {
      const errorMessage = e?.message || "ไม่สามารถโหลดรายละเอียดได้";
      message.error(errorMessage);
      setDetailsModalVisible(false);
    } finally {
      setLoadingDetails(false);
    }
  }, [activeTab]);

  // ดู PDF (สำรอง)
  const handleViewPDF = useCallback(async (record) => {
    const messageKey = `view-pdf-${record.documentId}`;
    setViewingDocId(record.documentId);
    message.loading({ content: "กำลังเปิด PDF...", key: messageKey });

    try {
      if (viewerUrl) {
        URL.revokeObjectURL(viewerUrl);
        setViewerUrl(null);
      }

      const response = activeTab === "request"
        ? await internshipApprovalService.viewCS05(record.documentId)
        : await internshipApprovalService.viewAcceptance(record.documentId);

      const blobUrl = URL.createObjectURL(response.data);
      const studentName = `${record.student?.firstName || ""} ${record.student?.lastName || ""}`.trim();
      const docLabel = activeTab === "request" ? "หนังสือขอความอนุเคราะห์" : "หนังสือตอบรับการฝึกงาน";

      setViewerUrl(blobUrl);
      setViewerTitle(studentName ? `${docLabel} - ${studentName}` : docLabel);
      setViewerVisible(true);
      message.success({ content: "เปิด PDF สำเร็จ", key: messageKey, duration: 1.5 });
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.message || "ไม่สามารถเปิด PDF ได้";
      message.error({ content: errorMessage, key: messageKey });
    } finally {
      setViewingDocId(null);
    }
  }, [activeTab, viewerUrl]);

  const handleViewerClose = useCallback(() => {
    if (viewerUrl) {
      URL.revokeObjectURL(viewerUrl);
    }
    setViewerUrl(null);
    setViewerVisible(false);
    setViewerTitle("");
  }, [viewerUrl]);

  useEffect(() => () => {
    if (viewerUrl) {
      URL.revokeObjectURL(viewerUrl);
    }
  }, [viewerUrl]);

  const openRejectModal = useCallback((record) => {
    setRejectTarget(record);
    form.resetFields();
    setRejectModalOpen(true);
  }, [form]);

  const handleRejectSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const reason = values.reason?.trim();
      if (!reason) return; // validation ซ้ำชั้น
      setRejectSubmitting(true);
      if (!rejectTarget) return;
      if (activeTab === 'request') {
        await internshipApprovalService.rejectCS05(rejectTarget.documentId, reason);
      } else {
        await internshipApprovalService.rejectAcceptance(rejectTarget.documentId, reason);
      }
      message.success('ปฏิเสธสำเร็จ');
      setRejectModalOpen(false);
      setRejectTarget(null);
      fetchQueue();
    } catch (e) {
      if (e?.errorFields) return; // validation error จาก antd
      message.error(e.message || 'ปฏิเสธไม่สำเร็จ');
    } finally {
      setRejectSubmitting(false);
    }
  }, [activeTab, fetchQueue, rejectTarget, form]);

  const handleApprove = useCallback(
    async (record) => {
      if (activeTab === 'request') {
        const confirmText = "ยืนยันอนุมัติ คพ.05 เพื่อออกหนังสือขอความอนุเคราะห์";
        Modal.confirm({
          title: 'ยืนยันการอนุมัติ',
          content: confirmText,
          okText: 'ยืนยัน',
          cancelText: 'ยกเลิก',
          async onOk() {
            try {
              await internshipApprovalService.approveCS05(record.documentId, { letterType: 'request_letter' });
              message.success('อนุมัติสำเร็จ');
              fetchQueue();
            } catch (e) {
              message.error(e.message || 'อนุมัติไม่สำเร็จ');
            }
          }
        });
      } else {
        const confirmText = 'อนุมัติตรวจสอบหนังสือรับรองการฝึกงาน เพื่อปลดล็อคหนังสือส่งตัวนักศึกษา';
        Modal.confirm({
          title: 'ยืนยันการอนุมัติ',
          content: confirmText,
          okText: 'ยืนยัน',
          cancelText: 'ยกเลิก',
          async onOk() {
            try {
              await internshipApprovalService.approveAcceptanceByHead(record.documentId, {});
              message.success('อนุมัติ หนังสือส่งตัวนักศึกษา สำเร็จ');
              fetchQueue();
            } catch (e) {
              message.error(e.message || 'อนุมัติไม่สำเร็จ');
            }
          }
        });
      }
    },
  [activeTab, fetchQueue]
  );

  const handleReject = useCallback((record) => {
    openRejectModal(record);
  }, [openRejectModal]);

  // ตัวเลือกสถานะ เปลี่ยนตามแท็บ (สร้างจากข้อมูลจริง)
  const statusOptions = useMemo(() => {
    // รวบรวมสถานะที่มีจริงในข้อมูล
    const uniqueStatuses = new Set(items.map(r => r.status));
    const baseOptions = [{ label: "ทั้งหมด", value: "all" }];
    
    if (activeTab === "request") {
      // แท็บหนังสือขอความอนุเคราะห์: pending, approved, rejected
      const requestStatuses = [
        { status: "pending", label: "รอดำเนินการ" },
        { status: "approved", label: "อนุมัติแล้ว" },
        { status: "rejected", label: "ปฏิเสธ" },
      ];
      return [
        ...baseOptions,
        ...requestStatuses
          .filter(s => uniqueStatuses.has(s.status))
          .map(s => ({ label: s.label, value: s.status }))
      ];
    }
    
    // แท็บหนังสือส่งตัวนักศึกษา (Acceptance Letter): pending, approved, rejected
    const referralStatuses = [
      { status: "pending", label: "รอดำเนินการ" },
      { status: "approved", label: "อนุมัติแล้ว" },
      { status: "rejected", label: "ปฏิเสธ" },
    ];
    return [
      ...baseOptions,
      ...referralStatuses
        .filter(s => uniqueStatuses.has(s.status))
        .map(s => ({ label: s.label, value: s.status }))
    ];
  }, [activeTab, items]);

  // กรองข้อมูลฝั่ง client เพื่อความสะดวก
  const filteredItems = useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    return items.filter((r) => {
      // คำค้นหา: รหัส, ชื่อ, บริษัท
      const name = `${r.student?.firstName || ""} ${
        r.student?.lastName || ""
      }`.toLowerCase();
      const company = (r.companyName || "").toLowerCase();
      const code = (r.student?.studentCode || "").toLowerCase();
      const matchQ =
        !q || name.includes(q) || company.includes(q) || code.includes(q);

      // สถานะ
      const matchStatus =
        filters.status === "all" ? true : r.status === filters.status;

      // term: ใช้ academicYear และ semester จาก internship_documents ที่ส่งมาจาก API
      const yearBE = r.academicYear || null;
      const semester = r.semester || null;
      const thisTerm = semester && yearBE ? `${semester}/${yearBE}` : null;
      const matchTerm =
        filters.term === "all" || (thisTerm && thisTerm === filters.term);

      // ชั้นปี: คำนวณจากปีที่เข้าศึกษา (2 หลักแรกของ studentCode) และปีการศึกษาจาก internship_documents
      const getEntryYearBEFromCode = (studentCode) => {
        if (!studentCode) return null;
        const two = String(studentCode).slice(0, 2);
        const n = parseInt(two, 10);
        if (Number.isNaN(n)) return null;
        return 2500 + n; // 64 -> 2564
      };
      const entryBE = getEntryYearBEFromCode(r.student?.studentCode);
      const classYear = entryBE && yearBE ? yearBE - entryBE + 1 : null;
      const matchClass =
        filters.classYear === "all" ||
        (classYear && String(classYear) === String(filters.classYear));

      return matchQ && matchStatus && matchTerm && matchClass;
    });
  }, [items, filters]);

  // ตัวเลือกภาค/ปี (term) เช่น "1/2567": รวบรวมจาก academicYear และ semester ที่ส่งมาจาก API
  const termOptions = useMemo(() => {
    const terms = new Set();
    items.forEach((r) => {
      const semester = r.semester;
      const yearBE = r.academicYear;
      if (semester && yearBE) {
        terms.add(`${semester}/${yearBE}`);
      }
    });
    return Array.from(terms)
      .filter(Boolean)
      .sort((a, b) => {
        // เรียงจากใหม่ไปเก่า: เปรียบเทียบปี BE ก่อน แล้วค่อยภาค
        const [sa, ya] = String(a).split("/").map(Number);
        const [sb, yb] = String(b).split("/").map(Number);
        if (yb !== ya) return yb - ya;
        return sb - sa;
      })
      .map((t) => ({ label: t, value: t }));
  }, [items]);

  // ตัวเลือกชั้นปี: คำนวณจากข้อมูลจริง
  const classYearOptions = useMemo(() => {
    const getEntryYearBEFromCode = (studentCode) => {
      if (!studentCode) return null;
      const two = String(studentCode).slice(0, 2);
      const n = parseInt(two, 10);
      if (Number.isNaN(n)) return null;
      return 2500 + n; // 64 -> 2564
    };

    const classYears = new Set();
    items.forEach((r) => {
      const yearBE = r.academicYear;
      const entryBE = getEntryYearBEFromCode(r.student?.studentCode);
      const classYear = entryBE && yearBE ? yearBE - entryBE + 1 : null;
      if (classYear && classYear > 0 && classYear <= 8) {
        classYears.add(classYear);
      }
    });

    return Array.from(classYears)
      .sort((a, b) => a - b)
      .map((year) => ({ label: `ปี ${year}`, value: String(year) }));
  }, [items]);

  // คำนวณสถิติรวมสำหรับการแสดงบนการ์ด (จากข้อมูลที่กรองแล้ว)
  const statistics = useMemo(() => {
    const total = filteredItems.length;
    const pending = filteredItems.filter((r) => r.status === "pending").length;
    const approved = filteredItems.filter((r) => r.status === "approved").length;
    const rejected = filteredItems.filter((r) => r.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [filteredItems]);

  const columns = useMemo(
    () => [
      {
        title: "รหัสนักศึกษา",
        dataIndex: ["student", "studentCode"],
        key: "studentCode",
      },
      {
        title: "ชื่อนักศึกษา",
        key: "studentName",
        render: (_, r) =>
          `${r.student?.firstName || ""} ${r.student?.lastName || ""}`.trim(),
      },
      {
        title: "สถานประกอบการ",
        dataIndex: "companyName",
        key: "companyName",
      },
      {
        title: "ช่วงฝึกงาน",
        key: "period",
        render: (_, r) => {
          // ใช้รูปแบบมาตรฐาน DATE_FORMAT_MEDIUM
          const s = r.startDate ? dayjs(r.startDate).format(DATE_FORMAT_MEDIUM) : "-";
          const e = r.endDate ? dayjs(r.endDate).format(DATE_FORMAT_MEDIUM) : "-";
          return `${s} - ${e}`;
        },
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        key: "status",
        render: (v, record) => {
          // ปรับข้อความสถานะย่อยสำหรับ pending
          // - pending + reviewerId => รอหัวหน้าภาคอนุมัติ
          // - pending + ไม่มี reviewerId => รอตรวจโดยเจ้าหน้าที่ภาค (กรณีหลุดมา)
          if (v === "pending") {
            const hasReviewer = !!record.reviewerId;
            const text = hasReviewer ? "รอหัวหน้าภาคอนุมัติ" : "รอตรวจโดยเจ้าหน้าที่ภาค";
            return <Tag color="gold">{text}</Tag>;
          }
          return (
            <Tag color={statusColor[v] || "default"}>{statusLabelTh[v] || v}</Tag>
          );
        },
      },
      {
        title: "ส่งเมื่อ",
        dataIndex: "createdAt",
        key: "createdAt",
  // ใช้รูปแบบมาตรฐาน DATE_TIME_FORMAT จาก utils/constants
  render: (v) => (v ? dayjs(v).format(DATE_TIME_FORMAT) : "-"),
      },
      {
        title: "การทำงาน",
        key: "actions",
        render: (_, record) => (
          <Space wrap>
            {/* แท็บหนังสือขอความอนุเคราะห์: แสดงปุ่มดูรายละเอียด + PDF */}
            {activeTab === 'request' && (
              <>
                <Button
                  icon={<FileTextOutlined />}
                  onClick={() => handleViewDetails(record)}
                  type="default"
                >
                  ดูรายละเอียด
                </Button>
                <Button
                  icon={<FilePdfOutlined />}
                  onClick={() => handleViewPDF(record)}
                  loading={viewingDocId === record.documentId}
                  size="small"
                >
                  PDF
                </Button>
              </>
            )}
            
            {/* แท็บหนังสือส่งตัวนักศึกษา: แสดงแค่ปุ่ม PDF */}
            {activeTab === 'referral' && (
              <Button
                icon={<FilePdfOutlined />}
                onClick={() => handleViewPDF(record)}
                loading={viewingDocId === record.documentId}
              >
                ดูหนังสือตอบรับ
              </Button>
            )}
            
            <Button
              type="primary"
              onClick={() => handleApprove(record)}
              disabled={!(record.status === 'pending' && !!record.reviewerId)}
            >
              อนุมัติ
            </Button>
            <Button
              danger
              onClick={() => handleReject(record)}
              disabled={record.status !== 'pending'}
            >
              ปฏิเสธ
            </Button>
          </Space>
        ),
      },
    ],
  [handleApprove, handleReject, handleViewDetails, handleViewPDF, viewingDocId, activeTab]
  );

  // ไม่มี onSubmitApprove อีกต่อไป เนื่องจากแยกตามแท็บและยืนยันด้วย Modal.confirm

  return (
    <div style={containerStyle}>
      <Card>
      {/* แท็บแบ่งประเภทงานของหัวหน้าภาควิชา */}
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k)}
        items={[
          {
            key: "request",
            label: "หนังสือขอความอนุเคราะห์",
          },
          {
            key: "referral",
            label: "หนังสือส่งตัวนักศึกษา",
          },
        ]}
        style={{ marginBottom: 12 }}
      />
      {/* ส่วนสถิติ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 12 }}>
        <Col span={24}>
          <Space size="middle" wrap>
            <Text>ทั้งหมด: {statistics.total}</Text>
            <Tag color="gold">รอดำเนินการ: {statistics.pending}</Tag>
            <Tag color="green">อนุมัติแล้ว: {statistics.approved}</Tag>
            <Tag color="red">ปฏิเสธ: {statistics.rejected}</Tag>
          </Space>
        </Col>
      </Row>

      {/* แถบตัวกรองแบบเป็นระเบียบ */}
      <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Input.Search
            allowClear
            placeholder="ค้นหา (ชื่อ, รหัส, บริษัท)"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            onSearch={(v) => setFilters((f) => ({ ...f, q: v }))}
          />
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Select
            size="small"
            style={{ width: '100%' }}
            placeholder="สถานะ"
            options={statusOptions}
            value={filters.status}
            onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          />
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Select
            size="small"
            style={{ width: '100%' }}
            placeholder="ภาค/ปี"
            options={[{ label: "ทุกภาค/ปี", value: "all" }, ...termOptions]}
            value={filters.term}
            onChange={(v) => setFilters((f) => ({ ...f, term: v }))}
          />
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Select
            size="small"
            style={{ width: '100%' }}
            placeholder="ชั้นปี"
            options={[{ label: "ทุกชั้นปี", value: "all" }, ...classYearOptions]}
            value={filters.classYear}
            onChange={(v) => setFilters((f) => ({ ...f, classYear: v }))}
          />
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Button block type="primary" onClick={fetchQueue} loading={loading}>
            รีเฟรช
          </Button>
        </Col>
      </Row>

      <Table
        rowKey="documentId"
        loading={loading}
        columns={columns}
        dataSource={filteredItems}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `ทั้งหมด ${total} รายการ`,
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={activeTab === 'request' ? 'ปฏิเสธคำร้อง CS05' : 'ปฏิเสธ Acceptance Letter'}
        open={rejectModalOpen}
        onCancel={() => { if (!rejectSubmitting) { setRejectModalOpen(false); setRejectTarget(null);} }}
        onOk={handleRejectSubmit}
        okText="ยืนยันปฏิเสธ"
        cancelText="ยกเลิก"
        confirmLoading={rejectSubmitting}
        okButtonProps={{ danger: true }}
      >
        <Form form={form} layout="vertical" name="rejectReasonForm">
          <Form.Item
            label="เหตุผลการปฏิเสธ"
            name="reason"
            rules={[
              { required: true, message: 'กรุณากรอกเหตุผล' },
              { min: 10, message: 'กรุณาระบุอย่างน้อย 10 ตัวอักษร เพื่อให้นักศึกษาเข้าใจและแก้ไขได้' },
            ]}
          >
            <AntInput.TextArea
              rows={5}
              placeholder="โปรดระบุรายละเอียดให้ชัดเจน เช่น ข้อมูลบริษัทไม่ตรง, เอกสารไม่ครบ, วันที่ฝึกงานไม่ถูกต้อง ฯลฯ"
              maxLength={500}
              showCount
            />
          </Form.Item>
          {rejectTarget && (
            <div style={{ fontSize: 12, color: '#888' }}>
              เอกสาร: {activeTab === 'request' ? 'หนังสือขอความอนุเคราะห์' : 'หนังสือตอบรับการฝึกงาน'} | ID: {rejectTarget.documentId}
            </div>
          )}
        </Form>
      </Modal>

      {/* Modal แสดงรายละเอียดแบบฟอร์ม คพ.05 */}
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>
              {activeTab === 'request' ? 'รายละเอียดแบบฟอร์ม คพ.05' : 'รายละเอียดหนังสือตอบรับ'}
            </span>
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setDocumentDetails(null);
        }}
        footer={
          <Space>
            <Button onClick={() => setDetailsModalVisible(false)}>ปิด</Button>
          </Space>
        }
        centered
        width="95%"
        styles={{ 
          body: { 
            maxHeight: '85vh', 
            overflow: 'auto', 
            padding: '16px 24px',
            background: '#f5f5f5'
          } 
        }}
        destroyOnClose
      >
        {loadingDetails ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: 400 
          }}>
            <Spin size="large" tip="กำลังโหลดรายละเอียด..." />
          </div>
        ) : documentDetails ? (
          activeTab === 'request' ? (
            <CS05Preview data={documentDetails} />
          ) : (
            <div style={{ padding: 16, background: 'white', borderRadius: 8 }}>
              <Typography.Title level={5}>รายละเอียดหนังสือตอบรับ</Typography.Title>
              <Typography.Paragraph>
                ข้อมูลหนังสือตอบรับการฝึกงาน
              </Typography.Paragraph>
              {/* TODO: สร้าง component สำหรับแสดงหนังสือตอบรับ */}
            </div>
          )
        ) : null}
      </Modal>

      {/* Modal แสดง PDF (สำรอง) */}
      {viewerVisible && (
        <PDFViewerModal
          visible={viewerVisible}
          pdfUrl={viewerUrl}
          onClose={handleViewerClose}
          title={viewerTitle || "เอกสาร PDF"}
        />
      )}
      </Card>
    </div>
  );
}
