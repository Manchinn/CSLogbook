import React from 'react';
import { Table, Space, Button, Badge } from 'antd';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const TimeSheetTable = ({ data, loading, onEdit, onView }) => {
  const columns = [
    {
      title: "วันที่",
      dataIndex: "workDate",
      key: "workDate",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "หัวข้องาน",
      dataIndex: "logTitle",
      key: "logTitle",
    },
    {
      title: "จำนวนชั่วโมง",
      dataIndex: "workHours",
      key: "workHours",
    },
    {
      title: "สถานะ",
      key: "status",
      render: (_, record) => {
        const status = getEntryStatus(record);
        return renderStatusBadge(status);
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => onView(record)} />
          <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)} />
        </Space>
      ),
    },
  ];

  return <Table columns={columns} dataSource={data} loading={loading} pagination={false} />;
};

export default TimeSheetTable;