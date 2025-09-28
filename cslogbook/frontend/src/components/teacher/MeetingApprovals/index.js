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
  Typography
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  TeamOutlined
} from '@ant-design/icons';
import dayjs from '../../../utils/dayjs';
import { DATE_TIME_FORMAT } from '../../../utils/constants';
import meetingService from '../../../services/meetingService';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const statusColors = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red'
};

const statusLabels = {
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ขอปรับปรุง'
};

const advisorRoleLabels = {
  advisor: 'ที่ปรึกษาหลัก',
  coAdvisor: 'ที่ปรึกษาร่วม'
};

const initialSummary = { pending: 0, approved: 0, rejected: 0, total: 0 };

const MeetingApprovals = () => {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(initialSummary);
  const [filters, setFilters] = useState({ status: 'pending', q: '' });
  const [loading, setLoading] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const statusOptions = useMemo(() => ([
    { value: 'pending', label: 'รออนุมัติ' },
    { value: 'approved', label: 'อนุมัติแล้ว' },
    { value: 'rejected', label: 'ขอปรับปรุง' },
    { value: 'all', label: 'ทั้งหมด' }
  ]), []);

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        setLoading(true);
        // เรียกข้อมูลจากฝั่ง backend ตามตัวกรองปัจจุบัน หากผู้ใช้เปลี่ยนตัวกรองระหว่างรอให้ยกเลิกการอัปเดต
        const response = await meetingService.listTeacherApprovals(filters);
        if (!response?.success) {
          message.error(response?.message || 'ไม่สามารถดึงคิวอนุมัติได้');
          return;
        }
        if (ignore) return;
        setItems(response.data?.items || []);
        setSummary(response.data?.summary || initialSummary);
      } catch (error) {
        if (!ignore) {
          message.error(error.message || 'เกิดข้อผิดพลาดในการดึงคิวอนุมัติ');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      ignore = true;
    };
  }, [filters, reloadToken]);

  const handleStatusChange = (value) => {
    setFilters((prev) => ({ ...prev, status: value }));
  };

  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, q: (value || '').trim() }));
  };

  const handleRefresh = () => {
    setReloadToken((prev) => prev + 1);
  };

  const formatDateTime = useCallback((value) => {
    if (!value) return '-';
    return dayjs(value).locale('th').format(DATE_TIME_FORMAT);
  }, []);

  const handleUpdateStatus = useCallback(async (record, status, extraPayload = {}) => {
    if (!record?.meeting?.projectId) {
      message.error('ไม่พบข้อมูลโครงงานของบันทึกนี้');
      return;
    }
    try {
      const loadingKey = `${record.logId}-${status}`;
      setActionLoadingKey(loadingKey);
      await meetingService.updateLogApproval(
        record.meeting.projectId,
        record.meeting.meetingId,
        record.logId,
        { status, ...extraPayload }
      );
      message.success('อัปเดตสถานะสำเร็จ');
      setReloadToken((prev) => prev + 1);
    } catch (error) {
      message.error(error.message || 'ไม่สามารถอัปเดตสถานะได้');
    } finally {
      setActionLoadingKey(null);
    }
  }, []);

  const confirmReject = useCallback((record) => {
    let noteValue = '';
    Modal.confirm({
      title: 'ยืนยันการขอปรับปรุงบันทึกการพบ',
      content: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">กรอกหมายเหตุถึงนักศึกษา (ถ้ามี)</Text>
          <TextArea
            rows={3}
            placeholder="หมายเหตุถึงนักศึกษา"
            onChange={(e) => {
              noteValue = e.target.value;
            }}
          />
        </Space>
      ),
      okText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      onOk: () => handleUpdateStatus(record, 'rejected', { approvalNote: noteValue?.trim() || undefined })
    });
  }, [handleUpdateStatus]);

  const columns = useMemo(() => ([
    {
      title: 'โครงงาน',
      dataIndex: ['project', 'projectNameTh'],
      key: 'project',
      render: (_value, record) => {
        const project = record.project;
        if (!project) return '-';
        const displayName = project.projectNameTh || project.projectNameEn || project.projectCode || `Project ${project.projectId}`;
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{displayName}</Text>
            <Space size={4} wrap>
              {project.projectCode && <Tag color="geekblue">{project.projectCode}</Tag>}
              {record.advisorRole && (
                <Tag color="purple">{advisorRoleLabels[record.advisorRole] || record.advisorRole}</Tag>
              )}
              {typeof record.pendingDurationDays === 'number' && record.pendingDurationDays >= 1 && (
                <Tag color="volcano">ค้าง {record.pendingDurationDays} วัน</Tag>
              )}
            </Space>
          </Space>
        );
      }
    },
    {
      title: 'นักศึกษา',
      dataIndex: 'students',
      key: 'students',
      render: (students) => {
        if (!students?.length) return '-';
        return (
          <Space direction="vertical" size={0}>
            {students.map((student) => (
              <Text key={student.studentId}>{student.studentCode || ''} {student.fullName || ''}</Text>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'หัวข้อล็อก',
      dataIndex: 'discussionTopic',
      key: 'discussionTopic',
      render: (value, record) => (
        <Space direction="vertical" size={4}>
          <Text strong>{value || '-'}</Text>
          {record.meeting?.meetingTitle && (
            <Text type="secondary">การประชุม: {record.meeting.meetingTitle}</Text>
          )}
        </Space>
      )
    },
    {
      title: 'วันที่ประชุม',
      dataIndex: ['meeting', 'meetingDate'],
      key: 'meetingDate',
      render: (value) => (
        <Space direction="vertical" size={0}>
          <Text>{formatDateTime(value)}</Text>
        </Space>
      )
    },
    {
      title: 'สถานะ',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 120,
      render: (value) => <Tag color={statusColors[value] || 'default'}>{statusLabels[value] || value}</Tag>
    },
    {
      title: 'ส่งเมื่อ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 200,
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text>{formatDateTime(value)}</Text>
          {record.recorder?.fullName && (
            <Text type="secondary">โดย {record.recorder.fullName}</Text>
          )}
        </Space>
      )
    },
    {
      title: 'การทำงาน',
      key: 'actions',
      width: 240,
      render: (_value, record) => (
        <Space wrap>
          <Button
            icon={<CheckCircleOutlined />}
            type="primary"
            ghost
            size="small"
            loading={actionLoadingKey === `${record.logId}-approved`}
            disabled={record.approvalStatus === 'approved'}
            onClick={() => handleUpdateStatus(record, 'approved')}
          >
            อนุมัติ
          </Button>
          <Button
            icon={<CloseCircleOutlined />}
            danger
            size="small"
            loading={actionLoadingKey === `${record.logId}-rejected`}
            disabled={record.approvalStatus === 'rejected'}
            onClick={() => confirmReject(record)}
          >
            ขอปรับปรุง
          </Button>
          <Button
            icon={<ClockCircleOutlined />}
            size="small"
            loading={actionLoadingKey === `${record.logId}-pending`}
            disabled={record.approvalStatus === 'pending'}
            onClick={() => handleUpdateStatus(record, 'pending')}
          >
            รีเซ็ตสถานะ
          </Button>
        </Space>
      )
    }
  ]), [actionLoadingKey, confirmReject, handleUpdateStatus, formatDateTime]);

  const expandedRowRender = (record) => (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Row gutter={[24, 12]}>
        <Col xs={24} md={12}>
          <Card size="small" title="รายละเอียดความคืบหน้า">
            <Text strong>สิ่งที่ดำเนินการ:</Text>
            <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{record.currentProgress || '-'}</div>
            <div style={{ marginTop: 12 }}>
              <Text strong>ปัญหา/อุปสรรค:</Text>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{record.problemsIssues || '-'}</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" title="งานถัดไปและหมายเหตุ">
            <Text strong>งานถัดไป:</Text>
            <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{record.nextActionItems || '-'}</div>
            {record.advisorComment && (
              <div style={{ marginTop: 12 }}>
                <Alert
                  type="info"
                  showIcon
                  message="หมายเหตุจากอาจารย์"
                  description={<div style={{ whiteSpace: 'pre-wrap' }}>{record.advisorComment}</div>}
                />
              </div>
            )}
            {record.approvalNote && (
              <div style={{ marginTop: 12 }}>
                <Alert
                  type="warning"
                  showIcon
                  message="หมายเหตุที่แจ้งไว้ก่อนหน้า"
                  description={<div style={{ whiteSpace: 'pre-wrap' }}>{record.approvalNote}</div>}
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>
      {record.attachments?.length ? (
        <Card size="small" title="ไฟล์แนบ">
          <Space direction="vertical">
            {record.attachments.map((attachment) => (
              <Space key={attachment.attachmentId}>
                <EyeOutlined />
                <Text>{attachment.fileName}</Text>
              </Space>
            ))}
          </Space>
        </Card>
      ) : null}
    </Space>
  );

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} disabled={loading}>
            รีเฟรช
          </Button>
          <Select
            value={filters.status}
            onChange={handleStatusChange}
            style={{ width: 180 }}
          >
            {statusOptions.map((option) => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
          <Input.Search
            placeholder="ค้นหาหัวข้อหรือคำสำคัญ"
            allowClear
            onSearch={handleSearch}
            style={{ width: 260 }}
          />
        </Space>
      </Space>

      <Alert
        type="info"
        showIcon
        message="คิวอนุมัติบันทึกการพบ"
        description="รายการนี้รวบรวมบันทึกการพบของนักศึกษาที่คุณเป็นอาจารย์ที่ปรึกษา สามารถอนุมัติหรือขอปรับปรุงได้จากหน้านี้โดยตรง"
      />

      <Card>
        <Space size={16} wrap>
          <Statistic title="รออนุมัติ" value={summary.pending ?? 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#d97706' }} />
          <Statistic title="อนุมัติแล้ว" value={summary.approved ?? 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#16a34a' }} />
          <Statistic title="ขอปรับปรุง" value={summary.rejected ?? 0} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#dc2626' }} />
          <Statistic title="ทั้งหมด" value={summary.total ?? 0} prefix={<TeamOutlined />} />
        </Space>
      </Card>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : items.length ? (
        <Table
          rowKey={(record) => record.logId}
          columns={columns}
          dataSource={items}
          expandable={{ expandedRowRender }}
          pagination={{ pageSize: 10, showTotal: (total) => `ทั้งหมด ${total} รายการ` }}
        />
      ) : (
        <Empty description="ยังไม่มีบันทึกที่รออนุมัติ" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Space>
  );
};

export default MeetingApprovals;
