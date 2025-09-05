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
  Input as AntInput
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { internshipApprovalService } from "../../../services/internshipApprovalService";
import dayjs from "../../../utils/dayjs"; // ใช้ dayjs เวอร์ชันที่ตั้งค่า locale/th
import { DATE_TIME_FORMAT, DATE_FORMAT_MEDIUM } from "../../../utils/constants";

// สีสำหรับสถานะต่าง ๆ
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

// ป้ายภาษาไทยสำหรับสถานะ
const statusLabelTh = {
  draft: "ร่าง",
  pending: "รอดำเนินการ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
  acceptance_approved: "ยืนยันหนังสือตอบรับแล้ว",
  referral_ready: "พร้อมออกหนังสือส่งตัว",
  referral_downloaded: "ดาวน์โหลดแล้ว",
  supervisor_evaluated: "ประเมินโดยผู้ควบคุมงานแล้ว",
  completed: "เสร็จสิ้น",
};

const { Text } = Typography;

export default function ApproveDocuments() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  // TODO: PDF preview integration (state removed until implemented)
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
        const res = await internshipApprovalService.getHeadQueue({ status: 'pending' });
        if (res.success) setItems(res.data || []); else message.error(res.message || 'ไม่สามารถดึงรายการได้');
      } else {
        // คิวหัวหน้าภาคสำหรับอนุมัติ Acceptance Letter (เพื่อไปสู่หนังสือส่งตัว)
        const res = await internshipApprovalService.getAcceptanceHeadQueue();
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

  const handleView = useCallback(async (record) => {
    // TODO: เรียกบริการดาวน์โหลด/แสดงไฟล์ PDF ของเอกสาร (ยังไม่พบในบริบทนี้)
    message.info(`ยังไม่ได้เชื่อมต่อการแสดงไฟล์สำหรับ Document ID: ${record.documentId}`);
  }, []);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null); // เก็บ record ที่จะปฏิเสธ
  const [form] = Form.useForm();

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
        const confirmText = 'ยืนยันอนุมัติ Acceptance Letter เพื่อปลดล็อคหนังสือส่งตัวนักศึกษา';
        Modal.confirm({
          title: 'ยืนยันการอนุมัติ',
          content: confirmText,
          okText: 'ยืนยัน',
          cancelText: 'ยกเลิก',
          async onOk() {
            try {
              await internshipApprovalService.approveAcceptanceByHead(record.documentId, {});
              message.success('อนุมัติ Acceptance Letter สำเร็จ');
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
          <Space>
            <Button icon={<EyeOutlined />} onClick={() => handleView(record)}>
              ดูเอกสาร
            </Button>
            <Button
              type="primary"
              onClick={() => handleApprove(record)}
              disabled={!(record.status === 'pending' && !!record.reviewerId)}
            >
              {activeTab === "request" ? "อนุมัติหนังสือขอความอนุเคราะห์" : "อนุมัติ Acceptance Letter"}
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
    [handleApprove, handleReject, handleView, activeTab]
  );

  // คำนวณสถิติรวมสำหรับการแสดงบนการ์ด สไตล์เดียวกับฝั่งเจ้าหน้าที่ภาค
  const statistics = useMemo(() => {
    const total = items.length;
    const pending = items.filter((r) => r.status === "pending").length;
    const approved = items.filter((r) => r.status === "approved").length;
    const rejected = items.filter((r) => r.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [items]);

  // ตัวเลือกสถานะ เปลี่ยนตามแท็บ
  const statusOptions = useMemo(() => {
    if (activeTab === "request") {
      return [
        { label: "ทั้งหมด", value: "all" },
        { label: "รอดำเนินการ", value: "pending" },
        { label: "อนุมัติแล้ว", value: "approved" },
        { label: "ปฏิเสธ", value: "rejected" },
      ];
    }
    // แท็บหนังสือส่งตัว: เพิ่มสถานะที่เกี่ยวข้องหลังอนุมัติ
    return [
      { label: "ทั้งหมด", value: "all" },
      { label: "อนุมัติแล้ว", value: "approved" },
      { label: "ยืนยันหนังสือตอบรับแล้ว", value: "acceptance_approved" },
      { label: "พร้อมออกหนังสือส่งตัว", value: "referral_ready" },
      { label: "ดาวน์โหลดแล้ว", value: "referral_downloaded" },
    ];
  }, [activeTab]);

  // กรองข้อมูลฝั่ง client เพื่อความสะดวก
  const filteredItems = useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    // helper: คำนวณปีการศึกษา/ภาคเรียนจากวันที่อ้างอิง
    const computeAcademic = (dt) => {
      if (!dt) return { yearBE: null, semester: null };
      const d = dayjs(dt);
      if (!d.isValid()) return { yearBE: null, semester: null };
      const m = d.month() + 1; // 1..12
      // ส.ค.-ธ.ค. => ภาค 1 ของปี BE ปัจจุบัน, ม.ค.-พ.ค. => ภาค 2 ของปี BE ก่อนหน้า, อื่นๆ ปักเป็นภาค 2 ของปีก่อนหน้า
      if (m >= 8 && m <= 12) return { yearBE: d.year() + 543, semester: 1 };
      if (m >= 1 && m <= 5) return { yearBE: d.year() + 542, semester: 2 };
      return { yearBE: d.year() + 542, semester: 2 };
    };

    const getEntryYearBEFromCode = (studentCode) => {
      if (!studentCode) return null;
      const two = String(studentCode).slice(0, 2);
      const n = parseInt(two, 10);
      if (Number.isNaN(n)) return null;
      return 2500 + n; // 64 -> 2564
    };

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

      // term: รวมภาค/ปี เช่น "1/2567"
      const baseDate = r.startDate || r.createdAt || null;
      const { yearBE, semester } = computeAcademic(baseDate);
      const thisTerm = semester && yearBE ? `${semester}/${yearBE}` : null;
      const matchTerm =
        filters.term === "all" || (thisTerm && thisTerm === filters.term);

      // ชั้นปี: คำนวณจากปีที่เข้าศึกษา (2 หลักแรกของ studentCode)
      const entryBE = getEntryYearBEFromCode(r.student?.studentCode);
      const classYear = entryBE && yearBE ? yearBE - entryBE + 1 : null;
      const matchClass =
        filters.classYear === "all" ||
        (classYear && String(classYear) === String(filters.classYear));

      return matchQ && matchStatus && matchTerm && matchClass;
    });
  }, [items, filters]);

  // ตัวเลือกภาค/ปี (term) เช่น "1/2567": รวบรวมจากรายการ
  const termOptions = useMemo(() => {
    const terms = new Set();
    items.forEach((r) => {
      const d = r.startDate || r.createdAt;
      if (!d) return;
      const m = dayjs(d).month() + 1;
      let semester;
      let yearBE;
      if (m >= 8 && m <= 12) {
        semester = 1;
        yearBE = dayjs(d).year() + 543;
      } else {
        semester = 2;
        yearBE = dayjs(d).year() + 542;
      }
      terms.add(`${semester}/${yearBE}`);
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

  // ไม่มี onSubmitApprove อีกต่อไป เนื่องจากแยกตามแท็บและยืนยันด้วย Modal.confirm

  return (
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
            options={[
              { label: "ทุกชั้นปี", value: "all" },
              { label: "ปี 3", value: "3" },
              { label: "ปี 4", value: "4" },
            ]}
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
              เอกสาร: {activeTab === 'request' ? 'CS05' : 'Acceptance Letter'} | ID: {rejectTarget.documentId}
            </div>
          )}
        </Form>
  </Modal>

  {/* ไม่มี Modal เลือกประเภทแล้ว เนื่องจากกำหนดจากแท็บที่เลือก */}
    </Card>
  );
}
