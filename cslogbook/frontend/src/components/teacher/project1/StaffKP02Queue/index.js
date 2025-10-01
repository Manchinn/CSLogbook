import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
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
  Tooltip,
  Typography
} from 'antd';
import {
  CheckCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import FileSaver from 'file-saver';
import dayjs from '../../../../utils/dayjs';
import { DATE_TIME_FORMAT } from '../../../../utils/constants';
import projectService from '../../../../services/projectService';
import { useAuth } from '../../../../contexts/AuthContext';

const { Text, Title } = Typography;

const STATUS_OPTIONS = [
  { value: 'advisor_approved', label: 'รอเจ้าหน้าที่ตรวจสอบ' },
  { value: 'staff_verified', label: 'ตรวจสอบแล้ว' },
  { value: 'scheduled', label: 'นัดสอบแล้ว' },
  { value: 'all', label: 'ทั้งหมด' }
];

const STATUS_MAP = {
  advisor_in_review: { color: 'orange', text: 'รออาจารย์อนุมัติครบ' },
  advisor_approved: { color: 'blue', text: 'รอเจ้าหน้าที่ตรวจสอบ' },
  staff_verified: { color: 'green', text: 'ตรวจสอบแล้ว (ประกาศผ่านปฏิทิน)' },
  scheduled: { color: 'cyan', text: 'นัดสอบแล้ว (ระบบเดิม)' },
  completed: { color: 'purple', text: 'บันทึกผลสอบแล้ว' }
};

const containerStyle = {
  maxWidth: 1280,
  margin: '0 auto',
  padding: '24px'
};

const StaffKP02Queue = () => {
  const { userData } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    status: 'advisor_approved',
    academicYear: undefined,
    semester: undefined,
    search: ''
  });
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [expandedRowKey, setExpandedRowKey] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const isStaff = useMemo(() => {
    if (!userData) return false;
    if (userData.role === 'admin') return true;
    return userData.role === 'teacher' && userData.teacherType === 'support';
  }, [userData]);

  const canSchedulerExport = useMemo(() => {
    if (!userData) return false;
    return userData.role === 'teacher' && Boolean(userData.canExportProject1);
  }, [userData]);

  const canExport = isStaff || canSchedulerExport;

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status;
      }
      if (filters.academicYear) {
        params.academicYear = filters.academicYear;
      }
      if (filters.semester) {
        params.semester = filters.semester;
      }
      if (filters.search) {
        params.search = filters.search;
      }
      const response = await projectService.listProject1StaffQueue(params);
      if (!response?.success) {
        message.error(response?.message || 'ไม่สามารถดึงคิวตรวจสอบได้');
        return;
      }
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      message.error(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue, reloadToken]);

  const availableAcademicYears = useMemo(() => {
    const years = new Set();
    items.forEach((item) => {
      const year = item.project?.academicYear;
      if (year) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [items]);

  const formatDateTime = useCallback((value) => {
    if (!value) return '-';
    return dayjs(value).locale('th').format(DATE_TIME_FORMAT);
  }, []);

  const handleVerify = useCallback((record) => {
    if (!isStaff) {
      message.warning('เฉพาะเจ้าหน้าที่ที่ได้รับสิทธิ์เท่านั้นที่สามารถบันทึกการตรวจสอบได้');
      return;
    }
    let noteValue = '';
    Modal.confirm({
      title: 'ยืนยันการตรวจสอบคำขอ',
      content: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">ใส่หมายเหตุถึงนักศึกษา (ไม่จำเป็นต้องกรอก)</Text>
          <Input.TextArea
            rows={3}
            onChange={(event) => {
              noteValue = event.target.value;
            }}
            placeholder="หมายเหตุถึงนักศึกษา"
          />
        </Space>
      ),
      okText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      async onOk() {
        if (!record?.project?.projectId) {
          message.error('ไม่พบข้อมูลโครงงาน');
          return Promise.reject();
        }
        // บันทึกผู้ตรวจสอบพร้อมหมายเหตุ (ถ้ามี) และ trigger ให้รายการรีเฟรชใหม่
        const loadingKey = `${record.requestId}-verify`;
        setActionLoadingKey(loadingKey);
        try {
          await projectService.verifyProject1DefenseRequest(record.project.projectId, { note: (noteValue || '').trim() || undefined });
          message.success('บันทึกการตรวจสอบแล้ว');
          setReloadToken((prev) => prev + 1);
        } catch (error) {
          message.error(error.message || 'ไม่สามารถบันทึกการตรวจสอบได้');
          return Promise.reject(error);
        } finally {
          setActionLoadingKey(null);
        }
        return Promise.resolve();
      }
    });
  }, [isStaff]);

  const handleExport = useCallback(async () => {
    if (!canExport) {
      message.warning('คุณไม่มีสิทธิ์ส่งออกข้อมูลชุดนี้');
      return;
    }
    try {
      setExporting(true);
      const params = {};
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.academicYear) params.academicYear = filters.academicYear;
      if (filters.semester) params.semester = filters.semester;
      if (filters.search) params.search = filters.search;

      const { blob, filename } = await projectService.exportProject1StaffQueue(params);
      FileSaver.saveAs(blob, filename || `kp02_staff_queue_${Date.now()}.xlsx`);
      message.success('ส่งออกไฟล์เรียบร้อย');
    } catch (error) {
      message.error(error.message || 'ไม่สามารถส่งออกข้อมูลได้');
    } finally {
      setExporting(false);
    }
  }, [canExport, filters]);

  const summary = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const status = item.status || 'advisor_in_review';
        acc.total += 1;
        if (status === 'advisor_approved') acc.waiting += 1;
        if (status === 'staff_verified') acc.verified += 1;
        if (status === 'scheduled') acc.legacyScheduled += 1;
        if (status === 'completed') acc.completed += 1;
        return acc;
      },
      { waiting: 0, verified: 0, legacyScheduled: 0, completed: 0, total: 0 }
    );
  }, [items]);

  const baseColumns = useMemo(() => [
    {
      title: 'โครงงาน',
      dataIndex: 'project',
      key: 'project',
      render: (project) => {
        if (!project) return '-';
        return (
          <Space direction="vertical" size={4}>
            <Space size={6} wrap>
              <Text strong>{project.projectNameTh || project.projectNameEn || 'ไม่ระบุชื่อโครงงาน'}</Text>
              {project.projectCode && <Tag color="geekblue">{project.projectCode}</Tag>}
            </Space>
            <Text type="secondary">ปีการศึกษา {project.academicYear || '-'} / ภาคเรียน {project.semester || '-'}</Text>
          </Space>
        );
      }
    },
    {
      title: 'สมาชิก',
      dataIndex: ['project', 'members'],
      key: 'members',
      render: (members) => {
        if (!Array.isArray(members) || members.length === 0) return '-';
        return (
          <Space direction="vertical" size={2}>
            {members.map((member) => (
              <Text key={member.studentId}>{member.studentCode || ''} {member.name || ''}</Text>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (value) => {
        const meta = STATUS_MAP[value] || { color: 'default', text: value || '-' };
        return <Tag color={meta.color}>{meta.text}</Tag>;
      }
    },
    {
      title: 'ยื่นคำขอ / อัปเดต',
      key: 'timestamps',
      render: (_value, record) => (
        <Space direction="vertical" size={2}>
          <Text>ส่งคำขอ: {formatDateTime(record.submittedAt)}</Text>
          <Text>อนุมัติครบ: {formatDateTime(record.advisorApprovedAt)}</Text>
          <Text>ตรวจสอบแล้ว: {formatDateTime(record.staffVerifiedAt)}</Text>
          <Text>
            ตารางสอบ: {record.defenseScheduledAt ? formatDateTime(record.defenseScheduledAt) : 'ติดตามผ่านปฏิทินภาควิชา'}
          </Text>
        </Space>
      )
    }
  ], [formatDateTime]);

  const columns = useMemo(() => {
    const list = [...baseColumns];
    if (isStaff) {
      list.push({
        title: 'การดำเนินการ',
        key: 'actions',
        width: 240,
        render: (_value, record) => (
          <Space>
            <Tooltip title="บันทึกการตรวจสอบ">
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleVerify(record)}
                disabled={record.status !== 'advisor_approved'}
                loading={actionLoadingKey === `${record.requestId}-verify`}
              >
                ตรวจสอบแล้ว
              </Button>
            </Tooltip>
          </Space>
        )
      });
    }
    return list;
  }, [actionLoadingKey, baseColumns, handleVerify, isStaff]);

  const previewColumns = useMemo(() => baseColumns, [baseColumns]);

  const expandedRowRender = useCallback((record) => {
    return (
      <Row gutter={[24, 16]}>
        <Col xs={24} md={14}>
          <Card size="small" title="รายละเอียดเพิ่มเติม">
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Text>หมายเหตุเจ้าหน้าที่: {record.staffVerificationNote || '-'}</Text>
              <Text>เจ้าหน้าที่ผู้ตรวจ: {record.staffVerifiedBy?.fullName || '-'}</Text>
              <Text>หมายเหตุการนัดสอบ (ข้อมูลเดิม): {record.defenseNote || 'ตรวจสอบประกาศจากปฏิทิน'}</Text>
              <Text>สถานที่สอบ (ข้อมูลเดิม): {record.defenseLocation || 'ประกาศผ่านช่องทางภายนอก'}</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card size="small" title="สรุปบันทึกการพบ (หัวหน้าโครงงาน)">
            {record.meetingMetrics ? (
              <Space direction="vertical" size={4}>
                <Text>อนุมัติทั้งหมด: {record.meetingMetrics.totalApprovedLogs || 0}</Text>
                <Text>ต้องมีขั้นต่ำ: {record.meetingMetrics.requiredApprovedLogs || 0}</Text>
                <Text>อนุมัติครั้งล่าสุด: {formatDateTime(record.meetingMetrics.lastApprovedLogAt)}</Text>
              </Space>
            ) : (
              <Alert type="info" message="ไม่พบข้อมูลบันทึกการพบ" showIcon />
            )}
          </Card>
        </Col>
      </Row>
    );
  }, [formatDateTime]);

  return (
    <div style={containerStyle}>
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <Space direction="vertical" size={8}>
          <Title level={3}>คำร้องขอสอบโครงงานพิเศษ1 (คพ.02)</Title>
          <Text type="secondary">
            เจ้าหน้าที่สามารถตรวจสอบคำขอที่อาจารย์อนุมัติครบแล้ว บันทึกผลการตรวจสอบ และส่งออกข้อมูลสำหรับการนัดสอบได้
          </Text>
        </Space>

        <Alert
          type="info"
          showIcon
          message="การนัดสอบจัดการผ่านปฏิทินภาควิชา"
          description={(
            <Space direction="vertical" size={2}>
              <span>หลังตรวจสอบคำขอแล้ว โปรดอัปเดตวันเวลาและสถานที่สอบในปฏิทินหรือระบบภายนอกของภาควิชาเท่านั้น</span>
              {summary.legacyScheduled > 0 && (
                <span>ยังมี {summary.legacyScheduled} รายการที่มีข้อมูลนัดสอบจากระบบเดิม</span>
              )}
              {canSchedulerExport && !isStaff && (
                <span>คุณได้รับสิทธิ์ในการตรวจสอบรายชื่อและส่งออกรายการ คพ.02 (อ่านอย่างเดียว)</span>
              )}
              <span>กด "ดูตัวอย่างก่อนส่งออก" เพื่อทบทวนรายชื่อทั้งหมดก่อนสร้างไฟล์</span>
            </Space>
          )}
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="รอเจ้าหน้าที่" value={summary.waiting} suffix="รายการ" />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="ตรวจสอบแล้ว (รอปฏิทิน)" value={summary.verified} suffix="รายการ" />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="บันทึกผลสอบแล้ว" value={summary.completed} suffix="รายการ" />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="ทั้งหมด" value={summary.total} suffix="รายการ" />
            </Card>
          </Col>
        </Row>

        <Card size="small" bodyStyle={{ padding: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={6}>
              <Space direction="vertical" size={4}>
                <Text strong>สถานะคำขอ</Text>
                <Select
                  value={filters.status}
                  options={STATUS_OPTIONS}
                  onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                />
              </Space>
            </Col>
            <Col xs={24} md={6}>
              <Space direction="vertical" size={4}>
                <Text strong>ปีการศึกษา</Text>
                <Select
                  allowClear
                  placeholder="ทั้งหมด"
                  value={filters.academicYear}
                  options={availableAcademicYears.map((year) => ({ value: year, label: `${year}` }))}
                  onChange={(value) => setFilters((prev) => ({ ...prev, academicYear: value }))}
                />
              </Space>
            </Col>
            <Col xs={24} md={6}>
              <Space direction="vertical" size={4}>
                <Text strong>ภาคเรียน</Text>
                <Select
                  allowClear
                  placeholder="ทั้งหมด"
                  value={filters.semester}
                  options={[1, 2, 3].map((sem) => ({ value: sem, label: `ภาคเรียน ${sem}` }))}
                  onChange={(value) => setFilters((prev) => ({ ...prev, semester: value }))}
                />
              </Space>
            </Col>
            <Col xs={24} md={6}>
              <Space direction="vertical" size={4}>
                <Text strong>ค้นหา</Text>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="ค้นหาโครงงาน / รหัสนักศึกษา"
                  value={filters.search}
                  onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                />
              </Space>
            </Col>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Space wrap>
                <Button icon={<ReloadOutlined />} onClick={() => setReloadToken((prev) => prev + 1)}>
                  รีเฟรช
                </Button>
                {canExport && (
                  <Button
                    icon={<EyeOutlined />} 
                    onClick={() => setPreviewVisible(true)}
                  >
                    ดูตัวอย่างก่อนส่งออก
                  </Button>
                )}
                {canExport && (
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    loading={exporting}
                    onClick={handleExport}
                  >
                    ส่งออกข้อมูล
                  </Button>
                )}
                <Button
                  danger
                  onClick={() => setFilters({ status: 'advisor_approved', academicYear: undefined, semester: undefined, search: '' })}
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
            dataSource={items}
            columns={columns}
            expandable={{
              expandedRowKeys: expandedRowKey ? [expandedRowKey] : [],
              onExpand: (expanded, record) => setExpandedRowKey(expanded ? record.requestId : null),
              expandedRowRender
            }}
          />
        </Spin>
      </Space>
      <Modal
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        title="ตัวอย่างรายชื่อก่อนส่งออก"
        width={960}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            ปิด
          </Button>,
          canExport ? (
            <Button
              key="export"
              type="primary"
              icon={<DownloadOutlined />}
              loading={exporting}
              onClick={async () => {
                await handleExport();
              }}
            >
              ส่งออกข้อมูล
            </Button>
          ) : null
        ].filter(Boolean)}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="ตรวจสอบรายชื่อโครงงานทั้งหมดก่อนสร้างไฟล์"
            description="รายการนี้จะใช้ตัวกรองเดียวกับหน้าหลัก หากข้อมูลผิดพลาดโปรดกลับไปปรับตัวกรองหรือบันทึกหมายเหตุให้ครบถ้วนก่อนส่งออก"
          />
          <Table
            rowKey={(record) => record.requestId}
            dataSource={items}
            columns={previewColumns}
            pagination={false}
            scroll={{ y: 400 }}
          />
        </Space>
      </Modal>
    </div>
  );
};

export default StaffKP02Queue;
