import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Upload,
  Button,
  Table,
  message,
  Space,
  Typography,
  Card,
  Alert,
  Row,
  Col,
  Tag,
  Statistic,
  Spin,
  Tooltip,
  Select,
  List,
  Empty
} from 'antd';
import {
  UploadOutlined,
  ReloadOutlined,
  DownloadOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileExcelOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { adminService } from '../services/adminService';
import curriculumService from '../services/curriculumService';
import academicService from '../services/academicService';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

// ฟังก์ชันช่วยคำนวณ base URL ของ backend จากค่า env ให้รองรับได้หลายสภาพแวดล้อม
const getBackendBaseUrl = () => {
  const apiUrl = process.env.REACT_APP_API_URL || '';

  if (!apiUrl) {
    return 'http://localhost:5000';
  }

  return apiUrl.replace(/\/api\/?$/, '');
};

const statusMeta = {
  Added: { color: 'green', label: 'เพิ่มใหม่', icon: <CheckCircleOutlined /> },
  Updated: { color: 'blue', label: 'อัปเดตแล้ว', icon: <ReloadOutlined /> },
  Invalid: { color: 'red', label: 'ข้อมูลไม่ถูกต้อง', icon: <CloseCircleOutlined /> },
  Error: { color: 'orange', label: 'เกิดข้อผิดพลาด', icon: <ExclamationCircleOutlined /> }
};

const aggregateUploadHistory = (entries = []) => {
  const groups = new Map();

  entries.forEach((entry) => {
    const createdAtRaw = entry.createdAt || entry.created_at || entry.created_date;
    const createdAt = createdAtRaw ? new Date(createdAtRaw) : new Date();
    const key = `${entry.fileName || entry.file_name}-${Math.floor(createdAt.getTime() / 1000)}`;

    if (!groups.has(key)) {
      groups.set(key, {
        fileName: entry.fileName || entry.file_name || 'ไม่ระบุชื่อไฟล์',
        createdAt,
        totalRecords: 0,
        successfulUpdates: 0,
        failedUpdates: 0,
        uploader: entry.uploader || null
      });
    }

    const group = groups.get(key);
    group.totalRecords += entry.totalRecords ?? 0;
    group.successfulUpdates += entry.successfulUpdates ?? 0;
    group.failedUpdates += entry.failedUpdates ?? 0;
  });

  return Array.from(groups.values()).sort((a, b) => b.createdAt - a.createdAt);
};

const AdminUpload = () => {
  const navigate = useNavigate();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const [prerequisiteStatus, setPrerequisiteStatus] = useState({
    curriculum: { ready: false, message: '' },
    academic: { ready: false, message: '' }
  });
  const [contextLoading, setContextLoading] = useState(true);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const templateDownloadUrl = `${getBackendBaseUrl()}/template/download-template`;

  const loadContextData = useCallback(async () => {
    setContextLoading(true);

    const nextStatus = {
      curriculum: { ready: false, message: 'กรุณาตั้งค่าหลักสูตรที่ใช้งานในเมนูตั้งค่าระบบ' },
      academic: { ready: false, message: 'กรุณาตั้งค่าปีการศึกษา/ภาคการศึกษาในเมนูตั้งค่าระบบ' }
    };

    try {
      const curriculumResponse = await curriculumService.getActiveCurriculum();
      const curriculumData = curriculumResponse?.data ?? curriculumResponse;

      if (curriculumResponse?.success === false || !curriculumData) {
        throw new Error('ไม่พบหลักสูตรที่เปิดใช้งาน');
      }

      nextStatus.curriculum = {
        ready: true,
        message: `หลักสูตรที่ใช้งาน: ${curriculumData.shortName || curriculumData.name || 'ไม่ระบุ'} (เริ่มใช้ปี ${curriculumData.startYear || '-'})`
      };
    } catch (error) {
      console.error('ไม่สามารถโหลดข้อมูลหลักสูตร:', error);
    }

    try {
      const academicData = await academicService.getCurrentAcademicInfo();
      if (academicData) {
        nextStatus.academic = {
          ready: true,
          message: `ปีการศึกษา/ภาคเรียนปัจจุบัน: ${academicData.displayText || `${academicData.academicYear}/${academicData.semester}`}` +
            (academicData.isFromDatabase ? '' : ' (คำนวณอัตโนมัติ)')
        };
      }
    } catch (error) {
      console.error('ไม่สามารถโหลดข้อมูลปีการศึกษา:', error);
    }

    setPrerequisiteStatus(nextStatus);
    setContextLoading(false);
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const historyData = await adminService.getStudentUploadHistory();
      setHistory(aggregateUploadHistory(historyData));
    } catch (error) {
      console.error('ไม่สามารถโหลดประวัติการอัปโหลด:', error);
      message.error('ไม่สามารถโหลดประวัติการอัปโหลดได้');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      message.error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
    }

    loadContextData();
    loadHistory();
  }, [loadContextData, loadHistory]);

  const isReadyToUpload = prerequisiteStatus.curriculum.ready && prerequisiteStatus.academic.ready;

  const handleBeforeUpload = (file) => {
    if (!isAuthenticated) {
      message.error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
      return Upload.LIST_IGNORE;
    }

    if (!isReadyToUpload) {
      message.warning('กรุณาตรวจสอบให้ตั้งค่าหลักสูตรและปีการศึกษาก่อนอัปโหลด');
      return Upload.LIST_IGNORE;
    }

    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
    if (!isCSV) {
      message.error('สามารถอัปโหลดได้เฉพาะไฟล์ .csv เท่านั้น');
      return Upload.LIST_IGNORE;
    }

    const isLessThan5MB = file.size / 1024 / 1024 < 5;
    if (!isLessThan5MB) {
      message.error('ไฟล์ต้องมีขนาดไม่เกิน 5MB');
      return Upload.LIST_IGNORE;
    }

    setFileList([file]);
    return false;
  };

  const handleUpload = async () => {
    if (!fileList.length) {
      message.warning('กรุณาเลือกไฟล์ CSV ก่อนเริ่มอัปโหลด');
      return;
    }

    if (!isReadyToUpload) {
      message.warning('ยังมีการตั้งค่าที่ต้องทำให้เสร็จก่อนอัปโหลด');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', fileList[0]);

    try {
      const data = await adminService.uploadStudentCSV(formData);

      if (data.success) {
        setResults(data.results || []);
        setSummary(data.summary || null);
        setStatusFilter('all');
        message.success('อัปโหลดไฟล์สำเร็จ');
        loadHistory();
      } else {
        throw new Error(data.message || 'ไม่สามารถประมวลผลไฟล์ได้');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const status = error.response?.status;
      if (status === 401) {
        message.error('ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่');
      } else if (status === 413) {
        message.error('ไฟล์มีขนาดใหญ่เกินไป');
      } else if (status === 415) {
        message.error('รูปแบบไฟล์ไม่ถูกต้อง');
      } else {
        message.error(error.message || 'เกิดข้อผิดพลาดในการอัปโหลด');
      }
    } finally {
      setUploading(false);
      setFileList([]);
    }
  };

  const handleDownloadTemplate = () => {
    window.open(templateDownloadUrl, '_blank');
  };

  const handleExportResults = () => {
    if (!results.length) {
      message.info('ยังไม่มีข้อมูลสำหรับดาวน์โหลด');
      return;
    }

    try {
      const headers = ['studentID', 'firstName', 'lastName', 'email', 'status', 'errors'];
      const csvRows = [headers.join(',')];

      results.forEach((item) => {
        const row = [
          item.studentID || '',
          item.firstName || '',
          item.lastName || '',
          item.email || '',
          item.status || '',
          (item.errors || item.error || []).toString().replace(/,/g, ';')
        ];
        csvRows.push(row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', `student-upload-results-${dayjs().format('YYYYMMDD-HHmmss')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('ไม่สามารถสร้างไฟล์สรุปได้:', error);
      message.error('เกิดข้อผิดพลาดในการสร้างไฟล์สรุป');
    }
  };

  const filteredResults = useMemo(() => {
    if (statusFilter === 'all') return results;
    return results.filter((item) => item.status === statusFilter);
  }, [statusFilter, results]);

  const columns = useMemo(() => [
    {
      title: 'รหัสนักศึกษา',
      dataIndex: 'studentID',
      key: 'studentID',
      width: 140,
      sorter: (a, b) => (a.studentID || '').localeCompare(b.studentID || ''),
      render: (text) => <Text strong>{text || '-'}</Text>
    },
    {
      title: 'ชื่อ',
      dataIndex: 'firstName',
      key: 'firstName',
      width: 160,
      sorter: (a, b) => (a.firstName || '').localeCompare(b.firstName || '')
    },
    {
      title: 'นามสกุล',
      dataIndex: 'lastName',
      key: 'lastName',
      width: 160,
      sorter: (a, b) => (a.lastName || '').localeCompare(b.lastName || '')
    },
    {
      title: 'อีเมล',
      dataIndex: 'email',
      key: 'email',
      width: 220,
      render: (value) => value || '-'
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status) => {
        const meta = statusMeta[status] || { color: 'default', label: status, icon: null };
        return (
          <Tag color={meta.color} icon={meta.icon} style={{ padding: '4px 8px' }}>
            {meta.label}
          </Tag>
        );
      }
    },
    {
      title: 'หมายเหตุ',
      key: 'notes',
      render: (_, record) => {
        if (record.status === 'Invalid' && record.errors) {
          return record.errors.map((error, index) => (
            <div key={index}>• {error}</div>
          ));
        }
        if (record.status === 'Error' && record.error) {
          return <Text type="danger">{record.error}</Text>;
        }
        return <Text type="secondary">-</Text>;
      }
    }
  ], []);

  const prerequisites = useMemo(() => ([
    {
      key: 'curriculum',
      title: 'ตั้งค่าหลักสูตรที่ใช้งาน',
      ready: prerequisiteStatus.curriculum.ready,
      description: prerequisiteStatus.curriculum.message,
      action: { label: 'ไปยังหน้าตั้งค่าหลักสูตร', link: '/admin/settings/curriculum' }
    },
    {
      key: 'academic',
      title: 'ตั้งค่าปีการศึกษา/ภาคการศึกษา',
      ready: prerequisiteStatus.academic.ready,
      description: prerequisiteStatus.academic.message,
      action: { label: 'ไปยังหน้าตั้งค่าปีการศึกษา', link: '/admin/settings/academic' }
    }
  ]), [prerequisiteStatus]);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1100,
        margin: '0 auto',
        padding: '24px 0 48px'
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>อัปโหลดรายชื่อนักศึกษา</Title>
          <Text type="secondary">
            ตรวจสอบให้เรียบร้อยว่าหลักสูตรและปีการศึกษาปัจจุบันถูกต้องก่อนนำเข้าไฟล์ CSV เพื่อความแม่นยำของข้อมูลนักศึกษา
          </Text>
        </div>

        {!isAuthenticated && (
          <Alert
            type="error"
            message="ไม่พบการยืนยันตัวตน"
            description="กรุณาเข้าสู่ระบบใหม่อีกครั้งก่อนใช้งานฟีเจอร์นี้"
            showIcon
          />
        )}

        <Card bodyStyle={{ padding: 24 }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <InfoCircleOutlined style={{ color: '#1677ff' }} />
                <Text strong>ขั้นตอนที่ควรทำก่อนอัปโหลด</Text>
              </Space>
              <Button icon={<ReloadOutlined />} size="small" onClick={loadContextData}>
                รีเฟรชสถานะ
              </Button>
            </Space>

            {contextLoading ? (
              <Spin tip="กำลังตรวจสอบการตั้งค่า..." />
            ) : (
              <Row gutter={[16, 16]}>
                {prerequisites.map((item) => (
                  <Col xs={24} md={12} key={item.key}>
                    <Card
                      size="small"
                      bordered
                      style={{ borderColor: item.ready ? '#52c41a' : '#faad14' }}
                    >
                      <Space align="center" size="small" style={{ marginBottom: 8 }}>
                        {item.ready ? (
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        ) : (
                          <InfoCircleOutlined style={{ color: '#faad14' }} />
                        )}
                        <Text strong>{item.title}</Text>
                      </Space>
                      <Text type={item.ready ? 'success' : 'secondary'}>{item.description}</Text>
                      {!item.ready && (
                        <div style={{ marginTop: 12 }}>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => navigate(item.action.link)}
                          >
                            {item.action.label}
                          </Button>
                        </div>
                      )}
                    </Card>
                  </Col>
                ))}
              </Row>
            )}

            <Alert
              type={isReadyToUpload ? 'success' : 'warning'}
              showIcon
              message={isReadyToUpload ? 'พร้อมสำหรับการอัปโหลดไฟล์ CSV' : 'ยังมีการตั้งค่าที่ต้องทำให้เรียบร้อยก่อนอัปโหลด'}
              description={
                <span>
                  {isReadyToUpload
                    ? 'คุณสามารถเลือกไฟล์ CSV และเริ่มอัปโหลดได้ทันที'
                    : 'ตรวจสอบให้แน่ใจว่าหลักสูตรและปีการศึกษาปัจจุบันตั้งค่าไว้ถูกต้องเพื่อให้ข้อมูลที่นำเข้าอยู่ในกลุ่มที่ถูกต้อง'}
                </span>
              }
            />
          </Space>
        </Card>

        <Card bodyStyle={{ padding: 24 }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Dragger
              accept=".csv"
              beforeUpload={handleBeforeUpload}
              fileList={fileList}
              onRemove={() => setFileList([])}
              multiple={false}
              disabled={uploading}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <Title level={4}>ลากไฟล์ CSV มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</Title>
              <Text type="secondary">
                รองรับไฟล์ .csv ขนาดไม่เกิน 5MB และต้องใช้งานตามโครงสร้างเทมเพลตที่กำหนด
              </Text>
            </Dragger>

            <Space size="middle" wrap>
              <Button
                type="primary"
                onClick={handleUpload}
                disabled={!fileList.length || uploading || !isReadyToUpload}
                loading={uploading}
                icon={<ReloadOutlined />}
              >
                ตรวจสอบและอัปโหลด
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                ดาวน์โหลดเทมเพลต CSV
              </Button>
              <Tooltip title="ดาวน์โหลดผลลัพธ์การประมวลผล (CSV)">
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={handleExportResults}
                  disabled={!results.length}
                >
                  ดาวน์โหลดผลลัพธ์
                </Button>
              </Tooltip>
            </Space>
          </Space>
        </Card>

        {summary && (
          <Card bodyStyle={{ padding: 24 }}>
            <Title level={4} style={{ marginBottom: 16 }}>สรุปผลการนำเข้า</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
                  <Statistic title="จำนวนรายการทั้งหมด" value={summary.total || 0} suffix="รายการ" />
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card size="small" bordered={false} style={{ background: '#f6ffed' }}>
                  <Statistic title="เพิ่มใหม่" value={summary.added || 0} suffix="รายการ" valueStyle={{ color: '#52c41a' }} />
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card size="small" bordered={false} style={{ background: '#e6f4ff' }}>
                  <Statistic title="อัปเดตข้อมูล" value={summary.updated || 0} suffix="รายการ" valueStyle={{ color: '#1890ff' }} />
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card size="small" bordered={false} style={{ background: '#fff1f0' }}>
                  <Statistic title="ข้อมูลไม่ถูกต้อง" value={summary.invalid || 0} suffix="รายการ" valueStyle={{ color: '#ff4d4f' }} />
                </Card>
              </Col>
            </Row>
          </Card>
        )}

        <Card
          bodyStyle={{ padding: 24 }}
          title={
            <Space>
              <FilterOutlined />
              <span>ผลลัพธ์การประมวลผล</span>
            </Space>
          }
          extra={
            <Space size="small">
              <Text type="secondary">แสดงสถานะ:</Text>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 180 }}
                size="small"
              >
                <Option value="all">ทั้งหมด</Option>
                <Option value="Added">เพิ่มใหม่</Option>
                <Option value="Updated">อัปเดตแล้ว</Option>
                <Option value="Invalid">ข้อมูลไม่ถูกต้อง</Option>
                <Option value="Error">เกิดข้อผิดพลาด</Option>
              </Select>
            </Space>
          }
        >
          {filteredResults.length ? (
            <Table
              dataSource={filteredResults}
              columns={columns}
              rowKey={(record, index) => record.studentID || `${record.status}-${index}`}
              loading={uploading}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ x: 900 }}
            />
          ) : (
            <Empty description="ยังไม่มีผลลัพธ์จากการอัปโหลด" />
          )}
        </Card>

        <Card
          bodyStyle={{ padding: 24 }}
          title={
            <Space>
              <HistoryOutlined />
              <span>ประวัติการอัปโหลดล่าสุด</span>
            </Space>
          }
          extra={
            <Button icon={<ReloadOutlined />} size="small" onClick={loadHistory}>
              รีเฟรช
            </Button>
          }
        >
          {historyLoading ? (
            <Spin tip="กำลังโหลดประวัติ..." />
          ) : history.length ? (
            <List
              dataSource={history.slice(0, 5)}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space direction="vertical" size={2}>
                        <Text strong>{item.fileName}</Text>
                        <Text type="secondary">อัปโหลดเมื่อ {dayjs(item.createdAt).format('DD MMM YYYY HH:mm')}</Text>
                      </Space>
                    }
                    description={
                      <Space size="middle" wrap>
                        <Tag color="blue">เพิ่ม/อัปเดต {item.successfulUpdates}</Tag>
                        <Tag color="default">รวม {item.totalRecords}</Tag>
                        {item.failedUpdates > 0 && <Tag color="red">ผิดพลาด {item.failedUpdates}</Tag>}
                        {item.uploader && (
                          <Tag color="purple">
                            โดย {item.uploader.firstName || ''} {item.uploader.lastName || ''}
                          </Tag>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="ยังไม่มีประวัติการอัปโหลด" />
          )}
        </Card>
      </Space>
    </div>
  );
};

export default AdminUpload;
