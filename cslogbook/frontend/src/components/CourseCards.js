import React from 'react';
import { Card, Col, Row, Typography, Layout } from 'antd';
import {
  DatabaseOutlined,
  CodeOutlined,
  
  RobotOutlined,
  LaptopOutlined,
  SecurityScanOutlined,
} from '@ant-design/icons';

const { Title } = Typography;
const { Content } = Layout;

const data = [
  {
    title: 'Smart Technology',
    icon: <DatabaseOutlined style={{ fontSize: '32px', color: '#4CAF50' }} />,
    subjects: ['Computer Programming I', 'Database System', 'Digital Circuit'],
  },
  {
    title: 'Multimedia & Games',
    icon: <CodeOutlined style={{ fontSize: '32px', color: '#9C27B0' }} />,
    subjects: ['Computer Programming I', 'Mathematics for Computing'],
  },
  {
    title: 'AI Engineer',
    icon: <RobotOutlined style={{ fontSize: '32px', color: '#3F51B5' }} />,
    subjects: ['Intelligence System', 'Machine Learning'],
  },
  {
    title: 'Full-stack Developer',
    icon: <LaptopOutlined style={{ fontSize: '32px', color: '#FF5722' }} />,
    subjects: ['Computer Programming I', 'Object-oriented Programming', 'Web Development'],
  },
  {
    title: 'Security',
    icon: <SecurityScanOutlined style={{ fontSize: '32px', color: '#4CAF50' }} />,
    subjects: ['Structure Programming', 'Computer Network'],
  },

];

const CourseCards = () => {
  return (
    <Content
      style={{
        margin: '1rem 1rem',
        padding:'20px',
        minHeight: 280,
        background: '#ffffff',
        borderRadius: '16px',
      }}
    >
      <Title level={3} style={{ margin: 0, padding: '1rem' }}>
          แผนการแต่ละสาย
        </Title>
      <Row gutter={[24, 24]} justify="start">
        {data.map((item, index) => (
          <Col xs={24} sm={24} md={8} lg={8} key={index}>
            <Card
              bordered
              style={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: '10px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ marginRight: '16px' }}>{item.icon}</div>
              <div>
                <h3 style={{ margin: 0 }}>{item.title}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {item.subjects.map((subject, i) => (
                    <li key={i}>{subject}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Content>
  );
};

export default CourseCards;
