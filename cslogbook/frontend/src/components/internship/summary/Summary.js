import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Space, Button, Statistic, Row, Col, Divider, Alert, Skeleton, Result, message } from 'antd';
import { 
  FilePdfOutlined, 
  PrinterOutlined, 
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  BankOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from '../../../utils/dayjs';
import internshipService from '../../../services/internshipService';
import { useInternship } from '../../../contexts/InternshipContext';
import { DATE_FORMAT_MEDIUM, DATE_TIME_FORMAT } from '../../../utils/constants';
import './InternshipStyles.css';

const { Title, Text, Paragraph } = Typography;

// ข้อมูลจำลองสำหรับทดสอบหน้า UI
const MOCK_SUMMARY_DATA = {
  companyName: 'บริษัท เทคโนโลยี จำกัด',
  companyAddress: '123 ถนนพัฒนาการ แขวงสวนหลวง เขตสวนหลวง กรุงเทพฯ 10250',
  startDate: '2023-06-01',
  endDate: '2023-07-31',
  totalDays: 45,
  totalHours: 320,
  approvedDays: 30,
  supervisorName: 'นายสมชาย เทคโนโลยี',
  supervisorPosition: 'ผู้จัดการฝ่ายพัฒนาซอฟต์แวร์',
  supervisorPhone: '02-123-4567',
  supervisorEmail: 'somchai@tech.co.th',
  learningOutcome: 'ได้เรียนรู้การพัฒนาเว็บแอปพลิเคชันด้วย React และ Node.js, การทำงานร่วมกับทีม, การใช้ Git ในการจัดการโค้ด และการวิเคราะห์ความต้องการของผู้ใช้'
};

// ข้อมูลจำลองตารางบันทึกประจำวัน
const MOCK_LOG_ENTRIES = [
  {
    key: '1',
    date: '1 มิถุนายน 2023',
    timeIn: '09:00',
    timeOut: '17:00',
    hours: 8,
    title: 'ปฐมนิเทศและเรียนรู้ระบบ',
    status: 'approved'
  },
  {
    key: '2',
    date: '2 มิถุนายน 2023',
    timeIn: '08:45',
    timeOut: '17:30',
    hours: 8.75,
    title: 'พัฒนาหน้า Login',
    status: 'approved'
  },
  {
    key: '3',
    date: '5 มิถุนายน 2023',
    timeIn: '09:00',
    timeOut: '18:00',
    hours: 9,
    title: 'แก้ไข Bug และประชุมทีม',
    status: 'approved'
  },
  {
    key: '4',
    date: '6 มิถุนายน 2023',
    timeIn: '08:30',
    timeOut: '17:30',
    hours: 9,
    title: 'พัฒนาระบบจัดการข้อมูลผู้ใช้',
    status: 'pending'
  },
  {
    key: '5',
    date: '7 มิถุนายน 2023',
    timeIn: '09:00',
    timeOut: '17:00',
    hours: 8,
    title: 'ทดสอบระบบและแก้ไขข้อผิดพลาด',
    status: 'pending'
  }
];

const InternshipSummary = () => {
  const navigate = useNavigate();
  const { state } = useInternship();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [logEntries, setLogEntries] = useState([]);
  const [error, setError] = useState(null);
  const [hasCS05, setHasCS05] = useState(true); // ตั้งเป็น true เพื่อข้ามการตรวจสอบ
  const [isCS05Approved, setIsCS05Approved] = useState(true); // ตั้งเป็น true เพื่อข้ามการตรวจสอบ

  // ใช้ข้อมูลจำลองแทนการดึงข้อมูลจริง
  useEffect(() => {
    // จำลองเวลาในการโหลดข้อมูล
    const loadMockData = () => {
      setTimeout(() => {
        setSummaryData(MOCK_SUMMARY_DATA);
        setLogEntries(MOCK_LOG_ENTRIES);
        setLoading(false);
      }, 1000); // จำลองเวลาโหลด 1 วินาที
    };
    
    loadMockData();
    
    // TODO: เมื่อพร้อมใช้งานจริง ให้เปิดใช้โค้ดด้านล่างแทน
    /*
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        
        // ตรวจสอบว่ามี CS05 หรือไม่
        const cs05Response = await internshipService.getCurrentCS05();
        
        if (!cs05Response.success) {
          setHasCS05(false);
          setLoading(false);
          return;
        }
        
        setHasCS05(true);
        
        // ในอนาคตจะเปลี่ยนเป็น 'approved'
        const validStatus = 'pending'; 
        setIsCS05Approved(cs05Response.data.status === validStatus);
        
        if (cs05Response.data.status !== validStatus) {
          setLoading(false);
          return;
        }
        
        // ดึงข้อมูลสรุปการฝึกงาน
        const summaryResponse = await internshipService.getInternshipSummary();
        
        if (summaryResponse.success) {
          setSummaryData(summaryResponse.data);
          
          // ดึงข้อมูลบันทึกประจำวัน
          const entriesResponse = await internshipService.getTimeSheetEntries();
          
          if (entriesResponse.success) {
            // แปลงข้อมูลให้เข้ากับ Table component
            const formattedEntries = entriesResponse.data.map(entry => ({
              key: entry.logId || entry.id,
              date: dayjs(entry.workDate).format(DATE_FORMAT_MEDIUM),
              timeIn: entry.timeIn ? dayjs(entry.timeIn).format('HH:mm') : '-',
              timeOut: entry.timeOut ? dayjs(entry.timeOut).format('HH:mm') : '-',
              hours: entry.hoursWorked || '-',
              title: entry.logTitle || '-',
              status: entry.supervisorApproved ? 'approved' : 'pending',
            }));
            
            setLogEntries(formattedEntries);
          }
        } else {
          setError('ไม่สามารถดึงข้อมูลสรุปการฝึกงานได้');
        }
      } catch (error) {
        console.error('Error fetching summary data:', error);
        setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummaryData();
    */
  }, []);

  const logbookColumns = [
    {
      title: 'วันที่',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: 'เวลาเข้างาน',
      dataIndex: 'timeIn',
      key: 'timeIn',
      width: 100,
    },
    {
      title: 'เวลาออกงาน',
      dataIndex: 'timeOut',
      key: 'timeOut',
      width: 100,
    },
    {
      title: 'ชั่วโมง',
      dataIndex: 'hours',
      key: 'hours',
      width: 80,
    },
    {
      title: 'หัวข้องาน',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'approved' ? 'green' : 'gold'}>
          {status === 'approved' ? 'อนุมัติแล้ว' : 'รอการอนุมัติ'}
        </Tag>
      ),
    }
  ];

  const handleDownloadSummary = () => {
    // TODO: เชื่อมต่อกับ API จริงในอนาคต
    message.info('คุณลักษณะนี้ยังไม่พร้อมใช้งาน (อยู่ระหว่างการพัฒนา)');
    /*
    internshipService.downloadInternshipSummary()
      .then(response => {
        // สร้าง URL สำหรับดาวน์โหลดไฟล์
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'สรุปผลการฝึกงาน.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(error => {
        console.error('Error downloading summary:', error);
        message.error('ไม่สามารถดาวน์โหลดเอกสารได้');
      });
    */
  };

  const handlePrint = () => {
    window.print();
  };

  // แสดง loading state
  if (loading) {
    return (
      <div className="internship-container">
        <div className="internship-card">
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </div>
    );
  }

  // กรณีไม่พบข้อมูล CS05
  if (!hasCS05) {
    return (
      <div className="internship-container">
        <Result
          status="warning"
          icon={<WarningOutlined />}
          title="ยังไม่มีข้อมูลคำร้อง คพ.05"
          subTitle="คุณจำเป็นต้องส่งคำร้อง คพ.05 ก่อนจึงจะสามารถดูสรุปผลการฝึกงานได้"
          extra={
            <Button type="primary" onClick={() => navigate('/internship/register')}>
              ไปที่หน้าส่งคำร้อง คพ.05
            </Button>
          }
        />
      </div>
    );
  }

  // กรณี CS05 ยังไม่ได้รับการอนุมัติ
  if (!isCS05Approved) {
    return (
      <div className="internship-container">
        <Result
          status="info"
          title="คำร้อง คพ.05 ยังไม่ได้รับการอนุมัติ"
          subTitle="คุณจำเป็นต้องรอให้คำร้อง คพ.05 ได้รับการอนุมัติก่อนจึงจะสามารถดูสรุปผลการฝึกงานได้"
          extra={
            <Button type="primary" onClick={() => navigate('/internship/status')}>
              ดูสถานะคำร้อง
            </Button>
          }
        />
      </div>
    );
  }

  // กรณีเกิดข้อผิดพลาด
  if (error) {
    return (
      <div className="internship-container">
        <div className="internship-card">
          <Alert
            message="เกิดข้อผิดพลาด"
            description={error}
            type="error"
            showIcon
          />
        </div>
      </div>
    );
  }

  return (
    <div className="internship-container print-container">
      <div className="internship-card">
        <Title level={3} className="page-title">สรุปผลการฝึกงาน</Title>
        
        {/* สถิติการฝึกงาน */}
        <Row gutter={[16, 16]} className="stats-row no-print-break">
          <Col xs={24} md={12} lg={6}>
            <Card className="status-summary-card total">
              <Statistic 
                title="บริษัท" 
                value={summaryData?.companyName || '-'} 
                valueStyle={{ fontSize: '16px' }}
                prefix={<BankOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card className="status-summary-card completed">
              <Statistic 
                title="วันทำงานทั้งหมด" 
                value={summaryData?.totalDays || 0} 
                suffix="วัน"
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card className="status-summary-card completed">
              <Statistic 
                title="ชั่วโมงทำงานทั้งหมด" 
                value={summaryData?.totalHours || 0} 
                suffix="ชม."
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card className="status-summary-card approved">
              <Statistic 
                title="วันที่ได้รับการอนุมัติ" 
                value={summaryData?.approvedDays || 0} 
                suffix="วัน"
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* ข้อมูลบริษัทและพี่เลี้ยง */}
        <Card title="ข้อมูลสถานประกอบการ" className="summary-section no-print-break" style={{ marginTop: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text strong>ชื่อบริษัท:</Text> {summaryData?.companyName || '-'}
              </div>
              <div className="info-item">
                <Text strong>ที่อยู่:</Text> {summaryData?.companyAddress || '-'}
              </div>
              <div className="info-item">
                <Text strong>ระยะเวลาฝึกงาน:</Text>{' '}
                {summaryData?.startDate && summaryData?.endDate 
                  ? `${dayjs(summaryData.startDate).format(DATE_FORMAT_MEDIUM)} - ${dayjs(summaryData.endDate).format(DATE_FORMAT_MEDIUM)}`
                  : '-'
                }
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text strong>พี่เลี้ยง:</Text> {summaryData?.supervisorName || '-'}
              </div>
              <div className="info-item">
                <Text strong>ตำแหน่ง:</Text> {summaryData?.supervisorPosition || '-'}
              </div>
              <div className= "info-item">
                <Text strong>เบอร์โทร:</Text> {summaryData?.supervisorPhone || '-'}
              </div>
              <div className="info-item">
                <Text strong>อีเมล:</Text> {summaryData?.supervisorEmail || '-'}
              </div>
            </Col>
          </Row>
        </Card>

        {/* ตารางบันทึกประจำวัน */}
        <Card 
          title="ประวัติการบันทึกเวลา" 
          className="logbook-table"
          style={{ marginTop: 24 }}
          extra={
            <Button type="link" onClick={() => navigate('/internship/timesheet')}>
              ดูบันทึกประจำวันทั้งหมด
            </Button>
          }
        >
          <Table 
            columns={logbookColumns}
            dataSource={logEntries}
            pagination={{ pageSize: 5, showSizeChanger: false }}
            rowClassName={(record) => 
              record.status === 'approved' ? 'approved-row' : ''
            }
            locale={{ emptyText: 'ยังไม่มีข้อมูลการบันทึกเวลา' }}
          />
        </Card>

        {/* ส่วนสรุปทักษะที่ได้เรียนรู้ */}
        <Card title="ทักษะที่ได้เรียนรู้" className="skills-section" style={{ marginTop: 24 }}>
          <Paragraph>
            {summaryData?.learningOutcome || 'ยังไม่มีข้อมูลทักษะที่ได้เรียนรู้'}
          </Paragraph>
        </Card>

        {/* ปุ่มดาวน์โหลดเอกสาร */}
        <div className="button-container no-print">
          <Space className="button-group">
            <Button 
              type="primary" 
              icon={<FilePdfOutlined />}
              onClick={handleDownloadSummary}
              disabled={!summaryData || logEntries.length === 0}
            >
              ดาวน์โหลดสรุปการฝึกงาน
            </Button>
            <Button 
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              disabled={!summaryData || logEntries.length === 0}
            >
              พิมพ์เอกสาร
            </Button>
          </Space>
        </div>

        {/* แสดงป้ายกำกับว่าเป็นข้อมูลสาธิต */}
        <Alert 
          message="หมายเหตุ: นี่คือข้อมูลตัวอย่างสำหรับการทดสอบการแสดงผล" 
          description="ข้อมูลนี้เป็นตัวอย่างเพื่อการทดสอบหน้าจอเท่านั้น ไม่ใช่ข้อมูลจริงจากระบบ"
          type="warning" 
          showIcon
          className="no-print"
          style={{ marginTop: 24 }}
        />
      </div>
    </div>
  );
};

export default InternshipSummary;