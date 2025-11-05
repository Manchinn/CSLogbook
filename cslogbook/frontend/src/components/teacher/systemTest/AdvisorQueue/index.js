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
  Typography
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import dayjs from '../../../../utils/dayjs';
import { DATE_FORMAT_MEDIUM, DATE_TIME_FORMAT } from '../../../../utils/constants';
import projectService from '../../../../services/projectService';
import PDFViewerModal from '../../../PDFViewerModal';

const { Title, Text } = Typography;
const { Search } = Input;

const STATUS_OPTIONS = [
  { value: 'pending_advisor', label: 'รอฉันพิจารณา' },
  { value: 'pending_staff', label: 'รอเจ้าหน้าที่' },
  { value: 'staff_approved', label: 'เจ้าหน้าที่อนุมัติแล้ว' },
  { value: 'all', label: 'ทั้งหมด' }
];

const STATUS_MAP = {
  pending_advisor: { color: 'gold', text: 'รออาจารย์พิจารณา' },
  pending_staff: { color: 'blue', text: 'รอเจ้าหน้าที่ตรวจสอบ' },
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

const AdvisorSystemTestQueue = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: 'pending_advisor', search: '' });
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [expandedRowKey, setExpandedRowKey] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerTitle, setViewerTitle] = useState('');

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const response = await projectService.listSystemTestAdvisorQueue();
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
  }, []);

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
      // กรองตามสถานะที่เลือก
      const matchesStatus = filters.status === 'all' || item.status === filters.status;
      if (!matchesStatus) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      // ค้นหาโดยเทียบกับชื่อโครงงาน โค้ด และข้อมูลผู้ยื่นคำขอ
      const project = item.projectSnapshot || {};
      const applicant = item.submittedBy || {};
      const candidates = [
        project.projectNameTh,
        project.projectNameEn,
        project.projectCode,
        applicant.studentCode,
        applicant.name
      ].filter(Boolean);
      return candidates.some((text) => String(text).toLowerCase().includes(keyword));
    });
  }, [filters.search, filters.status, items]);

  const summary = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        const status = item.status || 'pending_advisor';
        acc.total += 1;
        if (status === 'pending_advisor') acc.pending += 1;
        if (status === 'pending_staff') acc.waiting += 1;
        if (status === 'staff_approved') acc.completed += 1;
        return acc;
      },
      { pending: 0, waiting: 0, completed: 0, total: 0 }
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
          await projectService.submitSystemTestAdvisorDecision(record.projectSnapshot.projectId, {
            decision: isApprove ? 'approve' : 'reject',
            note: note || undefined
          });
          message.success(isApprove ? 'บันทึกการอนุมัติแล้ว' : 'บันทึกการปฏิเสธแล้ว');
          setReloadToken((prev) => prev + 1);
        } catch (error) {
          message.error(error.message || 'ไม่สามารถบันทึกผลการพิจารณาได้');
          return Promise.reject(error);
        } finally {
          setActionLoadingKey(null);
        }
        return Promise.resolve();
      }
    });
  }, []);

  const columns = useMemo(() => [
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
          <Space size={6}>
            <CalendarOutlined style={{ color: '#999' }} />
            <Text type="secondary">{`${formatDate(record.testStartDate)} - ${formatDate(record.testDueDate)}`}</Text>
          </Space>
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
      render: (status) => {
        const meta = STATUS_MAP[status] || { color: 'default', text: status || '-' };
        return <Tag color={meta.color}>{meta.text}</Tag>;
      }
    },
    {
      title: 'ยื่นคำขอเมื่อ',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (value) => <Text>{formatDateTime(value)}</Text>
    },
    {
      title: 'การดำเนินการ',
      key: 'actions',
      width: 220,
      render: (_value, record) => {
        const isPending = record.status === 'pending_advisor';
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
    }
  ], [actionLoadingKey, formatDate, formatDateTime, handleDecision]);

  const expandedRowRender = useCallback((record) => {
    const requestFile = record.requestFile;
    return (
      <Row gutter={[24, 16]}>
        <Col xs={24} md={14}>
          <Card size="small" title="รายละเอียดคำขอ">
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Text>ส่งคำขอเมื่อ: {formatDateTime(record.submittedAt)}</Text>
              <Text>ช่วงทดสอบ: {`${formatDate(record.testStartDate)} - ${formatDate(record.testDueDate)}`}</Text>
              {record.studentNote && <Alert type="info" message={`หมายเหตุจากนักศึกษา: ${record.studentNote}`} showIcon />}
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
                <Text type="secondary">ไม่มีไฟล์คำขอแนบมาด้วย</Text>
              )}
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card size="small" title="สถานะการพิจารณา">
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
                      <Text strong>อาจารย์ที่ปรึกษาหลัก:</Text>
                      <Text>
                        {record.advisorDecision?.decidedAt 
                          ? formatDateTime(record.advisorDecision.decidedAt)
                          : 'รอการพิจารณา'}
                      </Text>
                      {record.advisorDecision?.name && (
                        <Text type="secondary">โดย: {record.advisorDecision.name}</Text>
                      )}
                      {record.advisorDecision?.note && (
                        <Text type="secondary">หมายเหตุ: {record.advisorDecision.note}</Text>
                      )}
                    </Space>
                  )
                },
                record.coAdvisorDecision?.teacherId ? {
                  color: record.coAdvisorDecision?.decidedAt ? 'green' : 'gray',
                  children: (
                    <Space direction="vertical" size={2}>
                      <Text strong>อาจารย์ที่ปรึกษาร่วม:</Text>
                      <Text>
                        {record.coAdvisorDecision?.decidedAt 
                          ? formatDateTime(record.coAdvisorDecision.decidedAt)
                          : 'รอการพิจารณา'}
                      </Text>
                      {record.coAdvisorDecision?.name && (
                        <Text type="secondary">โดย: {record.coAdvisorDecision.name}</Text>
                      )}
                      {record.coAdvisorDecision?.note && (
                        <Text type="secondary">หมายเหตุ: {record.coAdvisorDecision.note}</Text>
                      )}
                    </Space>
                  )
                } : null,
                {
                  color: record.staffDecision?.decidedAt ? 'green' : 'gray',
                  children: (
                    <Space direction="vertical" size={2}>
                      <Text>เจ้าหน้าที่ตรวจสอบ: {formatDateTime(record.staffDecision?.decidedAt)}</Text>
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
              ].filter(item => item !== null)}
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
          <Title level={3}>คำขอทดสอบระบบ</Title>
          <Text type="secondary">
            ระบบจะแสดงเฉพาะคำขอทดสอบระบบจากโครงงานที่คุณเป็นอาจารย์ที่ปรึกษาหรือที่ปรึกษาร่วม
          </Text>
        </Space>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="รอฉันพิจารณา" value={summary.pending} suffix="รายการ" />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="รอเจ้าหน้าที่" value={summary.waiting} suffix="รายการ" />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="เจ้าหน้าที่อนุมัติแล้ว" value={summary.completed} suffix="รายการ" />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="ทั้งหมด" value={summary.total} suffix="รายการ" />
            </Card>
          </Col>
        </Row>

        <Card size="small" styles={{ body: { padding: 16  }}}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <Space>
                <Text strong>สถานะ</Text>
                <Select
                  style={{ minWidth: 220 }}
                  value={filters.status}
                  options={STATUS_OPTIONS}
                  onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                />
                <Button icon={<ReloadOutlined />} onClick={() => setReloadToken((prev) => prev + 1)}>
                  รีเฟรช
                </Button>
              </Space>
            </Col>
            <Col xs={24} md={12} style={{ textAlign: 'right' }}>
              <Search
                allowClear
                placeholder="ค้นหาโครงงานหรือรหัสนักศึกษา"
                style={{ maxWidth: 320 }}
                onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              />
            </Col>
          </Row>
        </Card>

        <Alert
          type="info"
          showIcon
          message="เกณฑ์ที่ควรตรวจสอบก่อนอนุมัติ"
          description={(
            <ul style={{ paddingLeft: 24, marginBottom: 0 }}>
              <li>ตรวจสอบช่วงเวลาทดสอบระบบให้อยู่ในกรอบ 30 วันตามข้อกำหนด</li>
              <li>ตรวจสอบบันทึกการพบอาจารย์ว่าครบตามเกณฑ์แล้ว (ระบบตรวจสอบเบื้องต้นให้แล้ว แต่ควรทบทวนอีกครั้ง)</li>
              <li>หากจำเป็น โปรดเพิ่มหมายเหตุเพื่อแจ้งนักศึกษาว่าต้องเตรียมอะไรเพิ่มเติมก่อนส่งให้เจ้าหน้าที่</li>
            </ul>
          )}
        />

        <Spin spinning={loading} tip="กำลังโหลดข้อมูล">
          <Table
            rowKey={(record) => record.requestId}
            dataSource={filteredItems}
            columns={columns}
            locale={{ emptyText: <Empty description="ไม่พบคำขอในช่วงนี้" /> }}
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
            title={viewerTitle || 'ไฟล์คำขอทดสอบระบบ'}
          />
        )}
      </Space>
    </div>
  );
};

export default AdvisorSystemTestQueue;
