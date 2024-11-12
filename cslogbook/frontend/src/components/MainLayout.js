// src/components/MainLayout.js
import React from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import HeaderComponent from './HeaderComponent';
import { Outlet } from 'react-router-dom';

const { Content } = Layout;

const MainLayout = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar /> {/* Sidebar จะแสดงอยู่ทุกหน้า */}
      <Layout>
        <HeaderComponent />
        <Content style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
          <Outlet /> {/* ใช้ Outlet สำหรับแสดงเนื้อหาของหน้าต่างๆ */}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
