import React from 'react';
import { Table, Space, Button, Badge } from 'antd';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const getEntryStatus = (entry) => {
  if (!entry.workDescription) return "pending";
  if (!entry.workHours) return "incomplete";
  if (!entry.supervisorApproved || !entry.advisorApproved) return "submitted";
  return "approved";
};

const renderStatusBadge = (status) => {
  const statusConfig = {
    pending: { color: 'default', text: 'รอดำเนินการ' },
    incomplete: { color: 'warning', text: 'ไม่สมบูรณ์' },
    submitted: { color: 'processing', text: 'รอตรวจสอบ' },
    approved: { color: 'success', text: 'อนุมัติแล้ว' }
  };

  const config = statusConfig[status] || statusConfig.pending;
  return <Badge status={config.color} text={config.text} />;
};

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