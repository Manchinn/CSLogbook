import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Timeline,
  Typography,
  Tooltip
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import dayjs from '../../../../utils/dayjs';
import { DATE_FORMAT_MEDIUM, DATE_TIME_FORMAT } from '../../../../utils/constants';
import projectService from '../../../../services/projectService';
import { useAuth } from '../../../../contexts/AuthContext';
import PDFViewerModal from '../../../PDFViewerModal';

const { Title, Text } = Typography;

const STATUS_OPTIONS = [
  { value: 'pending_staff', label: 'รอเจ้าหน้าที่' },
  { value: 'staff_approved', label: 'อนุมัติแล้ว (รอหลักฐาน)' },
  { value: 'staff_rejected', label: 'ปฏิเสธแล้ว' },
  { value: 'advisor_rejected', label: 'อาจารย์ปฏิเสธ' },
  { value: 'all', label: 'ทั้งหมด' }
];

const STATUS_MAP = {
  pending_advisor: { color: 'gold', text: 'รออาจารย์พิจารณา' },
  advisor_rejected: { color: 'red', text: 'อาจารย์ปฏิเสธคำขอ' },
  pending_staff: { color: 'blue', text: 'รอเจ้าหน้าที่ตรวจสอบ' },
  staff_rejected: { color: 'magenta', text: 'เจ้าหน้าที่ปฏิเสธ' },
  staff_approved: { color: 'green', text: 'เจ้าหน้าที่อนุมัติแล้ว (รอหลักฐาน)' }
};

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24
};

const StaffSystemTestQueue = () => {
  const { userData } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: 'pending_staff', search: '' });
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [expandedRowKey, setExpandedRowKey] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerTitle, setViewerTitle] = useState('');

  const canDecide = useMemo(() => {
    if (!userData) return false;
    if (userData.role === 'admin') return true;
    if (userData.role === 'teacher' && (userData.teacherType === 'support' || userData.canExportProject1)) {
      return true;
    }
    return false;
  }, [userData]);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status;
      }
      const response = await projectService.listSystemTestStaffQueue(params);
      if (!response?.success) {
        message.error(response?.message || 'ไม่สามารถดึงรายการคำขอได้');
        return;
      }
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      message.error(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [filters.status]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue, reloadToken]);

  const formatDate = useCallback((value) => {
    if (!value) return '-';
    return dayjs(value).locale('th').format(DATE_FORMAT_MEDIUM);
  }, []);

  const formatDateTime = useCallback((value) => {
    if (!value) return '-';
    return dayjs(value).locale('th').format(DATE_TIME_FORMAT);
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = (filters.search || '').trim().toLowerCase();
    return items.filter((item) => {
      // กรองสถานะตามตัวเลือกฟิลเตอร์
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      // ค้นหาจากชื่อโครงงาน ชื่อ/รหัสนักศึกษา และชื่ออาจารย์ที่ปรึกษา
      const project = item.projectSnapshot || {};
      const applicant = item.submittedBy || {};
      const advisor = item.advisorDecision || {};
      const candidates = [
        project.projectNameTh,
        project.projectNameEn,
        project.projectCode,
        applicant.studentCode,
        applicant.name,
        advisor.name
      ].filter(Boolean);
      return candidates.some((text) => String(text).toLowerCase().includes(keyword));
    });
  }, [filters.search, filters.status, items]);

  const summary = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        const status = item.status || 'pending_staff';
        acc.total += 1;
        if (status === 'pending_staff') acc.waiting += 1;
        if (status === 'staff_approved') acc.approved += 1;
        if (status === 'staff_rejected') acc.rejected += 1;
        if (status === 'advisor_rejected') acc.advisorRejected += 1;
        return acc;
      },
      { waiting: 0, approved: 0, rejected: 0, advisorRejected: 0, total: 0 }
    );
  }, [filteredItems]);

  const handlePreview = useCallback((file, title) => {
    if (!file?.url) {
      message.warning('ไม่พบไฟล์สำหรับแสดงตัวอย่าง');
      return;
    }
    setViewerUrl(file.url);
    setViewerTitle(title || file.name || 'เอกสาร PDF');
    setViewerVisible(true);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setViewerVisible(false);
    setViewerUrl(null);
    setViewerTitle('');
  }, []);

  const handleDecision = useCallback((record, decision) => {
    if (!record?.projectSnapshot?.projectId) {
      message.error('ไม่พบข้อมูลโครงงาน');
      return;
    }
    let noteValue = '';
    const isApprove = decision === 'approve';
    Modal.confirm({
      title: isApprove ? 'ยืนยันการอนุมัติคำขอทดสอบระบบ' : 'ยืนยันการปฏิเสธคำขอทดสอบระบบ',
      content: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">{isApprove ? 'คุณสามารถใส่หมายเหตุถึงนักศึกษา (ไม่บังคับ)' : 'กรุณาระบุเหตุผล (อย่างน้อย 5 ตัวอักษร)'}</Text>
          <Input.TextArea
            rows={3}
            placeholder="หมายเหตุถึงนักศึกษา"
            onChange={(event) => {
              noteValue = event.target.value;
            }}
          />
        </Space>
      ),
      okText: isApprove ? 'อนุมัติ' : 'ปฏิเสธ',
      okButtonProps: { type: 'primary', danger: !isApprove },
      cancelText: 'ยกเลิก',
      async onOk() {
        const note = (noteValue || '').trim();
        if (!isApprove && note.length < 5) {
          message.warning('กรุณาระบุหมายเหตุอย่างน้อย 5 ตัวอักษร');
          return Promise.reject();
        }
        const loadingKey = `${record.requestId}-${decision}`;
        setActionLoadingKey(loadingKey);
        try {
          await projectService.submitSystemTestStaffDecision(record.projectSnapshot.projectId, {
            decision: isApprove ? 'approve' : 'reject',
            note: note || undefined
          });
          message.success(isApprove ? 'บันทึกการอนุมัติแล้ว' : 'บันทึกการปฏิเสธแล้ว');
          setReloadToken((prev) => prev + 1);
        } catch (error) {
          message.error(error.message || 'ไม่สามารถบันทึกผลการตรวจสอบได้');
          return Promise.reject(error);
        } finally {
          setActionLoadingKey(null);
        }
        return Promise.resolve();
      }
    });
  }, []);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: 'โครงงาน',
        dataIndex: 'projectSnapshot',
        key: 'project',
        render: (project) => {
          if (!project) return '-';
          return (
            <Space direction="vertical" size={4}>
              <Space size={6} wrap>
                <Text strong>{project.projectNameTh || project.projectNameEn || 'ไม่ระบุชื่อโครงงาน'}</Text>
                {project.projectCode && <Tag color="geekblue">{project.projectCode}</Tag>}
              </Space>
            </Space>
          );
        }
      },
      {
        title: 'ช่วงทดสอบระบบ',
        key: 'period',
        render: (_value, record) => (
          <Space direction="vertical" size={2}>
            <Text type="secondary">{`${formatDate(record.testStartDate)} - ${formatDate(record.testDueDate)}`}</Text>
          </Space>
        )
      },
      {
        title: 'ผู้ส่งคำขอ',
        dataIndex: 'submittedBy',
        key: 'submittedBy',
        render: (submittedBy) => {
          if (!submittedBy) return '-';
          return (
            <Space direction="vertical" size={2}>
              <Text>{submittedBy.name || '-'}</Text>
              <Text type="secondary">{submittedBy.studentCode || '-'}</Text>
            </Space>
          );
        }
      },
      {
        title: 'สถานะ',
        dataIndex: 'status',
        key: 'status',
        render: (status, record) => {
          const meta = STATUS_MAP[status] || { color: 'default', text: status || '-' };
          
          // แสดง deadline tag ถ้ามี
          const deadlineTag = record.deadlineStatus?.tag;
          
          return (
            <Space direction="vertical" size={4}>
              <Tag color={meta.color}>{meta.text}</Tag>
              {deadlineTag && (
                <Tooltip title={deadlineTag.tooltip}>
                  <Tag 
                    color={deadlineTag.color} 
                    icon={deadlineTag.type === 'locked' ? <WarningOutlined /> : <ClockCircleOutlined />}
                  >
                    {deadlineTag.text}
                  </Tag>
                </Tooltip>
              )}
            </Space>
          );
        }
      },
      {
        title: 'ยื่นคำขอเมื่อ',
        dataIndex: 'submittedAt',
        key: 'submittedAt',
        render: (value) => <Text>{formatDateTime(value)}</Text>
      }
    ];

    if (canDecide) {
      baseColumns.push({
        title: 'การดำเนินการ',
        key: 'actions',
        width: 240,
        render: (_value, record) => {
          const isPending = record.status === 'pending_staff';
          return (
            <Space>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleDecision(record, 'approve')}
                disabled={!isPending}
                loading={actionLoadingKey === `${record.requestId}-approve`}
              >
                อนุมัติ
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleDecision(record, 'reject')}
                disabled={!isPending}
                loading={actionLoadingKey === `${record.requestId}-reject`}
              >
                ปฏิเสธ
              </Button>
            </Space>
          );
        }
      });
    }

    return baseColumns;
  }, [actionLoadingKey, canDecide, formatDate, formatDateTime, handleDecision]);

  const expandedRowRender = useCallback((record) => {
    const requestFile = record.requestFile;
    return (
      <Row gutter={[24, 16]}>
        <Col xs={24} md={14}>
          <Card size="small" title="รายละเอียดคำขอ">
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Text>ส่งคำขอเมื่อ: {formatDateTime(record.submittedAt)}</Text>
              <Text>ช่วงทดสอบ: {`${formatDate(record.testStartDate)} - ${formatDate(record.testDueDate)}`}</Text>
              {record.studentNote && (
                <Alert type="info" showIcon message={`หมายเหตุจากนักศึกษา: ${record.studentNote}`} />
              )}
              {requestFile ? (
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() =>
                    handlePreview(
                      requestFile,
                      `ไฟล์คำขอทดสอบระบบ - ${
                        record.projectSnapshot?.projectNameTh ||
                        record.projectSnapshot?.projectNameEn ||
                        requestFile.name
                      }`
                    )
                  }
                >
                  เปิดดูไฟล์คำขอ ({requestFile.name})
                </Button>
              ) : (
                <Text type="secondary">ไม่มีไฟล์คำขอแนบ</Text>
              )}
              {record.evidence ? (
                <Space size={8} wrap>
                  <Text>หลักฐานการประเมิน:</Text>
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(record.evidence, `หลักฐานการประเมิน - ${record.projectSnapshot?.projectNameTh || record.projectSnapshot?.projectNameEn || record.evidence.name}`)}
                  >
                    เปิดดู
                  </Button>
                </Space>
              ) : (
                <Space size={8}>
                  <Text>หลักฐานการประเมิน:</Text>
                  <Tag color="warning">ยังไม่อัปโหลด</Tag>
                </Space>
              )}
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card size="small" title="ลำดับการพิจารณา">
            <Timeline
              items={[
                {
                  color: 'blue',
                  children: <Text>ส่งคำขอ: {formatDateTime(record.timeline?.submittedAt)}</Text>
                },
                {
                  color: record.advisorDecision?.decidedAt ? 'green' : 'gray',
                  children: (
                    <Space direction="vertical" size={2}>
                      <Text>อาจารย์อนุมัติ: {formatDateTime(record.advisorDecision?.decidedAt)}</Text>
                      {record.advisorDecision?.note && (
                        <Text type="secondary">หมายเหตุอาจารย์: {record.advisorDecision.note}</Text>
                      )}
                    </Space>
                  )
                },
                {
                  color: record.staffDecision?.decidedAt ? 'green' : 'gray',
                  children: (
                    <Space direction="vertical" size={2}>
                      <Text>เจ้าหน้าที่พิจารณา: {formatDateTime(record.staffDecision?.decidedAt)}</Text>
                      {record.staffDecision?.note && (
                        <Text type="secondary">หมายเหตุเจ้าหน้าที่: {record.staffDecision.note}</Text>
                      )}
                    </Space>
                  )
                },
                {
                  color: record.evidenceSubmittedAt ? 'green' : 'gray',
                  children: (
                    <Text>อัปโหลดหลักฐาน: {formatDateTime(record.evidenceSubmittedAt)}</Text>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    );
  }, [formatDate, formatDateTime, handlePreview]);

  return (
    <div style={containerStyle}>
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <Space direction="vertical" size={8}>
          <Title level={3}>ตรวจสอบคำขอทดสอบระบบ</Title>
          <Text type="secondary">
            เจ้าหน้าที่สามารถตรวจสอบคำขอที่อาจารย์อนุมัติแล้ว บันทึกผลการตรวจสอบ และติดตามการส่งหลักฐานจากนักศึกษา
          </Text>
        </Space>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="รอเจ้าหน้าที่" value={summary.waiting} suffix="รายการ" />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="อนุมัติแล้ว" value={summary.approved} suffix="รายการ" />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="ปฏิเสธ" value={summary.rejected} suffix="รายการ" />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="อาจารย์ปฏิเสธ" value={summary.advisorRejected} suffix="รายการ" />
            </Card>
          </Col>
        </Row>

        <Card size="small" styles={{ body: { padding: 16  }}}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={7}>
              <Space direction="vertical" size={4}>
                <Text strong>สถานะคำขอ</Text>
                <Select
                  value={filters.status}
                  options={STATUS_OPTIONS}
                  onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                />
              </Space>
            </Col>
            <Col xs={24} md={9}>
              <Space direction="vertical" size={4}>
                <Text strong>ค้นหา</Text>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="ค้นหาโครงงาน / รหัสนักศึกษา / ชื่ออาจารย์"
                  value={filters.search}
                  onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                />
              </Space>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: 'right' }}>
              <Space wrap>
                <Button icon={<ReloadOutlined />} onClick={() => setReloadToken((prev) => prev + 1)}>
                  รีเฟรช
                </Button>
                <Button
                  danger
                  onClick={() => setFilters({ status: 'pending_staff', search: '' })}
                >
                  รีเซ็ตตัวกรอง
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Spin spinning={loading} tip="กำลังโหลดข้อมูล">
          <Table
            rowKey={(record) => record.requestId}
            dataSource={filteredItems}
            columns={columns}
            locale={{ emptyText: <Empty description="ไม่พบคำขอ" /> }}
            expandable={{
              expandedRowKeys: expandedRowKey ? [expandedRowKey] : [],
              onExpand: (expanded, record) => setExpandedRowKey(expanded ? record.requestId : null),
              expandedRowRender
            }}
          />
        </Spin>
        {viewerVisible && (
          <PDFViewerModal
            visible={viewerVisible}
            pdfUrl={viewerUrl}
            onClose={handleCloseViewer}
            title={viewerTitle || 'หลักฐานการประเมิน'}
          />
        )}
      </Space>
    </div>
  );
};

export default StaffSystemTestQueue;
