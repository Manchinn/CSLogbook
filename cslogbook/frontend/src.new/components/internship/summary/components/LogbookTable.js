import React from 'react';
import { Table, Tag, Typography, Button, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import '../styles/LogbookTable.css'; // Adjusted import path

const { Text } = Typography;

const LogbookTable = ({ logbookEntries, onOpenViewModal }) => {
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => <Text>{new Date(text).toLocaleDateString()}</Text>,
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: 'Activity/Task',
      dataIndex: 'activity',
      key: 'activity',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: 'Working Hours',
      dataIndex: 'workingHours',
      key: 'workingHours',
      render: (text) => <Text>{text}</Text>,
      sorter: (a, b) => a.workingHours - b.workingHours,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'geekblue';
        if (status === 'Approved') {
          color = 'green';
        } else if (status === 'Rejected') {
          color = 'volcano';
        }
        return (
          <Tag color={color} key={status}>
            {status.toUpperCase()}
          </Tag>
        );
      },
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Approved', value: 'Approved' },
        { text: 'Rejected', value: 'Rejected' },
      ],
      onFilter: (value, record) => record.status.indexOf(value) === 0,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => onOpenViewModal(record)} 
            type="primary" 
            ghost
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="logbook-table-container">
      <Table 
        columns={columns} 
        dataSource={logbookEntries}
        rowKey="id" // Assuming each logbook entry has a unique id
        pagination={{ pageSize: 5 }}
        scroll={{ x: 'max-content' }} // Ensures table is scrollable on smaller screens
        className="logbook-table"
      />
    </div>
  );
};

export default LogbookTable;