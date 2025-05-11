import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Table, Tag, Space, Button, Statistic, Row, Col, 
  Divider, Alert, Skeleton, Result, message, Progress, Avatar, Timeline,
  List, Badge, Tabs, Empty, Tooltip, notification
} from 'antd';
import { 
  FilePdfOutlined, 
  PrinterOutlined, 
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  BankOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  LaptopOutlined,
  BookOutlined,
  BarChartOutlined,
  ScheduleOutlined,
  FileTextOutlined,
  TrophyOutlined,
  RiseOutlined,
  DotChartOutlined,
  AppstoreOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  CarryOutOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from '../../../utils/dayjs';
import internshipService from '../../../services/internshipService';
import { useInternship } from '../../../contexts/InternshipContext';
import { DATE_FORMAT_MEDIUM, DATE_TIME_FORMAT } from '../../../utils/constants';
import './InternshipStyles.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const InternshipSummary = () => {
  const navigate = useNavigate();
  const { state } = useInternship();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [logEntries, setLogEntries] = useState([]);
  const [error, setError] = useState(null);
  const [hasCS05, setHasCS05] = useState(false);
  const [isCS05Approved, setIsCS05Approved] = useState(false);
  const [totalApprovedHours, setTotalApprovedHours] = useState(0);
  const [activeTab, setActiveTab] = useState('1');
  
  const [weeklyData, setWeeklyData] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [skillTags, setSkillTags] = useState([]);
  const [completionStatus, setCompletionStatus] = useState({
    percentage: 0,
    status: 'normal'
  });

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
        
      // ตรวจสอบว่ามีเอกสาร CS05 ที่อนุมัติแล้วหรือไม่
      const cs05Response = await internshipService.getCurrentCS05();
      
      if (!cs05Response.success) {
        setHasCS05(false);
        setLoading(false);
        return;
      }
      
      setHasCS05(true);
      setIsCS05Approved(cs05Response.data.status === 'approved');
      
      if (cs05Response.data.status !== 'approved') {
        setLoading(false);
        return;
      }
      
      // ดึงข้อมูลสรุปการฝึกงาน
      const summaryResponse = await internshipService.getInternshipSummary();
      
      if (summaryResponse.success) {
        setSummaryData(summaryResponse.data);
        
        // ดึงข้อมูลบันทึกเวลาทั้งหมด
        const entriesResponse = await internshipService.getTimeSheetEntries();
        
        if (entriesResponse.success) {
          // แปลงข้อมูลให้อยู่ในรูปแบบที่ใช้งานได้
          const formattedEntries = entriesResponse.data.map(entry => ({
            key: entry.logId || entry.id,
            date: dayjs(entry.workDate).format(DATE_FORMAT_MEDIUM),
            dayName: getThaiDayName(dayjs(entry.workDate)),
            timeIn: entry.timeIn ? entry.timeIn : '-',
            timeOut: entry.timeOut ? entry.timeOut : '-',
            hours: entry.workHours || '-',
            title: entry.logTitle || '-',
            description: entry.workDescription || '-',
            learningOutcome: entry.learningOutcome || '-',
            status: entry.supervisorApproved ? 'approved' : 'pending',
            weekNumber: dayjs(entry.workDate).week(),
            createdAt: entry.createdAt || entry.created_at
          }));
          
          setLogEntries(formattedEntries);

          // คำนวณชั่วโมงที่ได้รับการอนุมัติทั้งหมด
          const approved = entriesResponse.data.filter(entry => entry.supervisorApproved);
          const totalHours = approved.reduce((sum, entry) => sum + (Number(entry.workHours) || 0), 0);
          setTotalApprovedHours(totalHours);
          
          // สร้างข้อมูลรายสัปดาห์
          prepareWeeklyData(formattedEntries);
          
          // วิเคราะห์ทักษะที่ได้เรียนรู้
          extractSkillCategories(formattedEntries);

          // คำนวณสถานะความสำเร็จ
          calculateCompletionStatus(totalHours);
          
          // แยกแท็กทักษะจากการบันทึก
          extractSkillTags(formattedEntries);
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
  
  const calculateCompletionStatus = (hours) => {
    const percentage = Math.min(Math.round((hours / 240) * 100), 100);
    let status = 'normal';
    
    if (percentage >= 100) {
      status = 'success';
    } else if (percentage >= 75) {
      status = 'active';
    } else if (percentage >= 50) {
      status = 'normal';
    } else {
      status = 'exception';
    }
    
    setCompletionStatus({ percentage, status });
  };

  const extractSkillTags = (entries) => {
    // คำศัพท์ที่เกี่ยวข้องกับทักษะต่างๆ
    const skillKeywordMap = {
      'Programming': ['coding', 'programming', 'development', 'เขียนโปรแกรม', 'เขียนโค้ด', 'พัฒนา', 'code', 'โค้ด', 'software'],
      'Frontend': ['frontend', 'css', 'html', 'javascript', 'react', 'vue', 'angular', 'ui', 'ux'],
      'Backend': ['backend', 'api', 'server', 'database', 'sql', 'nosql', 'rest'],
      'DevOps': ['devops', 'docker', 'kubernetes', 'ci/cd', 'pipeline', 'deploy'],
      'Data': ['data', 'analytics', 'visualization', 'dashboard', 'report'],
      'Mobile': ['mobile', 'android', 'ios', 'flutter', 'react native'],
      'Design': ['design', 'ui/ux', 'wireframe', 'prototype', 'ออกแบบ'],
      'Testing': ['testing', 'test', 'qa', 'quality', 'ทดสอบ'],
      'Agile': ['agile', 'scrum', 'sprint', 'kanban', 'jira'],
      'Communication': ['communication', 'presentation', 'meeting', 'ประชุม', 'นำเสนอ', 'สื่อสาร'],
      'Teamwork': ['team', 'teamwork', 'collaboration', 'ทีม', 'ร่วมกัน'],
      'Project Management': ['project', 'management', 'timeline', 'deadline', 'โครงการ', 'บริหาร'],
      'Research': ['research', 'analysis', 'วิจัย', 'วิเคราะห์'],
      'Cloud': ['cloud', 'aws', 'azure', 'gcp', 'serverless'],
      'Security': ['security', 'authentication', 'authorization', 'encryption', 'ความปลอดภัย'],
    };
    
    // นับความถี่ของคำศัพท์
    const tagsCount = {};
    
    entries.forEach(entry => {
      const combinedText = `${entry.title} ${entry.description || ''} ${entry.learningOutcome || ''}`.toLowerCase();
      
      Object.entries(skillKeywordMap).forEach(([category, keywords]) => {
        const matched = keywords.some(keyword => combinedText.includes(keyword.toLowerCase()));
        if (matched) {
          tagsCount[category] = (tagsCount[category] || 0) + 1;
        }
      });
    });
    
    // สร้างแท็กจากความถี่
    const tags = Object.entries(tagsCount)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count], index) => ({
        name: tag,
        count,
        color: getTagColor(index)
      }));
    
    setSkillTags(tags);
  };
  
  const getTagColor = (index) => {
    const colors = ['#108ee9', '#2db7f5', '#87d068', '#722ed1', '#eb2f96', '#f50', '#13c2c2', '#fa8c16', '#1890ff'];
    return colors[index % colors.length];
  };
  
  const prepareWeeklyData = (entries) => {
    const weeklyStats = {};
    
    entries.forEach(entry => {
      const weekNumber = entry.weekNumber || dayjs(entry.date, DATE_FORMAT_MEDIUM).week();
      if (!weeklyStats[weekNumber]) {
        weeklyStats[weekNumber] = {
          week: `สัปดาห์ที่ ${weekNumber} `,
          totalHours: 0,
          approvedHours: 0,
          days: 0,
          entries: [],
          startDate: null,
          endDate: null
        };
      }
      
      weeklyStats[weekNumber].days += 1;
      weeklyStats[weekNumber].entries.push(entry);
      
      const currentDate = dayjs(entry.date, DATE_FORMAT_MEDIUM);
      if (!weeklyStats[weekNumber].startDate || currentDate.isBefore(weeklyStats[weekNumber].startDate)) {
        weeklyStats[weekNumber].startDate = currentDate;
      }
      if (!weeklyStats[weekNumber].endDate || currentDate.isAfter(weeklyStats[weekNumber].endDate)) {
        weeklyStats[weekNumber].endDate = currentDate;
      }
      
      const hours = parseFloat(entry.hours) || 0;
      weeklyStats[weekNumber].totalHours += hours;
      
      if (entry.status === 'approved') {
        weeklyStats[weekNumber].approvedHours += hours;
      }
    });
    
    const formattedWeeklyData = Object.values(weeklyStats)
      .sort((a, b) => a.week.localeCompare(b.week))
      .map(week => ({
        ...week,
        totalHours: Math.round(week.totalHours * 10) / 10,
        approvedHours: Math.round(week.approvedHours * 10) / 10,
        dateRange: week.startDate && week.endDate ? 
          `${week.startDate.format(DATE_FORMAT_MEDIUM)} - ${week.endDate.format(DATE_FORMAT_MEDIUM)}` : 
          '-'
      }));
    
    setWeeklyData(formattedWeeklyData);
  };
  
  const extractSkillCategories = (entries) => {
    const skillKeywords = {
      'การเขียนโค้ดและพัฒนา': ['coding', 'programming', 'development', 'เขียนโปรแกรม', 'พัฒนา', 'code', 'โค้ด', 'software'],
      'การทำงานร่วมกับทีม': ['teamwork', 'collaboration', 'ทีม', 'ร่วมกัน', 'ประชุม', 'meeting'],
      'การติดต่อลูกค้า': ['customer', 'client', 'ลูกค้า', 'ผู้ใช้', 'user', 'requirement'],
      'การวิเคราะห์และออกแบบ': ['design', 'analysis', 'วิเคราะห์', 'ออกแบบ', 'architecture', 'structure'],
      'การใช้เทคโนโลยีใหม่': ['tool', 'technology', 'framework', 'เครื่องมือ', 'เทคโนโลยี', 'library'],
      'การแก้ไขปัญหา': ['problem', 'solution', 'fix', 'debug', 'แก้ไข', 'ปัญหา', 'bug', 'error'],
      'การบริหารโครงการ': ['project', 'management', 'timeline', 'deadline', 'โครงการ', 'บริหาร'],
      'การทดสอบซอฟต์แวร์': ['test', 'testing', 'qa', 'quality', 'ทดสอบ', 'คุณภาพ'],
    };
    
    const skillCounts = Object.keys(skillKeywords).reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});
    skillCounts['อื่นๆ'] = 0;
    
    entries.forEach(entry => {
      let foundMatch = false;
      const combinedText = (entry.title + ' ' + (entry.description || '') + ' ' + (entry.learningOutcome || '')).toLowerCase();
      
      Object.entries(skillKeywords).forEach(([category, keywords]) => {
        const matched = keywords.some(keyword => 
          combinedText.includes(keyword.toLowerCase())
        );
        if (matched) {
          skillCounts[category]++;
          foundMatch = true;
        }
      });
      
      if (!foundMatch) {
        skillCounts['อื่นๆ']++;
      }
    });
    
    const formattedSkills = Object.entries(skillCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / entries.length) * 100),
      }));
    
    setSkillCategories(formattedSkills);
  };

  const getThaiDayName = (date) => {
    const thaiDays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    return thaiDays[date.day()];
  };

  const logbookColumns = [
    {
      title: 'วันที่',
      key: 'dateInfo',
      width: 150,
      render: (text, record) => (
        <span>
          <div><Text strong>{record.dayName}</Text></div>
          <div>{record.date}</div>
        </span>
      )
    },
    {
      title: 'เวลาทำงาน',
      key: 'time',
      width: 150,
      render: (_, record) => (
        <span>
          <div>{record.timeIn} - {record.timeOut}</div>
          <div>
            <Tag color={record.status === 'approved' ? 'green' : 'blue'}>
              {record.hours} ชม.
            </Tag>
          </div>
        </span>
      )
    },
    {
      title: 'หัวข้องาน',
      dataIndex: 'title',
      key: 'title',
      ellipsis: { showTitle: false },
      render: title => (
        <Tooltip placement="topLeft" title={title}>
          {title}
        </Tooltip>
      )
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'approved' ? 'green' : 'gold'} icon={status === 'approved' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}>
          {status === 'approved' ? 'อนุมัติแล้ว' : 'รอการอนุมัติ'}
        </Tag>
      ),
    }
  ];
  
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleDownloadSummary = () => {
    message.loading('กำลังดาวน์โหลดเอกสาร...');
    
    internshipService.downloadInternshipSummary()
      .then(response => {
        if (!response.success) {
          notification.info({
            message: 'คุณลักษณะนี้อยู่ระหว่างการพัฒนา',
            description: 'ขออภัย ฟังก์ชันการดาวน์โหลดเอกสารสรุปยังไม่พร้อมใช้งานในขณะนี้',
            duration: 4
          });
          return;
        }
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'สรุปผลการฝึกงาน.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        message.success('ดาวน์โหลดเอกสารสำเร็จ');
      })
      .catch(error => {
        console.error('Error downloading summary:', error);
        message.error('ไม่สามารถดาวน์โหลดเอกสารได้');
      });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="internship-container">
        <Card className="summary-card">
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </div>
    );
  }

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

  if (error) {
    return (
      <div className="internship-container">
        <Alert
          message="เกิดข้อผิดพลาด"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="internship-summary-container print-container">
      {/* Header Card แสดงข้อมูลสรุปหลัก */}
      <Card 
        className="summary-header-card"
        bordered={false}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={16}>
            <div className="summary-header">
              <div className="company-logo-placeholder">
                <BankOutlined style={{ fontSize: 36 }} />
              </div>
              <div className="summary-title">
                <Title level={2} style={{ marginBottom: 8 }}>สรุปผลการฝึกงาน</Title>
                <Title level={4} style={{ marginTop: 0, marginBottom: 16, fontWeight: 'normal' }} type="secondary">
                  {summaryData?.companyName || '-'}
                </Title>
                
                <Space size="large" wrap style={{ marginBottom: 16 }}>
                  <Badge 
                    status={totalApprovedHours >= 240 ? "success" : "processing"} 
                    text={
                      <Text style={{ fontSize: 16 }}>
                        {totalApprovedHours >= 240 ? 
                          'ครบตามเกณฑ์ที่กำหนด' : 
                          'อยู่ระหว่างการฝึกงาน'
                        }
                      </Text>
                    } 
                  />
                  
                  <Text>
                    <CalendarOutlined /> ระยะเวลา: {summaryData?.startDate && summaryData?.endDate 
                      ? `${dayjs(summaryData.startDate).format(DATE_FORMAT_MEDIUM)} - ${dayjs(summaryData.endDate).format(DATE_FORMAT_MEDIUM)}`
                      : '-'
                    }
                  </Text>
                </Space>

                <div className="skill-tags" style={{ marginTop: 16 }}>
                  {skillTags.slice(0, 8).map((tag, index) => (
                    <Tag key={index} color={tag.color}>
                      {tag.name}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
          </Col>
          
          <Col xs={24} lg={8}>
            <div className="progress-container">
              <Progress
                type="dashboard"
                percent={completionStatus.percentage}
                status={completionStatus.status}
                format={() => (
                  <div className="dashboard-inner">
                    <div className="dashboard-title">ความคืบหน้า</div>
                    <div className="dashboard-value">{totalApprovedHours}<span className="dashboard-unit">ชม.</span></div>
                    <div className="dashboard-subtitle">จาก 240 ชั่วโมง</div>
                  </div>
                )}
                width={180}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* แท็บแสดงข้อมูลต่างๆ */}
      <div className="summary-tabs" style={{ marginTop: 24 }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange} 
          type="card"
          size="large"
          tabBarStyle={{ marginBottom: 24 }}
          tabBarGutter={12}
        >
          {/* แท็บภาพรวม */}
          <TabPane 
            tab={<span><BarChartOutlined />ภาพรวม</span>} 
            key="1"
          >
            {/* การ์ดแสดงสถิติทั่วไป */}
            <Row gutter={[16, 16]} className="stats-row">
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card" bordered={false}>
                  <Statistic 
                    title="วันทำงานทั้งหมด" 
                    value={logEntries.length} 
                    suffix="วัน"
                    prefix={<CalendarOutlined className="stat-icon" />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card" bordered={false}>
                  <Statistic 
                    title="ชั่วโมงทำงานทั้งหมด" 
                    value={logEntries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0)} 
                    suffix="ชม."
                    precision={1}
                    prefix={<ClockCircleOutlined className="stat-icon" />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card" bordered={false}>
                  <Statistic 
                    title="วันที่ได้รับการอนุมัติ" 
                    value={logEntries.filter(entry => entry.status === 'approved').length} 
                    suffix="วัน"
                    prefix={<CheckCircleOutlined className="stat-icon" />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card" bordered={false}>
                  <Statistic 
                    title="ชั่วโมงที่ได้รับการอนุมัติ" 
                    value={totalApprovedHours} 
                    suffix="ชม."
                    precision={1}
                    prefix={<CheckCircleOutlined className="stat-icon" />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* การ์ดแสดงข้อมูลสำคัญ */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {/* ข้อมูลบริษัท */}
              <Col xs={24} md={12}>
                <Card 
                  title={<><BankOutlined /> ข้อมูลสถานประกอบการ</>}
                  className="info-card"
                  bordered={false}
                >
                  <div className="info-item">
                    <div className="info-label"><BankOutlined /> ชื่อบริษัท:</div>
                    <div className="info-value">{summaryData?.companyName || '-'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label"><EnvironmentOutlined /> ที่อยู่:</div>
                    <div className="info-value">{summaryData?.companyAddress || '-'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label"><UserOutlined /> พี่เลี้ยง:</div>
                    <div className="info-value">{summaryData?.supervisorName || '-'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label"><TeamOutlined /> ตำแหน่ง:</div>
                    <div className="info-value">{summaryData?.supervisorPosition || '-'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label"><PhoneOutlined /> ติดต่อ:</div>
                    <div className="info-value">
                      {summaryData?.supervisorPhone || '-'} / {summaryData?.supervisorEmail || '-'}
                    </div>
                  </div>
                </Card>
              </Col>

              {/* ทักษะที่ได้เรียนรู้ */}
              <Col xs={24} md={12}>
                <Card 
                  title={<><BookOutlined /> ทักษะที่ได้เรียนรู้</>}
                  className="skills-card"
                  bordered={false}
                >
                  {skillCategories.length > 0 ? (
                    <div>
                      {skillCategories.slice(0, 5).map((skill, index) => (
                        <div key={index} className="skill-progress-item">
                          <div className="skill-info">
                            <span className="skill-name">{skill.category}</span>
                            <span className="skill-percentage">{skill.percentage}%</span>
                          </div>
                          <Progress 
                            percent={skill.percentage} 
                            status="normal" 
                            strokeColor={getSkillColor(skill.percentage)} 
                            showInfo={false}
                            size="small" 
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description="ยังไม่มีข้อมูลทักษะที่ได้เรียนรู้" />
                  )}
                </Card>
              </Col>
            </Row>

            {/* การ์ดแสดงข้อมูลรายสัปดาห์ */}
            <Card 
              title={<><ScheduleOutlined /> ข้อมูลรายสัปดาห์</>} 
              style={{ marginTop: 16 }}
              bordered={false}
              className="weekly-card"
            >
              {weeklyData.length > 0 ? (
                <Timeline>
                  {weeklyData.map((week, index) => (
                    <Timeline.Item 
                      key={index}
                      color={week.approvedHours >= 40 ? 'green' : 'blue'}
                      dot={week.approvedHours >= 40 ? 
                        <SafetyCertificateOutlined style={{ fontSize: '16px' }} /> : 
                        <ClockCircleOutlined style={{ fontSize: '16px' }} />}
                    >
                      <Card 
                        className="weekly-item-card"
                        size="small"
                        title={
                          <div className="weekly-title">
                            <span className="week-name">{week.week}</span>
                            <span className="week-date">{week.dateRange}</span>
                          </div>
                        }
                        extra={
                          <Space>
                            <Tag color="blue">{week.days} วันทำงาน</Tag>
                            <Tag color={week.approvedHours >= 40 ? 'green' : 'gold'}>
                              {week.approvedHours}/{week.totalHours} ชั่วโมง
                            </Tag>
                          </Space>
                        }
                      >
                        <List
                          size="small"
                          dataSource={week.entries.slice(0, 3)}
                          renderItem={item => (
                            <List.Item>
                              <div className="weekly-log-item">
                                <span className="log-date">{item.date}</span>
                                <span className="log-title">{item.title}</span>
                                <Tag color={item.status === 'approved' ? 'green' : 'blue'} size="small">
                                  {item.hours} ชม.
                                </Tag>
                              </div>
                            </List.Item>
                          )}
                        />
                        {week.entries.length > 3 && (
                          <div className="more-entries">
                            <Text type="secondary">
                              + อีก {week.entries.length - 3} รายการ
                            </Text>
                          </div>
                        )}
                      </Card>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Empty description="ยังไม่มีข้อมูลรายสัปดาห์" />
              )}
            </Card>
          </TabPane>
          
          {/* แท็บบันทึกประจำวัน */}
          <TabPane 
            tab={<span><FileTextOutlined />บันทึกประจำวัน</span>}
            key="2"
          >
            <Card 
              className="logbook-card"
              bordered={false}
              title={<>
                <FileProtectOutlined /> บันทึกการทำงาน
                <div className="card-subtitle">
                  บันทึกการทำงานทั้งหมด {logEntries.length} วัน / {totalApprovedHours} ชั่วโมง
                </div>
              </>}
              extra={
                <Button 
                  type="primary" 
                  onClick={() => navigate('/internship/timesheet')}
                >
                  จัดการบันทึกประจำวัน
                </Button>
              }
            >
              <Table 
                columns={logbookColumns}
                dataSource={logEntries}
                pagination={{ 
                  pageSize: 10, 
                  showSizeChanger: true, 
                  pageSizeOptions: ['10', '20', '50'],
                  showTotal: (total) => `ทั้งหมด ${total} รายการ` 
                }}
                rowClassName={(record) => record.status === 'approved' ? 'approved-row' : ''}
                locale={{ emptyText: 'ยังไม่มีข้อมูลการบันทึกเวลา' }}
              />
            </Card>
          </TabPane>
          
          {/* แท็บทักษะที่ได้เรียนรู้ */}
          <TabPane 
            tab={<span><RiseOutlined />ทักษะและการพัฒนา</span>}
            key="3"
          >
            <Card bordered={false} className="skills-analysis-card">
              <Title level={4}>สรุปทักษะและความรู้ที่ได้รับจากการฝึกงาน</Title>
              
              {summaryData?.learningOutcome ? (
                <>
                  <Card 
                    type="inner" 
                    className="learning-outcome-card" 
                    bordered={false}
                  >
                    <Paragraph>
                      {summaryData.learningOutcome}
                    </Paragraph>
                  </Card>
                  
                  <Divider>
                    <span className="divider-title">
                      <TrophyOutlined /> ทักษะที่ได้พัฒนา
                    </span>
                  </Divider>
                  
                  <Row gutter={[24, 24]}>
                    {skillCategories.map((skill, index) => (
                      <Col xs={24} sm={12} md={8} key={index}>
                        <Card 
                          className="skill-card" 
                          bordered={false}
                        >
                          <Statistic 
                            title={skill.category}
                            value={skill.percentage}
                            suffix="%"
                            valueStyle={{ color: getSkillColor(skill.percentage) }}
                          />
                          <Progress 
                            percent={skill.percentage} 
                            status="active" 
                            strokeColor={getSkillColor(skill.percentage)} 
                          />
                          <div className="skill-count">พบในบันทึกการทำงาน {skill.count} ครั้ง</div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  
                  <Divider>
                    <span className="divider-title">
                      <AppstoreOutlined /> แท็กทักษะและความรู้
                    </span>
                  </Divider>
                  
                  <div className="skill-tags-cloud">
                    {skillTags.map((tag, index) => (
                      <Tag 
                        key={index} 
                        color={tag.color}
                        style={{ 
                          fontSize: Math.max(12, Math.min(18, 14 + tag.count/2)), 
                          padding: '8px 12px',
                          margin: '5px'
                        }}
                      >
                        {tag.name} ({tag.count})
                      </Tag>
                    ))}
                  </div>
                </>
              ) : (
                <Empty 
                  description="ยังไม่มีข้อมูลทักษะและการเรียนรู้" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                />
              )}
            </Card>
          </TabPane>
          
          {/* แท็บความสำเร็จ */}
          <TabPane 
            tab={<span><AuditOutlined />ความสำเร็จ</span>}
            key="4"
          >
            <Card bordered={false} className="achievement-card">
              <div className="achievement-header">
                <div className="achievement-icon">
                  {completionStatus.percentage >= 100 ? (
                    <SafetyCertificateOutlined style={{ fontSize: 64, color: '#52c41a' }} />
                  ) : (
                    <CarryOutOutlined style={{ fontSize: 64, color: '#1890ff' }} />
                  )}
                </div>
                <div className="achievement-title">
                  <Title level={3}>
                    {completionStatus.percentage >= 100 ? 
                      'ผ่านการฝึกงานครบตามเกณฑ์' : 
                      'ความคืบหน้าในการฝึกงาน'
                    }
                  </Title>
                  <Paragraph>
                    {completionStatus.percentage >= 100 ? 
                      'คุณได้ทำการฝึกงานครบตามเกณฑ์ 240 ชั่วโมงที่กำหนดแล้ว' : 
                      `ปัจจุบันคุณมีชั่วโมงฝึกงานที่ได้รับการอนุมัติ ${totalApprovedHours} ชั่วโมง จากทั้งหมด 240 ชั่วโมง`
                    }
                  </Paragraph>
                </div>
              </div>
              
              <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
                <Col span={24}>
                  <Progress
                    percent={completionStatus.percentage}
                    status={completionStatus.status}
                    strokeWidth={20}
                    format={percent => `${percent}%`}
                  />
                  <div className="hours-labels">
                    <span>0 ชั่วโมง</span>
                    <span>240 ชั่วโมง</span>
                  </div>
                </Col>
              </Row>
              
              <Divider>สรุปผลการฝึกงาน</Divider>
              
              <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                  <Card className="summary-metric-card">
                    <Statistic
                      title="จำนวนวันที่ฝึกงาน"
                      value={logEntries.length}
                      suffix="วัน"
                      prefix={<CalendarOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                    <div className="metric-subtitle">
                      จากทั้งหมด {calcDateDiff(summaryData?.startDate, summaryData?.endDate)} วัน
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card className="summary-metric-card">
                    <Statistic
                      title="จำนวนชั่วโมงที่ได้รับการอนุมัติ"
                      value={totalApprovedHours}
                      suffix="ชม."
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                    <div className="metric-subtitle">
                      คิดเป็น {Math.round((totalApprovedHours / 240) * 100)}% ของเป้าหมาย
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card className="summary-metric-card">
                    <Statistic
                      title="จำนวนสัปดาห์ที่ฝึกงาน"
                      value={weeklyData.length}
                      suffix="สัปดาห์"
                      prefix={<ScheduleOutlined />}
                      valueStyle={{ color: '#722ed1' }}
                    />
                    <div className="metric-subtitle">
                      เฉลี่ย {Math.round(totalApprovedHours / weeklyData.length || 1)} ชั่วโมง/สัปดาห์
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </TabPane>
        </Tabs>
      </div>
        
      {/* ปุ่มดาวน์โหลดและพิมพ์ */}
      <div className="summary-actions no-print">
        <Space>
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
    </div>
  );
};

function calcDateDiff(startDate, endDate) {
  if (!startDate || !endDate) return '-';
  
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  return end.diff(start, 'day') + 1;
}

function getSkillColor(percentage) {
  if (percentage >= 70) return '#52c41a';
  if (percentage >= 40) return '#1890ff';
  return '#faad14';
}

export default InternshipSummary;