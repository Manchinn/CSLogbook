// Content.js
import React from 'react';
import { Layout, Typography, Card } from 'antd';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const DashboardContent = () => {
  return (
    <Layout>
      <Content style={{ margin: '24px 16px 0' }}>
        <Card style={{ backgroundColor: '#e6f7ff', padding: '24px', borderRadius: '8px' }}>
          <Title level={4}>ภาพรวม</Title>
          <Text>
            ยินดีต้อนรับสู่เว็บไซต์ติดตามการศึกษาและแผนการเรียนของเรา เว็บไซต์นี้ถูกออกแบบมาเพื่อช่วยให้นักศึกษาสามารถจัดการการศึกษาและการฝึกงานของตนได้อย่างมีประสิทธิภาพ
          </Text>
        </Card>
      </Content>
    </Layout>
  );
};

export default DashboardContent;
