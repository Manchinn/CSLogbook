import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  message,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  Empty
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'utils/dayjs';
import { DATE_TIME_FORMAT } from 'utils/constants';
import projectExamResultService from 'features/project/services/projectExamResultService';
import RecordExamResultModal from './RecordExamResultModal';
import { useAuth } from 'contexts/AuthContext';
import { getProjectAcademicYears } from 'features/reports/services/reportService';
import styles from './Project1ExamResultPage.module.css';

const { Text, Title } = Typography;

const STATUS_OPTIONS = [
  { value: 'pending', label: 'รอบันทึกผล' },
  { value: 'passed', label: 'ผ่านแล้ว' },
  { value: 'failed', label: 'ไม่ผ่านแล้ว' },
  { value: 'all', label: 'ทั้งหมด' }
];

const STATUS_MAP = {
  pending: { color: 'blue', text: 'รอบันทึกผล' },
  passed: { color: 'green', text: 'ผ่าน' },
  failed: { color: 'red', text: 'ไม่ผ่าน' }
};

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

/**
 * หน้าบันทึกผลสอบโครงงานพิเศษ 1
 * สำหรับเจ้าหน้าที่ภาควิชา
 */
const Project1ExamResultPage = () => {
  const { userData } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: 'pending',
    academicYear: undefined,
    semester: undefined,
    search: ''
  });
  const [actionLoadingKey] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [expandedRowKey, setExpandedRowKey] = useState(null);
  const [academicYearOptions, setAcademicYearOptions] = useState([]);
  const [academicYearLoading, setAcademicYearLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const isStaff = useMemo(() => {
    if (!userData) return false;
    if (userData.role === 'admin') return true;
    return userData.role === 'teacher' && userData.teacherType === 'support';
  }, [userData]);

  /**
   * ดึงรายการโครงงานที่พร้อมบันทึกผล
   */
  const fetchPendingProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        status: filters.status
      };
      if (filters.academicYear) {
        params.academicYear = filters.academicYear;
      }
      if (filters.semester) {
        params.semester = filters.semester;
      }
      if (filters.search) {
        params.search = filters.search;
      }
      // เพิ่ม pagination params
      params.limit = pagination.pageSize;
      params.offset = (pagination.current - 1) * pagination.pageSize;

      const response = await projectExamResultService.getProject1PendingResults(params);
      const projectList = response.data || [];

      setProjects(projectList);
      // อัปเดต total สำหรับ pagination
      if (response.total !== undefined) {
        setPagination(prev => ({ ...prev, total: response.total }));
      } else {
        // Fallback ถ้าไม่มี total จาก backend
        setPagination(prev => ({ ...prev, total: response.data?.length || 0 }));
      }
    } catch (error) {
      message.error('ไม่สามารถโหลดข้อมูลโครงงานได้');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.current, pagination.pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // ดึงปีการศึกษาจาก API
  useEffect(() => {
    const fetchAcademicYears = async () => {
      setAcademicYearLoading(true);
      try {
        const years = await getProjectAcademicYears();
        const options = Array.isArray(years)
          ? years
              .filter(Boolean)
              .sort((a, b) => b - a) // เรียงจากมากไปน้อย
              .map((year) => ({ label: `${year}`, value: year }))
          : [];
        setAcademicYearOptions(options);
      } catch (error) {
        console.error('Error fetching academic years:', error);
        message.error('ไม่สามารถดึงปีการศึกษาได้');
        setAcademicYearOptions([]);
      } finally {
        setAcademicYearLoading(false);
      }
    };

    fetchAcademicYears();
  }, []);

  useEffect(() => {
    fetchPendingProjects();
  }, [fetchPendingProjects, reloadToken]);

  const formatDateTime = useCallback((value) => {
    if (!value) return '-';
    return dayjs(value).locale('th').format(DATE_TIME_FORMAT);
  }, []);

  /**
   * เปิด Modal บันทึกผล
   */
  const handleRecordResult = useCallback((project) => {
    if (!isStaff) {
      message.warning('เฉพาะเจ้าหน้าที่ที่ได้รับสิทธิ์เท่านั้นที่สามารถบันทึกผลสอบได้');
      return;
    }
    setSelectedProject(project);
    setModalVisible(true);
  }, [isStaff]);

  /**
   * ปิด Modal
   */
  const handleModalClose = useCallback(() => {
    setSelectedProject(null);
    setModalVisible(false);
  }, []);

  /**
   * หลังบันทึกผลสำเร็จ
   */
  const handleRecordSuccess = useCallback(() => {
    message.success('บันทึกผลสอบสำเร็จ');
    handleModalClose();
    setReloadToken((prev) => prev + 1);
  }, [handleModalClose]);

  /**
   * คำนวณสถิติ
   */
  const summary = useMemo(() => {
    return projects.reduce(
      (acc, project) => {
        const hasResult = project.examResults && project.examResults.length > 0;
        acc.total += 1;
        if (!hasResult) {
          acc.pending += 1;
        } else {
          const result = project.examResults[0].result;
          if (result === 'PASS') acc.passed += 1;
          if (result === 'FAIL') acc.failed += 1;
        }
        return acc;
      },
      { pending: 0, passed: 0, failed: 0, total: 0 }
    );
  }, [projects]);

  /**
   * Base Columns สำหรับตาราง
   */
  const baseColumns = useMemo(() => [
    {
      title: 'โครงงาน',
      dataIndex: 'projectNameTh',
      key: 'project',
      render: (_, project) => {
        return (
          <Space direction="vertical" size={4}>
            <Space size={6} wrap>
              <Text strong>{project.projectNameTh || project.projectNameEn || 'ไม่ระบุชื่อโครงงาน'}</Text>
              {project.projectId && <Tag color="geekblue">#{project.projectId}</Tag>}
            </Space>
            <Text type="secondary">
              ปีการศึกษา {project.academicYear || '-'} / ภาคเรียน {project.semester || '-'}
            </Text>
          </Space>
        );
      }
    },
    {
      title: 'สมาชิก',
      dataIndex: 'members',
      key: 'members',
      render: (members) => {
        if (!Array.isArray(members) || members.length === 0) return '-';
        return (
          <Space direction="vertical" size={2}>
            {members.map((member) => (
              <div key={member.studentId}>
                <UserOutlined style={{ marginRight: 4 }} />
                <Text>
                  {member.student?.user?.firstName} {member.student?.user?.lastName}
                </Text>
                {member.role === 'LEADER' && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    หัวหน้า
                  </Tag>
                )}
              </div>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'อาจารย์ที่ปรึกษา',
      dataIndex: 'advisor',
      key: 'advisor',
      render: (advisor) => (
        <Text>
          {advisor?.user
            ? `${advisor.user.firstName} ${advisor.user.lastName}`
            : 'ไม่ระบุ'}
        </Text>
      )
    },
    {
      title: 'สถานะ',
      key: 'status',
      render: (_, record) => {
        const hasResult = record.examResults && record.examResults.length > 0;
        if (!hasResult) {
          const statusMeta = STATUS_MAP.pending;
          return <Tag color={statusMeta.color}>{statusMeta.text}</Tag>;
        }
        const result = record.examResults[0].result;
        const statusKey = result === 'PASS' ? 'passed' : 'failed';
        const statusMeta = STATUS_MAP[statusKey];
        return <Tag color={statusMeta.color}>{statusMeta.text}</Tag>;
      }
    },
    {
      title: 'วันที่ยืนยันสิทธิ์ / บันทึกผล',
      key: 'timestamps',
      render: (_, record) => {
        const hasResult = record.examResults && record.examResults.length > 0;
        return (
          <Space direction="vertical" size={2}>
            <Text>ยืนยันสิทธิ์: {formatDateTime(record.staffVerifiedAt)}</Text>
            {hasResult && (
              <Text>บันทึกผล: {formatDateTime(record.examResults[0].recordedAt)}</Text>
            )}
          </Space>
        );
      }
    }
  ], [formatDateTime]);

  /**
   * Columns พร้อมปุ่ม Actions
   */
  const columns = useMemo(() => {
    const list = [...baseColumns];
    if (isStaff) {
      list.push({
        title: 'การดำเนินการ',
        key: 'actions',
        width: 180,
        render: (_, record) => {
          const hasResult = record.examResults && record.examResults.length > 0;
          return (
            <Space>
              <Tooltip title={hasResult ? 'บันทึกผลแล้ว' : 'บันทึกผลสอบ'}>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleRecordResult(record)}
                  disabled={hasResult}
                  loading={actionLoadingKey === `${record.projectId}-record`}
                >
                  {hasResult ? 'บันทึกแล้ว' : 'บันทึกผลสอบ'}
                </Button>
              </Tooltip>
            </Space>
          );
        }
      });
    }
    return list;
  }, [actionLoadingKey, baseColumns, handleRecordResult, isStaff]);

  /**
   * Expandable Row Render
   */
  const expandedRowRender = useCallback((record) => {
    const hasResult = record.examResults && record.examResults.length > 0;
    const examResult = hasResult ? record.examResults[0] : null;

    return (
      <Row gutter={[24, 16]}>
        <Col xs={24} md={12}>
          <Card size="small" title="รายละเอียดโครงงาน">
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Text>ชื่อภาษาอังกฤษ: {record.projectNameEn || '-'}</Text>
              <Text>
                อาจารย์ร่วม:{' '}
                {record.coAdvisor?.user
                  ? `${record.coAdvisor.user.firstName} ${record.coAdvisor.user.lastName}`
                  : '-'}
              </Text>
              <Text>ประเภทโครงงาน: {record.projectType || '-'}</Text>
              <Text>สร้างเมื่อ: {formatDateTime(record.createdAt)}</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" title="ผลการสอบ">
            {hasResult ? (
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Text>
                  ผลสอบ:{' '}
                  {examResult.result === 'PASS' ? (
                    <Tag color="green" icon={<CheckCircleOutlined />}>
                      ผ่าน
                    </Tag>
                  ) : (
                    <Tag color="red" icon={<CloseCircleOutlined />}>
                      ไม่ผ่าน
                    </Tag>
                  )}
                </Text>
                {examResult.score && <Text>คะแนน: {examResult.score}</Text>}
                {examResult.notes && <Text>หมายเหตุ: {examResult.notes}</Text>}
                {examResult.result === 'PASS' && (
                  <Text>
                    ต้องแก้ Scope: {examResult.requireScopeRevision ? 'ใช่' : 'ไม่'}
                  </Text>
                )}
                <Text>
                  ผู้บันทึก:{' '}
                  {examResult.recordedBy
                    ? `${examResult.recordedBy.firstName} ${examResult.recordedBy.lastName}`
                    : '-'}
                </Text>
                <Text>บันทึกเมื่อ: {formatDateTime(examResult.recordedAt)}</Text>
                {examResult.result === 'FAIL' && (
                  <Text>
                    สถานะ:{' '}
                    {examResult.studentAcknowledgedAt
                      ? `รับทราบแล้ว (${formatDateTime(examResult.studentAcknowledgedAt)})`
                      : 'รอนักศึกษารับทราบ'}
                  </Text>
                )}
              </Space>
            ) : (
              <Alert type="info" message="ยังไม่มีผลสอบ" showIcon />
            )}
          </Card>
        </Col>
      </Row>
    );
  }, [formatDateTime]);

  return (
    <div style={containerStyle}>
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {/* Header */}
        <Space direction="vertical" size={8}>
          <Title level={3}>บันทึกผลสอบโครงงานพิเศษ 1</Title>
          <Text type="secondary">
            เจ้าหน้าที่สามารถบันทึกผลการสอบโครงงานพิเศษ 1 (ผ่าน/ไม่ผ่าน) พร้อมระบุหมายเหตุและเงื่อนไขการแก้ไข Scope
          </Text>
        </Space>

        {/* Summary Statistics - Chips */}
        <div className={styles.statisticsChips}>
          <div className={styles.statisticItem}>
            <FileTextOutlined />
            <Text>ทั้งหมด: {summary.total} รายการ</Text>
          </div>
          {summary.pending > 0 && (
            <div className={styles.statisticItem}>
              <ClockCircleOutlined />
              <Text>รอบันทึกผล: {summary.pending} รายการ</Text>
            </div>
          )}
          {summary.passed > 0 && (
            <div className={styles.statisticItem}>
              <CheckCircleOutlined />
              <Text>ผ่าน: {summary.passed} รายการ</Text>
            </div>
          )}
          {summary.failed > 0 && (
            <div className={styles.statisticItem}>
              <CloseCircleOutlined />
              <Text>ไม่ผ่าน: {summary.failed} รายการ</Text>
            </div>
          )}
        </div>

        {/* Filter Panel */}
        <Card size="small" styles={{ body: { padding: 16 } }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={6}>
              <Space direction="vertical" size={4}>
                <Text strong>สถานะ</Text>
                <Select
                  style={{ minWidth: 220 }}
                  value={filters.status}
                  options={STATUS_OPTIONS}
                  onChange={(value) => {
                    setFilters((prev) => ({ ...prev, status: value }));
                    setPagination(prev => ({ ...prev, current: 1 })); // Reset pagination
                  }}
                />
              </Space>
            </Col>
            <Col xs={24} md={6}>
              <Space direction="vertical" size={4}>
                <Text strong>ปีการศึกษา</Text>
                <Select
                  style={{ minWidth: 220 }}
                  allowClear
                  placeholder="ทั้งหมด"
                  value={filters.academicYear}
                  options={[{ label: "ทุกปีการศึกษา", value: "all" }, ...academicYearOptions]}
                  onChange={(value) => {
                    const yearValue = value === "all" ? undefined : value;
                    setFilters((prev) => ({ ...prev, academicYear: yearValue }));
                    setPagination(prev => ({ ...prev, current: 1 })); // Reset pagination
                  }}
                  loading={academicYearLoading}
                />
              </Space>
            </Col>
            <Col xs={24} md={6}>
              <Space direction="vertical" size={4}>
                <Text strong>ภาคเรียน</Text>
                <Select
                  style={{ minWidth: 220 }}
                  allowClear
                  placeholder="ทั้งหมด"
                  value={filters.semester}
                  options={[1, 2, 3].map((sem) => ({ value: sem, label: `ภาคเรียน ${sem}` }))}
                  onChange={(value) => {
                    setFilters((prev) => ({ ...prev, semester: value }));
                    setPagination(prev => ({ ...prev, current: 1 })); // Reset pagination
                  }}
                />
              </Space>
            </Col>
            <Col xs={24} md={6}>
              <Space direction="vertical" size={4}>
                <Text strong>ค้นหา</Text>
                <Input
                  style={{ minWidth: 220 }}
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="ค้นหาโครงงาน / รหัสนักศึกษา"
                  value={filters.search}
                  onChange={(event) => {
                    setFilters((prev) => ({ ...prev, search: event.target.value }));
                    setPagination(prev => ({ ...prev, current: 1 })); // Reset pagination
                  }}
                />
              </Space>
            </Col>
            <Col xs={24} style={{ textAlign: "right" }}>
              <Space wrap>
                <Button icon={<ReloadOutlined />} onClick={() => setReloadToken((prev) => prev + 1)}>
                  รีเฟรช
                </Button>
                <Button
                  danger
                  onClick={() => {
                    setFilters({ status: 'pending', academicYear: undefined, semester: undefined, search: '' });
                    setPagination(prev => ({ ...prev, current: 1 })); // Reset pagination
                  }}
                >
                  รีเซ็ตตัวกรอง
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Spin spinning={loading} tip="กำลังโหลดข้อมูล">
          <Table
            rowKey={(record) => record.projectId}
            dataSource={projects}
            columns={columns}
            expandable={{
              expandedRowKeys: expandedRowKey ? [expandedRowKey] : [],
              onExpand: (expanded, record) => setExpandedRowKey(expanded ? record.projectId : null),
              expandedRowRender
            }}
            locale={{
              emptyText: (
                <Empty
                  description="ไม่มีโครงงานที่รอบันทึกผล"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )
            }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `แสดง ${range[0]}-${range[1]} จาก ${total} รายการ`,
              pageSizeOptions: ["10", "20", "50", "100"],
              onChange: (page, pageSize) => {
                setPagination(prev => ({ ...prev, current: page, pageSize }));
              },
              onShowSizeChange: (current, size) => {
                setPagination(prev => ({ ...prev, current: 1, pageSize: size }));
              },
            }}
          />
        </Spin>
      </Space>

      {/* Modal บันทึกผล */}
      {selectedProject && (
        <RecordExamResultModal
          visible={modalVisible}
          project={selectedProject}
          examType="PROJECT1"
          onClose={handleModalClose}
          onSuccess={handleRecordSuccess}
        />
      )}
    </div>
  );
};

export default Project1ExamResultPage;
