import React, { useEffect, useState } from 'react';
import {
  Row, Col, Card, Typography, Statistic, Tabs, Table, Tag, Button,
  Progress, Divider, Space, Timeline, Empty, List, Avatar
} from 'antd';
import { 
  ClockCircleOutlined, CalendarOutlined, EnvironmentOutlined, 
  TeamOutlined, TrophyOutlined, FileTextOutlined, PrinterOutlined,
  BarChartOutlined, ProfileOutlined, CheckCircleOutlined,
  LaptopOutlined, BookOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import axios from 'axios';
import './InternshipStyles.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const InternshipSummary = ({ studentId }) => {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [timeRecords, setTimeRecords] = useState([]);
  const [statistics, setStatistics] = useState({
    totalDays: 0,
    totalHours: 0,
    completedPercentage: 0,
    averageHoursPerDay: 0
  });

  useEffect(() => {
    // Fetch data when component mounts
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoint
        const response = await axios.get(`/api/students/${studentId}/internship/summary`);
        setSummaryData(response.data);
        
        // Fetch time records
        const timeResponse = await axios.get(`/api/students/${studentId}/internship/time-records`);
        setTimeRecords(timeResponse.data);
        
        // Calculate statistics
        calculateStatistics(timeResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching internship data:', error);
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [studentId]);

  const calculateStatistics = (records) => {
    if (!records || records.length === 0) return;
    
    // Calculate total days (unique dates)
    const uniqueDates = new Set(records.map(record => format(new Date(record.date), 'yyyy-MM-dd')));
    const totalDays = uniqueDates.size;
    
    // Calculate total hours
    const totalHours = records.reduce((sum, record) => {
      const timeIn = new Date(record.timeIn);
      const timeOut = record.timeOut ? new Date(record.timeOut) : null;
      
      if (!timeOut) return sum;
      
      const hoursWorked = (timeOut - timeIn) / (1000 * 60 * 60);
      return sum + hoursWorked;
    }, 0);
    
    // Assume internship requires 60 days
    const completedPercentage = Math.min(Math.round((totalDays / 60) * 100), 100);
    
    // Average hours per day
    const averageHoursPerDay = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : 0;
    
    setStatistics({
      totalDays,
      totalHours: totalHours.toFixed(1),
      completedPercentage,
      averageHoursPerDay
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Format time records for table display
  const formattedTimeRecords = timeRecords.map(record => ({
    ...record,
    key: record.id,
    date: format(new Date(record.date), 'dd MMM yyyy'),
    timeIn: record.timeIn ? format(new Date(record.timeIn), 'HH:mm') : '-',
    timeOut: record.timeOut ? format(new Date(record.timeOut), 'HH:mm') : '-',
    duration: record.timeOut ? 
      ((new Date(record.timeOut) - new Date(record.timeIn)) / (1000 * 60 * 60)).toFixed(2) + ' hrs' : 
      '-'
  }));

  const timeColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Time In', dataIndex: 'timeIn', key: 'timeIn' },
    { title: 'Time Out', dataIndex: 'timeOut', key: 'timeOut' },
    { title: 'Duration', dataIndex: 'duration', key: 'duration' },
    { 
      title: 'Status', 
      key: 'status', 
      render: (_, record) => (
        <Tag color={record.approved ? 'success' : 'processing'}>
          {record.approved ? 'Approved' : 'Pending'}
        </Tag>
      )
    }
  ];

  // Sample skills data (replace with actual data)
  const skills = [
    { name: 'React', level: 85 },
    { name: 'Node.js', level: 70 },
    { name: 'Database', level: 75 },
    { name: 'UI/UX Design', level: 60 },
    { name: 'Problem Solving', level: 90 }
  ];

  if (loading) {
    return (
      <Card loading={true} className="internship-card">
        Loading internship summary...
      </Card>
    );
  }

  if (!summaryData) {
    return (
      <Card className="internship-card">
        <Empty description="No internship data found" />
      </Card>
    );
  }

  return (
    <div className="internship-container print-container">
      <Row gutter={[0, 24]} className="no-print" style={{ marginBottom: 24 }}>
        <Col span={24} style={{ textAlign: 'right' }}>
          <Button 
            type="primary" 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
          >
            Print Summary
          </Button>
        </Col>
      </Row>

      <Card className="summary-header-card">
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={24} md={12}>
            <Title level={2}>
              Internship Summary
            </Title>
            <Text className="company-name" strong>
              {summaryData.company?.name || 'Not assigned'}
            </Text>
            
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <div className="detail-item">
                  <div className="detail-icon">
                    <CalendarOutlined />
                  </div>
                  <div>
                    <div className="detail-label">Internship Period</div>
                    <div className="detail-value">
                      {summaryData.startDate ? format(new Date(summaryData.startDate), 'dd MMM yyyy') : 'Not started'} - 
                      {summaryData.endDate ? format(new Date(summaryData.endDate), 'dd MMM yyyy') : 'Not finished'}
                    </div>
                  </div>
                </div>
              </Col>
              
              <Col xs={24} md={12}>
                <div className="detail-item">
                  <div className="detail-icon">
                    <EnvironmentOutlined />
                  </div>
                  <div>
                    <div className="detail-label">Location</div>
                    <div className="detail-value">{summaryData.company?.location || 'Not specified'}</div>
                  </div>
                </div>
              </Col>
              
              <Col xs={24} md={12}>
                <div className="detail-item">
                  <div className="detail-icon">
                    <TeamOutlined />
                  </div>
                  <div>
                    <div className="detail-label">Department</div>
                    <div className="detail-value">{summaryData.department || 'Not specified'}</div>
                  </div>
                </div>
              </Col>
              
              <Col xs={24} md={12}>
                <div className="detail-item">
                  <div className="detail-icon">
                    <ProfileOutlined />
                  </div>
                  <div>
                    <div className="detail-label">Position</div>
                    <div className="detail-value">{summaryData.position || 'Not specified'}</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Row gutter={[24, 24]} className="stats-row">
              <Col xs={12} sm={12}>
                <Card className="status-card">
                  <Statistic
                    title="Days Completed"
                    value={statistics.totalDays}
                    suffix="/ 60 days"
                    precision={0}
                  />
                  <Progress percent={statistics.completedPercentage} status="active" />
                </Card>
              </Col>
              
              <Col xs={12} sm={12}>
                <Card className="status-card">
                  <Statistic
                    title="Total Hours"
                    value={statistics.totalHours}
                    suffix="hrs"
                  />
                  <Text type="secondary">Avg {statistics.averageHoursPerDay} hrs/day</Text>
                </Card>
              </Col>

              <Col xs={24} sm={24} style={{ marginTop: 10 }}>
                <Card className="status-card">
                  <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Statistic 
                      title="Supervisor" 
                      value={summaryData.supervisor?.name || 'Not assigned'} 
                      valueStyle={{ fontSize: '16px' }}
                    />
                    {summaryData.status && (
                      <Tag color={
                        summaryData.status === 'Completed' ? 'success' : 
                        summaryData.status === 'In Progress' ? 'processing' :
                        'default'
                      }>
                        {summaryData.status}
                      </Tag>
                    )}
                  </Space>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="1" className="tab-container">
        <TabPane tab={<span><ClockCircleOutlined /> Attendance Records</span>} key="1">
          <Card title="Time Records">
            <Table 
              dataSource={formattedTimeRecords} 
              columns={timeColumns} 
              rowClassName={(record) => record.approved ? 'approved-row' : ''}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
        
        <TabPane tab={<span><FileTextOutlined /> Learning Outcomes</span>} key="2">
          <Row gutter={[24, 24]}>
            <Col xs={24} md={16}>
              <Card title="Learning Experience" className="learning-outcome">
                <Paragraph>
                  {summaryData.learningOutcome || 'No learning outcomes have been recorded yet.'}
                </Paragraph>
                
                <Divider />
                
                <Title level={4}>Key Projects</Title>
                {summaryData.projects && summaryData.projects.length > 0 ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={summaryData.projects}
                    renderItem={(item, index) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<LaptopOutlined />} />}
                          title={item.name}
                          description={item.description}
                        />
                        {item.technologies && (
                          <div>
                            {item.technologies.split(',').map(tech => (
                              <Tag color="blue" key={tech.trim()}>
                                {tech.trim()}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No projects recorded" />
                )}
                
                <Divider />
                
                <Title level={4}>Challenges & Solutions</Title>
                <Paragraph>
                  {summaryData.challenges || 'No challenges have been recorded yet.'}
                </Paragraph>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card title="Skills Development" className="skill-summary-card">
                <div style={{ marginBottom: 20 }}>
                  <Title level={5}>Skills Improvement</Title>
                  {skills.map(skill => (
                    <div key={skill.name} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text>{skill.name}</Text>
                        <Text>{skill.level}%</Text>
                      </div>
                      <Progress percent={skill.level} size="small" />
                    </div>
                  ))}
                </div>
              </Card>
              
              <Card title="Supervisor Feedback" className="skill-card" style={{ marginTop: 24 }}>
                {summaryData.feedback ? (
                  <>
                    <Paragraph>
                      <Text italic>"{summaryData.feedback}"</Text>
                    </Paragraph>
                    <div style={{ textAlign: 'right' }}>
                      <Text strong>
                        - {summaryData.supervisor?.name || 'Supervisor'}
                      </Text>
                    </div>
                  </>
                ) : (
                  <Empty description="No feedback provided yet" />
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab={<span><BarChartOutlined /> Performance</span>} key="3">
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Card title="Internship Milestones">
                <Timeline mode="left">
                  <Timeline.Item dot={<CheckCircleOutlined style={{ fontSize: '16px' }} />} color="green">
                    First Day - {summaryData.startDate ? format(new Date(summaryData.startDate), 'dd MMM yyyy') : 'Not started'}
                  </Timeline.Item>
                  
                  <Timeline.Item dot={<BookOutlined style={{ fontSize: '16px' }} />} color="blue">
                    Mid-term Evaluation - {summaryData.midtermDate ? format(new Date(summaryData.midtermDate), 'dd MMM yyyy') : 'Not scheduled'}
                  </Timeline.Item>
                  
                  <Timeline.Item dot={<TrophyOutlined style={{ fontSize: '16px' }} />} color={summaryData.status === 'Completed' ? 'green' : 'gray'}>
                    Final Evaluation - {summaryData.endDate ? format(new Date(summaryData.endDate), 'dd MMM yyyy') : 'Not completed'}
                  </Timeline.Item>
                </Timeline>
                
                <Divider />
                
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={8}>
                    <Card className="status-card">
                      <Statistic
                        title="Attendance"
                        value={summaryData.attendanceScore || 'N/A'}
                        suffix="/ 100"
                      />
                    </Card>
                  </Col>
                  
                  <Col xs={24} sm={8}>
                    <Card className="status-card">
                      <Statistic
                        title="Performance"
                        value={summaryData.performanceScore || 'N/A'}
                        suffix="/ 100"
                      />
                    </Card>
                  </Col>
                  
                  <Col xs={24} sm={8}>
                    <Card className="status-card">
                      <Statistic
                        title="Overall Grade"
                        valueStyle={{ color: '#3f8600' }}
                        value={summaryData.overallGrade || 'N/A'}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default InternshipSummary;