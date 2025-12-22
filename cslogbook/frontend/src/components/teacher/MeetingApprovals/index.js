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

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

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

const initialSummary = { pending: 0, approved: 0, rejected: 0, total: 0 };

const MeetingApprovals = () => {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(initialSummary);
  const [filters, setFilters] = useState({ status: 'pending', q: '', academicYear: null, semester: null, projectId: null });
  const [loading, setLoading] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [meta, setMeta] = useState({
    availableAcademicYears: [],
    availableSemestersByYear: {},
    defaultAcademicYear: null,
    defaultSemester: null,
    projectsByAcademicYear: {}
  });

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
        setMeta({
          availableAcademicYears: response.data?.meta?.availableAcademicYears || [],
          availableSemestersByYear: response.data?.meta?.availableSemestersByYear || {},
          defaultAcademicYear: response.data?.meta?.defaultAcademicYear ?? null,
          defaultSemester: response.data?.meta?.defaultSemester ?? null,
          projectsByAcademicYear: response.data?.meta?.projectsByAcademicYear || {}
        });
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

  useEffect(() => {
    if (filters.academicYear == null && meta.defaultAcademicYear != null) {
      setFilters((prev) => ({ ...prev, academicYear: meta.defaultAcademicYear }));
    }
  }, [filters.academicYear, meta.defaultAcademicYear]);

  useEffect(() => {
    if (filters.academicYear == null) {
      if (filters.semester != null) {
        setFilters((prev) => ({ ...prev, semester: null }));
      }
      if (filters.projectId != null) {
        setFilters((prev) => ({ ...prev, projectId: null }));
      }
      return;
    }

    const availableSemesters = meta.availableSemestersByYear?.[filters.academicYear] || [];
    const projectList = meta.projectsByAcademicYear?.[filters.academicYear] || [];

    if (!availableSemesters.length && filters.semester != null) {
      setFilters((prev) => ({ ...prev, semester: null }));
    }

    if (!projectList.length && filters.projectId != null) {
      setFilters((prev) => ({ ...prev, projectId: null }));
    }

    if (filters.semester != null && !availableSemesters.includes(filters.semester)) {
      setFilters((prev) => ({ ...prev, semester: availableSemesters[0] ?? null }));
      return;
    }

    if (filters.semester == null && meta.defaultSemester != null && availableSemesters.includes(meta.defaultSemester)) {
      setFilters((prev) => ({ ...prev, semester: meta.defaultSemester }));
    }

    if (filters.projectId != null && !projectList.some((proj) => proj.projectId === filters.projectId && (!filters.semester || proj.semester == null || proj.semester === filters.semester))) {
      const fallbackProject = projectList.find((proj) => !filters.semester || proj.semester == null || proj.semester === filters.semester);
      setFilters((prev) => ({ ...prev, projectId: fallbackProject?.projectId ?? null }));
    }
  }, [filters.academicYear, filters.semester, filters.projectId, meta.availableSemestersByYear, meta.defaultSemester, meta.projectsByAcademicYear]);

  const handleStatusChange = (value) => {
    setFilters((prev) => ({ ...prev, status: value }));
  };

  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, q: (value || '').trim() }));
  };

  const academicYearOptions = useMemo(() => {
    const years = meta.availableAcademicYears || [];
    return years.map((year) => ({ value: year, label: `${year}` }));
  }, [meta.availableAcademicYears]);

  const semesterOptions = useMemo(() => {
    if (!filters.academicYear) return [];
    const mapping = meta.availableSemestersByYear || {};
    const semesters = mapping[filters.academicYear] || [];
    return semesters.map((sem) => ({ value: sem, label: `ภาคเรียนที่ ${sem}` }));
  }, [filters.academicYear, meta.availableSemestersByYear]);

  const projectOptions = useMemo(() => {
    if (!filters.academicYear) return [];
    const projects = meta.projectsByAcademicYear?.[filters.academicYear] || [];

    return projects
      .filter((proj) => !filters.semester || proj.semester == null || proj.semester === filters.semester)
      .map((proj) => {
        // ใช้ชื่อโครงงานภาษาไทยเป็นหลัก หากไม่มีก็ fallback เป็นภาษาอังกฤษหรือรหัส
        const displayName = proj.titleTh || proj.titleEn || proj.projectNameTh || proj.projectNameEn || proj.projectCode || `Project ${proj.projectId}`;
        const label = proj.projectCode
          ? `${displayName}${displayName.includes(proj.projectCode) ? '' : ` (${proj.projectCode})`}`
          : displayName;
        return { value: proj.projectId, label };
      });
  }, [filters.academicYear, filters.semester, meta.projectsByAcademicYear]);

  const handleAcademicYearChange = (value) => {
    setFilters((prev) => ({ ...prev, academicYear: value ?? null, semester: null, projectId: null }));
  };

  const handleSemesterChange = (value) => {
    setFilters((prev) => ({ ...prev, semester: value ?? null }));
  };

  const handleProjectChange = (value) => {
    setFilters((prev) => ({ ...prev, projectId: value ?? null }));
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
            disabled={['rejected','approved'].includes(record.approvalStatus)}
            onClick={() => confirmReject(record)}
          >
            ขอปรับปรุง
          </Button>{/* 
          <Button
            icon={<ClockCircleOutlined />}
            size="small"
            loading={actionLoadingKey === `${record.logId}-pending`}
            disabled={record.approvalStatus === 'pending'}
            onClick={() => handleUpdateStatus(record, 'pending')}
          >
            รีเซ็ตสถานะ
          </Button> */}
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
    <div style={containerStyle}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} disabled={loading}>
              รีเฟรช
            </Button>
            <Select
              placeholder="เลือกปีการศึกษา"
              allowClear
              style={{ width: 160 }}
              value={filters.academicYear}
              options={academicYearOptions}
              onChange={handleAcademicYearChange}
            />
            <Select
              placeholder="เลือกภาคเรียน"
              allowClear
              disabled={!filters.academicYear || !semesterOptions.length}
              style={{ width: 150 }}
              value={filters.semester}
              options={semesterOptions}
              onChange={handleSemesterChange}
            />
            <Select
              placeholder="เลือกโครงงาน"
              allowClear
              disabled={!filters.academicYear || !projectOptions.length}
              style={{ width: 260 }}
              value={filters.projectId}
              options={projectOptions}
              onChange={handleProjectChange}
              optionFilterProp="label"
              showSearch
            />
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
    </div>
  );
};

export default MeetingApprovals;
