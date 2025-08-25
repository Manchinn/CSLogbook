import React, { useState, useEffect, useCallback, useMemo } from 'react';
import OfficialDocumentService from '../../../services/PDFServices/OfficialDocumentService';
import { 
  Table, Button, Space, Tag, Modal, Form, Input, message, 
  Row, Col, Card, Typography, Tooltip, Drawer, Select
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, FileTextOutlined, FileExclamationOutlined, FileDoneOutlined
} from '@ant-design/icons';
import certificateService from '../../../services/certificateService'; // ✅ ใช้ service ใหม่
import CertificateRequestReview from './CertificateRequestReview';
import dayjs from '../../../utils/dayjs';
import { DATE_TIME_FORMAT } from '../../../utils/constants';

const { Text } = Typography;

const CertificateManagement = () => {
  const [certificateRequests, setCertificateRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve' หรือ 'reject'
  const [form] = Form.useForm();
  // ฟิลเตอร์แบบคอมแพค
  const [filters, setFilters] = useState({ q: '', status: 'all', term: 'all', classYear: 'all' });
  // Drawer แสดงรายละเอียดนักศึกษา
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // ดึงรายการคำขอหนังสือรับรอง
  const fetchCertificateRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await certificateService.getCertificateRequests(); // ✅ ใช้ admin route
      
      if (response.success) {
        setCertificateRequests(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching certificate requests:', error);
      message.error('ไม่สามารถดึงข้อมูลคำขอหนังสือรับรองได้');
    } finally {
      setLoading(false);
    }
  }, []);

  // โหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    fetchCertificateRequests();
  }, [fetchCertificateRequests]);

  // อนุมัติคำขอหนังสือรับรอง
  const handleApproveRequest = async (requestId) => {
    try {
      setProcessLoading(true);
      
      const certificateNumber = generateCertificateNumber();
      
      await certificateService.approveCertificateRequest(requestId, certificateNumber); // ✅ ใช้ admin route
      
      message.success('อนุมัติคำขอหนังสือรับรองเรียบร้อยแล้ว');
      await fetchCertificateRequests();
      setModalVisible(false);
      
    } catch (error) {
      console.error('Error approving request:', error);
      message.error('ไม่สามารถอนุมัติคำขอได้');
    } finally {
      setProcessLoading(false);
    }
  };

  // ปฏิเสธคำขอหนังสือรับรอง  
  const handleRejectRequest = async (requestId, remarks) => {
    try {
      setProcessLoading(true);
      
      await certificateService.rejectCertificateRequest(requestId, remarks); // ✅ ใช้ admin route
      
      message.success('ปฏิเสธคำขอเรียบร้อยแล้ว');
      await fetchCertificateRequests();
      setModalVisible(false);
      
    } catch (error) {
      console.error('Error rejecting request:', error);
      message.error('ไม่สามารถปฏิเสธคำขอได้');
    } finally {
      setProcessLoading(false);
    }
  };

  // (ถอด) ฟังก์ชัน downloadCertificate / notifyStudent ไม่ใช้แล้วหลังนำปุ่มออก

  // สร้างหมายเลขหนังสือรับรอง
  const generateCertificateNumber = () => {
    const year = new Date().getFullYear() + 543; // พ.ศ.
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `ว ${year}/${month}/${random}`;
  };

  // คอลัมน์ตาราง
  const columns = [
    {
      title: 'รหัสนักศึกษา',
      dataIndex: ['student', 'studentCode'],
      key: 'studentCode',
      width: 120,
    },
    {
      title: 'ชื่อ-นามสกุล',
      dataIndex: ['student', 'fullName'],
      key: 'fullName',
      width: 200,
    },
    {
      title: 'วันที่ขอ',
      dataIndex: 'requestDate',
      key: 'requestDate',
      width: 120,
  render: (date) => (date ? dayjs(date).format(DATE_TIME_FORMAT) : '-'),
    },
    {
      title: 'ชั่วโมงฝึกงาน',
      dataIndex: 'totalHours',
      key: 'totalHours',
      width: 100,
      render: (hours) => `${hours} ชม.`,
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusConfig = {
          pending: { color: 'orange', text: 'รอดำเนินการ' },
          approved: { color: 'green', text: 'อนุมัติแล้ว' },
          rejected: { color: 'red', text: 'ปฏิเสธ' },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'หมายเลขหนังสือ',
      dataIndex: 'certificateNumber',
      key: 'certificateNumber',
      width: 150,
      render: (number) => number || '-',
    },
    {
      title: 'การดำเนินการ',
      key: 'actions',
      width: 160,
      // เอาเฉพาะ ดูรายละเอียด / อนุมัติ / ปฏิเสธ ตามที่ร้องขอ (ถอด ดาวน์โหลด & ส่งการแจ้งเตือน)
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
          {record.status === 'pending' && (
            <>
              <Tooltip title="อนุมัติ">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    setSelectedRequest(record);
                    setActionType('approve');
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
                    setActionType('reject');
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

  // คำนวณสถิติจำนวนคำขอแต่ละสถานะ เพื่อแสดงบนการ์ดด้านบน
  const statistics = useMemo(() => {
    const total = (certificateRequests || []).length;
    let pending = 0, approved = 0, rejected = 0;
    (certificateRequests || []).forEach(r => {
      if (r.status === 'pending') pending += 1;
      else if (r.status === 'approved') approved += 1;
      else if (r.status === 'rejected') rejected += 1;
    });
    return { total, pending, approved, rejected };
  }, [certificateRequests]);

  // ช่วยคำนวณภาค/ปี และชั้นปีเพื่อใช้กรอง
  const computeAcademic = (dt) => {
    if (!dt) return { yearBE: null, semester: null };
    const d = dayjs(dt);
    if (!d.isValid()) return { yearBE: null, semester: null };
    const m = d.month() + 1; // 1..12
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

  // ตัวเลือกภาค/ปี (term) เช่น "1/2567"
  const termOptions = useMemo(() => {
    const terms = new Set();
    (certificateRequests || []).forEach((r) => {
      const d = r.requestDate || r.createdAt;
      if (!d) return;
      const m = dayjs(d).month() + 1;
      let semester;
      let yearBE;
      if (m >= 8 && m <= 12) { semester = 1; yearBE = dayjs(d).year() + 543; }
      else { semester = 2; yearBE = dayjs(d).year() + 542; }
      terms.add(`${semester}/${yearBE}`);
    });
    return Array.from(terms).filter(Boolean).sort((a, b) => {
      const [sa, ya] = String(a).split('/').map(Number);
      const [sb, yb] = String(b).split('/').map(Number);
      if (yb !== ya) return yb - ya;
      return sb - sa;
    }).map((t) => ({ label: t, value: t }));
  }, [certificateRequests]);

  // กรองข้อมูลฝั่ง client
  const filteredRequests = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return (certificateRequests || []).filter((r) => {
      const name = (r.student?.fullName || '').toLowerCase();
      const code = (r.student?.studentCode || '').toLowerCase();
      const company = (r.companyName || '').toLowerCase(); // เผื่ออนาคตมี
      const matchQ = !q || name.includes(q) || code.includes(q) || company.includes(q);

      const matchStatus = filters.status === 'all' ? true : r.status === filters.status;

      const baseDate = r.requestDate || r.createdAt || null;
      const { yearBE, semester } = computeAcademic(baseDate);
      const thisTerm = (semester && yearBE) ? `${semester}/${yearBE}` : null;
      const matchTerm = filters.term === 'all' || (thisTerm && thisTerm === filters.term);

      const entryBE = getEntryYearBEFromCode(r.student?.studentCode);
      const classYear = (entryBE && yearBE) ? (yearBE - entryBE + 1) : null;
      const matchClass = filters.classYear === 'all' || (classYear && String(classYear) === String(filters.classYear));

      return matchQ && matchStatus && matchTerm && matchClass;
    });
  }, [certificateRequests, filters]);

  // โหลดรายละเอียดคำขอ
  const openDetailDrawer = async (requestId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await certificateService.getCertificateRequestDetail(requestId);
      if (res.success) setDetailData(res.data);
    } catch (e) {
      message.error('ไม่สามารถดึงรายละเอียดคำขอ');
    } finally {
      setDetailLoading(false);
    }
  };

  // 🆕 สร้าง PDF Logbook ฝั่ง frontend (ดึงข้อมูลจาก admin JSON แล้วใช้ template เดิม)
  const handleOpenLogbookPDF = async () => {
    const internshipId = detailData?.internship?.internshipId;
    if (!internshipId) {
      message.info('ไม่พบ Internship ID');
      return;
    }
    try {
      message.loading({ content: 'กำลังเตรียมข้อมูล Logbook...', key: 'logpdf' });
      const res = await certificateService.getAdminLogbookFullSummary(internshipId); // ต้องสร้าง method ใน service
      if (!res?.success) throw new Error(res?.message || 'ดึงข้อมูลไม่สำเร็จ');
      const summary = res.data; // shape: summaryFull
  await OfficialDocumentService.previewInternshipLogbookPDF(summary);
  message.success({ content: 'แสดงตัวอย่าง PDF แล้ว', key: 'logpdf', duration: 2 });
    } catch (err) {
      console.error('Generate logbook PDF error:', err);
      message.error({ content: 'ไม่สามารถสร้าง PDF Logbook ได้', key: 'logpdf' });
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        {/* ส่วนแสดงสถิติ */}
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
                onClick={fetchCertificateRequests}
                loading={loading}
              >
                รีเฟรช
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredRequests}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Modal สำหรับอนุมัติ/ปฏิเสธ */}
      <Modal
        title={actionType === 'approve' ? 'อนุมัติคำขอหนังสือรับรอง' : 'ปฏิเสธคำขอหนังสือรับรอง'}
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
            type={actionType === 'approve' ? 'primary' : 'danger'}
            loading={processLoading}
            onClick={() => {
              if (actionType === 'approve') {
                handleApproveRequest(selectedRequest?.id);
              } else {
                form.validateFields().then((values) => {
                  handleRejectRequest(selectedRequest?.id, values.remarks);
                });
              }
            }}
          >
            {actionType === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'}
          </Button>,
        ]}
      >
        {selectedRequest && (
          <div>
            <p><strong>นักศึกษา:</strong> {selectedRequest.student?.fullName}</p>
            <p><strong>รหัส:</strong> {selectedRequest.student?.studentCode}</p>
            <p><strong>ชั่วโมงฝึกงาน:</strong> {selectedRequest.totalHours} ชั่วโมง</p>
            
            {actionType === 'reject' && (
              <Form form={form} layout="vertical">
                <Form.Item
                  name="remarks"
                  label="เหตุผลการปฏิเสธ"
                  rules={[{ required: true, message: 'กรุณาระบุเหตุผล' }]}
                >
                  <Input.TextArea 
                    rows={4} 
                    placeholder="ระบุเหตุผลการปฏิเสธ..."
                  />
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Modal>

      {/* Drawer แสดงรายละเอียดนักศึกษาให้เจ้าหน้าที่ภาคดู */}
      <Drawer
        title={selectedRequest ? `รายละเอียดคำขอ #${selectedRequest.id}` : 'รายละเอียดคำขอ'}
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
            setSelectedRequest(selectedRequest); // ensure state
            setActionType('approve');
            setModalVisible(true);
          }}
          onReject={() => {
            if (!selectedRequest) return;
            setSelectedRequest(selectedRequest);
            setActionType('reject');
            setModalVisible(true);
          }}
        />
      </Drawer>
    </div>
  );
};

export default CertificateManagement;