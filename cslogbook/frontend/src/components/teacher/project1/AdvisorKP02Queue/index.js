import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Select,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  TeamOutlined
} from '@ant-design/icons';
import dayjs from '../../../../utils/dayjs';
import { DATE_TIME_FORMAT } from '../../../../utils/constants';
import projectService from '../../../../services/projectService';

const { Title, Text } = Typography;
const { Search } = Input;

const DEFENSE_TYPE_PROJECT1 = 'PROJECT1';
const DEFENSE_TYPE_THESIS = 'THESIS';

const DEFENSE_UI_META = {
  [DEFENSE_TYPE_PROJECT1]: {
    title: 'คำขอสอบโครงงานพิเศษ 1 (คพ.02)',
    description: 'ระบบจะแสดงเฉพาะคำขอที่เกี่ยวข้องกับคุณในฐานะอาจารย์ที่ปรึกษา / ที่ปรึกษาร่วม'
  },
  [DEFENSE_TYPE_THESIS]: {
    title: 'คำขอสอบปริญญานิพนธ์ (คพ.03)',
    description: 'รายชื่อคำขอสอบปริญญานิพนธ์จากทีมที่คุณเป็นอาจารย์ที่ปรึกษา ตรวจสอบตารางและเอกสารก่อนอนุมัติ'
  }
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'รอการอนุมัติ' },
  { value: 'approved', label: 'อนุมัติแล้ว' },
  { value: 'rejected', label: 'ปฏิเสธ' },
  { value: 'all', label: 'ทั้งหมด' }
];

const STATUS_MAP = {
  advisor_in_review: { color: 'orange', text: 'รออาจารย์อนุมัติครบ' },
  advisor_approved: { color: 'green', text: 'อาจารย์อนุมัติครบ (รอตรวจสอบ)' },
  staff_verified: { color: 'blue', text: 'เจ้าหน้าที่ตรวจสอบแล้ว (รอประกาศในปฏิทิน)' },
  scheduled: { color: 'cyan', text: 'นัดสอบแล้ว (ข้อมูลเดิม)' },
  completed: { color: 'purple', text: 'บันทึกผลสอบแล้ว' }
};

const APPROVAL_STATUS_MAP = {
  pending: { color: 'gold', text: 'รอดำเนินการ' },
  approved: { color: 'green', text: 'คุณอนุมัติแล้ว' },
  rejected: { color: 'red', text: 'คุณปฏิเสธคำขอ' }
};

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const AdvisorKP02Queue = ({ defenseType = DEFENSE_TYPE_PROJECT1 }) => {
  const uiMeta = DEFENSE_UI_META[defenseType] || DEFENSE_UI_META[DEFENSE_TYPE_PROJECT1];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: 'pending', search: '' });
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [expandedRowKey, setExpandedRowKey] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) {
        if (filters.status === 'all') {
          // ส่งสถานะครบชุดเพื่อให้ API ดึงทั้งรายการที่รอพิจารณา อนุมัติแล้ว และคำขอที่ปิดงานไปแล้ว
          params.status = ['pending', 'approved', 'rejected', 'completed'];
        } else {
          params.status = filters.status;
        }
      }
      const response = await projectService.listProject1AdvisorQueue({ ...params, defenseType });
      if (!response?.success) {
        message.error(response?.message || 'ไม่สามารถดึงคิวคำขอสอบได้');
        return;
      }
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      message.error(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [filters.status, defenseType]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue, reloadToken]);

  const handleSearch = useCallback((value) => {
    setFilters((prev) => ({ ...prev, search: value.trim() }));
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = (filters.search || '').toLowerCase();
    return items.filter((item) => {
      const approvalStatus = (item.myApproval?.status || 'pending').toLowerCase();
      const matchesStatus = filters.status === 'all' || approvalStatus === filters.status;
      if (!matchesStatus) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      // ค้นหาจากทั้งชื่อโครงงานและรายชื่อสมาชิก เพื่อให้ที่ปรึกษาเจอทีมที่ต้องการได้ง่าย
      const project = item.project || {};
      const projectValues = [project.projectCode, project.projectNameTh, project.projectNameEn]
        .filter(Boolean)
        .map((text) => text.toLowerCase());
      if (projectValues.some((text) => text.includes(keyword))) {
        return true;
      }
      const members = project.members || [];
      return members.some((member) => {
        return (
          (member.studentCode && member.studentCode.toLowerCase().includes(keyword)) ||
          (member.name && member.name.toLowerCase().includes(keyword))
        );
      });
    });
  }, [items, filters.search, filters.status]);

  const summary = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        const status = item.myApproval?.status || 'pending';
        const requestStatus = item.status;
        acc.total += 1;
        if (status === 'pending') acc.pending += 1;
        if (status === 'approved') acc.approved += 1;
        if (status === 'rejected') acc.rejected += 1;
        if (requestStatus === 'staff_verified') acc.staffVerified += 1;
        if (requestStatus === 'scheduled') acc.legacyScheduled += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0, total: 0, staffVerified: 0, legacyScheduled: 0 }
    );
  }, [filteredItems]);

  const formatDateTime = useCallback((value) => {
    if (!value) return '-';
    return dayjs(value).locale('th').format(DATE_TIME_FORMAT);
  }, []);

  const handleApprove = useCallback(async (record) => {
    if (!record?.project?.projectId) {
      message.error('ไม่พบข้อมูลโครงงาน');
      return;
    }
    const loadingKey = `${record.requestId}-approve`;
    setActionLoadingKey(loadingKey);
    try {
      await projectService.submitProject1AdvisorDecision(
        record.project.projectId,
        { decision: 'approved' },
        { defenseType }
      );
      message.success('บันทึกการอนุมัติสำเร็จ');
      setReloadToken((prev) => prev + 1);
    } catch (error) {
      message.error(error.message || 'ไม่สามารถบันทึกการอนุมัติได้');
    } finally {
      setActionLoadingKey(null);
    }
  }, [defenseType]);

  const handleReject = useCallback((record) => {
    if (!record?.project?.projectId) {
      message.error('ไม่พบข้อมูลโครงงาน');
      return;
    }

    let noteValue = '';
    Modal.confirm({
      title: 'ยืนยันการปฏิเสธคำขอ',
      content: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>กรุณาระบุเหตุผล (อย่างน้อย 5 ตัวอักษร)</Text>
          <Input.TextArea
            rows={4}
            onChange={(event) => {
              noteValue = event.target.value;
            }}
            placeholder="หมายเหตุถึงนักศึกษา"
          />
        </Space>
      ),
      okText: 'ปฏิเสธ',
      okButtonProps: { danger: true },
      cancelText: 'ยกเลิก',
      async onOk() {
        // บังคับให้มีคำอธิบายเพื่อให้นักศึกษาทราบสิ่งที่ต้องปรับปรุง
        const note = (noteValue || '').trim();
        if (note.length < 5) {
          message.warning('กรุณาระบุหมายเหตุอย่างน้อย 5 ตัวอักษร');
          return Promise.reject();
        }
        const loadingKey = `${record.requestId}-reject`;
        setActionLoadingKey(loadingKey);
        try {
          await projectService.submitProject1AdvisorDecision(
            record.project.projectId,
            {
              decision: 'rejected',
              note
            },
            { defenseType }
          );
          message.success('บันทึกการปฏิเสธแล้ว');
          setReloadToken((prev) => prev + 1);
        } catch (error) {
          message.error(error.message || 'ไม่สามารถบันทึกการปฏิเสธได้');
          return Promise.reject(error);
        } finally {
          setActionLoadingKey(null);
        }
        return Promise.resolve();
      }
    });
  }, [defenseType]);

  const columns = useMemo(() => [
    {
      title: 'โครงงาน',
      dataIndex: 'project',
      key: 'project',
      render: (project) => {
        if (!project) return '-';
        const members = project.members || [];
        return (
          <Space direction="vertical" size={4}>
            <Space size={6} wrap>
              <Text strong>{project.projectNameTh || project.projectNameEn || 'ไม่ระบุชื่อโครงงาน'}</Text>
              {project.projectCode && <Tag color="geekblue">{project.projectCode}</Tag>}
            </Space>
            {members.length > 0 && (
              <Space size={4} wrap>
                <TeamOutlined style={{ color: '#999' }} />
                <Text type="secondary">
                  {members.map((member) => `${member.studentCode || ''} ${member.name || ''}`.trim()).join(' | ')}
                </Text>
              </Space>
            )}
          </Space>
        );
      }
    },
    {
      title: 'สถานะคำขอ',
      dataIndex: 'status',
      key: 'status',
      render: (value, record) => {
        const requestMeta = STATUS_MAP[value] || {};
        const approvalMeta = APPROVAL_STATUS_MAP[record.myApproval?.status] || APPROVAL_STATUS_MAP.pending;
        return (
          <Space direction="vertical" size={4}>
            <Tag color={requestMeta.color || 'default'}>{requestMeta.text || value || '-'}</Tag>
            <Tag color={approvalMeta.color}>{approvalMeta.text}</Tag>
          </Space>
        );
      }
    },
    {
      title: 'เวลาส่งคำขอ',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (value) => (
        <Space direction="vertical" size={2}>
          <Text>{formatDateTime(value)}</Text>
        </Space>
      )
    },
    {
      title: 'การดำเนินการ',
      key: 'actions',
      width: 220,
      render: (_value, record) => {
        const myStatus = record.myApproval?.status;
        return (
          <Space>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(record)}
              loading={actionLoadingKey === `${record.requestId}-approve`}
              disabled={myStatus === 'approved'}
            >
              อนุมัติ
            </Button>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleReject(record)}
              loading={actionLoadingKey === `${record.requestId}-reject`}
              disabled={myStatus === 'rejected'}
            >
              ปฏิเสธ
            </Button>
          </Space>
        );
      }
    }
  ], [actionLoadingKey, formatDateTime, handleApprove, handleReject]);

  const expandedRowRender = useCallback((record) => {
  const approvals = record.advisorApprovals || [];
    const metrics = record.meetingMetrics;
    return (
      <Row gutter={[24, 16]}>
        <Col xs={24} md={14}>
          <Card size="small" title="รายละเอียดคำขอ">
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Text>ส่งคำขอเมื่อ: {formatDateTime(record.submittedAt)}</Text>
              <Text>อนุมัติครบเมื่อ: {formatDateTime(record.advisorApprovedAt)}</Text>
              <Text>เจ้าหน้าที่ตรวจสอบเมื่อ: {formatDateTime(record.staffVerifiedAt)}</Text>
              {record.staffVerifiedBy?.fullName && (
                <Text>ผู้ตรวจสอบ: {record.staffVerifiedBy.fullName}</Text>
              )}
              <Space size={4} wrap>
                <Text>
                  นัดสอบ: {record.defenseScheduledAt ? formatDateTime(record.defenseScheduledAt) : 'ติดตามประกาศผ่านปฏิทินภาควิชา'}
                  {record.defenseLocation ? ` @ ${record.defenseLocation}` : ''}
                </Text>
                {record.defenseScheduledAt && <Tag color="default">ข้อมูลจากระบบเดิม</Tag>}
              </Space>
              {record.staffVerificationNote && <Alert type="info" message={`หมายเหตุเจ้าหน้าที่: ${record.staffVerificationNote}`} showIcon />}
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card size="small" title="สถานะอาจารย์ที่เกี่ยวข้อง">
            <Space direction="vertical" style={{ width: '100%' }}>
              {approvals.length === 0 && <Empty description="ยังไม่มีข้อมูลอาจารย์" />}
              {approvals.map((approval) => {
                const meta = APPROVAL_STATUS_MAP[approval.status] || APPROVAL_STATUS_MAP.pending;
                const teacherName = approval.teacher?.name || '-' ;
                return (
                  <Card key={approval.approvalId || `${approval.teacherId}-${approval.status}`} size="small" bordered={false}>
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Space wrap>
                        <Tag color={meta.color}>{meta.text}</Tag>
                        <Text strong>{teacherName}</Text>
                        {approval.teacherRole && <Tag color="purple">{approval.teacherRole === 'advisor' ? 'ที่ปรึกษา' : 'ที่ปรึกษาร่วม'}</Tag>}
                      </Space>
                      <Text type="secondary">อัปเดตล่าสุด: {formatDateTime(approval.approvedAt)}</Text>
                      {approval.note && <Text type="secondary">หมายเหตุ: {approval.note}</Text>}
                    </Space>
                  </Card>
                );
              })}
            </Space>
          </Card>
        </Col>
        {metrics && (
          <Col span={24}>
            <Card size="small" title="สรุปบันทึกการพบ">
              <Space size={12} wrap>
                <Statistic title="จำนวนบันทึกทั้งหมด" value={metrics.totalMeetings || 0} prefix={<EyeOutlined />} />
                <Statistic title="บันทึกที่อนุมัติ" value={metrics.totalApprovedLogs || 0} prefix={<CheckCircleOutlined />} />
                <Statistic title="เกณฑ์ขั้นต่ำ" value={metrics.requiredApprovedLogs || 0} />
                <Statistic title="อนุมัติครั้งล่าสุด" value={formatDateTime(metrics.lastApprovedLogAt)} />
              </Space>
            </Card>
          </Col>
        )}
      </Row>
    );
  }, [formatDateTime]);

  return (
    <div style={containerStyle}>
      <Space direction="vertical" style={{ width: '100%' }} size={24}>
        <Space direction="vertical" size={8}>
          <Title level={3}>{uiMeta.title}</Title>
          <Text type="secondary">{uiMeta.description}</Text>
        </Space>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="รออนุมัติ" value={summary.pending} suffix={`รายการ`} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="อนุมัติแล้ว" value={summary.approved} suffix={`รายการ`} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="ปฏิเสธ" value={summary.rejected} suffix={`รายการ`} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="ทั้งหมด" value={summary.total} suffix={`รายการ`} />
            </Card>
          </Col>
        </Row>

        <Card size="small" bodyStyle={{ padding: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <Space>
                <Text strong>สถานะของคุณ:</Text>
                <Select
                  value={filters.status}
                  onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                  options={STATUS_OPTIONS}
                  style={{ minWidth: 200 }}
                />
                <Button icon={<ReloadOutlined />} onClick={() => setReloadToken((prev) => prev + 1)}>
                  รีเฟรช
                </Button>
              </Space>
            </Col>
            <Col xs={24} md={12} style={{ textAlign: 'right' }}>
              <Search
                allowClear
                placeholder="ค้นหาโครงงาน / รหัสนักศึกษา"
                onSearch={handleSearch}
                style={{ maxWidth: 320 }}
              />
            </Col>
          </Row>
        </Card>

        <Spin spinning={loading} tip="กำลังโหลดข้อมูล">
          <Table
            rowKey={(record) => record.requestId}
            dataSource={filteredItems}
            columns={columns}
            locale={{ emptyText: <Empty description="ไม่พบคำขอในช่วงนี้" /> }}
            expandable={{
              expandedRowKeys: expandedRowKey ? [expandedRowKey] : [],
              onExpand: (expanded, record) => {
                setExpandedRowKey(expanded ? record.requestId : null);
              },
              expandedRowRender
            }}
          />
        </Spin>
      </Space>
    </div>
  );
};

export default AdvisorKP02Queue;
