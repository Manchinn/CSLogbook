import React, { useCallback } from 'react';
import { Table, Space, Button, Badge, Tooltip, Tag, Typography } from 'antd';
import { EditOutlined, EyeOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from '../../../../utils/dayjs';
import { DATE_FORMAT_MEDIUM, DATE_TIME_FORMAT, TIME_FORMAT } from '../../../../utils/constants';

const { Text } = Typography;

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
  if (entry.logId && !entry.supervisorApproved) return "submitted";
  if (entry.logId && entry.supervisorApproved) return "approved";
  return "incomplete"; // ถ้ามีข้อมูลแต่ไม่เข้าเงื่อนไขข้างบน
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
  // เตรียมข้อมูลสำหรับแสดงในตาราง
  const prepareTableData = useCallback(() => {
    if (!data) return [];
    
    return data.map(entry => ({
      ...entry,
      key: entry.key || entry.logId || `timesheet-${entry.workDate.format('YYYY-MM-DD')}`
    }));
  }, [data]);
  
  const tableData = prepareTableData();

  const columns = [
    {
      title: "วันที่",
      dataIndex: "workDate",
      key: "workDate",
      render: (date) => {
        try {
          return dayjs(date).format(DATE_FORMAT_MEDIUM);
        } catch (e) {
          return String(date);
        }
      },
    },
    {
      title: "เวลาทำงาน",
      key: "workTime",
      width: 160,
      render: (_, record) => {
        if (!record.timeIn) return '-';
        
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text><ClockCircleOutlined /> เข้า: {record.timeIn ? dayjs(record.timeIn).format(TIME_FORMAT) : '-'}</Text>
            <Text>{record.timeOut ? `ออก: ${dayjs(record.timeOut).format(TIME_FORMAT)}` : 'ยังไม่บันทึกเวลาออก'}</Text>
          </Space>
        );
      },
    },
    {
      title: "หัวข้อและรายละเอียด",
      key: "details",
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text strong>{record.logTitle || '-'}</Text>
          {record.workHours > 0 && <Text type="secondary">{record.workHours} ชั่วโมง</Text>}
          {record.workDescription && (
            <Text type="secondary" ellipsis={{ tooltip: record.workDescription }}>
              {record.workDescription.length > 50 
                ? `${record.workDescription.substring(0, 50)}...` 
                : record.workDescription}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "การอนุมัติ",
      key: "approvals",
      width: 130,
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Tag color={record.supervisorApproved ? "success" : "default"} style={{ margin: '2px 0' }}>
            {record.supervisorApproved 
              ? <><CheckCircleOutlined /> หัวหน้างาน</>
              : <><CloseCircleOutlined /> รออนุมัติ</>
            }
          </Tag>
        </Space>
      ),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 120,
      render: (_, record) => {
        const status = getEntryStatus(record);
        return renderStatusBadge(status);
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
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
    <div style={{ width: '100%', overflow: 'auto' }}>
      <Table 
        columns={columns} 
        dataSource={tableData}
        loading={loading}
        rowKey={record => record.key}
        style={{ minWidth: '800px' }} 
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          position: ['bottomCenter'],
          showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} วัน`,
          locale: {
            prev_page: 'หน้าก่อนหน้า',
            next_page: 'หน้าถัดไป',
            jump_to: 'ไปที่หน้า',
            jump_to_confirm: 'ยืนยัน'
          }
        }} 
      />
    </div>
  );
};

export default TimeSheetTable;