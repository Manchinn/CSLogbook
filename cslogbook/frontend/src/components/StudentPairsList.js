import React, { useState, useEffect, useCallback } from 'react';
import { Table, Input, Space, Button, message, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, ProjectOutlined } from '@ant-design/icons';
import axios from 'axios';
import './StudentList.css';

// Constants
const AUTO_REFRESH_INTERVAL = 300000; // 5 minutes
const TABLE_SCROLL = { x: 1200, y: 'calc(100vh - 350px)' };
const TABLE_PAGINATION = {
  showSizeChanger: true,
  defaultPageSize: 10,
  pageSizeOptions: ['10', '20', '50']
};

// Table Columns Configuration
const getColumns = (sortedInfo) => [
  {
    title: 'โครงงานพิเศษ',
    dataIndex: 'project_name',
    key: 'project_name',
    sorter: (a, b) => (a.project_name || '').localeCompare(b.project_name || ''),
    sortOrder: sortedInfo.columnKey === 'project_name' && sortedInfo.order,
    render: (text) => text || '-',
    width: '25%'
  },
  {
    title: 'รหัสนักศึกษา',
    dataIndex: 'student_id1',
    key: 'student_id1',
    sorter: (a, b) => a.student_id1.localeCompare(b.student_id1),
    sortOrder: sortedInfo.columnKey === 'student_id1' && sortedInfo.order,
  },
  {
    title: 'ชื่อ',
    dataIndex: 'first_name1',
    key: 'first_name1',
    sorter: (a, b) => a.first_name1.localeCompare(b.first_name1),
    sortOrder: sortedInfo.columnKey === 'first_name1' && sortedInfo.order,
  },
  {
    title: 'นามสกุล',
    dataIndex: 'last_name1',
    key: 'last_name1',
    sorter: (a, b) => a.last_name1.localeCompare(b.last_name1),
    sortOrder: sortedInfo.columnKey === 'last_name1' && sortedInfo.order,
  },
  {
    title: 'รหัสนักศึกษา',
    dataIndex: 'student_id2',
    key: 'student_id2',
    sorter: (a, b) => a.student_id2.localeCompare(b.student_id2),
    sortOrder: sortedInfo.columnKey === 'student_id2' && sortedInfo.order,
  },
  {
    title: 'ชื่อ',
    dataIndex: 'first_name2',
    key: 'first_name2',
    sorter: (a, b) => a.first_name2.localeCompare(b.first_name2),
    sortOrder: sortedInfo.columnKey === 'first_name2' && sortedInfo.order,
  },
  {
    title: 'นามสกุล',
    dataIndex: 'last_name2',
    key: 'last_name2',
    sorter: (a, b) => a.last_name2.localeCompare(b.last_name2),
    sortOrder: sortedInfo.columnKey === 'last_name2' && sortedInfo.order,
  },
  {
    title: 'วันที่',
    dataIndex: 'created_at',
    key: 'created_at',
    render: (text) => text || '-',
    width: '200px',
    sorter: (a, b) => (a.created_at || '').localeCompare(b.created_at || ''),
    sortOrder: sortedInfo.columnKey === 'created_at' && sortedInfo.order,
  }
];

const StudentPairsList = () => {
  const [projectPairs, setProjectPairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortedInfo, setSortedInfo] = useState({ columnKey: null, order: null });
  const [currentSummary, setCurrentSummary] = useState({ total: 0 });

  const fetchProjectPairs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('กรุณาเข้าสู่ระบบ');
        return;
      }

      const response = await axios.get('/api/project-pairs', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (Array.isArray(response.data)) {
        setProjectPairs(response.data);
        setCurrentSummary({ total: response.data.length });
      }
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup initial data fetch and auto-refresh
  useEffect(() => {
    fetchProjectPairs();
    const interval = setInterval(fetchProjectPairs, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchProjectPairs]);

  // Handle error logging
  useEffect(() => {
    const handleError = (error) => {
      console.error('Error in StudentPairsList:', error);
      message.error('เกิดข้อผิดพลาดในการแสดงผล');
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const handleTableChange = (pagination, filters, sorter) => {
    setSortedInfo(sorter);
  };

  // Memoized filtered data
  const filteredProjectPairs = React.useMemo(() => {
    return Array.isArray(projectPairs) ? projectPairs.filter(pair =>
      [
        pair.project_name,
        pair.student_id1,
        pair.first_name1,
        pair.last_name1,
        pair.student_id2,
        pair.first_name2,
        pair.last_name2
      ].some(field => field?.toLowerCase().includes(searchText.toLowerCase()))
    ) : [];
  }, [projectPairs, searchText]);

  // Memoized columns
  const columns = React.useMemo(() => getColumns(sortedInfo), [sortedInfo]);

  return (
    <div className="container-studentlist">
      <Row justify="space-between" align="middle">
        <Col flex="auto">
          <Space style={{ fontSize: '14px' }}>
            <ProjectOutlined />
            <span>{currentSummary.total} โครงงานพิเศษ</span>
          </Space>
        </Col>
        <Col flex="none">
          <Space size={16}>
            <Input
              placeholder="ค้นหาด้วยชื่อโครงงาน, รหัสนักศึกษา หรือชื่อ"
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 300, borderRadius: '6px' }}
            />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchProjectPairs}
              loading={loading}
              style={{ borderRadius: '6px' }}
            >
              รีเฟรชข้อมูล
            </Button>
          </Space>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={filteredProjectPairs}
        rowKey={(record, index) => `${record.student_id1}-${record.student_id2}-${index}`}
        loading={loading}
        size="middle"
        onChange={handleTableChange}
        scroll={TABLE_SCROLL}
        pagination={{
          ...TABLE_PAGINATION,
          showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`,
        }}
        locale={{ emptyText: 'ไม่พบข้อมูล' }}
      />
    </div>
  );
};

export default StudentPairsList;