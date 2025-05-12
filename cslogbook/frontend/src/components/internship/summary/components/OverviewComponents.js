import React from 'react';
import { Card, Row, Col, Statistic, Progress, List, Timeline, Tag, Empty, Space } from 'antd';
import { 
  SafetyCertificateOutlined, 
  ClockCircleOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

// นำเข้า CSS
import '../styles/OverviewComponents.css';

/**
 * Component แสดงข้อมูลรายสัปดาห์
 * @param {Object} props
 * @param {Array} props.weeklyData ข้อมูลรายสัปดาห์
 */
const WeeklyOverview = ({ weeklyData }) => {
  if (!weeklyData || weeklyData.length === 0) {
    return (
      <Card 
        title={<><ScheduleOutlined /> ข้อมูลรายสัปดาห์</>} 
        style={{ marginTop: 16 }}
        bordered={false}
        className="weekly-card"
      >
        <Empty description="ยังไม่มีข้อมูลรายสัปดาห์" />
      </Card>
    );
  }

  return (
    <Card 
      title={<><ScheduleOutlined /> ข้อมูลรายสัปดาห์</>} 
      style={{ marginTop: 16 }}
      bordered={false}
      className="weekly-card"
    >
      <Timeline mode="left">
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
                <Space size="small">
                  <Tag color="blue">{week.days} วันทำงาน</Tag>
                  <Tag color={week.approvedHours >= 40 ? 'green' : 'gold'}>
                    {week.approvedHours}/{week.totalHours} ชั่วโมง
                  </Tag>
                </Space>
              }
            >              <List
                size="small"
                dataSource={week.entries.slice(0, 3)}
                renderItem={item => (
                  <List.Item>
                    <div className="weekly-log-item" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span className="log-date">{item.date || dayjs(item.workDate).format('D MMM YYYY')}</span>
                        <Tag color={(item.status === 'approved' || item.supervisorApproved) ? 'green' : 'blue'} size="small">
                          {parseFloat(item.hours || item.workHours || 0)} ชม.
                        </Tag>
                      </div>                      
                      <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                        {item.title || item.logTitle || 'ไม่มีหัวข้อ'}
                      </div>
                      {(item.description || item.taskDesc || item.taskDetails) && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', maxHeight: '36px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {item.description || item.taskDesc || item.taskDetails}
                        </div>
                      )}
                    </div>
                  </List.Item>
                )}
              />
              {week.entries.length > 3 && (
                <div className="more-entries" style={{ paddingLeft: 8, paddingTop: 4 }}>
                  <span style={{ color: '#8c8c8c' }}>
                    + อีก {week.entries.length - 3} รายการ
                  </span>
                </div>
              )}
            </Card>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
};

/**
 * Component แสดงรายงานสถิติ
 * @param {Object} props
 * @param {Array} props.logEntries รายการบันทึกการฝึกงาน
 * @param {number} props.totalApprovedHours จำนวนชั่วโมงที่ได้รับการอนุมัติ
 */
const StatsOverview = ({ logEntries, totalApprovedHours }) => {
  return (
    <Row gutter={[16, 16]} className="stats-row">
      <Col xs={24} sm={12} lg={6}>
        <Card className="stat-card" bordered={false}>
          <Statistic 
            title="วันทำงานทั้งหมด" 
            value={logEntries.length} 
            suffix="วัน"
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
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export { WeeklyOverview, StatsOverview };
