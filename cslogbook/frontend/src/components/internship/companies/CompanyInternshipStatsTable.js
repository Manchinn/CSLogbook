import React, { useMemo } from 'react';
import { Table, Tag, Space, Typography } from 'antd';

// ตารางแสดงบริษัท + จำนวนผู้ฝึก + สถานะ capacity
const CompanyInternshipStatsTable = ({ rows = [], meta, loading }) => {
  const columns = useMemo(() => [
    {
      title: 'บริษัท',
      dataIndex: 'companyName',
      key: 'companyName',
      sorter: (a,b) => a.companyName.localeCompare(b.companyName)
    },
    {
      title: 'จำนวนนักศึกษา',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      sorter: (a,b) => a.totalStudents - b.totalStudents,
      render: (val) => <strong>{val}</strong>
    },
    {
      title: 'สถานะ',
      key: 'capacityStatus',
      render: (_, record) => {
        const full = record.capacityStatus === 'full';
        return <Tag color={full ? 'red' : 'green'}>{full ? 'เต็ม' : 'ว่าง'}</Tag>;
      }
    }
  ], []);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Table
        size="small"
        rowKey={(r) => r.companyName}
        dataSource={rows}
        columns={columns}
        loading={loading}
        pagination={false}
      />
      {meta && meta.totalAllCompanies > meta.totalCompanies && (
        <Typography.Text type="secondary">
          แสดง {meta.totalCompanies} บริษัทแรกจากทั้งหมด {meta.totalAllCompanies}
        </Typography.Text>
      )}
    </Space>
  );
};

export default CompanyInternshipStatsTable;
