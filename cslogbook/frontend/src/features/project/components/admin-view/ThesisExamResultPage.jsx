import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  message,
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
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileProtectOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
  FileSyncOutlined
} from '@ant-design/icons';
import dayjs from 'utils/dayjs';
import { DATE_TIME_FORMAT } from 'utils/constants';
import projectExamResultService from 'features/project/services/projectExamResultService';
import RecordExamResultModal from './RecordExamResultModal';
import UpdateFinalDocumentStatusModal from './UpdateFinalDocumentStatusModal';
import { useAuth } from 'contexts/AuthContext';

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

const DOCUMENT_STATUS_MAP = {
  draft: { color: 'default', text: 'ร่าง' },
  pending: { color: 'orange', text: 'รอตรวจสอบ' },
  approved: { color: 'green', text: 'อนุมัติ' },
  rejected: { color: 'red', text: 'ปฏิเสธ' },
  completed: { color: 'green', text: 'เรียบร้อย' },
  supervisor_evaluated: { color: 'purple', text: 'หัวหน้าภาคตรวจแล้ว' },
  acceptance_approved: { color: 'geekblue', text: 'อนุมัติให้รับเล่ม' },
  referral_ready: { color: 'blue', text: 'พร้อมส่งต่อ' },
  referral_downloaded: { color: 'cyan', text: 'ดาวน์โหลดแล้ว' }
};

const DEFENSE_STATUS_LABEL = {
  draft: 'แบบร่าง',
  submitted: 'ยื่นคำขอแล้ว',
  advisor_in_review: 'รออาจารย์ตรวจ',
  advisor_approved: 'อาจารย์อนุมัติแล้ว',
  staff_verified: 'เจ้าหน้าที่ตรวจสอบแล้ว',
  scheduled: 'นัดสอบแล้ว',
  completed: 'บันทึกผลสอบแล้ว',
  cancelled: 'ยกเลิก'
};

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24
};

const ThesisExamResultPage = () => {
  const { userData } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'pending',
    academicYear: undefined,
    semester: undefined,
    search: ''
  });
  const [reloadToken, setReloadToken] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [documentProject, setDocumentProject] = useState(null);

  const isStaff = useMemo(() => {
    if (!userData) return false;
    if (userData.role === 'admin') return true;
    return userData.role === 'teacher' && userData.teacherType === 'support';
  }, [userData]);

  const formatDateTime = useCallback((value) => {
    if (!value) return '-';
    return dayjs(value).locale('th').format(DATE_TIME_FORMAT);
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await projectExamResultService.getThesisPendingResults(filters);
      const list = response?.data || [];
      setProjects(list);
    } catch (error) {
      console.error(error);
      message.error('ไม่สามารถโหลดข้อมูลโครงงานได้');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, reloadToken]);

  const availableAcademicYears = useMemo(() => {
    const years = new Set();
    projects.forEach((project) => {
      if (project.academicYear) {
        years.add(project.academicYear);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [projects]);

  const summary = useMemo(() => {
    return projects.reduce(
      (acc, project) => {
        const examResult = project.examResults && project.examResults.length > 0 ? project.examResults[0] : null;
        acc.total += 1;
        if (!examResult) {
          acc.pending += 1;
        } else if (examResult.result === 'PASS') {
          acc.passed += 1;
        } else if (examResult.result === 'FAIL') {
          acc.failed += 1;
        }
        return acc;
      },
      { total: 0, pending: 0, passed: 0, failed: 0 }
    );
  }, [projects]);

  const handleRecordResult = useCallback((project) => {
    if (!isStaff) {
      message.warning('เฉพาะเจ้าหน้าที่สนับสนุนหรือผู้ดูแลระบบเท่านั้นที่สามารถบันทึกผลสอบได้');
      return;
    }
    setSelectedProject(project);
    setModalVisible(true);
  }, [isStaff]);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setSelectedProject(null);
  }, []);

  const handleRecordSuccess = useCallback(() => {
    setReloadToken((prev) => prev + 1);
    handleModalClose();
  }, [handleModalClose]);

  const handleDocumentModalClose = useCallback(() => {
    setDocumentModalVisible(false);
    setDocumentProject(null);
  }, []);

  const handleDocumentUpdateSuccess = useCallback(() => {
    setReloadToken((prev) => prev + 1);
    handleDocumentModalClose();
  }, [handleDocumentModalClose]);

  const handleOpenDocumentModal = useCallback((project) => {
    if (!isStaff) {
      message.warning('เฉพาะเจ้าหน้าที่สนับสนุนหรือผู้ดูแลระบบเท่านั้นที่สามารถอัปเดตสถานะเล่มได้');
      return;
    }
    setDocumentProject(project);
    setDocumentModalVisible(true);
  }, [isStaff]);

  const onStatusChange = useCallback((value) => {
    setFilters((prev) => ({ ...prev, status: value || 'all' }));
  }, []);

  const onAcademicYearChange = useCallback((value) => {
    setFilters((prev) => ({ ...prev, academicYear: value || undefined }));
  }, []);

  const onSemesterChange = useCallback((value) => {
    setFilters((prev) => ({ ...prev, semester: value || undefined }));
  }, []);

  const onSearchChange = useCallback((event) => {
    setFilters((prev) => ({ ...prev, search: event.target.value }));
  }, []);

  const columns = useMemo(() => {
    return [
      {
        title: 'โครงงาน',
        dataIndex: 'projectNameTh',
        key: 'projectNameTh',
        render: (_, project) => (
          <Space direction="vertical" size={4}>
            <Space size={6} wrap>
              <Text strong>{project.projectNameTh || project.projectNameEn || 'ไม่ระบุชื่อโครงงาน'}</Text>
              {project.projectId && <Tag color="geekblue">#{project.projectId}</Tag>}
            </Space>
            <Text type="secondary">
              ปีการศึกษา {project.academicYear || '-'} / ภาคเรียน {project.semester || '-'}
            </Text>
          </Space>
        )
      },
      {
        title: 'สมาชิก',
        dataIndex: 'members',
        key: 'members',
        render: (members) => {
          if (!Array.isArray(members) || members.length === 0) {
            return '-';
          }
          return (
            <Space direction="vertical" size={2}>
              {members.map((member) => (
                <div key={member.studentId || member.student?.studentId}>
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
        title: 'การบันทึกการสอบปริญญานิพนธ์',
        key: 'thesisExamStatus',
        render: (_, project) => {
          const examResult = project.examResults && project.examResults.length > 0 ? project.examResults[0] : null;
          const statusKey = examResult ? (examResult.result === 'PASS' ? 'passed' : 'failed') : 'pending';
          const statusMeta = STATUS_MAP[statusKey] || STATUS_MAP.pending;
          const defenseRequest = project.defenseRequests && project.defenseRequests.length > 0
            ? project.defenseRequests[0]
            : null;
          const scheduledAt = defenseRequest?.defenseScheduledAt || defenseRequest?.defense_scheduled_at;
          return (
            <Space direction="vertical" size={4}>
              <Tag color={statusMeta.color}>{statusMeta.text}</Tag>
              {examResult ? (
                <Text type="secondary">บันทึกเมื่อ {formatDateTime(examResult.recordedAt || examResult.recorded_at)}</Text>
              ) : defenseRequest ? (
                <Text type="secondary">
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  กำหนดสอบ {formatDateTime(scheduledAt)}
                </Text>
              ) : (
                <Text type="secondary">ยังไม่กำหนดวันสอบ</Text>
              )}
            </Space>
          );
        }
      },
      {
        title: 'เล่มเอกสาร',
        key: 'finalDocument',
        render: (_, project) => {
          const doc = project.finalDocument;
          if (!doc) {
            return <Tag color="default">ยังไม่ส่งเล่ม</Tag>;
          }
          const statusMeta = DOCUMENT_STATUS_MAP[doc.status] || { color: 'default', text: doc.status || 'ไม่ทราบสถานะ' };
          return (
            <Space direction="vertical" size={4}>
              <Tag color={statusMeta.color}>{statusMeta.text}</Tag>
              {doc.submittedAt && (
                <Text type="secondary">ส่งเมื่อ {formatDateTime(doc.submittedAt)}</Text>
              )}
              {doc.reviewer && doc.reviewDate && (
                <Text type="secondary">
                  ตรวจโดย {doc.reviewer.firstName} {doc.reviewer.lastName} เมื่อ {formatDateTime(doc.reviewDate)}
                </Text>
              )}
              {typeof doc.downloadCount === 'number' && doc.downloadCount > 0 && (
                <Text type="secondary">ดาวน์โหลดแล้ว {doc.downloadCount} ครั้ง</Text>
              )}
            </Space>
          );
        }
      },
      {
        title: 'การดำเนินการ',
        key: 'actions',
        width: 220,
        render: (_, project) => {
          const hasResult = project.examResults && project.examResults.length > 0;
          const recordTooltip = !isStaff
            ? 'คุณไม่มีสิทธิ์บันทึกผลสอบ'
            : hasResult
              ? 'มีการบันทึกผลสอบแล้ว'
              : 'บันทึกผลสอบปริญญานิพนธ์';

          const doc = project.finalDocument;
          const docStatusMeta = doc?.status ? (DOCUMENT_STATUS_MAP[doc.status] || null) : null;
          const documentTooltip = !isStaff
            ? 'คุณไม่มีสิทธิ์อัปเดตสถานะเล่ม'
            : doc
              ? `สถานะปัจจุบัน: ${docStatusMeta?.text || doc.status}`
              : 'ยังไม่มีรายการเล่มในระบบ (กดเพื่อดูคำแนะนำ)';

          return (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Tooltip title={recordTooltip}>
                <Button
                  type="primary"
                  block
                  icon={hasResult ? <CheckCircleOutlined /> : <FileProtectOutlined />}
                  onClick={() => handleRecordResult(project)}
                  disabled={!isStaff || hasResult}
                >
                  {hasResult ? 'บันทึกแล้ว' : 'บันทึกผลสอบ'}
                </Button>
              </Tooltip>
              <Tooltip title={documentTooltip}>
                <Button
                  block
                  icon={<FileSyncOutlined />}
                  onClick={() => handleOpenDocumentModal(project)}
                  disabled={!isStaff}
                >
                  อัปเดตสถานะเล่ม
                </Button>
              </Tooltip>
            </Space>
          );
        }
      }
    ];
  }, [formatDateTime, handleOpenDocumentModal, handleRecordResult, isStaff]);

  const expandedRowRender = useCallback((project) => {
    const examResult = project.examResults && project.examResults.length > 0 ? project.examResults[0] : null;
    const defense = project.defenseRequests && project.defenseRequests.length > 0 ? project.defenseRequests[0] : null;

    return (
      <Row gutter={[24, 16]}>
        <Col xs={24} md={12}>
          <Card size="small" title="รายละเอียดการสอบ">
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {defense ? (
                <>
                  <Text>
                    สถานะคำขอ: {DEFENSE_STATUS_LABEL[defense.status] || defense.status || '-'}
                  </Text>
                  <Text>ยื่นเมื่อ: {formatDateTime(defense.submittedAt || defense.submitted_at)}</Text>
                  <Text>อาจารย์อนุมัติเมื่อ: {formatDateTime(defense.advisorApprovedAt || defense.advisor_approved_at)}</Text>
                  <Text>เจ้าหน้าที่ตรวจเมื่อ: {formatDateTime(defense.staffVerifiedAt || defense.staff_verified_at)}</Text>
                  <Text>กำหนดสอบ: {formatDateTime(defense.defenseScheduledAt || defense.defense_scheduled_at)}</Text>
                  {defense.defenseLocation && <Text>สถานที่สอบ: {defense.defenseLocation}</Text>}
                </>
              ) : (
                <Alert type="info" showIcon message="ยังไม่มีข้อมูลคำขอสอบ" />
              )}
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" title="ผลการสอบ">
            {examResult ? (
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Text>
                  ผลสอบ:{' '}
                  {examResult.result === 'PASS' ? (
                    <Tag color="green" icon={<CheckCircleOutlined />}>ผ่าน</Tag>
                  ) : (
                    <Tag color="red" icon={<CloseCircleOutlined />}>ไม่ผ่าน</Tag>
                  )}
                </Text>
                {examResult.score && <Text>คะแนน: {examResult.score}</Text>}
                {examResult.notes && <Text>หมายเหตุ: {examResult.notes}</Text>}
                <Text>ผู้บันทึก: {examResult.recordedBy ? `${examResult.recordedBy.firstName} ${examResult.recordedBy.lastName}` : '-'}</Text>
                <Text>บันทึกเมื่อ: {formatDateTime(examResult.recordedAt || examResult.recorded_at)}</Text>
              </Space>
            ) : (
              <Alert type="info" showIcon message="ยังไม่มีผลสอบ" />
            )}
          </Card>
        </Col>
      </Row>
    );
  }, [formatDateTime]);

  const handleReload = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  return (
    <div style={containerStyle}>
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <Space direction="vertical" size={8}>
          <Title level={3}>บันทึกผลสอบปริญญานิพนธ์</Title>
          <Text type="secondary">
            เจ้าหน้าที่สามารถบันทึกผลสอบปริญญานิพนธ์ (ผ่าน/ไม่ผ่าน) พร้อมติดตามสถานะเล่มเอกสารหลังสอบได้จากหน้านี้
          </Text>
        </Space>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="รอบันทึกผล" value={summary.pending} suffix="รายการ" />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="บันทึกผลแล้ว" value={summary.passed + summary.failed} suffix="รายการ" />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="ผ่าน" value={summary.passed} suffix="รายการ" />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic title="ไม่ผ่าน" value={summary.failed} suffix="รายการ" />
            </Card>
          </Col>
        </Row>

        <Card size="small" styles={{ body: { padding: 16 } }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} lg={10}>
              <Input
                placeholder="ค้นหาโครงงานหรือชื่อนักศึกษา"
                value={filters.search}
                onChange={onSearchChange}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col xs={24} lg={14} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Space size="small" wrap>
                <Select
                  style={{ width: 160 }}
                  placeholder="สถานะ"
                  options={STATUS_OPTIONS}
                  value={filters.status}
                  onChange={onStatusChange}
                />
                <Select
                  style={{ width: 140 }}
                placeholder="ปีการศึกษา"
                allowClear
                options={availableAcademicYears.map((year) => ({ label: year, value: year }))}
                value={filters.academicYear}
                onChange={onAcademicYearChange}
              />
              <Select
                style={{ width: 140 }}
                placeholder="ภาคเรียน"
                allowClear
                options={[
                  { label: '1', value: 1 },
                  { label: '2', value: 2 },
                  { label: '3', value: 3 }
                ]}
                value={filters.semester}
                onChange={onSemesterChange}
              />
              <Button icon={<ReloadOutlined />} onClick={handleReload}>
                รีเฟรช
              </Button>
            </Space>
          </Col>
        </Row>
        </Card>

        <Spin spinning={loading} tip="กำลังโหลดข้อมูล">
          <Table
            rowKey={(record) => record.projectId}
            dataSource={projects}
            columns={columns}
            expandable={{
              expandedRowRender,
              expandRowByClick: true
            }}
            locale={{
              emptyText: (
                <Empty description="ไม่มีโครงงานปริญญานิพนธ์ในสถานะที่เลือก" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )
            }}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `ทั้งหมด ${total} รายการ`
            }}
          />
        </Spin>
      </Space>

      {selectedProject && (
        <RecordExamResultModal
          visible={modalVisible}
          project={selectedProject}
          examType="THESIS"
          onClose={handleModalClose}
          onSuccess={handleRecordSuccess}
        />
      )}

      {documentProject && (
        <UpdateFinalDocumentStatusModal
          visible={documentModalVisible}
          project={documentProject}
          onClose={handleDocumentModalClose}
          onSuccess={handleDocumentUpdateSuccess}
          statusDictionary={DOCUMENT_STATUS_MAP}
          formatDateTime={formatDateTime}
        />
      )}
    </div>
  );
};

export default ThesisExamResultPage;
