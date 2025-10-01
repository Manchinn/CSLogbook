import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { UserOutlined, FileTextOutlined, BookOutlined, ProjectOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const StatCards = ({ stats, loading }) => {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'นักศึกษาทั้งหมด',
      value: stats?.students?.total || 0,
      icon: <UserOutlined />,
      color: '#1890ff',
      onClick: () => navigate('/admin/users/students')
    },
    {
      title: 'มีสิทธิ์ฝึกงาน',
      value: stats?.students?.internshipEligible || 0,
      icon: <BookOutlined />,
      color: '#52c41a',
      onClick: () => navigate('/admin/users/students?filter=internship')
    },
    {
      title: 'มีสิทธิ์ทำโครงงานพิเศษ', 
      value: stats?.students?.projectEligible || 0,
      icon: <ProjectOutlined />,
      color: '#722ed1',
      onClick: () => navigate('/admin/users/students?filter=project')
    },
    {
      title: 'เอกสารรอดำเนินการ',
      value: stats?.documents?.pending || 0,
      icon: <FileTextOutlined />,
      color: '#faad14',
      suffix: ` / ${stats?.documents?.total || 0}`,
      onClick: () => navigate('/admin/documents/internship')
    }
  ];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card, index) => (
        <Col xs={24} sm={12} md={6} key={index}>
          <Card 
            hoverable 
            onClick={card.onClick}
            style={{ height: '100%' }}
          >
            <Statistic
              title={card.title}
              value={card.value}
              prefix={card.icon}
              valueStyle={{ color: card.color }}
              suffix={card.suffix}
              loading={loading}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default StatCards;