import React from 'react';
import { Card, Table, Button, Tooltip, Tag } from 'antd';
import { FileProtectOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// นำเข้า CSS Module
import styles from '../Summary.module.css';

/**
 * Component แสดงตารางบันทึกการฝึกงาน
 * @param {Object} props
 * @param {Array} props.logEntries รายการบันทึกการฝึกงาน
 * @param {number} props.totalApprovedHours จำนวนชั่วโมงที่ได้รับการอนุมัติ
 */
const LogbookTable = ({ logEntries, totalApprovedHours }) => {
  const navigate = useNavigate();
  
  const columns = [
    {
      title: 'วันที่',
      key: 'dateInfo',
      width: 150,
      render: (text, record) => (
        <span>
          <div><strong>{record.dayName}</strong></div>
          <div>{record.date}</div>
        </span>
      )
    },
    {
      title: 'เวลาทำงาน',
      key: 'time',
      width: 150,
      render: (_, record) => (
        <span>
          <div>{record.timeIn} - {record.timeOut}</div>
          <div>
            {/* Adjust tag color based on status: green for approved, red for rejected, blue for pending */}
            <Tag 
              color={
                record.status === 'approved' ? 'green' : 
                record.status === 'rejected' ? 'red' : 'blue'
              }
            >
              {record.hours} ชม.
            </Tag>
          </div>
        </span>
      )
    },    {
      title: 'หัวข้อและรายละเอียด',
      dataIndex: 'title',
      key: 'title',
      ellipsis: { showTitle: false },
      render: (title, record) => (
        <div>          <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#1890ff' }}>
            <Tooltip placement="topLeft" title={title || 'ไม่มีหัวข้อ'}>
              {title || 'ไม่มีหัวข้อ'}
            </Tooltip>
          </div>
          {record.description && (
            <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
              <Tooltip placement="topLeft" title={record.description}>
                {record.description.length > 150 
                  ? `${record.description.substring(0, 150)}...` 
                  : record.description}
              </Tooltip>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        let color = 'gold'; // Default for pending (0)
        let text = 'รอการอนุมัติ';
        let icon = <ClockCircleOutlined />;

        if (status === 'approved') { // Status for 1
          color = 'green';
          text = 'อนุมัติแล้ว';
          icon = <CheckCircleOutlined />;
        } else if (status === 'rejected') { // Status for -1
          color = 'red';
          text = 'ปฏิเสธ';
          // Assuming CloseCircleOutlined is available or will be added
          // import { CloseCircleOutlined } from '@ant-design/icons'; 
          // icon = <CloseCircleOutlined />;
          // If not, ClockCircleOutlined or another icon can be used, or no icon for rejected
        }

        return (
          <Tag color={color} icon={icon}>
            {text}
          </Tag>
        );
      },
    }
  ];
  
  return (
    <Card 
      className={styles.logbookCard}
      variant="borderless"
      title={<>
        <FileProtectOutlined /> บันทึกการทำงาน
      </>}
      extra={
        <Button 
          type="primary" 
          onClick={() => navigate('/internship-logbook/timesheet')}
        >
          จัดการบันทึกประจำวัน
        </Button>
      }
    >      <Table 
        columns={columns}
        dataSource={logEntries}
        pagination={{ 
          pageSize: 10, 
          showSizeChanger: true, 
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `ทั้งหมด ${total} รายการ` 
        }}
        rowKey={(record) => record.key || record.id || record.logId || record.workDate}
        rowClassName={(record) => {
          if (record.status === 'approved') return 'approved-row';
          if (record.status === 'rejected') return 'rejected-row';
          return '';
        }}
        locale={{ emptyText: 'ยังไม่มีข้อมูลการบันทึกเวลา' }}
      />
    </Card>
  );
};

export default LogbookTable;
