import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Select,
  Empty
} from 'antd';
import {
  UploadOutlined,
  ReloadOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileExcelOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { adminService } from '../services/adminService';
import academicService from '../services/academicService';
import { settingsService } from '../services/admin/settingsService';
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

const AdminUpload = () => {
  const navigate = useNavigate();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // เพิ่ม state สำหรับ preview mode
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const [prerequisiteStatus, setPrerequisiteStatus] = useState({
    curriculum: { ready: false, message: '' },
    academic: { ready: false, message: '' }
  });
  const [contextLoading, setContextLoading] = useState(true);
  const [activeCurriculums, setActiveCurriculums] = useState([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);
  const selectedCurriculumRef = useRef(null);

  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const csvTemplateDownloadUrl = `${getBackendBaseUrl()}/template/download-csv-template`;
  const excelTemplateDownloadUrl = `${getBackendBaseUrl()}/template/download-excel-template`;

  useEffect(() => {
    selectedCurriculumRef.current = selectedCurriculumId;
  }, [selectedCurriculumId]);

  const loadContextData = useCallback(async () => {
    setContextLoading(true);

    const nextStatus = {
      curriculum: { ready: false, message: 'กรุณาตั้งค่าหลักสูตรที่ใช้งานในเมนูตั้งค่าระบบ' },
      academic: { ready: false, message: 'กรุณาตั้งค่าปีการศึกษา/ภาคการศึกษาในเมนูตั้งค่าระบบ' }
    };

    try {
      const curriculumListResponse = await settingsService.getCurriculums();
      if (curriculumListResponse?.success) {
        const curriculums = Array.isArray(curriculumListResponse.data)
          ? curriculumListResponse.data
          : [];
        const activeList = curriculums.filter((curriculum) => curriculum.active);
        setActiveCurriculums(activeList);

        if (activeList.length > 0) {
          const currentSelectedId = selectedCurriculumRef.current;
          const getCurriculumId = (curriculum) => curriculum.curriculumId ?? curriculum.id ?? curriculum.curriculumID ?? null;

          let effectiveSelectedId = currentSelectedId;
          const hasCurrentSelection = effectiveSelectedId
            ? activeList.some((curriculum) => getCurriculumId(curriculum) === effectiveSelectedId)
            : false;

          if (!hasCurrentSelection) {
            effectiveSelectedId = getCurriculumId(activeList[0]);
            setSelectedCurriculumId(effectiveSelectedId);
          }

          const selectedCurriculum = activeList.find(
            (curriculum) => getCurriculumId(curriculum) === effectiveSelectedId
          );

          nextStatus.curriculum = {
            ready: true,
            message: selectedCurriculum
              ? `กำลังใช้หลักสูตร: ${selectedCurriculum.shortName || selectedCurriculum.name || 'ไม่ระบุ'}`
              : 'กรุณาเลือกหลักสูตรที่จะใช้เป็นเกณฑ์'
          };
        } else {
          nextStatus.curriculum = {
            ready: false,
            message: 'ไม่พบหลักสูตรที่เปิดใช้งาน กรุณาเพิ่มหรือเปิดใช้งานหลักสูตร'
          };
        }
      } else {
        throw new Error('ไม่สามารถดึงข้อมูลหลักสูตรได้');
      }
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      message.error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
    }

    loadContextData();
  }, [loadContextData]);

  const selectedCurriculum = useMemo(() => {
    const getCurriculumId = (curriculum) => curriculum?.curriculumId ?? curriculum?.id ?? curriculum?.curriculumID ?? null;
    return activeCurriculums.find(
      (curriculum) => getCurriculumId(curriculum) === selectedCurriculumId
    );
  }, [activeCurriculums, selectedCurriculumId]);

  const isReadyToUpload = prerequisiteStatus.curriculum.ready && prerequisiteStatus.academic.ready && !!selectedCurriculum;

  const handleBeforeUpload = (file) => {
    if (!isAuthenticated) {
      message.error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
      return Upload.LIST_IGNORE;
    }

    if (!isReadyToUpload) {
      message.warning('กรุณาตรวจสอบให้ตั้งค่าหลักสูตรและปีการศึกษาก่อนอัปโหลด');
      return Upload.LIST_IGNORE;
    }

    const fileName = file.name.toLowerCase();
    const csvMimeType = file.type === 'text/csv';
    const excelMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const isCsv = csvMimeType || fileName.endsWith('.csv');
    const isExcel = excelMimeTypes.includes(file.type) || fileName.endsWith('.xlsx');

    if (!isCsv && !isExcel) {
      message.error('สามารถอัปโหลดได้เฉพาะไฟล์ .csv หรือ .xlsx เท่านั้น');
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
      message.warning('กรุณาเลือกไฟล์ CSV หรือ Excel ก่อนเริ่มอัปโหลด');
      return;
    }

    if (!isReadyToUpload) {
      message.warning('ยังมีการตั้งค่าที่ต้องทำให้เสร็จก่อนอัปโหลด');
      return;
    }

    if (!selectedCurriculumId) {
      message.warning('กรุณาเลือกหลักสูตรที่จะใช้ก่อนอัปโหลด');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', fileList[0]);
    formData.append('curriculumId', selectedCurriculumId);

    try {
      // เรียก API ในโหมดตรวจสอบ (preview mode)
      const data = await adminService.uploadStudentCSV(formData, { preview: true });

      if (data.success) {
        setPreviewData(data);
        setResults(data.results || []);
        setSummary(data.summary || null);
        setStatusFilter('all');
        setIsPreviewMode(true);
        
        // Check for file errors and display as warning instead of success
        if (data.summary?.fileError) {
          message.warning(data.summary.fileError);
        } else {
          message.success('ตรวจสอบไฟล์เสร็จสิ้น กรุณาตรวจสอบผลลัพธ์และยืนยันการอัปโหลด');
        }
      } else {
        throw new Error(data.message || 'ไม่สามารถประมวลผลได้');
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
        // Check if it's a soft error from backend
        const errorMessage = error.response?.data?.summary?.fileError || 
                            error.response?.data?.error || 
                            error.message || 
                            'เกิดข้อผิดพลาดในการอัปโหลด';
        
        // Display as warning for file structure issues, error for other issues
        if (errorMessage.includes('ไฟล์ว่างเปล่า') || 
            errorMessage.includes('ไม่พบการแสดงคอลัมน์ที่ถูกต้อง') || 
            errorMessage.includes('ไม่มีข้อมูลนักศึกษา')) {
          message.warning(errorMessage);
          // Still set empty results to show the UI
          setResults([]);
          setSummary({ 
            total: 0, 
            added: 0, 
            updated: 0, 
            invalid: 0, 
            errors: 1,
            fileError: errorMessage 
          });
        } else {
          message.error(errorMessage);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  // ฟังก์ชันสำหรับการอัปโหลดจริงหลังจากตรวจสอบแล้ว
  const handleConfirmUpload = async () => {
    if (!previewData) {
      message.error('ไม่พบข้อมูลที่ตรวจสอบแล้ว กรุณาตรวจสอบไฟล์ใหม่');
      return;
    }

    if (!selectedCurriculumId) {
      message.warning('กรุณาเลือกหลักสูตรที่จะใช้ก่อนยืนยันการอัปโหลด');
      return;
    }

    setConfirming(true);
    const formData = new FormData();
    formData.append('file', fileList[0]);
    formData.append('curriculumId', selectedCurriculumId);

    try {
      // เรียก API ในโหมดอัปโหลดจริง
      const data = await adminService.uploadStudentCSV(formData, { confirm: true });

      if (data.success) {
        setResults(data.results || []);
        setSummary(data.summary || null);
        setStatusFilter('all');
        setIsPreviewMode(false);
        setPreviewData(null);
        
        message.success('อัปโหลดและบันทึกข้อมูลนักศึกษาเสร็จสิ้น');
      } else {
        throw new Error(data.message || 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (error) {
      console.error('Confirm upload error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      message.error(errorMessage);
    } finally {
      setConfirming(false);
      setFileList([]);
    }
  };

  // ฟังก์ชันสำหรับยกเลิกการอัปโหลด
  const handleCancelUpload = () => {
    setIsPreviewMode(false);
    setPreviewData(null);
    setResults([]);
    setSummary(null);
    setFileList([]);
    message.info('ยกเลิกการอัปโหลดแล้ว');
  };

  const handleDownloadCsvTemplate = () => {
    window.open(csvTemplateDownloadUrl, '_blank');
  };

  const handleDownloadExcelTemplate = () => {
    window.open(excelTemplateDownloadUrl, '_blank');
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
      description: prerequisiteStatus.curriculum.ready
        ? (selectedCurriculum
            ? `หลักสูตรที่เลือก: ${selectedCurriculum.shortName || selectedCurriculum.name} (${selectedCurriculum.code || 'ไม่ระบุ'})`
            : 'กรุณาเลือกหลักสูตรที่จะใช้เป็นเกณฑ์')
        : prerequisiteStatus.curriculum.message,
      action: { label: 'ไปยังหน้าตั้งค่าหลักสูตร', link: '/admin/settings/curriculum' }
    },
    {
      key: 'academic',
      title: 'ตั้งค่าปีการศึกษา/ภาคการศึกษา',
      ready: prerequisiteStatus.academic.ready,
      description: prerequisiteStatus.academic.message,
      action: { label: 'ไปยังหน้าตั้งค่าปีการศึกษา', link: '/admin/settings/academic' }
    }
  ]), [prerequisiteStatus, selectedCurriculum]);

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

        <Card styles={{ body: { padding: 24  }}}>
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
              <Spin spinning={true} tip="กำลังตรวจสอบการตั้งค่า...">
        <div style={{ minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>{/* Loading content */}</div>
        </div>
      </Spin>
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
                      {item.key === 'curriculum' && item.ready && (
                        <Select
                          value={selectedCurriculumId || undefined}
                          onChange={(value) => {
                            setSelectedCurriculumId(value);
                            const newlySelected = activeCurriculums.find(
                              (curriculum) => (curriculum.curriculumId ?? curriculum.id ?? curriculum.curriculumID ?? null) === value
                            );
                            setPrerequisiteStatus((prev) => ({
                              ...prev,
                              curriculum: {
                                ...prev.curriculum,
                                message: newlySelected
                                  ? `กำลังใช้หลักสูตร: ${newlySelected.shortName || newlySelected.name || 'ไม่ระบุ'}`
                                  : 'กรุณาเลือกหลักสูตรที่จะใช้เป็นเกณฑ์'
                              }
                            }));
                          }}
                          placeholder="เลือกหลักสูตรที่จะใช้"
                          style={{ width: '100%', marginTop: 12 }}
                          allowClear={false}
                        >
                          {activeCurriculums.map((curriculum) => {
                            const curriculumId = curriculum.curriculumId ?? curriculum.id ?? curriculum.curriculumID ?? null;
                            const label = `${curriculum.code || 'ไม่ระบุ'} - ${curriculum.shortName || curriculum.name || 'ไม่ระบุ'}`;
                            return (
                              <Option key={curriculumId} value={curriculumId}>
                                {label}
                              </Option>
                            );
                          })}
                        </Select>
                      )}
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
              message={isReadyToUpload ? 'พร้อมสำหรับการอัปโหลดไฟล์ CSV หรือ Excel' : 'ยังมีการตั้งค่าที่ต้องทำให้เรียบร้อยก่อนอัปโหลด'}
              description={
                <span>
                  {isReadyToUpload
                    ? 'คุณสามารถเลือกไฟล์ CSV หรือ Excel (.xlsx) และเริ่มอัปโหลดได้ทันที'
                    : 'ตรวจสอบให้แน่ใจว่าหลักสูตรและปีการศึกษาปัจจุบันตั้งค่าไว้ถูกต้องเพื่อให้ข้อมูลที่นำเข้าอยู่ในกลุ่มที่ถูกต้อง'}
                </span>
              }
            />
          </Space>
        </Card>

        <Card styles={{ body: { padding: 24  }}}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Dragger
              accept=".csv,.xlsx"
              beforeUpload={handleBeforeUpload}
              fileList={fileList}
              onRemove={() => setFileList([])}
              multiple={false}
              disabled={uploading}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <Title level={4}>ลากไฟล์ CSV หรือ Excel (.xlsx) มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</Title>
              <Text type="secondary">
                รองรับไฟล์ .csv และ .xlsx ขนาดไม่เกิน 5MB และต้องใช้งานตามโครงสร้างเทมเพลตที่กำหนด
              </Text>
            </Dragger>

            <Space size="middle" wrap>
              {!isPreviewMode ? (
                <Button
                  type="primary"
                  onClick={handleUpload}
                  disabled={!fileList.length || uploading || !isReadyToUpload}
                  loading={uploading}
                  icon={<ReloadOutlined />}
                >
                  ตรวจสอบข้อมูล
                </Button>
              ) : (
                <Space>
                  <Button
                    type="primary"
                    onClick={handleConfirmUpload}
                    disabled={confirming}
                    loading={confirming}
                    icon={<CheckCircleOutlined />}
                  >
                    ยืนยันการอัปโหลด
                  </Button>
                  <Button
                    onClick={handleCancelUpload}
                    disabled={confirming}
                    icon={<CloseCircleOutlined />}
                  >
                    ยกเลิก
                  </Button>
                </Space>
              )}
              <Button icon={<DownloadOutlined />} onClick={handleDownloadCsvTemplate}>
                ดาวน์โหลดเทมเพลต CSV
              </Button>
              <Button icon={<FileExcelOutlined />} onClick={handleDownloadExcelTemplate}>
                ดาวน์โหลดเทมเพลต Excel
              </Button>
            </Space>
          </Space>
        </Card>

        {summary && (
          <Card styles={{ body: { padding: 24  }}}>
            <Title level={4} style={{ marginBottom: 16 }}>
              {isPreviewMode ? 'ตรวจสอบข้อมูลก่อนอัปโหลด' : 'สรุปผลการนำเข้า'}
            </Title>
            
            {/* แสดงข้อความแจ้งเตือนในโหมด preview */}
            {isPreviewMode && (
              <Alert
                type="info"
                showIcon
                message="กรุณาตรวจสอบข้อมูลก่อนยืนยันการอัปโหลด"
                description="ข้อมูลด้านล่างเป็นการแสดงตัวอย่างผลลัพธ์ที่จะเกิดขึ้นหลังจากอัปโหลด หากข้อมูลถูกต้องแล้ว กรุณากดปุ่ม 'ยืนยันการอัปโหลด' เพื่อดำเนินการต่อ"
                style={{ marginBottom: 16 }}
              />
            )}
            
            {/* Display file error if exists */}
            {summary.fileError && (
              <Alert
                type="warning"
                showIcon
                message="ปัญหาเกี่ยวกับไฟล์"
                description={summary.fileError}
                style={{ marginBottom: 16 }}
              />
            )}
            
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <Card size="small" variant="borderless" style={{ background: '#f5f5f5' }}>
                  <Statistic title="จำนวนรายการทั้งหมด" value={summary.total || 0} suffix="รายการ" />
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card size="small" variant="borderless" style={{ background: '#f6ffed' }}>
                  <Statistic title="เพิ่มใหม่" value={summary.added || 0} suffix="รายการ" valueStyle={{ color: '#52c41a' }} />
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card size="small" variant="borderless" style={{ background: '#e6f4ff' }}>
                  <Statistic title="อัปเดตข้อมูล" value={summary.updated || 0} suffix="รายการ" valueStyle={{ color: '#1890ff' }} />
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card size="small" variant="borderless" style={{ background: '#fff1f0' }}>
                  <Statistic title="ข้อมูลไม่ถูกต้อง" value={summary.invalid || 0} suffix="รายการ" valueStyle={{ color: '#ff4d4f' }} />
                </Card>
              </Col>
            </Row>
          </Card>
        )}

        <Card
          styles={{ body: { padding: 24  }}}
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
      </Space>
    </div>
  );
};

export default AdminUpload;
