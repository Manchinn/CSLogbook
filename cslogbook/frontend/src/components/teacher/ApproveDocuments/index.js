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
  Radio,
  Form,
  Select,
  Typography,
} from "antd";
import {
  EyeOutlined,
  FileTextOutlined,
  FileExclamationOutlined,
  FileDoneOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import PDFViewerModal from "../../PDFViewerModal";
import { internshipApprovalService } from "../../../services/internshipApprovalService";
import dayjs from "dayjs";

const statusColor = {
  draft: "default",
  pending: "gold",
  approved: "green",
  rejected: "red",
};

const { Text } = Typography;

export default function ApproveDocuments() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPdf, setShowPdf] = useState(false);
  // ตัวกรอง: รวมปีการศึกษา+ภาคเรียนเป็นตัวเดียว (term) รูปแบบ "{semester}/{yearBE}" เช่น "1/2567"
  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    term: "all",
    classYear: "all",
  });
  const [approveModal, setApproveModal] = useState({
    open: false,
    record: null,
  });
  const [form] = Form.useForm();

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await internshipApprovalService.getHeadQueue();
      if (res.success) {
        setItems(res.data || []);
      } else {
        message.error(res.message || "ไม่สามารถดึงรายการได้");
      }
    } catch (e) {
      message.error(e.message || "เกิดข้อผิดพลาดในการดึงรายการ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleView = useCallback(async (record) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/internship/cs-05/${record.documentId}/view`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("ไม่สามารถโหลดเอกสารได้");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setShowPdf(true);
    } catch (e) {
      message.error(e.message || "เกิดข้อผิดพลาดในการโหลดเอกสาร");
    }
  }, []);

  const handleApprove = useCallback(async (record) => {
    setApproveModal({ open: true, record });
  }, []);

  const handleReject = useCallback(async (record) => {
    const reason = window.prompt("กรุณาระบุเหตุผลการปฏิเสธ");
    if (!reason) return;
    try {
      await internshipApprovalService.rejectCS05(record.documentId, reason);
      message.success("ปฏิเสธสำเร็จ");
      fetchQueue();
    } catch (e) {
      message.error(e.message || "ปฏิเสธไม่สำเร็จ");
    }
  }, []);

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
          const s = r.startDate ? dayjs(r.startDate).format("DD/MM/YYYY") : "-";
          const e = r.endDate ? dayjs(r.endDate).format("DD/MM/YYYY") : "-";
          return `${s} - ${e}`;
        },
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        key: "status",
        render: (v) => <Tag color={statusColor[v] || "default"}>{v}</Tag>,
      },
      {
        title: "ส่งเมื่อ",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "-"),
      },
      {
        title: "การทำงาน",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button icon={<EyeOutlined />} onClick={() => handleView(record)}>
              ดูเอกสาร
            </Button>
            <Button type="primary" onClick={() => handleApprove(record)}>
              อนุมัติ
            </Button>
            <Button danger onClick={() => handleReject(record)}>
              ปฏิเสธ
            </Button>
          </Space>
        ),
      },
    ],
    [handleApprove, handleReject, handleView]
  );

  // คำนวณสถิติรวมสำหรับการแสดงบนการ์ด สไตล์เดียวกับฝั่งเจ้าหน้าที่ภาค
  const statistics = useMemo(() => {
    const total = items.length;
    const pending = items.filter((r) => r.status === "pending").length;
    const approved = items.filter((r) => r.status === "approved").length;
    const rejected = items.filter((r) => r.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [items]);

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

  const onSubmitApprove = async () => {
    try {
      const values = await form.validateFields();
      const { letterType, comment } = values;
      await internshipApprovalService.approveCS05(
        approveModal.record.documentId,
        { letterType, comment }
      );
      message.success("อนุมัติสำเร็จ");
      setApproveModal({ open: false, record: null });
      form.resetFields();
      fetchQueue();
    } catch (e) {
      if (e?.errorFields) return; // validation error
      message.error(e.message || "อนุมัติไม่สำเร็จ");
    }
  };

  return (
    <Card title="อนุมัติเอกสาร คพ.05">
      {/* ส่วนแสดงสถิติ แบบย่อพร้อมไอคอน */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col>
          <Space size="large">
            <Space>
              <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <Text>เอกสารทั้งหมด: {statistics.total}</Text>
            </Space>
            <Space>
              <FileExclamationOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              <Text>รอดำเนินการ: {statistics.pending}</Text>
            </Space>
            <Space>
              <FileDoneOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              <Text>อนุมัติแล้ว: {statistics.approved}</Text>
            </Space>
            <Space>
              <CloseCircleOutlined style={{ fontSize: 24, color: '#f5222d' }} />
              <Text>ปฏิเสธแล้ว: {statistics.rejected}</Text>
            </Space>
          </Space>
        </Col>
      </Row>

      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Input
            placeholder="ค้นหา ชื่อ/รหัส/บริษัท"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            allowClear
            style={{ maxWidth: 320 }}
          />
        </Col>
        <Col>
          <Space size="small" wrap>
            <Select
              size="small"
              style={{ width: 160 }}
              placeholder="สถานะ"
              options={[
                { label: 'ทั้งหมด', value: 'all' },
                { label: 'รอดำเนินการ', value: 'pending' },
                { label: 'อนุมัติแล้ว', value: 'approved' },
                { label: 'ปฏิเสธ', value: 'rejected' },
              ]}
              value={filters.status}
              onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              allowClear
            />
            <Select
              size="small"
              style={{ width: 140 }}
              placeholder="ภาค/ปี"
              options={[{ label: 'ทุกภาค/ปี', value: 'all' }, ...termOptions]}
              value={filters.term}
              onChange={(v) => setFilters((f) => ({ ...f, term: v }))}
              allowClear
            />
            <Select
              size="small"
              style={{ width: 120 }}
              placeholder="ชั้นปี"
              options={[
                { label: 'ทุกชั้นปี', value: 'all' },
                { label: 'ปี 3', value: '3' },
                { label: 'ปี 4', value: '4' },
              ]}
              value={filters.classYear}
              onChange={(v) => setFilters((f) => ({ ...f, classYear: v }))}
              allowClear
            />
            <Button 
              type="primary" 
              onClick={fetchQueue}
              loading={loading}
            >
              รีเฟรช
            </Button>
          </Space>
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

      {showPdf && pdfUrl && (
        <PDFViewerModal
          visible={showPdf}
          pdfUrl={pdfUrl}
          onClose={() => setShowPdf(false)}
        />
      )}

      {/* Modal เลือกประเภทหนังสือ ก่อนอนุมัติ */}
      <Modal
        open={approveModal.open}
        title="เลือกประเภทหนังสือเพื่ออนุมัติ"
        onCancel={() => {
          setApproveModal({ open: false, record: null });
          form.resetFields();
        }}
        onOk={onSubmitApprove}
        okText="ยืนยันอนุมัติ"
        cancelText="ยกเลิก"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ letterType: "referral_letter" }}
        >
          <Form.Item
            name="letterType"
            label="ประเภทหนังสือ"
            rules={[{ required: true, message: "กรุณาเลือกประเภทหนังสือ" }]}
          >
            <Radio.Group>
              <Radio.Button value="referral_letter">
                หนังสือส่งตัวนักศึกษา
              </Radio.Button>
              <Radio.Button value="request_letter">
                หนังสือขอความอนุเคราะห์
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="comment" label="หมายเหตุ (ถ้ามี)">
            <Input.TextArea rows={3} placeholder="ระบุหมายเหตุเพิ่มเติม" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
