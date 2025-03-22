import React from 'react';
import { Table, Space, Button, Badge, Tooltip } from 'antd';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from '../../../../utils/dayjs';
import { DATE_FORMAT_MEDIUM, DATE_TIME_FORMAT } from '../../../../utils/constants';

// เพิ่มฟังก์ชันเพื่อตรวจสอบว่าวันที่ยังไม่ถึงหรือไม่
const isFutureDate = (date) => {
  const today = dayjs().startOf('day');
  return dayjs(date).isAfter(today);
};

const getEntryStatus = (entry) => {
  if (isFutureDate(entry.workDate)) return "upcoming"; // วันที่ยังไม่ถึง
  if (!entry.timeIn) return "pending";
  if (entry.timeIn && !entry.timeOut) return "incomplete"; // เข้างานแล้วแต่ยังไม่ออก
  if (!entry.workDescription || !entry.logTitle) return "incomplete"; // ข้อมูลไม่ครบ
  if (!entry.supervisorApproved || !entry.advisorApproved) return "submitted";
  return "approved";
};

const renderStatusBadge = (status) => {
  const statusConfig = {
    upcoming: { color: 'default', text: 'วันที่ยังไม่ถึง' },
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
      render: (date) => dayjs(date).format(DATE_FORMAT_MEDIUM),
    },
    {
      title: "หัวข้องาน",
      dataIndex: "logTitle",
      key: "logTitle",
    },
    {
      title: "วันที่ส่ง",
      key: "updatedAt",
      render: (_, record) => {
        const updateTime = record.updatedAt || record.updated_at;
        if (updateTime) {
          return dayjs(updateTime).format(DATE_TIME_FORMAT);
        } 
        return "-";
      },
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
      render: (_, record) => {
        const isDateInFuture = isFutureDate(record.workDate);
        
        return (
          <Space>
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              onClick={() => onView(record)} 
            />
            <Tooltip 
              title={isDateInFuture ? "ไม่สามารถบันทึกข้อมูลล่วงหน้าได้" : ""} 
            >
              <Button 
                type="link" 
                icon={<EditOutlined />} 
                onClick={() => onEdit(record)}
                disabled={isDateInFuture}
                style={isDateInFuture ? { color: '#ccc', cursor: 'not-allowed' } : {}}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={data} 
      loading={loading} 
      pagination={{
        pageSize: 10,  // แสดง 10 วันต่อหน้า
        showSizeChanger: false,  // ซ่อนตัวเลือกเปลี่ยนจำนวนรายการต่อหน้า
        position: ['bottomCenter'],  // ตำแหน่งของ pagination
        showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} วัน`,
        locale: { // คำแปลภาษาไทย
          prev_page: 'หน้าก่อนหน้า',
          next_page: 'หน้าถัดไป',
          jump_to: 'ไปที่หน้า',
          jump_to_confirm: 'ยืนยัน'
        }
      }} 
    />
  );
};

export default TimeSheetTable;