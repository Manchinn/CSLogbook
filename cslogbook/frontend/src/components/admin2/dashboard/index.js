import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Spin, Space, Button, Alert, Badge } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UploadOutlined, FileTextOutlined } from '@ant-design/icons';
import { adminService } from '../../../services/adminService';
import StatCards from './StatCards';
import ActivityLog from './ActivityLog';
import moment from 'moment';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: {
      total: 0,
      internshipEligible: 0, 
      projectEligible: 0
    },
    documents: {
      total: 0,
      pending: 0
    },
    system: {
      onlineUsers: 0,
      lastUpdate: new Date()
    }
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spin size="large" tip="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        message="ภาพรวมระบบ"
        type="info"
        showIcon
      />
      
      <StatCards stats={stats} loading={loading} />
      
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Button 
            type="primary" 
            icon={<UploadOutlined />}
            onClick={() => navigate('/admin/upload')}
            block
          >
            อัปโหลดข้อมูลนักศึกษา (CSV)
          </Button>
        </Col>
        <Col xs={24} md={12}>
          <Button 
            type="default"
            icon={<FileTextOutlined />}
            onClick={() => navigate('/admin/documents/internship')}
            block
          >
            จัดการเอกสาร
            {stats.documents.pending > 0 && (
              <Badge 
                count={stats.documents.pending} 
                style={{ marginLeft: 8 }}
              />
            )}
          </Button>
        </Col>
      </Row>
      
      <ActivityLog />
    </Space>
  );
};

export default Dashboard;