import React from 'react';
import { Layout, Typography, Table, Tag, Input, Select, Row, Col } from 'antd';

const { Header, Content } = Layout;
const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const columns = [
  {
    title: 'รหัสวิชา',
    dataIndex: 'code',
    key: 'code',
  },
  {
    title: 'ชื่อวิชา',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'หน่วยกิต',
    dataIndex: 'credits',
    key: 'credits',
  },
  {
    title: 'ชั้นปี / เทอม',
    dataIndex: 'yearTerm',
    key: 'yearTerm',
  },
  {
    title: 'สาขาการเรียน',
    dataIndex: 'tags',
    key: 'tags',
    render: (tags) => (
      <>
        {tags.map((tag) => (
          <Tag color={getColor(tag)} key={tag}>
            {tag.toUpperCase()}
          </Tag>
        ))}
      </>
    ),
  },
];

const data = [
  {
    key: '1',
    code: '040263101',
    name: 'Mathematics I',
    credits: '3(3-0-6)',
    yearTerm: '1/1',
    tags: ['basic'],
  },
  {
    key: '2',
    code: '040613100',
    name: 'Fundamental of Computer Science and Professional Issues',
    credits: '3(3-0-6)',
    yearTerm: '1/1',
    tags: ['basic'],
  },
  {
    key: '3',
    code: '040613103',
    name: 'Discrete Mathematics for Computer Science',
    credits: '3(3-0-6)',
    yearTerm: '1/1',
    tags: ['basic'],
  },
  {
    key: '4',
    code: '040613201',
    name: 'Computer Programming I',
    credits: '3(2-2-5)',
    yearTerm: '1/1',
    tags: ['basic', 'Game', 'IOT', 'Fullstack', 'AI'],
  },
  {
    key: '5',
    code: '040xxxxx',
    name: 'Science and Mathematics Elective Course',
    credits: '3(x-x-x)',
    yearTerm: '1/1',
    tags: ['basic'],
  },
  {
    key: '6',
    code: '0802xxxxx',
    name: 'Social Sciences Elective Course',
    credits: '3(x-x-x)',
    yearTerm: '1/1',
    tags: ['basic'],
  },
  {
    key: '7',
    code: '040503011',
    name: 'Statistics for Engineers and Scientists',
    credits: '3(3-0-6)',
    yearTerm: '1/2',
    tags: ['basic'],
  },
  {
    key: '8',
    code: '040613104',
    name: 'Mathematics for Computing',
    credits: '3(3-0-6)',
    yearTerm: '1/2',
    tags: ['Game'],
  },
  {
    key: '9',
    code: '040613203',
    name: 'Structured Programming',
    credits: '3(2-2-5)',
    yearTerm: '1/2',
    tags: ['basic', 'security'],
  },
  {
    key: '10',
    code: '040613301',
    name: 'Database System',
    credits: '3(2-2-5)',
    yearTerm: '1/2',
    tags: ['basic', 'IOT'],
  },
  {
    key: '11',
    code: '040613303',
    name: 'Human Computer Interaction',
    credits: '3(3-0-6)',
    yearTerm: '1/2',
    tags: ['basic'],
  },
  {
    key: '12',
    code: '040613501',
    name: 'Computer Organization and Operating System',
    credits: '3(3-0-6)',
    yearTerm: '1/2',
    tags: ['basic'],
  },
  {
    key: '13',
    code: '040614101',
    name: 'Data Structures and Algorithms',
    credits: '3(3-0-6)',
    yearTerm: '2/1',
    tags: ['basic', 'AI', 'Fullstack'],
  },
  {
    key: '14',
    code: '040614102',
    name: 'Object-Oriented Programming',
    credits: '3(3-0-6)',
    yearTerm: '2/1',
    tags: ['basic', 'Game', 'Fullstack'],
  },
  {
    key: '15',
    code: '040614103',
    name: 'Network and Security',
    credits: '3(3-0-6)',
    yearTerm: '2/1',
    tags: ['security', 'IOT'],
  },
  {
    key: '16',
    code: '040614104',
    name: 'Artificial Intelligence Basics',
    credits: '3(3-0-6)',
    yearTerm: '2/1',
    tags: ['AI'],
  },
  {
    key: '17',
    code: '040614105',
    name: 'Web Development Fundamentals',
    credits: '3(3-0-6)',
    yearTerm: '2/1',
    tags: ['Fullstack'],
  },
];

const getColor = (tag) => {
  switch (tag) {
    case 'basic':
      return 'blue';
    case 'Game':
      return 'purple';
    case 'IOT':
      return 'green';
    case 'security':
      return 'red';
    case 'AI':
      return 'magenta';
    case 'Fullstack':
      return 'cyan';
    default:
      return 'gray';
  }
};

const Yearlystudy = () => {
  return (
    <Layout>
      <Header style={{ backgroundColor: '#f0f4ff', padding: 0, textAlign: 'center' }}>
        <Title level={3} style={{ margin: 0, padding: '20px' }}>
          แผนการเรียนรายปี
        </Title>
      </Header>
      <Content style={{ margin: '2rem 2rem' }}>
        {/* Filter Row */}
        <Row gutter={[16, 16]} style={{ marginBottom: '1rem' }}>
          <Col xs={24} sm={12} md={6}>
            <Search placeholder="ค้นหา (รหัสวิชา, ชื่อวิชา)" style={{ width: '100%' }} />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select placeholder="เลือกชั้นปี" style={{ width: '100%' }}>
              <Option value="1">ปี 1</Option>
              <Option value="2">ปี 2</Option>
              <Option value="3">ปี 3</Option>
              <Option value="4">ปี 4</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select placeholder="เลือกสาขาการเรียน" style={{ width: '100%' }}>
              <Option value="basic">Basic</Option>
              <Option value="Game">Game</Option>
              <Option value="IOT">IOT</Option>
              <Option value="AI">AI</Option>
              <Option value="Fullstack">Fullstack</Option>
            </Select>
          </Col>
        </Row>

        {/* Responsive Table with small size */}
        <Table 
          columns={columns} 
          dataSource={data} 
          pagination={{ position: ['bottomCenter'] }} 
          scroll={{ x: 600 }}
          size="small" // Reduce table size
        />
      </Content>
    </Layout>
  );
};

export default Yearlystudy;
