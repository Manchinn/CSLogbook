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

const API_URL = process.env.REACT_APP_API_URL;

if (!API_URL) {
  throw new Error('REACT_APP_API_URL is not defined in environment variables');
}

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
    title: 'นักศึกษาคนที่ 1',
    children: [
      {
        title: 'รหัสนักศึกษา',
        dataIndex: ['student1', 'studentCode'],
        key: 'student1_code',
        sorter: (a, b) => a.student1?.studentCode.localeCompare(b.student1?.studentCode),
        sortOrder: sortedInfo.columnKey === 'student1_code' && sortedInfo.order,
      },
      {
        title: 'ชื่อ-นามสกุล',
        key: 'student1_name',
        render: (_, record) => (
          `${record.student1?.firstName || '-'} ${record.student1?.lastName || '-'}`
        ),
        sorter: (a, b) => {
          const aName = `${a.student1?.firstName} ${a.student1?.lastName}`;
          const bName = `${b.student1?.firstName} ${b.student1?.lastName}`;
          return aName.localeCompare(bName);
        },
      }
    ]
  },
  {
    title: 'นักศึกษาคนที่ 2',
    children: [
      {
        title: 'รหัสนักศึกษา',
        dataIndex: ['student2', 'studentCode'],
        key: 'student2_code',
        render: (text) => text || '-',
        sorter: (a, b) => {
          const aCode = a.student2?.studentCode || '';
          const bCode = b.student2?.studentCode || '';
          return aCode.localeCompare(bCode);
        },
      },
      {
        title: 'ชื่อ-นามสกุล',
        key: 'student2_name',
        render: (_, record) => (
          record.student2 ? 
          `${record.student2.firstName} ${record.student2.lastName}` : 
          '-'
        ),
        sorter: (a, b) => {
          const aName = a.student2 ? `${a.student2.firstName} ${a.student2.lastName}` : '';
          const bName = b.student2 ? `${b.student2.firstName} ${b.student2.lastName}` : '';
          return aName.localeCompare(bName);
        },
      }
    ]
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

const ProjectMembersList = () => {
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortedInfo, setSortedInfo] = useState({ columnKey: null, order: null });
  const [currentSummary, setCurrentSummary] = useState({ total: 0 });

  const fetchProjectMembers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // เปลี่ยน endpoint
      const response = await axios.get(`${API_URL}/project-members`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (Array.isArray(response.data)) {
        setProjectMembers(response.data);
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
    fetchProjectMembers();
    const interval = setInterval(fetchProjectMembers, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchProjectMembers]);

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
  const filteredProjectMembers = React.useMemo(() => {
    return Array.isArray(projectMembers) ? projectMembers.filter(member => {
      const searchFields = [
        member.project_name,
        member.student1?.studentCode,
        member.student1?.firstName,
        member.student1?.lastName,
        member.student2?.studentCode,
        member.student2?.firstName,
        member.student2?.lastName
      ];
      
      return searchFields.some(field => 
        field?.toString().toLowerCase().includes(searchText.toLowerCase())
      );
    }) : [];
  }, [projectMembers, searchText]);

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
              onClick={fetchProjectMembers}
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
        dataSource={filteredProjectMembers}
        rowKey={(record) => `${record.student1?.userId}-${record.student2?.userId}`}
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

export default ProjectMembersList;