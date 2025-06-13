import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Space, Alert, Typography, Row, Col, 
  Tag, Descriptions, message, Spin, Timeline
} from 'antd';
import { 
  DownloadOutlined, UploadOutlined, FileTextOutlined,
  PrinterOutlined, CheckCircleOutlined, ClockCircleOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

// นำเข้า Demo Controls
import internshipService from '../../../services/internshipService';

const { Title, Text } = Typography;

dayjs.locale('th');

const InternshipDocumentsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cs05Data, setCs05Data] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [documents, setDocuments] = useState({});
  
  // ประเภทเอกสารทั้งหมด
  const documentTypes = [
    {
      key: 'cs05_form',
      title: 'แบบฟอร์ม คพ.05',
      description: 'คำร้องขอฝึกงาน',
      icon: <FileTextOutlined />,
      color: 'blue',
      requiredStatus: ['submitted', 'under_review', 'approved', 'completed'],
      downloadable: true,
      actions: ['view', 'download', 'print']
    },
    {
      key: 'cooperation_letter',
      title: 'หนังสือขอความอนุเคราะห์',
      description: 'หนังสือสำหรับติดต่อบริษัท',
      icon: <FileTextOutlined />,
      color: 'green',
      requiredStatus: ['approved', 'letter_downloaded', 'acceptance_uploaded', 'completed'],
      downloadable: true,
      actions: ['download', 'print']
    },
    {
      key: 'acceptance_form',
      title: 'แบบฟอร์มหนังสือตอบรับ',
      description: 'แบบฟอร์มสำหรับบริษัทตอบรับ',
      icon: <FileTextOutlined />,
      color: 'orange',
      requiredStatus: ['approved', 'letter_downloaded', 'acceptance_uploaded', 'completed'],
      downloadable: true,
      actions: ['download', 'print']
    },
    {
      key: 'acceptance_letter',
      title: 'หนังสือตอบรับจากบริษัท',
      description: 'หนังสือที่บริษัทส่งกลับมา',
      icon: <UploadOutlined />,
      color: 'purple',
      requiredStatus: ['acceptance_uploaded', 'acceptance_approved', 'completed'],
      downloadable: false,
      actions: ['upload', 'view']
    },
    {
      key: 'referral_letter',
      title: 'หนังสือส่งตัว',
      description: 'หนังสือส่งตัวนักศึกษาไปฝึกงาน',
      icon: <FileTextOutlined />,
      color: 'cyan',
      requiredStatus: ['referral_ready', 'completed'],
      downloadable: true,
      actions: ['download', 'print']
    }
  ];

  // โหลดข้อมูลเอกสารเมื่อเริ่มต้น
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        
        // โหลดข้อมูลจริงจาก API
        const studentResponse = await internshipService.getStudentProfile();
        if (studentResponse.success) {
          setStudentData(studentResponse.data);
        }

        const cs05Response = await internshipService.getCurrentCS05();
        if (cs05Response.success && cs05Response.data) {
          setCs05Data(cs05Response.data);
          
          // โหลดเอกสารที่เกี่ยวข้อง
          const documentsResponse = await internshipService.getInternshipDocuments(cs05Response.data.id);
          if (documentsResponse.success) {
            setDocuments(documentsResponse.data);
          }
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        message.error('ไม่สามารถโหลดข้อมูลเอกสารได้');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // ตรวจสอบว่าเอกสารสามารถเข้าถึงได้หรือไม่
  const canAccessDocument = (docType) => {
    if (!cs05Data) return false;
    return docType.requiredStatus.includes(cs05Data.status);
  };

  // ฟังก์ชันดาวน์โหลดเอกสาร
  const handleDownload = async (docKey, docTitle) => {
    try {
      const response = await internshipService.downloadDocument(cs05Data.id, docKey);
      
      if (response.success) {
        // สร้าง blob และดาวน์โหลด
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${docTitle}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        message.success(`ดาวน์โหลด ${docTitle} เรียบร้อยแล้ว`);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Download error:', error);
      message.error(`ไม่สามารถดาวน์โหลด ${docTitle} ได้`);
    }
  };

  // ฟังก์ชันอัปโหลดเอกสาร
  const handleUpload = (docKey, docTitle) => {
    // นำไปยังหน้าอัปโหลดเอกสาร
    navigate(`/internship/upload/${docKey}`, {
      state: { docTitle, cs05Data }
    });
  };

  // รับสถานะของเอกสาร
  const getDocumentStatus = (docKey, docType) => {
    const doc = documents[docKey];
    
    if (!canAccessDocument(docType)) {
      return { status: 'unavailable', text: 'ยังไม่พร้อมใช้งาน', color: 'default' };
    }
    
    if (doc && doc.available) {
      return { status: 'available', text: 'พร้อมใช้งาน', color: 'success' };
    }
    
    if (docType.actions.includes('upload')) {
      return { status: 'pending_upload', text: 'รออัปโหลด', color: 'warning' };
    }
    
    return { status: 'processing', text: 'กำลังจัดเตรียม', color: 'processing' };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>กำลังโหลดข้อมูลเอกสาร...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 16 }}>
        📄 จัดการเอกสารการฝึกงาน
      </Title>

      {/* แสดงข้อมูลสถานะปัจจุบัน */}
      {cs05Data ? (
        <Card style={{ marginBottom: 24 }}>
          <Alert
            message="ข้อมูลการฝึกงาน"
            description={`บริษัท: ${cs05Data.companyName} | ตำแหน่ง: ${cs05Data.internshipPosition}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Descriptions 
            title="รายละเอียดเอกสาร" 
            bordered 
            column={{ xs: 1, sm: 2, md: 3 }}
            size="small"
          >
            <Descriptions.Item label="วันที่ส่งคำร้อง">
              {dayjs(cs05Data.submittedAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="สถานะปัจจุบัน">
              <Tag color="processing">{cs05Data.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="นักศึกษา">
              {studentData?.fullName} ({studentData?.studentId})
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ) : (
        <Alert
          message="ไม่พบข้อมูลการฝึกงาน"
          description="กรุณาส่งคำร้อง คพ.05 ก่อนเพื่อเข้าถึงเอกสาร"
          type="warning"
          showIcon
          action={
            <Button
              type="primary"
              onClick={() => navigate('/internship-registration/cs05')}
            >
              กรอกคำร้อง คพ.05
            </Button>
          }
          style={{ marginBottom: 24 }}
        />
      )}

      {/* รายการเอกสารทั้งหมด */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>เอกสารการฝึกงาน</Title>
        <Row gutter={[16, 16]}>
          {documentTypes.map((docType) => {
            const docStatus = getDocumentStatus(docType.key, docType);
            const doc = documents[docType.key];

            return (
              <Col xs={24} md={12} lg={8} key={docType.key}>
                <Card
                  size="small"
                  style={{
                    borderColor: docStatus.status === 'available' ? '#52c41a' : '#d9d9d9',
                    backgroundColor: docStatus.status === 'unavailable' ? '#f5f5f5' : 'white'
                  }}
                  actions={
                    docStatus.status === 'available' ? [
                      docType.actions.includes('download') && (
                        <Button
                          type="link"
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownload(docType.key, docType.title)}
                        >
                          ดาวน์โหลด
                        </Button>
                      ),
                      docType.actions.includes('print') && (
                        <Button
                          type="link"
                          icon={<PrinterOutlined />}
                          onClick={() => handleDownload(docType.key, docType.title)}
                        >
                          พิมพ์
                        </Button>
                      )
                    ].filter(Boolean) : docStatus.status === 'pending_upload' ? [
                      <Button
                        type="link"
                        icon={<UploadOutlined />}
                        onClick={() => handleUpload(docType.key, docType.title)}
                      >
                        อัปโหลด
                      </Button>
                    ] : []
                  }
                >
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 32, color: docType.color, marginBottom: 8 }}>
                      {docType.icon}
                    </div>
                    <Title level={5} style={{ margin: 0 }}>
                      {docType.title}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {docType.description}
                    </Text>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <Tag color={docStatus.color}>
                      {docStatus.text}
                    </Tag>
                    {doc?.createdAt && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                        สร้างเมื่อ: {dayjs(doc.createdAt).format('DD/MM/YYYY HH:mm')}
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* Timeline แสดงประวัติเอกสาร */}
      {cs05Data && (
        <Card title="ประวัติการจัดการเอกสาร" style={{ marginBottom: 24 }}>
          <Timeline>
            <Timeline.Item
              dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              color="green"
            >
              <div>
                <Text strong>ส่งคำร้อง คพ.05</Text>
                <div style={{ color: '#666', fontSize: 12 }}>
                  {dayjs(cs05Data.submittedAt).format('DD/MM/YYYY HH:mm')}
                </div>
              </div>
            </Timeline.Item>

            {documents.cooperation_letter && (
              <Timeline.Item
                dot={<DownloadOutlined style={{ color: '#1890ff' }} />}
                color="blue"
              >
                <div>
                  <Text strong>หนังสือขอความอนุเคราะห์พร้อมใช้งาน</Text>
                  <div style={{ color: '#666', fontSize: 12 }}>
                    {dayjs(documents.cooperation_letter.createdAt).format('DD/MM/YYYY HH:mm')}
                  </div>
                </div>
              </Timeline.Item>
            )}

            {documents.referral_letter && (
              <Timeline.Item
                dot={<FileTextOutlined style={{ color: '#722ed1' }} />}
                color="purple"
              >
                <div>
                  <Text strong>หนังสือส่งตัวพร้อมใช้งาน</Text>
                  <div style={{ color: '#666', fontSize: 12 }}>
                    {dayjs(documents.referral_letter.createdAt).format('DD/MM/YYYY HH:mm')}
                  </div>
                </div>
              </Timeline.Item>
            )}

            {['processing', 'submitted', 'under_review'].includes(cs05Data.status) && (
              <Timeline.Item
                dot={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                color="yellow"
              >
                <div>
                  <Text>รอการดำเนินการขั้นตอนถัดไป...</Text>
                </div>
              </Timeline.Item>
            )}
          </Timeline>
        </Card>
      )}

      {/* คำแนะนำการใช้งาน */}
      <Alert
        message="คำแนะนำการใช้งาน"
        description={
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li>เอกสารจะพร้อมใช้งานตามลำดับขั้นตอนการอนุมัติ</li>
            <li>กรุณาดาวน์โหลดและพิมพ์เอกสารก่อนนำไปใช้งาน</li>
            <li>หนังสือขอความอนุเคราะห์ใช้สำหรับติดต่อบริษัท</li>
            <li>หนังสือส่งตัวใช้สำหรับรายงานตัวเริ่มฝึกงาน</li>
            <li>เก็บเอกสารต้นฉบับไว้เป็นหลักฐาน</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* ปุ่มดำเนินการ */}
      <div style={{ textAlign: 'center' }}>
        <Space size="large">
          <Button 
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={() => navigate('/internship/status')}
          >
            ติดตามสถานะ
          </Button>
          
          <Button 
            size="large"
            icon={<HomeOutlined />}
            onClick={() => navigate('/internship')}
          >
            กลับหน้าหลักฝึกงาน
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default InternshipDocumentsPage;