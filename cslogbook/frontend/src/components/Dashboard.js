import React from 'react';
import { Layout, Menu, Avatar, Typography, Card } from 'antd';
import {
  HomeOutlined,
  BookOutlined,
  FileTextOutlined,
  TeamOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const Dashboard = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider width={250} style={{ backgroundColor: '#fff' }}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Avatar size={80} src="https://via.placeholder.com/80" />
          <Title level={4} style={{ marginTop: 10 }}>Chinnakrit Sripan</Title>
        </div>
        <Menu mode="inline" defaultSelectedKeys={['1']} style={{ borderRight: 0 }}>
          <Menu.Item key="1" icon={<HomeOutlined />}>
            หน้าแรก
          </Menu.Item>
          <Menu.SubMenu key="sub1" icon={<BookOutlined />} title="แผนการเรียน">
            <Menu.Item key="2">แผนการเรียน</Menu.Item>
          </Menu.SubMenu>
          <Menu.SubMenu key="sub2" icon={<FileTextOutlined />} title="ข้อมูลฝึกการศึกษา">
            <Menu.Item key="3">ข้อมูลฝึกการศึกษา</Menu.Item>
          </Menu.SubMenu>
          <Menu.Item key="4" icon={<TeamOutlined />}>
            ประวัตินักศึกษา
          </Menu.Item>
          <Menu.Item key="5" icon={<FileTextOutlined />}>
            แผนพัฒนาตน
          </Menu.Item>
          <Menu.Item key="6" icon={<LogoutOutlined />} style={{ color: 'red' }}>
            Log out
          </Menu.Item>
        </Menu>
      </Sider>

      {/* Content */}
      <Layout>
        <Header style={{ backgroundColor: '#f0f4ff', padding: 0, textAlign: 'center' }}>
          <Title level={3} style={{ margin: 0, padding: '20px' }}>
            CS Logbook ติดตามแผนการเรียนและฝึกงานสำหรับนักศึกษา
          </Title>
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <Card style={{ backgroundColor: '#e6f7ff', padding: '24px', borderRadius: '8px' }}>
            <Title level={4}>ภาพรวม</Title>
            <Text>
              ยินดีต้อนรับสู่เว็บไซต์ติดตามการศึกษาและแผนการเรียนของเรา เว็บไซต์นี้ถูกออกแบบมาเพื่อช่วยให้นักศึกษาสามารถจัดการการศึกษาและการฝึกงานของตนได้อย่างมีประสิทธิภาพ
            </Text>
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
