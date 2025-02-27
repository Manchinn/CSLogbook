import React, { useState, useEffect, useCallback } from 'react';
import { Table, Input, Space, Typography, Button, message, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, ProjectOutlined } from '@ant-design/icons';
import axios from 'axios';
import './StudentList.css';

const { Title } = Typography;

const StudentPairsList = () => {
  const [projectPairs, setProjectPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [sortedInfo, setSortedInfo] = useState({});
  const [currentSummary, setCurrentSummary] = useState({ total: 0 }); // กำหนดค่า currentSummary

  const fetchProjectPairs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token'); // ดึงโทเค็นจาก localStorage
      const response = await axios.get('http://localhost:5000/api/project-pairs', {
        headers: {
          Authorization: `Bearer ${token}` // ส่งโทเค็นใน header
        }
      });
      if (Array.isArray(response.data)) {
        setProjectPairs(response.data);
        setCurrentSummary({ total: response.data.length }); // อัปเดต currentSummary
      } else {
        throw new Error('Data is not an array');
      }
    } catch (error) {
      console.error('Error fetching project pairs:', error);
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูลคู่โปรเจค');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectPairs();
  }, [fetchProjectPairs]);

  const handleTableChange = (pagination, filters, sorter) => {
    setSortedInfo(sorter);
  };

  const filteredProjectPairs = Array.isArray(projectPairs) ? projectPairs.filter(pair =>
    pair.project_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    pair.student_id1?.toLowerCase().includes(searchText.toLowerCase()) ||
    pair.first_name1?.toLowerCase().includes(searchText.toLowerCase()) ||
    pair.last_name1?.toLowerCase().includes(searchText.toLowerCase()) ||
    pair.student_id2?.toLowerCase().includes(searchText.toLowerCase()) ||
    pair.first_name2?.toLowerCase().includes(searchText.toLowerCase()) ||
    pair.last_name2?.toLowerCase().includes(searchText.toLowerCase())
  ) : [];

  const columns = [
    {
      title: 'โครงงานพิเศษ',
      dataIndex: 'project_name',
      key: 'project_name',
      sorter: (a, b) => a.project_name.localeCompare(b.project_name),
      sortOrder: sortedInfo.columnKey === 'project_name' && sortedInfo.order,
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
  ];

  return (
    <div className="container-studentlist">
      <Row justify="space-between" align="middle">
        <Col flex="auto">
          <Row gutter={40} align="middle">
            <Col>
              <Space style={{ fontSize: '14px' }}>
                <ProjectOutlined />
                <span>{currentSummary.total} โครงงานพิเศษ</span>
              </Space>
            </Col>
          </Row>
        </Col>
        <Col flex="none">
          <Space size={16}>
            <Input
              placeholder="ค้นหาด้วยชื่อโครงงาน, รหัสนักศึกษา หรือชื่อ"
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{
                width: 300,
                borderRadius: '6px'
              }}
            />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchProjectPairs} // ใช้ fetchProjectPairs แทน
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
        rowKey={(record, index) => `${record.student_id1}-${record.student_id2}-${index}`} // สร้าง key ที่ไม่ซ้ำกันสำหรับแต่ละรายการ
        loading={loading}
        size="middle"
        onChange={handleTableChange}
        scroll={{
          x: 1000,
          y: 'calc(100vh - 350px)'
        }}
        sortDirections={['ascend', 'descend', 'ascend']}
      />
    </div>
  );
};

export default StudentPairsList;